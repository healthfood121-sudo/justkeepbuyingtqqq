"""
withdrawal_cash_tier.py

자산 규모별 현금 비중 (TQQQ + 현금) vs DLEV (TQQQ + 나스닥100) vs S0 — 스왑금리 반영 전용
──────────────────────────────────────────────────────────────────────────────
신호: S0 그대로 (NDX EMA200 아래/위 15거래일 연속 → 전량 현금 / 재매수)
투자 중에는 총자산(현금 포함)에 따라 TQQQ 목표 비중을 정하고 나머지는 현금(외화RP) 또는 나스닥100으로 보유.

  S0    : 항상 TQQQ 100%
  C50   : 총자산 50억↑ → TQQQ ⅔ + 현금 ⅓ (≈2배), 200억↑ → TQQQ ⅓ + 현금 ⅔ (≈1배)
  C30   : 같은 구조, 기준 30억 / 100억
  C100  : 같은 구조, 기준 100억 / 300억
  C50S  : 50억↑ → TQQQ ⅔ + 현금 ⅓ 한 단계만
  Q50   : DLEV와 같은 노출 — 50억↑ TQQQ ½ + 나스닥100 ½, 200억↑ 나스닥100 100%

현금 쪽 규칙:
  - 생활비는 현금에서 먼저 꺼내고, 모자라면 TQQQ(→나스닥100)를 판다
  - 월초 1회, 목표 비중과 5%p 넘게 벌어지면 리밸런싱 (매도분 양도세 과세)
  - 하락 신호 시: TQQQ(와 나스닥100) 전량 매도 → 전부 현금
  - 재매수 신호 시: 그 시점 총자산 기준 목표 비중만큼만 TQQQ 매수 (현금 비중은 유지)

세금 (모든 매도에 적용 — 기존 연구 스크립트와 달리 하락 신호 매도도 과세):
  - 해외 ETF 양도차익 22%, 연 250만 공제, 다음 해 1월 초 현금에서 납부 (모자라면 TQQQ 매도)
  - 외화RP 이자 15.4% 원천징수
  - 비교용으로 --no-signal-tax 모드(하락 신호 매도 비과세, 기존 스크립트 가정)도 함께 계산

단순화: 기존 스크립트의 VOO 편입 규칙은 넣지 않았다 (현금 비중 자체가 실험 대상이므로).

출력: web/public/data/withdrawal_cash_tier_v2.json
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

ROOT     = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
OUT_PATH = ROOT / "web/public/data/withdrawal_cash_tier_v2.json"

INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_3X     = 0.0088
EXP_1X     = 0.0020
LIV_MAX    = 15_000_000
TAX_RATE   = 0.22
DEDUCTION  = 2_500_000
RP_SPREAD  = 0.004
RP_TAX_R   = 0.154
FEE_RATE   = 0.0007
DYN_RATES  = (0.003, 0.005, 0.007)
DYN_THRS   = (1_000_000_000, 2_000_000_000)
TIME_FILTER = 15
BAND       = 0.05

EOK = 100_000_000


@dataclass
class Param:
    name:  str
    desc:  str
    tiers: tuple          # ((총자산 하한, TQQQ 비중), ...) 하한 오름차순
    side:  str = "cash"   # "cash" | "qqq"


STRATEGIES = [
    Param("S0",   "항상 TQQQ 100%",                                   ((0, 1.0),)),
    Param("C50",  "50억↑ TQQQ⅔+현금⅓ · 200억↑ TQQQ⅓+현금⅔",          ((0, 1.0), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3))),
    Param("C30",  "30억↑ TQQQ⅔+현금⅓ · 100억↑ TQQQ⅓+현금⅔",          ((0, 1.0), (30 * EOK, 2 / 3), (100 * EOK, 1 / 3))),
    Param("C100", "100억↑ TQQQ⅔+현금⅓ · 300억↑ TQQQ⅓+현금⅔",         ((0, 1.0), (100 * EOK, 2 / 3), (300 * EOK, 1 / 3))),
    Param("C50S", "50억↑ TQQQ⅔+현금⅓ (한 단계만)",                    ((0, 1.0), (50 * EOK, 2 / 3))),
    Param("Q50",  "DLEV: 50억↑ TQQQ½+나스닥100½ · 200억↑ 나스닥100",   ((0, 1.0), (50 * EOK, 0.5), (200 * EOK, 0.0)), side="qqq"),
]


def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]
    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)
    ret    = np.insert(np.diff(closes) / closes[:-1], 0, 0.0)

    with open(DATA_DIR / "fed_funds_rate.json", encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}
    ffr = np.array([fed_rates.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 for d in dates])

    f3 = (1.0 + 3.0 * ret - 2.0 * ffr / 252) * (1.0 - EXP_3X / 252)
    f3[0] = 1.0
    f1 = (1.0 + ret) * (1.0 - EXP_1X / 252)
    f1[0] = 1.0

    a = 2.0 / 201
    ema = np.full(n, np.nan)
    ema[199] = closes[:200].mean()
    for i in range(200, n):
        ema[i] = closes[i] * a + ema[i - 1] * (1 - a)
    # RP 일이자 (세후) — 원본 스크립트와 같이 데이터 없는 달은 3% 가정
    rp_daily = np.array([max(0.0, fed_rates.get(f"{d.year}-{d.month:02d}", 3.0) / 100 - RP_SPREAD) / 252
                         for d in dates]) * (1 - RP_TAX_R)
    return 100 * np.cumprod(f3), 100 * np.cumprod(f1), closes, ema, dates, rp_daily


def get_monthly_starts(dates):
    seen, out = set(), []
    for i, d in enumerate(dates):
        if (d.year, d.month) not in seen:
            seen.add((d.year, d.month))
            out.append(i)
    return out


def target_w(p: Param, total: float) -> float:
    w = p.tiers[0][1]
    for lo, tw in p.tiers:
        if total >= lo:
            w = tw
    return w


def run_sim(tq, qq, closes, ema, dates, rp_daily, start, p: Param, signal_tax: bool) -> dict:
    n       = len(closes)
    sim_len = min(n - start, SIM_YEARS * 252)

    # 보유: [주수, 평균단가]
    pos = {"tq": [0.0, 0.0], "qq": [0.0, 0.0]}
    px  = {"tq": tq, "qq": qq}
    cash = float(INITIAL)
    year_gain = 0.0
    tax_due   = 0.0
    cur_year  = dates[start].year
    withdrawn = 0.0
    trades = rebals = 0
    min_val = float("inf")
    cash_w_sum = 0.0
    cash_w_n   = 0

    def val(k, ci):
        return pos[k][0] * px[k][ci]

    def buy(k, amount, ci):
        nonlocal cash
        amount = min(amount, cash)
        if amount <= 0:
            return
        net = amount * (1 - FEE_RATE)
        sh  = net / px[k][ci]
        s0, c0 = pos[k]
        pos[k] = [s0 + sh, (s0 * c0 + net) / (s0 + sh)]
        cash -= amount

    def sell(k, amount, ci, taxable=True):
        nonlocal cash, year_gain
        v = val(k, ci)
        amount = min(amount, v)
        if amount <= 0:
            return
        sh = amount / px[k][ci]
        gain = amount - sh * pos[k][1]
        if taxable:
            year_gain += gain
        pos[k][0] -= sh
        if pos[k][0] < 1e-9:
            pos[k] = [0.0, 0.0]
        cash += amount * (1 - FEE_RATE)

    def raise_cash(need, ci):
        """현금이 need보다 적으면 나스닥100 → TQQQ 순서로 팔아 채운다."""
        for k in ("qq", "tq"):
            short = need - cash
            if short <= 0:
                return
            sell(k, short / (1 - FEE_RATE), ci)

    def total(ci):
        return cash + val("tq", ci) + val("qq", ci)

    def rebalance(ci, force=False):
        nonlocal rebals
        tot = total(ci)
        if tot <= 0:
            return
        w  = target_w(p, tot)
        cw = val("tq", ci) / tot
        if not force and abs(cw - w) <= BAND:
            return
        diff = val("tq", ci) - w * tot
        if diff > 0:                       # TQQQ 과다 → 매도
            sell("tq", diff, ci)
            if p.side == "qqq":
                buy("qq", diff * (1 - FEE_RATE), ci)
        else:                              # TQQQ 부족 → 매수
            if p.side == "qqq":
                sell("qq", -diff, ci)
            buy("tq", -diff, ci)
        rebals += 0 if force else 1

    invested = not (not np.isnan(ema[start]) and closes[start] < ema[start])
    if invested:
        tot = total(start)
        w = target_w(p, tot)
        buy("tq", w * tot, start)
        if p.side == "qqq":
            buy("qq", cash, start)

    below = above = 0
    last_mon = None
    for j in range(sim_len):
        ci = start + j
        d  = dates[ci]

        if (d.year, d.month) != last_mon:
            last_mon = (d.year, d.month)
            # 연초: 전년도 양도세 납부
            if d.year != cur_year:
                tax_due += max(0.0, year_gain - DEDUCTION) * TAX_RATE
                year_gain = 0.0
                cur_year = d.year
            if tax_due > 0:
                raise_cash(tax_due, ci)
                pay = min(tax_due, cash)
                cash -= pay
                tax_due -= pay

            # 생활비 인출 (첫날 제외)
            if j > 0:
                tot  = total(ci)
                rate = DYN_RATES[0] if tot < DYN_THRS[0] else DYN_RATES[1] if tot < DYN_THRS[1] else DYN_RATES[2]
                cap  = min(tot * rate, float(LIV_MAX))
                if invested:
                    living = cap
                else:
                    yc = cap * 12
                    lr = (1.0 if yc <= 0 or cash / yc >= 2 else 0.7 if cash / yc >= 1
                          else 0.5 if cash / yc >= 0.5 else 0.3)
                    living = cap * lr
                raise_cash(living, ci)
                living = min(living, cash)
                cash -= living
                withdrawn += living

            if invested:
                rebalance(ci)

        # 신호
        e = ema[ci]
        if not np.isnan(e) and e > 0:
            if closes[ci] < e:
                below += 1; above = 0
            elif closes[ci] > e:
                above += 1; below = 0
            else:
                below = above = 0
            if invested and below >= TIME_FILTER:
                for k in ("tq", "qq"):
                    sell(k, val(k, ci), ci, taxable=signal_tax)
                invested = False
                trades += 1
                below = 0
            elif not invested and above >= TIME_FILTER:
                rebalance(ci, force=True)
                if p.side == "qqq":
                    buy("qq", cash, ci)
                invested = True
                trades += 1
                above = 0

        cash += cash * rp_daily[ci]
        tot = total(ci)
        if invested and tot > 0:
            cash_w_sum += (tot - val("tq", ci)) / tot
            cash_w_n   += 1
        min_val = min(min_val, tot)
        if tot <= 0:
            break

    final = total(start + sim_len - 1)
    return {
        "final":     round(final / EOK, 2),
        "withdrawn": round(withdrawn / EOK, 2),
        "min":       round(min_val / EOK, 4),
        "trades":    trades,
        "rebals":    rebals,
        "side_pct":  round(cash_w_sum / cash_w_n * 100, 1) if cash_w_n else 0.0,
        "ongoing":   bool(sim_len < SIM_YEARS * 252),
    }


_S = {}


def _init(*args):
    keys = ("tq", "qq", "closes", "ema", "dates", "rp", "starts")
    _S.update(dict(zip(keys, args)))
    _S["dates"] = pd.DatetimeIndex(_S["dates"])


def _job(arg):
    p, signal_tax = arg
    s = _S
    return (p.name, signal_tax), [run_sim(s["tq"], s["qq"], s["closes"], s["ema"], s["dates"], s["rp"],
                                          si, p, signal_tax) for si in s["starts"]]


def summarize(rs, base, labels):
    done = [(lab, r, b) for lab, r, b in zip(labels, rs, base) if not r["ongoing"]]
    fin  = sorted(r["final"] for _, r, _ in done)
    nd   = len(done)
    q    = lambda xs, f: xs[int(len(xs) * f)]
    eras = {}
    for key, a, b in (("1970s", 1971, 1980), ("1980s", 1980, 1990), ("1990s", 1990, 2000), ("2000s", 2000, 2010)):
        xs = sorted(r["final"] for lab, r, _ in done if a <= int(lab[:4]) < b)
        if xs:
            eras[key] = round(q(xs, 0.5), 1)
    return {
        "med_final":     round(q(fin, 0.5), 1),
        "p25_final":     round(q(fin, 0.25), 1),
        "p10_final":     round(q(fin, 0.10), 1),
        "p5_final":      round(q(fin, 0.05), 1),
        "worst_final":   round(fin[0], 2),
        "n_below_init":  sum(1 for x in fin if x < INITIAL / EOK),
        "min_of_min":    round(min(r["min"] for _, r, _ in done), 4),
        "avg_withdrawn": round(sum(r["withdrawn"] for _, r, _ in done) / nd, 2),
        "med_withdrawn": round(q(sorted(r["withdrawn"] for _, r, _ in done), 0.5), 2),
        "avg_rebals":    round(sum(r["rebals"] for _, r, _ in done) / nd, 1),
        "avg_side_pct":  round(sum(r["side_pct"] for _, r, _ in done) / nd, 1),
        "win_vs_s0":     round(sum(1 for _, r, b in done if r["final"] > b["final"]) / nd * 100, 1),
        "era_median":    eras,
        "n_completed":   nd,
    }


def main():
    t0 = time.time()
    tq, qq, closes, ema, dates, rp = load_data()
    starts = get_monthly_starts(dates)
    labels = [dates[i].strftime("%Y-%m") for i in starts]
    jobs = [(p, st) for st in (True, False) for p in STRATEGIES]
    with mp.Pool(min(mp.cpu_count(), len(jobs)), initializer=_init,
                 initargs=(tq, qq, closes, ema, dates.tolist(), rp, starts)) as pool:
        raw = dict(pool.map(_job, jobs, chunksize=1))

    out_summary = {}
    for st, mode in ((True, "tax_all"), (False, "no_signal_tax")):
        base = raw[("S0", st)]
        rows = []
        for p in STRATEGIES:
            s = summarize(raw[(p.name, st)], base, labels)
            rows.append({"name": p.name, "desc": p.desc, **s})
        out_summary[mode] = rows
        title = "모든 매도 과세 (현실)" if st else "하락 신호 매도 비과세 (기존 가정)"
        print(f"\n[{title}]")
        print(f"{'이름':<5}{'중앙':>7}{'p25':>7}{'p10':>7}{'p5':>6}{'<10억':>6}{'최저점':>7}"
              f"{'인출합':>7}{'리밸':>5}{'현금%':>6}{'S0대비':>7}  70s/80s/90s/00s")
        for r in rows:
            era = "/".join(f"{v:.0f}" for v in r["era_median"].values())
            print(f"{r['name']:<5}{r['med_final']:7.1f}{r['p25_final']:7.1f}{r['p10_final']:7.1f}{r['p5_final']:6.1f}"
                  f"{r['n_below_init']:6}{r['min_of_min']:7.2f}{r['avg_withdrawn']:7.1f}{r['avg_rebals']:5.1f}"
                  f"{r['avg_side_pct']:6.1f}{r['win_vs_s0']:6.1f}%  {era}")

    cohorts = []
    for k, lab in enumerate(labels):
        row = {"start": lab}
        for p in STRATEGIES:
            r = raw[(p.name, True)][k]
            row[p.name] = {key: r[key] for key in ("final", "withdrawn", "min", "rebals", "side_pct", "ongoing")}
        cohorts.append(row)

    out = {
        "meta": {
            "generated":  str(dates[-1].date()),
            "price_mode": "with_costs",
            "sim_years":  SIM_YEARS,
            "n_cohorts":  len(starts),
            "note":       "S0 신호 고정. 투자 중 총자산 기준 TQQQ 목표 비중, 나머지 현금(외화RP) 또는 나스닥100. "
                          "cohorts는 모든 매도 과세 기준. summary.no_signal_tax는 기존 스크립트 가정(하락 신호 매도 비과세).",
            "strategies": [{"name": p.name, "desc": p.desc} for p in STRATEGIES],
        },
        "summary": out_summary,
        "cohorts": cohorts,
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초")


if __name__ == "__main__":
    main()
