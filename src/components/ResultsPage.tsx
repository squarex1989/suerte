"use client";

import type { CountryResult } from "@/types";
import CountryCard from "./CountryCard";

export default function ResultsPage({
  results,
  onReset,
}: {
  results: CountryResult[];
  onReset: () => void;
}) {
  const recommended = results.filter((r) => r.status === "RECOMMENDED");
  const excluded = results.filter((r) => r.status === "EXCLUDED");

  const topTier = recommended.filter((r) => (r.score ?? 0) >= 75).length;
  const midTier = recommended.filter(
    (r) => (r.score ?? 0) >= 55 && (r.score ?? 0) < 75
  ).length;

  return (
    <div className="mx-auto max-w-3xl">
      {/* summary */}
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          为你找到 {recommended.length} 个推荐国家
        </h2>
        <p className="text-slate-500 text-sm">
          {topTier > 0 && (
            <span className="text-amber-600 font-medium">
              {topTier} 个强烈推荐
            </span>
          )}
          {topTier > 0 && midTier > 0 && "，"}
          {midTier > 0 && (
            <span className="text-blue-600 font-medium">
              {midTier} 个值得考虑
            </span>
          )}
          {excluded.length > 0 && (
            <span className="text-slate-400">
              ，{excluded.length} 个不符合条件
            </span>
          )}
        </p>
      </div>

      {/* recommended cards */}
      <div className="space-y-4">
        {recommended.map((r) => (
          <CountryCard key={r.country.country_id} r={r} />
        ))}
      </div>

      {/* excluded */}
      {excluded.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
            <span className="h-px flex-1 bg-slate-100" />
            未通过筛选的国家
            <span className="h-px flex-1 bg-slate-100" />
          </h3>
          <div className="space-y-3">
            {excluded.map((r) => (
              <CountryCard key={r.country.country_id} r={r} />
            ))}
          </div>
        </div>
      )}

      {/* disclaimer */}
      <div className="mt-10 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400 leading-relaxed">
        <p className="font-medium text-slate-500 mb-1">⚖️ 免责声明</p>
        <p>
          本页面基于公开政策信息整理，不构成法律或税务建议。签证及税务规则可能更新，请在申请前核实官方信息。推荐评分仅供参考，不承诺获签结果。
        </p>
      </div>

      {/* reset */}
      <div className="text-center mt-8 pb-8">
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-lg text-sm font-medium border border-slate-200
            text-slate-600 hover:bg-slate-50 transition-colors"
        >
          重新测试
        </button>
      </div>
    </div>
  );
}
