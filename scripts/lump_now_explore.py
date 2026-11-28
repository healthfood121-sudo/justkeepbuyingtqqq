"""
lump_now_explore.py — (탐색용, 터미널 출력만) 지금처럼 나스닥100이 1년 최고가보다 빠진 시점에
거치금을 한 번에 TQQQ에 넣으면 목표 금액까지 얼마나 걸리는지, 아무 날에나 넣은 경우와 비교.

조건 ('지금과 비슷한 날'): 나스닥100 종가가 1년(252거래일) 최고 종가 대비 DD_LO ~ DD_HI 사이
방식:
  A  거치만, TQQQ 계속 보유
  B  거치 + 매일 20만원 적립, TQQQ 계속 보유
  C  거치만, 25% 룰 (1년 최고 종가 −25% 아래 마감 → 다음 날 매도, 현금일 때 200일선 위 15일 연속 → 다음 날 매수,
     현금은 연방기금금리 −0.4%p 세후 이자)
  D  거치 + 매일 20만원 적립 + 25% 룰 (현금일 때 적립금은 현금으로 쌓였다가 재매수 때 함께 매수)
  E~H  위 A~D와 같되 거치금을 5번(시작일, 이후 1년마다) 나눠 넣음. 안 넣은 돈은 현금 이자 받으며 자산에 포함
TQQQ는 data_loader 합성가격 with_costs (운용보수 + 스왑금리). 세금·환율 무시, 명목 금액.

실행: python scripts/lump_now_explore.py [--lump 2.4e8] [--target 1e9]
"""
import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
from data_loader import load_ndx_prices

DD_LO, DD_HI = -0.17, -0.12
DAILY = 200_000
MAX_YEARS = 30


def rule25_states(closes, ema, peaks):
    """그날 종가 이후 보유 여부 (신호 다음 거래일 종가에 매매)."""
    n = len(closes)
    inv = np.ones(n, dtype=bool)
    state, above, pend = True, 0, None
    for t in range(n):
        if pend is not None and t >= pend[1]:
            state = pend[0]
            pend = None
            if state:
                above = 0
        if not np.isnan(ema[t]):
            above = above + 1 if closes[t] > ema[t] else 0
        if pend is None:
            if state and closes[t] < peaks[t] * 0.75:
                pend = (False, t + 1)
            elif not state and above >= 15:
                pend = (True, t + 1)
        inv[t] = state
    return inv


def years_to_target(px, start, lump, target, daily=0.0, inv=None, cash_r=None, split=1):
    """start 종가에 진입, 목표 도달까지 연수 (도달 못 하면 None).
    split>1: 거치금을 split번(시작일, 이후 252거래일마다) 나눠 넣고, 아직 안 넣은 돈은 현금 이자를 받으며 자산에 포함."""
    n = len(px)
    end = min(n, start + MAX_YEARS * 252)
    part = lump / split
    shares, cash = part / px[start], 0.0
    reserve, left = lump - part, split - 1
    holding = True
    for t in range(start + 1, end):
        if reserve:
            reserve *= 1 + cash_r[t]
            if left and (t - start) % 252 == 0:
                amt = reserve if left == 1 else part
                reserve -= amt; left -= 1
                if holding or inv is None:
                    shares += amt / px[t]
                else:
                    cash += amt
        if inv is not None:
            want = inv[t - 1]                    # 전날 종가 이후 상태로 오늘 수익
            if holding and not want:             # 전날 종가에 매도한 것으로
                cash, shares, holding = shares * px[t - 1], 0.0, False
            elif not holding and want:
                shares, cash, holding = cash / px[t - 1], 0.0, True
            if not holding:
                cash *= 1 + cash_r[t]
        if daily:
            if holding:
                shares += daily / px[t]
            else:
                cash += daily
        val = shares * px[t] + cash + reserve
        if val >= target:
            return (t - start) / 252
    return None


