"""에르메스 리셀 웃돈 + 나이키 공식몰 할인율 매일 수집.

출처(모두 공개 페이지, 하루 1회만 조회):
- 에르메스: Privé Porter·Madison Avenue Couture(주로 새 가방), Rebag·Fashionphile(중고)
  각 쇼핑몰의 Shopify 공개 상품 목록 /collections/hermes/products.json
- 나이키: nike.com 상품 목록 API(전체 상품의 정가·판매가·할인율)

출력: web/public/data/resale/
- hermes_daily.json    날짜별 대표 모델 희망가·웃돈·매물 수
- hermes_sold.json     매물이 사라진 기록(=팔린 것으로 간주) 최근 3000건
- nike_daily.json      날짜별 할인 상품 비율·평균 할인율
"""
import json, re, statistics, time
from datetime import datetime, timezone, timedelta
from pathlib import Path
import requests

OUT = Path("web/public/data/resale")
OUT.mkdir(parents=True, exist_ok=True)
TODAY = (datetime.now(timezone.utc) + timedelta(hours=9)).strftime("%Y-%m-%d")  # 한국 날짜
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"}

# ── 에르메스 ──────────────────────────────────────────────
SHOPS = {
    "priveporter":  ("https://priveporter.com", "new"),
    "mac":          ("https://www.madisonavenuecouture.com", "new"),
    "rebag":        ("https://shop.rebag.com", "pre"),
    "fashionphile": ("https://www.fashionphile.com", "pre"),
}
# 쇼핑몰별 에르메스 컬렉션 주소(앞에서부터 시도). MAC는 2026-11-19 무렵 hermes → hermes-handbags로 바꿨다.
HANDLES = {"mac": ["hermes-handbags", "hermes"]}
# 한 쇼핑몰의 바구니 매물이 전날보다 이 비율 아래로 떨어지면 수집 실패로 보고, 그 쇼핑몰은 팔림 판정에서 뺀다
DROP_RATIO = 0.5
# 대표 모델 10종. 정가는 2026년 1월 미국 매장가(소더비·퍼스밥 보도), 확인된 것만 넣는다.
BASKET = {
    "B25": {"label": "버킨 25", "retail": 13500},
    "B30": {"label": "버킨 30", "retail": 14900},
    "B35": {"label": "버킨 35", "retail": None},
    "K20": {"label": "미니 켈리 20", "retail": 11400},
    "K25": {"label": "켈리 25", "retail": 13700},
    "K28": {"label": "켈리 28", "retail": 14400},
    "C18": {"label": "콘스탄스 18", "retail": None},
    "P18": {"label": "피코탄 18", "retail": None},
    "EPM": {"label": "에블린 PM", "retail": None},
    "L26": {"label": "린디 26", "retail": None},
}
PREM_KEYS = [k for k, v in BASKET.items() if v["retail"]]
EXOTIC = re.compile(r"crocodile|alligator|lizard|ostrich|niloticus|porosus|exotic|python|varanus|salvator|mississippiensis|himalaya|\bcroc\b")
SPECIAL = re.compile(r"shadow|faubourg|cargo|3 en 1|3-in-1|in ?& ?out|picnic|touch|ombre|verso|so black|tie.?dye|casaque|haut a courroies|\bhac\b|danse|pochette|to go|wallet|elan|long|slim|lakis|depeches|flat|cut|moove|2424|bracelet|charm|twilly|clutch|kellymorphose|ado\b|desordre|lock tressage|cabas")
PREOWNED_WORDS = re.compile(r"pre-?owned|preloved|pre-loved|vintage|gently|excellent|very good|good condition|fair")

def classify(title, tags):
    t = (title + " " + " ".join(tags if isinstance(tags, list) else [str(tags)])).lower()
    tt = title.lower()
    if EXOTIC.search(t) or SPECIAL.search(tt):
        return None
    size = None
    m = re.search(r"\b(15|16|18|20|22|23|24|25|26|28|29|30|32|33|35|40)\s*(cm)?\b", tt)
    if m: size = int(m.group(1))
    if "birkin" in tt:
        return {25: "B25", 30: "B30", 35: "B35"}.get(size)
    if "kelly" in tt:
        if "mini" in tt and size in (None, 20): return "K20"
        return {20: "K20", 25: "K25", 28: "K28"}.get(size)
    if "constance" in tt:
        if "mini" in tt and size in (None, 18): return "C18"
        return "C18" if size == 18 else None
    if "picotin" in tt:
        return "P18" if size == 18 or re.search(r"\bpm\b", tt) else None
    if "evelyne" in tt:
        return "EPM" if re.search(r"\bpm\b", tt) and not re.search(r"\btpm\b", tt) else None
    if "lindy" in tt:
        return "L26" if size == 26 else None
    return None

