"""
export_fundamentals.py — 전 종목 연도별 EPS·PER·수익률 분해 + 선별 지표 생성

데이터:
  - EPS: SEC EDGAR XBRL companyconcept (연간 10-K, 희석 EPS 우선). 분할은 yfinance 분할 이력으로 보정
  - 주가: yfinance 연말 Close(분할 반영, 배당 미반영) / Adj Close(배당 재투자)
  - 현재 EPS·PER: web/public/data/rolling/{KEY}_rolling.json 의 current (주간 자동 갱신 값)

출력:
  web/public/data/fundamentals/{KEY}.json  — 종목별 연도별 EPS·PER, 10년 분해(완결+진행 중), 지표
  web/public/data/fundamentals/_summary.json — 전 종목 지표 요약 (선별 페이지용)

실행: GitHub Actions '전 종목 펀더멘털 데이터 생성' (workflow_dispatch)
  python scripts/export_fundamentals.py            # 전 종목
  python scripts/export_fundamentals.py AAPL NKE   # 일부
"""
import json
import math
import sys
import time
from pathlib import Path

import pandas as pd
import requests
import yfinance as yf

ROOT = Path(__file__).parent.parent
ROLL = ROOT / "web" / "public" / "data" / "rolling"
OUT = ROOT / "web" / "public" / "data" / "fundamentals"
OUT.mkdir(parents=True, exist_ok=True)

UA = {"User-Agent": "justkeepbuyingtqqq research research@example.com"}
CONCEPTS = ["EarningsPerShareDiluted", "EarningsPerShareBasicAndDiluted", "EarningsPerShareBasic"]
SKIP = {"QQQ", "QLD", "TQQQ", "RMS"}  # ETF·비미국 종목
TODAY = pd.Timestamp.today().normalize()
LAST_FULL = TODAY.year - 1


def r2(x, n=2):
    return None if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))) else round(float(x), n)


def cagr(a, b, yrs):
    if a is None or b is None or a <= 0 or b <= 0 or yrs <= 0:
        return None
    return ((b / a) ** (1 / yrs) - 1) * 100


def load_cik_map():
    r = requests.get("https://www.sec.gov/files/company_tickers.json", headers=UA, timeout=30)
    r.raise_for_status()
    return {v["ticker"].upper(): int(v["cik_str"]) for v in r.json().values()}


def fetch_eps(cik: int) -> dict:
    """회계연도 종료일 → (EPS, 공시일). 같은 종료일은 가장 최근 공시값(분할 재작성 반영)."""
    best = {}
    log = []
    for concept in CONCEPTS:
        url = f"https://data.sec.gov/api/xbrl/companyconcept/CIK{cik:010d}/us-gaap/{concept}.json"
        resp = None
        for attempt in range(5):  # SEC가 순간적으로 403/429를 줄 때가 있어 재시도
            try:
                resp = requests.get(url, headers=UA, timeout=30)
            except requests.RequestException:
                resp = None
            if resp is not None and resp.status_code in (200, 404):
                break
            time.sleep(3 * (attempt + 1))
        time.sleep(0.15)  # SEC 초당 10회 제한
        log.append(f"{concept}:{resp.status_code if resp is not None else 'ERR'}")
        if resp is None or resp.status_code != 200:
            continue
        units = resp.json().get("units", {})
        for unit, items in units.items():
            log.append(f"  {unit} n={len(items)} 예: {items[-1] if items else None}")
            if "/shares" not in unit:
                continue
            for it in items:
                if it.get("form") not in ("10-K", "10-K/A", "10-KT", "20-F", "40-F"):
                    continue
                if not it.get("start") or not it.get("end"):
                    continue
                days = (pd.Timestamp(it["end"]) - pd.Timestamp(it["start"])).days
                if not 340 <= days <= 390:
                    continue
                end, filed = it["end"], it["filed"]
                # 앞선 개념(희석)이 있으면 유지, 같은 개념 안에서는 최신 공시 우선
                prev = best.get(end)
                if prev is None or (prev[2] == concept and filed > prev[1]):
                    best[end] = (float(it["val"]), filed, concept)
    if not best:
        print("    EDGAR 응답:", ", ".join(log), flush=True)
    return best


def split_adjust(eps_raw: dict, splits: pd.Series) -> dict:
    """공시일 이후에 일어난 분할만큼 EPS를 나눠 현재 주식수 기준으로 맞춤."""
    out = {}
    for end, (val, filed, _) in eps_raw.items():
        f = pd.Timestamp(filed)
        factor = 1.0
        for d, ratio in splits.items():
            t = pd.Timestamp(d)
            if t.tzinfo is not None:
                t = t.tz_localize(None)
            if ratio and ratio > 0 and t > f:
                factor *= ratio
        out[pd.Timestamp(end)] = val / factor
    return out


