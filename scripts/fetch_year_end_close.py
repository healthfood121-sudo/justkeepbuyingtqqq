"""fetch_year_end_close.py — 연말 종가(배당 미반영 Close)와 배당 조정 종가(Adj Close)를 받아 출력.

왜: 롤링 JSON의 epsDecomp PER은 배당 조정 주가로 계산돼 오래된 해일수록 실제보다 낮다.
    실제 PER로 바꾸려면 연말 실제 종가가 필요하다(이 세션 환경은 Yahoo가 막혀 Actions에서 실행).
사용: python scripts/fetch_year_end_close.py AAPL KO MSFT ...
출력: 로그에 'YEC_JSON {...}' 한 줄 → scripts/data/year_end_close.json 으로 저장해 rolling_actual_pe.py가 사용
"""
import json
import sys

import pandas as pd
import yfinance as yf

out = {}
for t in sys.argv[1:]:
    raw = yf.download(t, start="1970-01-01", auto_adjust=False, progress=False)
    c, a = raw["Close"], raw["Adj Close"]
    if isinstance(c, pd.DataFrame):
        c, a = c.iloc[:, 0], a.iloc[:, 0]
    c, a = c.dropna(), a.dropna()
    ye_c = c.groupby(c.index.year).last()
    ye_a = a.groupby(a.index.year).last()
    out[t] = {str(y): [round(float(ye_c[y]), 4), round(float(ye_a[y]), 4)] for y in ye_c.index if y in ye_a.index}
    print(t, len(out[t]), flush=True)
print("YEC_JSON " + json.dumps(out, separators=(",", ":")))
