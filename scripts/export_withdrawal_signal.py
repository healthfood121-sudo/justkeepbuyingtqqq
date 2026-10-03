"""
export_withdrawal_signal.py

인출식 매매 신호 — 매일 장 마감 후 실행 (GitHub Actions: update-withdrawal-signal.yml)
──────────────────────────────────────────────────────────────────────────────
나스닥100 종가로 세 전략(S0 · T25 · D10GK)의 현재 상태와 "다음 거래일에 할 일"을 계산한다.
규칙과 실행 시점은 백테스트(withdrawal_exec_horizon.py)와 동일:
  - 200일선 15일 신호 · 1년 고점 대비 -25% 신호 → 신호가 뜬 다음 거래일에 매매
  - D10GK 조기 재매수(RSI<30 & 200일선 -10%) → 조건을 "종가 ≤ X"로 환산한 LOC 매수 주문으로 당일 종가 체결

LOC 매수 가격 환산 (어제까지의 값만으로 계산 가능):
  RSI(14, Wilder) < 30  ⇔  내일 종가 ≤ Xr
     하락폭 x에 대해 RSI' = 100 − 100/(1 + 13·ag / (13·al + x))  →  x > (91·ag − 39·al) / 3
  (종가 − 200일선') / 200일선' ≤ −10%  ⇔  내일 종가 ≤ 0.9·(1−a)·EMA / (1 − 0.9·a),  a = 2/201
  TQQQ 지정가 ≈ TQQQ 종가 × (1 + 3 × (X / 나스닥100 종가 − 1))

데이터: data/ndx_1971_now.csv + Yahoo 차트 API(^NDX, TQQQ 최근 3개월). 조회 실패 시 CSV만 사용.
출력: web/public/data/withdrawal_signal.json

  python scripts/export_withdrawal_signal.py             # 갱신
  python scripts/export_withdrawal_signal.py --offline   # Yahoo 조회 없이 CSV만
  python scripts/export_withdrawal_signal.py --selftest  # LOC 환산식이 실제 신호와 일치하는지 전 구간 검증
"""

import argparse, json, sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

ROOT     = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data/ndx_1971_now.csv"
OUT_PATH = ROOT / "web/public/data/withdrawal_signal.json"

A200        = 2.0 / 201
TIME_FILTER = 15
TRAIL       = 0.25
RSI_THR     = 30.0
DIV_THR     = -0.10
NY          = ZoneInfo("America/New_York")


# ═══════════════════════════════════════════════════════════
# 데이터
# ═══════════════════════════════════════════════════════════

def fetch_yahoo(symbol: str) -> pd.Series:
    import requests
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=3mo&interval=1d"
    r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
    r.raise_for_status()
    res = r.json()["chart"]["result"][0]
    closes = res["indicators"]["quote"][0]["close"]
    now_ny = datetime.now(NY)
    rows = {}
    for ts, c in zip(res["timestamp"], closes):
        if c is None:
            continue
        d = datetime.fromtimestamp(ts, NY).date()
        # 장 마감(16:00 ET) 전 당일 값은 확정 종가가 아니므로 제외
        if d == now_ny.date() and (now_ny.hour, now_ny.minute) < (16, 15):
            continue
        rows[pd.Timestamp(d)] = float(c)
    return pd.Series(rows).sort_index()


def load_ndx(offline: bool):
    df = pd.read_csv(CSV_PATH, parse_dates=["Date"]).sort_values("Date")
    s = df.set_index("Date")["Close"].astype(float)
    # 1985-10-01 지수 단위 변경: 백테스트는 이후 구간을 이전에 맞추지만, 여기서는 실제 지수 단위를 유지해야
    # LOC 가격이 의미가 있으므로 이전 구간을 이후 단위로 맞춘다 (비율 지표는 동일).
    cut = pd.Timestamp("1985-10-01")
    if cut in s.index:
        prev = s[s.index < cut].iloc[-1]
        s[s.index < cut] *= s[cut] / prev
    source = "csv"
    tqqq = None
    if not offline:
        try:
            y = fetch_yahoo("%5ENDX")
            new = y[y.index > s.index[-1]]
            if len(new):
                s = pd.concat([s, new])
            source = "csv+yahoo"
            t = fetch_yahoo("TQQQ")
            if len(t) and t.index[-1] == s.index[-1]:
                tqqq = float(t.iloc[-1])
        except Exception as e:                       # 네트워크 실패 시 CSV만으로 계산
            print(f"[경고] Yahoo 조회 실패 — CSV만 사용: {e}", file=sys.stderr)
    return s, tqqq, source


