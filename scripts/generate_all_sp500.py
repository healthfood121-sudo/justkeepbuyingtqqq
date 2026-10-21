"""
generate_all_sp500.py  —  SP500 상위 종목 롤링 CSV + JSON 일괄 생성
- CSV가 이미 있으면 재생성 안 함 (--force 옵션으로 강제 재실행)
- JSON이 이미 있으면 재생성 안 함
- 오류 발생 종목은 스킵 후 계속 진행
"""
import sys, os, json, traceback, argparse, time
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import pandas as pd
import yfinance as yf
import matplotlib
matplotlib.use('Agg')  # headless 환경 (GitHub Actions 등)
from pathlib import Path
from rolling_analysis import RollingAnalyzer, summary_stats

SRC = Path(__file__).parent / "data" / "rolling"
DST = Path(__file__).parent.parent / "web" / "public" / "data" / "rolling"
SRC.mkdir(parents=True, exist_ok=True)
DST.mkdir(parents=True, exist_ok=True)

# ── 이미 처리된 종목 (export_rolling_json.py 에서 처리됨) ────────
ALREADY_DONE = {
    "NKE", "RMS", "AAPL", "COST", "KO", "GOOGL", "META", "AMZN",
    "NVDA", "LLY", "AVGO", "BRKB", "TSLA", "JPM", "JNJ", "MSFT",
    "WMT", "ORCL", "V", "QQQ", "QLD", "TQQQ",
}

