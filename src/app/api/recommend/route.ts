import { NextResponse } from "next/server";
import type {
  UserAnswers,
  CountryResult,
  CountryPolicy,
  ScoreBreakdown,
  Highlight,
  Risk,
} from "@/types";
import { countries, toUsdMonthly } from "@/data/countries";
import { recommend } from "@/engine/recommend";

/* ================================================================
   Hybrid Architecture:
   1. Hard filter: always local engine (deterministic, no AI errors)
   2. Soft scoring: AI (better nuance & Chinese text quality)
   ================================================================ */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat-v3-0324";

// ────────────── helpers ──────────────

function buildCountrySummary(c: CountryPolicy, user: UserAnswers): string {
  const minMonthlyUsd = toUsdMonthly(c);
  return [
    `country_id: ${c.country_id}`,
    `name: ${c.name}`,
    `visa_name: ${c.visa_name}`,
    `min_income_usd_month: ${minMonthlyUsd}`,
    `allowed_work_types: ${c.allowed_work_types.join(", ")}`,
    `family_allowed: ${c.family_allowed === null ? "未知" : c.family_allowed}`,
    `insurance_required: ${c.insurance_required === null ? "未知" : c.insurance_required}`,
    `path_to_pr: ${c.path_to_pr}, years_to_pr: ${c.years_to_pr ?? "无"}`,
    `max_stay_months: ${c.max_stay_months}, initial_term_months: ${c.initial_term_months}, renewable: ${c.renewable}`,
    `tax: ${c.tax_policy.description}`,
    `cost_of_living: ${c.cost_of_living.level}`,
    `language: ${c.language_env.primary_language}, english: ${c.language_env.english_friendly}`,
    `timezone: ${c.timezone}`,
  ].join("\n");
}

function userProfileToChinese(a: UserAnswers): string {
  const workLabels: Record<string, string> = {
    overseas_remote_employee: "海外公司远程雇员",
    domestic_remote_employee: "国内公司远程雇员",
    freelancer: "自由职业者",
    company_owner: "自有公司",
  };
  const stayLabels: Record<string, string> = {
    "<90d": "小于90天",
    "90-183d": "90-183天",
    ">183d": "超过183天",
    uncertain: "不确定",
  };
  const costLabels: Record<string, string> = {
    low: "越低越好",
    medium: "中等即可",
    insensitive: "不在意",
  };
  const langLabels: Record<string, string> = {
    english_priority: "英语优先",
    can_learn: "可以学当地语言",
  };
  const tzLabels: Record<string, string> = {
    asia: "亚洲时区",
    europe: "欧洲时区",
    any: "无所谓",
  };

  return [
    `国籍: ${a.nationality === "CN" ? "中国" : "其他非EU"}`,
    `配偶随行: ${a.has_spouse ? "是" : "否"}, 子女人数: ${a.num_children}`,
    `计划停留: ${stayLabels[a.planned_stay]}`,
    `工作形态: ${workLabels[a.work_type]}`,
    `税前月收入(USD): ${a.monthly_income_usd}`,
    `收入稳定: ${a.income_stable ? "是" : "否"}`,
    `可提供材料: ${a.docs_available.join("、") || "无"}`,
    `可购买商业保险: ${a.can_buy_insurance ? "是" : "否"}`,
    `接受不得为当地公司/客户工作: ${a.accept_no_local_work ? "是" : "否"}`,
    `希望转永居: ${a.want_long_term ? "是" : "否"}`,
    `生活成本偏好: ${costLabels[a.cost_preference]}`,
    `语言偏好: ${langLabels[a.language_preference]}`,
    `时区偏好: ${tzLabels[a.timezone_preference]}`,
    `网络/基础设施要求: ${a.infra_requirement === "high" ? "高" : "中等"}`,
  ].join("\n");
}

// ────────────── AI response types & parsing ──────────────

interface AIScoreItem {
  country_id: string;
  score: number;
  tier: string;
  breakdown: ScoreBreakdown;
  highlights: Highlight[];
  risks: Risk[];
}

function parseAIResponse(text: string): AIScoreItem[] {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!jsonMatch) throw new Error("AI response did not contain a JSON array");
  const parsed = JSON.parse(jsonMatch[0]) as AIScoreItem[];
  if (!Array.isArray(parsed)) throw new Error("Parsed value is not an array");
  return parsed;
}

// ────────────── merge AI scores with local-filtered results ──────────────

