# YouTube 쇼츠 고정 댓글 생성 가이드

> `generate_comment.py`로 고정 댓글 텍스트를 자동 생성한다.
> 새 세션에서 이 파일 하나 읽으면 바로 사용 가능.

---

## 개요

시작월을 입력하면:
1. TQQQ 적립 시뮬레이션 실행 → 소요기간·투입원금 계산
2. 해당 기간 S&P500 주요 낙폭 사건 자동 필터링 (mcv-nextjs 데이터)
3. 유튜브 고정 댓글용 텍스트 출력

---

## 사용법

```bash
# 기본 (이벤트 4개)
python scripts/generate_comment.py --start 1971-02

# 이벤트 개수 조절
python scripts/generate_comment.py --start 2000-01 --top 5
```

---

## 출력 예시

```
📈 TQQQ 매일 20만원 적립 | 1971-02 시작 → 9.5년 후 10억 달성
💰 투입 원금 4.8억원 · 운용보수+스왑금리 반영 · 환율 1,300원 고정

📅 1971~1980년 사이에 있었던 일들:
• 1973-01  1973-74년 오일쇼크 / 워터게이트 약세장 (-48%)
• 1974-08  1974년 닉슨 대통령 사임 (-21%)
• 1976-09  1976-78년 스태그플레이션 조정 (-19%)
• 1980-02  1980년 경기침체 조정 (-17%)

이 모든 걸 버티고 10억 달성했습니다 💰
더 많은 진입 시점 분석 → justkeepbuyingtqqq.vercel.app
```

출력을 그대로 복사해서 YouTube 고정 댓글로 붙여넣으면 된다.

---

## 파일 구조

```
scripts/
  generate_comment.py       ← 메인 스크립트
  COMMENT_GUIDE.md          ← 이 파일

의존 경로 (하드코딩):
  D:/mcv-nextjs/public/data/sp500/sp500_corrections_history.json
  ← S&P500 낙폭 이벤트 데이터 (478개, 1871~2026)
```

---

## 설정값

| 항목 | 값 | 설명 |
|------|-----|------|
| `MIN_DRAWDOWN` | -15% | 이보다 작은 낙폭은 무시 |
| `--top` | 4 (기본) | 표시할 이벤트 수 |
| 가격 모드 | `with_costs` | 운용보수 + 스왑금리 반영 고정 |
| 환율 | 1,300원 고정 | |

---

## 이벤트 데이터 출처

`D:/mcv-nextjs/public/data/sp500/sp500_corrections_history.json`

- S&P500 기준 -5% 이상 낙폭 이벤트 478개 수록
- `name_ko` (한국어 이름), `peak_date`, `drawdown_pct` 필드 사용
- 같은 달 이벤트 중복 시 낙폭 큰 것만 선택
- `peak_date`가 시뮬레이션 구간 내에 있는 이벤트만 포함
