"""
notify_telegram.py — 인출식 신호를 텔레그램 채널로 알린다 (GitHub Actions에서 신호 계산 직후 실행)
메인 전략은 25% 룰, S0 · D10GK는 비교 전략. 모든 메시지에서 25% 룰 상태가 맨 앞에 오고,
비교 전략만의 알림은 제목에 '비교 전략'을 붙이고 "메인 전략은 할 일 없음"을 먼저 적는다.

보내는 경우 (같은 날 같은 종류의 알림은 전략 이름을 묶어 한 메시지로)
  · 매도/매수 신호가 새로 뜬 날                         → 즉시 알림 ("다음 거래일에 전량 매도")
  · 25% 룰 보유 중 1년 최고 종가 대비 −20%를 처음 넘은 날 → 주의 (매도선 −25%에 가까워짐)
  · S0·D10GK 보유 중 200일선 아래 10일째가 된 날          → 매도 임박 (15일이면 매도)
  · 현금 중 200일 평균선 위 10일째가 된 날 (세 전략 공통) → 재매수 임박 (15일이면 매수)
  · D10GK 현금 중 매일                                  → 그날 밤 넣을 LOC 매수 주문 가격 (RSI 조기 재매수)
  · D10GK LOC 주문이 체결된 날                           → 조기 재매수 체결
  · 매주 금요일 장 마감 뒤(한국 토요일 아침)            → 세 전략 한 주 요약 (그날 다른 알림이 있어도 따로)
  · --test                                              → 지금 상태를 바로 한 번 (토큰 설정 확인용)

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
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIGNAL = ROOT / "web/public/data/withdrawal_signal.json"
KEYS = ("RULE25", "S0", "D10GK")
MAIN = "RULE25"
COMPARE = ("S0", "D10GK")
NAME = {"RULE25": "25% 룰", "S0": "S0", "D10GK": "D10GK"}
WARN_DROP = 20.0   # 25% 룰: 최고 종가 대비 이만큼(%) 빠지면 주의 알림
SELL_WARN = 10     # S0·D10GK: 보유 중 200일선 아래 연속일이 이만큼 되면 매도 임박 알림
REBUY_WARN = 10    # 현금 중 200일선 위 연속일이 이만큼 되면 재매수 임박 알림


def load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def strat(sig, k):
    """신호 파일에서 전략 항목 (25% 룰은 예전 키 T25도 읽음)."""
    if not sig:
        return {}
    st = sig.get("strategies", {})
    return st.get(k) or (st.get("T25") if k == "RULE25" else None) or {}


def below_days(t):
    """보유 중 200일선 아래 연속일. 필드가 없던 예전 파일은 문구에서 읽는다."""
    if t.get("below_days") is not None:
        return t["below_days"]
    m = re.search(r"아래 (\d+)일째", t.get("detail", ""))
    return int(m.group(1)) if m and t.get("state") == "보유" else None


def names(ks):
    return " · ".join(NAME[k] for k in ks)


# ── 상태 줄 ─────────────────────────────────────────────

def header_lines(sig):
    return [f"📅 {sig['asof']} 미국 종가 기준",
            f"나스닥100 {sig['ndx_close']:,.0f} · 1년 최고 종가 대비 {sig['vs_peak_pct']:+.1f}% · "
            f"200일선 대비 {sig['vs_ema_pct']:+.1f}% · RSI {sig['rsi14']:.1f}"]


def loc_line(t):
    loc = t.get("loc")
    if not loc:
        return None
    price = f"TQQQ ${loc['tqqq_price']:,.2f} 이하" if loc.get("tqqq_price") else f"TQQQ 전일 종가 대비 {loc['tqqq_pct']:+.1f}% 이하"
    return f"LOC 매수 주문: {price} (나스닥100이 {loc['ndx_price']:,.0f}, {loc['ndx_pct']:+.1f}% 이하로 마감하면 체결)"


def state_line(sig, k):
    t = strat(sig, k)
    act = t.get("action", "없음")
    if act == "매도":
        return "매도 신호 — 다음 거래일 종가에 전량 매도"
    if act == "매수":
        return "매수 신호 — 다음 거래일 종가에 전액 매수"
    if t.get("state") == "보유":
        if k == "RULE25":
            drop = -sig["vs_peak_pct"]
            line = t.get("sell_line") or sig["peak_1y"] * 0.75
            return f"TQQQ 보유 · 매도선까지 {max(0.0, 25 - drop):.1f}% 남음 (나스닥100 {line:,.0f} 아래 마감 시 매도)"
        b = below_days(t)
        if not b:
            return "TQQQ 보유 · 매도 카운트 0일 (200일선 아래 15일 연속이면 매도)"
        return f"TQQQ 보유 · 200일선 아래 {b}일째 (15일이면 매도)"
    d = t.get("above_days")
    s = "현금 보유" + (f" · 재매수까지 15일 중 {d}일째" if d is not None else "")
    if k == "D10GK" and t.get("loc"):
        s += " · RSI 조기 재매수 대기 중"
    return s


def last_lines(t, prefix="마지막"):
    """마지막 매도·매수 신호 날짜 (신호가 켜진 날 → 실제 매매일). last_events는 최신순."""
    out = []
    for a in ("매도", "매수"):
        e = next((x for x in t.get("last_events", []) if x.get("action") == a), None)
        if not e:
            continue
        s = e.get("signal") or e["date"]
        out.append(f"{prefix} {a} 신호: {s}" + (f" → {e['date']} 종가에 {a}" if s != e["date"] else f" (그날 종가에 {a})"))
    return out


def one_line(sig, k):
    """전략 한 줄 요약: "TQQQ 보유 · 할 일 없음 · 매도선까지 …" """
    line = state_line(sig, k)
    if strat(sig, k).get("action", "없음") == "없음":
        first, _, rest = line.partition(" · ")
        line = f"{first} · 할 일 없음" + (f" · {rest}" if rest else "")
    return line


def block(sig, k, prefix="마지막"):
    """전략 하나의 상태 + 마지막 신호."""
    t = strat(sig, k)
    label = f"{NAME[k]} (메인)" if k == MAIN else NAME[k]
    lines = [f"■ {label}: {one_line(sig, k)}"]
    if k == "D10GK" and t.get("state") == "현금" and loc_line(t):
        lines.append("  " + loc_line(t))
    lines += ["  " + x for x in last_lines(t, prefix)]
    return lines


# ── 메시지 ──────────────────────────────────────────────

def events(sig, prev):
    """(종류, 전략) 목록."""
    ev = []
    for k in KEYS:
        t, p = strat(sig, k), strat(prev, k)
        if not t:
            continue
        act = t.get("action", "없음")

        if act in ("매도", "매수") and (prev is None or p.get("action") != act):
            ev.append((act, k))
            continue

        # D10GK LOC 조기 재매수 체결: 어제 현금 → 오늘 보유, 마지막 매매가 오늘 LOC
        last = (t.get("last_events") or [{}])[0]
        if (k == "D10GK" and p.get("state") == "현금" and t.get("state") == "보유"
                and last.get("date") == sig["asof"] and str(last.get("how", "")).startswith("LOC")):
            ev.append(("LOC 체결", k))
            continue

        if act != "없음" and act != "LOC 매수 주문":
            continue

        if t.get("state") == "보유":
            if k == "RULE25":
                drop, pdrop = -sig["vs_peak_pct"], (-prev["vs_peak_pct"] if prev else 0.0)
                if drop >= WARN_DROP and pdrop < WARN_DROP:
                    ev.append(("25% 주의", k))
            else:
                b, pb = below_days(t), below_days(p)
                if b is not None and b >= SELL_WARN and (pb is None or pb < SELL_WARN):
                    ev.append(("매도 임박", k))
        else:
            d, pd_ = t.get("above_days"), p.get("above_days")
            if d is not None and d >= REBUY_WARN and (pd_ is None or pd_ < REBUY_WARN):
                ev.append(("재매수 임박", k))
            if k == "D10GK" and t.get("loc"):
                ev.append(("LOC 주문", k))
    return ev


def message(kind, ks, sig):
    only_compare = MAIN not in ks
    n = ("비교 전략 " if only_compare else "") + names(ks)
    if kind == "매도":
        head = [f"🔴 {n} 매도 신호", "", "할 일: 다음 거래일 종가에 TQQQ 전량 매도 → 현금(외화RP) 보관"]
    elif kind == "매수":
        head = [f"🟢 {n} 매수 신호", "", "할 일: 다음 거래일 종가에 현금 전액으로 TQQQ 매수"]
    elif kind == "LOC 체결":
        head = [f"🟢 {n} 조기 재매수 체결", "",
                f"오늘 종가에 RSI {sig['rsi14']:.1f}, 200일선 대비 {sig['vs_ema_pct']:+.1f}%로 조건이 맞아 LOC 매수 주문이 체결됐습니다."]
    elif kind == "LOC 주문":
        t = strat(sig, ks[0])
        head = [f"🟣 {n} 오늘 밤 LOC 매수 주문", "", loc_line(t),
                "RSI 30 미만 + 200일선 대비 −10% 이하가 같은 날 종가로 맞으면 체결됩니다. 체결 안 되면 다음 날 새 가격으로 다시 주문합니다."]
    elif kind == "25% 주의":
        head = [f"🟡 {n} 주의 — 매도선에 가까워졌습니다", "", "아직 할 일은 없습니다. 매도는 −25% 아래로 마감한 다음 날입니다."]
    elif kind == "매도 임박":
        b = below_days(strat(sig, ks[0]))
        head = [f"🟡 {n} 매도 임박", "", f"200일 평균선 아래 {b}일째입니다. 15일 연속이면 다음 거래일에 전량 매도합니다.",
                "아직 할 일은 없습니다. 중간에 한 번이라도 평균선 위로 마감하면 처음부터 다시 셉니다."]
    else:  # 재매수 임박
        d = strat(sig, ks[0]).get("above_days")
        head = [f"🔵 {n} 재매수 임박", "", f"200일 평균선 위 {d}일째입니다. 15일 연속이면 다음 거래일에 전액 매수합니다.",
                "아직 할 일은 없습니다. 중간에 한 번이라도 평균선 아래로 마감하면 처음부터 다시 셉니다."]

    # 비교 전략만의 알림: 메인 전략 상태를 제목 바로 아래에 먼저
    if only_compare and strat(sig, MAIN):
        act = strat(sig, MAIN).get("action", "없음")
        main_todo = "할 일 없음" if act in ("없음", "LOC 매수 주문") else f"다음 거래일 전량 {act}"
        head[1:1] = ["", f"※ 메인 전략(25% 룰)은 {main_todo}입니다. 아래는 비교 전략 알림입니다."]

    # 새 매도·매수 신호 날은 아직 매매 전이라 기록의 마지막 신호는 이전 것 → '직전'
    prefix = "직전" if kind in ("매도", "매수") else "마지막"
    body = [""] + header_lines(sig)
    # 25% 룰(메인)은 항상 맨 앞, 전체 표시
    if strat(sig, MAIN):
        body += [""] + block(sig, MAIN, prefix if MAIN in ks else "마지막")
    # 비교 전략: 이 알림의 대상은 전체, 나머지는 한 줄
    comp = [k for k in COMPARE if strat(sig, k)]
    if comp:
        body += ["", "— 비교 전략 —"]
        for k in comp:
            if k in ks:
                body += block(sig, k, prefix)
            else:
                body.append(f"{NAME[k]}: {one_line(sig, k)}")
                if k == "D10GK" and strat(sig, k).get("state") == "현금" and loc_line(strat(sig, k)):
                    body.append("  " + loc_line(strat(sig, k)))
    return "\n".join(head + body)


def build(sig, prev, weekly, test):
    """보낼 메시지 목록."""
    groups = {}
    for kind, k in events(sig, prev):
        groups.setdefault(kind, []).append(k)
    order = ("매도", "매수", "LOC 체결", "LOC 주문", "25% 주의", "매도 임박", "재매수 임박")
    msgs = [message(kind, groups[kind], sig) for kind in order if kind in groups]

    # 주간 요약 · 테스트: 세 전략 모두
    # 금요일 종가(주간 요약)는 다른 알림이 있어도 따로 보낸다. 테스트는 다른 알림이 없을 때만.
    if weekly or (test and not msgs):
        head = "📋 인출식 신호 주간 요약" if weekly else "🧪 알림 테스트 — 현재 상태"
        act = strat(sig, MAIN).get("action", "없음")
        todo = f"25% 룰(메인): {'할 일 없음' if act == '없음' else f'다음 거래일 전량 {act}'}"
        body = [head, "", todo, ""] + header_lines(sig)
        if strat(sig, MAIN):
            body += [""] + block(sig, MAIN)
        comp = [k for k in COMPARE if strat(sig, k)]
        if comp:
            body += ["", "— 비교 전략 —"]
            for k in comp:
                body += block(sig, k)
        msgs.append("\n".join(body))

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
