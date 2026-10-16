import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata('/sp500-holdings', 'S&P 500 구성종목', 'S&P 500 지수의 구성종목과 비중 — VOO(Vanguard) 기준, 매일 자동 갱신.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
