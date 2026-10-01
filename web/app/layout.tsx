import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "justkeepbuyingtqqq — 레버리지 ETF 장기투자 백테스트",
  description: "TQQQ·QLD·QQQ·VOO 레버리지 ETF 적립식 투자의 55년 역사 데이터 기반 백테스트. 내 파라미터로 10억 목표 달성 시뮬레이션.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950">{children}</body>
    </html>
  );
}