def fetch_shop(name, base):
    tried = []
    for handle in HANDLES.get(name, ["hermes"]):
        items, page = [], 1
        while page <= 40:
            r = requests.get(f"{base}/collections/{handle}/products.json?limit=250&page={page}", headers=UA, timeout=40)
            if r.status_code != 200:
                if page == 1: tried.append(f"{handle}: HTTP {r.status_code}")
                break
            ps = r.json().get("products", [])
            if not ps:
                if page == 1: tried.append(f"{handle}: 상품 0개")
                break
            items += ps; page += 1; time.sleep(0.7)
        if items:
            return items
    # 조용히 0개로 넘기지 않는다 — 오류로 남겨 그날 팔림 판정에서 이 쇼핑몰을 뺀다
    raise RuntimeError("; ".join(tried) or "상품 0개")

def q(vals, p):
    s = sorted(vals); i = (len(s) - 1) * p; lo = int(i); hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (i - lo)

def hermes():
    listings, shop_n, errors = [], {}, []
    for name, (base, default_cond) in SHOPS.items():
        try:
            ps = fetch_shop(name, base)
        except Exception as e:
            errors.append(f"{name}: {e}"); ps = []
        shop_n[name] = len(ps)
        for p in ps:
            key = classify(p.get("title", ""), p.get("tags", []))
            if not key: continue
            vs = p.get("variants") or []
            if not vs: continue
            try: price = float(vs[0]["price"])
            except Exception: continue
            if price < 500: continue
            avail = any(v.get("available") for v in vs)
            cond = default_cond
            if cond == "new" and PREOWNED_WORDS.search(p["title"].lower()): cond = "pre"
            listings.append({"id": f"{name}:{p['id']}", "shop": name, "key": key, "cond": cond,
                             "price": price, "avail": avail, "created": (p.get("created_at") or "")[:10],
                             "title": p["title"][:120]})
    live = [l for l in listings if l["avail"]]
    # 전날 스냅숏과 비교해 쇼핑몰별 수집 실패 판정
    snap_p = Path("scripts/data/resale_snapshot.json")  # 배포 폴더 밖에 둠
    prev = json.loads(snap_p.read_text()) if snap_p.exists() else {"date": None, "items": []}
    prev_n, cur_n = {}, {}
    for it in prev["items"]: prev_n[it["shop"]] = prev_n.get(it["shop"], 0) + 1
    for l in live: cur_n[l["shop"]] = cur_n.get(l["shop"], 0) + 1
    failed = {e.split(":")[0] for e in errors}
    for sh, n in prev_n.items():
        if n >= 50 and cur_n.get(sh, 0) < n * DROP_RATIO:
            failed.add(sh)
            if not any(e.startswith(sh + ":") for e in errors):
                errors.append(f"{sh}: 바구니 매물 {n} → {cur_n.get(sh, 0)}개로 급감(수집 실패로 판단)")
    keys = {}
    for k in BASKET:
        keys[k] = {}
        for cond in ("new", "pre"):
            ps = [l["price"] for l in live if l["key"] == k and l["cond"] == cond]
            if not ps: continue
            d = {"n": len(ps), "med": round(q(ps, .5)), "p25": round(q(ps, .25)), "p75": round(q(ps, .75))}
            if BASKET[k]["retail"]: d["prem"] = round(d["med"] / BASKET[k]["retail"], 3)
            keys[k][cond] = d
    # 팔림 판정: 어제 있던 매물이 오늘 없어지거나 품절로 바뀜(수집 실패한 쇼핑몰은 빼고 판정)
    now_live = {l["id"] for l in live}
    sold_today = []
    if prev.get("date") and prev["date"] != TODAY:
        for it in prev["items"]:
            if it["shop"] in failed: continue
            if it["id"] not in now_live:
                days = None
                if it.get("created"):
                    try: days = (datetime.strptime(TODAY, "%Y-%m-%d") - datetime.strptime(it["created"], "%Y-%m-%d")).days
                    except Exception: pass
                sold_today.append({"date": TODAY, "shop": it["shop"], "key": it["key"], "cond": it["cond"],
                                   "price": it["price"], "days": days})
    sold_p = OUT / "hermes_sold.json"
    sold = json.loads(sold_p.read_text()) if sold_p.exists() else []
    sold = (sold + sold_today)[-3000:]
    sold_p.write_text(json.dumps(sold, ensure_ascii=False))
    keep = ("id", "shop", "key", "cond", "price", "created")
    snap_items = [{f: l[f] for f in keep} for l in live if l["shop"] not in failed]
    # 실패한 쇼핑몰은 전날 매물을 그대로 넘겨, 다시 수집될 때 가짜 "팔림"이 생기지 않게 한다
    snap_items += [it for it in prev["items"] if it["shop"] in failed]
    snap_p.write_text(json.dumps({"date": TODAY, "items": snap_items}, ensure_ascii=False, separators=(",", ":")))
    # 핵심 웃돈 지수: 정가가 확인된 5종의 새 가방 웃돈 중간값(매물 2개 이상인 모델만)
    prems = [keys[k]["new"]["prem"] for k in PREM_KEYS if "new" in keys[k] and keys[k]["new"]["n"] >= 2]
    day = {"date": TODAY, "keys": keys, "shops": shop_n,
           "listed": {"new": sum(1 for l in live if l["cond"] == "new"), "pre": sum(1 for l in live if l["cond"] == "pre")},
           "soldToday": len(sold_today),
           "premIndex": round(statistics.median(prems), 3) if prems else None}
    if errors: day["errors"] = errors
    if failed: day["missingShops"] = sorted(failed)
    daily_p = OUT / "hermes_daily.json"
    daily = json.loads(daily_p.read_text()) if daily_p.exists() else {}
    days = [d for d in daily.get("days", []) if d["date"] != TODAY] + [day]
    daily_p.write_text(json.dumps({
        "basket": BASKET, "premKeys": PREM_KEYS,
        "retailNote": "정가는 2026년 1월 미국 매장가(소더비·퍼스밥 보도 기준). 에르메스가 정가를 올리면 이 표도 고친다.",
        "sources": {k: v[0] for k, v in SHOPS.items()},
        "updated": TODAY, "days": days}, ensure_ascii=False))
    print("hermes", TODAY, shop_n, "basket listings:", len(live), "sold:", len(sold_today), "premIndex:", day["premIndex"])

