import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata('/simulator/custom', '적립 시뮬레이터', '종목·일 투자액·목돈·목표 금액을 바꿔 1971년 이후 모든 시작 시점에서 목표까지 몇 년 걸렸는지 확인한다.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
