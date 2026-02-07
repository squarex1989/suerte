import {
  CountryPolicy,
  UserAnswers,
  CountryResult,
  ScoreBreakdown,
  Highlight,
  Risk,
} from "@/types";
import { countries, toUsdMonthly } from "@/data/countries";

/* ================================================================
   Suerte Recommendation Engine
   – Hard Filter (7.2)
   – Soft Score  (7.3)  5 dimensions, 100 points
   – Modifiers   (7.4)
   – Ranking     (7.5)
   – Explanations(7.6)
   ================================================================ */

// ────────────────── helpers ──────────────────

function requiredIncomeUsd(c: CountryPolicy, user: UserAnswers): number {
  let base = toUsdMonthly(c);
  if (user.has_spouse)
    base += Math.round(base * c.min_income.family_surcharge.spouse_pct);
  base += Math.round(
    base * c.min_income.family_surcharge.child_pct * user.num_children
  );
  return base;
}

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86_400_000
  );
}

// ────────────────── 7.2 Hard Filter ──────────────────

interface FilterResult {
  excluded: boolean;
  reasons: string[];
}

function hardFilter(user: UserAnswers, c: CountryPolicy): FilterResult {
  const reasons: string[] = [];

  // F1 Income
  const req = requiredIncomeUsd(c, user);
  if (user.monthly_income_usd < req) {
    reasons.push(
      `收入不满足最低要求（需 $${req.toLocaleString()}/月，你约 $${user.monthly_income_usd.toLocaleString()}/月）`
    );
  }

  // F2 Work type
  if (
    !(c.allowed_work_types as string[]).includes(user.work_type)
  ) {
    const labels: Record<string, string> = {
      overseas_remote_employee: "海外公司远程雇员",
      domestic_remote_employee: "国内公司远程雇员",
      freelancer: "自由职业者",
      company_owner: "自有公司",
    };
    reasons.push(
      `该国签证不接受「${labels[user.work_type]}」工作形态`
    );
  }

  // F3 Local work restriction
  if (c.local_work_prohibited && !user.accept_no_local_work) {
    reasons.push("该国禁止为当地公司/客户工作，但你无法接受此限制");
  }

  // F4 Insurance
  if (c.insurance_required && !user.can_buy_insurance) {
    reasons.push("该国签证强制要求私人医疗保险，但你无法购买");
  }

  // F5 Critical documents
  const missing = c.required_documents.filter(
    (d) => !user.docs_available.includes(d)
  );
  const critical = missing.filter(
    (d) => d === "criminal_record" || d === "bank_statement"
  );
  if (critical.length > 0) {
    const labels: Record<string, string> = {
      criminal_record: "无犯罪记录",
      bank_statement: "银行流水",
    };
    reasons.push(
      `缺少关键申请材料：${critical.map((d) => labels[d]).join("、")}`
    );
  }

  // F6 Education / experience
  if (c.education_required) {
    if (!user.docs_available.includes("education_or_experience")) {
      reasons.push("该国要求学历或工作经验证明，但你无法提供");
    }
  }
  if (c.min_experience_years > 0) {
    if (!user.docs_available.includes("education_or_experience")) {
      if (
        !reasons.some((r) => r.includes("学历或工作经验"))
      ) {
        reasons.push(
          `该国要求至少 ${c.min_experience_years} 年工作经验证明`
        );
      }
    }
  }

  return { excluded: reasons.length > 0, reasons };
}

// ────────────────── 7.3 Soft Score ──────────────────

