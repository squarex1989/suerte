import { NextResponse } from "next/server";
import type { UserAnswers, CountryResult, CountryPolicy, ScoreBreakdown, Highlight, Risk } from "@/types";
import { countries } from "@/data/countries";
import { toUsdMonthly } from "@/data/countries";
import { recommend } from "@/engine/recommend";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "minimax/minimax-m2.1";

function buildCountrySummary(c: CountryPolicy): string {
  const minMonthlyUsd = toUsdMonthly(c);
  return [
    `country_id: ${c.country_id}`,
    `name: ${c.name}`,
    `visa_name: ${c.visa_name}`,
    `min_income_usd_month: ${minMonthlyUsd}`,
    `allowed_work_types: ${c.allowed_work_types.join(", ")}`,
    `family_allowed: ${c.family_allowed === null ? "未知" : c.family_allowed}`,
    `insurance_required: ${c.insurance_required === null ? "未知" : c.insurance_required}`,
    `education_required: ${c.education_required}`,
    `min_experience_years: ${c.min_experience_years}`,
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
  const costLabels: Record<string, string> = { low: "越低越好", medium: "中等即可", insensitive: "不在意" };
  const langLabels: Record<string, string> = { english_priority: "英语优先", can_learn: "可以学当地语言" };
  const tzLabels: Record<string, string> = { asia: "亚洲时区", europe: "欧洲时区", any: "无所谓" };

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

interface AIResultItem {
  country_id: string;
  status: "RECOMMENDED" | "EXCLUDED";
  score: number | null;
  tier?: string;
  breakdown?: ScoreBreakdown;
  highlights?: Highlight[];
  risks?: Risk[];
  exclude_reasons?: string[];
}

function parseAIResponse(text: string): AIResultItem[] {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!jsonMatch) throw new Error("AI response did not contain a JSON array");
  const parsed = JSON.parse(jsonMatch[0]) as AIResultItem[];
  if (!Array.isArray(parsed)) throw new Error("Parsed value is not an array");
  return parsed;
}

function mergeToCountryResults(aiItems: AIResultItem[]): CountryResult[] {
  const byId = new Map(aiItems.map((item) => [item.country_id, item]));
  const results: CountryResult[] = countries.map((country) => {
    const item = byId.get(country.country_id);
    if (!item) {
      return {
        country,
        status: "EXCLUDED" as const,
        score: null,
        exclude_reasons: ["未返回分析结果"],
      };
    }
    return {
      country,
      status: item.status,
      score: item.score,
      tier: item.tier,
      breakdown: item.breakdown,
      highlights: item.highlights,
      risks: item.risks,
      exclude_reasons: item.exclude_reasons,
    };
  });
  results.sort((a, b) => {
    if (a.status === "EXCLUDED" && b.status !== "EXCLUDED") return 1;
    if (a.status !== "EXCLUDED" && b.status === "EXCLUDED") return -1;
    return (b.score ?? -1) - (a.score ?? -1);
  });
  return results;
}

export async function POST(request: Request) {
  const key = process.env.OPENROUTER_API_KEY;
  let body: UserAnswers;
  try {
    body = (await request.json()) as UserAnswers;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!key) {
    const results = recommend(body);
    return NextResponse.json({ results, fallback: true });
  }

  const userProfile = userProfileToChinese(body);
  const countrySummaries = countries
    .map((c) => `---\n${buildCountrySummary(c)}`)
    .join("\n");

  const systemPrompt = `你是一位数字游民签证与移民政策专家。根据用户画像和各国政策摘要，对 10 个国家逐一判断是否推荐，并给出评分与理由。

请严格按以下 JSON 数组格式输出，不要输出任何其他文字。数组长度为 10，每个元素对应一个国家，按 country_id 顺序：spain, portugal, italy, greece, croatia, dubai, thailand, malaysia, indonesia, south_korea。

每个元素格式：
{
  "country_id": "spain",
  "status": "RECOMMENDED 或 EXCLUDED",
  "score": 0-100 的整数（EXCLUDED 时为 null）,
  "tier": "⭐ 强烈推荐" | "👍 值得考虑" | "ℹ️ 可作备选" | "⚠️ 匹配度较低"（仅 RECOMMENDED 时填）,
  "breakdown": { "feasibility": 0-40, "stability": 0-20, "longterm": 0-15, "tax": 0-15, "lifestyle": 0-10 }（仅 RECOMMENDED 时填）,
  "highlights": [{"text": "中文理由", "field": "min_income"}]，最多 3 条（仅 RECOMMENDED 时填）,
  "risks": [{"text": "中文风险说明", "field": "tax_policy", "severity": "high"|"medium"|"low"}]，最多 3 条（仅 RECOMMENDED 时填）,
  "exclude_reasons": ["中文排除原因1", "中文排除原因2"]（仅 EXCLUDED 时填）
}

判断逻辑：若用户收入低于该国 min_income_usd_month、工作形态不在 allowed_work_types、不接受当地工作限制却该国禁止当地工作、缺少必备材料、或不符合学历/经验要求，则 EXCLUDED 并写明 exclude_reasons。否则 RECOMMENDED，并综合可行性、稳定性、长期潜力、税务、生活适配给出 score 和 breakdown，以及 3 条 highlights 和 3 条 risks。所有文案使用中文。`;

  const userPrompt = `## 用户画像\n${userProfile}\n\n## 各国政策摘要\n${countrySummaries}\n\n请输出上述 10 个国家的 JSON 数组（仅此数组，无其他内容）：`;

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
        max_tokens: 32768,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[recommend] OpenRouter HTTP error:", res.status, errText);
      // Fallback to local on API error
      const results = recommend(body);
      return NextResponse.json({ results, fallback: true });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    console.log("[recommend] OpenRouter raw keys:", Object.keys(data));

    const msg = data.choices?.[0]?.message;
    // MiniMax-m2.1 is a reasoning model: actual output may be in `content`, but if
    // the model runs out of non-reasoning tokens, `content` can be "" while
    // `reasoning` still holds useful text. Try content first, then reasoning.
    let content: string | undefined =
      (typeof msg?.content === "string" && msg.content.length > 0) ? msg.content : undefined;

    if (!content && typeof msg?.reasoning === "string" && msg.reasoning.length > 0) {
      console.log("[recommend] content empty, trying reasoning field");
      content = msg.reasoning;
    }

    // Also handle alternative response shapes
    if (!content) {
      content =
        data.choices?.[0]?.text ??
        (typeof data.output === "string" ? data.output : undefined);
    }

    if (!content) {
      console.error("[recommend] No content in response:", JSON.stringify(data).slice(0, 500));
      // Fallback to local when AI returns empty
      const results = recommend(body);
      return NextResponse.json({ results, fallback: true });
    }

    console.log("[recommend] Got content length:", content.length);

    const aiItems = parseAIResponse(content);
    const results = mergeToCountryResults(aiItems);
    return NextResponse.json({ results, fallback: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[recommend] Exception:", message);
    // Fallback to local on any exception
    const results = recommend(body);
    return NextResponse.json({ results, fallback: true });
  }
}
