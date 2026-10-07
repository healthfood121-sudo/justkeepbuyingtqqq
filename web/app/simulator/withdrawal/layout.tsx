import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata('/simulator/withdrawal', '인출 시뮬레이터', '시작 시점과 금액을 골라 25% 룰로 꺼내 쓰면 자산과 생활비가 어떻게 움직였는지 확인한다.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