// A: Feasibility (max 40)
function scoreFeasibility(user: UserAnswers, c: CountryPolicy): number {
  let s = 0;
  const req = requiredIncomeUsd(c, user);
  const ratio = user.monthly_income_usd / req;

  // A1 Income margin (0-15)
  if (ratio >= 3) s += 15;
  else if (ratio >= 2) s += 12;
  else if (ratio >= 1.5) s += 9;
  else if (ratio >= 1.2) s += 6;
  else s += 3;

  // A2 Document readiness (0-10)
  const totalReq = c.required_documents.length;
  const has = c.required_documents.filter((d) =>
    user.docs_available.includes(d)
  ).length;
  s += Math.round((10 * has) / Math.max(totalReq, 1));

  // A3 Work type match (0-10)
  if (user.work_type === "overseas_remote_employee") s += 10;
  else if (user.work_type === "freelancer") s += 8;
  else if (user.work_type === "company_owner") s += 5;
  else s += 2;

  // A4 Income stability (0-5)
  s += user.income_stable ? 5 : 2;

  return s;
}

// B: Stability (max 20)
function scoreStability(c: CountryPolicy): number {
  let s = 0;

  // B1 Max stay (0-10)
  const m = c.max_stay_months;
  if (m >= 120) s += 10;
  else if (m >= 60) s += 8;
  else if (m >= 36) s += 6;
  else if (m >= 24) s += 4;
  else s += 2;

  // B2 Initial term (0-5)
  const init = c.initial_term_months;
  if (init >= 60) s += 5;
  else if (init >= 36) s += 4;
  else if (init >= 24) s += 3;
  else if (init >= 12) s += 2;
  else s += 1;

  // B3 Renewal (0-5)
  if (c.renewable) {
    s += 3;
    if (c.max_stay_months > c.initial_term_months) s += 2;
  }

  return s;
}

// C: Long-term (max 15)
function scoreLongterm(user: UserAnswers, c: CountryPolicy): number {
  if (!user.want_long_term) return 7; // neutral

  let s = 0;
  if (c.path_to_pr) s += 8;
  if (c.path_to_pr && c.years_to_pr !== null) {
    if (c.years_to_pr <= 3) s += 4;
    else if (c.years_to_pr <= 5) s += 3;
    else if (c.years_to_pr <= 7) s += 2;
    else s += 1;
  }
  if (c.path_to_pr && c.family_allowed) s += 3;
  else if (c.family_allowed) s += 1;

  return s;
}

// D: Tax (max 15)
function scoreTax(c: CountryPolicy): number {
  let s = 0;
  const tax = c.tax_policy;

  // D1 Exemption level (0-8)
  if (tax.type === "zero") s += 8;
  else if (tax.type === "exempt") s += 7;
  else if (tax.type === "special_regime") {
    const effective = tax.foreign_income_exempt
      ? 0
      : tax.local_rate_pct * (1 - tax.exemption_pct);
    if (effective <= 10) s += 6;
    else if (effective <= 20) s += 5;
    else if (effective <= 30) s += 4;
    else s += 2;
  }
  // no_benefit: 0

  // D2 Duration (0-4)
  if (tax.type === "zero") s += 4;
  else if (tax.type === "exempt") s += 4;
  else if (tax.benefit_duration_years >= 10) s += 4;
  else if (tax.benefit_duration_years >= 7) s += 3;
  else if (tax.benefit_duration_years >= 5) s += 2;
  else if (tax.benefit_duration_years > 0) s += 1;

  // D3 Clarity (0-3)
  if (tax.clarity === "high") s += 3;
  else if (tax.clarity === "medium") s += 2;
  else s += 1;

  return s;
}

