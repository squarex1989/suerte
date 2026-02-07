import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suerte — 数字游民国家推荐",
  description:
    "基于政策数据的结构化决策辅助工具，帮助 IT 远程从业者选择最适合的数字游民签证目的地。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
