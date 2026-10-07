"""
withdrawal_tax.py

인출식 세금 분석 — 25% 룰 등으로 꺼내 쓸 때 양도세를 얼마나, 언제 내나
──────────────────────────────────────────────────────────────────────────────
엔진: withdrawal_cash_tier.run_sim (withdrawal_full_period.py와 같은 조건)
  해외 ETF 양도차익 연 250만원 공제 후 22%, 다음 해 초 현금에서 납부 (실제 신고·납부는 5월)
비교: 같은 조건에서 세금이 없었다면(TAX_RATE=0)의 인출 포함 연 수익률 → 세금이 깎는 수익률
지표 (10년 이상 보유한 548개 시작 시점):
  tax_vs_wd     — 낸 양도세 합계 ÷ 꺼내 쓴 생활비 합계
  max_tax_pct   — 가장 큰 한 해 세금이 납부 시점 총자산의 몇 %
  tax_free_pct  — 양도차익이 공제(250만원) 이하라 세금이 0인 해의 비율
  irr_cost      — 세금이 없을 때와의 인출 포함 연 수익률 차이 (%p)
예시: 1990-01 시작 25% 룰의 연도별 세금

출력: web/public/data/withdrawal_tax.json
  python scripts/withdrawal_tax.py
"""

import json, time
import multiprocessing as mp
import numpy as np

import withdrawal_cash_tier as E
from withdrawal_full_period import irr, q

OUT_PATH = E.ROOT / "web/public/data/withdrawal_tax.json"
EOK = E.EOK
P = E.Param
STRATS = [
    ("RULE25", P("RULE25", "", ((0, 1.0),), trail_thr=0.25)),
    ("S0",     P("S0", "", ((0, 1.0),))),
    ("D10GK",  P("D10GK", "", ((0, 1.0),), rsi_thr=30, use_gk=True)),
    ("HOLD3",  P("HOLD3", "", ((0, 1.0),), hold=True)),
]
EXAMPLE = "1990-01"
_M = {}


def _init():
    E.LIV_MAX = float("inf")
    _M["d"] = E.load_data()


def _job(task):
    name, notax = task
    p = dict(STRATS)[name]
    E.TAX_RATE = 0.0 if notax else 0.22
    tq, qq, c, ema, dates, rp, rsi, pk = _M["d"]
    n = len(c)
    out = []
    for si in E.get_monthly_starts(dates):
        if (n - si) / 252 < 10:
            continue
        r = E.run_sim(tq, qq, c, ema, dates, rp, rsi, pk, si, p, True, exec_mode="loc", horizon_days=n, collect_flows=True)
        r["irr"] = irr(r.pop("flows"), r["final"], r["years"])
        r["s"] = dates[si].strftime("%Y-%m")
        out.append(r)
    return name, notax, out


def main():
    t0 = time.time()
    tasks = [(s, nt) for s, _ in STRATS for nt in (False, True)]
    with mp.Pool(mp.cpu_count(), initializer=_init) as pool:
        raw = {(s, nt): rs for s, nt, rs in pool.imap_unordered(_job, tasks)}

    summary, rows = {}, {}
    for s, _ in STRATS:
        rs, rn = raw[(s, False)], raw[(s, True)]
        per = []
        for a, b in zip(rs, rn):
            ty = a["tax_years"]
            tax = sum(t[1] for t in ty)
            big = max(ty, key=lambda t: t[1] / t[3] if t[3] > 0 else 0) if ty else None
            per.append({
                "s": a["s"], "irr": a["irr"], "irr0": b["irr"],
                "tax": round(tax / EOK, 2), "wd": a["withdrawn"],
                "tax_vs_wd": round(tax / EOK / a["withdrawn"] * 100, 1) if a["withdrawn"] > 0 else 0.0,
                "max_tax_pct": round(big[1] / big[3] * 100, 1) if big and big[3] > 0 else 0.0,
                "max_tax_year": int(big[0]) if big else None,
                "tax_free_pct": round(sum(1 for t in ty if t[1] <= 0) / len(ty) * 100, 1) if ty else 100.0,
            })
        rows[s] = per
        f = lambda k, pct=0.5: round(q(sorted(x[k] for x in per), pct), 1)
        summary[s] = {
            "n": len(per),
            "irr": f("irr"), "irr0": f("irr0"),
            "irr_cost": round(q(sorted(x["irr0"] - x["irr"] for x in per), 0.5), 1),
            "tax_vs_wd": f("tax_vs_wd"), "tax_vs_wd_p90": f("tax_vs_wd", 0.9),
            "max_tax_pct": f("max_tax_pct"), "max_tax_pct_p90": f("max_tax_pct", 0.9),
            "max_tax_pct_worst": round(max(x["max_tax_pct"] for x in per), 1),
            "tax_free_pct": f("tax_free_pct"),
        }
        g = summary[s]
        print(f"{s:<7} IRR {g['irr']} (세금 없으면 {g['irr0']}, 차이 중간 {g['irr_cost']}%p) · 세금/생활비 {g['tax_vs_wd']}% (상위10% {g['tax_vs_wd_p90']}) · "
              f"가장 큰 한 해 세금 = 자산의 {g['max_tax_pct']}% (상위10% {g['max_tax_pct_p90']}, 최대 {g['max_tax_pct_worst']}) · 세금 0인 해 {g['tax_free_pct']}%")

    ex = next(r for r in raw[("RULE25", False)] if r["s"] == EXAMPLE)
    example = [{"y": int(y), "tax": round(t / EOK, 2), "gain": round(g / EOK, 2), "total": round(tot / EOK, 1),
                "pct": round(t / tot * 100, 1) if tot > 0 else 0.0} for y, t, g, tot in ex["tax_years"]]
    print("\n1990-01 25% 룰 — 세금 큰 해: " + ", ".join(f"{e['y']} {e['tax']}억({e['pct']}%)" for e in sorted(example, key=lambda e: -e["tax"])[:5]))

    out = {
        "meta": {"conditions": "초기 10억 · 스왑금리 · 모든 매도 양도세(연 250만 공제 후 22%, 다음 해 초 납부) · 현금 외화RP(세후) · 신호 다음 거래일 매매 · "
                               "동적 인출 월 0.3/0.5/0.7%(상한 없음) · 오늘까지 보유 · 10년 이상 보유한 시작 시점",
                 "strategies": [s for s, _ in STRATS], "example": EXAMPLE},
        "summary": summary, "example": example, "rows": rows,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초")


if __name__ == "__main__":
    main()
