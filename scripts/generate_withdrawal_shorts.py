#!/usr/bin/env python3
"""
generate_withdrawal_shorts.py — 인출식 시뮬레이션 쇼츠 생성기

전략과 렌더러가 완전히 분리되어 있다.
전략이 바뀌면 simulate_*() 함수만 교체하면 된다.

사용법:
  python scripts/generate_withdrawal_shorts.py --start 1978-05
  python scripts/generate_withdrawal_shorts.py --start 1978-05 --strategy d10gk
  python scripts/generate_withdrawal_shorts.py --start 1978-05 --strategy s0
  python scripts/generate_withdrawal_shorts.py --start 1978-05 --out output/withdrawal/1978-05.mp4

전략 목록:
  d10gk  EMA200 15일 + RSI<30 + 이격도<-10% + Guyton-Klinger (현재 최선 후보)
  s0     EMA200 15일만 (기준선)
"""

import argparse
import math
import subprocess
import sys
from dataclasses import dataclass, field
from io import BytesIO
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont

# ════════════════════════════════════════════════════════════
# 경로
# ════════════════════════════════════════════════════════════
DATA_DIR = Path(__file__).parent.parent / "data"
OUT_DIR  = Path(__file__).parent.parent / "output" / "withdrawal"

# ════════════════════════════════════════════════════════════
# 캔버스 / 레이아웃 상수  (SHORTS_LAYOUT.md 참고)
# ════════════════════════════════════════════════════════════
W, H          = 1080, 1920
PAD           = 48
RIGHT_SAFE    = 130
C_RIGHT       = W - PAD - RIGHT_SAFE          # 텍스트 우측 끝 (= 902)
CHART_TOP     = 920
CHART_BOT     = 1500
MAX_SEC       = 65
BASE_FPS      = 30
FREEZE_SEC    = 5

# ════════════════════════════════════════════════════════════
# 색상 팔레트  (한국식: RED=수익, BLUE=손실)
# ════════════════════════════════════════════════════════════
BG       = (255, 255, 255)
BLACK    = (26,  26,  26)
DGRAY    = (80,  80,  80)
GRAY     = (136, 136, 136)
LGRAY    = (210, 210, 210)
PALE     = (248, 248, 248)
RED      = (204,   0,   0)
BLUE     = (  0,  51, 204)
GREEN    = ( 22, 163,  74)   # 시장 보유 중 배지
ORANGE   = (217, 119,   6)   # 현금 대피 중 배지
CLINE    = ( 37,  99, 235)   # 포트폴리오 차트 선
CREF     = (200,  50,  50)   # 초기 10억 기준선
CCASH    = (219, 234, 254)   # 현금 대피 구간 차트 배경

# ════════════════════════════════════════════════════════════
# 시뮬레이션 파라미터
# ════════════════════════════════════════════════════════════
INITIAL      = 1_000_000_000   # 초기 잔고 10억 원
SIM_YEARS    = 20
EXP_RATIO    = 0.0088          # TQQQ 연 운용비용
FEE_RATE     = 0.0005          # 매매 수수료
TAX_RATE     = 0.22
DEDUCTION    = 2_500_000
RP_SPREAD    = 0.005
RP_TAX_R     = 0.154
TIME_FILTER  = 15              # EMA200 연속 거래일 필터
DYN_THRS     = [1_000_000_000, 2_000_000_000]
DYN_RATES    = [0.003, 0.005, 0.007]
LIV_MAX      = 15_000_000      # 월 최대 인출 1500만원


# ════════════════════════════════════════════════════════════
# 스냅샷 데이터 구조 — 전략과 렌더러의 인터페이스
# 전략이 바뀌어도 이 필드 목록은 고정
# ════════════════════════════════════════════════════════════
@dataclass
class WSnap:
    date:        object   # datetime.date
    total:       float    # 총 잔고 (TQQQ + 현금, KRW)
    tqqq_val:    float    # TQQQ 평가액 (KRW)
    cash_val:    float    # 현금 합계 (운용현금 + 예비, KRW)
    monthly_cap: float    # 이번달 인출 상한 (KRW)
    cum_wd:      float    # 누적 인출 (KRW)
    in_market:   bool     # True=TQQQ 보유, False=현금 대피
    ndx3x_idx:   float    # TQQQ 합성 인덱스값 (차트용)
    ema200:      float    # EMA200 (차트용)


