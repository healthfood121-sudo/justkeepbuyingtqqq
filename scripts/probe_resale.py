# 리셀가 데이터 구조 점검 (조사용)
import requests, json, re, html
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"}
CH = "d9a5bc42-4b9c-4976-858a-f159cf99c647"
H = {**UA, "nike-api-caller-id": "com.nike.commerce.nikedotcom.web"}
for path in ["/w/sale-3yaep", "/w/shoes-y7ok"]:
    u = (f"https://api.nike.com/discover/product_wall/v1/marketplace/US/language/en/consumerChannelId/{CH}"
         f"?path={path}&queryType=PRODUCTS&anchor=0&count=100")
    d = requests.get(u, headers=H, timeout=30).json()
    print(path, "top keys:", list(d.keys()))
    print("pages:", json.dumps(d.get("pages"))[:400])
    g = d["productGroupings"]
    print("groupings:", len(g))
    p = g[0]["products"][0]
    print("product keys:", list(p.keys()))
    print("product0:", json.dumps(p)[:1500])
    # 가격만
    for gg in g[:6]:
        for q in gg["products"][:1]:
            print("  -", q.get("copy", {}).get("title"), json.dumps(q.get("prices")))
r = requests.get("https://priveporter.com/blogs/blog/prive-porter-s-guide-to-the-2026-u-s-hermes-price-increase-real-numbers-real-impact", headers=UA, timeout=30)
t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", r.text, flags=re.S)
t = html.unescape(re.sub(r"<[^>]+>", " ", t)); t = re.sub(r"\s+", " ", t)
i = t.find("Birkin"); print("PRIVE BLOG", r.status_code, t[i-200:i+5000])
