# 적립식 쇼츠 제작 가이드

> 새 세션에서 이 파일 하나 읽으면 영상 생성 → 업로드까지 전부 할 수 있다.
> 레이아웃 세부 명세는 `SHORTS_LAYOUT.md` 참고.

---

## 개요

매일 20만원 TQQQ 적립 시뮬레이션을 1071-02부터 각 시작월별로 영상으로 만든다.
목표: 10억 달성까지의 일별 잔고 변화를 키움증권 잔고 화면 스타일로 렌더링한 YouTube Shorts.

---

## 파일 구조

```
scripts/
  generate_shorts.py        ← 영상 생성 (메인)
  upload_short.py           ← YouTube 업로드
  data_loader.py            ← 가격 데이터 공통 모듈 (스왑금리 포함/미포함)
  SHORTS_GUIDE.md           ← 이 파일
  SHORTS_LAYOUT.md          ← 렌더러 레이아웃 명세

config/                     ← gitignore 처리됨
  client_secret_justkeepbuyingtqqq.json   ← YouTube OAuth 클라이언트 시크릿
  token_justkeepbuyingtqqq.json           ← OAuth 토큰 (자동 갱신)

output/shorts/
  1971-02.mp4               ← standard 모드 출력 (운용보수만)
  1971-02_costs.mp4         ← with_costs 모드 출력 (운용보수 + 스왑금리)

web/public/data/
  youtube_shorts.json       ← 업로드 완료된 쇼츠 URL 맵 {start_ym: youtube_url}
```

---

## 가격 모드 두 가지

`generate_shorts.py`는 `data_loader.py`를 통해 TQQQ 합성가격을 계산한다.

| 모드 | 비용 | 설명 |
|------|------|------|
| `standard` | 운용보수 0.88%/년 | 기본값. 웹 시뮬레이터 기본값과 동일 |
| `with_costs` | 운용보수 0.88% + 스왑금리(2×연방기금금리)/년 | 현실 반영. 고금리 시대엔 차이 큼 |

**스왑금리 영향이 큰 이유:**
- 1981년 연방기금금리 최고 20% → 스왑비용 2×20% = **40%/년** 추가 드래그
- 2010년대 제로금리 시절은 차이 거의 없음
- 1971-02 시작 기준: standard 7.6년 → with_costs 9.6년 (2년 차이)

**공식 버전: `with_costs`** (운용보수 + 스왑금리 반영)
- `upload_short.py`가 `{start_ym}_costs.mp4`를 우선 탐색하도록 설정됨
- YouTube 설명에 "운용보수(0.88%/년) 및 스왑금리비용 반영" 문구 자동 삽입

---

## 영상 만들기

```bash
# standard 모드 (운용보수만)
python scripts/generate_shorts.py --start 1971-02
# → output/shorts/1971-02.mp4

# with_costs 모드 (운용보수 + 스왑금리)
python scripts/generate_shorts.py --start 1971-02 --mode with_costs
# → output/shorts/1971-02_costs.mp4

# 출력 경로 직접 지정
python scripts/generate_shorts.py --start 2000-01 --out output/shorts/custom.mp4
```

영상 자막이 모드에 따라 자동으로 달라진다:
- standard: `"매일 20만원 · TQQQ 적립 시뮬레이션"`
- with_costs: `"매일 20만원 · TQQQ 적립 (운용비·스왑금리 반영)"`

---

## YouTube 업로드

```bash
# 비공개로 업로드 (기본)
python scripts/upload_short.py 1971-02

# 즉시 공개
python scripts/upload_short.py 1971-02 --public

# 예약 발행
python scripts/upload_short.py 1971-02 --schedule "2026-10-10T08:00:00+09:00"

# 파일 직접 지정 (with_costs 버전 올릴 때)
python scripts/upload_short.py 1971-02 --video output/shorts/1971-02_costs.mp4
```

업로드 후 `web/public/data/youtube_shorts.json`이 자동으로 갱신된다.
이 파일이 갱신되면 웹사이트 각 시뮬레이션 페이지의 YouTube 버튼이 활성화된다.

**탐색 우선순위:** `{start_ym}_costs.mp4` → `{start_ym}.mp4` 순서로 자동 탐색.
`--video` 없이 실행하면 costs 버전이 있으면 자동으로 그걸 쓴다.

---

## 아직 안 된 것

| 항목 | 상태 | 비고 |
|------|------|------|
| QLD / QQQ / SP500 영상 | ❌ 미구현 | 종목명이 TQQQ로 하드코딩됨 |
| 배치 생성 | ❌ 미구현 | 668개 시작월 한꺼번에 돌리는 루프 스크립트 없음 |
| with_costs 업로드 자동화 | ⚠️ 부분 완성 | `--video` 수동 지정 필요. 설명 문구도 수정 필요 |
| 인출식 쇼츠 | ❌ 미테스트 | `generate_withdrawal_shorts.py` 작성됐지만 한 번도 실행 안 함 |

---

## 코드 수정 포인트

### 다른 종목 지원하려면

`generate_shorts.py`에서 아래 부분 수정:

```python
# render() 안 종목 테이블 (현재 TQQQ 고정)
draw.text((PAD, TY),      "PROETF ULTRA", ...)
draw.text((PAD, TY + 34), "PRO QQQ",      ...)
draw.text((PAD, TY + 68), "TQQQ",         ...)

# load_tqqq() 에서 d['ndx3x'] 대신 d['ndx2x'] / d['ndx1x'] 사용
```

### 배치 생성 방법 (임시)

```bash
for m in 1971-02 1971-03 1971-04 ...; do
  python scripts/generate_shorts.py --start $m
done
```

668개 시작월 목록은 `web/public/data/cohorts_ndx3x_10b.json`의 `rows[].s` 필드에 있다.

---

## 검증된 수치 (참고용)

| 시작월 | standard | with_costs | 차이 |
|--------|----------|------------|------|
| 1971-02 | 7.6년 (1,901일) | 9.6년 (2,401일) | +2.0년 |

고금리 시대 시작월일수록 with_costs와 standard의 격차가 벌어진다.