# ── 나이키 ──────────────────────────────────────────────
CH = "d9a5bc42-4b9c-4976-858a-f159cf99c647"
NH = {**UA, "nike-api-caller-id": "com.nike.commerce.nikedotcom.web"}
API = "https://api.nike.com"

def nike():
    url = f"{API}/discover/product_wall/v1/marketplace/US/language/en/consumerChannelId/{CH}?path=/w&queryType=PRODUCTS&anchor=0&count=100"
    seen, pages = {}, 0
    while url and pages < 400:
        r = requests.get(url, headers=NH, timeout=40)
        if r.status_code != 200: print("nike stop", r.status_code); break
        d = r.json(); pages += 1
        for g in d.get("productGroupings") or []:
            for p in g.get("products") or []:
                pr = p.get("prices") or {}
                code = p.get("productCode")
                if not code or pr.get("initialPrice") in (None, 0) or pr.get("currentPrice") is None: continue
                seen[code] = {"type": p.get("productType"), "title": (p.get("copy") or {}).get("title") or "",
                              "init": pr["initialPrice"], "cur": pr["currentPrice"],
                              "disc": pr.get("discountPercentage") or round((1 - pr["currentPrice"] / pr["initialPrice"]) * 100)}
        nxt = (d.get("pages") or {}).get("next")
        url = API + nxt if nxt else None
        time.sleep(0.4)
    def stats(rows):
        if not rows: return None
        sale = [r for r in rows if r["disc"] > 0]
        return {"n": len(rows), "onSale": len(sale),
                "saleShare": round(len(sale) / len(rows) * 100, 1),
                "avgDiscAll": round(sum(r["disc"] for r in rows) / len(rows), 1),
                "avgDiscSale": round(sum(r["disc"] for r in sale) / len(sale), 1) if sale else 0,
                "deepShare": round(sum(1 for r in rows if r["disc"] >= 40) / len(rows) * 100, 1)}
    rows = list(seen.values())
    day = {"date": TODAY, "pages": pages, "all": stats(rows),
           "footwear": stats([r for r in rows if r["type"] == "FOOTWEAR"]),
           "apparel": stats([r for r in rows if r["type"] == "APPAREL"]),
           "jordan": stats([r for r in rows if "jordan" in r["title"].lower()])}
    p = OUT / "nike_daily.json"
    old = json.loads(p.read_text()) if p.exists() else {}
    days = [x for x in old.get("days", []) if x["date"] != TODAY] + [day]
    p.write_text(json.dumps({"source": "nike.com 미국 공식몰 전체 상품", "updated": TODAY, "days": days}, ensure_ascii=False))
    print("nike", TODAY, day["all"])

if __name__ == "__main__":
    for fn in (hermes, nike):
        try: fn()
        except Exception as e: print("FAIL", fn.__name__, e)
