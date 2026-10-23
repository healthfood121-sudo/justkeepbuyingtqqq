"""
rms_actual_pe.py — 에르메스 롤링 데이터의 PER을 '실제 종가(배당 미반영)' 기준으로 바꿈

왜: RMS_10y_annual_full.csv 가격은 배당을 재투자한 것으로 조정한 종가라, 오래된 해일수록
    실제보다 낮다(2000년 약 27% 낮음). 그 가격으로 계산한 PER도 그만큼 낮게 나와 실제 PER과 다르다.
방법:
  - 2000년 이후: RMS_monthly_price.json(배당 미반영 월말 종가)의 연말 값
  - 1993~1999년: 실제 종가 자료가 없어, 2000~2009년 '실제 ÷ 조정' 비율의 추세를 이어 추정(estimated 표시)
  - 수익률(totalCagr)·EPS는 그대로. PER 효과는 이제 배당을 뺀 순수 PER 변화(배당은 별도 몫)
사용:
  python scripts/rms_actual_pe.py          # web/public/data/rolling/RMS_rolling.json 을 고쳐 씀
  export_rolling_json.py 의 RMS 단계에서도 apply_actual_pe()를 불러 같은 처리를 한다.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).parent.parent
ROLL = ROOT / "web" / "public" / "data" / "rolling"


def year_end_actual(monthly_path: Path) -> dict:
    m = json.loads(monthly_path.read_text())
    return {int(r["d"][:4]): r["c"] for r in m["rows"] if r["d"].endswith("-12")}


def apply_actual_pe(out: dict, monthly_path: Path = ROLL / "RMS_monthly_price.json") -> dict:
    actual = year_end_actual(monthly_path)
    dec = out.get("epsDecomp") or []
    # 조정 종가 = EPS × (조정 기준) PER
    adj = {}
    for d in dec:
        if not d.get("peBasis"):
            adj[d["buyYear"]] = d["epsBuy"] * d["peBuy"]
            adj[d["sellYear"]] = d["epsSell"] * d["peSell"]
    if not adj:  # 이미 바뀐 파일
        return out
    eps = {}
    for d in dec:
        eps[d["buyYear"]] = d["epsBuy"]
        eps[d["sellYear"]] = d["epsSell"]
    # 실제 ÷ 조정 비율, 2000~2009년 추세(로그 직선)로 1993~1999년 추정
    ratio = {y: actual[y] / adj[y] for y in adj if y in actual and adj[y] > 0}
    fit = [(y, math.log(r)) for y, r in ratio.items() if 2000 <= y <= 2009]
    n = len(fit)
    mx = sum(y for y, _ in fit) / n
    my = sum(v for _, v in fit) / n
    slope = sum((y - mx) * (v - my) for y, v in fit) / sum((y - mx) ** 2 for y, _ in fit)
    est = lambda y: math.exp(my + slope * (y - mx))
    price, estimated = {}, set()
    for y, a in adj.items():
        if y in actual:
            price[y] = actual[y]
        else:
            price[y] = a * est(y)
            estimated.add(y)
    for d in dec:
        b, s = d["buyYear"], d["sellYear"]
        yrs = max(1e-9, s - b)
        pb, ps = price[b] / eps[b], price[s] / eps[s]
        d["peBuy"], d["peSell"] = round(pb, 1), round(ps, 1)
        d["peMultiple"] = round(ps / pb, 2)
        d["peCagr"] = round(((ps / pb) ** (1 / yrs) - 1) * 100, 2)
        d["peBasis"] = "actual-estimated" if b in estimated or s in estimated else "actual"
    for r in out.get("rows10y") or []:
        y = r["buyYear"]
        if y in price and y in eps and eps[y] > 0:
            r["peBuyActual"] = round(price[y] / eps[y], 1)
    out["peNote"] = (
        "PER은 실제 종가(배당 미반영) ÷ EPS. 2000년 이후는 Yahoo 월말 종가, "
        f"1993~1999년은 2000~2009년 '실제÷배당조정' 비율 추세로 추정(연 {slope * 100:.2f}%). "
        "PER 효과는 배당을 뺀 순수 PER 변화."
    )
    return out


if __name__ == "__main__":
    path = ROLL / "RMS_rolling.json"
    data = json.loads(path.read_text())
    before = {d["buyYear"]: d["peBuy"] for d in data.get("epsDecomp", [])}
    data = apply_actual_pe(data)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    for d in data["epsDecomp"]:
        print(d["buyYear"], before.get(d["buyYear"]), "→", d["peBuy"], "/", d["sellYear"], d["peSell"], d["peBasis"])
    print(data["peNote"])
