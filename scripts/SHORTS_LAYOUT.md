# YouTube Shorts 레이아웃 명세

> `scripts/generate_shorts.py` 의 프레임 렌더링 기준 문서.
> 레이아웃을 수정할 때, 또는 새 세션에서 이어서 작업할 때 이 파일을 먼저 읽을 것.

---

## 캔버스 기본값

| 항목 | 값 |
|------|-----|
| 해상도 | 1080 × 1920 px |
| 배경 | 흰색 `(255, 255, 255)` |
| 기준 좌우 여백 (`PAD`) | 48 px |
| 우측 안전여백 (`RIGHT_SAFE`) | 130 px (YouTube 리액션 버튼 가림 방지) |
| 최대 영상 길이 (`MAX_SEC`) | 65초 (마지막 5초 고정 포함) |
| 기본 FPS (`BASE_FPS`) | 30 |
| 실제 FPS | `max(30, ceil(total_frames / MAX_SEC))` |

**YouTube Shorts 안전영역** (콘텐츠를 이 범위 밖에 두지 말 것):
- 상단 180 px: 진행바/제목
- 하단 390 px: 좋아요·공유·댓글 버튼 → 차트를 y=1500 이하로 내리지 말 것
- 우측 120 px: 리액션 버튼 → 텍스트 우측 끝을 x=950 (W-130) 이하로

---

## 색상 팔레트

| 변수 | RGB | 용도 |
|------|-----|------|
| `BG` | `(255,255,255)` | 배경 |
| `BLACK` | `(26,26,26)` | 기본 텍스트 |
| `DGRAY` | `(80,80,80)` | 부제목·레이블 |
| `GRAY` | `(136,136,136)` | 보조 텍스트 |
| `LGRAY` | `(210,210,210)` | 구분선·테두리 |
| `PALE` | `(248,248,248)` | 헤더 배경 |
| `RED` | `(204,0,0)` | **수익/상승** (한국식: 빨강=이익) |
| `BLUE` | `(0,51,204)` | **손실/하락** (한국식: 파랑=손실) |
| `CBLUE` | `(0,102,204)` | 차트 선·채움 |
| `CTARGET` | `(200,50,50)` | 목표 10억 기준선 |

> 중요: 한국 주식 앱 관례에 따라 **빨강=수익, 파랑=손실**. 반대로 쓰지 말 것.

---

## 폰트

- 일반체: `C:/Windows/Fonts/malgun.ttf` (맑은 고딕)
- 굵은체: `C:/Windows/Fonts/malgunbd.ttf`
- 헬퍼: `fnt(size, bold=False)`
- **주의**: `−` (U+2212 minus sign) 은 맑은 고딕에서 □ 박스로 렌더링됨 → 반드시 `-` (U+002D hyphen) 사용

---

## 구역별 Y 좌표 배치

```
Y=0    ┌──────────────────────────────┐
       │  PALE 배경                    │  헤더 영역
Y=128  ├──────────────────────────────┤  ← LGRAY 구분선 (width=2)
       │  계좌행: ACCOUNT_STR          │
Y=220  ├──────────────────────────────┤  ← 날짜 박스 (rounded rect)
       │  날짜행                        │
Y=308  ├──────────────────────────────┤  ← LGRAY 구분선 (width=2)
Y=318  ┌──────────────────────────────┐
       │  요약 박스 (rounded rect)      │  BOX_H=290
       │  - 총 평가손익 (상단)           │
       │  - 구분선 y=460               │
       │  - 매입금액 / 평가금액          │
       │  - 원화예수금 / 원화추정자산     │
Y=608  └──────────────────────────────┘
Y=628  ├──────────────────────────────┤  ← TABLE_Y (상단 구분선 width=2)
       │  종목 테이블 헤더               │  TABLE_H=196
       │  ─────────────────── (width=2) │
       │  종목 데이터 행                 │
Y=824  ├──────────────────────────────┤  ← 하단 구분선 (width=1)
Y=880  │                              │  ← CHART_TOP
       │  포트폴리오 차트                │  CHART_H=620
Y=1500 │                              │  ← CHART_BOT (YouTube 안전영역 상한)
Y=1528 ├──────────────────────────────┤  ← 달성률 바 시작 (BY=CHART_BOT+28)
       │  목표 달성 X.X% 텍스트         │
       │                              │
       │  (여백 — YouTube UI 가림)      │
Y=1920 └──────────────────────────────┘
```

---

## 각 구역 상세

### 1. 헤더 (y=0~128)
- 배경: `PALE`
- 좌상단: "가상계좌 시뮬레이션" `fnt(22)` GRAY
- 가운데: "특정일잔고" `fnt(52, bold=True)` BLACK

### 2. 계좌행 (y=128~220)
- `ACCOUNT_STR = "****-**65 [위탁종합] 해리"` `fnt(34)` BLACK
- 텍스트 위치: `(PAD, Y+28)`

### 3. 날짜행 (y=220~308)
- rounded_rectangle: `[PAD, Y+8, W-PAD, Y+70]` radius=8 outline=LGRAY
- **좌측 고정**: `"시작: YYYY.MM.DD"` `fnt(30)` GRAY, `(PAD+16, Y+17)`
- **우측 변화**: `"YYYY.MM.DD  D+XXX일"` `fnt(30)` BLACK, right-align at `W-PAD-16`
- elapsed = `(snap["date"] - start_date).days` (달력 기준)

### 4. 요약 박스 (y=318~608, BOX_H=290)
- rounded_rectangle radius=14 outline=LGRAY

