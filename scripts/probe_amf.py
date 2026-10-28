"""AMF 공개 데이터(echanges.dila.gouv.fr) 구조 확인용 — 에르메스 보도자료 찾기 1단계."""
import requests, subprocess
from pathlib import Path
OUT = Path(__file__).resolve().parent / "data" / "hermes_releases"; OUT.mkdir(parents=True, exist_ok=True)
H = {"User-Agent": "Mozilla/5.0"}
log = []
B = "https://echanges.dila.gouv.fr/OPENDATA/AMF/MKW/2024/07/"
r = requests.get(B, headers=H, timeout=60); log.append(f"{r.status_code} {len(r.content)} {B}")
(OUT / "amf_listing_2024_07.html").write_text(r.text[:200000])
for nm in ["FCMKW113362_20240725.pdf", "FCMKW113362_20240725.xml", "FCMKW113362_20240725.zip"]:
    r = requests.get(B + nm, headers=H, timeout=60); log.append(f"{r.status_code} {len(r.content)} {r.headers.get('content-type')} {nm}")
    if r.ok and nm.endswith(".pdf"):
        (OUT / "amf.pdf").write_bytes(r.content); subprocess.run(["pdftotext", "-layout", str(OUT / "amf.pdf"), str(OUT / "amf_FCMKW113362.txt")]); (OUT / "amf.pdf").unlink()
    elif r.ok:
        (OUT / ("amf_" + nm + ".txt")).write_bytes(r.content[:50000])
for u in ["https://echanges.dila.gouv.fr/OPENDATA/AMF/", "https://echanges.dila.gouv.fr/OPENDATA/AMF/MKW/", "https://echanges.dila.gouv.fr/OPENDATA/AMF/MKW/2024/"]:
    r = requests.get(u, headers=H, timeout=60); log.append(f"{r.status_code} {len(r.content)} {u}"); (OUT / ("amf_idx_" + u.rstrip('/').rsplit('/',1)[-1] + ".html")).write_text(r.text[:30000])
(OUT / "amf_probe.txt").write_text("\n".join(log)); print("\n".join(log))
