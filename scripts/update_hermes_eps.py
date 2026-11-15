"""update_hermes_eps.py — 에르메스 최근 1년 주당이익(EPS)을 실적 보도자료에서 읽어 자동 갱신.

1) (FETCH=1일 때) 연간 실적(2월)·반기 실적(7월) 발표 무렵이면, 아직 없는 보도자료를 프랑스 금융감독원(AMF) 공개 데이터에서 찾아
   scripts/data/hermes_releases/amf_{YYYYMMDD}_{FY|H1}.txt 로 저장 (pdftotext 필요 — GitHub Actions에서 실행).
2) 저장된 연간·반기 실적 보도자료의 "Basic earnings per share" 줄을 읽어 최근 1년 EPS를 계산.
   - 최신이 연간(Y년):  최근 1년 = Y년 연간 EPS
   - 최신이 반기(Y년):  최근 1년 = (Y-1)년 연간 − (Y-1)년 상반기 + Y년 상반기
3) web/app/private/reports/hermesEps.json 에 저장. 직전 값과 25% 넘게 다르거나 읽기에 실패하면 바꾸지 않고
   alert 파일(scripts/data/hermes_eps_alert.txt)을 남긴다 → 워크플로가 GitHub 이슈로 알림.
실행: python scripts/update_hermes_eps.py   (FETCH=1 이면 1번도)
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REL = ROOT / 'scripts' / 'data' / 'hermes_releases'
OUT = ROOT / 'web' / 'app' / 'private' / 'reports' / 'hermesEps.json'
ALERT = ROOT / 'scripts' / 'data' / 'hermes_eps_alert.txt'
B = 'https://echanges.dila.gouv.fr/OPENDATA/AMF/MKW'
# 발표 무렵 창: (종류, 시작 월·일, 끝 월·일, 예상일)
WINDOWS = [('FY', (2, 1), (3, 15), (2, 13)), ('H1', (7, 15), (8, 20), (7, 29))]


def num(s: str) -> float:
    return float(s.replace(',', '.'))


def eps_line(text: str):
    """'Basic earnings per share (in euros)  21.36  32.20  15.69' → [21.36, 32.20, 15.69]"""
    m = re.search(r'Basic earnings per share[^\n]*?((?:\s+-?\d+[.,]\d+)+)', text)
    return [num(x) for x in re.findall(r'-?\d+[.,]\d+', m.group(1))] if m else []


def releases():
    """{(kind, year): (date, [값들], 파일명)} — 연간(FY)·반기(H1) 실적 보도자료만"""
    out = {}
    for f in sorted(REL.glob('*.txt')):
        m = re.search(r'(20\d{2})(\d{2})(\d{2})', f.name)
        if not m:
            continue
        t = f.read_text(errors='ignore')
        vals = eps_line(t)
        if not vals:
            continue
        d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        if d.month <= 4:
            kind, year = 'FY', d.year - 1      # 2월 발표 = 전년도 연간
        elif 6 <= d.month <= 9:
            kind, year = 'H1', d.year          # 7월 발표 = 그해 상반기
        else:
            continue
        out[(kind, year)] = (d, vals, f.name)
    return out


def fetch_recent(today: date, have: dict):
    import requests
    S = requests.Session()
    S.headers['User-Agent'] = 'Mozilla/5.0'
    listing = {}

    def files_on(d):
        key = (d.year, d.month)
        if key not in listing:
            r = S.get(f'{B}/{d.year}/{d.month:02d}/', timeout=60)
            listing[key] = re.findall(r'href="(FCMKW\d+_(\d{8})\.pdf)"', r.text) if r.ok else []
        ds = d.strftime('%Y%m%d')
        return [f for f, dd in listing[key] if dd == ds]

    def text_of(url, first=None):
        r = S.get(url, timeout=90)
        if not r.ok or not r.content.startswith(b'%PDF'):
            return ''
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / 'a.pdf'
            p.write_bytes(r.content)
            args = ['pdftotext', '-layout'] + (['-l', str(first)] if first else []) + [str(p), '-']
            return subprocess.run(args, capture_output=True, text=True).stdout

    for kind, (m0, d0), (m1, d1), (mg, dg) in WINDOWS:
        start, end, guess = date(today.year, m0, d0), date(today.year, m1, d1), date(today.year, mg, dg)
        year = today.year - 1 if kind == 'FY' else today.year
        if today < start or ((kind, year) in have and os.environ.get('REFETCH') != '1'):
            continue
        last = min(today, end)
        days = sorted((start + timedelta(n) for n in range((last - start).days + 1)), key=lambda d: abs((d - guess).days))
        print(f'찾기 {kind} {year}: {start}~{last}', flush=True)
        for d in days:
            for f in files_on(d):
                u = f'{B}/{d.year}/{d.month:02d}/{f}'
                t = text_of(u, first=2)
                if re.search(r'herm[eè]s', t, re.I) and re.search(r'results', t, re.I) and not re.search(r'résultats', t[:600], re.I):
                    full = text_of(u)
                    if eps_line(full):
                        (REL / f'amf_{d:%Y%m%d}_{kind}.txt').write_text(full)
                        print('FOUND', kind, d, f, flush=True)
                        break
                time.sleep(0.05)
            else:
                continue
            break
        else:
            print('아직 없음', kind, year, flush=True)


def main():
    REL.mkdir(parents=True, exist_ok=True)
    today = date.fromisoformat(os.environ['TODAY']) if os.environ.get('TODAY') else date.today()  # 시험용: 날짜를 바꿔 발표 무렵을 흉내
    if os.environ.get('FETCH') == '1':
        try:
            fetch_recent(today, releases())
        except Exception as e:  # 받기 실패는 계산을 막지 않는다
            print('받기 실패', e, flush=True)
    rel = releases()
    fy = {y: v for (k, y), v in rel.items() if k == 'FY'}
    h1 = {y: v for (k, y), v in rel.items() if k == 'H1'}
    latest = max(rel.items(), key=lambda kv: kv[1][0]) if rel else None
    prev = json.loads(OUT.read_text()) if OUT.exists() else None
    alert = None
    res = None
    if not latest:
        alert = '실적 보도자료에서 주당이익을 하나도 읽지 못했다.'
    else:
        (kind, year), (d, vals, fname) = latest
        if kind == 'FY':
            res = {'ttm': round(vals[0], 2), 'basis': f'{year}년 연간', 'parts': {f'{year}년 연간': vals[0]}}
        else:
            h1_now, h1_prev = vals[0], vals[-1]
            if (year - 1) in fy:
                fy_prev = fy[year - 1][1][0]
                res = {'ttm': round(fy_prev - h1_prev + h1_now, 2), 'basis': f'{year - 1}년 연간 − {year - 1}년 상반기 + {year}년 상반기',
                       'parts': {f'{year - 1}년 연간': fy_prev, f'{year - 1}년 상반기': h1_prev, f'{year}년 상반기': h1_now}}
            else:
                alert = f'{year}년 반기 보도자료는 있는데 {year - 1}년 연간 보도자료가 없다.'
        if res:
            res.update({'asOf': d.isoformat(), 'source': fname, 'updated': today.isoformat()})
            if prev and abs(res['ttm'] / prev['ttm'] - 1) > 0.25:
                alert = f"새 값 {res['ttm']}이 직전 {prev['ttm']}과 25% 넘게 달라 바꾸지 않았다({res['basis']}, {fname})."
                res = None
    if res and (not prev or prev.get('ttm') != res['ttm'] or prev.get('asOf') != res['asOf']):
        OUT.write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n')
        print('갱신', res, flush=True)
    elif res:
        print('그대로', res['ttm'], res['basis'], flush=True)
    if alert:
        ALERT.write_text(alert + '\n')
        print('ALERT', alert, flush=True)
    elif ALERT.exists():
        ALERT.unlink()


if __name__ == '__main__':
    sys.exit(main())
