import { CountryPolicy } from "@/types";

const EUR = 1.08; // EUR → USD fixed rate

export const countries: CountryPolicy[] = [
  // ── 1. Spain ──
  {
    country_id: "spain",
    name: "西班牙",
    flag: "🇪🇸",
    visa_name: "国际远程工作签证",
    confidence_level: "medium",
    source_id: "REPORT-西班牙",
    min_income: {
      amount: 2762,
      currency: "EUR",
      period: "monthly",
      family_surcharge: { spouse_pct: 0, child_pct: 0 },
    },
    allowed_work_types: ["overseas_remote_employee", "freelancer"],
    local_work_prohibited: true,
    family_allowed: true,
    insurance_required: null, // JSON: null — uncertain
    education_required: false,
    min_experience_years: 0,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
    ],
    max_stay_months: 60,
    initial_term_months: 36,
    renewable: true,
    path_to_pr: true,
    path_to_pr_explicit: true,
    years_to_pr: 5,
    tax_policy: {
      type: "special_regime",
      foreign_income_exempt: true,
      foreign_income_conditional: true, // JSON: conditional_exemption
      local_rate_pct: 24,
      exemption_pct: 0,
      benefit_duration_years: 6,
      clarity: "medium", // downgraded: conditional
      description:
        "「贝克汉姆法案」：境内收入 24% 统一税率，海外收入可免税（需满足条件）",
    },
    cost_of_living: { level: "medium", index_vs_nyc: 45 },
    language_env: { english_friendly: "medium", primary_language: "西班牙语" },
    timezone: "Europe",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    public_healthcare: true,
    public_education: true,
    last_verified_at: "2026-02-07",
  },

  // ── 2. Portugal ──
  {
    country_id: "portugal",
    name: "葡萄牙",
    flag: "🇵🇹",
    visa_name: "D8 数字游民签证",
    confidence_level: "medium",
    source_id: "REPORT-葡萄牙",
    min_income: {
      amount: 3040,
      currency: "EUR",
      period: "monthly",
      family_surcharge: { spouse_pct: 0.5, child_pct: 0.3 },
    },
    allowed_work_types: ["overseas_remote_employee", "freelancer"],
    local_work_prohibited: true,
    family_allowed: true,
    insurance_required: null, // JSON: null
    education_required: false,
    min_experience_years: 0,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
    ],
    max_stay_months: 60,
    initial_term_months: 24,
    renewable: true,
    path_to_pr: true,
    path_to_pr_explicit: true,
    years_to_pr: 5,
    tax_policy: {
      type: "special_regime",
      foreign_income_exempt: true,
      foreign_income_conditional: true,
      local_rate_pct: 20,
      exemption_pct: 0,
      benefit_duration_years: 10,
      clarity: "medium",
      description:
        "NHR 税制：符合条件者葡萄牙来源收入 20% 税率，部分海外收入可免税（政策可能调整）",
    },
    cost_of_living: { level: "medium", index_vs_nyc: 40 },
    language_env: { english_friendly: "high", primary_language: "葡萄牙语" },
    timezone: "Europe",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    public_healthcare: true,
    public_education: true,
    last_verified_at: "2026-02-07",
  },

  // ── 3. Italy ──
  {
    country_id: "italy",
    name: "意大利",
    flag: "🇮🇹",
    visa_name: "高技能数字游民签证",
    confidence_level: "medium",
    source_id: "REPORT-意大利",
    min_income: {
      amount: 28000,
      currency: "EUR",
      period: "yearly",
      family_surcharge: { spouse_pct: 0, child_pct: 0 },
    },
    allowed_work_types: ["overseas_remote_employee", "freelancer"],
    local_work_prohibited: true,
    family_allowed: null, // JSON: dependents_allowed = null
    insurance_required: true,
    education_required: true,
    min_experience_years: 3,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
      "education_or_experience",
    ],
    max_stay_months: 60,
    initial_term_months: 12,
    renewable: true,
    path_to_pr: true,
    path_to_pr_explicit: true,
    years_to_pr: 5,
    tax_policy: {
      type: "special_regime",
      foreign_income_exempt: false,
      foreign_income_conditional: true,
      local_rate_pct: 43,
      exemption_pct: 0.7,
      benefit_duration_years: 5,
      clarity: "medium",
      description:
        "「外来人才」税惠：新税务居民 5 年内最高 70% 收入免税（需满足条件，南部可达 90%）",
    },
    cost_of_living: { level: "medium", index_vs_nyc: 50 },
    language_env: { english_friendly: "low", primary_language: "意大利语" },
    timezone: "Europe",
    infrastructure: { internet_quality: "high", coworking_availability: "medium" },
    public_healthcare: true,
    public_education: true,
    last_verified_at: "2026-02-07",
  },

  // ── 4. Greece ──
  {
    country_id: "greece",
    name: "希腊",
    flag: "🇬🇷",
    visa_name: "数字游民签证",
    confidence_level: "medium",
    source_id: "REPORT-希腊",
    min_income: {
      amount: 3500,
      currency: "EUR",
      period: "monthly",
      family_surcharge: { spouse_pct: 0.2, child_pct: 0.15 },
    },
    allowed_work_types: ["overseas_remote_employee", "freelancer"],
    local_work_prohibited: true,
    family_allowed: true,
    insurance_required: true,
    education_required: false,
    min_experience_years: 0,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
    ],
    max_stay_months: 36,
    initial_term_months: 12,
    renewable: true,
    path_to_pr: true,
    path_to_pr_explicit: false, // JSON: explicit = false
    years_to_pr: 5,
    tax_policy: {
      type: "special_regime",
      foreign_income_exempt: false,
      foreign_income_conditional: true,
      local_rate_pct: 44,
      exemption_pct: 0.5,
      benefit_duration_years: 7,
      clarity: "medium",
      description:
        "50% 所得税减免（法律 4825/2021）：符合条件的新税务居民最长 7 年享受减免",
    },
    cost_of_living: { level: "low", index_vs_nyc: 52 },
    language_env: { english_friendly: "high", primary_language: "希腊语" },
    timezone: "Europe",
    infrastructure: { internet_quality: "high", coworking_availability: "medium" },
    public_healthcare: false,
    public_education: true,
    last_verified_at: "2026-02-07",
  },

  // ── 5. Croatia ──
  {
    country_id: "croatia",
    name: "克罗地亚",
    flag: "🇭🇷",
    visa_name: "数字游民临时居留",
    confidence_level: "medium",
    source_id: "REPORT-克罗地亚",
    min_income: {
      amount: 3295,
      currency: "EUR",
      period: "monthly",
      family_surcharge: { spouse_pct: 0.1, child_pct: 0.1 },
    },
    allowed_work_types: ["overseas_remote_employee", "freelancer"],
    local_work_prohibited: true,
    family_allowed: true,
    insurance_required: true,
    education_required: false,
    min_experience_years: 0,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
    ],
    max_stay_months: 36,
    initial_term_months: 12,
    renewable: true,
    path_to_pr: false, // JSON: explicit=false, possible_after_years=null
    path_to_pr_explicit: false,
    years_to_pr: null,
    tax_policy: {
      type: "exempt",
      foreign_income_exempt: true,
      foreign_income_conditional: true, // JSON: conditional
      local_rate_pct: 0,
      exemption_pct: 1,
      benefit_duration_years: 3,
      clarity: "medium", // downgraded from high: conditional
      description:
        "外国收入免税：持此居留期间境外收入免缴克罗地亚所得税（需满足条件）",
    },
    cost_of_living: { level: "low", index_vs_nyc: 35 },
    language_env: { english_friendly: "high", primary_language: "克罗地亚语" },
    timezone: "Europe",
    infrastructure: { internet_quality: "medium", coworking_availability: "medium" },
    public_healthcare: false,
    public_education: false,
    last_verified_at: "2026-02-07",
  },

  // ── 6. UAE (Dubai) ──
  {
    country_id: "dubai",
    name: "阿联酋（迪拜）",
    flag: "🇦🇪",
    visa_name: "虚拟工作签证",
    confidence_level: "medium",
    source_id: "REPORT-阿联酋（迪拜）",
    min_income: {
      amount: 5000,
      currency: "USD",
      period: "monthly",
      family_surcharge: { spouse_pct: 0, child_pct: 0 },
    },
    allowed_work_types: [
      "overseas_remote_employee",
      "freelancer",
      "company_owner",
    ],
    local_work_prohibited: true,
    family_allowed: null, // JSON: dependents_allowed = null
    insurance_required: true,
    education_required: false,
    min_experience_years: 0,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
    ],
    max_stay_months: 12,
    initial_term_months: 12,
    renewable: true,
    path_to_pr: false,
    path_to_pr_explicit: false,
    years_to_pr: null,
    tax_policy: {
      type: "zero",
      foreign_income_exempt: true,
      foreign_income_conditional: false, // zero PIT is structural, not conditional
      local_rate_pct: 0,
      exemption_pct: 1,
      benefit_duration_years: 99,
      clarity: "high",
      description: "无个人所得税：远程工作收入在阿联酋免税（企业税另计）",
    },
    cost_of_living: { level: "high", index_vs_nyc: 70 },
    language_env: { english_friendly: "high", primary_language: "阿拉伯语" },
    timezone: "MiddleEast",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    public_healthcare: false,
    public_education: false,
    last_verified_at: "2026-02-07",
  },

  // ── 7. Thailand ──
  {
    country_id: "thailand",
    name: "泰国",
    flag: "🇹🇭",
    visa_name: "LTR 远程工作者签证",
    confidence_level: "medium",
    source_id: "REPORT-泰国",
    min_income: {
      amount: 80000,
      currency: "USD",
      period: "yearly",
      family_surcharge: { spouse_pct: 0, child_pct: 0 },
    },
    allowed_work_types: ["overseas_remote_employee"],
    local_work_prohibited: true,
    family_allowed: true,
    insurance_required: true,
    education_required: true,
    min_experience_years: 5,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
      "education_or_experience",
    ],
    max_stay_months: 120,
    initial_term_months: 60,
    renewable: true,
    path_to_pr: false, // JSON: explicit=false
    path_to_pr_explicit: false,
    years_to_pr: null,
    tax_policy: {
      type: "exempt",
      foreign_income_exempt: true,
      foreign_income_conditional: true, // JSON: highly conditional on remittance rules
      local_rate_pct: 17,
      exemption_pct: 1,
      benefit_duration_years: 10,
      clarity: "low", // JSON notes: "high risk; treat as conditional and policy-sensitive"
      description:
        "海外收入可免税（取决于汇款时间和泰国税法）；本地就业可申请 17% 扁平税",
    },
    cost_of_living: { level: "low", index_vs_nyc: 30 },
    language_env: { english_friendly: "medium", primary_language: "泰语" },
    timezone: "Asia",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    public_healthcare: false,
    public_education: false,
    last_verified_at: "2026-02-07",
  },

  // ── 8. Malaysia ──
  {
    country_id: "malaysia",
    name: "马来西亚",
    flag: "🇲🇾",
    visa_name: "DE Rantau 数字游民通行证",
    confidence_level: "medium",
    source_id: "REPORT-马来西亚",
    min_income: {
      amount: 24000,
      currency: "USD",
      period: "yearly",
      family_surcharge: { spouse_pct: 0, child_pct: 0 },
    },
    allowed_work_types: ["overseas_remote_employee", "freelancer"],
    local_work_prohibited: true,
    family_allowed: true,
    insurance_required: null, // JSON: null
    education_required: false,
    min_experience_years: 0,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
    ],
    max_stay_months: 24,
    initial_term_months: 12,
    renewable: true,
    path_to_pr: false,
    path_to_pr_explicit: false,
    years_to_pr: null,
    tax_policy: {
      type: "exempt",
      foreign_income_exempt: true,
      foreign_income_conditional: true, // JSON: time-bounded 2022-2026
      local_rate_pct: 0,
      exemption_pct: 1,
      benefit_duration_years: 5,
      clarity: "low", // time-bounded policy window
      description:
        "境外收入暂免税（2022–2026 年窗口期）；政策到期后可能调整，需持续关注",
    },
    cost_of_living: { level: "low", index_vs_nyc: 28 },
    language_env: { english_friendly: "high", primary_language: "马来语" },
    timezone: "Asia",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    public_healthcare: false,
    public_education: false,
    last_verified_at: "2026-02-07",
  },

  // ── 9. Indonesia ──
  {
    country_id: "indonesia",
    name: "印度尼西亚",
    flag: "🇮🇩",
    visa_name: "远程工作 KITAS",
    confidence_level: "medium",
    source_id: "REPORT-印度尼西亚",
    min_income: {
      amount: 60000,
      currency: "USD",
      period: "yearly",
      family_surcharge: { spouse_pct: 0, child_pct: 0 },
    },
    allowed_work_types: ["overseas_remote_employee"], // JSON: only remote_employee
    local_work_prohibited: true,
    family_allowed: null, // JSON: dependents_allowed = null
    insurance_required: true,
    education_required: false,
    min_experience_years: 0,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
    ],
    max_stay_months: 60,
    initial_term_months: 12,
    renewable: true,
    path_to_pr: false,
    path_to_pr_explicit: false,
    years_to_pr: null,
    tax_policy: {
      type: "exempt",
      foreign_income_exempt: true,
      foreign_income_conditional: true,
      local_rate_pct: 0,
      exemption_pct: 1,
      benefit_duration_years: 5,
      clarity: "medium",
      description:
        "外国收入可免税：远程 KITAS 持有人海外收入在印尼可免税（取决于签证类别和收入结构）",
    },
    cost_of_living: { level: "low", index_vs_nyc: 25 },
    language_env: { english_friendly: "medium", primary_language: "印尼语" },
    timezone: "Asia",
    infrastructure: { internet_quality: "medium", coworking_availability: "high" },
    public_healthcare: false,
    public_education: false,
    last_verified_at: "2026-02-07",
  },

  // ── 10. South Korea ──
  {
    country_id: "south_korea",
    name: "韩国",
    flag: "🇰🇷",
    visa_name: "D-10-3 数字游民签证",
    confidence_level: "medium",
    source_id: "REPORT-韩国",
    min_income: {
      amount: 66000,
      currency: "USD",
      period: "yearly",
      family_surcharge: { spouse_pct: 0, child_pct: 0 },
    },
    allowed_work_types: ["overseas_remote_employee"],
    local_work_prohibited: true,
    family_allowed: true,
    insurance_required: null, // JSON: null
    education_required: false,
    min_experience_years: 1,
    required_documents: [
      "employment_contract",
      "bank_statement",
      "criminal_record",
      "education_or_experience",
    ],
    max_stay_months: 24,
    initial_term_months: 12,
    renewable: true,
    path_to_pr: false,
    path_to_pr_explicit: false,
    years_to_pr: null,
    tax_policy: {
      type: "no_benefit",
      foreign_income_exempt: false,
      foreign_income_conditional: true, // depends on treaties and residency
      local_rate_pct: 45,
      exemption_pct: 0,
      benefit_duration_years: 0,
      clarity: "low",
      description:
        "无特别优惠：>183 天视同税务居民，需按韩国税率缴全球收入税（取决于税务居民认定和税收协定）",
    },
    cost_of_living: { level: "high", index_vs_nyc: 65 },
    language_env: { english_friendly: "low", primary_language: "韩语" },
    timezone: "Asia",
    infrastructure: { internet_quality: "high", coworking_availability: "high" },
    public_healthcare: true,
    public_education: true,
    last_verified_at: "2026-02-07",
  },
];

// Fixed exchange rates for income comparison
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: EUR,
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
