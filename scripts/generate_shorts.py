#!/usr/bin/env python3
"""
generate_shorts.py — 키움증권 특정일잔고 스타일 TQQQ 투자 일지 쇼츠 생성기

A전략 (매일 20만원 TQQQ 매수) 코호트를 하루 1프레임으로 렌더링해
유튜브 쇼츠(1080×1920, 최대 58초) MP4를 만든다.

사용법:
  python scripts/generate_shorts.py --start 1971-02
  python scripts/generate_shorts.py --start 2000-01 --out output/shorts/2000-01.mp4
"""

import argparse
import math
import subprocess
import sys
from io import BytesIO
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont

# ════════════════════════════════════════════════════════════
# 설정
# ════════════════════════════════════════════════════════════
DATA_DIR = Path(__file__).parent.parent / "data"
OUT_DIR  = Path(__file__).parent.parent / "output" / "shorts"

W, H             = 1080, 1920
MAX_SEC          = 65          # 최대 영상 길이 (마지막 5초 고정 포함)
BASE_FPS         = 30

DAILY_INVEST_KRW = 200_000
TARGET_KRW       = 1_000_000_000
EXCHANGE_RATE    = 1_300       # KRW/USD 고정 (표시용)
DAILY_INVEST_USD = DAILY_INVEST_KRW / EXCHANGE_RATE
TQQQ_START_USD   = 1.0        # 1971-02-05 합성 시작가

ACCOUNT_STR = "****-**65 [위탁종합] 해리"

# ── 색상 ────────────────────────────────────────────────────
BG      = (255, 255, 255)
BLACK   = (26,  26,  26)
DGRAY   = (80,  80,  80)
GRAY    = (136, 136, 136)
LGRAY   = (210, 210, 210)
PALE    = (248, 248, 248)
RED     = (204,   0,   0)   # 수익 (한국식: 빨강 = 상승/이익)
BLUE    = (0,   51, 204)    # 손실 (한국식: 파랑 = 하락/손실)
CBLUE   = (0,  102, 204)    # 차트 선
CTARGET = (200,  50,  50)   # 목표선

PAD = 48

# ── 폰트 ─────────────────────────────────────────────────────
_F_REG  = "C:/Windows/Fonts/malgun.ttf"
_F_BOLD = "C:/Windows/Fonts/malgunbd.ttf"

