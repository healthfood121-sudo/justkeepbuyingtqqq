"""
withdrawal_signal_test.py

새 신호 아이디어 검증
──────────────────────────────────────────────────────────────
S0:       기준선 — NDX EMA200-15일 신호 + 동적인출
TQQQ_EMA: TQQQ 합성가격 EMA200-15일 신호 + 동적인출
            (현재는 NDX 원지수로 신호 계산, 이걸 TQQQ 자체 가격으로 바꿨을 때)
DELAY12:  S0 + 인출 12개월 지연 (달성 후 1년 더 복리)
DELAY24:  S0 + 인출 24개월 지연 (달성 후 2년 더 복리)
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
FED_PATH = Path("D:/justkeepbuyingtqqq/data/fed_funds_rate.json")
OUT_PATH = Path("D:/justkeepbuyingtqqq/web/public/data/withdrawal_signal_test.json")

INITIAL     = 1_000_000_000
SIM_YEARS   = 20
EXP_TQQQ    = 0.0088
LIV_MAX     = 15_000_000
TAX_RATE    = 0.22
DEDUCTION   = 2_500_000
RP_SPREAD   = 0.004
RP_TAX_R    = 0.154
FEE_RATE    = 0.0007
VOO_DIV_MO  = 0.013 / 12
DIV_TAX_R   = 0.154
DYN_RATES   = (0.003, 0.005, 0.007)
DYN_THRS    = (1_000_000_000, 2_000_000_000)
TIME_FILTER = 15


@dataclass
class Param:
    name:         str
    desc:         str
    use_tqqq_ema: bool = False  # True: 신호를 NDX 대신 TQQQ EMA200 기준
    delay_months: int  = 0      # >0: 첫 N개월간 인출 0


STRATEGIES = [
    Param("S0",       "기준선: NDX EMA200-15일 + 동적인출"),
    Param("TQQQ_EMA", "TQQQ 합성가격 EMA200-15일 신호", use_tqqq_ema=True),
    Param("DELAY12",  "S0 + 12개월 인출 지연",          delay_months=12),
    Param("DELAY24",  "S0 + 24개월 인출 지연",          delay_months=24),
]


# ═══════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════

def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    # 1985-10-01 스플라이스 보정
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)

    ret = np.diff(closes) / closes[:-1]
    ret = np.insert(ret, 0, 0.0)

    # TQQQ 합성 (NDX 3x)
    f3    = (1.0 + ret * 3.0) * (1.0 - EXP_TQQQ / 252)
    f3[0] = 1.0
    ndx3x = 100.0 * np.cumprod(f3)

    # SP500 (VOO)
    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    # NDX EMA200 (기존 S0 신호용)
    a200 = 2.0 / 201
    ema200_ndx = np.full(n, np.nan)
    ema200_ndx[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200_ndx[i] = closes[i] * a200 + ema200_ndx[i - 1] * (1 - a200)

    # TQQQ EMA200 (새 신호용)
    ema200_tqqq = np.full(n, np.nan)
    ema200_tqqq[199] = np.mean(ndx3x[:200])
    for i in range(200, n):
        ema200_tqqq[i] = ndx3x[i] * a200 + ema200_tqqq[i - 1] * (1 - a200)

    # TQQQ v2 (스왑금리 2× 포함)
    fed_daily_arr = np.array([
        fed_rates.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 / 252
        for d in dates
    ])
    fv2 = (1.0 + ret * 3.0 - 2.0 * fed_daily_arr) * (1.0 - EXP_TQQQ / 252)
    fv2[0] = 1.0
    ndx3x_v2 = 100.0 * np.cumprod(fv2)

    # v2 기반 TQQQ EMA200
    ema200_tqqq_v2 = np.full(n, np.nan)
    ema200_tqqq_v2[199] = np.mean(ndx3x_v2[:200])
    for i in range(200, n):
        ema200_tqqq_v2[i] = ndx3x_v2[i] * a200 + ema200_tqqq_v2[i - 1] * (1 - a200)

    return ndx3x, ndx3x_v2, closes, ema200_ndx, ema200_tqqq, ema200_tqqq_v2, dates, sp500, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


# ═══════════════════════════════════════════════════════════
# 시뮬레이션 코어
# ═══════════════════════════════════════════════════════════

def run_sim(ndx3x, closes, ema200_ndx, ema200_tqqq,
            dates, sp500, fed_rates, start_idx: int, p: Param) -> dict:
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # ── 신호 배열 선택 ──
    # use_tqqq_ema=True: 신호 계산을 TQQQ 가격 vs TQQQ EMA200으로
    if p.use_tqqq_ema:
        sig_price = ndx3x    # 신호용 가격
        sig_ema   = ema200_tqqq
    else:
        sig_price = closes   # 신호용 가격
        sig_ema   = ema200_ndx

    # ── 초기 포지션 ──
    e200_init  = sig_ema[start_idx]
    e200_valid = not np.isnan(e200_init) and e200_init > 0
    if e200_valid and sig_price[start_idx] < e200_init:
        is_invested = False
        cash        = float(INITIAL)
        tqqq_sh     = 0.0
    else:
        is_invested = True
        tqqq_sh     = INITIAL / ndx3x[start_idx]
        cash        = 0.0

    avg_cost      = ndx3x[start_idx]
    cash_reserve  = 0.0
    tax_reserve   = 0.0
    annual_gain   = 0.0
    last_tax_yr   = -1
    cum_withdrawn = 0.0
    voo_sh        = 0.0

    below_days  = 0
    above_days  = 0
    last_mon    = None
    tday_in_mon = 0
    mon_cap     = 0.0
    months_done = 0   # 경과 월수 (인출 지연 기준)
    min_val     = float('inf')

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        cur_date = dates[ci]
        cur_mon  = (cur_date.year, cur_date.month)
        mon_key  = cur_date.strftime("%Y-%m")

        is_tqqq = tqqq_sh > 0
        is_cash = not is_tqqq

        # ═══ 월초 처리 ═══
        if cur_mon != last_mon:
            tday_in_mon = 0
            if last_mon is not None:
                months_done += 1

            annual_rate = fed_rates.get(mon_key, 3.0)
            rp_mo = max(0.0, annual_rate / 100.0 - RP_SPREAD) / 12.0

            if cash_reserve > 0:
                g = cash_reserve * rp_mo
                cash_reserve += g * (1 - RP_TAX_R)

            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund     = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                tax_reserve = 0.0
                annual_gain = 0.0

            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year

            # VOO 배당
            if voo_sh > 0:
                g = voo_sh * sp500[ci] * VOO_DIV_MO
                cash_reserve += g * (1 - DIV_TAX_R)

            # 이달 인출 캡 — 인출 지연 기간이면 0
            pv_c    = tqqq_sh * ndx3x[ci] if is_tqqq else cash
            total_c = pv_c + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            base_r  = (DYN_RATES[0] if total_c < DYN_THRS[0] else
                       DYN_RATES[1] if total_c < DYN_THRS[1] else DYN_RATES[2])

            if months_done < p.delay_months:
                mon_cap = 0.0
            else:
                mon_cap = min(total_c * base_r, float(LIV_MAX))

            last_mon = cur_mon

        tday_in_mon += 1

        # ═══ 신호 계산 ═══
        e200   = sig_ema[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        sp     = sig_price[ci]
        div    = (sp - e200) / e200 if e200ok else 0.0

        if e200ok:
            if div < 0:
                below_days += 1; above_days  = 0
            elif div > 0:
                above_days += 1; below_days  = 0
            else:
                below_days = above_days = 0

        sell_sig = e200ok and below_days >= TIME_FILTER
        buy_sig  = e200ok and above_days >= TIME_FILTER

        # ═══ 매도: TQQQ → 현금 ═══
        if is_tqqq and sell_sig:
            sv   = tqqq_sh * ndx3x[ci]
            fee  = sv * FEE_RATE
            cash = sv - fee
            tqqq_sh = 0.0
            is_invested = False
            below_days  = 0

        # ═══ 매수: 현금 → TQQQ ═══
        elif is_cash and buy_sig:
            fee     = cash * FEE_RATE
            net     = cash - fee
            tqqq_sh = net / ndx3x[ci]
            avg_cost = ndx3x[ci]
            cash    = 0.0
            is_invested = True
            above_days  = 0

        # ═══ 월초 인출 ═══
        if tday_in_mon == 1 and j > 0 and mon_cap > 0:
            is_tqqq2 = tqqq_sh > 0

            if is_tqqq2:
                pv     = tqqq_sh * ndx3x[ci]
                wd_val = min(mon_cap, pv)
                sh_sold= wd_val / ndx3x[ci]
                gain   = max(0.0, wd_val - sh_sold * avg_cost)
                annual_gain  += gain
                tax_w        = gain * TAX_RATE
                tax_reserve  += tax_w
                after_tax    = wd_val - tax_w
                tqqq_sh      = max(0.0, tqqq_sh - sh_sold)

                if after_tax >= mon_cap:
                    cash_reserve += after_tax - mon_cap
                    cum_withdrawn += mon_cap
                else:
                    from_res      = min(mon_cap - after_tax, cash_reserve)
                    cash_reserve -= from_res
                    cum_withdrawn += after_tax + from_res
            else:
                total_cash = cash + cash_reserve
                living     = min(mon_cap, total_cash)
                cum_withdrawn += living
                if cash_reserve >= living:
                    cash_reserve -= living
                else:
                    cash = max(0.0, cash - (living - cash_reserve))
                    cash_reserve = 0.0

        # ═══ RP 이자 (현금 대피 중) ═══
        if tqqq_sh == 0 and cash > 0:
            daily_r = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 252
            g = cash * daily_r
            cash += g * (1 - RP_TAX_R)

        # ═══ VOO 편입 ═══
        if tqqq_sh > 0 and cash_reserve > 0 and sp500[ci] > 0:
            pv2 = tqqq_sh * ndx3x[ci]
            ta2 = pv2 + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if ta2 >= 2_000_000_000:
                exc = cash_reserve - mon_cap * 36
                if exc > 0:
                    voo_sh       += exc / sp500[ci]
                    cash_reserve -= exc

        # ═══ 총자산 추적 ═══
        pv    = tqqq_sh * ndx3x[ci] if tqqq_sh > 0 else cash
        total = pv + cash_reserve + voo_sh * sp500[ci]
        if total < min_val:
            min_val = total
        if total <= 0:
            break

    ci_end = min(start_idx + sim_len - 1, n - 1)
    pv_end = tqqq_sh * ndx3x[ci_end] if tqqq_sh > 0 else cash
    final  = pv_end + cash_reserve + voo_sh * sp500[ci_end]

    actual_yr = sim_len / 252
    cagr = ((final / INITIAL) ** (1 / actual_yr) - 1) * 100 if actual_yr > 0 and final > 0 else -100.0
    if min_val == float('inf'):
        min_val = 0.0

    return {
        "final":     round(final / 1e8, 2),
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "min":       round(min_val / 1e8, 4),
        "bankrupt":  bool(final <= 0),
        "cagr":      round(cagr, 2),
    }


# ═══════════════════════════════════════════════════════════
# 병렬 실행
# ═══════════════════════════════════════════════════════════

_SHARED = {}

def _init_worker(ndx3x, closes, ema200_ndx, ema200_tqqq,
                 dates_list, sp500, fed_rates, starts):
    _SHARED.update({
        'ndx3x': ndx3x, 'closes': closes,
        'ema200_ndx': ema200_ndx, 'ema200_tqqq': ema200_tqqq,
        'dates': pd.DatetimeIndex(dates_list),
        'sp500': sp500, 'fed_rates': fed_rates, 'starts': starts,
    })

def _run_one(p: Param):
    d = _SHARED
    results = [
        run_sim(d['ndx3x'], d['closes'],
                d['ema200_ndx'], d['ema200_tqqq'],
                d['dates'], d['sp500'], d['fed_rates'], si, p)
        for si in d['starts']
    ]
    return (p.name, results)


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--v2", action="store_true", help="스왑금리 포함 버전 생성")
    args = parser.parse_args()
    suffix = "_v2" if args.v2 else ""
    out_path = OUT_PATH.parent / f"withdrawal_signal_test{suffix}.json"

    t0 = time.time()
    print("=" * 70, flush=True)
    print("신호 변형 아이디어 검증: TQQQ EMA200 신호 / 인출 지연", flush=True)
    print(f"{'스왑금리 포함 (v2)' if args.v2 else '운용보수만 (standard)'}", flush=True)
    print("=" * 70, flush=True)

    ndx3x, ndx3x_v2, closes, ema200_ndx, ema200_tqqq, ema200_tqqq_v2, \
        dates, sp500, fed_rates = load_data()
    ndx3x_use     = ndx3x_v2     if args.v2 else ndx3x
    ema200_tqqq_use = ema200_tqqq_v2 if args.v2 else ema200_tqqq

    first_valid = int(np.where(~np.isnan(ema200_ndx))[0][0])
    starts = [i for i in get_monthly_starts(dates)
              if i >= first_valid and (len(ndx3x) - i) / 252 >= SIM_YEARS]
    print(f"시작 시점: {len(starts)}개  전략: {len(STRATEGIES)}개", flush=True)

    n_workers = min(mp.cpu_count(), len(STRATEGIES))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(ndx3x_use, closes, ema200_ndx, ema200_tqqq_use,
                  dates.tolist(), sp500, fed_rates, starts)
    ) as pool:
        raw = pool.map(_run_one, STRATEGIES, chunksize=1)

    print(f"완료 ({time.time() - t0:.1f}초)\n", flush=True)

    strat_results = {pname: results for pname, results in raw}

    KEY_COHORTS = ["1996-10", "1999-03", "2000-03", "2003-03", "2007-10", "2009-03"]

    summary_rows = []
    cohort_rows  = []

    for p in STRATEGIES:
        results  = strat_results[p.name]
        total    = len(results)
        bankrupt = sum(1 for r in results if r["bankrupt"])
        finals   = sorted(r["final"] for r in results if not r["bankrupt"])
        cagrs    = [r["cagr"] for r in results if not r["bankrupt"]]
        withds   = [r["withdrawn"] for r in results]
        mins     = [r["min"] for r in results]
        nf       = len(finals)
        surv     = (total - bankrupt) / total * 100

        summary_rows.append({
            "name":          p.name,
            "desc":          p.desc,
            "survival_rate": round(surv, 1),
            "med_final":     round(finals[nf // 2] if nf else 0.0, 1),
            "avg_final":     round(sum(finals) / nf if nf else 0.0, 1),
            "p25_final":     round(finals[nf // 4] if nf else 0.0, 1),
            "p75_final":     round(finals[3*nf//4] if nf else 0.0, 1),
            "avg_withdrawn": round(sum(withds) / len(withds) if withds else 0.0, 2),
            "min_of_min":    round(min(mins) if mins else 0.0, 4),
            "avg_cagr":      round(sum(cagrs) / len(cagrs) if cagrs else 0.0, 2),
        })

    summary_rows.sort(key=lambda r: r["med_final"], reverse=True)

    for ki, si in enumerate(starts):
        label = dates[si].strftime("%Y-%m")
        row   = {"start": label}
        for p in STRATEGIES:
            r = strat_results[p.name][ki]
            row[p.name] = {
                "final":    r["final"],
                "cagr":     r["cagr"],
                "min":      r["min"],
                "bankrupt": r["bankrupt"],
            }
        cohort_rows.append(row)

    # ─── 콘솔 출력 ───
    print(f"{'이름':<10} {'설명':<45} {'생존율':>6} {'중앙':>8} {'연수익':>6} {'평균인출':>8}", flush=True)
    print("-" * 90, flush=True)
    for row in summary_rows:
        tag = "★ " if row["name"] == summary_rows[0]["name"] else "  "
        print(f"{tag}{row['name']:<8} {row['desc']:<45} "
              f"{row['survival_rate']:>5.1f}% "
              f"{row['med_final']:>7.1f}억 "
              f"{row['avg_cagr']:>5.1f}% "
              f"{row['avg_withdrawn']:>7.2f}억", flush=True)

    print("\n주요 시작 시점별 결과 (20년 후, 억):", flush=True)
    names = [p.name for p in STRATEGIES]
    print(f"{'시작':>10}" + "".join(f"{n:>11}" for n in names), flush=True)
    print("-" * (10 + 11 * len(names)), flush=True)
    cohort_dict = {r["start"]: r for r in cohort_rows}
    for label in KEY_COHORTS:
        if label in cohort_dict:
            print(f"{label:>10}" + "".join(
                f"{cohort_dict[label][n]['final']:>10.1f}억" for n in names), flush=True)

    # ─── JSON 저장 ───
    class NpEnc(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, np.bool_):    return bool(o)
            if isinstance(o, np.integer):  return int(o)
            if isinstance(o, np.floating): return float(o)
            return super().default(o)

    out = {
        "meta": {
            "generated":  str(dates[-1].date()),
            "sim_years":  SIM_YEARS,
            "n_cohorts":  len(starts),
            "strategies": [{"name": p.name, "desc": p.desc} for p in STRATEGIES],
        },
        "summary": summary_rows,
        "cohorts": cohort_rows,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)

    print(f"\n저장: {out_path}  ({out_path.stat().st_size / 1024:.0f} KB)", flush=True)
    print(f"총 소요: {time.time() - t0:.1f}초", flush=True)


if __name__ == "__main__":
    main()
