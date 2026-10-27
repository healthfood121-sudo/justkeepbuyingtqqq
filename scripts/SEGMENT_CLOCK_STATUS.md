# 사업부별 시계 진행 현황

`/private` 이익 시계 아래 "사업부별 시계"(`web/app/private/page.tsx`).
마지막 정리: 2026-10-27

## 두 가지 방식

| 방식 | 코드 위치 | 숫자 출처 | 새 실적이 나오면 |
|---|---|---|---|
| **직접 조사** (80곳) | `SEGMENTS` | 회사 실적 발표의 사업부 매출·이익(일부 추정) | **손으로 고쳐야 함** — 아래 "업데이트 대기" 목록 |
| **자동 + 비중** (약 370곳) | `SEG_MIX` + `segFromMix()` | 회사 전체 = SEC 자동 수집(`cash.revQ` 최근 분기 매출, `cash.ttm.ni` 최근 1년 순이익). 사업별 나눔 = 2025년(또는 최근 회계연도) 사업 보고서 비중을 적어 둔 값(추정) | **저절로 바뀜** (export-cashflow가 새 분기를 수집하면). 사업 구조가 크게 바뀌면(인수·분사) 비중만 고친다 |

- `SEG_MIX`의 `p`는 순이익 배분 비중(합 100). 최근 1년 적자 회사는 흑자 사업에 음수를 적어 손실 사업이 적자를 떠안게 한다(INTC·F·CNC·LYB).
- 같은 종목이 `SEGMENTS`에 있으면 그쪽이 우선.
- 최근 1년 적자라 적정가 선이 없는 종목도 판매 칸 아래에 사업부별 시계가 나온다(`SalesLive`).

## 완료

### 직접 조사 (`SEGMENTS`, 80곳)
AAPL, GOOGL, RMS(에르메스), NKE, MSFT, NVDA, META, AVGO, TSLA, AMZN, NFLX, NOW, MA, V, TPL, ANET, VEEV, IDXX, MPWR, PANW, ODFL,
COST, LLY, MCO, SHW, SPGI, KO, ORLY, HD, ISRG, ROL, CPRT, LII, MCD,
GE, JPM, BKNG, ADP, CTAS, ADBE, PG, PEP, JNJ, WMT, TJX,
TMO, INTU, LRCX, UNP, SYK, CDNS, SNPS, CB, DHR, MSCI, ITW, VRSK, TT, PM, MNST, HLT, MAR, FAST,
ZTS, MSI, TYL, APH, AXON, VRTX, BSX, DE, BLK, CL, ECL, AZO, MTD, CMG, FICO, PAYX, GRMN

### 자동 + 비중 (`SEG_MIX`)
- **A등급 (30)**: A AXP BRO CME ETN FTNT GWW HWM IBKR ICE KLAC LOW MCK MLM PGR PH PWR ROST RSG SCHW SNA TDG TMUS TSCO VMC VRSN WAB WAT WM WRB
- **B등급 (124)**: ABBV ABT ACGL ACN ADI ADSK AFL AJG ALGN ALLE AMAT AMD AME AMGN AMP AMT AON AOS APD APO ARES AVY AWK BDX BF-B BNY BR BX CASY CAT CBOE CHD CI CINF CMI COR CPAY CRM CSCO CSGP CSX DECK DIS DOV DPZ DRI DXCM EFX ELV EME EMR EQIX ERIE EW EXPD FDS FIX GD GDDY GILD GS HCA HIG HON HSY HUBB IEX IRM IT JBHT JKHY KEYS KKR KR LDOS LH LMT LYV MDLZ MKC MRK MS NDAQ NDSN NEE NOC NSC NVR ORCL PCAR PKG PLD PNR PODD PSA PTC QCOM RCL REGN RJF RL RMD ROP SBAC SPG STE SYY TDY TEL TPR TRV TTWO TXN ULTA UNH URI WDAY WMB WSM WST WTW XOM XYL YUM
- **C등급 (179)**: ADM AEE AEP AIG AIZ AKAM ALL AMCR APTV ATO BAC BALL BG BKR BMY C CAH CBRE CCI CDW CF CFG CHRW CIEN CLX CMCSA CMS CNP COF COO COP CPT CRL CTSH CVX DAL DD DG DGX DHI DLR DOC DTE DUK DVA EBAY ED EG EOG EQT ES ESS ETR EXC EXE EXPE EXR FANG FCX FDX FE FFIV FIS FISV FITB FLEX FRT FSLR FTV GEN GIS GL GLW GNRC GPC HAL HBAN HII HPE HRL HSIC HST IBM IFF ILMN INCY IP IVZ J JBL JCI KEY KIM KMB KMI L LEN LITE LNT LULU LVS MAA MAS MCHP MDT MET MMM MO MPC MRVL MTB MU NEM NI NRG NTAP NTRS NUE NWS NWSA NXPI O OKE OMC ON OXY PEG PFG PHM PNC PNW PPG PPL PRU PSX PYPL REG RF ROK RVTY SBUX SJM SLB SO SRE STLD STT STX STZ SWK SYF T TECH TER TGT TRGP TRMB TROW TSN TWLO TXT UAL UDR UHS UPS USB VLO VST VTR VZ WDC WEC WELL WFC WY WYNN XEL ZBH ZBRA
- **D등급 (37)**: AES ALB APA ARE BA BAX BBY BE BEN BIIB BXP CCL CHTR CNC CVS D DLTR DVN EIX EL F GM GPN HAS HPQ HUM INTC KHC LUV LYB MGM MOS NCLH PCG PFE SMCI SWKS

