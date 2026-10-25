"""
export_cashflow.py — 전 종목 잉여현금흐름·자본 수익률 추가 (SEC XBRL companyfacts)

각 web/public/data/fundamentals/{KEY}.json 에 `cash` 항목을 더하고, metrics·_summary 에 지표를 추가한다.

연도별(회계연도, EPS와 같은 연도 매김 — 1~3월 종료는 전년도):
  ocf     영업활동 현금흐름
  capex   설비투자(유형자산 취득)
  fcf     잉여현금흐름 = ocf − capex
  ni      순이익(지배주주)
  div     배당 지급액, buyback 자사주 매입액
  equity  자기자본(연말), debt 차입금(장단기), cashInv 현금+단기 투자자산(연말)
  roe     순이익 ÷ 평균 자기자본 (%)
  roic    세후 영업이익 ÷ 평균 투하자본(자기자본 + 차입금 − 현금) (%)
  conv    잉여현금흐름 ÷ 순이익 (이익이 현금으로 남는 비율)
  fcfPs   주당 잉여현금흐름 = EPS × fcf ÷ ni (EPS가 이미 분할 보정돼 있어 같은 기준)
  fcfYield 주당 잉여현금흐름 ÷ 연말 주가 (%)
최근 1년(ttm): 최근 10-K + 올해 누적 10-Q − 작년 같은 기간 누적
지표(metrics): fcfYield·earnYield(최근 1년 EPS ÷ 주가)·roe·roic·conv5(5년 합계 기준)

금액 단위: 백만 달러(소수 1자리)

실행: GitHub Actions '전 종목 현금흐름·자본 수익률' (workflow_dispatch)
  python scripts/export_cashflow.py            # 전 종목
  python scripts/export_cashflow.py AAPL NKE   # 일부
"""
import json
import sys
import time
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).parent.parent
OUT = ROOT / "web" / "public" / "data" / "fundamentals"
UA = {"User-Agent": "justkeepbuyingtqqq research research@example.com"}

ANNUAL_FORMS = ("10-K", "10-K/A", "10-KT", "20-F", "40-F")

# 항목별 후보 이름 (앞쪽 우선)
OCF = ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"]
CAPEX = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets",
         "PaymentsForProceedsFromProductiveAssets",
         "PaymentsToExploreAndDevelopOilAndGasProperties", "PaymentsToAcquireOilAndGasPropertyAndEquipment",
         "PaymentsToAcquireOilAndGasProperty",                       # 석유·가스
         "PaymentsForConstructionInProcess",                         # 전력
         "PaymentsToDevelopRealEstateAssets", "PaymentsToAcquireAndDevelopRealEstate",  # 리츠(개발)
         "PaymentsForCapitalImprovements", "PaymentsToAcquireOtherPropertyPlantAndEquipment",
         "PaymentsToAcquireMachineryAndEquipment", "PaymentsToAcquireOtherProductiveAssets",
         "PaymentsToDevelopSoftware", "PaymentsForSoftware"]
# 회사 고유 이름(us-gaap 밖)의 설비투자 항목은 '_custom_' 접두어로 붙여 맨 뒤 후보로 씀
REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet",
       "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueGoodsNet", "RevenuesNetOfInterestExpense"]
NI = ["NetIncomeLoss", "NetIncomeLossAvailableToCommonStockholdersBasic", "ProfitLoss"]
DIV = ["PaymentsOfDividendsCommonStock", "PaymentsOfDividends"]
BUY = ["PaymentsForRepurchaseOfCommonStock"]
OPINC = ["OperatingIncomeLoss"]
PRETAX = ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
          "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments",
          "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"]
TAX = ["IncomeTaxExpenseBenefit"]
INTEREST = ["InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt", "InterestAndDebtExpense"]
# 금융사 판정: SEC 업종 코드(SIC) 6000~6399 = 은행·신용·증권·보험.
# 예금·대출·보험료 같은 고객 돈이 영업현금흐름에 섞여 잉여현금흐름·ROIC가 의미 없음.
# 예외: 6324 건강보험(유나이티드헬스 등)은 일반 기업처럼 봄
def is_financial(sic: int | None) -> bool:
    return sic is not None and 6000 <= sic <= 6399 and sic != 6324