# ── SP500 종목 정보: ticker → (한글명, SP500 rank) ────────────────
SP500_INFO = {
    # ── Rank 12~100 ───────────────────────────────────────────
    "MU":   ("마이크론 테크놀로지", 12),
    "AMD":  ("어드밴스드 마이크로 디바이스", 15),
    "XOM":  ("엑손모빌", 17),
    "MA":   ("마스터카드", 19),
    "ABBV": ("애브비", 20),
    "INTC": ("인텔", 21),
    "CVX":  ("셰브론", 23),
    "CSCO": ("시스코 시스템즈", 25),
    "PG":   ("프록터 앤 갬블", 28),
    "UNH":  ("유나이티드헬스 그룹", 29),
    "MRK":  ("머크", 30),
    "BAC":  ("뱅크 오브 아메리카", 31),
    "CAT":  ("캐터필러", 32),
    "LRCX": ("램 리서치", 33),
    "AMAT": ("어플라이드 머티리얼즈", 35),
    "PM":   ("필립 모리스 인터내셔널", 36),
    "HD":   ("홈 디포", 37),
    "NFLX": ("넷플릭스", 38),
    "MS":   ("모건 스탠리", 40),
    "PANW": ("팔로알토 네트웍스", 41),
    "GS":   ("골드만 삭스", 43),
    "TMO":  ("서모 피셔 사이언티픽", 44),
    "TXN":  ("텍사스 인스트루먼트", 45),
    "WFC":  ("웰스 파고", 46),
    "AMGN": ("암젠", 48),
    "ANET": ("아리스타 네트웍스", 51),
    "IBM":  ("IBM", 52),
    "KLAC": ("KLA 코퍼레이션", 53),
    "AXP":  ("아메리칸 익스프레스", 54),
    "C":    ("씨티그룹", 55),
    "MRVL": ("마벨 테크놀로지", 56),
    "CRM":  ("세일즈포스", 57),
    "APH":  ("암페놀", 58),
    "GILD": ("길리어드 사이언스", 59),
    "ADI":  ("아날로그 디바이스", 60),
    "DIS":  ("월트 디즈니", 61),
    "VZ":   ("버라이즌", 63),
    "QCOM": ("퀄컴", 64),
    "ABT":  ("애보트 래버러토리스", 65),
    "PEP":  ("펩시코", 66),
    "COP":  ("코노코필립스", 67),
    "BLK":  ("블랙록", 68),
    "DE":   ("디어", 69),
    "MCD":  ("맥도날드", 70),
    "UNP":  ("유니온 퍼시픽", 71),
    "TMUS": ("티모바일 US", 72),
    "WELL": ("웰타워", 73),
    "PFE":  ("화이자", 74),
    "NEE":  ("넥스트에라 에너지", 75),
    "TJX":  ("TJX 컴퍼니스", 76),
    "DHR":  ("다나허", 77),
    "T":    ("AT&T", 78),
    "SCHW": ("찰스 슈왑", 79),
    "ETN":  ("이튼", 80),
    "ISRG": ("인튜이티브 서지컬", 81),
    "BA":   ("보잉", 82),
    "NOW":  ("서비스나우", 83),
    "STX":  ("시게이트 테크놀로지", 84),
    "ACN":  ("액센추어", 86),
    "CB":   ("처브", 87),
    "MPC":  ("마라톤 페트롤리엄", 88),
    "VLO":  ("발레로 에너지", 89),
    "LMT":  ("록히드 마틴", 90),
    "PGR":  ("프로그레시브", 91),
    "VRTX": ("버텍스 제약", 92),
    "SPGI": ("S&P 글로벌", 93),
    "MO":   ("알트리아 그룹", 94),
    "NEM":  ("뉴몬트", 95),
    "WDC":  ("웨스턴 디지털", 96),
    "FTNT": ("포티넷", 97),
    "COF":  ("캐피탈 원", 98),
    "BKNG": ("부킹 홀딩스", 99),
    "BMY":  ("브리스톨 마이어스 스큅", 100),
    # ── Rank 101~200 ──────────────────────────────────────────
    "PH":   ("파커 해니핀", 101),
    "MDT":  ("메드트로닉", 102),
    "PLD":  ("프롤로지스", 103),
    "CVS":  ("CVS 헬스", 104),
    "MCK":  ("맥케슨", 105),
    "PSX":  ("필립스 66", 106),
    "ADP":  ("오토매틱 데이터 프로세싱", 107),
    "GLW":  ("코닝", 108),
    "SYK":  ("스트라이커", 109),
    "SBUX": ("스타벅스", 110),
    "LOW":  ("로우스", 111),
    "CME":  ("CME 그룹", 112),
    "SO":   ("서던 컴퍼니", 113),
    "MAR":  ("메리어트 인터내셔널", 115),
    "TT":   ("트레인 테크놀로지스", 116),
    "FCX":  ("프리포트-맥모런", 117),
    "HCA":  ("HCA 헬스케어", 118),
    "EQIX": ("에퀴닉스", 119),
    "BNY":  ("BNY 멜론", 120),
    "ADBE": ("어도비", 122),
    "PWR":  ("퀀타 서비스", 123),
    "DUK":  ("듀크 에너지", 124),
    "GD":   ("제너럴 다이나믹스", 125),
    "ELV":  ("엘레반스 헬스", 126),
    "USB":  ("US 뱅코프", 127),
    "ICE":  ("인터컨티넨탈 익스체인지", 128),
    "WM":   ("웨이스트 매니지먼트", 129),
    "CSX":  ("CSX 코퍼레이션", 130),
    "EMR":  ("에머슨 일렉트릭", 131),
    "MMC":  ("마쉬 맥레넌", 132),
    "MNST": ("몬스터 비버리지", 133),
    "JCI":  ("존슨 컨트롤스", 138),
    "CDNS": ("케이던스 디자인 시스템즈", 139),
    "WMB":  ("윌리엄스 컴퍼니스", 140),
    "SNPS": ("시놉시스", 141),
    "INTU": ("인튜이트", 143),
    "PNC":  ("PNC 파이낸셜", 144),
    "AMT":  ("아메리칸 타워", 145),
    "BX":   ("블랙스톤", 146),
    "MMM":  ("3M", 147),
    "CTAS": ("신타스", 148),
    "MCO":  ("무디스", 149),
    "UPS":  ("UPS", 150),
    # ── Rank 151~200 ──────────────────────────────────────────
    "EOG":  ("EOG 리소시스", 151),
    "MDLZ": ("몬델리즈 인터내셔널", 153),
    "REGN": ("리제네론 제약", 154),
    "SHW":  ("셔윈-윌리엄스", 155),
    "TRV":  ("트래블러스", 156),
    "ECL":  ("에코랩", 157),
    "CI":   ("시그나", 158),
    "CMCSA":("컴캐스트", 160),
    "HLT":  ("힐튼 월드와이드", 161),
    "ITW":  ("일리노이 툴 웍스", 162),
    "KKR":  ("KKR", 163),
    "MSI":  ("모토로라 솔루션스", 164),
    "KMI":  ("킨더 모건", 165),
    "ROST": ("로스 스토어즈", 166),
    "CL":   ("콜게이트-팜올리브", 167),
    "RCL":  ("로열 캐리비안", 169),
    "NOC":  ("노스럽 그루먼", 170),
    "GM":   ("제너럴 모터스", 171),
    "SLB":  ("슐럼버거", 172),
    "NSC":  ("노퍽 서던", 173),
    "CMI":  ("커민스", 175),
    "ORLY": ("오라일리 자동차", 176),
    "RSG":  ("리퍼블릭 서비스", 177),
    "TGT":  ("타겟", 178),
    "FDX":  ("페덱스", 179),
    "HON":  ("허니웰", 181),
    "APD":  ("에어 프로덕츠 앤 케미컬스", 182),
    "SPG":  ("사이먼 프로퍼티 그룹", 183),
    "AJG":  ("갤러거", 185),
    "DLR":  ("디지털 리얼티", 186),
    "COR":  ("센코라", 188),
    "BSX":  ("보스턴 사이언티픽", 190),
    "URI":  ("유나이티드 렌탈스", 191),
    "MET":  ("메트라이프", 192),
    "TRGP": ("타르가 리소시스", 193),
    "TDG":  ("트랜스다임 그룹", 194),
    "ALL":  ("올스테이트", 195),
    "GWW":  ("W.W. 그레인저", 196),
    "OXY":  ("옥시덴탈 페트롤리엄", 197),
    "AON":  ("에이온", 198),
    "TEL":  ("TE 커넥티비티", 199),
    "AFL":  ("아플락", 200),
    # ── Rank 201~300 ──────────────────────────────────────────
    "MPWR": ("모놀리식 파워 시스템즈", 201),
    "CAH":  ("카디널 헬스", 202),
    "OKE":  ("원오크", 203),
    "FAST": ("패스트너", 204),
    "PCAR": ("팩카", 205),
    "NUE":  ("뉴코", 206),
    "NXPI": ("NXP 반도체", 207),
    "FANG": ("다이아몬드백 에너지", 209),
    "AME":  ("AMETEK", 210),
    "KEYS": ("키사이트 테크놀로지스", 211),
    "D":    ("도미니언 에너지", 212),
    "DVN":  ("데번 에너지", 213),
    "PSA":  ("퍼블릭 스토리지", 214),
    "GRMN": ("가민", 218),
    "SRE":  ("셈프라", 219),
    "EBAY": ("이베이", 220),
    "O":    ("리얼티 인컴", 222),
    "NDAQ": ("나스닥", 223),
    "BDX":  ("베킨슨 디킨슨", 224),
    "TER":  ("테라다인", 226),
    "AZO":  ("오토존", 228),
    "VEEV": ("비바 시스템즈", 229),
    "ADSK": ("오토데스크", 231),
    "EW":   ("에드워즈 라이프사이언시스", 232),
    "HUM":  ("휴마나", 233),
    "DAL":  ("델타 항공", 234),
    "F":    ("포드 모터", 235),
    "A":    ("어질런트 테크놀로지스", 236),
    "PYPL": ("페이팔 홀딩스", 237),
    "WAB":  ("웨이브텍", 238),
    "XEL":  ("엑셀 에너지", 240),
    "ROK":  ("로크웰 오토메이션", 242),
    "WDAY": ("워크데이", 247),
    "FITB": ("피프스 서드 뱅코프", 250),
    "STT":  ("스테이트 스트리트", 251),
    "EXC":  ("엑셀론", 253),
    "AMP":  ("아메리프라이즈 파이낸셜", 255),
    "IDXX": ("IDEXX 래버러토리스", 256),
    "AIG":  ("AIG", 260),
    "ED":   ("콘솔리데이티드 에디슨", 261),
    "MSCI": ("MSCI", 262),
    "YUM":  ("얌 브랜즈", 264),
    "SYY":  ("시스코 코퍼레이션", 265),
    "MCHP": ("마이크로칩 테크놀로지", 266),
    "PRU":  ("프루덴셜 파이낸셜", 268),
    "ADM":  ("아처 대니얼스 미들랜드", 269),
    "PAYX": ("페이첵스", 270),
    "DHI":  ("D.R. 호튼", 274),
    "ODFL": ("올드 도미니언 프레이트", 275),
    "CBRE": ("CBRE 그룹", 276),
    "CMG":  ("치폴레", 280),
    "KR":   ("크로거", 281),
    # ── Rank 290~410 ──────────────────────────────────────────
    "BIIB": ("바이오젠", 296),
    "HSY":  ("허쉬 컴퍼니", 297),
    "CNC":  ("센틴", 298),
    "RMD":  ("레스메드", 300),
    "ZTS":  ("조에티스", 305),
    "EME":  ("EMCOR 그룹", 308),
    "AXON": ("액손 엔터프라이즈", 309),
    "CTSH": ("코그니전트", 318),
    "DG":   ("달러 제너럴", 319),
    "WTW":  ("윌리스 타워스 왓슨", 323),
    "HAL":  ("할리버튼", 329),
    "VRSN": ("베리사인", 331),
    "HPQ":  ("HP Inc.", 333),
    "CFG":  ("시티즌스 파이낸셜", 338),
    "CPRT": ("코파트", 346),
    "LH":   ("랩코프", 347),
    "FISV": ("피저브", 352),
    "VRSK": ("버리스크 애널리틱스", 355),
    "PPG":  ("PPG 인더스트리스", 366),
    "TROW": ("T. 로우 프라이스", 386),
    "EIX":  ("에디슨 인터내셔널", 387),
    "SMCI": ("슈퍼 마이크로 컴퓨터", 393),
    "BBY":  ("베스트 바이", 400),
    "EFX":  ("에퀴팩스", 405),
    "FIS":  ("피델리티 내셔널 인포메이션", 408),
    "FSLR": ("퍼스트 솔라", 409),
    "NDSN": ("노드슨", 415),
    "FICO": ("페어 아이작", 428),
    "ROL":  ("롤린스", 432),
    "GDDY": ("고대디", 451),
    "CHTR": ("차터 커뮤니케이션스", 466),
    "ALB":  ("알버말", 477),
    "LULU": ("룰루레몬", 478),
    # ── 2차 배치 (나머지 S&P500 종목) ──────────────────────────────
    "GE":   ("GE 에어로스페이스", 34),
    "HPE":  ("HP 엔터프라이즈", 174),
    "VST":  ("비스트라", 225),
    "ETR":  ("엔터지", 230),
    "FIX":  ("컴포트 시스템즈 USA", 227),
    "LITE": ("루멘텀 홀딩스", 168),
    "BKR":  ("베이커 휴즈", 216),
    "HWM":  ("하우멧 에어로스페이스", 137),
    "APO":  ("아폴로 글로벌 매니지먼트", 184),
    "BE":   ("블룸 에너지", 187),
    "NTAP": ("넷앱", 267),
    "LYV":  ("라이브 네이션 엔터테인먼트", 271),
    "ILMN": ("일루미나", 272),
    "PCG":  ("PG&E", 273),
    "TTWO": ("테이크-투 인터랙티브", 277),
    "EL":   ("에스티 로더", 278),
    "ROP":  ("로퍼 테크놀로지스", 279),
    "IBKR": ("인터랙티브 브로커스", 283),
    "HIG":  ("하트퍼드 파이낸셜", 284),
    "MLM":  ("마틴 마리에타", 287),
    "WEC":  ("WEC 에너지 그룹", 288),
    "KMB":  ("킴벌리-클라크", 289),
    "CCI":  ("크라운 캐슬", 290),
    "CCL":  ("카니발", 292),
    "EXPE": ("익스피디아", 293),
    "ACGL": ("아치 캐피털 그룹", 294),
    "STLD": ("스틸 다이나믹스", 295),
    "EQT":  ("EQT", 299),
    "IRM":  ("아이언 마운틴", 301),
    "FLEX": ("플렉스", 302),
    "VMC":  ("벌칸 머티리얼스", 303),
    "CBOE": ("CBOE 글로벌 마켓", 304),
    "MTD":  ("메틀러-톨레도", 306),
    "DXCM": ("덱스콤", 307),
    "UAL":  ("유나이티드 에어라인스", 311),
    "MTB":  ("M&T 뱅크", 312),
    "HBAN": ("헌팅턴 뱅크셰어스", 313),
    "NTRS": ("노던 트러스트", 314),
    "RJF":  ("레이먼드 제임스", 316),
    "EXR":  ("엑스트라 스페이스 스토리지", 320),
    "WSM":  ("윌리엄스-소노마", 321),
    "AEP":  ("아메리칸 일렉트릭 파워", 180),
    "JBL":  ("재빌", 324),
    "TDY":  ("텔레다인 테크놀로지스", 325),
    "ATO":  ("앳모스 에너지", 326),
    "KHC":  ("크래프트 하인즈", 327),
    "ON":   ("ON 세미컨덕터", 328),
    "WRB":  ("W.R. 버클리", 329),
    "WST":  ("웨스트 파마슈티컬", 334),
    "DTE":  ("DTE 에너지", 335),
    "AWK":  ("아메리칸 워터 웍스", 336),
    "FE":   ("퍼스트에너지", 337),
    "CNP":  ("센터포인트 에너지", 338),
    "PPL":  ("PPL", 340),
    "DOV":  ("도버", 341),
    "CINF": ("신시내티 파이낸셜", 342),
    "CPAY": ("코페이", 343),
    "DGX":  ("퀘스트 다이어그노스틱스", 345),
    "ARES": ("아레스 매니지먼트", 348),
    "EXPD": ("익스피디터스 인터내셔널", 350),
    "ULTA": ("울타 뷰티", 351),
    "ES":   ("에버소스 에너지", 353),
    "FFIV": ("F5", 354),
    "CHD":  ("처치 앤 드와이트", 357),
    "LVS":  ("라스베이거스 샌즈", 359),
    "HUBB": ("허벨", 361),
    "XYL":  ("자일렘", 362),
    "TPL":  ("텍사스 퍼시픽 랜드", 363),
    "SYF":  ("싱크로니 파이낸셜", 365),
    "TPR":  ("태피스트리", 367),
    "RF":   ("리전스 파이낸셜", 368),
    "DLTR": ("달러 트리", 369),
    "PFG":  ("프린시펄 파이낸셜", 370),
    "BRO":  ("브라운 앤 브라운", 371),
    "IFF":  ("인터내셔널 플레이버스", 372),
    "INCY": ("인사이트 제약", 374),
    "L":    ("뢰브스", 375),
    "STZ":  ("컨스텔레이션 브랜즈", 376),
    "GPN":  ("글로벌 페이먼츠", 377),
    "OMC":  ("옴니컴 그룹", 378),
    "STE":  ("스테리스", 380),
    "PHM":  ("펄트그룹", 381),
    "EXE":  ("익스팬드 에너지", 382),
    "CMS":  ("CMS 에너지", 385),
    "JBHT": ("JB 헌트 트랜스포트", 388),
    "KEY":  ("키코프", 390),
    "PKG":  ("패키징 코프 오브 아메리카", 391),
    "PTC":  ("PTC", 392),
    "LYB":  ("라이온델바젤", 394),
    "NI":   ("나이소스", 395),
    "BG":   ("번지 글로벌", 396),
    "AMCR": ("암코", 397),
    "SBAC": ("SBA 커뮤니케이션스", 398),
    "BR":   ("브로드리지 파이낸셜", 399),
    "LUV":  ("사우스웨스트 에어라인스", 401),
    "TSN":  ("타이슨 푸즈", 402),
    "SNA":  ("스냅-온", 404),
    "CDW":  ("CDW", 406),
    "SWKS": ("스카이웍스 솔루션", 407),
    "GPC":  ("제뉴인 파츠", 410),
    "LEN":  ("레나", 411),
    "APA":  ("APA", 424),
    "ZBH":  ("짐머 바이오메트", 413),
    "IP":   ("인터내셔널 페이퍼", 414),
    "LNT":  ("앨라이언트 에너지", 416),
    "GIS":  ("제너럴 밀스", 417),
    "DD":   ("듀폰", 418),
    "ZBRA": ("제브라 테크놀로지스", 419),
    "FTV":  ("포티브", 420),
    "IEX":  ("IDEX", 421),
    "ESS":  ("에섹스 프로퍼티 트러스트", 422),
    "TSCO": ("트랙터 서플라이", 423),
    "RVTY": ("레비티", 425),
    "CF":   ("CF 인더스트리스", 412),
    "BALL": ("볼 코퍼레이션", 427),
    "J":    ("제이콥스 솔루션스", 429),
    "HST":  ("호스트 호텔스", 430),
    "CHRW": ("C.H. 로빈슨", 431),
    "NVR":  ("NVR", 434),
    "LDOS": ("레이도스", 436),
    "KIM":  ("킴코 리얼티", 437),
    "EG":   ("에버레스트 그룹", 438),
    "TYL":  ("타일러 테크놀로지스", 439),
    "GEN":  ("젠 디지털", 441),
    "MAS":  ("매스코", 442),
    "CRL":  ("찰스 리버 래버러토리스", 443),
    "WY":   ("웨이어하우저", 444),
    "AIZ":  ("어슈런트", 445),
    "SWK":  ("스탠리 블랙 앤 데커", 446),
    "HAS":  ("해즈브로", 447),
    "TRMB": ("트림블", 448),
    "SJM":  ("J.M. 스머커", 449),
    "MAA":  ("미드-아메리카 아파트먼트", 450),
    "REG":  ("리전시 센터스", 452),
    "ALLE": ("앨레지온", 453),
    "AVY":  ("에이버리 데니슨", 454),
    "BEN":  ("프랭클린 템플턴", 435),
    "BF-B": ("브라운-포먼 B", 455),
    "CSGP": ("코스타 그룹", 456),
    "DOC":  ("헬스픽 프로퍼티스", 457),
    "BAX":  ("박스터 인터내셔널", 458),
    "TXT":  ("텍스트론", 459),
    "GL":   ("글로브 라이프", 460),
    "IT":   ("가트너", 461),
    "ERIE": ("에리 인뎀니티", 464),
    "AKAM": ("아카마이 테크놀로지스", 465),
    "CLX":  ("클로록스", 488),
    "HRL":  ("호멜 푸즈", 479),
    "FDS":  ("팩트셋 리서치", 485),
    "JKHY": ("잭 헨리 앤 어소시에이츠", 484),
    "HII":  ("헌팅턴 잉걸스", 486),
    "GNRC": ("제너랙", 475),
    "TECH": ("바이오-테크니", 476),
    "ALGN": ("얼라인 테크놀로지", 489),
    "DPZ":  ("도미노 피자", 490),
    "PODD": ("인슐렛", 491),
    "HSIC": ("헨리 샤인", 492),
    "BXP":  ("BXP", 493),
    "APTV": ("앱티브", 494),
    "FRT":  ("페더럴 리얼티", 495),
    "PNR":  ("펜테어", 496),
    "AOS":  ("A.O. 스미스", 497),
    "WYNN": ("윈 리조트", 498),
    "MGM":  ("MGM 리조트", 499),
    "ARE":  ("알렉산드리아 리얼 에스테이트", 500),
    "MOS":  ("더 모자이크", 502),
    "NCLH": ("노르웨이안 크루즈 라인", 501),
    "NWS":  ("뉴스 코퍼레이션 B", 503),
    "NWSA": ("뉴스 코퍼레이션 A", 483),
    "AES":  ("AES", 487),
    "IVZ":  ("인베스코", 470),
    "MKC":  ("맥코믹", 469),
    "PNW":  ("피너클 웨스트", 468),
    "LII":  ("레녹스 인터내셔널", 471),
    "DVA":  ("다비타", 472),
    "DECK": ("데커스 아웃도어", 473),
    "CPT":  ("캠든 프로퍼티 트러스트", 474),
    "TWLO": ("트윌리오", 282),
    "DRI":  ("다든 레스토랑", 360),
    "NRG":  ("NRG 에너지", 379),
    "UDR":  ("UDR", 481),
    "UHS":  ("유니버셜 헬스 서비스", 482),
    "WAT":  ("워터스 코프", 259),
    "VTR":  ("벤타스", 257),
    "COO":  ("쿠퍼 컴패니스", 480),
    "CASY": ("케이시스 제너럴 스토어", 349),
    "AEE":  ("아메렌", 322),
    "CIEN": ("씨에나", 243),
    "RL":   ("랄프 로렌", 373),
    "PEG":  ("퍼블릭 서비스 엔터프라이즈", 286),
}

