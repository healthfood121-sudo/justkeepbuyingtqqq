import Header from '@/components/Header'

// /private 아래 모든 페이지(위대한 기업·종목 아이디어·로그인)에 사이트 헤더를 항상 붙인다
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header maxWidth="max-w-4xl" activePage="private" />
      {children}
    </>
  )
}