def fetch_sic(cik: int) -> int | None:
    try:
        r = requests.get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json", headers=UA, timeout=60)
        time.sleep(0.12)
        return int(r.json().get("sic") or 0) or None if r.status_code == 200 else None
    except Exception:
        return None
EQUITY = ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"]
CASH = ["CashAndCashEquivalentsAtCarryingValue",
        "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "Cash"]
STINV = ["ShortTermInvestments", "MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesDebtSecuritiesCurrent"]
# 차입금: 묶음별로 첫 번째로 있는 것을 더함
DEBT_GROUPS = [
    ["LongTermDebt", "LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities", "DebtAndCapitalLeaseObligations"],
]
DEBT_SPLIT = [  # LongTermDebt 총액이 없을 때: 비유동 + 유동
    ["LongTermDebtNoncurrent", "LongTermDebtAndCapitalLeaseObligations"],
    ["LongTermDebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent", "DebtCurrent"],
]
DEBT_EXTRA = [["ShortTermBorrowings"], ["CommercialPaper"]]


def fy_of(end: pd.Timestamp) -> int:
    return end.year - 1 if end.month <= 3 else end.year


def usd_items(gaap: dict, name: str):
    return gaap.get(name, {}).get("units", {}).get("USD", [])


def annual_flow(gaap: dict, names: list) -> dict:
    """회계연도 종료일 → 값 (연간 기간, 가장 최근 공시). 앞쪽 이름에 값이 있는 연도가 우선."""
    out = {}
    for n in names:
        cur = {}
        for it in usd_items(gaap, n):
            if it.get("form") not in ANNUAL_FORMS or not it.get("start"):
                continue
            days = (pd.Timestamp(it["end"]) - pd.Timestamp(it["start"])).days
            if not 340 <= days <= 390:
                continue
            if it["end"] not in cur or it["filed"] > cur[it["end"]][1]:
                cur[it["end"]] = (float(it["val"]), it["filed"])
        for e, v in cur.items():
            out.setdefault(e, v[0])
    return out


def ytd_flow(gaap: dict, names: list) -> dict:
    """(시작일, 종료일) → 값: 분기 보고서의 연초 누적 값. 앞쪽 이름 우선으로 기간별 병합."""
    out = {}
    for n in names:
        cur = {}
        for it in usd_items(gaap, n):
            if it.get("form") not in ("10-Q", "10-Q/A") or not it.get("start"):
                continue
            key = (it["start"], it["end"])
            if key not in cur or it["filed"] > cur[key][1]:
                cur[key] = (float(it["val"]), it["filed"])
        for k, v in cur.items():
            out.setdefault(k, v[0])
    return out


def instant(gaap: dict, names: list) -> dict:
    """날짜 → 값 (재무상태표 시점 값, 가장 최근 공시). 앞쪽 이름 우선."""
    out = {}
    for n in names:
        cur = {}
        for it in usd_items(gaap, n):
            if it.get("start"):
                continue
            if it["end"] not in cur or it["filed"] > cur[it["end"]][1]:
                cur[it["end"]] = (float(it["val"]), it["filed"])
        for e, v in cur.items():
            out.setdefault(e, v[0])
    return out


def debt_at(gaap: dict) -> dict:
    tot = instant(gaap, DEBT_GROUPS[0])
    nonc = instant(gaap, DEBT_SPLIT[0])
    curr = instant(gaap, DEBT_SPLIT[1])
    extras = [instant(gaap, g) for g in DEBT_EXTRA]
    dates = set(tot) | set(nonc) | set(curr)
    out = {}
    for d in dates:
        v = tot[d] if d in tot else (nonc.get(d, 0.0) + curr.get(d, 0.0))
        out[d] = v + sum(x.get(d, 0.0) for x in extras)
    for x in extras:  # 장기 차입금이 없고 단기만 있는 경우
        for d, v in x.items():
            if d not in out:
                out[d] = sum(y.get(d, 0.0) for y in extras)
    return out


def ttm(gaap: dict, names: list, annual: dict):
    """최근 1년 = 최근 연간 + 올해 누적 − 작년 같은 기간 누적. (값, 종료일) 또는 None."""
    if not annual:
        return None
    last_end = max(annual)
    ytd = ytd_flow(gaap, names)
    cands = [(s, e) for (s, e) in ytd if e > last_end and s >= last_end]
    if not cands:
        return annual[last_end], last_end
    s, e = max(cands, key=lambda k: k[1])
    span = (pd.Timestamp(e) - pd.Timestamp(s)).days
    pe = pd.Timestamp(e) - pd.DateOffset(years=1)
    prev = None
    for (s2, e2), v in ytd.items():
        if abs((pd.Timestamp(e2) - pe).days) <= 10 and abs((pd.Timestamp(e2) - pd.Timestamp(s2)).days - span) <= 10:
            prev = v
            break
    if prev is None:
        return annual[last_end], last_end
    return annual[last_end] + ytd[(s, e)] - prev, e


def near(d: dict, end: str, tol=10):
    """종료일과 가까운(±tol일) 시점 값."""
    if end in d:
        return d[end]
    t = pd.Timestamp(end)
    best = None
    for k, v in d.items():
        gap = abs((pd.Timestamp(k) - t).days)
        if gap <= tol and (best is None or gap < best[0]):
            best = (gap, v)
    return best[1] if best else None


def m(x):  # 백만 달러
    return None if x is None else round(x / 1e6, 1)


def pct(x):
    return None if x is None else round(x * 100, 1)


def year_end_close(fund: dict) -> dict:
    mo = fund.get("monthly") or {}
    if not mo.get("c"):
        return {}
    y0, m0 = map(int, mo["start"].split("-"))
    out = {}
    for i, c in enumerate(mo["c"]):
        mm = m0 - 1 + i
        y, mon = y0 + mm // 12, mm % 12 + 1
        if mon == 12 and c:
            out[y] = c
    return out


FCF_OK_INSURERS = {"BRKB"}  # 보험이 일부인 복합 기업(버크셔): 잉여현금흐름 유지


def latest_quarter(gaap: dict, names: list, annual: dict):
    """가장 최근 한 분기(약 3개월) 매출: 10-Q의 3개월 값, 또는 4분기 = 연간 − 9개월 누적.
    {'start','end','rev','prev'} (prev = 1년 전 같은 분기) 또는 None. 판매 시계용."""
    q = {}
    for n in names:
        cur = {}
        for it in usd_items(gaap, n):
            if it.get("form") not in ("10-Q", "10-Q/A") or not it.get("start"):
                continue
            days = (pd.Timestamp(it["end"]) - pd.Timestamp(it["start"])).days
            if not 80 <= days <= 115:  # 코스트코처럼 12·16주 분기도 포함
                continue
            key = (it["start"], it["end"])
            if key not in cur or it["filed"] > cur[key][1]:
                cur[key] = (float(it["val"]), it["filed"])
        for k, v in cur.items():
            q.setdefault(k, v[0])
    ytd = ytd_flow(gaap, names)
    for end, v in annual.items():  # 4분기 = 연간 − 같은 회계연도 9개월 누적
        e = pd.Timestamp(end)
        for (s9, e9), v9 in ytd.items():
            span = (pd.Timestamp(e9) - pd.Timestamp(s9)).days
            if 245 <= span <= 290 and 330 <= (e - pd.Timestamp(s9)).days <= 380 and 80 <= (e - pd.Timestamp(e9)).days <= 115:
                q.setdefault(((pd.Timestamp(e9) + pd.Timedelta(days=1)).strftime("%Y-%m-%d"), end), v - v9)
                break
    if not q:
        return None
    (s0, e0), v0 = max(q.items(), key=lambda kv: kv[0][1])
    if v0 <= 0:
        return None
    prev = None
    pe = pd.Timestamp(e0) - pd.DateOffset(years=1)
    for (s2, e2), v2 in q.items():
        if abs((pd.Timestamp(e2) - pe).days) <= 10:
            prev = v2
            break
    return {"start": s0, "end": e0, "rev": m(v0), **({"prev": m(prev)} if prev and prev > 0 else {})}


def build(gaap: dict, fund: dict, sic: int | None = None) -> dict | None:
    ocf = annual_flow(gaap, OCF)
    ni = annual_flow(gaap, NI)
    if not ocf or not ni:
        return None
    capex_names = CAPEX + sorted(n for n in gaap if n.startswith("_custom_"))
    capex = annual_flow(gaap, capex_names)
    div = annual_flow(gaap, DIV)
    buy = annual_flow(gaap, BUY)
    opinc = annual_flow(gaap, OPINC)
    pretax = annual_flow(gaap, PRETAX)
    tax = annual_flow(gaap, TAX)
    interest = annual_flow(gaap, INTEREST)
    bank = is_financial(sic)
    no_fcf = bank and fund.get("key") not in FCF_OK_INSURERS  # 고객 돈이 현금흐름에 섞이는 금융사
    if not opinc and not bank:  # 영업이익 항목이 없으면 세전이익 + 이자비용으로 근사 (예: 나이키)
        opinc = {e: v + interest.get(e, 0.0) for e, v in pretax.items()}
    eq = instant(gaap, EQUITY)
    cash = instant(gaap, CASH)
    stinv = instant(gaap, STINV)
    debt = debt_at(gaap)
    eps = {int(k): v for k, v in (fund.get("eps") or {}).items()}
    px = year_end_close(fund)

    ends = sorted(set(ocf) & set(ni))
    years = {}
    prev_eq = prev_ic = None
    prev_end = None
    for end in ends:
        y = fy_of(pd.Timestamp(end))
        o, n = ocf[end], ni[end]
        c = capex.get(end)
        f = o - c if c is not None else None  # 설비투자를 못 찾은 해는 비움 (영업현금을 그대로 쓰면 부풀려짐)
        e = near(eq, end)
        ca = near(cash, end)
        st = near(stinv, end) or 0.0
        dbt = near(debt, end)
        ci = None if ca is None else ca + st
        ic = None if e is None else e + (dbt or 0.0) - (ci or 0.0)
        # 직전 연도 말 값이 1년 전이면 평균, 아니면 연말 값
        consecutive = prev_end is not None and 330 <= (pd.Timestamp(end) - pd.Timestamp(prev_end)).days <= 400
        avg_eq = (e + prev_eq) / 2 if (e is not None and prev_eq is not None and consecutive) else e
        avg_ic = (ic + prev_ic) / 2 if (ic is not None and prev_ic is not None and consecutive) else ic
        roe = n / avg_eq if avg_eq and avg_eq > 0 else None
        if roe is not None and abs(roe) > 3:  # 자기자본이 너무 작아 의미 없음
            roe = None
        roic = None
        if end in opinc and avg_ic and avg_ic > 0:
            rate = 0.21 if y >= 2018 else 0.35
            if end in tax and end in pretax and pretax[end] > 0:
                rate = min(max(tax[end] / pretax[end], 0.0), 0.40)
            roic = opinc[end] * (1 - rate) / avg_ic
            # 현금이 많아 투하자본이 (자기자본 + 차입금)의 10% 미만이면 비율이 의미 없이 커짐
            base = (e or 0.0) + (dbt or 0.0)
            if (ic is not None and base > 0 and ic < 0.1 * base) or abs(roic) > 3:
                roic = None
        conv = f / n if f is not None and n > 0 else None
        fps = None
        if f is not None and y in eps and eps[y] and abs(eps[y]) >= 0.1 and n and (eps[y] > 0) == (n > 0):
            fps = eps[y] * f / n  # = 잉여현금 ÷ (순이익 ÷ EPS) — 분할 보정된 주식 수 기준
        fy_yield = fps / px[y] if fps is not None and px.get(y) else None
        if no_fcf:
            o = c = f = conv = fps = fy_yield = None
        if bank:
            roic = None  # 금융사(버크셔 포함)는 투하자본 개념이 맞지 않음
        years[str(y)] = {k: v for k, v in {
            "end": end, "ocf": m(o), "capex": m(c), "fcf": m(f), "ni": m(n),
            "div": m(div.get(end)), "buyback": m(buy.get(end)),
            "equity": m(e), "debt": m(dbt), "cashInv": m(ci),
            "roe": pct(roe), "roic": pct(roic), "conv": None if conv is None else round(conv, 2),
            "fcfPs": None if fps is None else round(fps, 3), "fcfYield": pct(fy_yield),
        }.items() if v is not None}
        prev_eq, prev_ic, prev_end = e, ic, end

    rev = annual_flow(gaap, REV)
    rq = latest_quarter(gaap, REV, rev) if rev else None
    if no_fcf:
        return {"years": years, "bank": True, "sic": sic, **({"revQ": rq} if rq else {})}
    t_ocf = ttm(gaap, OCF, ocf)
    t_cap = ttm(gaap, capex_names, capex) if capex else None
    t_ni = ttm(gaap, NI, ni)
    out = {"years": years, "sic": sic, **({"revQ": rq} if rq else {})}
    last_end = max(ocf)
    if t_ocf and t_ni and t_cap and t_ocf[1] == t_ni[1] == t_cap[1] and last_end in capex:
        out["ttm"] = {"asOf": t_ocf[1], "ocf": m(t_ocf[0]), "capex": m(t_cap[0]),
                      "fcf": m(t_ocf[0] - t_cap[0]), "ni": m(t_ni[0])}
    else:  # 기간이 안 맞으면 잉여현금흐름이 있는 최근 연간 값
        withf = [y for y in years if "fcf" in years[y]]
        if withf:
            last = years[max(withf, key=int)]
            out["ttm"] = {"asOf": last["end"], "ocf": last["ocf"], "capex": last.get("capex", 0),
                          "fcf": last["fcf"], "ni": last["ni"], "annualOnly": True}
            if int(max(withf, key=int)) < int(max(years, key=int)) - 1:  # 2년 넘게 비면 쓰지 않음
                out.pop("ttm")
    return out


def metrics(fund: dict, cash: dict) -> dict:
    mt = fund.get("metrics") or {}
    price = (fund.get("lastPrice") or {}).get("close") or mt.get("price")
    ttm_eps = mt.get("ttmEps")
    t = cash.get("ttm")
    out = {}
    if price and ttm_eps is not None:
        out["earnYield"] = round(ttm_eps / price * 100, 2)
    fps = None
    if t is None:  # 은행: 잉여현금흐름 지표 없음
        t = {}
    sh = (fund.get("shares") or {}).get("count")
    if "fcf" not in t:
        pass
    elif sh:  # 공시 유통 주식 수 기준 (EPS 출처와 순이익 출처가 달라 생기는 오차를 피함)
        fps = t["fcf"] * 1e6 / sh
    if fps is None and "fcf" in t and t.get("ni") and ttm_eps and (t["ni"] > 0) == (ttm_eps > 0) \
            and abs(t["fcf"] / t["ni"]) <= 5:
        fps = ttm_eps * t["fcf"] / t["ni"]
    if fps is not None and price:
        out["fcfPs"] = round(fps, 3)
        out["fcfYield"] = round(fps / price * 100, 2)
    ys = sorted(cash["years"], key=int)
    last = cash["years"][ys[-1]] if ys else {}
    for k in ("roe", "roic"):
        if k in last:
            out[k] = last[k]
    recent = [cash["years"][y] for y in ys[-5:]]
    withf = [r for r in recent if "fcf" in r]  # 잉여현금흐름이 있는 해만
    f5 = sum(r["fcf"] for r in withf)
    n5 = sum(r.get("ni", 0) for r in withf)
    if "fcf" in t and n5 > 0 and len(withf) >= 3 and abs(f5 / n5) <= 5:
        out["conv5"] = round(f5 / n5, 2)
    roic5 = [r["roic"] for r in recent if "roic" in r]
    if len(roic5) >= 3:
        out["roic5"] = round(sorted(roic5)[len(roic5) // 2], 1)  # 5년 중간값
    roe5 = [r["roe"] for r in recent if "roe" in r]
    if len(roe5) >= 3:
        out["roe5"] = round(sorted(roe5)[len(roe5) // 2], 1)
    return out


CASH_METRIC_KEYS = ("earnYield", "fcfPs", "fcfYield", "roe", "roic", "conv5", "roic5", "roe5")


def load_cik_map():
    r = requests.get("https://www.sec.gov/files/company_tickers.json", headers=UA, timeout=30)
    r.raise_for_status()
    return {v["ticker"].upper(): int(v["cik_str"]) for v in r.json().values()}


def debug_payments(keys):
    """설비투자 항목을 못 찾는 종목 점검용: 'Payments…' 계열 항목과 최근 연간 값 출력."""
    cik_map = load_cik_map()
    for k in keys:
        fund = json.loads((OUT / f"{k}.json").read_text())
        t = (fund.get("ticker") or k).replace(".", "-").upper()
        cik = cik_map.get(t) or cik_map.get(t.replace("-", "."))
        r = requests.get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json", headers=UA, timeout=90)
        time.sleep(0.12)
        facts = r.json().get("facts", {})
        print(f"== {k}")
        for ns, items in facts.items():
            for n, v in items.items():
                if not (n.startswith("Payments") or "Capital" in n and "Expend" in n):
                    continue
                a = annual_flow({n: v}, [n])
                if a:
                    e = max(a)
                    print(f"   {ns}:{n} {e} {a[e] / 1e6:,.0f}M")


def main():
    if sys.argv[1:2] == ["--debug-rev"]:  # 최근 분기 매출이 오래된 종목: 매출 이름별 마지막 10-Q 3개월 값
        cik_map = load_cik_map()
        for k in sys.argv[2:]:
            cik = cik_map.get(k)
            r = requests.get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json", headers=UA, timeout=90)
            g = r.json().get("facts", {}).get("us-gaap", {})
            for n, v in g.items():
                if "Revenue" not in n and "Sales" not in n:
                    continue
                its = [it for it in v.get("units", {}).get("USD", []) if it.get("start") and it.get("form", "").startswith("10-Q")
                       and 80 <= (pd.Timestamp(it["end"]) - pd.Timestamp(it["start"])).days <= 115]
                if its:
                    last = max(its, key=lambda it: it["end"])
                    print(k, n, last["start"], last["end"], last["val"], flush=True)
        return
    if sys.argv[1:2] == ["--debug-capex"]:
        debug_payments(sys.argv[2:])
        return
    only = set(sys.argv[1:])
    keys = sorted(f.stem for f in OUT.glob("*.json") if not f.stem.startswith("_"))
    keys = [k for k in keys if not only or k in only]
    cik_map = load_cik_map()
    summary_path = OUT / "_summary.json"
    summary = json.loads(summary_path.read_text()) if summary_path.exists() else {"stocks": []}
    by_key = {s["key"]: s for s in summary.get("stocks", [])}
    ok = 0
    for i, k in enumerate(keys, 1):
        path = OUT / f"{k}.json"
        fund = json.loads(path.read_text())
        t = (fund.get("ticker") or k).replace(".", "-").upper()
        cik = cik_map.get(t) or cik_map.get(t.replace("-", "."))
        if not cik:
            print(f"[{i}/{len(keys)}] {k}: CIK 없음")
            continue
        try:
            r = requests.get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json", headers=UA, timeout=90)
            time.sleep(0.12)
            if r.status_code != 200:
                print(f"[{i}/{len(keys)}] {k}: HTTP {r.status_code}")
                continue
            facts = r.json().get("facts", {})
            gaap = dict(facts.get("us-gaap", {}))
            for ns, items in facts.items():  # 회사 고유 설비투자 항목
                if ns in ("us-gaap", "dei", "srt", "ifrs-full", "invest"):
                    continue
                for n, v in items.items():
                    if "CapitalExpenditure" in n and "Incurred" not in n and "Accrued" not in n:
                        gaap["_custom_" + n] = v
            sic = fetch_sic(cik)
            cash = build(gaap, fund, sic)
        except Exception as e:  # 한 종목 실패가 전체를 멈추지 않게
            print(f"[{i}/{len(keys)}] {k}: 오류 {e}")
            continue
        if not cash:
            print(f"[{i}/{len(keys)}] {k}: 현금흐름 없음")
            continue
        mt = metrics(fund, cash)
        fund["cash"] = cash
        for kk in CASH_METRIC_KEYS:  # 이전 실행 값이 남지 않게
            fund.setdefault("metrics", {}).pop(kk, None)
            if k in by_key:
                by_key[k].pop(kk, None)
        fund["metrics"].update(mt)
        path.write_text(json.dumps(fund, ensure_ascii=False, separators=(",", ":")))
        if k in by_key:
            by_key[k].update(mt)
        ok += 1
        last = cash["years"][max(cash["years"], key=int)]
        print(f"[{i}/{len(keys)}] {k}: {len(cash['years'])}년{' (은행)' if cash.get('bank') else ''}, 최근 1년 FCF {(cash.get('ttm') or {}).get('fcf')}M, "
              f"분기 매출 {cash.get('revQ')}, FCF수익률 {mt.get('fcfYield')}%, 이익수익률 {mt.get('earnYield')}%, ROE {last.get('roe')}%, ROIC {last.get('roic')}%",
              flush=True)
    summary["stocks"] = sorted(by_key.values(), key=lambda s: s["key"])
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, separators=(",", ":")))
    print(f"완료: {ok}/{len(keys)}")


if __name__ == "__main__":
    main()