def indicators(closes: np.ndarray):
    n = len(closes)
    ema = np.full(n, np.nan)
    ema[199] = closes[:200].mean()
    for i in range(200, n):
        ema[i] = closes[i] * A200 + ema[i - 1] * (1 - A200)

    # Wilder RSI(14) — withdrawal_cash_tier.compute_rsi와 같은 정의. 평균 상승/하락폭도 함께 보관
    rsi = np.full(n, np.nan)
    ag_arr = np.full(n, np.nan)
    al_arr = np.full(n, np.nan)
    d = np.diff(closes)
    gains, losses = np.where(d > 0, d, 0.0), np.where(d < 0, -d, 0.0)
    ag, al = float(np.mean(gains[:14])), float(np.mean(losses[:14]))
    for i in range(14, n - 1):
        ag = (ag * 13 + gains[i]) / 14
        al = (al * 13 + losses[i]) / 14
        ag_arr[i + 1], al_arr[i + 1] = ag, al
        rsi[i + 1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)
    peaks = pd.Series(closes).rolling(252, min_periods=1).max().values
    return ema, rsi, ag_arr, al_arr, peaks


def loc_threshold(close, ema_t, ag, al):
    """다음 거래일 종가가 이 값 이하이면 RSI<30 과 200일선 -10% 조건을 동시에 만족."""
    x_min = (91 * ag - 39 * al) / 3            # 필요한 하락폭 (음수면 상승해도 RSI<30)
    xr = close - x_min if x_min > 0 else close + (39 * al - 91 * ag) / 7
    xe = 0.9 * (1 - A200) * ema_t / (1 - 0.9 * A200)
    return min(xr, xe), xr, xe


# ═══════════════════════════════════════════════════════════
# 신호 상태 머신 (백테스트 엔진의 신호·실행 규칙과 동일)
# ═══════════════════════════════════════════════════════════

def run_machine(kind, closes, ema, rsi, peaks, dates, start=200):
    inv = closes[start] >= ema[start]
    below = above = 0
    pend = None          # (action, 실행 거래일 index, 신호일)
    events = []
    for t in range(start, len(closes)):
        e = ema[t]
        if closes[t] < e:
            below += 1; above = 0
        elif closes[t] > e:
            above += 1; below = 0
        else:
            below = above = 0
        sell_sig = (closes[t] < peaks[t] * (1 - TRAIL)) if kind == "T25" else below >= TIME_FILTER
        buy_sig = above >= TIME_FILTER
        rsi_buy = (kind == "D10GK" and not inv and not buy_sig and not np.isnan(rsi[t])
                   and rsi[t] < RSI_THR and (closes[t] - e) / e <= DIV_THR)

        fire_sell = fire_buy = False
        how = ""
        if pend is not None and t >= pend[1]:
            fire_sell = pend[0] == "sell" and inv
            fire_buy = pend[0] == "buy" and not inv
            how = "신호 다음 거래일"
            pend = None
        if pend is None and not (fire_sell or fire_buy):
            if inv and sell_sig:
                pend = ("sell", t + 1, t)
            elif rsi_buy:
                fire_buy, how = True, "LOC 매수 (당일 종가)"
            elif not inv and buy_sig:
                pend = ("buy", t + 1, t)
        if fire_sell:
            inv, below = False, 0
            events.append({"date": str(dates[t].date()), "action": "매도", "how": how})
        if fire_buy:
            inv, above = True, 0
            events.append({"date": str(dates[t].date()), "action": "매수", "how": how})
    return {"invested": bool(inv), "below": below, "above": above, "pend": pend, "events": events}


