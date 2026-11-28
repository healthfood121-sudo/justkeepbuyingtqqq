"""
mix_tqqq_ndx_explore.py — (탐색용, 터미널 출력만) 2.4억 + 하루 20만원을 TQQQ(25% 룰) : 나스닥100 1배 = w : 1-w 로 나눠 담을 때
10년 뒤 자산·10억 도달·중간 최저 자산. 1972~2016년 매월 시작(10년 완결) 537개. 리밸런싱 없음, 세전, TQQQ with_costs.
실행: python scripts/mix_tqqq_ndx_explore.py
"""
import sys; from pathlib import Path; sys.path.insert(0, str(Path(__file__).parent))
import numpy as np
from data_loader import load_ndx_prices
from lump_now_explore import rule25_states
d = load_ndx_prices('with_costs'); c, dt, px, p1 = d['closes'], d['dates'], d['ndx3x'], d['ndx1x']
inv = rule25_states(c, d['ema200'], d['trail_peaks'])
fed = d['fed_monthly']; ks = sorted(fed)
cr = np.array([max(0, (fed.get(x.strftime('%Y-%m')) or fed[ks[-1]]) / 100 - 0.004) / 252 * (1 - 0.154) for x in dt])
n = len(px)
LUMP, DAILY = 2.4e8, 2e5

def paths(s, H):
    """시작 s에서 H일 동안: TQQQ 25% 룰 1원 단위 자산 경로(적립 포함)와 1배 경로를 따로 만들어 비율로 섞는다."""
    # 각 바구니를 '거치 1원 + 하루 1/1200원' 단위로 계산 (LUMP:DAILY = 1200:1)
    out = {}
    for key, series, rule in (('T', px, True), ('N', p1, False)):
        hold = bool(inv[s]) if rule else True
        sh = 1.0 / series[s] if hold else 0.0; cash = 0.0 if hold else 1.0
        v = np.empty(H)
        for k, t in enumerate(range(s + 1, s + H + 1)):
            if rule:
                w = inv[t - 1]
                if hold and not w: cash, sh, hold = sh * series[t - 1], 0.0, False
                elif not hold and w: sh, cash, hold = cash / series[t - 1], 0.0, True
                if not hold: cash *= 1 + cr[t]
            if hold: sh += (DAILY / LUMP) / series[t]
            else: cash += DAILY / LUMP
            v[k] = sh * series[t] + cash
        out[key] = v * LUMP
    return out

starts, seen = [], set()
for t in range(252, n - 2521):
    k = (dt[t].year, dt[t].month)
    if k not in seen: seen.add(k); starts.append(t)
H = 2520
P = [paths(s, H) for s in starts]
put10 = (LUMP + DAILY * H) / 1e8
print(f'시작 {len(starts)}개월 ({dt[starts[0]].date()} ~ {dt[starts[-1]].date()}), 10년 동안 넣은 돈 {put10:.1f}억\n')
print('TQQQ 비중   10년 뒤 자산: 중간값  하위10%  최악      10억 도달 중간값  10년 안 도달   10년 중 최저 자산(중간값/최악)')
for w in (0.0, 0.3, 0.5, 0.7, 1.0):
    v10, hit, mins = [], [], []
    for p in P:
        v = w * p['T'] + (1 - w) * p['N']
        v10.append(v[-1] / 1e8)
        h = np.argmax(v >= 1e9) if (v >= 1e9).any() else None
        hit.append(None if h is None else (h + 1) / 252)
        mins.append(v.min() / 1e8)
    v10 = np.array(v10); hy = np.array([99 if x is None else x for x in hit]); mins = np.array(mins)
    print(f'  {w*100:3.0f}%       {np.median(v10):6.1f}억  {np.percentile(v10,10):6.1f}억  {v10.min():5.1f}억        {np.median(hy):4.1f}년        {np.mean(hy<=10)*100:4.0f}%          {np.median(mins):4.2f}억 / {mins.min():4.2f}억')
print()
for s0 in ('1973-01-02', '2000-03-27', '2007-10-31', '2015-07-20'):
    s = int(np.searchsorted(dt, np.datetime64(s0))); p = paths(s, H)
    row = '  '.join(f'{w*100:3.0f}% {(w*p["T"][-1]+(1-w)*p["N"][-1])/1e8:5.1f}억' for w in (0.0, 0.3, 0.5, 0.7, 1.0))
    print(f'{dt[s].date()} 시작 10년 뒤:  {row}')
