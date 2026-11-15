"""웹 페이지를 받아 텍스트(또는 표)만 로그로 출력한다(조사용, 커밋 없음).
사용: python scripts/fetch_pages.py URL [URL ...]
환경변수: GREP(이 정규식이 든 줄만), MAX(페이지당 글자 수, 기본 6000), TABLES=1(표만 '|'로 출력)"""
import html, os, re, sys
import requests

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'}
GREP = os.environ.get('GREP') or ''
MAX = int(os.environ.get('MAX') or 6000)
TABLES = os.environ.get('TABLES') == '1'


def clean(h):
    h = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'</(p|div|tr|li|h\d)>', '\n', h, flags=re.I)
    h = re.sub(r'<br\s*/?>', '\n', h, flags=re.I)
    h = re.sub(r'<[^>]+>', ' ', h)
    h = html.unescape(h).replace('\xa0', ' ')
    h = re.sub(r'[ \t]+', ' ', h)
    return re.sub(r'\n\s*\n+', '\n', h).strip()


def tables(h):
    out = []
    for t in re.findall(r'<table.*?</table>', h, flags=re.S | re.I):
        for tr in re.findall(r'<tr.*?</tr>', t, flags=re.S | re.I):
            cells = [clean(c) for c in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', tr, flags=re.S | re.I)]
            if cells:
                out.append(' | '.join(cells))
        out.append('----')
    return '\n'.join(out)


for u in sys.argv[1:]:
    print(f'\n######## {u}', flush=True)
    try:
        r = requests.get(u, headers=UA, timeout=60)
    except Exception as e:
        print('  실패', e, flush=True)
        continue
    print(f'  {r.status_code} {len(r.text)}', flush=True)
    if r.status_code != 200:
        continue
    raw = os.environ.get('RAW') or ''  # 원본 HTML에서 이 정규식 주변(앞뒤 SPAN자)을 출력 — 차트 데이터 찾기용
    if raw:
        span = int(os.environ.get('SPAN') or 300)
        ms = list(re.finditer(raw, r.text))
        print(f'  RAW 일치 {len(ms)}개', flush=True)
        out = '\n---\n'.join(r.text[max(0, m.start() - span):m.end() + span] for m in ms[:20])
        print(out[:MAX], flush=True)
        continue
    t = tables(r.text) if TABLES else clean(r.text)
    if GREP:
        t = '\n'.join(l for l in t.split('\n') if re.search(GREP, l, re.I))
    print(t[:MAX], flush=True)
