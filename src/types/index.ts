/* ──────────────────────────────────────
   Type definitions for Suerte
   ────────────────────────────────────── */

// ---- Enums ----

export type WorkType =
  | "overseas_remote_employee"
  | "domestic_remote_employee"
  | "freelancer"
  | "company_owner";

export type DocumentType =
  | "employment_contract"
  | "bank_statement"
  | "criminal_record"
  | "education_or_experience";

export type StayDuration = "<90d" | "90-183d" | ">183d" | "uncertain";
export type CostPref = "low" | "medium" | "insensitive";
export type LangPref = "english_priority" | "can_learn";
export type TzPref = "asia" | "europe" | "any";
export type InfraPref = "high" | "medium";
export type Level = "high" | "medium" | "low";
export type TaxType = "zero" | "exempt" | "special_regime" | "no_benefit";
export type Timezone = "Asia" | "Europe" | "MiddleEast";
export type ConfidenceLevel = "high" | "medium" | "low";

// ---- User Answers ----

export interface UserAnswers {
  nationality: "CN" | "other";
  has_spouse: boolean;
  num_children: number;
  planned_stay: StayDuration;
  work_type: WorkType;
  monthly_income_usd: number;
  income_stable: boolean;
  docs_available: DocumentType[];
  can_buy_insurance: boolean;
  accept_no_local_work: boolean;
  want_long_term: boolean;
  cost_preference: CostPref;
  language_preference: LangPref;
  timezone_preference: TzPref;
  infra_requirement: InfraPref;
}

// ---- Country Policy ----

export interface CountryPolicy {
  country_id: string;
  name: string;
  flag: string;
  visa_name: string;

  // Metadata & confidence
  confidence_level: ConfidenceLevel;
  source_id: string;

  // Hard thresholds
  min_income: {
    amount: number;
    currency: string;
    period: "monthly" | "yearly";
    family_surcharge: {
      spouse_pct: number;
      child_pct: number;
    };
  };
  allowed_work_types: WorkType[];
  business_owner_conditional: boolean;   // true = company_owner allowed but with restrictions
  business_owner_restrictions: string[]; // restriction descriptions (from JSON)
  local_work_prohibited: boolean;
  family_allowed: boolean | null;       // null = uncertain / not confirmed
  insurance_required: boolean | null;   // null = uncertain
  education_required: boolean;
  min_experience_years: number;
  required_documents: DocumentType[];

  // Scoring fields
  max_stay_months: number;
  initial_term_months: number;
  renewable: boolean;
  path_to_pr: boolean;
  path_to_pr_explicit: boolean;         // false = conditional / not guaranteed
  years_to_pr: number | null;

  tax_policy: {
    type: TaxType;
    foreign_income_exempt: boolean;
    foreign_income_conditional: boolean; // true = exemption is conditional, not automatic
    local_rate_pct: number;
    exemption_pct: number;
    benefit_duration_years: number;
    clarity: Level;
    description: string;
  };

  cost_of_living: {
    level: "low" | "medium" | "high";
    index_vs_nyc: number;
  };

  language_env: {
    english_friendly: Level;
    primary_language: string;
  };

  timezone: Timezone;

  infrastructure: {
    internet_quality: Level;
    coworking_availability: Level;
  };

  public_healthcare: boolean;
  public_education: boolean;
  last_verified_at: string;
}

// ---- Recommendation Result ----

export interface ScoreBreakdown {
  feasibility: number;
  stability: number;
  longterm: number;
  tax: number;
  lifestyle: number;
}

export interface Highlight {
  text: string;
  field: string;
}

export interface Risk {
  text: string;
  field: string;
  severity: "high" | "medium" | "low";
}

export interface CountryResult {
  country: CountryPolicy;
  status: "RECOMMENDED" | "EXCLUDED";
  score: number | null;
  tier?: string;
  breakdown?: ScoreBreakdown;
  highlights?: Highlight[];
  risks?: Risk[];
  exclude_reasons?: string[];
}
