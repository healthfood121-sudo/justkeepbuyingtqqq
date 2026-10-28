"""에르메스 분기·연간 매출 보도자료(PDF) 수집 → 텍스트 저장 (GitHub Actions 전용, 샌드박스는 접속 불가).
1) finance.hermes.com 발표 목록 페이지와 검색엔진(HTML)에서 assets-finance.hermes.com PDF 링크를 모은다.
2) 2019~2026 매출·실적 보도자료(영문)를 받아 pdftotext -layout으로 텍스트화.
결과: scripts/data/hermes_releases/{파일명}.txt, links.txt, probe.txt(디버그)
"""
import re, subprocess, time, urllib.parse
from pathlib import Path
import requests

OUT = Path(__file__).resolve().parent / "data" / "hermes_releases"; OUT.mkdir(parents=True, exist_ok=True)
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
     "Accept-Language": "en-US,en;q=0.9"}
PDF = re.compile(r'https?://assets-finance\.hermes\.com/[^"\'\s<>)]+?\.pdf(?:\?[^"\'\s<>)]*)?', re.I)
REL = re.compile(r'(/s3fs-public/[^"\'\s<>)]+?\.pdf(?:\?[^"\'\s<>)]*)?)', re.I)
links, probe = set(), []

def get(url, **kw):
    try:
        r = requests.get(url, headers=H, timeout=40, **kw); probe.append(f"{r.status_code} {len(r.content)} {url}"); return r
    except Exception as e:
        probe.append(f"ERR {e} {url}"); return None

def harvest(text):
    t = urllib.parse.unquote(text.replace("\\/", "/"))
    for m in PDF.findall(t): links.add(m.replace("&amp;", "&"))
    for m in REL.findall(t): links.add("https://assets-finance.hermes.com" + m.replace("&amp;", "&"))

pages = ["https://finance.hermes.com/en/press-releases-and-news", "https://finance.hermes.com/en/regulated-information/"]
pages += [f"https://finance.hermes.com/en/press-releases-and-news?page={i}" for i in range(1, 60)]
pages += [f"https://finance.hermes.com/en/regulated-information?page={i}" for i in range(1, 30)]
for y in range(2019, 2027):
    for sl in [f"first-quarter-{y}-revenue", f"{y}-first-quarter-revenue", f"q1-{y}-revenue", f"revenue-first-quarter-{y}",
               f"first-half-{y}-results", f"{y}-first-half-results", f"{y}-half-year-results", f"half-year-{y}-results", f"h1-{y}-results",
               f"third-quarter-{y}-revenue", f"{y}-third-quarter-revenue", f"q3-{y}-revenue", f"revenue-third-quarter-{y}",
               f"{y}-full-year-results", f"full-year-{y}-results", f"{y}-annual-results", f"annual-results-{y}"]:
        pages.append(f"https://finance.hermes.com/en/publications/{sl}")
seen = set(); k = 0
while k < len(pages) and k < 700:
    u = pages[k]; k += 1
    if u in seen: continue
    seen.add(u)
    r = get(u)
    if r is None or not r.ok: continue
    harvest(r.text)
    for m in re.findall(r'href="(/en/publications/[^"?#]+)"', r.text):
        if re.search(r'revenue|result|quarter|half|annual|sales', m) and "https://finance.hermes.com" + m not in seen:
            pages.append("https://finance.hermes.com" + m)
    time.sleep(0.3)

(OUT / "links.txt").write_text("\n".join(sorted(links)))
want = re.compile(r'(revenue|result|firsthalf|fullyear|q1|q3|h1)', re.I)
skip = re.compile(r'(_fr\.pdf|_vf\.pdf|-fr\.pdf|voting|liquidity|urd|rfs|presentation)', re.I)
got = 0
for u in sorted(links):
    name = urllib.parse.urlparse(u).path.rsplit("/", 1)[-1]
    if not want.search(name) or skip.search(name): continue
    dst = OUT / (name[:-4] + ".txt")
    if dst.exists(): continue
    r = get(u)
    if r is None or not r.ok or not r.content.startswith(b"%PDF"): continue
    pdf = OUT / name; pdf.write_bytes(r.content)
    subprocess.run(["pdftotext", "-layout", str(pdf), str(dst)], check=False); pdf.unlink(); got += 1
(OUT / "probe.txt").write_text("\n".join(probe))
print("links", len(links), "downloaded", got)
