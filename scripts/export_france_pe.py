"""export_france_pe.py — 프랑스 시장 PER(월별) 받기 → web/public/data/france_pe.json

출처: worldperatio.com/area/france/ — 프랑스 주식 시장 ETF(EWQ, MSCI France)의 최근 12개월 이익 기준 PER을 월별로 계산한 값.
같은 페이지의 비교용 전 세계(VT)·미국 제외 선진국(EFA) PER도 함께 저장한다. 1996년 EWQ 상장 전 값은 사이트의 추정.
실행: GitHub Actions '프랑스 시장 PER 받기' (결과를 실행한 브랜치에 커밋)"""
import json
import re
from datetime import date
from pathlib import Path

import requests

ROOT = Path(__file__).parent.parent
OUT = ROOT / 'web' / 'public' / 'data' / 'france_pe.json'
URL = 'https://worldperatio.com/area/france/'
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'}


def series(text: str, name_re: str):
    m = re.search(name_re + r'\s*=\s*\[', text)
    if not m:
        return []
    body = text[m.end():m.end() + 300000]
    body = body[:body.find('];')]
    out = []
    for y, mo, v in re.findall(r'Date\.UTC\((\d+),\s*(\d+)(?:,\s*\d+)?\)\s*,\s*(-?[\d.]+)', body):
        out.append([f'{int(y)}-{int(mo) + 1:02d}', round(float(v), 2)])
    return out


def main():
    r = requests.get(URL, headers=UA, timeout=60)
    r.raise_for_status()
    fr = series(r.text, r'detailPE_data')
    vt = series(r.text, r'compare_isin_chart_data\["VT"\]')
    efa = series(r.text, r'compare_isin_chart_data\["EFA"\]')
    assert len(fr) > 300, f'프랑스 PER 자료가 너무 적다: {len(fr)}'
    # 비교용 미국 시장 — 같은 사이트·같은 방식(ETF 최근 12개월 이익 기준)
    us, us_url = [], ''
    for u in ('https://worldperatio.com/area/united-states/', 'https://worldperatio.com/area/usa/', 'https://worldperatio.com/index/sp-500/'):
        try:
            ru = requests.get(u, headers=UA, timeout=60)
        except Exception as e:
            print('  미국 실패', u, e); continue
        print('  미국 시도', u, ru.status_code)
        if ru.status_code == 200:
            us = series(ru.text, r'detailPE_data')
            if len(us) > 300:
                us_url = u; break
    data = {
        'generated': date.today().isoformat(),
        'source': 'worldperatio.com — 프랑스 시장 ETF(EWQ, MSCI France) 최근 12개월 이익 기준 PER, 월별',
        'note': '1996년 EWQ 상장 전 값은 출처 사이트의 추정. 비교용: VT(전 세계), EFA(미국 제외 선진국), us(미국 시장, 같은 사이트)',
        'fr': fr, 'world': vt, 'efa': efa, 'us': us, 'usSource': us_url,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    print(f'저장 {OUT} 프랑스 {len(fr)}개({fr[0][0]}~{fr[-1][0]}, 지금 {fr[-1][1]}) 전 세계 {len(vt)} EFA {len(efa)} 미국 {len(us)}({us_url})')


if __name__ == '__main__':
    main()
