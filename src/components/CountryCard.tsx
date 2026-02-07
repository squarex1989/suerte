"use client";

import { useState } from "react";
import type { CountryResult } from "@/types";

const DIM_LABELS: Record<string, string> = {
  feasibility: "可行性",
  stability: "稳定性",
  longterm: "长期潜力",
  tax: "税务友好",
  lifestyle: "生活适配",
};
const DIM_MAX: Record<string, number> = {
  feasibility: 40,
  stability: 20,
  longterm: 15,
  tax: 15,
  lifestyle: 10,
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-slate-500 w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}

const TIER_STYLE: Record<string, string> = {
  "⭐ 强烈推荐":
    "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-800",
  "👍 值得考虑":
    "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800",
  "ℹ️ 可作备选":
    "bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 text-slate-700",
  "⚠️ 匹配度较低":
    "bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-red-700",
};

const DIM_COLORS = [
  "bg-brand-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-cyan-500",
];

export default function CountryCard({ r }: { r: CountryResult }) {
  const [open, setOpen] = useState(false);
  const c = r.country;

  if (r.status === "EXCLUDED") {
    return (
      <div className="bg-white/60 rounded-xl border border-slate-100 p-5 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{c.flag}</span>
            <div>
              <h3 className="font-semibold text-slate-500">{c.name}</h3>
              <p className="text-xs text-slate-400">{c.visa_name}</p>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
            不符合条件
          </span>
        </div>
        <ul className="mt-3 space-y-1">
          {r.exclude_reasons?.map((reason, i) => (
            <li key={i} className="text-xs text-red-400 flex items-start gap-1.5">
              <span className="mt-0.5">✕</span> {reason}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const tierStyle = TIER_STYLE[r.tier ?? ""] ?? TIER_STYLE["ℹ️ 可作备选"];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{c.flag}</span>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
              <p className="text-xs text-slate-400">{c.visa_name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-600 tabular-nums">
              {r.score}
            </div>
            <span
              className={`inline-block text-xs px-2.5 py-0.5 rounded-full border mt-1 font-medium ${tierStyle}`}
            >
              {r.tier}
            </span>
          </div>
        </div>

        {/* highlights */}
        <div className="space-y-1.5 mb-3">
          {r.highlights?.map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-emerald-700">
              <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
              <span>{h.text}</span>
            </div>
          ))}
        </div>

        {/* risks */}
        <div className="space-y-1.5">
          {r.risks?.map((rk, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
              <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
              <span>{rk.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* expand toggle */}
      <button
        className="w-full text-xs text-center py-2.5 text-slate-400 hover:text-brand-600
          hover:bg-slate-50 border-t border-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? "收起详情 ▲" : "展开评分详情 ▼"}
      </button>

      {/* detail panel */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-slate-50">
          <p className="text-xs text-slate-400 pt-3">五维度评分明细</p>
          {r.breakdown &&
            Object.entries(r.breakdown).map(([key, val], i) => (
              <div key={key}>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{DIM_LABELS[key]}</span>
                  <span>
                    {val}/{DIM_MAX[key]}
                  </span>
                </div>
                <Bar
                  value={val}
                  max={DIM_MAX[key]}
                  color={DIM_COLORS[i % DIM_COLORS.length]}
                />
              </div>
            ))}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
            <p className="text-xs text-slate-400">
              税务政策：{c.tax_policy.description}
            </p>
          </div>
          <p className="text-xs text-slate-300">
            数据校验于 {c.last_verified_at}
          </p>
        </div>
      )}
    </div>
  );
}
