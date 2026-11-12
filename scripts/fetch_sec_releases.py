"""SEC EDGAR에서 실적 발표문(8-K, 항목 2.02의 보도자료 첨부)을 모두 받아 텍스트로 로그에 출력한다(조사용, 커밋 없음).
사용: python scripts/fetch_sec_releases.py COCO [최대 개수]
     python scripts/fetch_sec_releases.py GOOGL 13F   ← 최신 13F 보유 종목과 지분율
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
tick = get('https://www.sec.gov/files/company_tickers.json').json()
cik = next(int(v['cik_str']) for v in tick.values() if v['ticker'].upper() == t)

# 두 번째 값이 13F면: 그 회사가 낸 최신 13F 보유 종목 표 + 각 종목의 발행 주식 수(지분율 계산용)를 출력하고 끝낸다
if len(sys.argv) > 2 and sys.argv[2].upper() == '13F':
    sub = get(f'https://data.sec.gov/submissions/CIK{cik:010d}.json').json()
    rec = sub['filings']['recent']
    fil = [(rec['filingDate'][i], rec['accessionNumber'][i], rec['reportDate'][i]) for i in range(len(rec['form'])) if rec['form'][i] == '13F-HR']
    date, acc, period = sorted(fil)[-1]
    base = f'https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace("-", "")}/'
    names = [it['name'] for it in get(base + 'index.json').json()['directory']['item']]
    xmlname = next(n for n in names if n.lower().endswith('.xml') and 'primary' not in n.lower())
    xml = get(base + xmlname).text
    print(t, '13F', date, '기준일', period, base + xmlname, flush=True)
    titles = {v['title'].upper(): int(v['cik_str']) for v in tick.values()}
    tick_of = {int(v['cik_str']): v['ticker'] for v in tick.values()}
    for blk in re.findall(r'<(?:\w+:)?infoTable>(.*?)</(?:\w+:)?infoTable>', xml, re.S):
        f = lambda k: (re.search(rf'<(?:\w+:)?{k}>(.*?)</(?:\w+:)?{k}>', blk, re.S) or [None, ''])[1].strip()
        name, cls, cusip, val, sh = f('nameOfIssuer'), f('titleOfClass'), f('cusip'), f('value'), f('sshPrnamt')
        key = name.upper().replace('.', '').replace(',', '')
        c = next((ck for tt, ck in titles.items() if tt.replace('.', '').replace(',', '').startswith(key[:18])), None)
        out = ''
        if c:
            cands = []  # (기준일, 주식 수, 출처) — 여러 SEC 숫자 중 가장 최근 것을 쓴다
            for tax, con in [('dei', 'EntityCommonStockSharesOutstanding'), ('us-gaap', 'CommonStockSharesOutstanding'), ('us-gaap', 'WeightedAverageNumberOfSharesOutstandingBasic')]:
                r = requests.get(f'https://data.sec.gov/api/xbrl/companyconcept/CIK{c:010d}/{tax}/{con}.json', headers=UA, timeout=60)
                time.sleep(0.2)
                if r.status_code != 200:
                    continue
                pts = [x for u in r.json().get('units', {}).values() for x in u if x.get('form') in ('10-Q', '10-K', '20-F', '6-K', '10-K/A', '10-Q/A', 'S-1', 'S-1/A', '424B4')]
                if not pts:
                    continue
                end = max(x['end'] for x in pts)
                same = [x for x in pts if x['end'] == end]
                accn = same[-1]['accn']
                tot = sum(x['val'] for x in same if x['accn'] == accn) if tax == 'dei' else max(x['val'] for x in same)
                cands.append((end, tot, con))
            if cands:
                end, tot, con = sorted(cands)[-1]
                out = f"발행주식 {tot} ({end}, {con}) 지분율 {int(sh) / tot * 100:.2f}%"
        print(f'ROW|{name}|{cls}|{cusip}|{tick_of.get(c, "")}|{val}|{sh}|{out}', flush=True)
    sys.exit(0)

limit = int(sys.argv[2]) if len(sys.argv) > 2 else 40
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
