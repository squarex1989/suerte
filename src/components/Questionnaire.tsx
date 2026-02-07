"use client";

import { useState } from "react";
import type {
  UserAnswers,
  WorkType,
  DocumentType,
  StayDuration,
  CostPref,
  LangPref,
  TzPref,
  InfraPref,
} from "@/types";

/* ──────── income brackets ──────── */
const INCOME_RANGES: { label: string; value: number }[] = [
  { label: "< $2,000", value: 1800 },
  { label: "$2,000 – $3,500", value: 2750 },
  { label: "$3,500 – $5,000", value: 4250 },
  { label: "$5,000 – $7,000", value: 6000 },
  { label: "$7,000 – $10,000", value: 8500 },
  { label: "> $10,000", value: 12000 },
];

/* ──────── default answers ──────── */
function defaults(): UserAnswers {
  return {
    nationality: "CN",
    has_spouse: false,
    num_children: 0,
    planned_stay: "uncertain",
    work_type: "overseas_remote_employee",
    monthly_income_usd: 0,
    income_stable: true,
    docs_available: [],
    can_buy_insurance: true,
    accept_no_local_work: true,
    want_long_term: false,
    cost_preference: "medium",
    language_preference: "english_priority",
    timezone_preference: "any",
    infra_requirement: "medium",
  };
}