NEW_TICKERS = [t for t in SP500_INFO if t not in ALREADY_DONE]

# ── 헬퍼 함수 ─────────────────────────────────────────────────

def get_metrics(ticker: str) -> dict:
    try:
        info = yf.Ticker(ticker).info
        pe  = info.get("trailingPE") or info.get("forwardPE")
        div = (info.get("dividendYield") or 0)
        eps = info.get("trailingEps") or info.get("forwardEps")
        price = info.get("currentPrice") or info.get("regularMarketPrice")
        return {
            "price":    round(price, 2) if price else None,
            "pe":       round(pe, 1) if pe else None,
            "divYield": round(div, 2),
            "eps":      round(eps, 2) if eps else None,
        }
    except Exception:
        return {"price": None, "pe": None, "divYield": 0, "eps": None}


def df_to_rows(df: pd.DataFrame) -> list:
    rows = []
    for _, r in df.iterrows():
        row = {
            "buyYear":    int(r["buy_date"].year),
            "sellYear":   int(r["sell_date"].year),
            "sellDate":   r["sell_date"].strftime("%Y-%m-%d"),
            "yearsActual": float(round(r["years_actual"], 1)),
            "cagr":       float(r["cagr"]),
            "multiple":   float(r["multiple"]),
            "isComplete": bool(r["is_complete"]),
        }
        if "bench_cagr" in r and pd.notna(r["bench_cagr"]):
            row["benchCagr"] = float(r["bench_cagr"])
            row["diff"]      = float(r["diff_pct"])
        rows.append(row)
    return rows


