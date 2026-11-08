"""/private 종목별 소속 지수 표시 → web/app/private/universe.ts

S = S&P 500 (web/app/sp500-holdings/data.ts)
N = 나스닥100 (web/app/nasdaq100-holdings/data.ts, 주식만)
M = S&P 미드캡 400 (scripts/data/sp400.json — IJH의 SEC 보유 종목 보고서)
R = 러셀2000 (scripts/data/russell2000.json — IWM의 SEC 보유 종목 보고서)
Q = 나스닥 상장 (web/public/data/screen/universe.json 의 Q 표시)
종목을 추가하거나 위 목록이 갱신되면 다시 실행한다.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
page = (WEB / "app/private/PrivateApp.tsx")
if not page.exists():
    page = WEB / "app/private/page.tsx"
keys = re.findall(r"^\s+\{ key: '([^']+)',", page.read_text(), re.M)
sp = set(re.findall(r"ticker: '([A-Z.\-]+)'", (WEB / "app/sp500-holdings/data.ts").read_text()))
ndx = {t for t, typ in re.findall(r"ticker: '([A-Z.\-]+)'.*?type: '(\w+)'",
                                   (WEB / "app/nasdaq100-holdings/data.ts").read_text(), re.S) if typ == "stock"}
r2 = json.loads((ROOT / "scripts/data/russell2000.json").read_text())
r2k = set(r2["tickers"])
m4 = json.loads((ROOT / "scripts/data/sp400.json").read_text())
mid = set(m4["tickers"])
uni = {r["t"]: r["f"] for r in json.loads((WEB / "public/data/screen/universe.json").read_text())["rows"]}

out = {}
for k in keys:
    f = ""
    if k in sp or k.replace("-", ".") in sp or k.replace(".", "-") in sp:
        f += "S"
    if k in ndx:
        f += "N"
    if k.replace(".", "-") in mid and "S" not in f:
        f += "M"
    if k.replace(".", "-") in r2k:
        f += "R"
    if "Q" in uni.get(k, ""):
        f += "Q"
    out[k] = f
cnt = {c: sum(c in v for v in out.values()) for c in "SNMRQ"}
lines = ["// 자동 생성 — scripts/build_private_universe.py (직접 수정 금지)",
         f"// S=S&P 500 · N=나스닥100 · M=S&P 미드캡 400({m4['asOf']} 기준) · R=러셀2000({r2['asOf']} 기준) · Q=나스닥 상장. 빈 문자열 = 어느 지수에도 없음(해외·ETF)",
         f"export const UNIV_COUNT = {json.dumps(cnt)} as const",
         "export const UNIV: Record<string, string> = {"]
lines += [f"  {json.dumps(k)}: {json.dumps(v)}," for k, v in out.items()]
lines.append("}")
(WEB / "app/private/universe.ts").write_text("\n".join(lines) + "\n")
print(len(out), cnt, "none:", [k for k, v in out.items() if not v])