(등급은 2026-10-27 화면 기준. 추천 프리셋 ①~⑩ 종목은 위에 모두 포함.)

## 비중은 넣었지만 화면에 안 나오는 곳 (데이터 문제)

| 종목 | 이유 |
|---|---|
| ARES, KKR, STZ, APA | 펀더멘털 파일 없음(EPS 검증 불가) → 이익 시계 자체가 없음 |
| HSY | 펀더멘털이 오래됨(`stale`) → 이익 시계 숨김 |
| SYF | `cash.revQ` 없음(은행류 매출 태그) → 사업부별 시계 못 만듦 |
| QQQ·QLD·TQQQ·BRKB | ETF·버크셔 — 대상 아님 |

피서브(FISV): Yahoo가 최근 1년 EPS를 비워 줘서 이익 시계 전체가 숨겨져 있었음 → `export_fundamentals.py`에서 주가÷PER로 복원하도록 고침(2026-10-27). 정상 표시.

## 업데이트 대기 — 직접 조사(80곳) 중 새 실적이 나왔거나 곧 나오는 곳

`SEGMENTS`의 `period`가 2026년 2분기(4~6월) 이전인 종목은 3분기 실적으로 바꿔야 한다. 발표일은 예정일(회사 공지 확인 필요).

| 발표일 | 종목 (현재 들어 있는 기간) |
|---|---|
| 이미 발표됨 → 바로 업데이트 | KO(2분기), NOW(2분기), ODFL(2분기), SPGI(2분기), LII(2분기), ORLY(2분기) |
| 10/27~10/28 | V(4~6월), SHW(2분기), CMG(2분기), TYL(2분기), APH(2분기), BKNG(2분기) |
| 10/29 | MSFT(4~6월), GOOGL(2분기), META ✔(3분기 완료), MA(2분기), BSX(2분기), SYK(2분기), VRSK(2분기), TT(2분기), GRMN(2분기), CL(2분기 — 10/30 가능), ADP(FY26 4분기 → FY27 1분기) |
| 10/30 | AAPL(4~6월), AMZN(2분기), LLY(2분기), MSI(2분기), MPWR(2분기) |
| 11/2~11/6 | VRTX(11/2), IDXX(11/3), MCD(11/4), ANET(11/4), ZTS(11/4), AXON(11/4), MAR(11/4), MNST(11/5), TPL(11/5), MTD(11/6) |
| 11월 중순~하순 | NVDA(11/19 경), WMT(11/19 경), TJX(11/18 경), HD(11/17 경), DE(11/26 경), INTU(11/20 경, 1년치→분기 검토), PANW(11/18 경), CPRT(11/19 경), VEEV(12/3 경), SNPS(12월 초) |
| 12월 | ADBE(12월 중순), AVGO(12/11 경), COST(12/11 경, 1분기), CTAS(12/18 경), PAYX(12/18 경), NKE(12/18 경), AZO(12/9 경) |
| 반기 | RMS(에르메스) — 2026년 연간 실적 2027년 2월. 3분기 매출(10월)은 이미 반영 |

3분기(7~9월)로 이미 최신인 곳: BLK, ECL, FAST, PM, HLT, MSCI, ITW, CDNS, CB, DHR, TMO, LRCX, UNP, PG, PEP, JNJ, GE, JPM, MCO, ISRG, ROL, META, TSLA, NFLX.

## 자동(`SEG_MIX`) 종목 확인 포인트

- SEC 최근 분기가 1~3월인 종목(HUM, EIX, D, F 등)은 export-cashflow가 2분기를 아직 못 가져온 것 — `export-cashflow.yml` 재실행으로 갱신.
- 실적 발표 후 `export-cashflow.yml`(tickers 비우면 전체)을 돌리면 자동 종목 숫자가 모두 바뀐다.
