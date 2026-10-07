import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION = "TQQQ 매일 적립으로 10억 → 25% 룰로 꺼내 쓰기. 1971년 이후 모든 시작 시점을 비용·세금까지 넣어 백테스트한 결과와 매일 갱신되는 매매 신호.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "justkeepbuyingtqqq — TQQQ 장기 적립과 인출",
    template: "%s | justkeepbuyingtqqq",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
    title: "justkeepbuyingtqqq — TQQQ 장기 적립과 인출",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
