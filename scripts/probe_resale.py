# 리셀가 데이터 구조 점검 (조사용)
import requests, json, re
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"}
def get(u, **kw):
    r = requests.get(u, headers=UA, timeout=30, **kw); return r
SHOPS = {"priveporter": "https://priveporter.com", "mac": "https://www.madisonavenuecouture.com",
         "rebag": "https://shop.rebag.com", "fashionphile": "https://www.fashionphile.com"}
for name, base in SHOPS.items():
    for coll in ["hermes", "hermes-bags", "birkin", "brands-hermes"]:
        r = get(f"{base}/collections/{coll}/products.json?limit=250")
        n = len(r.json().get("products", [])) if r.status_code == 200 and r.text.startswith("{") else -1
        print(f"[{name}] collection {coll}: {r.status_code} n={n}")
        if n > 0:
            ps = r.json()["products"]
            p = ps[0]
            print("   keys:", list(p.keys()))
            print("   vendor/type/tags:", p.get("vendor"), "|", p.get("product_type"), "|", str(p.get("tags"))[:200])
            print("   variant0:", json.dumps({k: p["variants"][0].get(k) for k in ["price","compare_at_price","available","sku","created_at","updated_at"]}))
            for q in ps[:12]:
                print("    -", q["title"][:90], "|", q["variants"][0]["price"], "| avail", q["variants"][0].get("available"))
            break
# Nike: 할인 상품 벽 API
CH = "d9a5bc42-4b9c-4976-858a-f159cf99c647"
for path in ["/w/sale-3yaep", "/w/mens-sale-shoes-3yaepznik1zy7ok", "/w/shoes-y7ok", "/w"]:
    u = (f"https://api.nike.com/discover/product_wall/v1/marketplace/US/language/en/consumerChannelId/{CH}"
         f"?path={path}&queryType=PRODUCTS&anchor=0&count=24")
    r = get(u, headers={**UA, "nike-api-caller-id": "com.nike.commerce.nikedotcom.web"})
    print(f"[nike api] {path}: {r.status_code} {r.text[:400]}")
r = get("https://www.nike.com/w/sale-3yaep")
m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', r.text, re.S)
if m:
    d = json.loads(m.group(1)); s = json.dumps(d)
    print("nike next keys:", list(d.get("props", {}).get("pageProps", {}).keys())[:30])
    for k in ["totalResources", "totalProducts", "productCount", "resultCount"]:
        i = s.find(k); print(k, s[i:i+120] if i >= 0 else None)
    i = s.find("currentPrice"); print("price sample:", s[i-300:i+300])
else:
    print("no NEXT_DATA; len", len(r.text)); i = r.text.find("Results"); print(r.text[i-200:i+100])
