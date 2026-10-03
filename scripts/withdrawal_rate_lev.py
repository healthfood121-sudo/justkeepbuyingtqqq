"""
withdrawal_rate_lev.py

금리 연동 레버리지 검증 (스왑금리 2×/1× 반영 전용)
──────────────────────────────────────────────────────────────
S0 신호(NDX EMA200 15일 연속 + 동적인출 0.3/0.5/0.7%)는 그대로 두고,
투자 중 보유 종목만 기준금리에 따라 바꾼다.

  S0     : 항상 TQQQ(3x)                       ← 기준선 (withdrawal_new_ideas2_v2 S0와 동일 수치)
  QLD    : 항상 QLD(2x)
  R4~R10 : 월초 기준금리 ≥ X% 이면 QLD(2x), 미만이면 TQQQ(3x)

전환 처리 (현실 반영):
  - 월초에만 판정 (월 1회)
  - 전환 = 보유분 전량 매도 → 양도차익 22% 과세(연말 정산, 250만 공제) → 수수료 0.07%×2 → 다른 종목 전액 매수
  - 현금 상태에서 재진입할 때는 그 시점 금리 기준으로 종목 선택

가격 모델 (data_loader with_costs 와 동일):
  TQQQ: (1 + 3r − 2×FFR/252) × (1 − 0.88%/252)
  QLD : (1 + 2r − 1×FFR/252) × (1 − 0.95%/252)

나머지(세금·RP 이자·VOO 편입·인출 규칙)는 withdrawal_new_ideas2.py의 S0 로직과 동일.

출력: web/public/data/withdrawal_rate_lev_v2.json
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

ROOT     = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
FED_PATH = DATA_DIR / "fed_funds_rate.json"
OUT_PATH = ROOT / "web/public/data/withdrawal_rate_lev_v2.json"

INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_3X     = 0.0088
EXP_2X     = 0.0095
LIV_MAX    = 15_000_000
TAX_RATE   = 0.22
DEDUCTION  = 2_500_000
RP_SPREAD  = 0.004
RP_TAX_R   = 0.154
FEE_RATE   = 0.0007
VOO_DIV_MO = 0.013 / 12
DIV_TAX_R  = 0.154
DYN_RATES  = (0.003, 0.005, 0.007)
DYN_THRS   = (1_000_000_000, 2_000_000_000)
TIME_FILTER = 15
TAX_SIGNAL_SELL = False   # --tax-sells: 신호 매도에도 양도세 부과 (터미널 출력만, JSON 미저장)

HI, LO = 0, 1   # 0 = TQQQ(3x), 1 = QLD(2x)


@dataclass
class Param:
    name: str
    desc: str
    rate_thr: float   # 기준금리(%) 이상이면 QLD. 999 = 항상 TQQQ, -1 = 항상 QLD


STRATEGIES = [
    Param("S0",  "기준선: 항상 TQQQ(3배)",               999.0),
    Param("QLD", "항상 QLD(2배)",                        -1.0),
    Param("R4",  "기준금리 4% 이상이면 QLD, 미만 TQQQ",   4.0),
    Param("R5",  "기준금리 5% 이상이면 QLD, 미만 TQQQ",   5.0),
    Param("R6",  "기준금리 6% 이상이면 QLD, 미만 TQQQ",   6.0),
    Param("R7",  "기준금리 7% 이상이면 QLD, 미만 TQQQ",   7.0),
    Param("R8",  "기준금리 8% 이상이면 QLD, 미만 TQQQ",   8.0),
    Param("R10", "기준금리 10% 이상이면 QLD, 미만 TQQQ", 10.0),
]


# ═══════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════

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

    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}
    fed_daily = np.array([fed_rates.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 / 252
                          for d in dates])

    f3 = (1.0 + ret * 3.0 - 2.0 * fed_daily) * (1.0 - EXP_3X / 252)
    f3[0] = 1.0
    tqqq = 100.0 * np.cumprod(f3)

    f2 = (1.0 + ret * 2.0 - 1.0 * fed_daily) * (1.0 - EXP_2X / 252)
    f2[0] = 1.0
    qld = 100.0 * np.cumprod(f2)

    a200 = 2.0 / 201
    ema200 = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    return tqqq, qld, closes, ema200, dates, sp500, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


def target_asset(p: Param, fed_rates: dict, mon_key: str) -> int:
    if p.rate_thr >= 999:
        return HI
    if p.rate_thr < 0:
        return LO
    return LO if fed_rates.get(mon_key, 3.0) >= p.rate_thr else HI


# ═══════════════════════════════════════════════════════════
# 시뮬레이션 코어
# ═══════════════════════════════════════════════════════════

def run_sim(px, closes, ema200, dates, sp500, fed_rates, start_idx: int, p: Param) -> dict:
    n       = len(closes)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    mon_key0 = dates[start_idx].strftime("%Y-%m")
    held     = target_asset(p, fed_rates, mon_key0)

    e200_init = ema200[start_idx]
    if not np.isnan(e200_init) and e200_init > 0 and closes[start_idx] < e200_init:
        is_invested = False
        cash, sh    = float(INITIAL), 0.0
    else:
        is_invested = True
        sh, cash    = INITIAL / px[held][start_idx], 0.0
    avg_cost = px[held][start_idx]

    cash_reserve = tax_reserve = annual_gain = 0.0
    last_tax_yr  = -1
    cum_withdrawn = 0.0
    voo_sh = 0.0

    below_days = above_days = 0
    last_mon = None
    tday_in_mon = 0
    mon_cap = mon_used = 0.0
    trade_count = switch_count = 0
    days_lo = days_inv = 0
    min_val = float('inf')

    def sell_all(ci):
        """보유분 전량 매도 → 세후·수수료 차감 금액 반환 (세금은 tax_reserve로 적립)."""
        nonlocal sh, annual_gain, tax_reserve
        val  = sh * px[held][ci]
        fee  = val * FEE_RATE
        gain = max(0.0, val - sh * avg_cost)
        annual_gain += gain
        tw = gain * TAX_RATE
        tax_reserve += tw
        sh = 0.0
        return val - fee - tw

    for j in range(sim_len):
        ci = start_idx + j
        cur_date = dates[ci]
        cur_mon  = (cur_date.year, cur_date.month)
        mon_key  = cur_date.strftime("%Y-%m")

        # ═══ 월초 처리 ═══
        if cur_mon != last_mon:
            tday_in_mon = 0
            mon_used    = 0.0

            rp_mo = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 12.0
            if cash_reserve > 0:
                cash_reserve += cash_reserve * rp_mo * (1 - RP_TAX_R)
            if tax_reserve > 0:
                cash_reserve += tax_reserve * rp_mo * (1 - RP_TAX_R)

            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                tax_reserve = 0.0
                annual_gain = 0.0
            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year

            if voo_sh > 0:
                cash_reserve += voo_sh * sp500[ci] * VOO_DIV_MO * (1 - DIV_TAX_R)

            # ── 금리 연동 종목 전환 ──
            want = target_asset(p, fed_rates, mon_key)
            if is_invested and want != held and sh > 0:
                net = sell_all(ci)
                held = want
                fee = net * FEE_RATE
                sh = (net - fee) / px[held][ci]
                avg_cost = px[held][ci]
                switch_count += 1
            elif not is_invested:
                held = want

            pv_c    = sh * px[held][ci] if is_invested else cash
            total_c = pv_c + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            base_rate = (DYN_RATES[0] if total_c < DYN_THRS[0]
                         else DYN_RATES[1] if total_c < DYN_THRS[1]
                         else DYN_RATES[2])
            mon_cap = min(total_c * base_rate, float(LIV_MAX))
            last_mon = cur_mon

        tday_in_mon += 1

        # ═══ EMA200 신호 ═══
        e200 = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        if e200ok:
            div = (closes[ci] - e200) / e200
            if div < 0:
                below_days += 1; above_days = 0
            elif div > 0:
                above_days += 1; below_days = 0
            else:
                below_days = above_days = 0
        sell_sig = e200ok and below_days >= TIME_FILTER
        buy_sig  = e200ok and above_days >= TIME_FILTER

        if is_invested and sell_sig:
            if TAX_SIGNAL_SELL:
                cash = sell_all(ci)
            else:
                # withdrawal_new_ideas2.py S0와 동일하게 신호 매도에는 양도세를 매기지 않는다 (기준선 재현용).
                # 금리 연동 전환 매도에는 항상 과세하므로 R* 전략에 불리한(보수적) 비교다.
                val  = sh * px[held][ci]
                cash = val - val * FEE_RATE
                sh   = 0.0
            is_invested = False
            trade_count += 1
            below_days = 0
        elif not is_invested and buy_sig:
            fee = cash * FEE_RATE
            sh  = (cash - fee) / px[held][ci]
            avg_cost = px[held][ci]
            cash = 0.0
            is_invested = True
            trade_count += 1
            above_days = 0

        # ═══ 월초 인출 ═══
        if tday_in_mon == 1 and j > 0:
            if is_invested:
                pv     = sh * px[held][ci]
                from_t = min(mon_cap, pv)
                sh_t   = from_t / px[held][ci]
                gain_t = max(0.0, from_t - sh_t * avg_cost)
                annual_gain += gain_t
                tw_t = gain_t * TAX_RATE
                tax_reserve += tw_t
                after_tax = from_t - tw_t
                sh -= sh_t

                remaining = max(0.0, mon_cap - mon_used)
                if after_tax >= remaining:
                    living = remaining
                    cash_reserve += after_tax - living
                else:
                    from_res = min(remaining - after_tax, cash_reserve)
                    cash_reserve -= from_res
                    living = after_tax + from_res
                mon_used += living
                cum_withdrawn += living
            else:
                total_cash = cash + cash_reserve
                yearly_cap = mon_cap * 12
                lr = (1.0 if yearly_cap <= 0 or total_cash / yearly_cap >= 2 else
                      0.7 if total_cash / yearly_cap >= 1 else
                      0.5 if total_cash / yearly_cap >= 0.5 else 0.3)
                living = max(0.0, mon_cap * lr - mon_used)
                mon_used += living
                cum_withdrawn += living
                if cash_reserve >= living:
                    cash_reserve -= living
                else:
                    cash = max(0.0, cash - (living - cash_reserve))
                    cash_reserve = 0.0

        # RP 이자 (비투자 기간)
        if not is_invested and cash > 0:
            daily_r = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 252
            cash += cash * daily_r * (1 - RP_TAX_R)

        # VOO 편입 (총자산 20억+, 현금 36개월치 초과)
        if is_invested and cash_reserve > 0 and sp500[ci] > 0:
            ta2 = sh * px[held][ci] + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if ta2 >= 2_000_000_000:
                exc = cash_reserve - mon_cap * 36
                if exc > 0:
                    voo_sh += exc / sp500[ci]
                    cash_reserve -= exc

        if is_invested:
            days_inv += 1
            if held == LO:
                days_lo += 1

        pv    = sh * px[held][ci] if is_invested else cash
        total = pv + cash_reserve + voo_sh * sp500[ci]
        min_val = min(min_val, total)
        if total <= 0:
            break

    ci_end = min(start_idx + sim_len - 1, n - 1)
    pv_end = sh * px[held][ci_end] if is_invested else cash
    final  = pv_end + cash_reserve + voo_sh * sp500[ci_end]

    actual_yr = sim_len / 252
    cagr = ((final / INITIAL) ** (1 / actual_yr) - 1) * 100 if actual_yr > 0 and final > 0 else -100.0
    return {
        "final":     round(final / 1e8, 2),
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "min":       round((0.0 if min_val == float('inf') else min_val) / 1e8, 4),
        "bankrupt":  bool(final <= 0),
        "cagr":      round(cagr, 2),
        "trades":    trade_count,
        "switches":  switch_count,
        "lo_pct":    round(days_lo / days_inv * 100, 1) if days_inv else 0.0,
        "ongoing":   bool(sim_len < int(SIM_YEARS * 252) and final > 0),
        "actual_yr": round(actual_yr, 1),
    }


# ═══════════════════════════════════════════════════════════
# 병렬 실행
# ═══════════════════════════════════════════════════════════

_SHARED = {}


def _init_worker(px, closes, ema200, dates_list, sp500, fed_rates, starts):
    _SHARED.update({'px': px, 'closes': closes, 'ema200': ema200,
                    'dates': pd.DatetimeIndex(dates_list), 'sp500': sp500,
                    'fed_rates': fed_rates, 'starts': starts})


def _run_one(p: Param):
    d = _SHARED
    return p.name, [run_sim(d['px'], d['closes'], d['ema200'], d['dates'],
                            d['sp500'], d['fed_rates'], si, p) for si in d['starts']]


def pct(sorted_vals, q):
    return sorted_vals[int(len(sorted_vals) * q)] if sorted_vals else 0.0


def main():
    global TAX_SIGNAL_SELL
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--tax-sells", action="store_true", help="신호 매도에도 양도세 부과 (터미널 출력만)")
    TAX_SIGNAL_SELL = ap.parse_args().tax_sells
    t0 = time.time()
    tqqq, qld, closes, ema200, dates, sp500, fed_rates = load_data()
    starts = get_monthly_starts(dates)
    print(f"금리 연동 레버리지 (스왑금리 반영) — 시작점 {len(starts)}개, 전략 {len(STRATEGIES)}개", flush=True)

    with mp.Pool(processes=min(mp.cpu_count(), len(STRATEGIES)),
                 initializer=_init_worker,
                 initargs=((tqqq, qld), closes, ema200, dates.tolist(), sp500, fed_rates, starts)) as pool:
        raw = dict(pool.map(_run_one, STRATEGIES, chunksize=1))

    labels = [dates[si].strftime("%Y-%m") for si in starts]
    base   = raw["S0"]
    ERAS   = [("1970s", 1971, 1980), ("1980s", 1980, 1990), ("1990s", 1990, 2000), ("2000s", 2000, 2010)]

    summary = []
    for p in STRATEGIES:
        rs   = raw[p.name]
        done = [(lab, r, b) for lab, r, b in zip(labels, rs, base) if not r["ongoing"]]
        fin  = sorted(r["final"] for _, r, _ in done)
        mins = sorted(r["min"] for _, r, _ in done)
        nd   = len(done)
        eras = {}
        for key, a, b in ERAS:
            xs = sorted(r["final"] for lab, r, _ in done if a <= int(lab[:4]) < b)
            if xs:
                eras[key] = round(pct(xs, 0.5), 1)
        summary.append({
            "name":          p.name,
            "desc":          p.desc,
            "survival_rate": round(sum(1 for _, r, _ in done if not r["bankrupt"]) / nd * 100, 1),
            "med_final":     round(pct(fin, 0.5), 1),
            "p25_final":     round(pct(fin, 0.25), 1),
            "p10_final":     round(pct(fin, 0.10), 1),
            "p5_final":      round(pct(fin, 0.05), 1),
            "worst_final":   round(fin[0], 2),
            "n_below_init":  sum(1 for x in fin if x < INITIAL / 1e8),
            "min_of_min":    round(mins[0], 4),
            "p5_min":        round(pct(mins, 0.05), 4),
            "avg_withdrawn": round(sum(r["withdrawn"] for _, r, _ in done) / nd, 2),
            "avg_trades":    round(sum(r["trades"] for _, r, _ in done) / nd, 1),
            "avg_switches":  round(sum(r["switches"] for _, r, _ in done) / nd, 1),
            "win_vs_s0":     round(sum(1 for _, r, b in done if r["final"] > b["final"]) / nd * 100, 1),
            "era_median":    eras,
            "n_completed":   nd,
            "n_ongoing":     len(rs) - nd,
        })

    cohorts = []
    for k, lab in enumerate(labels):
        row = {"start": lab}
        for p in STRATEGIES:
            r = raw[p.name][k]
            row[p.name] = {key: r[key] for key in
                           ("final", "withdrawn", "min", "cagr", "trades", "switches", "lo_pct", "ongoing")}
        cohorts.append(row)

    print(f"\n{'이름':<5}{'중앙':>8}{'p10':>7}{'p5':>7}{'최저':>7}{'<10억':>6}{'최저점':>7}"
          f"{'인출':>7}{'전환':>6}{'S0대비':>8}  1970s/80s/90s/00s 중앙", flush=True)
    for s in summary:
        era = "/".join(f"{v:.0f}" for v in s["era_median"].values())
        print(f"{s['name']:<5}{s['med_final']:8.1f}{s['p10_final']:7.1f}{s['p5_final']:7.1f}"
              f"{s['worst_final']:7.1f}{s['n_below_init']:6}{s['min_of_min']:7.2f}"
              f"{s['avg_withdrawn']:7.1f}{s['avg_switches']:6.1f}{s['win_vs_s0']:7.1f}%  {era}", flush=True)

    out = {
        "meta": {
            "generated":  str(dates[-1].date()),
            "price_mode": "with_costs",
            "sim_years":  SIM_YEARS,
            "n_cohorts":  len(starts),
            "note":       "S0 신호 동일, 투자 중 보유 종목만 기준금리로 TQQQ/QLD 선택. 전환 시 양도세 22%·수수료 반영.",
            "strategies": [{"name": p.name, "desc": p.desc} for p in STRATEGIES],
        },
        "summary": summary,
        "cohorts": cohorts,
    }
    if TAX_SIGNAL_SELL:
        print("\n--tax-sells: JSON 저장 생략", flush=True)
        return
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초", flush=True)


if __name__ == "__main__":
    main()
