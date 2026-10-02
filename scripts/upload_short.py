"""TQQQ 쇼츠 YouTube 업로드 스크립트

사용법:
  python scripts/upload_short.py 1971-02
  python scripts/upload_short.py 1971-02 --public
  python scripts/upload_short.py 1971-02 --video output/shorts/custom.mp4
  python scripts/upload_short.py 1971-02 --schedule "2026-10-05T08:00:00+09:00"

업로드 후 web/public/data/youtube_shorts.json 자동 업데이트.
OAuth 인증 파일: config/client_secret_justkeepbuyingtqqq.json
"""
import argparse
import json
import sys
from pathlib import Path

OAUTH_DIR = Path(__file__).parent.parent / "config"
ACCOUNT = "justkeepbuyingtqqq"

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "output" / "shorts"
SHORTS_JSON = BASE_DIR / "web" / "public" / "data" / "youtube_shorts.json"

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
except ImportError:
    print("ERROR: google-auth 패키지 필요")
    print("  pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
    sys.exit(1)

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]

MONTH_KO = {
    "01": "1월", "02": "2월", "03": "3월", "04": "4월",
    "05": "5월", "06": "6월", "07": "7월", "08": "8월",
    "09": "9월", "10": "10월", "11": "11월", "12": "12월",
}


def get_youtube():
    client_secret = OAUTH_DIR / f"client_secret_{ACCOUNT}.json"
    token_path = OAUTH_DIR / f"token_{ACCOUNT}.json"

    if not client_secret.exists():
        print(f"ERROR: {client_secret} 없음")
        sys.exit(1)

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("토큰 갱신 중...")
            creds.refresh(Request())
        else:
            print("최초 인증: 브라우저가 열립니다")
            flow = InstalledAppFlow.from_client_secrets_file(str(client_secret), SCOPES)
            creds = flow.run_local_server(port=0, prompt="select_account")
        with open(token_path, "w") as f:
            f.write(creds.to_json())
        print(f"토큰 저장: {token_path.name}")

    return build("youtube", "v3", credentials=creds)


def make_metadata(start_ym: str) -> dict:
    """1971-02 → 제목/설명/태그 자동 생성"""
    year, month = start_ym.split("-")
    month_ko = MONTH_KO.get(month, f"{int(month)}월")

    title = f"{year}년 {month_ko} 시작 · 매일 20만원 TQQQ 적립하면? #Shorts"

    description = (
        f"{year}년 {month_ko}부터 매일 20만원씩 TQQQ에 적립했을 때 10억 달성까지의 시뮬레이션입니다.\n\n"
        f"📊 일별 상세 데이터: https://justkeepbuyingtqqq.com/simulator/cohort?start={start_ym}&inst=ndx3x\n\n"
        f"⚠️ 본 영상은 과거 데이터 기반 백테스트 시뮬레이션이며, 투자 권유가 아닙니다.\n"
        f"합성 가격(NDX 수익률×3배) 사용, 비용 미반영.\n\n"
        f"#TQQQ #나스닥100 #장기투자 #레버리지ETF #적립식투자 #쇼츠"
    )

    tags = [
        "TQQQ", "나스닥100", "장기투자", "레버리지ETF", "적립식투자",
        "쇼츠", "백테스트", "ETF", "미국주식", "재테크",
    ]

    return {"title": title, "description": description, "tags": tags}


def find_video(start_ym: str) -> Path:
    """output/shorts/{start_ym}.mp4 찾기 (여러 형식 대응)"""
    # 정확한 이름
    exact = OUTPUT_DIR / f"{start_ym}.mp4"
    if exact.exists():
        return exact

    # YYYYMM 형식
    yyyymm = start_ym.replace("-", "")
    alt = OUTPUT_DIR / f"{yyyymm}.mp4"
    if alt.exists():
        return alt

    # 날짜 포함 파일 (test_ 제외 우선)
    candidates = list(OUTPUT_DIR.glob(f"*{start_ym}*.mp4")) + list(OUTPUT_DIR.glob(f"*{yyyymm}*.mp4"))
    non_test = [p for p in candidates if not p.name.startswith("test_")]
    if non_test:
        return sorted(non_test, key=lambda p: p.stat().st_mtime, reverse=True)[0]
    if candidates:
        return sorted(candidates, key=lambda p: p.stat().st_mtime, reverse=True)[0]

    return None