def describe(kind, m, closes, ema, rsi, ag, al, peaks, dates, tqqq):
    t = len(closes) - 1
    c, e = closes[t], ema[t]
    out = {
        "state":       "보유" if m["invested"] else "현금",
        "last_events": m["events"][-4:][::-1],
        "action":      "없음",
        "detail":      "",
    }
    if m["pend"] is not None:
        act = "매도" if m["pend"][0] == "sell" else "매수"
        out["action"] = act
        out["detail"] = f"{dates[m['pend'][2]].date()} 종가로 {act} 신호 확정 → 다음 거래일에 전량 {act}"
        return out

    if kind in ("S0", "D10GK") and m["invested"]:
        out["detail"] = (f"200일 평균선 아래 {m['below']}일째 (15일이면 매도 신호). "
                         f"다음 종가가 {e:,.0f} 아래면 {m['below'] + 1}일째")
    elif kind == "T25" and m["invested"]:
        line = peaks[t] * (1 - TRAIL)
        out["detail"] = (f"1년 최고 종가 {peaks[t]:,.0f} 대비 {(c / peaks[t] - 1) * 100:+.1f}%. "
                         f"종가가 {line:,.0f} 아래로 끝나면 매도 신호")
    elif m["above"] > 0:
        out["detail"] = (f"200일 평균선 위 {m['above']}일째 (15일이면 매수 신호). "
                         f"다음 종가가 {e:,.0f} 위면 {m['above'] + 1}일째")
    else:
        out["detail"] = (f"200일 평균선 아래 ({(c / e - 1) * 100:+.1f}%). "
                         f"종가가 {e:,.0f} 위로 15일 연속 마감하면 매수 신호")

    if kind == "D10GK" and not m["invested"]:
        x, xr, xe = loc_threshold(c, e, ag[t], al[t])
        loc = {
            "ndx_price":   round(x, 2),
            "ndx_pct":     round((x / c - 1) * 100, 2),
            "tqqq_pct":    round(3 * (x / c - 1) * 100, 2),
            "tqqq_price":  round(tqqq * (1 + 3 * (x / c - 1)), 2) if tqqq else None,
            "by":          "RSI" if xr <= xe else "200일선 -10%",
        }
        out["loc"] = loc
        out["action"] = "LOC 매수 주문"
        price = f"TQQQ ${loc['tqqq_price']:,.2f}" if loc["tqqq_price"] else f"TQQQ 전일 종가 대비 {loc['tqqq_pct']:+.1f}%"
        out["detail"] += (f". 조기 재매수: 나스닥100이 {x:,.0f}({loc['ndx_pct']:+.1f}%) 이하로 끝나면 체결되도록 "
                          f"{price} 이하 LOC 매수 주문")
    return out


# ═══════════════════════════════════════════════════════════
# 검증
# ═══════════════════════════════════════════════════════════

def selftest(closes, ema, rsi, ag, al):
    """전 구간에서 'LOC 가격 이하로 마감' ⇔ '다음날 RSI<30 & 200일선 -10%' 가 일치하는지 확인."""
    mism = checked = 0
    for t in range(400, len(closes) - 1):
        if np.isnan(ag[t]) or np.isnan(rsi[t + 1]):
            continue
        x, _, _ = loc_threshold(closes[t], ema[t], ag[t], al[t])
        pred = closes[t + 1] <= x
        actual = rsi[t + 1] < RSI_THR and (closes[t + 1] - ema[t + 1]) / ema[t + 1] <= DIV_THR
        checked += 1
        if pred != actual and abs(closes[t + 1] / x - 1) > 1e-9:
            mism += 1
    print(f"selftest: {checked:,}일 검사, 불일치 {mism}일")
    return mism == 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()

    s, tqqq, source = load_ndx(args.offline)
    closes, dates = s.values, pd.DatetimeIndex(s.index)
    ema, rsi, ag, al, peaks = indicators(closes)

    if args.selftest:
        sys.path.insert(0, str(Path(__file__).parent))
        from withdrawal_cash_tier import compute_rsi
        ref = compute_rsi(closes, 14)
        ok_rsi = np.allclose(np.nan_to_num(ref), np.nan_to_num(rsi))
        print(f"RSI 정의 일치 (백테스트 엔진 대비): {ok_rsi}")
        sys.exit(0 if (selftest(closes, ema, rsi, ag, al) and ok_rsi) else 1)

    t = len(closes) - 1
    strategies = {}
    for kind in ("S0", "T25", "D10GK"):
        m = run_machine(kind, closes, ema, rsi, peaks, dates)
        strategies[kind] = describe(kind, m, closes, ema, rsi, ag, al, peaks, dates, tqqq)

    out = {
        "asof":        str(dates[t].date()),
        "source":      source,
        "ndx_close":   round(float(closes[t]), 2),
        "ema200":      round(float(ema[t]), 2),
        "vs_ema_pct":  round(float((closes[t] / ema[t] - 1) * 100), 2),
        "peak_1y":     round(float(peaks[t]), 2),
        "vs_peak_pct": round(float((closes[t] / peaks[t] - 1) * 100), 2),
        "rsi14":       round(float(rsi[t]), 1),
        "tqqq_close":  tqqq,
        "strategies":  strategies,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