# ════════════════════════════════════════════════════════════
# 데이터 로딩
# ════════════════════════════════════════════════════════════
def load_data():
    ndx = (pd.read_csv(DATA_DIR / "ndx_1971_now.csv", parse_dates=["Date"])
             .sort_values("Date").reset_index(drop=True))
    # 1985-10 스플라이스 보정
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)

    # NDX 3x 합성 인덱스
    ret  = np.diff(closes) / closes[:-1]
    ret  = np.insert(ret, 0, 0.0)
    f3   = (1.0 + ret * 3.0) * (1.0 - EXP_RATIO / 252)
    f3[0]= 1.0
    ndx3x = 100.0 * np.cumprod(f3)

    # EMA200
    a200    = 2.0 / 201
    ema200  = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    # RSI14
    rsi14 = _compute_rsi(closes, 14)

    # 연준 금리 (RP 이자)
    import json
    fed_path = DATA_DIR / "fed_funds_rate.json"
    fed_rates = {}
    if fed_path.exists():
        with open(fed_path, encoding="utf-8") as f:
            fed_rates = {r["date"][:7]: float(r["rate"]) for r in json.load(f)}

    return ndx3x, closes, ema200, rsi14, dates, fed_rates


def _compute_rsi(closes, period):
    n   = len(closes)
    rsi = np.full(n, np.nan)
    if n < period + 1:
        return rsi
    deltas = np.diff(closes)
    gains  = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    ag, al = gains[:period].mean(), losses[:period].mean()
    for i in range(period, n - 1):
        ag = (ag * (period - 1) + gains[i]) / period
        al = (al * (period - 1) + losses[i]) / period
        rsi[i + 1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)
    return rsi


def _start_idx(dates, start_ym: str) -> int:
    year, month = int(start_ym[:4]), int(start_ym[5:])
    for i, d in enumerate(dates):
        if d.year == year and d.month == month:
            return i
    raise ValueError(f"시작월 {start_ym} 데이터 없음")


# ════════════════════════════════════════════════════════════
# 전략 A: S0 — EMA200 연속 15일만 (기준선)
# ════════════════════════════════════════════════════════════
def simulate_s0(start_ym: str, initial: float = INITIAL) -> list[WSnap]:
    ndx3x, closes, ema200, rsi14, dates, fed_rates = load_data()
    return _run_sim(start_ym, initial, ndx3x, closes, ema200, rsi14, dates, fed_rates,
                    rsi_thr=999, div_thr=-999, use_gk=False)


# ════════════════════════════════════════════════════════════
# 전략 B: D10GK — RSI<30 + 이격도<-10% + Guyton-Klinger
# ════════════════════════════════════════════════════════════
def simulate_d10gk(start_ym: str, initial: float = INITIAL) -> list[WSnap]:
    ndx3x, closes, ema200, rsi14, dates, fed_rates = load_data()
    return _run_sim(start_ym, initial, ndx3x, closes, ema200, rsi14, dates, fed_rates,
                    rsi_thr=30, div_thr=-0.10, use_gk=True)