def update_shorts_json(start_ym: str, video_id: str):
    """youtube_shorts.json에 {start_ym: shorts_url} 추가하고 날짜순 정렬"""
    data = {}
    if SHORTS_JSON.exists():
        try:
            data = json.loads(SHORTS_JSON.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass

    url = f"https://www.youtube.com/shorts/{video_id}"
    data[start_ym] = url

    sorted_data = dict(sorted(data.items()))
    SHORTS_JSON.write_text(
        json.dumps(sorted_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"  youtube_shorts.json 업데이트: {start_ym} -> {url}")


def main():
    parser = argparse.ArgumentParser(description="TQQQ 쇼츠 YouTube 업로드")
    parser.add_argument("start_ym", help="시작 연월 (예: 1971-02 또는 197102)")
    parser.add_argument("--video", help="영상 파일 직접 지정 (기본: output/shorts/{start_ym}.mp4)")
    parser.add_argument("--public", action="store_true", help="즉시 공개 (기본: 비공개)")
    parser.add_argument("--schedule", help="예약 발행 시각 (예: 2026-10-05T08:00:00+09:00)")
    args = parser.parse_args()

    # 197102 → 1971-02 정규화
    start_ym = args.start_ym
    if len(start_ym) == 6 and "-" not in start_ym:
        start_ym = f"{start_ym[:4]}-{start_ym[4:]}"

    print(f"\nTQQQ 쇼츠 업로드: {start_ym}")
    print("=" * 50)

    # 1. 영상 파일 찾기
    if args.video:
        video_path = Path(args.video)
        if not video_path.is_absolute():
            video_path = BASE_DIR / video_path
    else:
        video_path = find_video(start_ym)

    if not video_path or not video_path.exists():
        print(f"ERROR: 영상 파일을 찾을 수 없습니다.")
        print(f"  output/shorts/{start_ym}.mp4 가 있는지 확인하세요.")
        sys.exit(1)

    print(f"영상: {video_path.name} ({video_path.stat().st_size / 1024 / 1024:.1f}MB)")

    # 2. 메타데이터
    metadata = make_metadata(start_ym)
    print(f"제목: {metadata['title']}")

    # 3. 인증
    print("\n인증 중...")
    youtube = get_youtube()
    ch_resp = youtube.channels().list(part="snippet", mine=True).execute()
    if ch_resp.get("items"):
        print(f"채널: {ch_resp['items'][0]['snippet']['title']}")

    # 4. 업로드 body 구성
    privacy = "public" if args.public else "private"
    body = {
        "snippet": {
            "title": metadata["title"],
            "description": metadata["description"],
            "tags": metadata["tags"],
            "categoryId": "22",  # People & Blogs
            "defaultLanguage": "ko",
            "defaultAudioLanguage": "ko",
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    if args.schedule:
        body["status"]["publishAt"] = args.schedule
        body["status"]["privacyStatus"] = "private"
        print(f"예약 발행: {args.schedule}")
    else:
        print(f"상태: {'공개' if args.public else '비공개'}")
        if not args.public:
            print("  -> 업로드 후 YouTube Studio에서 직접 공개하세요.")

    # 5. 업로드
    print("\n업로드 중...")
    media = MediaFileUpload(str(video_path), chunksize=10 * 1024 * 1024, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"  진행: {int(status.progress() * 100)}%", end="\r")

    video_id = response["id"]
    shorts_url = f"https://www.youtube.com/shorts/{video_id}"
    print(f"\n업로드 완료!")
    print(f"URL: {shorts_url}")

    # 6. youtube_shorts.json 업데이트
    update_shorts_json(start_ym, video_id)
    print(f"\n완료. 웹사이트 쇼츠 버튼 자동 활성화됩니다.")


if __name__ == "__main__":
    main()
