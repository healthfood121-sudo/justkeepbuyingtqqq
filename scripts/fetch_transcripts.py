"""최근 실적 발표 컨퍼런스콜 녹취록(Motley Fool)을 찾아 텍스트로 로그에 출력한다 (조사용, 커밋 없음).
사용: python scripts/fetch_transcripts.py ROL ADBE ...   또는  ROL=https://www.fool.com/earnings/call-transcripts/...
녹취록 원문은 저작권 때문에 저장소에 넣지 않고 로그로만 본다."""
import re, sys, time, html
import requests

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'}
S = requests.Session(); S.headers.update(UA)

def get(u):
    try:
        r = S.get(u, timeout=60)
        return r.status_code, r.text
    except Exception as e:
        return 0, str(e)

def find_url(t):
    tl = t.lower().replace('-', '.')
    for ex in ('nasdaq', 'nyse'):
        code, txt = get(f'https://www.fool.com/quote/{ex}/{tl}/')
        print(f'  quote {ex} {code} {len(txt)}', flush=True)
        if code != 200: continue
        links = set(re.findall(r'/earnings/call-transcripts/\d{4}/\d{2}/\d{2}/[a-z0-9\-]+/', txt))
        if links:
            return 'https://www.fool.com' + sorted(links, key=lambda x: x.split('/')[3:6])[-1]
    return None

def text_of(page):
    m = re.search(r'<div[^>]+class="[^"]*article-body[^"]*"[^>]*>(.*?)</article>', page, re.S) or re.search(r'<article.*?</article>', page, re.S)
    body = m.group(0) if m else page
    body = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', body, flags=re.S)
    body = re.sub(r'</(p|h\d|li|div)>', '\n', body)
    body = re.sub(r'<[^>]+>', '', body)
    body = html.unescape(body)
    return re.sub(r'\n\s*\n+', '\n', body).strip()

for a in sys.argv[1:]:
    key, url = (a.split('=', 1) + [None])[:2]
    print(f'\n######## {key}', flush=True)
    url = url or find_url(key)
    if not url:
        print('  녹취록 주소를 못 찾음'); continue
    code, page = get(url)
    print(f'  URL {url} -> {code} {len(page)}')
    if code == 200:
        t = text_of(page)
        print(f'  TEXT {len(t)} chars\n<<<BEGIN {key}>>>\n{t}\n<<<END {key}>>>')
    time.sleep(2)