# ════════════════════════════════════════════════════════════
# 공통 시뮬레이터 (전략 파라미터만 다름)
# ════════════════════════════════════════════════════════════
def _run_sim(start_ym, initial, ndx3x, closes, ema200, rsi14, dates, fed_rates,
             rsi_thr, div_thr, use_gk) -> list[WSnap]:
    n        = len(ndx3x)
    si       = _start_idx(dates, start_ym)
    sim_len  = min(n - si, int(SIM_YEARS * 252))

    # 초기 투자 상태
    e_init   = ema200[si]
    if (not np.isnan(e_init)) and closes[si] < e_init:
        is_invested, shares, cash = False, 0.0, float(initial)
    else:
        is_invested = True
        shares      = initial / ndx3x[si]
        cash        = 0.0

    cash_reserve = 0.0
    tax_reserve  = 0.0
    annual_gain  = 0.0
    last_tax_yr  = -1
    cum_wd       = 0.0
    gk_mult      = 1.0
    gk_init_cap  = 0.0
    gk_inited    = False
    gk_port_yr   = float(initial)

    last_mon     = None
    tday_in_mon  = 0
    mon_cap      = 0.0
    below_days   = 0
    above_days   = 0
    days_in_cash = 0

    snaps: list[WSnap] = []

    for j in range(sim_len):
        ci       = si + j
        cur_date = dates[ci].date()
        cur_mon  = (cur_date.year, cur_date.month)
        mon_key  = cur_date.strftime("%Y-%m")

        # ── 월초 처리 ──
        if cur_mon != last_mon:
            tday_in_mon = 0

            annual_rate = fed_rates.get(mon_key, 3.0)
            rp_mo = max(0.0, annual_rate / 100.0 - RP_SPREAD) / 12.0
            if cash_reserve > 0:
                g = cash_reserve * rp_mo
                cash_reserve += g * (1 - RP_TAX_R)
            if tax_reserve > 0:
                g = tax_reserve * rp_mo
                cash_reserve += g * (1 - RP_TAX_R)

            # 연말 정산
            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund     = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                tax_reserve = 0.0
                annual_gain = 0.0
                # GK 연간 조정
                if use_gk and gk_inited:
                    pv_now  = shares * ndx3x[ci] if is_invested else cash
                    port_now = pv_now + cash_reserve
                    yr_ret   = (port_now - gk_port_yr) / gk_port_yr if gk_port_yr > 0 else 0
                    if gk_init_cap > 0:
                        ratio = mon_cap / gk_init_cap
                        if ratio > 1.20:
                            gk_mult = max(0.50, gk_mult * 0.80)
                        elif ratio < 0.80 and yr_ret >= 0:
                            gk_mult = min(1.50, gk_mult * 1.10)
                    gk_port_yr = port_now

            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year
                pv_yr = shares * ndx3x[ci] if is_invested else cash
                gk_port_yr = pv_yr + cash_reserve

            # 인출 상한 계산
            pv_c    = shares * ndx3x[ci] if is_invested else cash
            total_c = pv_c + cash_reserve
            br      = (DYN_RATES[0] if total_c < DYN_THRS[0]
                       else DYN_RATES[1] if total_c < DYN_THRS[1]
                       else DYN_RATES[2])
            mon_cap = total_c * br
            if use_gk:
                mon_cap *= gk_mult
                if not gk_inited:
                    gk_init_cap = mon_cap
                    gk_inited   = True
            mon_cap = min(mon_cap, float(LIV_MAX))
            last_mon = cur_mon

        tday_in_mon += 1
        if not is_invested:
            days_in_cash += 1

        # ── EMA200 신호 ──
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        div    = 0.0
        if e200ok:
            div = (closes[ci] - e200) / e200
            if div < 0:
                below_days += 1; above_days  = 0
            elif div > 0:
                above_days += 1; below_days  = 0
            else:
                below_days = above_days = 0

        sell_sig = e200ok and below_days >= TIME_FILTER
        buy_sig  = e200ok and above_days >= TIME_FILTER

        # RSI 조기 재진입 (D10GK)
        if not is_invested and not buy_sig and rsi_thr < 100 and e200ok:
            rv = rsi14[ci]
            if not np.isnan(rv) and rv < rsi_thr and div <= div_thr:
                buy_sig = True

        # ── 매도 ──
        if is_invested and sell_sig:
            sv         = shares * ndx3x[ci]
            fee        = sv * FEE_RATE
            cash       = sv - fee
            shares     = 0.0
            is_invested = False
            below_days = 0
            days_in_cash = 0

        # ── 매수 ──
        elif not is_invested and buy_sig:
            fee        = cash * FEE_RATE
            shares     = (cash - fee) / ndx3x[ci]
            cash       = 0.0
            is_invested = True
            above_days = 0
            days_in_cash = 0

        # ── 월초 인출 ──
        if tday_in_mon == 1 and j > 0:
            if is_invested:
                pv      = shares * ndx3x[ci]
                wd_val  = min(mon_cap, pv)
                gain    = max(0.0, wd_val * (1 - 1 / (ndx3x[ci] / ndx3x[si])))
                annual_gain += gain
                tax_w       = gain * TAX_RATE
                tax_reserve += tax_w
                shares      = max(0.0, shares - wd_val / ndx3x[ci])
                cum_wd      += wd_val - tax_w
            else:
                wd_from_res = min(mon_cap, cash_reserve)
                cash_reserve -= wd_from_res
                cum_wd       += wd_from_res

        # ── 스냅샷 ──
        pv     = shares * ndx3x[ci] if is_invested else cash
        total  = pv + cash_reserve + tax_reserve
        snaps.append(WSnap(
            date        = cur_date,
            total       = total,
            tqqq_val    = shares * ndx3x[ci] if is_invested else 0.0,
            cash_val    = (cash if not is_invested else 0.0) + cash_reserve + tax_reserve,
            monthly_cap = mon_cap,
            cum_wd      = cum_wd,
            in_market   = is_invested,
            ndx3x_idx   = ndx3x[ci],
            ema200      = ema200[ci],
        ))

    return snaps


