# 리셀가 데이터 출처 접근 가능 여부 점검 (조사용, 결과는 로그로만 출력)
import requests, json
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "text/html,application/json;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9"}
URLS = [
  # 에르메스 리셀 (Shopify 계열이면 /products.json 공개)
  "https://www.madisonavenuecouture.com/products.json?limit=3",
  "https://priveporter.com/products.json?limit=3",
  "https://shop.rebag.com/products.json?limit=3",
  "https://www.rebag.com/shop/hermes",
  "https://www.fashionphile.com/products.json?limit=3",
  "https://www.fashionphile.com/shop/brands/hermes",
  "https://www.theluxurycloset.com/us-en/women/hermes",
  "https://www.therealreal.com/designers/hermes",
  "https://us.vestiairecollective.com/search/?q=birkin",
  "https://www.ebay.com/sch/i.html?_nkw=hermes+birkin+25&LH_Sold=1&LH_Complete=1",
  "https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/bags-and-clutches/",
  # 나이키 리셀
  "https://stockx.com/air-jordan-1-retro-high-og-chicago-lost-and-found",
  "https://stockx.com/api/browse?_search=jordan%201",
  "https://www.goat.com/web-api/v1/product_templates?productTemplateSlug=air-jordan-1-retro-high-og-lost-and-found-dz5485-612",
  "https://www.flightclub.com/air-jordan-1-retro-high-og-lost-and-found-dz5485-612",
  "https://www.stadiumgoods.com/en-us/search?q=jordan",
  "https://www.kickscrew.com/products.json?limit=3",
  # 나이키 공식몰 할인율 (리셀 대신 쓸 수 있는 수요 지표)
  "https://api.nike.com/cic/browse/v2?queryid=products&anonymousId=x&country=us&endpoint=%2Fproduct_feed%2Frollup_threads%2Fv2%3Ffilter%3Dmarketplace(US)%26filter%3Dlanguage(en)%26filter%3DemployeePrice(true)%26anchor%3D0%26consumerChannelId%3Dd9a5bc42-4b9c-4976-858a-f159cf99c647%26count%3D3",
  "https://www.nike.com/w/sale-3yaep",
]
for u in URLS:
    try:
        r = requests.get(u, headers=UA, timeout=25)
        body = r.text
        print(f"== {r.status_code} len={len(body)} {u}")
        print("   ", body[:300].replace("\n", " "))
    except Exception as e:
        print(f"== ERR {u} {e}")
