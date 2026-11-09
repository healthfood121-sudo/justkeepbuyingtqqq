"""SEC EDGAR에서 실적 발표문(8-K, 항목 2.02의 보도자료 첨부)을 모두 받아 텍스트로 로그에 출력한다(조사용, 커밋 없음).
사용: python scripts/fetch_sec_releases.py COCO [최대 개수]
컨퍼런스콜 녹취록을 구할 수 없는 옛 분기를 회사 공식 숫자·경영진 발언으로 채울 때 쓴다."""
import html, re, sys, time
import requests

UA = {'User-Agent': 'justkeepbuyingtqqq research research@example.com'}

def get(u):
    for i in range(3):
        r = requests.get(u, headers=UA, timeout=60)
        if r.status_code == 200:
            return r
        time.sleep(2 * (i + 1))
    print('  실패', r.status_code, u, flush=True)
    return None

def text(h):
    h = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'</(p|div|tr|li|h\d)>', '\n', h, flags=re.I)
    h = re.sub(r'<br\s*/?>', '\n', h, flags=re.I)
    h = re.sub(r'<[^>]+>', ' ', h)
    h = html.unescape(h).replace('\xa0', ' ')
    h = re.sub(r'[ \t]+', ' ', h)
    return re.sub(r'\n\s*\n+', '\n', h).strip()

t = sys.argv[1].upper()
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 40
tick = get('https://www.sec.gov/files/company_tickers.json').json()
cik = next(int(v['cik_str']) for v in tick.values() if v['ticker'].upper() == t)
sub = get(f'https://data.sec.gov/submissions/CIK{cik:010d}.json').json()
rec = sub['filings']['recent']
rows = [(rec['filingDate'][i], rec['accessionNumber'][i]) for i in range(len(rec['form']))
        if rec['form'][i] == '8-K' and '2.02' in (rec.get('items') or [''] * 9999)[i]]
rows = sorted(rows)[-limit:]
print(t, cik, '실적 8-K', len(rows), flush=True)
for date, acc in rows:
    base = f'https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace("-", "")}/'
    idx = get(base + 'index.json')
    if not idx:
        continue
    names = [it['name'] for it in idx.json()['directory']['item']]
    pick = [n for n in names if n.lower().endswith(('.htm', '.html')) and re.search(r'ex.?99|99\.?1|press|release', n, re.I)]
    if not pick:
        # 보도자료를 별도 첨부로 두지 않는 회사(ADP 등): 공시 원문 전체(.txt)에서 EX-99 부분을 읽는다
        full = [n for n in names if n.endswith('.txt') and n.startswith(acc)]
        if not full:
            print('  첨부 못 찾음', date, names[:10]); continue
        pick = full
    r = get(base + pick[0])
    if not r:
        continue
    raw = r.text
    if pick[0].endswith('.txt'):
        m = re.search(r'<TYPE>EX-99.*?</DOCUMENT>', raw, re.S)
        raw = m.group(0) if m else raw
    tx = text(raw)
    print(f'\n######## {t}_{date}\n  URL {base + pick[0]}\n<<<BEGIN {t}_{date}>>>\n{tx[:14000]}\n<<<END {t}_{date}>>>', flush=True)
    time.sleep(0.5)
