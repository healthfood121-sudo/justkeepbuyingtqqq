"""
notify_telegram.py — 25% 룰 신호를 텔레그램 채널로 알린다 (GitHub Actions에서 신호 계산 직후 실행)

보내는 경우
  · 매도/매수 신호가 새로 뜬 날        → 즉시 알림 ("다음 거래일에 전량 매도")
  · 보유 중 52주 최고 종가 대비 −20%를 처음 넘은 날 → 주의 알림 (매도선 −25%에 가까워짐)
  · 매주 금요일 장 마감 뒤(한국 토요일 아침) → 한 주 요약 ("할 일 없음 · 매도선까지 ○% 남음")
  · --test                               → 지금 상태를 바로 한 번 (토큰 설정 확인용)

환경 변수
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID  — 없으면 아무것도 보내지 않고 끝 (저장소에 아직 등록 전이어도 워크플로는 성공)
  SITE_URL                              — 있으면 메시지 끝에 사이트 링크

실행
  python scripts/notify_telegram.py --prev /tmp/prev_signal.json   # 직전 커밋의 신호 파일과 비교
  python scripts/notify_telegram.py --test
  python scripts/notify_telegram.py --dry-run ...                  # 보내지 않고 메시지만 출력
"""
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIGNAL = ROOT / "web/public/data/withdrawal_signal.json"
KEY = "RULE25"
WARN_DROP = 20.0   # 최고 종가 대비 이만큼(%) 빠지면 주의 알림


def load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def rule(sig):
    """신호 파일에서 25% 룰 항목 (예전 키 T25도 읽음)."""
    if not sig:
        return {}
    st = sig.get("strategies", {})
    return st.get(KEY) or st.get("T25") or {}


def status_lines(sig):
    r = rule(sig)
    drop = -sig["vs_peak_pct"]
    lines = [f"📅 {sig['asof']} 미국 종가 기준", f"나스닥100 {sig['ndx_close']:,.0f} · 52주 최고 종가 대비 {sig['vs_peak_pct']:+.1f}%"]
    if r.get("action") == "매도":
        lines.append("상태: 매도선(52주 최고 종가 −25%) 아래로 마감 — 매도 신호")
    elif r.get("action") == "매수":
        lines.append("상태: 200일 평균선 위 15일 연속 마감 — 재매수 신호")
    elif r.get("state") == "보유":
        line = r.get("sell_line") or sig["peak_1y"] * 0.75
        lines.append(f"상태: TQQQ 보유 · 매도선까지 {max(0.0, 25 - drop):.1f}% 남음 (나스닥100 {line:,.0f} 아래 마감 시 매도)")
    else:
        d = r.get("above_days")
        lines.append("상태: 현금 보유" + (f" · 재매수까지 15일 중 {d}일째" if d is not None else ""))
    return lines


def build(sig, prev, weekly, test):
    """보낼 메시지 목록."""
    msgs = []
    r, p = rule(sig), rule(prev)
    act = r.get("action", "없음")

    # 1) 새 매도/매수 신호
    if act in ("매도", "매수") and (p.get("action") != act or prev is None):
        head = "🔴 25% 룰 매도 신호" if act == "매도" else "🟢 25% 룰 매수 신호"
        todo = "다음 거래일 종가에 TQQQ 전량 매도 → 현금(외화RP) 보관" if act == "매도" \
            else "다음 거래일 종가에 현금 전액으로 TQQQ 매수"
        msgs.append("\n".join([head, "", f"할 일: {todo}", r.get("detail", ""), ""] + status_lines(sig)))

    # 2) 매도선 접근 주의 (보유 중, −20%를 처음 넘은 날)
    drop, pdrop = -sig["vs_peak_pct"], (-prev["vs_peak_pct"] if prev else 0.0)
    if act == "없음" and r.get("state") == "보유" and drop >= WARN_DROP and pdrop < WARN_DROP:
        msgs.append("\n".join(["🟡 25% 룰 주의 — 매도선에 가까워졌습니다", "", "아직 할 일은 없습니다. 매도는 −25% 아래로 마감한 다음 날입니다.", ""]
                              + status_lines(sig)))

    # 3) 주간 요약 · 테스트
    if (weekly or test) and not msgs:
        head = "🧪 알림 테스트 — 25% 룰 현재 상태" if test else "📋 25% 룰 주간 요약"
        todo = "할 일 없음" if act == "없음" else f"할 일: 다음 거래일 전량 {act}"
        msgs.append("\n".join([head, "", todo, ""] + status_lines(sig)))

    site = os.environ.get("SITE_URL", "").strip()
    tail = "\n\n백테스트 규칙의 계산 결과이며 투자 권유가 아닙니다." + (f"\n{site}" if site else "")
    return [m + tail for m in msgs]


def send(token, chat, text):
    data = urllib.parse.urlencode({"chat_id": chat, "text": text, "disable_web_page_preview": "true"}).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/sendMessage", data=data)
    with urllib.request.urlopen(req, timeout=20) as res:
        body = json.load(res)
    if not body.get("ok"):
        raise RuntimeError(body)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prev", help="직전 신호 파일 (없으면 새 신호만 판단)")
    ap.add_argument("--test", action="store_true", help="지금 상태를 바로 한 번 보냄")
    ap.add_argument("--weekly", action="store_true", help="주간 요약도 보냄 (기본: 신호 날짜가 금요일이면 자동)")
    ap.add_argument("--dry-run", action="store_true", help="보내지 않고 출력만")
    args = ap.parse_args()

    sig = load(SIGNAL)
    if not sig:
        print("신호 파일 없음 — 건너뜀"); return
    prev = load(args.prev) if args.prev else None
    if prev and prev.get("asof") == sig.get("asof") and not args.test:
        print("신호 날짜가 그대로 — 새 데이터 없음, 건너뜀"); return
    weekly = args.weekly or date.fromisoformat(sig["asof"]).weekday() == 4   # 금요일 종가
    msgs = build(sig, prev, weekly, args.test)
    if not msgs:
        print("보낼 알림 없음"); return

    token, chat = os.environ.get("TELEGRAM_BOT_TOKEN", ""), os.environ.get("TELEGRAM_CHAT_ID", "")
    for m in msgs:
        print("─" * 40 + "\n" + m)
        if args.dry_run:
            continue
        if not token or not chat:
            print("(TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 미설정 — 보내지 않음)")
            continue
        send(token, chat, m)
        print("→ 전송 완료")


if __name__ == "__main__":
    sys.exit(main())
