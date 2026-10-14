"""
generate_comment.py — YouTube 쇼츠 고정 댓글 생성기

sp500_corrections_history.json (mcv-nextjs)에서 해당 기간 주요 사건을 뽑아
유튜브 고정 댓글 텍스트를 출력한다.

사용법:
  python scripts/generate_comment.py --start 1971-02
  python scripts/generate_comment.py --start 2000-01 --top 5
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))

from generate_shorts import load_tqqq, simulate

CORRECTIONS_PATH = Path("D:/mcv-nextjs/public/data/sp500/sp500_corrections_history.json")
SITE_URL = "justkeepbuyingtqqq.vercel.app"

# 이 낙폭 이상만 포함 (S&P500 기준 -15% 이상)
MIN_DRAWDOWN = -15.0


def load_corrections():
    with open(CORRECTIONS_PATH, encoding="utf-8") as f:
        return json.load(f)["corrections"]


def clean_name(name_ko: str) -> str:
    """이름 끝의 '(-XX.XX%)' 패턴 제거."""
    return re.sub(r'\s*\(-?\d+\.?\d*%\)\s*$', '', name_ko).strip()


def get_events_in_range(corrections: list, start_ym: str, end_ym: str, top: int) -> list:
    """start_ym ~ end_ym 구간에서 주요 이벤트 필터링 + 중복 제거."""
    start = start_ym + "-01"
    end   = end_ym   + "-28"

    filtered = []
    for c in corrections:
        pd = c.get("peak_date", "")
        if not pd:
            continue
        if start <= pd <= end and c["drawdown_pct"] <= MIN_DRAWDOWN:
            filtered.append(c)

    # 낙폭 큰 순서 정렬
    filtered.sort(key=lambda x: x["drawdown_pct"])

    # 같은 달 이벤트 중복 제거 (낙폭 큰 것만 유지)
    seen_ym = {}
    for c in filtered:
        ym = c["peak_date"][:7]
        if ym not in seen_ym:
            seen_ym[ym] = c

    deduped = sorted(seen_ym.values(), key=lambda x: x["drawdown_pct"])
    return deduped[:top]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--start", required=True, help="시작월 YYYY-MM")
    p.add_argument("--top",   type=int, default=4, help="표시할 이벤트 수 (기본 4)")
    args = p.parse_args()

    # 시뮬레이션
    print("시뮬레이션 중...", file=sys.stderr)
    df    = load_tqqq('with_costs')
    snaps = simulate(df, args.start)

    total_days = len(snaps)
    years      = total_days / 252
    end_date   = snaps[-1]["date"]
    end_ym     = end_date.strftime("%Y-%m")
    inv_eok    = snaps[-1]["inv_krw"] / 1e8
    completed  = snaps[-1]["port_krw"] >= 1_000_000_000

    if not completed:
        print(f"※ {args.start} 시작 코호트는 아직 10억 미달성 (데이터 끝까지 {years:.1f}년)", file=sys.stderr)

    # 이벤트 필터링
    corrections = load_corrections()
    events      = get_events_in_range(corrections, args.start, end_ym, args.top)

    # ── 댓글 생성 ─────────────────────────────────────────────
    lines = []

    if completed:
        lines.append(f"📈 TQQQ 매일 20만원 적립 | {args.start} 시작 → {years:.1f}년 후 10억 달성")
    else:
        lines.append(f"📈 TQQQ 매일 20만원 적립 | {args.start} 시작 ({years:.1f}년 시뮬레이션)")

    lines.append(f"💰 투입 원금 {inv_eok:.1f}억원 · 운용보수+스왑금리 반영 · 환율 1,300원 고정")

    if events:
        lines.append("")
        lines.append(f"📅 {args.start[:4]}~{end_ym[:4]}년 사이에 있었던 일들:")
        for e in events:
            ym   = e["peak_date"][:7]
            name = clean_name(e["name_ko"])
            pct  = e["drawdown_pct"]
            lines.append(f"• {ym}  {name} ({pct:.0f}%)")

    lines.append("")
    if completed:
        lines.append("이 모든 걸 버티고 10억 달성했습니다 💰")
    lines.append(f"더 많은 진입 시점 분석 → {SITE_URL}")

    print("\n".join(lines))


if __name__ == "__main__":
    main()