/* ──────── tiny helpers ──────── */
function Radio({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm transition-all select-none
            ${
              value === o.value
                ? "border-brand-500 bg-brand-50 text-brand-700 font-medium shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function Checkbox({
  options,
  selected,
  onChange,
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(
      selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]
    );
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm transition-all select-none
            ${
              selected.includes(o.value)
                ? "border-brand-500 bg-brand-50 text-brand-700 font-medium shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(o.value)}
            onChange={() => toggle(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function Q({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/* ──────── sections ──────── */
const SECTIONS = [
  { title: "身份与停留计划", icon: "🛂" },
  { title: "工作与收入", icon: "💼" },
  { title: "合规能力", icon: "📋" },
  { title: "偏好与规划", icon: "🎯" },
];

/* ──────── main ──────── */
export default function Questionnaire({
  onSubmit,
}: {
  onSubmit: (a: UserAnswers) => void;
}) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<UserAnswers>(defaults());
  const u = <K extends keyof UserAnswers>(k: K, v: UserAnswers[K]) =>
    setA((p) => ({ ...p, [k]: v }));

  const canNext = (): boolean => {
    if (step === 1 && a.monthly_income_usd === 0) return false;
    return true;
  };

  const next = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit(a);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {SECTIONS.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                i <= step ? "text-brand-600" : "text-slate-300"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                  i < step
                    ? "bg-brand-600 text-white"
                    : i === step
                    ? "bg-brand-100 text-brand-700 ring-2 ring-brand-400"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-7">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          {SECTIONS[step].icon} {SECTIONS[step].title}
        </h2>

        {/* ── Step 0: identity ── */}
        {step === 0 && (
          <>
            <Q label="1. 你的国籍">
              <Radio
                name="nat"
                options={[
                  { label: "🇨🇳 中国", value: "CN" },
                  { label: "🌍 其他非 EU 国籍", value: "other" },
                ]}
                value={a.nationality}
                onChange={(v) => u("nationality", v as "CN" | "other")}
              />
            </Q>
            <Q label="2. 是否携带家属？">
              <div className="space-y-3">
                <Radio
                  name="spouse"
                  options={[
                    { label: "无配偶随行", value: "no" },
                    { label: "配偶随行", value: "yes" },
                  ]}
                  value={a.has_spouse ? "yes" : "no"}
                  onChange={(v) => u("has_spouse", v === "yes")}
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">子女人数：</span>
                  {[0, 1, 2, 3].map((n) => (
                    <label
                      key={n}
                      className={`cursor-pointer rounded-lg border w-10 h-10 flex items-center justify-center text-sm transition-all select-none
                        ${
                          a.num_children === n
                            ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                    >
                      <input
                        type="radio"
                        name="children"
                        checked={a.num_children === n}
                        onChange={() => u("num_children", n)}
                        className="sr-only"
                      />
                      {n}
                    </label>
                  ))}
                </div>
              </div>
            </Q>
            <Q label="3. 计划每年在目标国停留多长时间？">
              <Radio
                name="stay"
                options={[
                  { label: "< 90 天", value: "<90d" },
                  { label: "90–183 天", value: "90-183d" },
                  { label: "> 183 天", value: ">183d" },
                  { label: "不确定", value: "uncertain" },
                ]}
                value={a.planned_stay}
                onChange={(v) => u("planned_stay", v as StayDuration)}
              />
            </Q>
          </>
        )}

        {/* ── Step 1: work & income ── */}
        {step === 1 && (
          <>
            <Q label="4. 工作形态">
              <Radio
                name="work"
                options={[
                  { label: "海外公司远程雇员", value: "overseas_remote_employee" },
                  { label: "国内公司远程雇员", value: "domestic_remote_employee" },
                  { label: "自由职业（多客户）", value: "freelancer" },
                  { label: "自有公司（股东/经营）", value: "company_owner" },
                ]}
                value={a.work_type}
                onChange={(v) => u("work_type", v as WorkType)}
              />
            </Q>
            <Q label="5. 税前月收入（USD）" sub="用于判断是否满足各国门槛，选择最接近的区间">
              <Radio
                name="income"
                options={INCOME_RANGES.map((r) => ({
                  label: r.label,
                  value: String(r.value),
                }))}
                value={String(a.monthly_income_usd)}
                onChange={(v) => u("monthly_income_usd", Number(v))}
              />
            </Q>
            <Q label="6. 收入是否稳定？">
              <Radio
                name="stable"
                options={[
                  { label: "稳定", value: "yes" },
                  { label: "波动较大", value: "no" },
                ]}
                value={a.income_stable ? "yes" : "no"}
                onChange={(v) => u("income_stable", v === "yes")}
              />
            </Q>
          </>
        )}

        {/* ── Step 2: compliance ── */}
        {step === 2 && (
          <>
            <Q label="7. 你能提供以下哪些材料？" sub="多选">
              <Checkbox
                options={[
                  { label: "雇佣合同 / 客户合同", value: "employment_contract" },
                  { label: "近 3–6 个月银行流水", value: "bank_statement" },
                  { label: "无犯罪记录证明", value: "criminal_record" },
                  { label: "学历或工作经验证明", value: "education_or_experience" },
                ]}
                selected={a.docs_available}
                onChange={(v) => u("docs_available", v as DocumentType[])}
              />
            </Q>
            <Q label="8. 是否可购买私人医疗保险？">
              <Radio
                name="ins"
                options={[
                  { label: "可以", value: "yes" },
                  { label: "不确定 / 不愿意", value: "no" },
                ]}
                value={a.can_buy_insurance ? "yes" : "no"}
                onChange={(v) => u("can_buy_insurance", v === "yes")}
              />
            </Q>
            <Q label="9. 是否接受「不得为当地公司/客户工作」的限制？">
              <Radio
                name="local"
                options={[
                  { label: "可以接受", value: "yes" },
                  { label: "无法接受", value: "no" },
                ]}
                value={a.accept_no_local_work ? "yes" : "no"}
                onChange={(v) => u("accept_no_local_work", v === "yes")}
              />
            </Q>
          </>
        )}

        {/* ── Step 3: preferences ── */}
        {step === 3 && (
          <>
            <Q label="10. 是否希望未来转为长期居留 / 永居？">
              <Radio
                name="lt"
                options={[
                  { label: "是，非常重要", value: "yes" },
                  { label: "不太在意", value: "no" },
                ]}
                value={a.want_long_term ? "yes" : "no"}
                onChange={(v) => u("want_long_term", v === "yes")}
              />
            </Q>
            <Q label="11. 生活成本偏好">
              <Radio
                name="cost"
                options={[
                  { label: "越低越好", value: "low" },
                  { label: "中等即可", value: "medium" },
                  { label: "不在意", value: "insensitive" },
                ]}
                value={a.cost_preference}
                onChange={(v) => u("cost_preference", v as CostPref)}
              />
            </Q>
            <Q label="12. 语言环境偏好">
              <Radio
                name="lang"
                options={[
                  { label: "英语优先", value: "english_priority" },
                  { label: "可以学当地语言", value: "can_learn" },
                ]}
                value={a.language_preference}
                onChange={(v) => u("language_preference", v as LangPref)}
              />
            </Q>
            <Q label="13. 时区偏好">
              <Radio
                name="tz"
                options={[
                  { label: "亚洲时区", value: "asia" },
                  { label: "欧洲时区", value: "europe" },
                  { label: "无所谓", value: "any" },
                ]}
                value={a.timezone_preference}
                onChange={(v) => u("timezone_preference", v as TzPref)}
              />
            </Q>
            <Q label="14. 网络与基础设施要求">
              <Radio
                name="infra"
                options={[
                  { label: "高（依赖稳定高速网络）", value: "high" },
                  { label: "中等（一般即可）", value: "medium" },
                ]}
                value={a.infra_requirement}
                onChange={(v) => u("infra_requirement", v as InfraPref)}
              />
            </Q>
          </>
        )}

        {/* nav */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              step === 0
                ? "invisible"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
            onClick={() => setStep(step - 1)}
          >
            ← 上一步
          </button>
          <button
            disabled={!canNext()}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-brand-600 text-white
              hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            onClick={next}
          >
            {step < 3 ? "下一步 →" : "查看推荐结果"}
          </button>
        </div>
      </div>
    </div>
  );
}
