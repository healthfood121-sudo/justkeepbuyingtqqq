"""rolling_actual_pe.py — 롤링 JSON의 PER을 '실제 종가(배당 미반영)' 기준으로 바꿈 (에르메스 외 종목)

왜: export_rolling_json.py 가 쓰는 가격은 배당을 재투자한 것으로 조정한 종가라, 오래된 해일수록
    실제보다 낮다(배당 3%대 종목은 30년 전 값이 절반 이하). 그 가격으로 계산한 PER도 그만큼 낮게 나와,
    지금 PER(실제 주가 ÷ 이익)과 비교하면 "과거엔 늘 더 쌌다"는 잘못된 그림이 된다.
방법:
  - scripts/data/year_end_close.json: {야후티커: {연도: [실제 연말 종가, 배당 조정 연말 종가]}}
    (워크플로 '연말 실제 종가 받기' → scripts/fetch_year_end_close.py 로그의 YEC_JSON 줄)
  - epsDecomp: peBuy·peSell = 실제 연말 종가 ÷ EPS, peMultiple·peCagr 다시 계산.
    수익률(totalCagr)·EPS는 그대로. PER 효과는 이제 배당을 뺀 순수 PER 변화.
    검증: 기존 PER × EPS(= 계산에 쓴 조정 주가)가 받은 조정 종가와 15% 넘게 다르면 그 해는 건드리지 않고 경고.
  - rows10y: peBuy 가 있는 줄에 peBuyActual = peBuy × (실제 ÷ 조정) 추가.
  - 에르메스(RMS)는 rms_actual_pe.py 가 따로 처리한다.
사용: python scripts/rolling_actual_pe.py            # 데이터가 있는 모든 롤링 JSON
      export_rolling_json.py 끝에서도 apply_all()을 불러 같은 처리를 한다.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
ROLL = ROOT / "web" / "public" / "data" / "rolling"
YEC = ROOT / "scripts" / "data" / "year_end_close.json"
NOTE = "PER은 실제 연말 종가(배당 미반영) ÷ EPS. PER 효과는 배당을 뺀 순수 PER 변화."


def cg(a: float, b: float, yrs: float = 10.0) -> float:
    return round(((b / a) ** (1 / yrs) - 1) * 100, 2)


def apply_one(out: dict, yec: dict, key: str = "") -> dict:
    # 이미 바뀐 파일(peBasis=actual)에 다시 돌려도 epsDecomp는 같은 결과, rows10y는 건드리지 않는다
    dec = out.get("epsDecomp") or []
    bad = []
    for d in dec:
        b, s = str(d["buyYear"]), str(d["sellYear"])
        if b not in yec or s not in yec or d["epsBuy"] <= 0 or d["epsSell"] <= 0:
            bad.append(d["buyYear"])
            continue
        if out.get("peBasis") != "actual":
            # 기존 PER × EPS 가 받은 조정 종가와 맞는지(같은 가격·EPS 기준인지) 확인
            imp_b, imp_s = d["peBuy"] * d["epsBuy"], d["peSell"] * d["epsSell"]
            if abs(imp_b / yec[b][1] - 1) > 0.15 or abs(imp_s / yec[s][1] - 1) > 0.15:
                print(f"  ! {key} {b}: 조정 가격 불일치 ({imp_b:.2f} vs {yec[b][1]:.2f}, {imp_s:.2f} vs {yec[s][1]:.2f}) — 건너뜀")
                bad.append(d["buyYear"])
                continue
        pb, ps = yec[b][0] / d["epsBuy"], yec[s][0] / d["epsSell"]
        d["peBuy"], d["peSell"] = round(pb, 1), round(ps, 1)
        d["peMultiple"] = round(ps / pb, 2)
        d["peCagr"] = cg(pb, ps)
    if out.get("peBasis") != "actual":
        for r in out.get("rows10y") or []:
            y = str(r.get("buyYear"))
            if r.get("peBuy") and y in yec and yec[y][1] > 0:
                r["peBuyActual"] = round(r["peBuy"] * yec[y][0] / yec[y][1], 1)
    if dec and len(bad) < len(dec):
        out["peBasis"] = "actual"
        if isinstance(out.get("epsNote"), str):
            out["epsNote"] = re.sub(r"PER은 [^.]*배당\s?조정[^.]*\.", "PER은 실제 연말 종가(배당 미반영) 기준(peNote 참고).", out["epsNote"])
        out["peNote"] = NOTE +(f" (실제 종가 없음·불일치로 그대로 둔 매수 연도: {', '.join(map(str, bad))})" if bad else "")
    if bad:
        print(f"  {key}: 그대로 둔 매수 연도 {bad}")
    return out


def apply_all(keys: list[str] | None = None) -> None:
    if not YEC.exists():
        print("year_end_close.json 없음 — 건너뜀")
        return
    yec_all = json.loads(YEC.read_text())
    for p in sorted(ROLL.glob("*_rolling.json")):
        key = p.name[: -len("_rolling.json")]
        if key == "RMS" or (keys and key not in keys):
            continue
        raw = p.read_text(encoding="utf-8")
        out = json.loads(raw)
        if not out.get("epsDecomp") or out.get("ticker") not in yec_all:
            continue
        before = [(d["buyYear"], d["peBuy"]) for d in out["epsDecomp"]]
        out = apply_one(out, yec_all[out["ticker"]], key)
        after = [(d["buyYear"], d["peBuy"]) for d in out["epsDecomp"]]
        indent = 2 if raw.startswith('{\n  "') else None
        p.write_text(json.dumps(out, ensure_ascii=False, indent=indent) + ("\n" if raw.endswith("\n") else ""), encoding="utf-8")
        ch = [f"{a[0]} {a[1]}→{b[1]}" for a, b in zip(before, after) if a[1] != b[1]]
        print(f"{key}: {len(ch)}개 바뀜  " + ", ".join(ch[:4]) + (" …" if len(ch) > 4 else ""))


if __name__ == "__main__":
    import sys
    apply_all(sys.argv[1:] or None)