def annual_eps_by_year(eps_adj: dict) -> dict:
    """회계연도 → EPS. 1~3월에 끝나는 회계연도(월마트·엔비디아 등)는 대부분이 전년도에 속하므로 전년도로 매김."""
    by = {}
    for end in sorted(eps_adj):
        y = end.year - 1 if end.month <= 3 else end.year
        by[y] = eps_adj[end]
    return by


def process(key: str, roll: dict, prices: pd.DataFrame, cik_map: dict) -> dict | None:
    yf_t = roll["ticker"].replace(".", "-")
    cik = cik_map.get(yf_t.upper()) or cik_map.get(yf_t.upper().replace("-", "."))
    if cik is None:
        print(f"  {key}: CIK 없음")
        return None
    try:
        close = prices[(yf_t, "Close")].dropna()
        adj = prices[(yf_t, "Adj Close")].dropna()
        splits = prices[(yf_t, "Stock Splits")].dropna()
        splits = splits[splits > 0]
    except KeyError:
        print(f"  {key}: 주가 없음")
        return None
    if close.empty:
        return None

    eps_raw = fetch_eps(cik)
    if not eps_raw:
        print(f"  {key}: EPS 없음")
        return None
    eps_adj = split_adjust(eps_raw, splits)
    if key == "BRKB":  # 버크셔는 A주 기준 EPS 공시 → B주(1/1500)로 환산
        eps_adj = {k: v / 1500 for k, v in eps_adj.items()}
    eps_y = annual_eps_by_year(eps_adj)

    ye_close = close.groupby(close.index.year).last()
    ye_adj = adj.groupby(adj.index.year).last()

    cur = roll.get("current") or {}
    price_now = float(close.iloc[-1])
    ttm = cur.get("eps")
    pe_now = price_now / ttm if ttm and ttm > 0 else None

    # 연말 PER (그해 끝난 회계연도 EPS 기준)
    years = sorted(y for y in eps_y if y in ye_close.index and y <= LAST_FULL)
    pe_y = {y: (float(ye_close[y]) / eps_y[y] if eps_y[y] > 0 else None) for y in years}

    # 10년 분해: 완결 + 진행 중
    decomp = []
    for b in years:
        s = b + 10
        if s <= LAST_FULL:
            if s not in eps_y or s not in ye_close.index:
                continue
            e0, e1 = eps_y[b], eps_y[s]
            p0, p1 = float(ye_close[b]), float(ye_close[s])
            a0, a1 = float(ye_adj[b]), float(ye_adj[s])
            yrs, prog = 10.0, False
        else:
            if not ttm or b > LAST_FULL:
                continue
            yrs = (close.index[-1] - pd.Timestamp(f"{b}-12-31")).days / 365.25
            if yrs < 1:
                continue
            e0, e1 = eps_y[b], ttm
            p0, p1 = float(ye_close[b]), price_now
            a0, a1 = float(ye_adj[b]), float(adj.iloc[-1])
            prog = True
        if e0 <= 0 or e1 <= 0:
            continue
        T = cagr(a0, a1, yrs)
        P = cagr(p0, p1, yrs)
        E = cagr(e0, e1, yrs)
        pe0, pe1 = p0 / e0, p1 / e1
        PE = cagr(pe0, pe1, yrs)
        D = ((1 + T / 100) / (1 + P / 100) - 1) * 100
        decomp.append({
            "buyYear": b, "sellYear": s if not prog else TODAY.year,
            "inProgress": prog, "years": r2(yrs, 1),
            "peBuy": r2(pe0, 1), "peSell": r2(pe1, 1),
            "epsGrowthCagr": r2(E), "peCagr": r2(PE), "divCagr": r2(D),
            "priceCagr": r2(P), "totalCagr": r2(T),
        })

    # ── 지표 ──
    fy = sorted(eps_y)
    last_fy = fy[-1]
    def eps_cagr(n):
        a = eps_y.get(last_fy - n)
        return cagr(a, eps_y[last_fy], n) if a else None
    recent10 = [eps_y[y] for y in fy if y > last_fy - 10]
    down_years = sum(1 for y in fy if y > last_fy - 10 and (y - 1) in eps_y and eps_y[y] < eps_y[y - 1])
    peak = max(recent10) if recent10 else None
    pe_hist = [v for y, v in pe_y.items() if v and y > LAST_FULL - 10 and 0 < v < 200]
    pe_med = float(pd.Series(pe_hist).median()) if pe_hist else None
    hi3 = float(close[close.index >= close.index[-1] - pd.Timedelta(days=365 * 3)].max())
    def chg(days):
        past = close[close.index <= close.index[-1] - pd.Timedelta(days=days)]
        return (price_now / float(past.iloc[-1]) - 1) * 100 if not past.empty else None

    st = roll.get("stats") or {}
    g = eps_cagr(10)
    g5 = eps_cagr(5)
    div_y = cur.get("divYield") or 0
    exp_ret = None
    if pe_now and pe_med and g is not None:
        g_use = max(min(min(x for x in [g, g5] if x is not None), 15), -5)
        exit_pe = min(pe_med, 35)
        exp_ret = (((1 + g_use / 100) ** 10 * exit_pe / pe_now) ** 0.1 * (1 + div_y / 100) - 1) * 100

    metrics = {
        "key": key, "ticker": roll["ticker"], "name": roll.get("name"),
        "price": r2(price_now), "ttmEps": r2(ttm), "pe": r2(pe_now, 1), "divYield": r2(div_y),
        "peMed10": r2(pe_med, 1),
        "peVsMed": r2(pe_now / pe_med if pe_now and pe_med else None),
        "epsCagr10": r2(g), "epsCagr5": r2(g5), "epsDownYears10": down_years,
        "epsVsPeak": r2(ttm / peak if ttm and peak and peak > 0 else None),
        "lastFy": last_fy, "fromHigh3y": r2((price_now / hi3 - 1) * 100),
        "chg1y": r2(chg(365)), "chg3y": r2(chg(365 * 3)),
        "roll10Median": st.get("median"), "roll10Min": st.get("min"), "roll10N": st.get("n"),
        "roll10Over10": st.get("over10"), "beatBench": st.get("beatBench"), "beatTotal": st.get("beatTotal"),
        "expRet10": r2(exp_ret, 1),
    }
    out = {
        "key": key, "ticker": roll["ticker"], "name": roll.get("name"),
        "generated": TODAY.strftime("%Y-%m-%d"),
        "source": "EPS: SEC EDGAR 10-K (희석 EPS, 분할 보정) / 주가: Yahoo Finance",
        "eps": {str(y): r2(v, 3) for y, v in eps_y.items()},
        "pe": {str(y): r2(v, 1) for y, v in pe_y.items()},
        "decomp": decomp,
        "metrics": metrics,
    }
    (OUT / f"{key}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    return metrics


def main():
    files = sorted(ROLL.glob("*_rolling.json"))
    keys = [f.stem.replace("_rolling", "") for f in files]
    only = set(sys.argv[1:])
    keys = [k for k in keys if k not in SKIP and (not only or k in only)]
    rolls = {k: json.loads((ROLL / f"{k}_rolling.json").read_text()) for k in keys}
    keys = [k for k in keys if rolls[k].get("type") != "etf"]
    print(f"대상 {len(keys)}개")

    cik_map = load_cik_map()
    yf_tickers = [rolls[k]["ticker"].replace(".", "-") for k in keys]
    frames = []
    for i in range(0, len(yf_tickers), 80):
        chunk = yf_tickers[i:i + 80]
        print(f"주가 다운로드 {i}~{i + len(chunk)}")
        frames.append(yf.download(chunk, start="1995-01-01", auto_adjust=False, actions=True,
                                  group_by="ticker", progress=False, threads=True))
    prices = pd.concat(frames, axis=1)

    summary_path = OUT / "_summary.json"
    summary = {}
    if only and summary_path.exists():
        summary = {m["key"]: m for m in json.loads(summary_path.read_text()).get("stocks", [])}
    for i, k in enumerate(keys, 1):
        print(f"[{i}/{len(keys)}] {k}", flush=True)
        try:
            m = process(k, rolls[k], prices, cik_map)
            if m:
                summary[k] = m
        except Exception as e:  # 한 종목 실패가 전체를 멈추지 않게
            print(f"  {k}: 오류 {e}")
    summary_path.write_text(json.dumps({
        "generated": TODAY.strftime("%Y-%m-%d"),
        "stocks": sorted(summary.values(), key=lambda m: m["key"]),
    }, ensure_ascii=False, separators=(",", ":")))
    print(f"완료: {len(summary)}개")


if __name__ == "__main__":
    main()
