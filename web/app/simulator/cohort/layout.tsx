import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata('/simulator/cohort', '시작 시점별 적립 경로', '한 시작 시점을 골라 매일 적립했을 때 자산이 목표까지 가는 경로를 본다.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
