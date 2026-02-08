"use client";

import { useState } from "react";
import type { UserAnswers, CountryResult } from "@/types";
import { recommend } from "@/engine/recommend";
import Questionnaire from "@/components/Questionnaire";
import ResultsPage from "@/components/ResultsPage";

type View = "hero" | "quiz" | "results";

export default function Home() {
  const [view, setView] = useState<View>("hero");
  const [results, setResults] = useState<CountryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnswers, setLastAnswers] = useState<UserAnswers | null>(null);

  const handleSubmit = async (answers: UserAnswers) => {
    setError(null);
    setLastAnswers(answers);
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details ?? data.error ?? `请求失败 (${res.status})`);
      }
      setResults(data as CountryResult[]);
      setView("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络或服务异常");
    } finally {
      setLoading(false);
    }
  };

  const handleFallback = (answers: UserAnswers) => {
    setError(null);
    const r = recommend(answers);
    setResults(r);
    setView("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setResults([]);
    setError(null);
    setView("hero");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-12 sm:h-14 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="font-bold text-brand-600 tracking-tight text-base sm:text-lg"
          >
            Suerte
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">
            数字游民国家推荐工具
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* ── Hero ── */}
        {view === "hero" && (
          <div className="flex flex-col items-center justify-center min-h-[65vh] sm:min-h-[70vh] text-center px-2">
            <div className="relative mb-5 sm:mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-200/40 via-violet-200/40 to-amber-200/40 rounded-full blur-2xl" />
              <span className="relative text-5xl sm:text-6xl">🌍</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-slate-900 mb-3 sm:mb-4 leading-tight">
              找到最适合你的
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-violet-600">
                数字游民目的地
              </span>
            </h1>
            <p className="text-slate-500 max-w-lg mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
              回答 14 个问题，系统将基于 10 个国家的签证政策数据，
              为你筛选评分并推荐最匹配的数字游民签证方案。
              <br />
              <span className="text-xs text-slate-400">
                所有政策数据可追溯来源 · 税务优惠标注条件性 · 不替代法律/税务建议
              </span>
            </p>
            <button
              onClick={() => setView("quiz")}
              className="px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold bg-brand-600 text-white
                hover:bg-brand-700 active:bg-brand-800 shadow-lg shadow-brand-200 transition-all
                hover:shadow-xl hover:shadow-brand-300
                hover:-translate-y-0.5 active:translate-y-0 min-h-[48px]"
            >
              开始测试 →
            </button>
            <p className="text-xs text-slate-300 mt-3 sm:mt-4">约 3–5 分钟</p>

            {/* feature badges */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-8 sm:mt-12">
              {[
                { icon: "🛡️", text: "政策数据可核验" },
                { icon: "🧮", text: "五维度评分模型" },
                { icon: "🌏", text: "覆盖 10 个热门国家" },
                { icon: "⚡", text: "3 分钟出结果" },
              ].map((f) => (
                <span
                  key={f.text}
                  className="text-[11px] sm:text-xs text-slate-500 bg-white border border-slate-100 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-sm"
                >
                  {f.icon} {f.text}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Questionnaire ── */}
        {view === "quiz" && (
          <>
            <Questionnaire onSubmit={handleSubmit} disabled={loading} />
            {loading && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 px-8 py-6 text-center max-w-sm mx-4">
                  <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-slate-700 font-medium">正在用 AI 分析推荐结果…</p>
                  <p className="text-xs text-slate-400 mt-1">请稍候</p>
                </div>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                <p className="font-medium">获取推荐失败</p>
                <p className="mt-1 text-red-600">{error}</p>
                <p className="mt-3 text-slate-600">可重试或改用本地规则计算：</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => lastAnswers && handleSubmit(lastAnswers)}
                    disabled={!lastAnswers}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    重试
                  </button>
                  <button
                    type="button"
                    onClick={() => lastAnswers && handleFallback(lastAnswers)}
                    disabled={!lastAnswers}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    使用本地规则计算
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Results ── */}
        {view === "results" && (
          <ResultsPage results={results} onReset={handleReset} />
        )}
      </main>

      {/* footer */}
      <footer className="border-t border-slate-100 py-5 sm:py-6 px-4 text-center text-[11px] sm:text-xs text-slate-300 leading-relaxed">
        Suerte © {new Date().getFullYear()} · 数据校验于 2026-02-07
        <br className="sm:hidden" />
        <span className="hidden sm:inline"> · </span>
        数据置信度：中 · 不构成法律或税务建议
      </footer>
    </>
  );
}
