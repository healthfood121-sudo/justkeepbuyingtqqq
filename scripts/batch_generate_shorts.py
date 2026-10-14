"""
batch_generate_shorts.py

668개 시작월 전체 with_costs 쇼츠 일괄 생성.

사용법:
  python scripts/batch_generate_shorts.py            # 전체 생성 (기존 파일 건너뜀)
  python scripts/batch_generate_shorts.py --force    # 기존 파일도 덮어쓰기
  python scripts/batch_generate_shorts.py --from 2000-01  # 특정 월부터 시작
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT      = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "web/public/data/cohorts_ndx3x_10b.json"
OUT_DIR   = ROOT / "output/shorts"
SCRIPT    = ROOT / "scripts/generate_shorts.py"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--force",  action="store_true", help="기존 파일도 덮어쓰기")
    p.add_argument("--from",   dest="start_from", default=None,
                   help="이 시작월(YYYY-MM)부터 생성 (이전은 건너뜀)")
    args = p.parse_args()

    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)

    # s 필드에서 YYYY-MM 추출 (중복 제거, 순서 유지)
    seen, starts = set(), []
    for row in data["rows"]:
        ym = row["s"][:7]
        if ym not in seen:
            seen.add(ym)
            starts.append(ym)

    # --from 필터
    if args.start_from:
        if args.start_from not in starts:
            print(f"오류: {args.start_from}이 목록에 없습니다.")
            sys.exit(1)
        idx = starts.index(args.start_from)
        starts = starts[idx:]

    total   = len(starts)
    done    = 0
    skipped = 0
    failed  = []

    print(f"총 {total}개 시작월 처리 예정 (mode=with_costs)")
    print(f"출력 경로: {OUT_DIR}")
    print()

    for i, ym in enumerate(starts, 1):
        out = OUT_DIR / f"{ym}_costs.mp4"

        if out.exists() and not args.force:
            print(f"[{i:3}/{total}] SKIP  {ym}", flush=True)
            skipped += 1
            continue

        print(f"[{i:3}/{total}] 생성  {ym} ...", end=" ", flush=True)
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--start", ym, "--mode", "with_costs"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )

        if result.returncode != 0:
            err = result.stderr.strip().splitlines()
            print(f"FAIL")
            print(f"       {err[-1] if err else '(오류 없음)'}")
            failed.append(ym)
        else:
            size_mb = out.stat().st_size / 1e6
            print(f"OK  ({size_mb:.1f} MB)")
            done += 1

    print()
    print(f"완료: {done}개 생성  /  {skipped}개 건너뜀  /  {len(failed)}개 실패")
    if failed:
        print("실패 목록:", ", ".join(failed))


if __name__ == "__main__":
    main()
