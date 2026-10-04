"""
export_withdrawal_tradelog.py
인출 전략 거래 로그 — 시작 시점별 매수·매도 기록 (T25 권장 전략 + S0 비교)
──────────────────────────────────────────────────────────────────────────────
엔진·조건은 withdrawal_full_period.py와 동일:
  - 초기 10억, 1971-02 ~ 2026-09 매달 시작 (668개), 각자 데이터 끝까지 보유
  - 모든 매도 양도세 22% (연 250만 공제) · 현금 외화RP (기준금리 − 0.4%, 세후)
  - 신호 다음 거래일 종가에 매매 · 동적 인출 월 0.3/0.5/0.7% (상한 없음)
  - 기본: 스왑금리 반영 / --fee-only: 운용보수만
출력 (전략별·비용별 4개):
  web/public/data/withdrawal_tradelog_{t25,s0}.json       — 스왑금리 반영
  web/public/data/withdrawal_tradelog_{t25,s0}_fee.json   — 운용보수만
거래 1건 = [실행일, "S"(매도)|"B"(매수), 나스닥100 종가, 200일 지수이동평균, 1년 최고 종가, 거래 직후 총자산(억)]
"""
import json, sys, time
import multiprocessing as mp
import numpy as np
import pandas as pd
import withdrawal_cash_tier as E

P = E.Param
STRATS = {
    "t25": ("T25", "1년 최고 종가보다 25% 낮게 끝나면 다음 날 전량 매도 · 200일 지수이동평균 위 15일 연속이면 다음 날 재매수",
            P("T25", "", ((0, 1.0),), trail_thr=0.25)),
    "s0":  ("S0", "200일 지수이동평균 아래 15일 연속이면 다음 날 전량 매도 · 위 15일 연속이면 다음 날 재매수",
            P("S0", "", ((0, 1.0),))),
}
_S = {}


def _init(*args):
    keys = ("tq", "qq", "closes", "ema", "dates", "rp", "rsi", "peaks")
    _S.update(dict(zip(keys, args)))
    _S["dates"] = pd.DatetimeIndex(_S["dates"])


def _job(arg):
    key, si = arg
    s = _S
    n = len(s["closes"]) - si
    log = []
    r = E.run_sim(s["tq"], s["qq"], s["closes"], s["ema"], s["dates"], s["rp"], s["rsi"], s["peaks"],
                  si, STRATS[key][2], True, exec_mode="loc", horizon_days=n, trade_log=log)
    e0 = s["ema"][si]
    trades = [[s["dates"][ci].strftime("%Y-%m-%d"), a[0], round(float(s["closes"][ci]), 2),
               round(float(s["ema"][ci]), 2), round(float(s["peaks"][ci]), 2), round(tot / E.EOK, 2)]
              for ci, a, tot in log]
    return {
        "s": s["dates"][si].strftime("%Y-%m"),
        "inv": bool(np.isnan(e0) or s["closes"][si] >= e0),
        "final": r["final"], "wd": r["withdrawn"], "yrs": r["years"], "dd": r["max_dd"],
        "t": trades,
    }


def main():
    fee = "--fee-only" in sys.argv
    if fee:
        E.SWAP = False
    E.LIV_MAX = float("inf")
    t0 = time.time()
    tq, qq, closes, ema, dates, rp, rsi, peaks = E.load_data()
    starts = E.get_monthly_starts(dates)
    with mp.Pool(mp.cpu_count(), initializer=_init,
                 initargs=(tq, qq, closes, ema, dates.tolist(), rp, rsi, peaks)) as pool:
        for key, (name, desc, _) in STRATS.items():
            rows = pool.map(_job, [(key, si) for si in starts], chunksize=8)
            long = [r for r in rows if r["yrs"] >= 10]
            out = {
                "meta": {
                    "generated": str(dates[-1].date()),
                    "strategy": name, "desc": desc,
                    "price_mode": "fee_only" if fee else "with_costs",
                    "conditions": "초기 10억 · " + ("운용보수만(스왑금리 미반영)" if fee else "스왑금리·운용보수")
                                  + " · 모든 매도 양도세 22% · 현금 외화RP(기준금리−0.4%, 세후) · 신호 다음 거래일 매매"
                                  " · 동적 인출 월 0.3/0.5/0.7%(상한 없음) · 시작 시점부터 데이터 끝까지 보유",
                    "n_cohorts": len(rows),
                    "median_final_10y": round(float(np.median([r["final"] for r in long])), 2),
                    "median_wd_10y": round(float(np.median([r["wd"] for r in long])), 2),
                    "avg_trades": round(float(np.mean([len(r["t"]) for r in rows])), 1),
                },
                "cohorts": rows,
            }
            path = E.ROOT / f"web/public/data/withdrawal_tradelog_{key}{'_fee' if fee else ''}.json"
            with open(path, "w", encoding="utf-8") as f:
                json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
            print(f"{name}: {path.name} ({path.stat().st_size / 1024:.0f} KB) · 평균 거래 {out['meta']['avg_trades']}회"
                  f" · 10년 이상 보유 최종자산 중간값 {out['meta']['median_final_10y']}억")
    print(f"{time.time() - t0:.0f}초")


if __name__ == "__main__":
    main()
