"""러셀2000 구성 종목 — iShares 러셀2000 ETF(IWM)가 SEC에 내는 보유 종목 보고서(N-PORT)에서 읽는다.

N-PORT는 펀드가 분기마다 SEC에 제출하는 전체 보유 종목 공시다(분기말 기준, 약 60일 뒤 공개).
SEC 공개 자료라 누구나 받을 수 있고, 운용사 사이트 차단과 상관없다.
결과: scripts/data/russell2000.json  {"asOf", "src", "filing", "tickers": {티커: 회사명}}

GitHub Actions 'fetch-russell2000'에서 실행(SEC는 샌드박스에서 접속 불가).
"""
import json
import re
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts" / "data" / "russell2000.json"
UA = {"User-Agent": "justkeepbuyingtqqq research research@example.com"}
ETF = "IWM"


def get(url):
    for i in range(4):
        r = requests.get(url, headers=UA, timeout=90)
        if r.status_code == 200:
            return r
        print("  ", r.status_code, url, flush=True)
        time.sleep(2 * (i + 1))
    sys.exit(f"실패: {url}")


def norm(s):
    s = re.sub(r"['’.]", "", (s or "").upper())
    s = re.sub(r"[^A-Z0-9 ]", " ", s)
    s = re.sub(r"\b(INC|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|PLC|HOLDINGS?|GROUP|CLASS [A-C]|CL [A-C]|THE|NEW|LLC|LP|SA|NV|AG)\b", " ", s)
    return " ".join(s.split())


def main():
    # 1) ETF 티커 → SEC 시리즈 번호
    mf = get("https://www.sec.gov/files/company_tickers_mf.json").json()
    f = mf["fields"]
    row = next(dict(zip(f, d)) for d in mf["data"] if d[f.index("symbol")] == ETF)
    cik, series = int(row["cik"]), row["seriesId"]
    print("IWM", cik, series, flush=True)

    # 2) 그 시리즈의 최근 N-PORT 공시
    atom = get(f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={series}&type=NPORT-P"
               "&dateb=&owner=include&count=10&output=atom").text
    accs = re.findall(r"<accession-number>([\d-]+)</accession-number>", atom)
    if not accs:
        accs = re.findall(r"accession-nunber>([\d-]+)<", atom)  # SEC atom 오타 대비
    if not accs:
        sys.exit("N-PORT 공시를 못 찾음")
    acc = accs[0]
    url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/primary_doc.xml"
    print("filing", acc, url, flush=True)
    xml = get(url).content

    # 3) 보유 종목 파싱 (네임스페이스 무시)
    root = ET.fromstring(xml)
    for el in root.iter():
        el.tag = el.tag.split("}")[-1]
    asof = (root.findtext(".//repPdDate") or "").strip()
    secs = root.findall(".//invstOrSec")
    print("holdings", len(secs), "asOf", asof, flush=True)

    # 이름 → 티커 보조표(N-PORT에 티커가 빠진 종목용)
    ct = get("https://www.sec.gov/files/company_tickers.json").json().values()
    by_name = {}
    for c in ct:
        by_name.setdefault(norm(c["title"]), c["ticker"].upper())

    eq = []
    for s in secs:
        if (s.findtext("assetCat") or "") != "EC":  # 주식만(현금·선물·채권 제외)
            continue
        name = (s.findtext("name") or s.findtext("title") or "").strip()
        t = s.find(".//identifiers/ticker")
        tk = (t.get("value") or "").strip().upper() if t is not None else ""
        eq.append((name, (s.findtext("cusip") or "").strip(), tk))
    print("equities", len(eq), "보고서에 티커 있음", sum(1 for e in eq if e[2]), flush=True)

    # 티커가 빠진 종목: CUSIP → 티커 (OpenFIGI 공개 변환 API, 키 없이 분당 25회·요청당 10개)
    need = sorted({c for _, c, tk in eq if not tk and c and c != "000000000"})
    figi = {}
    for i in range(0, len(need), 10):
        chunk = need[i:i + 10]
        body = [{"idType": "ID_CUSIP", "idValue": c, "exchCode": "US"} for c in chunk]
        for _ in range(3):
            r = requests.post("https://api.openfigi.com/v3/mapping", json=body, timeout=60)
            if r.status_code == 429:
                time.sleep(30)
                continue
            break
        if r.status_code == 200:
            for c, res in zip(chunk, r.json()):
                d = (res.get("data") or [{}])[0]
                if d.get("ticker"):
                    figi[c] = d["ticker"].upper()
        else:
            print("  openfigi", r.status_code, flush=True)
        time.sleep(2.6)
    print("openfigi", len(figi), "/", len(need), flush=True)

    out, miss = {}, []
    for name, cusip, tk in eq:
        tk = tk or figi.get(cusip) or by_name.get(norm(name))
        if not tk:
            miss.append(name)
            continue
        out[tk.replace("/", "-").replace(".", "-").replace(" ", "-")] = name

    print("stocks", len(out), "ticker 못 찾음", len(miss), miss[:20], flush=True)
    if len(out) < 1500:
        sys.exit("종목 수가 너무 적음 — 저장 안 함")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "asOf": asof,
        "src": f"iShares 러셀2000 ETF(IWM) SEC 보유 종목 보고서(N-PORT, {asof} 기준)",
        "filing": acc,
        "missing": miss,
        "tickers": dict(sorted(out.items())),
    }, ensure_ascii=False, indent=0))
    print("saved", OUT, flush=True)


if __name__ == "__main__":
    main()