// E: Lifestyle (max 10)
function scoreLifestyle(user: UserAnswers, c: CountryPolicy): number {
  let s = 0;

  // E1 Cost (0-3)
  if (user.cost_preference === "low") {
    if (c.cost_of_living.level === "low") s += 3;
    else if (c.cost_of_living.level === "medium") s += 1;
  } else if (user.cost_preference === "medium") {
    if (c.cost_of_living.level === "medium") s += 3;
    else if (c.cost_of_living.level === "low") s += 2;
    else s += 1;
  } else {
    s += 2;
  }

  // E2 Language (0-3)
  if (user.language_preference === "english_priority") {
    if (c.language_env.english_friendly === "high") s += 3;
    else if (c.language_env.english_friendly === "medium") s += 1;
  } else {
    s += 2;
  }

  // E3 Timezone (0-2)
  if (user.timezone_preference === "any") {
    s += 1;
  } else if (user.timezone_preference === "asia") {
    if (c.timezone === "Asia") s += 2;
    else if (c.timezone === "MiddleEast") s += 1;
  } else {
    if (c.timezone === "Europe") s += 2;
    else if (c.timezone === "MiddleEast") s += 1;
  }

  // E4 Infrastructure (0-2)
  if (user.infra_requirement === "high") {
    if (c.infrastructure.internet_quality === "high") s += 2;
    else if (c.infrastructure.internet_quality === "medium") s += 1;
  } else {
    s += c.infrastructure.internet_quality === "low" ? 1 : 2;
  }

  return s;
}

// ────────────────── 7.4 Modifiers ──────────────────

function applyModifiers(
  user: UserAnswers,
  c: CountryPolicy,
  base: number
): number {
  let f = base;

  // M1 Family
  if (user.has_spouse || user.num_children > 0) {
    if (c.family_allowed) {
      if (c.public_education) f += 3;
      if (c.public_healthcare) f += 2;
    } else {
      f -= 5;
    }
  }

  // M2 Stay × tax
  if (user.planned_stay === ">183d") {
    if (c.tax_policy.type === "zero") f += 2;
    else if (c.tax_policy.type === "exempt") f += 1;
    else if (c.tax_policy.type === "no_benefit") f -= 5;
  }
  if (user.planned_stay === "<90d" && c.max_stay_months >= 60) {
    f -= 2;
  }

  // M3 CN affinity
  if (user.nationality === "CN") {
    if (c.country_id === "malaysia") f += 3;
    if (c.country_id === "thailand") f += 1;
    if (c.country_id === "south_korea") f += 1;
  }

  // M4 Data freshness
  const days = daysSince(c.last_verified_at);
  if (days > 180) f -= 10;
  else if (days > 90) f -= 5;

  return Math.max(f, 0);
}

// ────────────────── 7.6 Highlights & Risks ──────────────────

function genHighlights(
  user: UserAnswers,
  c: CountryPolicy,
  bd: ScoreBreakdown
): Highlight[] {
  const pool: Highlight[] = [];

  const req = requiredIncomeUsd(c, user);
  const ratio = (user.monthly_income_usd / req).toFixed(1);

  if (bd.tax > 10)
    pool.push({ text: c.tax_policy.description, field: "tax_policy" });

  if (bd.stability > 14)
    pool.push({
      text: `最长可居留 ${Math.round(c.max_stay_months / 12)} 年，签证稳定性强`,
      field: "max_stay_months",
    });

  if ((user.has_spouse || user.num_children > 0) && c.public_education)
    pool.push({
      text: "子女可入读公立学校，家属可随行享受居留权益",
      field: "public_education",
    });

  if (bd.feasibility > 30)
    pool.push({
      text: `你的收入为门槛的 ${ratio} 倍，申请余量充裕`,
      field: "min_income",
    });

  if (c.cost_of_living.level === user.cost_preference || (user.cost_preference === "low" && c.cost_of_living.level === "low"))
    pool.push({
      text: `生活成本${c.cost_of_living.level === "low" ? "低廉" : "适中"}，符合你的预算偏好`,
      field: "cost_of_living",
    });

  if (c.path_to_pr && user.want_long_term)
    pool.push({
      text: `居留满 ${c.years_to_pr} 年可转永居，长期规划友好`,
      field: "path_to_pr",
    });

  if (
    c.language_env.english_friendly === "high" &&
    user.language_preference === "english_priority"
  )
    pool.push({
      text: "英语为通用语言之一，日常交流无障碍",
      field: "language_env",
    });

  if (c.public_healthcare && (user.has_spouse || user.num_children > 0))
    pool.push({
      text: "可加入公立医疗体系，全家享受低成本医疗保障",
      field: "public_healthcare",
    });

  if (c.tax_policy.type === "zero" || c.tax_policy.type === "exempt")
    pool.push({
      text: "境外收入免税，远程工作税负极低",
      field: "tax_policy",
    });

  // deduplicate by field, pick top 3
  const seen = new Set<string>();
  return pool
    .filter((h) => {
      if (seen.has(h.field)) return false;
      seen.add(h.field);
      return true;
    })
    .slice(0, 3);
}

