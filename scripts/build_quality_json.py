"""
build_quality_json.py — 기업별 정성 평가(scripts/data/quality/quality.tsv) → 웹용 JSON

평가 항목(1~5점): 해자(경쟁우위), 가격결정력, 수익성(이익의 질), 성장성, 지속가능성
등급: A 위대한 기업 / B 좋은 기업 / C 보통 / D 주의 — 점수에서 규칙으로 계산(grade_of)
작성: Claude 정성 평가 (2026년 지식 기준), 숫자 데이터와 별개

출력: web/public/data/fundamentals/_quality.json
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "scripts" / "data" / "quality" / "quality.tsv"
OUT = ROOT / "web" / "public" / "data" / "fundamentals" / "_quality.json"

def grade_of(moat, price, prof, growth, dur):
    """등급은 다섯 점수에서 규칙으로 정한다(점수는 정성 평가).
    A: 합계 22 이상, 또는 합계 19 이상이면서 해자 4 이상·지속성 4 이상
    B: 합계 16 이상
    D: 합계 9 이하, 또는 합계 11 이하이면서 지속성 2 이하
    C: 나머지
    """
    s = moat + price + prof + growth + dur
    if s >= 22 or (s >= 19 and moat >= 4 and dur >= 4): return "A"
    if s >= 16: return "B"
    if s <= 9 or (s <= 11 and dur <= 2): return "D"
    return "C"

out = {}
for line in SRC.read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"):
        continue
    k, moat, price, prof, growth, dur, _grade, biz, strength, risk = line.split("|")
    grade = grade_of(int(moat), int(price), int(prof), int(growth), int(dur))
    out[k] = {
        "moat": int(moat), "pricing": int(price), "profit": int(prof),
        "growth": int(growth), "durability": int(dur), "grade": grade,
        "business": biz, "strength": strength, "risk": risk,
    }
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"asOf": "2026-10", "stocks": out}, ensure_ascii=False, separators=(",", ":")))
print(f"{len(out)}개 → {OUT}")