def build_loss5y(df5a: pd.DataFrame) -> list:
    loss = df5a[df5a["is_complete"] & (df5a["cagr"] < 0)]
    return [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss.iterrows()
    ]


# ── 메인 루프 ─────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force-csv",  action="store_true", help="기존 CSV 덮어쓰기")
    parser.add_argument("--force-json", action="store_true", help="기존 JSON 덮어쓰기")
    parser.add_argument("--only",  nargs="*", help="특정 종목만 처리 (e.g., --only MU AMD)")
    parser.add_argument("--skip-csv",  action="store_true", help="CSV 생성 스킵 (JSON만 생성)")
    args = parser.parse_args()

    tickers = args.only if args.only else NEW_TICKERS
    total = len(tickers)
    errors = []
    skipped = []

    print(f"\n{'='*60}")
    print(f"SP500 배치 처리: {total}개 종목")
    print(f"{'='*60}\n")

    for idx, ticker in enumerate(tickers, 1):
        name, rank = SP500_INFO.get(ticker, (ticker, 999))
        print(f"[{idx:3d}/{total}] {ticker} ({name}, SP500 #{rank})")

        csv_10y = SRC / f"{ticker}_10y_annual.csv"
        csv_5y  = SRC / f"{ticker}_5y_annual.csv"
        json_out = DST / f"{ticker}_rolling.json"

        # ── 1. CSV 생성 ────────────────────────────────────────
        if not args.skip_csv:
            if csv_10y.exists() and not args.force_csv:
                print(f"  CSV 이미 존재, 스킵")
            else:
                try:
                    az = RollingAnalyzer(ticker, benchmark="^SP500TR")
                    df10a = az.rolling(years=10, freq="annual")
                    df5a  = az.rolling(years=5,  freq="annual")
                    az.save_csv(df10a, csv_10y)
                    az.save_csv(df5a,  csv_5y)
                    n_comp = len(df10a[df10a["is_complete"]])
                    print(f"  CSV 생성 완료: 완결 {n_comp}개")
                except Exception as e:
                    print(f"  ⚠ CSV 오류: {e}")
                    errors.append((ticker, f"CSV 오류: {e}"))
                    continue

        # ── 2. JSON 생성 ───────────────────────────────────────
        if json_out.exists() and not args.force_json:
            print(f"  JSON 이미 존재, 스킵")
            skipped.append(ticker)
            continue

        if not csv_10y.exists():
            print(f"  ⚠ CSV 없음, JSON 생성 불가")
            errors.append((ticker, "CSV 없음"))
            continue

        try:
            df10a = pd.read_csv(csv_10y, parse_dates=["buy_date","sell_date"])
            df5a  = pd.read_csv(csv_5y,  parse_dates=["buy_date","sell_date"]) if csv_5y.exists() else df10a.iloc[:0].copy()

            az  = RollingAnalyzer(ticker, benchmark="^SP500TR")
            fp  = az.full_period()
            st  = summary_stats(df10a, label=ticker)

            print(f"  현재 지표 조회 중...")
            metrics = get_metrics(ticker)

            out = {
                "ticker":    ticker,
                "name":      name,
                "currency":  "USD",
                "benchmark": "S&P 500",
                "note":      "",
                "current":   metrics,
                "fullPeriod": fp,
                "stats": {
                    "n":        st.get("n_complete", 0),
                    "min":      st.get("min_cagr"),
                    "minBuy":   st.get("min_buy", ""),
                    "median":   st.get("median_cagr"),
                    "mean":     st.get("mean_cagr"),
                    "max":      st.get("max_cagr"),
                    "maxBuy":   st.get("max_buy", ""),
                    "over10":   st.get("pct_over_10"),
                    "over15":   st.get("pct_over_15"),
                    "over20":   st.get("pct_over_20"),
                    "losses":   st.get("n_losses", 0),
                    "beatBench":  st.get("n_beat_bench"),
                    "beatTotal":  st.get("n_beat_bench_total"),
                },
                "rows10y":  df_to_rows(df10a),
                "loss5y":   build_loss5y(df5a),
                "epsDecomp": [],
                "epsNote":  "EPS 데이터 미수집",
            }

            json_out.write_text(
                json.dumps(out, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            n_comp = st.get("n_complete", 0)
            med = st.get("median_cagr", "N/A")
            print(f"  JSON 저장 완료: 완결 {n_comp}개, 중앙값 {med}%")

        except Exception as e:
            print(f"  ⚠ JSON 오류: {e}")
            traceback.print_exc()
            errors.append((ticker, f"JSON 오류: {e}"))

        time.sleep(0.5)  # Yahoo Finance 레이트 리밋 방지

    # ── 결과 요약 ──────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"완료: {total - len(errors) - len(skipped)}개 처리")
    print(f"스킵: {len(skipped)}개 (이미 존재)")
    if errors:
        print(f"오류: {len(errors)}개")
        for t, msg in errors:
            print(f"  - {t}: {msg}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
