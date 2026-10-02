@AGENTS.md

# 작업 규칙

## 용어 규칙
- ETF 티커(QQQ)는 기술적 식별자(URL, 데이터 키 등)에는 그대로 사용해도 되지만, UI 레이블·제목·네비게이션 등 사용자에게 보이는 텍스트에서는 **나스닥100**으로 표기한다.

## 빌드 / 배포
- `npm run build` 는 사용자가 명시적으로 요청할 때만 실행한다. 코드 변경 후 자동으로 빌드 검증하지 말 것.
- `npm run dev` (개발 서버 실행) 및 브라우저 동작 확인은 사용자가 명시적으로 요청할 때만 한다. 코드 변경 후 자동으로 서버를 띄워 확인하지 말 것.
- `npx tsc --noEmit` 등 타입 검사도 사용자가 명시적으로 요청할 때만 실행한다.
- git push 및 배포 작업은 별도 확인 없이 진행해도 된다.

## 백테스트 데이터

포스트나 시뮬레이터에 데이터를 연결할 때, 새 JSON을 생성하기 전에 **`../scripts/BACKTEST_DATA.md`를 먼저 읽어라.**
이미 원하는 파라미터로 생성된 파일이 있으면 재실행 없이 그 파일을 사용한다.

## 블로그 포스트 작성 규칙

### 표 + 데이터 연결 (필수)
포스트에 비교 표(방식별 결과, 전략별 통계 등)를 만들 때는 반드시 실제 코호트 데이터와 연결해야 한다.

**절차:**
1. Python 스크립트로 코호트 단위 결과를 JSON으로 export → `web/public/data/` 저장
2. `/posts/[slug]/data/page.tsx` 데이터 뷰어 페이지 생성
   - 종목·방식 선택 탭/버튼
   - 전체 코호트 테이블: 진입 시점 / 소요기간 / 완료여부 / 달성 시점
   - 최장(worst-case) 행 빨간색 강조
   - URL 파라미터(`?inst=xxx&m=yyy`)로 딥링크 지원
3. 포스트 표의 각 행 마지막 열에 `데이터 →` 링크 추가 (`DataLink` 컴포넌트)
   - 링크는 `/posts/[slug]/data?inst=...&m=...` 형태로 해당 방식 미리 선택

**예시 구조:**
```
/posts/lump-sum-vs-split/page.tsx       ← 분석 글 (표 + 데이터 → 링크)
/posts/lump-sum-vs-split/data/page.tsx  ← 전체 코호트 뷰어
/public/data/split_entry_ndx3x.json    ← 코호트 데이터 (Python export)
```

**DataLink 컴포넌트 패턴:**
```tsx
function DataLink({ inst, m }: { inst: string; m: string }) {
  return (
    <Link
      href={`/posts/[slug]/data?inst=${inst}&m=${m}`}
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap"
    >
      데이터 →
    </Link>
  )
}
```
