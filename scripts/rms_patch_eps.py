"""
rms_patch_eps.py — RMS_rolling.json 의 EPS만 바꿔 넣고 관련 값(PER·EPS 배수·연평균 성장률)을 다시 계산
(전체 export_rolling_json.py 를 돌리지 않고 EPS 정정만 반영할 때 사용)
사용: python scripts/rms_patch_eps.py 2001=1.84 2007=2.71 ...
가격은 기존 PER × 기존 EPS 로 되살린다(실제 종가 기준 PER, 배당조정 peBuy 모두 유지).
"""
import json, sys
from pathlib import Path

PATH = Path(__file__).parent.parent / "web/public/data/rolling/RMS_rolling.json"
new = {int(k): float(v) for k, v in (a.split("=") for a in sys.argv[1:])}
d = json.loads(PATH.read_text())
years = {r["buyYear"]: r["yearsActual"] for r in d["rows10y"]}
old = {}
for x in d["epsDecomp"]:
    old[x["buyYear"]] = x["epsBuy"]
    old[x["sellYear"]] = x["epsSell"]
for x in d["epsDecomp"]:
    b, s = x["buyYear"], x["sellYear"]
    pb, ps = x["peBuy"] * x["epsBuy"], x["peSell"] * x["epsSell"]
    if b in new: x["epsBuy"] = round(new[b], 3)
    if s in new: x["epsSell"] = round(new[s], 3)
    if b not in new and s not in new: continue
    yrs = years.get(b, s - b)
    e = x["epsSell"] / x["epsBuy"]
    x["epsMultiple"] = round(e, 2)
    x["epsGrowthCagr"] = round((e ** (1 / yrs) - 1) * 100, 2)
    x["peBuy"], x["peSell"] = round(pb / x["epsBuy"], 1), round(ps / x["epsSell"], 1)
    pm = (ps / x["epsSell"]) / (pb / x["epsBuy"])
    x["peMultiple"] = round(pm, 2)
    x["peCagr"] = round((pm ** (1 / max(1e-9, s - b)) - 1) * 100, 2)
    print(b, s, x["epsBuy"], x["epsSell"], x["peBuy"], x["peSell"], x["epsGrowthCagr"], x["peCagr"])
for r in d["rows10y"]:
    y = r["buyYear"]
    if y in new and y in old:
        for k in ("peBuy", "peBuyActual"):
            if k in r:
                r[k] = round(r[k] * old[y] / new[y], 1)
PATH.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
