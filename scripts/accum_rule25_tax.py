"""
accum_rule25_tax.py — (탐색용, 터미널 출력만) 적립식에 25% 룰을 쓰면 계속 보유보다 나은가, 세금 포함 전체 비교.

시작: 1972년 이후 매월 첫 거래일 전부 (데이터 끝 2026-10-30)
방식:
  적립만        매일 20만원 TQQQ           × 계속 보유 / 25% 룰
  거치+적립     시작일 2.4억 + 매일 20만원  × 계속 보유 / 25% 룰
25% 룰: 나스닥100 종가가 1년 최고 종가 −25% 아래 → 다음 거래일 종가에 전량 매도,
        현금일 때 200일선 위 15일 연속 → 다음 거래일 종가에 전부 매수. 시작일에 규칙상 현금이면 현금으로 시작.
        현금일 때 적립금은 현금으로 쌓임. 현금 이자 = 연방기금금리 −0.4%p, 이자소득세 15.4% 뗀 뒤.
세금 (해외 주식 양도소득세): 같은 해 실현 손익 합계에서 250만원 공제 후 22%. 매도 시점에 바로 정산(보수적:
        실제 납부는 다음 해 5월). 25% 룰은 전량 매도라 취득가 = 마지막 전량 매도 이후 산 금액 합계.
        계속 보유는 팔지 않으므로 세금이 미뤄짐 → '세후 평가액'(지금 다 팔면 남는 돈)으로도 비교.
TQQQ: data_loader 합성가격 with_costs (운용보수 + 스왑금리). 환율·배당 무시, 명목 금액.

출력 지표: 목표(10억) 도달 — 평가액 기준 / 세후 기준. N년 안 도달 비율(그만큼 데이터가 남은 시작점만),
          소요 중간값, 최장, 10년 뒤 세후 자산 중간값·하위 10%.

실행: python scripts/accum_rule25_tax.py
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from data_loader import load_ndx_prices
from lump_now_explore import rule25_states

LUMP = 2.4e8
DAILY = 200_000
TARGET = 1e9
TAX, DEDUCT = 0.22, 2_500_000
MAX_Y = 30


def run(px, dates, start, lump, daily, inv, cash_r):
    """한 시작점. 반환: (평가액 도달 연수, 세후 도달 연수, 10년 뒤 세후 자산, 매도 횟수, 낸 세금 합)."""
    n = len(px)
    end = min(n, start + MAX_Y * 252)
    holding = True if inv is None else bool(inv[start])
    shares = lump / px[start] if holding else 0.0
    cash = 0.0 if holding else lump
    basis = lump if holding else 0.0           # 보유 주식 취득가 합계
    year, yr_gain, yr_tax = dates[start].year, 0.0, 0.0
    hit_pre = hit_post = None
    v10 = None
    sells, tax_sum = 0, 0.0
    for t in range(start + 1, end):
        if dates[t].year != year:
            year, yr_gain, yr_tax = dates[t].year, 0.0, 0.0
        if inv is not None:
            want = inv[t - 1]
            if holding and not want:                     # 전날 종가에 전량 매도
                proceeds = shares * px[t - 1]
                yr_gain += proceeds - basis
                due = TAX * max(0.0, yr_gain - DEDUCT)   # 올해 누적 기준 세금 (손실이면 환급처럼 줄어듦)
                cash, shares, basis, holding = proceeds - (due - yr_tax), 0.0, 0.0, False
                tax_sum += due - yr_tax
                yr_tax = due
                sells += 1
            elif not holding and want:                   # 전날 종가에 전부 매수
                shares, basis, cash, holding = cash / px[t - 1], cash, 0.0, True
            if not holding:
                cash *= 1 + cash_r[t]
        if daily:
            if holding:
                shares += daily / px[t]; basis += daily
            else:
                cash += daily
        val = shares * px[t] + cash
        # 지금 다 팔면: 올해 실현 손익과 합쳐 세금
        g = yr_gain + (shares * px[t] - basis)
        after = val - (TAX * max(0.0, g - DEDUCT) - yr_tax)
        y = (t - start) / 252
        if hit_pre is None and val >= TARGET:
            hit_pre = y
        if hit_post is None and after >= TARGET:
            hit_post = y
        if v10 is None and t - start >= 2520:
            v10 = after
        if hit_post is not None and v10 is not None:
            break
    return hit_pre, hit_post, v10, sells, tax_sum


def report(name, res, avail):
    pre = np.array([np.nan if r[0] is None else r[0] for r in res])
    post = np.array([np.nan if r[1] is None else r[1] for r in res])
    v10 = np.array([np.nan if r[2] is None else r[2] for r in res])
    av = np.array(avail)
    cells = []
    for H in (5, 10, 15, 20):
        ok = av >= H
        cells.append(f"{(np.nan_to_num(post[ok], nan=1e9) <= H).mean() * 100:4.0f}%")
    full = av >= MAX_Y
    med_post = np.median(np.where(np.isnan(post), 99, post)[av >= 20])   # 20년 이상 지켜본 시작점
    worst = np.nanmax(post[av >= 20]) if np.any(~np.isnan(post[av >= 20])) else np.nan
    never = int(np.sum(np.isnan(post) & (av >= 20)))
    med_pre = np.median(np.where(np.isnan(pre), 99, pre)[av >= 20])
    v = v10[~np.isnan(v10)] / 1e8
    sells = np.mean([r[3] for r in res]); tax = np.mean([r[4] for r in res]) / 1e8
    print(f"{name:22s} {'  '.join(cells)}   {med_post:5.1f}년 ({med_pre:4.1f})  {worst:5.1f}년 {never:3d}   "
          f"{np.median(v):6.1f}억 {np.percentile(v, 10):6.1f}억   {sells:4.1f}회 {tax:5.2f}억")


def main():
    d = load_ndx_prices("with_costs")
    closes, dates, px = d["closes"], d["dates"], d["ndx3x"]
    ema, peaks, fed = d["ema200"], d["trail_peaks"], d["fed_monthly"]
    keys = sorted(fed)
    cash_r = np.array([max(0.0, (fed.get(dt.strftime("%Y-%m")) or fed[keys[-1]]) / 100 - 0.004) / 252 * (1 - 0.154)
                       for dt in dates])
    inv25 = rule25_states(closes, ema, peaks)
    n = len(px)
    starts, seen = [], set()
    for t in range(252, n - 1):
        k = (dates[t].year, dates[t].month)
        if k not in seen:
            seen.add(k); starts.append(t)
    avail = [(n - 1 - t) / 252 for t in starts]
    print(f"데이터 {dates[0].date()} ~ {dates[-1].date()} · 시작 {len(starts)}개월 ({dates[starts[0]].date()}~) · "
          f"목표 {TARGET / 1e8:.0f}억 · 세금 22%(연 250만 공제)\n")
    print("                       세후 10억 도달 비율 (N년 안)       소요 중간값      최장  미도달  10년 뒤 세후 자산   매도  세금")
    print("방식                      5년    10년    15년    20년   세후 (평가액)   (20년+ 시작점)   중간값   하위10%   평균  평균")
    for lump_label, lump in (("적립만", 0.0), ("거치2.4억+적립", LUMP)):
        for rule_label, inv in (("계속 보유", None), ("25% 룰", inv25)):
            res = [run(px, dates, t, lump, DAILY, inv, cash_r) for t in starts]
            report(f"{lump_label} · {rule_label}", res, avail)
        print()

    # 시작 연대별 (거치+적립)
    print("거치2.4억+적립 — 시작 연대별 세후 10억 소요 중간값 (계속 보유 / 25% 룰)")
    res_h = [run(px, dates, t, LUMP, DAILY, None, cash_r) for t in starts]
    res_r = [run(px, dates, t, LUMP, DAILY, inv25, cash_r) for t in starts]
    for dec in range(1970, 2030, 10):
        idx = [i for i, t in enumerate(starts) if dec <= dates[t].year < dec + 10]
        if not idx:
            continue
        f = lambda rs: np.nanmedian([np.nan if rs[i][1] is None else rs[i][1] for i in idx])
        print(f"  {dec}년대 ({len(idx):3d}개월)  보유 {f(res_h):5.1f}년   25% 룰 {f(res_r):5.1f}년")
    diff = [(res_h[i][1] or 99) - (res_r[i][1] or 99) for i in range(len(starts))]
    order = np.argsort(diff)
    print("\n25% 룰이 가장 손해 본 시작 월 (세후 소요, 보유 → 25% 룰)")
    for i in order[:5]:
        print(f"  {dates[starts[i]].strftime('%Y-%m')}  {res_h[i][1]} → {res_r[i][1]}")
    print("25% 룰이 가장 이득 본 시작 월")
    for i in order[::-1][:5]:
        print(f"  {dates[starts[i]].strftime('%Y-%m')}  {res_h[i][1]} → {res_r[i][1]}")


if __name__ == "__main__":
    main()
