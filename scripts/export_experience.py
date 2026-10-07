"""
export_experience.py

'−96%를 견딜 수 있나' 체험 페이지 데이터 — 1990년 1월에 10억으로 25% 룰 인출을 시작한 한 경우를 달마다 따라간다.
──────────────────────────────────────────────────────────────────────────────
엔진: withdrawal_cash_tier.run_sim (withdrawal_full_period.py와 같은 조건 — 인출 가이드의 1990년 예시와 같은 경우)
달마다: 월말 총자산 · 그달 생활비 · 월말 상태(보유/현금) · 나스닥100 월말 값 · 그달 매매 · 그달 최저 총자산 · 그때 있었던 일

출력: web/public/data/experience_1990.json
  python scripts/export_experience.py
"""

import json
import numpy as np

import withdrawal_cash_tier as E

OUT_PATH = E.ROOT / "web/public/data/experience_1990.json"
START = "1990-01"

# 그달 있었던 일 (널리 알려진 사건만)
NOTES = {
    "1990-08": "이라크가 쿠웨이트를 침공했다. 걸프전 우려로 주가가 빠진다.",
    "1991-01": "걸프전이 시작됐다.",
    "1994-02": "미국 연준이 금리를 올리기 시작했다.",
    "1997-10": "아시아 외환위기가 번졌다. 한국은 한 달 뒤 IMF 구제금융을 신청한다.",
    "1998-08": "러시아가 채무 불이행을 선언했고, 헤지펀드 LTCM이 무너지기 시작했다.",
    "1999-12": "닷컴 열풍이 한창이다. 인터넷 회사 주가가 하루에 몇십 %씩 오른다.",
    "2000-03": "나스닥이 사상 최고점을 찍었다. 닷컴버블의 정점이다.",
    "2001-09": "9·11 테러. 미국 증시가 나흘 동안 문을 닫았다.",
    "2002-10": "닷컴버블 바닥. 나스닥100은 고점보다 83% 낮다.",
    "2003-03": "이라크 전쟁이 시작됐다.",
    "2007-08": "서브프라임 대출 부실이 터지기 시작했다.",
    "2008-09": "리먼 브라더스가 파산했다. 금융위기가 본격화한다.",
    "2009-03": "금융위기 바닥.",
    "2010-05": "플래시 크래시와 유럽 재정위기.",
    "2011-08": "미국 신용등급이 처음으로 강등됐다.",
    "2015-08": "중국 위안화 절하 충격.",
    "2018-12": "금리 인상과 미·중 무역분쟁으로 급락했다.",
    "2020-03": "코로나19 폭락. 한 달 만에 나스닥100이 30% 가까이 빠졌다.",
    "2022-01": "물가가 치솟고 연준이 급하게 금리를 올리기 시작했다.",
    "2022-12": "2022년 하락장의 끝 무렵. 나스닥100은 고점보다 30% 넘게 낮다.",
    "2025-04": "미국의 관세 발표로 급락했다.",
}


def main():
    E.LIV_MAX = float("inf")
    tq, qq, closes, ema, dates, rp, rsi, peaks = E.load_data()
    n = len(closes)
    si = next(i for i in E.get_monthly_starts(dates) if dates[i].strftime("%Y-%m") == START)
    log = []
    r = E.run_sim(tq, qq, closes, ema, dates, rp, rsi, peaks, si, E.Param("RULE25", "", ((0, 1.0),), trail_thr=0.25), True,
                  exec_mode="loc", horizon_days=n, snaps=set(range(1, n - si + 1)), trade_log=log)
    days = sorted(r["snaps"])
    tot = np.array([r["snaps"][k] for k in days])
    liv = np.array([r["snaps_liv"][k] for k in days])
    ds = [dates[si + k - 1] for k in days]
    trades = {}
    for ci, act, _ in log:
        trades.setdefault(dates[ci].strftime("%Y-%m"), []).append({"d": str(dates[ci].date()), "a": "매도" if act == "SELL" else "매수"})

    rows, state, peak = [], "보유", 0.0
    for k in range(len(days)):
        m = ds[k].strftime("%Y-%m")
        last = k == len(days) - 1 or ds[k + 1].strftime("%Y-%m") != m
        if not last:
            continue
        mi = [j for j in range(max(0, k - 25), k + 1) if ds[j].strftime("%Y-%m") == m]
        for t in trades.get(m, []):
            state = "현금" if t["a"] == "매도" else "보유"
        peak = max(peak, float(tot[mi].max()))
        rows.append({
            "m": m, "total": round(float(tot[k]), 2), "low": round(float(tot[mi].min()), 2),
            "living": int(liv[k]), "state": state, "ndx": round(float(closes[si + days[k] - 1]), 1),
            "vs_peak": round((float(tot[k]) / peak - 1) * 100, 1),
            "trades": trades.get(m, []), "note": NOTES.get(m, ""),
        })

    out = {"start": START, "rows": rows, "max_dd": r["max_dd"], "withdrawn": r["withdrawn"], "final": r["final"]}
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    pk = max(rows, key=lambda x: x["total"] if x["m"] < "2005" else 0)
    lo = min((x for x in rows if pk["m"] < x["m"] < "2010"), key=lambda x: x["low"])
    print(f"{len(rows)}개월 · 최고 {pk['m']} {pk['total']}억 · 최저 {lo['m']} {lo['low']}억 · 매매 {len(log)}번 · 꺼내 쓴 돈 {r['withdrawn']}억 · 남은 자산 {r['final']}억")
    print(f"저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