def fnt(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(_F_BOLD if bold else _F_REG, size)


# ════════════════════════════════════════════════════════════
# 데이터 로드 & TQQQ 합성
# ════════════════════════════════════════════════════════════

def load_tqqq() -> pd.DataFrame:
    df = pd.read_csv(DATA_DIR / "ndx_1971_now.csv", parse_dates=["Date"])
    df = df.sort_values("Date").reset_index(drop=True)

    # 1985-10 스플라이스 보정
    mask = df["Date"] == "1985-10-01"
    if mask.any():
        i = df.index[mask][0]
        scale = df.loc[i - 1, "Close"] / df.loc[i, "Close"]
        df.loc[i:, "Close"] *= scale

    ret = df["Close"].pct_change().fillna(0)
    df["tqqq"] = TQQQ_START_USD * (1 + ret * 3).cumprod()
    return df


# ════════════════════════════════════════════════════════════
# 코호트 시뮬레이션
# ════════════════════════════════════════════════════════════

def simulate(df: pd.DataFrame, start_ym: str) -> list[dict]:
    yr, mo = map(int, start_ym.split("-"))
    mask = (df["Date"].dt.year == yr) & (df["Date"].dt.month == mo)
    if not mask.any():
        raise ValueError(f"{start_ym}에 해당하는 거래일 없음")

    start_idx = df.index[mask][0]
    sub = df.iloc[start_idx:].reset_index(drop=True)

    cum_shares = 0.0
    cum_usd    = 0.0
    snaps      = []

    for _, row in sub.iterrows():
        px             = row["tqqq"]
        cum_shares    += DAILY_INVEST_USD / px
        cum_usd       += DAILY_INVEST_USD

        port_usd = cum_shares * px
        port_krw = port_usd * EXCHANGE_RATE
        inv_krw  = cum_usd  * EXCHANGE_RATE
        pnl_krw  = port_krw - inv_krw
        pnl_pct  = pnl_krw / inv_krw * 100 if inv_krw > 0 else 0

        snaps.append({
            "date":     row["Date"],
            "port_krw": port_krw,
            "inv_krw":  inv_krw,
            "pnl_krw":  pnl_krw,
            "pnl_pct":  pnl_pct,
            "px":       px,
            "avg_px":   cum_usd / cum_shares,
            "shares":   cum_shares,
        })

        if port_krw >= TARGET_KRW:
            break

    return snaps


# ════════════════════════════════════════════════════════════
# 유틸
# ════════════════════════════════════════════════════════════

def fmt_krw(v: float) -> str:
    return f"{int(abs(v)):,}원"

def rt(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, f, fill):
    """오른쪽 정렬 텍스트 (anchor='rm' 대신 직접 계산)"""
    bb = draw.textbbox((0, 0), text, font=f)
    draw.text((x - (bb[2] - bb[0]), y), text, font=f, fill=fill)

def ct(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, f, fill):
    """가운데 정렬"""
    bb = draw.textbbox((0, 0), text, font=f)
    draw.text((x - (bb[2] - bb[0]) // 2, y), text, font=f, fill=fill)


# ════════════════════════════════════════════════════════════
# 프레임 렌더링
# ════════════════════════════════════════════════════════════

CHART_TOP  = 880    # 차트 시작 Y
CHART_BOT  = 1500   # 차트 끝 Y  (YouTube 하단 안전영역 고려)
CHART_H    = CHART_BOT - CHART_TOP
CHART_W    = W - PAD * 2
RIGHT_SAFE = 130    # 오른쪽 안전여백 (YouTube 리액션 버튼 가림 방지)


def render(snap: dict, hist_port: list[float], hist_inv: list[float], start_date) -> bytes:
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img, "RGBA")

    color = RED if snap["pnl_krw"] >= 0 else BLUE
    sign  = "+" if snap["pnl_krw"] >= 0 else "-"
    arr   = "+" if snap["pnl_krw"] >= 0 else "-"

    # ─── 헤더 ──────────────────────────────────────────────
    draw.rectangle([0, 0, W, 128], fill=PALE)
    ct(draw, "특정일잔고", W // 2, 18, fnt(52, bold=True), BLACK)
    ct(draw, "매일 20만원 · TQQQ 적립 시뮬레이션", W // 2, 82, fnt(26), GRAY)
    draw.line([0, 128, W, 128], fill=LGRAY, width=2)

    # ─── 계좌행 ────────────────────────────────────────────
    Y = 128
    draw.rectangle([0, Y, W, Y + 92], fill=BG)
    draw.text((PAD, Y + 28), ACCOUNT_STR, font=fnt(34), fill=BLACK)
    draw.line([0, Y + 92, W, Y + 92], fill=LGRAY, width=1)

    # ─── 날짜행 ────────────────────────────────────────────
    Y = 220
    draw.rounded_rectangle([PAD, Y + 8, W - PAD, Y + 70], radius=8, outline=LGRAY, width=2)
    start_str = f"시작: {start_date.strftime('%Y.%m.%d')}"
    draw.text((PAD + 16, Y + 17), start_str, font=fnt(30), fill=GRAY)
    elapsed = (snap["date"] - start_date).days
    right_str = f"{snap['date'].strftime('%Y.%m.%d')}  D+{elapsed}일"
    rt(draw, right_str, W - PAD - 16, Y + 17, fnt(30), BLACK)
    draw.line([0, Y + 88, W, Y + 88], fill=LGRAY, width=2)

    # ─── 요약 박스 ─────────────────────────────────────────
    Y = 318
    BOX_H = 220
    draw.rounded_rectangle([PAD, Y, W - PAD, Y + BOX_H], radius=14, outline=LGRAY, width=2)

    # 총 평가손익 — 라벨(좌) · 금액(가운데) · 수익률(우) 한 줄
    draw.text((PAD + 24, Y + 38), "총 평가손익", font=fnt(34, bold=True), fill=BLACK)
    pnl_str = f"{sign}{fmt_krw(snap['pnl_krw'])}"
    ct(draw, pnl_str, W // 2, Y + 30, fnt(46, bold=True), color)
    pct_str = f"{sign}{abs(snap['pnl_pct']):.2f}%  {arr}"
    rt(draw, pct_str, W - PAD - 24, Y + 38, fnt(34, bold=True), color)

    # 구분선
    draw.line([PAD + 16, Y + 142, W - PAD - 16, Y + 142], fill=LGRAY, width=1)

    # 매입금액 / 평가금액
    Y2 = Y + 162
    draw.text((PAD + 24, Y2), "매입금액", font=fnt(30), fill=DGRAY)
    rt(draw, fmt_krw(snap["inv_krw"]), W // 2 - 24, Y2, fnt(30, bold=True), BLACK)
    draw.text((W // 2 + 24, Y2), "평가금액", font=fnt(30), fill=DGRAY)
    rt(draw, fmt_krw(snap["port_krw"]), W - PAD - 24, Y2, fnt(30, bold=True), BLACK)

    # ─── 종목 테이블 ────────────────────────────────────────
    # 5컬럼: 종목명 | 보유수량 | 매입가/현재가 | 수익금 | 수익률
    #  right-align 기준점:
    C_QTY = 442            # 보유수량 right-align (divider 452 바로 앞)
    C_PX  = 682            # 매입가/현재가 right-align (divider 692 바로 앞)
    C_PNL = W - RIGHT_SAFE # 수익금/수익률 right-align = 950

    TABLE_Y = 318 + BOX_H + 20
    TABLE_H = 196  # 헤더+데이터 합산 높이

    # 수직 구분선 (4컬럼 → 3개 선)
    for vx in [260, 452, 692]:
        draw.line([vx, TABLE_Y, vx, TABLE_Y + TABLE_H], fill=LGRAY, width=1)

    # 상단 구분선
    draw.line([0, TABLE_Y, W, TABLE_Y], fill=LGRAY, width=2)

    # 헤더 — 한 줄 (현재가를 "매입가/현재가"로 합쳐서 침범 없앰)
    TY = TABLE_Y + 16
    draw.text((PAD, TY), "종목명", font=fnt(26), fill=GRAY)
    rt(draw, "보유수량",     C_QTY, TY, fnt(26), GRAY)
    rt(draw, "매입가/현재가", C_PX,  TY, fnt(26), GRAY)
    rt(draw, "수익금/수익률", C_PNL, TY, fnt(26), GRAY)
    TY += 36

    # 헤더/데이터 구분선
    draw.line([0, TY, W, TY], fill=LGRAY, width=2)
    TY += 18

    # 종목명 (3줄)
    draw.text((PAD, TY),      "PROETF ULTRA", font=fnt(27, bold=True), fill=BLACK)
    draw.text((PAD, TY + 34), "PRO QQQ",      font=fnt(27, bold=True), fill=BLACK)
    draw.text((PAD, TY + 68), "TQQQ",         font=fnt(24), fill=GRAY)

    # 보유수량
    sv = snap["shares"]
    shares_str = f"{sv:,.1f}" if sv >= 1000 else (f"{sv:,.2f}" if sv >= 100 else f"{sv:.4f}")
    rt(draw, shares_str, C_QTY, TY + 30, fnt(28, bold=True), BLACK)

    # 매입가(위) / 현재가(아래) — 세로 쌓기
    def fmt_px(v: float) -> str:
        return f"${v:,.2f}" if v >= 100 else (f"${v:.4f}" if v >= 0.0001 else f"${v:.6f}")
    rt(draw, fmt_px(snap["avg_px"]), C_PX, TY + 8,  fnt(32, bold=True), BLACK)
    rt(draw, fmt_px(snap["px"]),     C_PX, TY + 50, fnt(32, bold=True), color)

    # 수익금(위) / 수익률(아래) — 세로 쌓기
    pnl_usd = snap["pnl_krw"] / EXCHANGE_RATE
    rt(draw, f"{sign}{abs(pnl_usd):,.2f}", C_PNL, TY + 8,  fnt(32, bold=True), color)
    rt(draw, f"{sign}{abs(snap['pnl_pct']):.2f}%", C_PNL, TY + 50, fnt(32, bold=True), color)

    # 하단 구분선
    draw.line([0, TY + 104, W, TY + 104], fill=LGRAY, width=1)

    # ─── 포트폴리오 차트 ───────────────────────────────────
    n = len(hist_port)
    if n >= 2:
        max_v = max(max(hist_port) * 1.05, TARGET_KRW * 1.05)
        min_v = 0.0

        def px_x(i):
            return PAD + int(i / (n - 1) * CHART_W)

        def px_y(v):
            return CHART_BOT - int((v - min_v) / (max_v - min_v) * CHART_H)

        # 목표선
        ty = px_y(TARGET_KRW)
        draw.line([PAD, ty, W - PAD, ty], fill=(*CTARGET, 160), width=2)
        rt(draw, "목표 10억", W - PAD - 8, ty - 34, fnt(24), CTARGET)

        # Y축 눈금
        for val in [2e8, 5e8, 10e8]:
            if val < max_v:
                vy = px_y(val)
                draw.line([PAD, vy, PAD + 18, vy], fill=LGRAY, width=1)
                draw.text((PAD + 24, vy - 14), f"{val/1e8:.0f}억", font=fnt(24), fill=GRAY)

        # 투자금 선 (회색)
        inv_pts = [(px_x(i), px_y(hist_inv[i])) for i in range(n)]
        if len(inv_pts) >= 2:
            draw.line(inv_pts, fill=(*LGRAY, 200), width=2)

        # 포트폴리오 채움
        port_pts = [(px_x(i), px_y(hist_port[i])) for i in range(n)]
        poly = port_pts + [(W - PAD, CHART_BOT), (PAD, CHART_BOT)]
        draw.polygon(poly, fill=(*CBLUE, 28))
        draw.line(port_pts, fill=CBLUE, width=3)

        # 현재 점
        lx, ly = port_pts[-1]
        draw.ellipse([lx - 8, ly - 8, lx + 8, ly + 8], fill=CBLUE)

    # ─── 하단: 달성률 바 ───────────────────────────────────
    progress = min(1.0, snap["port_krw"] / TARGET_KRW)
    BY = CHART_BOT + 28
    draw.rounded_rectangle([PAD, BY, W - PAD, BY + 22], radius=11, fill=LGRAY)
    fill_w = max(22, int((W - PAD * 2) * progress))
    draw.rounded_rectangle([PAD, BY, PAD + fill_w, BY + 22], radius=11, fill=CBLUE)
    ct(draw, f"목표 달성 {progress * 100:.1f}%", W // 2, BY + 38, fnt(26), DGRAY)

    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ════════════════════════════════════════════════════════════
# 영상 생성
# ════════════════════════════════════════════════════════════

def make_video(start_ym: str, out_path: Path):
    print(f"[1/3] 데이터 로드 중...")
    df = load_tqqq()

    print(f"[2/3] {start_ym} 시뮬레이션 중...")
    snaps = simulate(df, start_ym)
    total = len(snaps)
    print(f"      → {total}거래일 ({total/250:.1f}년)")

    # FPS 결정: 최대 MAX_SEC초 안에 담기
    fps = max(BASE_FPS, math.ceil(total / MAX_SEC))
    step = max(1, math.ceil(total / (MAX_SEC * fps)))
    frames_to_render = list(range(0, total, step))
    duration = len(frames_to_render) / fps
    print(f"      → FPS={fps}, step={step}, 예상길이={duration:.1f}초")

    out_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg", "-y",
        "-f", "image2pipe",
        "-vcodec", "png",
        "-r", str(fps),
        "-i", "-",
        "-vcodec", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "20",
        "-preset", "fast",
        "-movflags", "+faststart",
        str(out_path),
    ]

    print(f"[3/3] 영상 렌더링 중 → {out_path}")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

    start_date = snaps[0]["date"]
    last_frame: bytes | None = None

    for idx, i in enumerate(frames_to_render):
        snap = snaps[i]
        # 히스토리는 현재 인덱스까지
        hp = [snaps[j]["port_krw"] for j in range(0, i + 1, max(1, (i + 1) // 300))]
        hi = [snaps[j]["inv_krw"]  for j in range(0, i + 1, max(1, (i + 1) // 300))]
        frame = render(snap, hp, hi, start_date)
        proc.stdin.write(frame)
        last_frame = frame

        if idx % 100 == 0:
            pct = (idx + 1) / len(frames_to_render) * 100
            print(f"      {pct:5.1f}%  {snap['date'].strftime('%Y-%m-%d')}", end="\r")

    # 마지막 프레임 5초 고정
    if last_frame is not None:
        for _ in range(int(5 * fps)):
            proc.stdin.write(last_frame)

    proc.stdin.close()
    proc.wait()
    print(f"\n완료: {out_path}  ({out_path.stat().st_size / 1e6:.1f} MB)")


# ════════════════════════════════════════════════════════════
# 진입점
# ════════════════════════════════════════════════════════════

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--start", default="1971-02", help="코호트 시작월 (YYYY-MM)")
    p.add_argument("--out",   default=None,       help="출력 MP4 경로")
    args = p.parse_args()

    out = Path(args.out) if args.out else OUT_DIR / f"{args.start}.mp4"
    make_video(args.start, out)


if __name__ == "__main__":
    main()
