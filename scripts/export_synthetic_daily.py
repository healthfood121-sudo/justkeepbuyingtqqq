"""
export_synthetic_daily.py

일별 합성 가격 원본 데이터를 JSON으로 export.
  - NDX 스플라이스 보정 후 원지수
  - TQQQ / QLD / 나스닥100 합성가격 (with_costs, 초기=100)
  - 연방기금금리 연율(%)

출력: web/public/data/synthetic_daily.json
실행: python scripts/export_synthetic_daily.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from data_loader import load_ndx_prices  # noqa: E402

OUT_PATH = ROOT / "web/public/data/synthetic_daily.json"


def main():
    d = load_ndx_prices("with_costs")
    dates      = d["dates"]
    n          = len(dates)
    date_strs  = [dt.strftime("%Y-%m-%d") for dt in dates]

    fed_monthly = d["fed_monthly"]
    fed_annual  = [
        round(fed_monthly.get(dt.strftime("%Y-%m"), 3.0), 4)
        for dt in dates
    ]

    out = {
        "note": (
            "합성가격 계산: "
            "TQQQ = (1 + 3×r − 2×(FFR+0.5%)/252)×(1 − 0.88%/252) 누적곱 × 100, "
            "QLD = (1 + 2×r − 1×(FFR+0.5%)/252)×(1 − 0.95%/252) 누적곱 × 100, "
            "나스닥100 = (1 + r)×(1 − 0.20%/252) 누적곱 × 100. "
            "r = NDX 일별 수익률(스플라이스 보정 후). "
            "FFR = 연방기금금리 연율. "
            "스왑 스프레드 0.50% 근거: JPMorgan 424B2."
        ),
        "meta": {
            "from":         date_strs[0],
            "to":           date_strs[-1],
            "rows":         n,
            "tqqq_exp":     0.0088,
            "qld_exp":      0.0095,
            "qqq_exp":      0.0020,
            "swap_spread":  0.005,
            "base":         100,
        },
        "d":    date_strs,
        "ndx":  [round(float(x), 2) for x in d["closes"]],
        "tqqq": [round(float(x), 4) for x in d["ndx3x"]],
        "qld":  [round(float(x), 4) for x in d["ndx2x"]],
        "qqq":  [round(float(x), 4) for x in d["ndx1x"]],
        "fed":  fed_annual,
    }

    OUT_PATH.write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"→ {OUT_PATH.relative_to(ROOT)}  ({size_kb:.0f} KB, {n}행)")
    print(f"  기간:       {date_strs[0]} ~ {date_strs[-1]}")
    print(f"  TQQQ 최종:  {d['ndx3x'][-1]:.2f}  (초기 100 기준)")
    print(f"  QLD  최종:  {d['ndx2x'][-1]:.2f}")
    print(f"  NDX100 최종:{d['ndx1x'][-1]:.2f}")


if __name__ == "__main__":
    main()
