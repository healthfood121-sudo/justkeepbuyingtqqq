"""에르메스 분기·반기·연간 매출 보도자료를 AMF 공개 데이터(echanges.dila.gouv.fr/OPENDATA/AMF/MKW)에서 찾아 텍스트로 저장.
샌드박스에서는 접속 불가 → GitHub Actions에서 실행.
월별 목록에서 예상 발표일에 가까운 날짜부터 PDF를 받아, 에르메스 영문 매출 보도자료(지역별 표 포함)를 찾으면 그 발표는 끝.
결과: scripts/data/hermes_releases/amf_{YYYYMMDD}_{종류}.txt, amf_found.txt
"""
import re, subprocess, tempfile, time
from datetime import date, timedelta
from pathlib import Path
import requests

OUT = Path(__file__).resolve().parent / "data" / "hermes_releases"; OUT.mkdir(parents=True, exist_ok=True)
B = "https://echanges.dila.gouv.fr/OPENDATA/AMF/MKW"
S = requests.Session(); S.headers["User-Agent"] = "Mozilla/5.0"
# 예상 발표일 (틀려도 ±14일 안에서 찾음)
GUESS = {
    "FY": ["2019-02-20", "2020-02-19", "2021-02-19", "2022-02-18", "2023-02-17", "2024-02-09", "2025-02-14", "2026-02-12"],
    "Q1": ["2019-04-25", "2020-04-23", "2021-04-22", "2022-04-22", "2023-04-14", "2024-04-25", "2025-04-16", "2026-04-15"],
    "H1": ["2019-07-30", "2020-07-30", "2021-07-29", "2022-07-28", "2023-07-28", "2024-07-25", "2025-07-30"],
    "Q3": ["2019-10-18", "2020-10-23", "2021-10-21", "2022-10-21", "2023-10-20", "2024-10-24", "2025-10-22"],
}
listing = {}
def files_on(d):
    key = (d.year, d.month)
    if key not in listing:
        r = S.get(f"{B}/{d.year}/{d.month:02d}/", timeout=60)
        listing[key] = re.findall(r'href="(FCMKW\d+_(\d{8})\.pdf)"', r.text) if r.ok else []
    ds = d.strftime("%Y%m%d")
    return [f for f, dd in listing[key] if dd == ds]

def text_of(url, first=None):
    r = S.get(url, timeout=90)
    if not r.ok or not r.content.startswith(b"%PDF"): return ""
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "a.pdf"; p.write_bytes(r.content)
        args = ["pdftotext", "-layout"] + (["-l", str(first)] if first else []) + [str(p), "-"]
        return subprocess.run(args, capture_output=True, text=True).stdout

found, log = [], []
for kind, ds in GUESS.items():
    for g in ds:
        g = date.fromisoformat(g); hit = None
        for off in [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10, 11, -11, 12, -12, 13, -13, 14, -14]:
            d = g + timedelta(days=off)
            for f in files_on(d):
                u = f"{B}/{d.year}/{d.month:02d}/{f}"
                t = text_of(u, first=2)
                if re.search(r"herm[eè]s", t, re.I) and re.search(r"revenue|results", t, re.I) and not re.search(r"chiffre d.affaires|résultats", t[:600], re.I):
                    full = text_of(u)
                    if "GEOGRAPHICAL AREA" in full.upper() and "In millions of" in full:
                        hit = (d, f, full); break
                time.sleep(0.05)
            if hit: break
        if hit:
            d, f, full = hit
            (OUT / f"amf_{d:%Y%m%d}_{kind}.txt").write_text(full)
            found.append(f"{kind} {d} {f}"); print("FOUND", kind, d, f, flush=True)
        else:
            found.append(f"{kind} {g} 못 찾음"); print("MISS", kind, g, flush=True)
(OUT / "amf_found.txt").write_text("\n".join(found))