function genRisks(user: UserAnswers, c: CountryPolicy): Risk[] {
  const pool: Risk[] = [];

  if (
    user.planned_stay === ">183d" &&
    c.tax_policy.type === "no_benefit"
  )
    pool.push({
      text: "停留超 183 天将触发税务居民身份，需按当地税率缴全球收入税",
      field: "tax_policy",
      severity: "high",
    });

  if (!c.path_to_pr && user.want_long_term)
    pool.push({
      text: "数字游民签证不直接通往永居，长期需另寻路径",
      field: "path_to_pr",
      severity: "medium",
    });

  if (c.insurance_required)
    pool.push({
      text: "签证强制要求私人医疗保险，需持续缴费",
      field: "insurance_required",
      severity: "low",
    });

  if (c.language_env.english_friendly === "low")
    pool.push({
      text: `日常以${c.language_env.primary_language}为主，英语服务有限`,
      field: "language_env",
      severity: "medium",
    });

  if (
    !c.public_healthcare &&
    (user.has_spouse || user.num_children > 0)
  )
    pool.push({
      text: "无法加入公立医疗体系，家庭医疗费用需全额自付",
      field: "public_healthcare",
      severity: "medium",
    });

  if (c.cost_of_living.level === "high" && user.cost_preference === "low")
    pool.push({
      text: "生活成本较高，与你的低预算偏好不匹配",
      field: "cost_of_living",
      severity: "medium",
    });

  const days = daysSince(c.last_verified_at);
  if (days > 90)
    pool.push({
      text: `数据校验于 ${c.last_verified_at}，政策可能已更新`,
      field: "last_verified_at",
      severity: "medium",
    });

  // sort by severity, pick top 3
  const order = { high: 0, medium: 1, low: 2 };
  return pool.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 3);
}

// ────────────────── 7.5 Main Recommend ──────────────────

function tierLabel(score: number): string {
  if (score >= 75) return "⭐ 强烈推荐";
  if (score >= 55) return "👍 值得考虑";
  if (score >= 35) return "ℹ️ 可作备选";
  return "⚠️ 匹配度较低";
}

export function recommend(user: UserAnswers): CountryResult[] {
  const results: CountryResult[] = [];

  for (const c of countries) {
    const f = hardFilter(user, c);

    if (f.excluded) {
      results.push({
        country: c,
        status: "EXCLUDED",
        score: null,
        exclude_reasons: f.reasons,
      });
      continue;
    }

    const bd: ScoreBreakdown = {
      feasibility: scoreFeasibility(user, c),
      stability: scoreStability(c),
      longterm: scoreLongterm(user, c),
      tax: scoreTax(c),
      lifestyle: scoreLifestyle(user, c),
    };

    const base =
      bd.feasibility + bd.stability + bd.longterm + bd.tax + bd.lifestyle;
    const final = applyModifiers(user, c, base);

    results.push({
      country: c,
      status: "RECOMMENDED",
      score: final,
      tier: tierLabel(final),
      breakdown: bd,
      highlights: genHighlights(user, c, bd),
      risks: genRisks(user, c),
    });
  }

  // sort recommended by score desc
  results.sort((a, b) => {
    if (a.status === "EXCLUDED" && b.status !== "EXCLUDED") return 1;
    if (a.status !== "EXCLUDED" && b.status === "EXCLUDED") return -1;
    return (b.score ?? -1) - (a.score ?? -1);
  });

  return results;
}
