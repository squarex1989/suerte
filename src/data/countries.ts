/**
 * countries.ts — Single source of truth bridge
 *
 * Policy FACTS come from: digital_nomad_countries_policy_facts.json
 * Editorial ENRICHMENT (Chinese names, cost, timezone, infra, tax details)
 * lives in the ENRICHMENT map below.
 *
 * Workflow:  edit JSON → rebuild → recommendation results update automatically.
 */

import type {
  CountryPolicy,
  WorkType,
  DocumentType,
  Level,
  TaxType,
  Timezone,
  ConfidenceLevel,
} from "@/types";

// Import the JSON facts (resolveJsonModule: true in tsconfig)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import policyFactsJson from "../../digital_nomad_countries_policy_facts.json";

const EUR_TO_USD = 1.08;

// ═══════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════

/** ISO 3166-1 alpha-2 → flag emoji */
function isoToFlag(iso: string): string {
  return Array.from(iso.toUpperCase())
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/** Map JSON worker type strings to our WorkType enum */
function mapWorkTypes(types: string[]): WorkType[] {
  const map: Record<string, WorkType> = {
    remote_employee: "overseas_remote_employee",
    freelancer: "freelancer",
    self_employed: "freelancer",
    business_owner: "company_owner",
  };
  return types.map((t) => map[t]).filter(Boolean);
}

/** Duration { value, unit } → months */
function toMonths(val: number, unit: string): number {
  if (unit === "year" || unit === "years") return val * 12;
  return val; // already months
}

// ═══════════════════════════════════════════
//  Enrichment: editorial data NOT in JSON
// ═══════════════════════════════════════════

interface CountryEnrichment {
  country_id: string;
  visa_name_zh: string;
  cost_of_living: { level: "low" | "medium" | "high"; index_vs_nyc: number };
  timezone: Timezone;
  infrastructure: { internet_quality: Level; coworking_availability: Level };
  required_documents: DocumentType[];
  max_stay_months: number; // maximum realistic stay (requires interpretation)
  tax: {
    type: TaxType;
    foreign_income_exempt: boolean;
    local_rate_pct: number;
    exemption_pct: number;
    benefit_duration_years: number;
    clarity: Level;
    description: string;
  };
}

const ENRICHMENT: Record<string, CountryEnrichment> = {
  ES: {
    country_id: "spain",
    visa_name_zh: "国际远程工作签证",
    cost_of_living: { level: "medium", index_vs_nyc: 45 },
    timezone: "Europe",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record"],
    max_stay_months: 60,
    tax: {
      type: "special_regime",
      foreign_income_exempt: true,
      local_rate_pct: 24,
      exemption_pct: 0,
      benefit_duration_years: 6,
      clarity: "medium",
      description: "「贝克汉姆法案」：境内收入 24% 统一税率，海外收入可免税（需满足条件）",
    },
  },
  PT: {
    country_id: "portugal",
    visa_name_zh: "D8 数字游民签证",
    cost_of_living: { level: "medium", index_vs_nyc: 40 },
    timezone: "Europe",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record"],
    max_stay_months: 60,
    tax: {
      type: "special_regime",
      foreign_income_exempt: true,
      local_rate_pct: 20,
      exemption_pct: 0,
      benefit_duration_years: 10,
      clarity: "medium",
      description: "NHR 税制：符合条件者葡萄牙来源收入 20% 税率，部分海外收入可免税（政策可能调整）",
    },
  },
  IT: {
    country_id: "italy",
    visa_name_zh: "高技能数字游民签证",
    cost_of_living: { level: "medium", index_vs_nyc: 50 },
    timezone: "Europe",
    infrastructure: { internet_quality: "high", coworking_availability: "medium" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record", "education_or_experience"],
    max_stay_months: 60,
    tax: {
      type: "special_regime",
      foreign_income_exempt: false,
      local_rate_pct: 43,
      exemption_pct: 0.7,
      benefit_duration_years: 5,
      clarity: "medium",
      description: "「外来人才」税惠：新税务居民 5 年内最高 70% 收入免税（需满足条件，南部可达 90%）",
    },
  },
  GR: {
    country_id: "greece",
    visa_name_zh: "数字游民签证",
    cost_of_living: { level: "low", index_vs_nyc: 52 },
    timezone: "Europe",
    infrastructure: { internet_quality: "high", coworking_availability: "medium" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record"],
    max_stay_months: 36,
    tax: {
      type: "special_regime",
      foreign_income_exempt: false,
      local_rate_pct: 44,
      exemption_pct: 0.5,
      benefit_duration_years: 7,
      clarity: "medium",
      description: "50% 所得税减免（法律 4825/2021）：符合条件的新税务居民最长 7 年享受减免",
    },
  },
  HR: {
    country_id: "croatia",
    visa_name_zh: "数字游民临时居留",
    cost_of_living: { level: "low", index_vs_nyc: 35 },
    timezone: "Europe",
    infrastructure: { internet_quality: "medium", coworking_availability: "medium" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record"],
    max_stay_months: 36,
    tax: {
      type: "exempt",
      foreign_income_exempt: true,
      local_rate_pct: 0,
      exemption_pct: 1,
      benefit_duration_years: 3,
      clarity: "medium",
      description: "外国收入免税：持此居留期间境外收入免缴克罗地亚所得税（需满足条件）",
    },
  },
  AE: {
    country_id: "dubai",
    visa_name_zh: "虚拟工作签证",
    cost_of_living: { level: "high", index_vs_nyc: 70 },
    timezone: "MiddleEast",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record"],
    max_stay_months: 12,
    tax: {
      type: "zero",
      foreign_income_exempt: true,
      local_rate_pct: 0,
      exemption_pct: 1,
      benefit_duration_years: 99,
      clarity: "high",
      description: "无个人所得税：远程工作收入在阿联酋免税（企业税另计）",
    },
  },
  TH: {
    country_id: "thailand",
    visa_name_zh: "LTR 远程工作者签证",
    cost_of_living: { level: "low", index_vs_nyc: 30 },
    timezone: "Asia",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record", "education_or_experience"],
    max_stay_months: 120,
    tax: {
      type: "exempt",
      foreign_income_exempt: true,
      local_rate_pct: 17,
      exemption_pct: 1,
      benefit_duration_years: 10,
      clarity: "low",
      description: "海外收入可免税（取决于汇款时间和泰国税法）；本地就业可申请 17% 扁平税",
    },
  },
  MY: {
    country_id: "malaysia",
    visa_name_zh: "DE Rantau 数字游民通行证",
    cost_of_living: { level: "low", index_vs_nyc: 28 },
    timezone: "Asia",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record"],
    max_stay_months: 24,
    tax: {
      type: "exempt",
      foreign_income_exempt: true,
      local_rate_pct: 0,
      exemption_pct: 1,
      benefit_duration_years: 5,
      clarity: "low",
      description: "境外收入暂免税（2022–2026 年窗口期）；政策到期后可能调整，需持续关注",
    },
  },
  ID: {
    country_id: "indonesia",
    visa_name_zh: "远程工作 KITAS",
    cost_of_living: { level: "low", index_vs_nyc: 25 },
    timezone: "Asia",
    infrastructure: { internet_quality: "medium", coworking_availability: "high" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record"],
    max_stay_months: 60,
    tax: {
      type: "exempt",
      foreign_income_exempt: true,
      local_rate_pct: 0,
      exemption_pct: 1,
      benefit_duration_years: 5,
      clarity: "medium",
      description: "外国收入可免税：远程 KITAS 持有人海外收入在印尼可免税（取决于签证类别和收入结构）",
    },
  },
  KR: {
    country_id: "south_korea",
    visa_name_zh: "D-10-3 数字游民签证",
    cost_of_living: { level: "high", index_vs_nyc: 65 },
    timezone: "Asia",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    required_documents: ["employment_contract", "bank_statement", "criminal_record", "education_or_experience"],
    max_stay_months: 24,
    tax: {
      type: "no_benefit",
      foreign_income_exempt: false,
      local_rate_pct: 45,
      exemption_pct: 0,
      benefit_duration_years: 0,
      clarity: "low",
      description: "无特别优惠：>183 天视同税务居民，需按韩国税率缴全球收入税（取决于税务居民认定和税收协定）",
    },
  },
};

// ═══════════════════════════════════════════
//  Transformer:  JSON fact + enrichment → CountryPolicy
// ═══════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transform(raw: any, enrich: CountryEnrichment): CountryPolicy {
  const meta = raw.meta;
  const visa = raw.visa_policy;
  const fin = raw.financial_requirements;
  const res = raw.residency;
  const fam = raw.family;
  const tax = raw.taxation;
  const health = raw.healthcare_and_insurance;
  const lang = raw.language_and_life;

  // ── work types ──
  const allowedWorkTypes = mapWorkTypes(visa?.eligible_worker_types ?? []);

  // If business_owner_conditions.allowed is true, add company_owner (with conditions)
  const boc = visa?.business_owner_conditions;
  const businessOwnerConditional = boc?.allowed === true;
  const businessOwnerRestrictions: string[] = boc?.restrictions ?? [];
  if (businessOwnerConditional && !allowedWorkTypes.includes("company_owner")) {
    allowedWorkTypes.push("company_owner");
  }

  // ── local work prohibited ──
  const localRestrictions = visa?.local_work_restrictions;
  const localClientLimit = visa?.local_client_income_limit;
  const localProhibited = !!(
    localRestrictions?.no_local_employment ||
    localRestrictions?.no_local_clients ||
    localRestrictions?.must_be_foreign_employer_or_clients ||
    localRestrictions?.must_be_qualified_foreign_employer ||
    localClientLimit?.exists
  );

  // ── income ──
  const incomeRaw = fin?.minimum_income ?? {};
  const familyAdj = fin?.family_income_adjustment ?? {};
  const spousePct = (familyAdj.spouse_additional_pct ?? 0) / 100;
  const childPct = (familyAdj.child_additional_pct ?? familyAdj.per_member_additional_pct ?? 0) / 100;

  // ── residency ──
  const initDur = res?.initial_duration ?? {};
  const initialTermMonths = toMonths(initDur.value ?? 12, initDur.unit ?? "months");
  const renewable = res?.renewal?.possible ?? false;

  // ── PR path ──
  const prInfo = res?.path_to_long_term_residency;
  const pathToPrExplicit = prInfo?.explicit ?? false;
  const yearsToPr: number | null = prInfo?.possible_after_years ?? null;
  const pathToPr = pathToPrExplicit || (yearsToPr !== null);

  // ── education / experience ──
  const hasQualReq = !!fin?.qualification_requirements;
  const minExpYears: number = fin?.experience_requirement_years ?? 0;

  // ── insurance (check both locations in JSON) ──
  const insuranceFromHealth: boolean | null = health?.private_insurance_required ?? null;
  const insuranceFromFin: boolean = fin?.insurance_required === true || !!fin?.insurance_requirement;
  const insuranceRequired = insuranceFromFin ? true : insuranceFromHealth;

  // ── family ──
  const familyAllowed: boolean | null = fam?.dependents_allowed ?? null;

  // ── tax: conditional exemption flag ──
  const foreignTax = tax?.foreign_income_taxation;
  const foreignIncomeConditional: boolean =
    foreignTax?.conditional_exemption === true ||
    (foreignTax?.automatic_exemption === false && foreignTax?.conditional_exemption !== false);

  // ── public services ──
  const healthAccess = health?.public_healthcare_access ?? "";
  const publicHealthcare = healthAccess.includes("possible") || healthAccess.includes("SNS") || healthAccess.includes("NHI");
  const eduAccess = health?.education_access ?? "";
  const publicEducation = eduAccess.includes("public_school") || eduAccess.includes("local_schools");

  // ── confidence ──
  const confidence: ConfidenceLevel = (meta?.confidence_level as ConfidenceLevel) ?? "medium";

  // ── english friendliness (derive from JSON) ──
  const englishRaw: string = lang?.english_usage ?? "low";
  let englishFriendly: Level = "low";
  if (englishRaw.includes("very_high") || englishRaw === "high" || englishRaw.includes("high_in_cities")) {
    englishFriendly = "high";
  } else if (englishRaw.includes("moderate") || englishRaw.includes("medium")) {
    englishFriendly = "medium";
  }

  // ── primary language (derive Chinese name from JSON) ──
  const langNameMap: Record<string, string> = {
    Spanish: "西班牙语", Portuguese: "葡萄牙语", Italian: "意大利语",
    Greek: "希腊语", Croatian: "克罗地亚语", Arabic: "阿拉伯语",
    Thai: "泰语", Malay: "马来语", Indonesian: "印尼语", Korean: "韩语",
  };
  const primaryLang = langNameMap[lang?.primary_language] ?? lang?.primary_language ?? "";

  // ── source_id ──
  const sourceId: string = raw.sources?.[0]?.id ?? `REPORT-${meta?.local_name ?? meta?.country}`;

  return {
    country_id: enrich.country_id,
    name: meta?.local_name ?? meta?.country ?? "",
    flag: isoToFlag(meta?.iso_code ?? "XX"),
    visa_name: enrich.visa_name_zh,

    confidence_level: confidence,
    source_id: sourceId,

    min_income: {
      amount: incomeRaw.amount ?? 0,
      currency: incomeRaw.currency ?? "USD",
      period: incomeRaw.period === "yearly" ? "yearly" : "monthly",
      family_surcharge: { spouse_pct: spousePct, child_pct: childPct },
    },

    allowed_work_types: allowedWorkTypes,
    business_owner_conditional: businessOwnerConditional,
    business_owner_restrictions: businessOwnerRestrictions,
    local_work_prohibited: localProhibited,
    family_allowed: familyAllowed,
    insurance_required: insuranceRequired,
    education_required: hasQualReq,
    min_experience_years: minExpYears,
    required_documents: enrich.required_documents,

    max_stay_months: enrich.max_stay_months,
    initial_term_months: initialTermMonths,
    renewable,
    path_to_pr: pathToPr,
    path_to_pr_explicit: pathToPrExplicit,
    years_to_pr: yearsToPr,

    tax_policy: {
      type: enrich.tax.type,
      foreign_income_exempt: enrich.tax.foreign_income_exempt,
      foreign_income_conditional: foreignIncomeConditional,
      local_rate_pct: enrich.tax.local_rate_pct,
      exemption_pct: enrich.tax.exemption_pct,
      benefit_duration_years: enrich.tax.benefit_duration_years,
      clarity: enrich.tax.clarity,
      description: enrich.tax.description,
    },

    cost_of_living: enrich.cost_of_living,
    language_env: { english_friendly: englishFriendly, primary_language: primaryLang },
    timezone: enrich.timezone,
    infrastructure: enrich.infrastructure,

    public_healthcare: publicHealthcare,
    public_education: publicEducation,
    last_verified_at: meta?.last_reviewed_at ?? "2026-01-01",
  };
}

// ═══════════════════════════════════════════
//  Export: build countries from JSON + enrichment
// ═══════════════════════════════════════════

export const countries: CountryPolicy[] = (policyFactsJson as unknown as Record<string, unknown>[]).map(
  (raw) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iso: string = (raw as any).meta?.iso_code;
    const enrich = ENRICHMENT[iso];
    if (!enrich) {
      throw new Error(
        `[countries.ts] Missing enrichment config for ISO code "${iso}". ` +
          `Add an entry to the ENRICHMENT map.`
      );
    }
    return transform(raw, enrich);
  }
);

// ═══════════════════════════════════════════
//  Exchange rates & income helper
// ═══════════════════════════════════════════

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: EUR_TO_USD,
};

/** Convert a country's min income to USD/month */
export function toUsdMonthly(c: CountryPolicy): number {
  const rate = EXCHANGE_RATES[c.min_income.currency] ?? 1;
  const monthly =
    c.min_income.period === "yearly"
      ? c.min_income.amount / 12
      : c.min_income.amount;
  return Math.round(monthly * rate);
}
