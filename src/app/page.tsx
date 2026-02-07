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

  const handleSubmit = (answers: UserAnswers) => {
    const r = recommend(answers);
    setResults(r);
    setView("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setResults([]);
    setView("hero");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="font-bold text-brand-600 tracking-tight text-lg"
          >
            Suerte
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">
            数字游民国家推荐工具
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Hero ── */}
        {view === "hero" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-200/40 via-violet-200/40 to-amber-200/40 rounded-full blur-2xl" />
              <span className="relative text-6xl">🌍</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
              找到最适合你的
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-violet-600">
                数字游民目的地
              </span>
            </h1>
            <p className="text-slate-500 max-w-lg mb-8 leading-relaxed">
              回答 14 个问题，系统将基于 10 个国家的签证政策数据，
              为你筛选评分并推荐最匹配的数字游民签证方案。
              <br />
              <span className="text-xs text-slate-400">
                所有政策数据可追溯来源，不替代法律/税务建议
              </span>
            </p>
            <button
              onClick={() => setView("quiz")}
              className="px-8 py-3.5 rounded-xl text-base font-semibold bg-brand-600 text-white
                hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all hover:shadow-xl hover:shadow-brand-300
                hover:-translate-y-0.5 active:translate-y-0"
            >
              开始测试 →
            </button>
            <p className="text-xs text-slate-300 mt-4">约 3–5 分钟</p>

            {/* feature badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-12">
              {[
                { icon: "🛡️", text: "政策数据可核验" },
                { icon: "🧮", text: "五维度评分模型" },
                { icon: "🌏", text: "覆盖 10 个热门国家" },
                { icon: "⚡", text: "3 分钟出结果" },
              ].map((f) => (
                <span
                  key={f.text}
                  className="text-xs text-slate-500 bg-white border border-slate-100 rounded-full px-3 py-1.5 shadow-sm"
                >
                  {f.icon} {f.text}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Questionnaire ── */}
        {view === "quiz" && <Questionnaire onSubmit={handleSubmit} />}

        {/* ── Results ── */}
        {view === "results" && (
          <ResultsPage results={results} onReset={handleReset} />
        )}
      </main>

      {/* footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-300">
        Suerte © {new Date().getFullYear()} · 数据更新于 2026-01
        · 不构成法律或税务建议
      </footer>
    </>
  );
}
