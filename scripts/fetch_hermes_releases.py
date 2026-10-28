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

pages = ["https://finance.hermes.com/en/", "https://finance.hermes.com/en/publications/", "https://finance.hermes.com/en/press-releases/",
         "https://finance.hermes.com/en/financial-information/", "https://finance.hermes.com/en/regulated-information/",
         "https://finance.hermes.com/en/publications/press-releases/"]
for y in range(2019, 2027):
    pages += [f"https://finance.hermes.com/en/publications/?year={y}", f"https://finance.hermes.com/en/press-releases/?year={y}"]
for pg in range(0, 12):
    pages += [f"https://finance.hermes.com/en/publications/?page={pg}", f"https://finance.hermes.com/en/press-releases/?page={pg}"]
for u in pages:
    r = get(u)
    if r is not None and r.ok:
        harvest(r.text)
        for m in re.findall(r'href="(/en/[^"]*(?:press|publication|revenue|result)[^"]*)"', r.text)[:200]:
            pages.append("https://finance.hermes.com" + m) if len(pages) < 400 and ("https://finance.hermes.com" + m) not in pages else None
    time.sleep(0.5)

# 검색엔진 보조
qs = []
for y in range(2019, 2027):
    for k in ["first quarter revenue", "half-year results", "third quarter revenue", "full-year results", "revenue q1", "revenue q3", "results h1", "results fy"]:
        qs.append(f"site:assets-finance.hermes.com hermes {y} {k} pdf")
for q in qs:
    for base in ["https://html.duckduckgo.com/html/?q=", "https://www.bing.com/search?q="]:
        r = get(base + urllib.parse.quote(q))
        if r is not None and r.ok: harvest(r.text)
        time.sleep(1.0)

(OUT / "links.txt").write_text("\n".join(sorted(links)))
want = re.compile(r'hermes_(20(19|2\d)\d{4})_.*(revenue|results|ca_|chiffre|resultats).*_en\.pdf', re.I)
got = 0
for u in sorted(links):
    name = urllib.parse.urlparse(u).path.rsplit("/", 1)[-1]
    if not want.search(name): continue
    dst = OUT / (name[:-4] + ".txt")
    if dst.exists(): continue
    r = get(u)
    if r is None or not r.ok or not r.content.startswith(b"%PDF"): continue
    pdf = OUT / name; pdf.write_bytes(r.content)
    subprocess.run(["pdftotext", "-layout", str(pdf), str(dst)], check=False); pdf.unlink(); got += 1
(OUT / "probe.txt").write_text("\n".join(probe))
print("links", len(links), "downloaded", got)
