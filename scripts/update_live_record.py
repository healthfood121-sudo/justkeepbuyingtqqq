"""
update_live_record.py

실제 운용 성적표 — 사이트가 신호를 매일 공개하기 시작한 뒤(2026-10-02 종가 기준)부터,
공개된 신호를 그대로 따랐다면 실제 TQQQ 가격으로 얼마가 됐는지 하루씩 쌓는다.
최적화에 쓰지 않은 데이터로 하는 독립 검증이 시간이 갈수록 저절로 쌓인다.

규칙: 그날 종가 이후 상태(보유/현금)는 withdrawal_signal.json과 같은 상태 머신 — 신호 다음 거래일 종가에 매매.
  전날 종가 기준 '보유'였으면 그날 TQQQ 수익률, '현금'이었으면 외화RP 이자(기준금리 − 0.4%, 세후)를 받는다.
  비교: S0(200일선 15일), 신호 없이 TQQQ 계속 보유, 나스닥100(1배) 보유. 세금·생활비 인출은 넣지 않는다.
TQQQ 종가가 없는 날(Yahoo 조회 실패)은 나스닥100 수익률 × 3으로 추정하고 est 표시.

  python scripts/update_live_record.py               # 오늘 신호 파일(withdrawal_signal.json)을 한 줄 추가
  python scripts/update_live_record.py --backfill    # data/extra CSV로 START부터 다시 만든다 (처음 한 번)

출력: web/public/data/live_record.json
"""

import argparse, json, sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT     = Path(__file__).resolve().parent.parent
SIGNAL   = ROOT / "web/public/data/withdrawal_signal.json"
OUT_PATH = ROOT / "web/public/data/live_record.json"
FED_PATH = ROOT / "data/fed_funds_rate.json"
START    = "2026-10-02"          # 신호 매일 공개 직전 종가 (사이트 공개 2026-10-03)
KEYS     = ("RULE25", "S0")


def cash_daily(d: str) -> float:
    with open(FED_PATH, encoding="utf-8") as f:
        fed = {r["date"][:7]: float(r["rate"]) for r in json.load(f)}
    rate = fed.get(d[:7]) or fed[max(fed)]
    return max(0.0, rate / 100 - 0.004) / 252 * (1 - 0.154)


def recompute(rows: list) -> dict:
    """rows(날짜·가격·상태)로 성적 다시 계산."""
    v = {"RULE25": 100.0, "S0": 100.0, "HOLD3": 100.0, "HOLD1": 100.0}
    for i, r in enumerate(rows):
        if i == 0:
            r["v"] = {k: 100.0 for k in v}
            continue
        p = rows[i - 1]
        r_ndx = r["ndx"] / p["ndx"] - 1
        if r.get("tqqq") and p.get("tqqq"):
            r_tq = r["tqqq"] / p["tqqq"] - 1
        else:
            r_tq = 3 * r_ndx
            r["est"] = True
        c = cash_daily(r["d"])
        for k in KEYS:
            v[k] *= (1 + r_tq) if p["state"][k] == "보유" else (1 + c)
        v["HOLD3"] *= 1 + r_tq
        v["HOLD1"] *= 1 + r_ndx
        r["v"] = {k: round(x, 3) for k, x in v.items()}
    last = rows[-1] if rows else None
    events = [{"d": r["d"], "k": k, "from": rows[i - 1]["state"][k], "to": r["state"][k]}
              for i, r in enumerate(rows) if i > 0 for k in KEYS if r["state"][k] != rows[i - 1]["state"][k]]
    return {
        "start": START,
        "asof": last["d"] if last else None,
        "days": max(0, len(rows) - 1),
        "now": last["v"] if last else None,
        "events": events,
        "rows": rows,
    }


def backfill() -> list:
    sys.path.insert(0, str(Path(__file__).parent))
    import export_withdrawal_signal as X
    s, _, _ = X.load_ndx(offline=True)
    y = pd.read_csv(ROOT / "data/extra/ndx_yahoo.csv", parse_dates=["Date"]).set_index("Date")["Close"]
    s = pd.concat([s, y[y.index > s.index[-1]]])
    tq = pd.read_csv(ROOT / "data/extra/tqqq.csv", parse_dates=["Date"]).set_index("Date")["Close"]
    closes, dates = s.values, pd.DatetimeIndex(s.index)
    ema, rsi, ag, al, peaks = X.indicators(closes)
    rows = []
    for t in range(len(closes)):
        d = str(dates[t].date())
        if d < START:
            continue
        state = {}
        for k in KEYS:
            m = X.run_machine(k, closes[:t + 1], ema[:t + 1], rsi[:t + 1], peaks[:t + 1], dates[:t + 1])
            state[k] = "보유" if m["invested"] else "현금"
        rows.append({"d": d, "ndx": round(float(closes[t]), 2),
                     "tqqq": round(float(tq[dates[t]]), 2) if dates[t] in tq.index else None, "state": state})
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backfill", action="store_true")
    args = ap.parse_args()

    if args.backfill:
        rows = backfill()
    else:
        old = json.loads(OUT_PATH.read_text(encoding="utf-8")) if OUT_PATH.exists() else {"rows": []}
        rows = [{k: r[k] for k in ("d", "ndx", "tqqq", "state")} for r in old["rows"]]
        sig = json.loads(SIGNAL.read_text(encoding="utf-8"))
        if sig["asof"] < START or (rows and sig["asof"] <= rows[-1]["d"]):
            print(f"새 날짜 없음 ({sig['asof']}) — 그대로"); return
        rows.append({"d": sig["asof"], "ndx": sig["ndx_close"], "tqqq": sig.get("tqqq_close"),
                     "state": {k: sig["strategies"][k]["state"] for k in KEYS}})

    out = recompute(rows)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    n = out["now"]
    print(f"{out['start']} ~ {out['asof']} ({out['days']}거래일) · 25% 룰 {n['RULE25'] - 100:+.2f}% · S0 {n['S0'] - 100:+.2f}% · "
          f"TQQQ 보유 {n['HOLD3'] - 100:+.2f}% · 나스닥100 {n['HOLD1'] - 100:+.2f}%")


if __name__ == "__main__":
    main()
