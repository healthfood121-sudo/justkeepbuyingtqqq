import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata('/nasdaq100-holdings', '나스닥100 구성종목', '나스닥100 지수의 구성종목과 비중 — 매일 자동 갱신.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
