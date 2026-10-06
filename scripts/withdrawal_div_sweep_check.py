"""
withdrawal_div_sweep_check.py — 탐색용 (터미널 출력만, JSON 없음)
D10GK의 200일선 대비 하락폭 기준을 5~15%로 바꿔 418가지 시작 시점 중간값 확인.
엔진·조건은 withdrawal_rsi_sweep.py와 동일 (D05·D10·D15 값 재현 확인).
"""
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from pathlib import Path
import multiprocessing as mp
import numpy as np
import withdrawal_rsi_sweep as W
ROOT = Path(__file__).resolve().parent.parent
W.DATA_DIR = ROOT / 'data'; W.FED_PATH = ROOT / 'data/fed_funds_rate.json'
P = W.Param
PARAMS = []
for d in (5, 6, 7, 8, 10, 12, 15):
    PARAMS.append(P(f"D{d:02d}", "", rsi_thr=30, div_thr=-d/100))
    PARAMS.append(P(f"D{d:02d}GK", "", rsi_thr=30, div_thr=-d/100, use_gk=True))
if __name__ == '__main__':
    ndx3x, closes, ema200, rsi_series, dates, sp500, fed_rates = W.load_data()
    fv = int(np.where(~np.isnan(ema200))[0][0])
    starts = [i for i in W.get_monthly_starts(dates) if i >= fv and (len(ndx3x) - i) / 252 >= W.SIM_YEARS]
    with mp.Pool(mp.cpu_count(), initializer=W._init_worker,
                 initargs=(ndx3x, closes, ema200, rsi_series, dates.tolist(), sp500, fed_rates, starts)) as pool:
        res = dict(pool.map(W._run_one, PARAMS, chunksize=1))
    print('cohorts', len(starts))
    for p in PARAMS:
        sf = sorted(r['final'] for r in res[p.name]); nf = len(sf)
        print(p.name, round(sf[nf // 2], 1))