function mergeAIScores(
  localResults: CountryResult[],
  aiScores: AIScoreItem[]
): CountryResult[] {
  const aiById = new Map(aiScores.map((s) => [s.country_id, s]));

  const merged: CountryResult[] = localResults.map((lr) => {
    // Excluded countries: keep local exclusion reasons as-is
    if (lr.status === "EXCLUDED") return lr;

    // Recommended countries: try to use AI scoring
    const ai = aiById.get(lr.country.country_id);
    if (ai) {
      return {
        country: lr.country,
        status: "RECOMMENDED" as const,
        score: ai.score,
        tier: ai.tier,
        breakdown: ai.breakdown,
        highlights: ai.highlights,
        risks: ai.risks,
      };
    }

    // AI didn't return this country — keep local scoring
    return lr;
  });

  // Sort: recommended first (by score desc), then excluded
  merged.sort((a, b) => {
    if (a.status === "EXCLUDED" && b.status !== "EXCLUDED") return 1;
    if (a.status !== "EXCLUDED" && b.status === "EXCLUDED") return -1;
    return (b.score ?? -1) - (a.score ?? -1);
  });

  return merged;
}

// ────────────── main handler ──────────────

export async function POST(request: Request) {
  const key = process.env.OPENROUTER_API_KEY;
  let body: UserAnswers;
  try {
    body = (await request.json()) as UserAnswers;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Step 1: Always run local engine for deterministic hard filtering
  const localResults = recommend(body);

  // If no API key, return local results directly
  if (!key) {
    return NextResponse.json({ results: localResults, fallback: true });
  }

  // Step 2: Separate recommended vs excluded
  const recommended = localResults.filter((r) => r.status === "RECOMMENDED");
  const recommendedIds = recommended.map((r) => r.country.country_id);

  // If everything is excluded, no need to call AI
  if (recommended.length === 0) {
    return NextResponse.json({ results: localResults, fallback: true });
  }

  // Step 3: Build AI prompt — only for recommended countries
  const userProfile = userProfileToChinese(body);
  const recommendedCountries = countries.filter((c) =>
    recommendedIds.includes(c.country_id)
  );
  const countrySummaries = recommendedCountries
    .map((c) => `---\n${buildCountrySummary(c, body)}`)
    .join("\n");

  const idList = recommendedIds.join(", ");

  const systemPrompt = `你是一位数字游民签证与移民政策专家。

以下 ${recommended.length} 个国家已经通过了硬性筛选（收入、工作形态、材料等都满足要求），你的任务是对它们进行评分、排名，并给出亮点与风险。

注意：不要排除任何国家。所有传入的国家都已确认符合基本条件，你只需评分。

请严格按以下 JSON 数组格式输出，不要输出任何其他文字。数组长度为 ${recommended.length}，每个元素对应一个国家：

每个元素格式：
{
  "country_id": "spain",
  "score": 0-100 的整数,
  "tier": "⭐ 强烈推荐" | "👍 值得考虑" | "ℹ️ 可作备选" | "⚠️ 匹配度较低",
  "breakdown": { "feasibility": 0-40, "stability": 0-20, "longterm": 0-15, "tax": 0-15, "lifestyle": 0-10 },
  "highlights": [{"text": "中文亮点", "field": "字段名"}]，最多 3 条,
  "risks": [{"text": "中文风险说明", "field": "字段名", "severity": "high"|"medium"|"low"}]，最多 3 条
}

评分维度说明：
- feasibility (0-40): 收入余量、材料齐全度、工作形态匹配、收入稳定性
- stability (0-20): 最长居留时长、首签期限、是否可续签
- longterm (0-15): 永居路径、永居年限、家属是否共享
- tax (0-15): 税务优惠程度、优惠期限、政策明确性
- lifestyle (0-10): 生活成本匹配、语言环境、时区匹配、基础设施

highlights 的 field 可选值：min_income, tax_policy, max_stay_months, public_education, public_healthcare, cost_of_living, path_to_pr, language_env
risks 的 field 可选值：tax_policy, tax_conditional, path_to_pr, path_to_pr_explicit, insurance_required, insurance_unknown, family_unknown, language_env, public_healthcare, cost_of_living, confidence, last_verified_at, business_owner

所有文案使用中文。score 应等于 breakdown 五个维度之和（可微调 ±3 分）。`;

  const userPrompt = `## 用户画像
${userProfile}

## 待评分国家（共 ${recommended.length} 个：${idList}）
${countrySummaries}

请输出 JSON 数组（仅此数组，无其他内容）：`;

  // Step 4: Call AI for scoring
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://suerte-production.up.railway.app",
        "X-Title": "Suerte",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[recommend] OpenRouter HTTP error:", res.status, errText);
      return NextResponse.json({ results: localResults, fallback: true });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    const content: string | undefined =
      data.choices?.[0]?.message?.content ??
      data.choices?.[0]?.text ??
      undefined;

    if (!content) {
      console.error(
        "[recommend] No content in response:",
        JSON.stringify(data).slice(0, 500)
      );
      return NextResponse.json({ results: localResults, fallback: true });
    }

    console.log("[recommend] AI responded, content length:", content.length);

    // Step 5: Merge AI scores with local results
    const aiScores = parseAIResponse(content);
    const finalResults = mergeAIScores(localResults, aiScores);
    return NextResponse.json({ results: finalResults, fallback: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[recommend] Exception:", message);
    return NextResponse.json({ results: localResults, fallback: true });
  }
}