def summarize(name, ys, avail_years):
    """ys: 도달 연수 리스트(None=미도달), avail_years: 각 시작점 이후 남은 데이터 연수."""
    ys = np.array([np.nan if y is None else y for y in ys], dtype=float)
    av = np.array(avail_years)
    out = [name]
    for H in (3, 5, 7, 10, 15):
        ok = av >= H                              # H년 이상 지켜볼 수 있는 시작점만
        if ok.sum() == 0:
            out.append("   -  ")
            continue
        hit = np.nan_to_num(ys[ok], nan=1e9) <= H
        out.append(f"{hit.mean() * 100:5.0f}%")
    done = ys[~np.isnan(ys)]
    med = np.median(np.where(np.isnan(ys) & (av < MAX_YEARS), np.nan, np.nan_to_num(ys, nan=99)))
    out.append(f"{np.nanmedian(np.where(np.isnan(ys), 99, ys)):5.1f}y")
    return "  ".join(out), med


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lump", type=float, default=2.4e8)
    ap.add_argument("--target", type=float, default=1e9)
    args = ap.parse_args()

    d = load_ndx_prices("with_costs")
    closes, dates, px = d["closes"], d["dates"], d["ndx3x"]
    ema, peaks = d["ema200"], d["trail_peaks"]
    n = len(closes)
    dd = closes / peaks - 1
    fed = d["fed_monthly"]
    keys = sorted(fed)
    cash_r = np.array([max(0.0, (fed.get(dt.strftime("%Y-%m")) or fed[keys[-1]]) / 100 - 0.004) / 252 * (1 - 0.154)
                       for dt in dates])
    inv25 = rule25_states(closes, ema, peaks)

    starts_all = list(range(252, n - 1))
    like_now = [t for t in starts_all if DD_LO <= dd[t] <= DD_HI]
    # 하락 국면별 첫날 (1년 최고가 갱신 후 처음 −12% 아래로 들어온 날)
    episodes, armed = [], True
    for t in starts_all:
        if dd[t] >= -0.02:
            armed = True
        if armed and DD_LO <= dd[t] <= DD_HI:
            episodes.append(t); armed = False

    avail = lambda t: (n - 1 - t) / 252
    print(f"데이터 {dates[0].date()} ~ {dates[-1].date()} · 거치 {args.lump / 1e8:.1f}억 → 목표 {args.target / 1e8:.0f}억 "
          f"({args.target / args.lump:.2f}배) · 지금과 비슷한 날 = 1년 최고가 대비 {DD_LO:.0%}~{DD_HI:.0%}")
    print(f"시작점: 전체 {len(starts_all):,}일 · 지금과 비슷한 날 {len(like_now):,}일 · 하락 국면 {len(episodes)}번\n")

    sample = lambda ts, step: ts[::step]
    groups = [("아무 날", sample(starts_all, 5)), ("비슷한 날", like_now)]
    print("                         N년 안에 목표 도달한 비율 (그만큼 데이터가 남은 시작점 기준)   소요 중간값")
    print("방식 / 시작점                  3년     5년     7년    10년    15년")
    for label, fn in [
        ("A 거치만 보유  ", lambda t: years_to_target(px, t, args.lump, args.target)),
        ("B 거치+일20만  ", lambda t: years_to_target(px, t, args.lump, args.target, daily=DAILY)),
        ("C 거치·25% 룰 ", lambda t: years_to_target(px, t, args.lump, args.target, inv=inv25, cash_r=cash_r)),
        ("D 거치+적립·25%", lambda t: years_to_target(px, t, args.lump, args.target, daily=DAILY, inv=inv25, cash_r=cash_r)),
        ("E 5년분할      ", lambda t: years_to_target(px, t, args.lump, args.target, cash_r=cash_r, split=5)),
        ("F 5년분할·25%  ", lambda t: years_to_target(px, t, args.lump, args.target, inv=inv25, cash_r=cash_r, split=5)),
        ("G 5년분할+적립 ", lambda t: years_to_target(px, t, args.lump, args.target, daily=DAILY, cash_r=cash_r, split=5)),
        ("H 분할+적립·25%", lambda t: years_to_target(px, t, args.lump, args.target, daily=DAILY, inv=inv25, cash_r=cash_r, split=5)),
    ]:
        for gname, ts in groups:
            ys = [fn(t) for t in ts]
            line, _ = summarize(f"{label} {gname:6s}", ys, [avail(t) for t in ts])
            print(line)
        print()

    print("하락 국면별 (처음 −12~−17%에 들어온 날 진입) — A 거치만 / C 25% 룰 / B 거치+적립 / D 거치+적립·25% 룰 / G 5년분할+적립 / H 5년분할+적립·25% 룰")
    for t in episodes:
        a = years_to_target(px, t, args.lump, args.target)
        c = years_to_target(px, t, args.lump, args.target, inv=inv25, cash_r=cash_r)
        b = years_to_target(px, t, args.lump, args.target, daily=DAILY)
        dd_ = years_to_target(px, t, args.lump, args.target, daily=DAILY, inv=inv25, cash_r=cash_r)
        g = years_to_target(px, t, args.lump, args.target, daily=DAILY, cash_r=cash_r, split=5)
        h = years_to_target(px, t, args.lump, args.target, daily=DAILY, inv=inv25, cash_r=cash_r, split=5)
        low = (closes[t:t + 252].min() / peaks[t] - 1) if t + 1 < n else np.nan
        tq_dd = px[t] / px[max(0, t - 252):t + 1].max() - 1
        f = lambda y: f"{y:5.1f}년" if y is not None else ("  진행중" if avail(t) < MAX_YEARS else " 30년+ ")
        print(f"  {dates[t].date()}  나스닥100 {dd[t]:+.0%} · TQQQ {tq_dd:+.0%} · 이후 1년 최저 {low:+.0%}   A {f(a)}   C {f(c)}   B {f(b)}   D {f(dd_)}   G {f(g)}   H {f(h)}")


if __name__ == "__main__":
    main()