# ════════════════════════════════════════════════════════════
# 전략 레지스트리 — 전략 추가 시 여기만 수정
# ════════════════════════════════════════════════════════════
STRATEGIES = {
    'd10gk': simulate_d10gk,
    's0':    simulate_s0,
}


# ════════════════════════════════════════════════════════════
# 폰트 헬퍼
# ════════════════════════════════════════════════════════════
def fnt(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = "C:/Windows/Fonts/malgunbd.ttf" if bold else "C:/Windows/Fonts/malgun.ttf"
    return ImageFont.truetype(path, size)


def ct(draw, text, x, y, font, color):
    """가운데 정렬 텍스트"""
    bb = draw.textbbox((0, 0), text, font=font)
    w  = bb[2] - bb[0]
    draw.text((x - w // 2, y), text, font=font, fill=color)


def rt(draw, text, x, y, font, color):
    """우측 정렬 텍스트"""
    bb = draw.textbbox((0, 0), text, font=font)
    w  = bb[2] - bb[0]
    draw.text((x - w, y), text, font=font, fill=color)


def fmt_krw(v: float) -> str:
    return f"{math.floor(abs(v)):,}원"


def fmt_sign(v: float) -> tuple[str, tuple]:
    s = "+" if v >= 0 else "-"
    return f"{s}{fmt_krw(abs(v))}", (RED if v >= 0 else BLUE)


# ════════════════════════════════════════════════════════════
# 프레임 렌더러 — 전략을 모른다, 스냅샷만 받는다
# ════════════════════════════════════════════════════════════
def render_frame(snap: WSnap, history: list[WSnap], start_snap: WSnap,
                 strategy_label: str) -> bytes:
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    initial = float(INITIAL)
    gain    = snap.total - initial
    gain_pct = gain / initial * 100

    # ── 1. 헤더 (y=0~128) ──
    draw.rectangle([0, 0, W, 128], fill=PALE)
    ct(draw, "인출식 시뮬레이션", W // 2, 18, fnt(52, bold=True), BLACK)
    ct(draw, f"EMA200 동적 인출  ·  TQQQ  [{strategy_label.upper()}]",
       W // 2, 82, fnt(24), GRAY)
    draw.line([(0, 128), (W, 128)], fill=LGRAY, width=2)

    # ── 2. 날짜행 (y=128~220) ──
    start_date = start_snap.date
    elapsed    = (snap.date - start_date).days
    start_str  = f"시작: {start_date.strftime('%Y.%m.%d')}"
    curr_str   = f"{snap.date.strftime('%Y.%m.%d')}  D+{elapsed}일"
    draw.rounded_rectangle([PAD, 136, W - PAD, 206], radius=8, outline=LGRAY, width=1)
    draw.text((PAD + 16, 153), start_str, font=fnt(30), fill=GRAY)
    rt(draw, curr_str, W - PAD - 16, 153, fnt(30), BLACK)

    # ── 3. 상태 배지 + 잔고 (y=220~520) ──
    if snap.in_market:
        badge_bg  = (220, 252, 231)
        badge_txt = (22, 163, 74)
        badge_str = "시장 보유 중"
    else:
        badge_bg  = (254, 243, 199)
        badge_txt = (217, 119, 6)
        badge_str = "현금 대피 중"

    draw.rounded_rectangle([PAD, 228, PAD + 180, 270], radius=12, fill=badge_bg)
    draw.text((PAD + 12, 234), badge_str, font=fnt(26, bold=True), fill=badge_txt)

    # 잔고 (큰 숫자)
    total_str = f"{math.floor(snap.total):,}원"
    ct(draw, total_str, W // 2, 284, fnt(58, bold=True), BLACK)

    # 초기 대비 손익
    gain_str, gain_color = fmt_sign(gain)
    pct_str  = f"({'+' if gain_pct >= 0 else ''}{gain_pct:.1f}%)"
    ct(draw, f"{gain_str}  {pct_str}", W // 2, 358, fnt(34, bold=True), gain_color)

    draw.line([(PAD + 16, 420), (W - PAD - 16, 420)], fill=LGRAY, width=1)

    # ── 4. 인출 정보 (y=430~620) ──
    draw.text((PAD + 16, 434), "이번달 인출 상한", font=fnt(28), fill=DGRAY)
    rt(draw, f"{math.floor(snap.monthly_cap):,}원",
       C_RIGHT, 434, fnt(32, bold=True), BLACK)

    draw.text((PAD + 16, 490), "누적 인출 총액", font=fnt(28), fill=DGRAY)
    rt(draw, f"{math.floor(snap.cum_wd):,}원",
       C_RIGHT, 490, fnt(32, bold=True), RED)

    # TQQQ 평가 or 현금 표시
    if snap.in_market:
        draw.text((PAD + 16, 548), "TQQQ 평가액", font=fnt(28), fill=DGRAY)
        rt(draw, f"{math.floor(snap.tqqq_val):,}원",
           C_RIGHT, 548, fnt(32, bold=True), BLACK)
    else:
        draw.text((PAD + 16, 548), "현금 보유액", font=fnt(28), fill=DGRAY)
        rt(draw, f"{math.floor(snap.cash_val):,}원",
           C_RIGHT, 548, fnt(32, bold=True), BLUE)

    draw.line([(0, 620), (W, 620)], fill=LGRAY, width=2)

    # ── 5. 차트 (y=CHART_TOP~CHART_BOT) ──
    _draw_chart(draw, img, history, snap, initial)

    # ── 6. 누적 인출 바 (y=1520~) ──
    BY       = CHART_BOT + 28
    bar_w    = W - 2 * PAD
    ratio    = min(1.0, snap.cum_wd / initial)
    draw.rounded_rectangle([PAD, BY, W - PAD, BY + 22], radius=11, fill=LGRAY)
    if ratio > 0:
        draw.rounded_rectangle([PAD, BY, PAD + int(bar_w * ratio), BY + 22],
                                radius=11, fill=CLINE)
    label = f"누적 인출 {ratio * 100:.1f}%  (초기 10억 대비)"
    ct(draw, label, W // 2, BY + 32, fnt(26), DGRAY)

    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _draw_chart(draw, img, history: list[WSnap], snap: WSnap, initial: float):
    if not history:
        return

    CX1, CX2 = PAD, W - PAD
    CY1, CY2 = CHART_TOP, CHART_BOT
    cw, ch   = CX2 - CX1, CY2 - CY1

    vals   = [s.total for s in history]
    max_v  = max(max(vals) * 1.05, initial * 1.05)
    min_v  = min(min(vals) * 0.95, 0)

    def px(i):
        return CX1 + int(i / max(len(history) - 1, 1) * cw)

    def py(v):
        return CY2 - int((v - min_v) / (max_v - min_v) * ch)

    # 현금 대피 구간 음영
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    odraw   = ImageDraw.Draw(overlay)
    in_cash_start = None
    for i, s in enumerate(history):
        if not s.in_market and in_cash_start is None:
            in_cash_start = i
        elif s.in_market and in_cash_start is not None:
            odraw.rectangle([px(in_cash_start), CY1, px(i), CY2],
                            fill=(*CCASH, 120))
            in_cash_start = None
    if in_cash_start is not None:
        odraw.rectangle([px(in_cash_start), CY1, px(len(history) - 1), CY2],
                        fill=(*CCASH, 120))
    img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"),
              (0, 0))

    # 기준선 (초기 10억)
    ref_y = py(initial)
    if CY1 <= ref_y <= CY2:
        for x in range(CX1, CX2, 12):
            draw.line([(x, ref_y), (min(x + 6, CX2), ref_y)], fill=CREF, width=1)
        rt(draw, "초기 10억", CX2 - 4, ref_y - 20, fnt(22), CREF)

    # 포트폴리오 선
    pts = [(px(i), py(s.total)) for i, s in enumerate(history)]
    if len(pts) >= 2:
        draw.line(pts, fill=CLINE, width=3)

    # 현재 포인트
    cx_now = px(len(history) - 1)
    cy_now = py(snap.total)
    dot_color = GREEN if snap.in_market else ORANGE
    draw.ellipse([cx_now - 8, cy_now - 8, cx_now + 8, cy_now + 8], fill=dot_color)

    # Y축 눈금
    for yv in [5e8, 1e9, 2e9, 5e9, 1e10]:
        if min_v < yv < max_v:
            yp = py(yv)
            draw.line([(CX1, yp), (CX2, yp)], fill=(*LGRAY, 180), width=1)
            label = (f"{int(yv / 1e8)}억" if yv < 1e12
                     else f"{int(yv / 1e12)}조")
            draw.text((CX1 + 4, yp - 20), label, font=fnt(22), fill=GRAY)


# ════════════════════════════════════════════════════════════
# 영상 생성
# ════════════════════════════════════════════════════════════
def make_video(start_ym: str, out_path: Path, strategy: str = "d10gk"):
    if strategy not in STRATEGIES:
        print(f"ERROR: 전략 '{strategy}' 없음. 선택 가능: {list(STRATEGIES.keys())}")
        sys.exit(1)

    strategy_label = strategy
    print(f"[1/3] 시뮬레이션: {start_ym}  전략={strategy}")
    snaps = STRATEGIES[strategy](start_ym)
    if not snaps:
        print("ERROR: 시뮬레이션 결과 없음")
        sys.exit(1)

    total   = len(snaps)
    fps     = max(BASE_FPS, math.ceil(total / MAX_SEC))
    step    = max(1, total // (MAX_SEC * fps))
    indices = list(range(0, total, step))
    if indices[-1] != total - 1:
        indices.append(total - 1)

    out_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg", "-y",
        "-f", "image2pipe", "-vcodec", "png", "-r", str(fps),
        "-i", "pipe:0",
        "-vcodec", "libx264", "-pix_fmt", "yuv420p",
        "-crf", "20", "-preset", "fast",
        str(out_path),
    ]

    print(f"[2/3] 렌더링: {len(indices)}프레임  fps={fps}  전략={strategy}")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

    last_frame = None
    start_snap = snaps[0]
    for idx in indices:
        history  = snaps[: idx + 1]
        frame    = render_frame(snaps[idx], history, start_snap, strategy_label)
        last_frame = frame
        proc.stdin.write(frame)

    # 마지막 5초 고정
    for _ in range(int(FREEZE_SEC * fps)):
        proc.stdin.write(last_frame)

    proc.stdin.close()
    proc.wait()

    size_mb = out_path.stat().st_size / 1e6
    print(f"[3/3] 완료: {out_path}  ({size_mb:.1f} MB)")


# ════════════════════════════════════════════════════════════
# CLI
# ════════════════════════════════════════════════════════════
def main():
    p = argparse.ArgumentParser(description="인출식 시뮬레이션 쇼츠 생성기")
    p.add_argument("--start",    default="1978-05",
                   help="시뮬레이션 시작월 (YYYY-MM)")
    p.add_argument("--strategy", default="s0",
                   choices=list(STRATEGIES.keys()),
                   help="인출 전략 (기본: d10gk)")
    p.add_argument("--out",      default=None,
                   help="출력 MP4 경로 (기본: output/withdrawal/{start}.mp4)")
    args = p.parse_args()

    out = Path(args.out) if args.out else OUT_DIR / f"{args.start}.mp4"
    make_video(args.start, out, args.strategy)


if __name__ == "__main__":
    main()
