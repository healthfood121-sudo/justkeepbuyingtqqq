"""
qld_vs_tqqq_explore.py — (탐색용, 터미널 출력만) 2.4억 + 하루 20만원, 1972~2016년 매월 시작 537개 10년.
나스닥100 1배 / QLD(2배) / TQQQ(3배) × 계속 보유·25% 룰, 그리고 섞은 조합. 세전, with_costs 합성가격, 리밸런싱 없음.
실행: python scripts/qld_vs_tqqq_explore.py
"""
import sys; from pathlib import Path; sys.path.insert(0, str(Path(__file__).parent))
import numpy as np
from data_loader import load_ndx_prices
from lump_now_explore import rule25_states
d = load_ndx_prices('with_costs'); c, dt = d['closes'], d['dates']
S = {'3x': d['ndx3x'], '2x': d['ndx2x'], '1x': d['ndx1x']}
inv = rule25_states(c, d['ema200'], d['trail_peaks'])
fed = d['fed_monthly']; ks = sorted(fed)
cr = np.array([max(0, (fed.get(x.strftime('%Y-%m')) or fed[ks[-1]]) / 100 - 0.004) / 252 * (1 - 0.154) for x in dt])
n = len(c); LUMP, DAILY, H = 2.4e8, 2e5, 2520
def path(s, series, rule):
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
    return v * LUMP
starts, seen = [], set()
for t in range(252, n - H - 1):
    k = (dt[t].year, dt[t].month)
    if k not in seen: seen.add(k); starts.append(t)
cache = {}
def get(key, s):
    if (key, s) not in cache:
        lev, rule = key
        cache[(key, s)] = path(s, S[lev], rule)
    return cache[(key, s)]
combos = [
    ('나스닥100 1배',              [(('1x', False), 1.0)]),
    ('QLD 계속 보유',              [(('2x', False), 1.0)]),
    ('QLD 25% 룰',                 [(('2x', True), 1.0)]),
    ('TQQQ 계속 보유',             [(('3x', False), 1.0)]),
    ('TQQQ 25% 룰',                [(('3x', True), 1.0)]),
    ('TQQQ 25% 룰 50% + 1배 50%',  [(('3x', True), 0.5), (('1x', False), 0.5)]),
    ('QLD 25% 룰 70% + 1배 30%',   [(('2x', True), 0.7), (('1x', False), 0.3)]),
]
print(f'시작 {len(starts)}개월, 10년, 넣은 돈 {(LUMP + DAILY * H) / 1e8:.1f}억 (세전)')
print('방식                          10년 뒤 중간값  하위10%   최악   10억 도달 중간값  중간 최저 자산(최악)')
for name, parts in combos:
    v10, hy, mn = [], [], []
    for s in starts:
        v = sum(w * get(k, s) for k, w in parts)
        v10.append(v[-1] / 1e8); mn.append(v.min() / 1e8)
        hy.append((np.argmax(v >= 1e9) + 1) / 252 if (v >= 1e9).any() else 99)
    v10 = np.array(v10)
    print(f'{name:28s} {np.median(v10):7.1f}억 {np.percentile(v10, 10):7.1f}억 {v10.min():6.1f}억   {np.median(hy):6.1f}년        {min(mn):5.2f}억')
print()
for s0 in ('1973-01-02', '2000-03-27', '2007-10-31', '2015-07-20'):
    s = int(np.searchsorted(dt, np.datetime64(s0)))
    row = ' · '.join(f'{nm.split()[0]}{"" if len(nm.split())<2 else nm.split()[1][:2]} {sum(w*get(k,s) for k,w in p)[-1]/1e8:.1f}' for nm, p in combos)
    print(dt[s].date(), row)