**총 평가손익 행 (y=318~460)**:
- 좌: "총 평가손익" `fnt(34, bold=True)` BLACK, `(PAD+24, Y+38)`
- 가운데: `"+XXX,XXX원"` `fnt(46, bold=True)` color, centered at `W//2`
- 우: `"+XX.XX%  +"` `fnt(34, bold=True)` color, right-align at `W-PAD-24`

**구분선**: `y=Y+142` (PAD+16 ~ W-PAD-16)

**매입금액/평가금액 행 (y=Y+162)**:
- 좌: "매입금액" `fnt(30)` DGRAY + 금액 `fnt(30, bold=True)` BLACK right-align at `W//2-24`
- 우: "평가금액" `fnt(30)` DGRAY + 금액 `fnt(30, bold=True)` BLACK right-align at `W-PAD-24`

**원화예수금/원화추정자산 행 (y=Y+220)**:
- 좌: "원화예수금" `fnt(30)` DGRAY + "0원" `fnt(30, bold=True)` BLACK
- 우: "원화추정자산" `fnt(30)` DGRAY + 금액 `fnt(30, bold=True)` BLACK

### 5. 종목 테이블 (TABLE_Y=628, TABLE_H=196)

**수직 구분선** x 위치: `[260, 452, 692]` (4컬럼)

| 컬럼 | 범위 | 내용 |
|------|------|------|
| 종목명 | 0~260 | left-align at PAD |
| 보유수량 | 260~452 | right-align at C_QTY=442 |
| 매입가/현재가 | 452~692 | right-align at C_PX=682 |
| 수익금/수익률 | 692~1080 | right-align at C_PNL=950 (W-RIGHT_SAFE) |

**헤더 폰트**: `fnt(26)` GRAY (한 줄: "종목명" / "보유수량" / "매입가/현재가" / "수익금/수익률")

**데이터 행 (TY = TABLE_Y+52)**:
- 종목명 3줄: "PROETF ULTRA" `fnt(27, bold)`, "PRO QQQ" `fnt(27, bold)`, "TQQQ" `fnt(24)` GRAY
- 보유수량: `fnt(28, bold=True)` BLACK, right-align at TY+30
- 매입가 (위): `fnt(32, bold=True)` BLACK, right-align at TY+8
- 현재가 (아래): `fnt(32, bold=True)` color, right-align at TY+50
- 수익금 (위): `fnt(32, bold=True)` color, right-align at TY+8
- 수익률 (아래): `fnt(32, bold=True)` color, right-align at TY+50

> 수익금은 USD 기준: `pnl_usd = pnl_krw / EXCHANGE_RATE`

### 6. 차트 (y=880~1500)
- X축: 날짜 인덱스 기준, PAD ~ W-PAD
- Y축: 0 ~ max(port_max×1.05, 10억×1.05)
- **목표선**: y=10억, `CTARGET` 색 점선 width=2, 우측에 "목표 10억" 레이블
- **Y축 눈금**: 2억, 5억, 10억 (최대값 미만일 때만)
- **투자금 선**: LGRAY alpha=200, width=2
- **포트폴리오**: CBLUE 채움 alpha=28, 선 width=3, 현재점 원 r=8

### 7. 달성률 바 (y=1528~)
- 전체 바: LGRAY, rounded radius=11, height=22
- 채움 바: CBLUE
- 텍스트: "목표 달성 X.X%" `fnt(26)` DGRAY, 가운데 정렬, y=BY+38

---

## 시뮬레이션 파라미터

| 항목 | 값 |
|------|-----|
| 일일 투자금 | 200,000 KRW = $153.85 USD (환율 1300 고정) |
| 목표금액 | 10억 KRW |
| 전략 | A전략: 매일 동일금액 매수, 목표 달성 시 종료 |
| TQQQ 시작가 | $1.00 USD (1971-02-05 합성) |
| NDX 일수익률 배수 | 3× |
| 데이터 파일 | `data/ndx_1971_now.csv` |
| 1985-10 스플라이스 보정 | 1985-10-01 기준 이전/이후 Close 스케일 맞춤 |

---

## 영상 생성 파이프라인

```
simulate() → 일별 snap 리스트
  ↓
FPS = max(30, ceil(total / MAX_SEC=65))
  ↓
frames_to_render = range(0, total, step)
  ↓
각 프레임: render(snap, hp, hi, start_date) → PNG bytes → ffmpeg stdin
  ↓
마지막 프레임 × (5 × FPS)장 추가 (5초 고정)
  ↓
ffmpeg: libx264, yuv420p, crf=20, preset=fast
```

**실행 방법**:
```bash
python scripts/generate_shorts.py --start 1971-02
python scripts/generate_shorts.py --start 2000-01 --out output/shorts/2000-01.mp4
```

---

## 자주 있는 수정 포인트

| 수정 내용 | 변경할 상수/위치 |
|-----------|----------------|
| 영상 최대 길이 변경 | `MAX_SEC` |
| 마지막 고정 시간 변경 | `make_video()` 끝의 `int(5 * fps)` |
| 차트 높이 조절 | `CHART_TOP`, `CHART_BOT` |
| 우측 안전여백 조절 | `RIGHT_SAFE` |
| 계좌명 변경 | `ACCOUNT_STR` |
| 목표금액 변경 | `TARGET_KRW` |
| 일일 투자금 변경 | `DAILY_INVEST_KRW` |
| 환율 변경 | `EXCHANGE_RATE` |
