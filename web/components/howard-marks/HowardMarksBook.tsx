// 하워드 막스 『투자와 마켓 사이클의 법칙』 독서모임 정리에서 체크리스트에 없던 내용
// CycleChecklist.tsx 안에 끼워 넣는다.

const p = 'text-sm text-gray-700 dark:text-gray-300 leading-relaxed'
const quote = 'text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed border-l-4 border-gray-300 dark:border-gray-600 pl-3'

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

// 1. 경제·기업 이익의 기초 (p.75~130)
export function EconomyBasics() {
  return (
    <Card title="경제와 기업 이익 사이클의 기초" desc="책 p.75~130 — 사이클을 보기 전에 알아야 할 '정상 범위'">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-1.5">
          <p className="text-sm font-bold text-blue-800 dark:text-blue-300">경제의 장기 성장</p>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">경제 생산량 = 일하는 시간 × 시간당 생산량. 그래서 장기 성장은 출산율과 생산성 증가율로 정해지고, 이 둘은 해마다가 아니라 10년 단위로 서서히 변한다.</p>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 space-y-1.5">
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">미국 경제의 정상 범위</p>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">연간 성장률은 거의 항상 −2%~+5% 사이이고, 이 양 끝도 10년에 한 번 볼까 말까다. 성장률 추정의 출발점은 늘 플러스 — 뉴스가 자주 말하는 &lsquo;경기 침체&rsquo;는 흔한 일이 아니다.</p>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 space-y-1.5">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">이익은 경제보다 크게 출렁인다</p>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">기업 비용에는 매출과 상관없이 나가는 고정비가 있다. 그래서 매출이 조금만 늘거나 줄어도 이익은 훨씬 크게 늘고 준다. 경제 성장과 이익 증가의 관계는 매우 불완전하다.</p>
        </div>
      </div>
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <p className="text-sm font-bold text-gray-900 dark:text-white">주식의 합리적인 장기 수익률</p>
        <p className={p}>
          주식은 장기적으로 <b>배당 + 기업 이익 성장률</b>, 대략 한 자릿수 중후반대의 연 수익률을 주는 것이 합리적이다.
          한동안 수익률이 이보다 훨씬 높았다면, 그만큼 미래의 수익을 당겨 쓴 것이다 — 이후 수익률이 낮아지거나 마이너스가 될 가능성이 커진다.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          또 하나: 집값·주가가 오르면 사람들은 부자가 된 기분에 돈을 더 쓴다. 하지만 오른 자산을 실제로 팔아 쓰는 경우는 드물고, 상승은 일시적일 수 있다 — 자산 가격 상승이 씀씀이를 바꿀 합리적 이유는 아니다.
        </p>
      </div>
    </Card>
  )
}

// 2. 회의는 비관과 다르다
export function SkepticismNotPessimism() {
  return (
    <Card title="회의(의심)는 비관과 다르다" desc="책 p.187~193 — 의심의 방향은 시장 분위기의 반대쪽이어야 한다">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 space-y-1">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">🔥 낙관이 지나칠 때</p>
          <p className="text-lg font-black text-gray-900 dark:text-white">의심 + 비관</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">&ldquo;너무 좋아서 믿기 어려운 것은 대개 사실이 아니다.&rdquo; 가격에 낙관이 얼마나 들어 있는지 따져 본다 — 좋은 일은 이미 가격에 반영됐을 수 있다.</p>
        </div>
        <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-1">
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">❄️ 비관이 지나칠 때</p>
          <p className="text-lg font-black text-gray-900 dark:text-white">의심 + 낙관</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">&ldquo;너무 나빠서 사실일 수 없는 것도 있다.&rdquo; 모두가 끝없는 부정적 가정을 할 때, 그 가정 자체를 의심한다. 가격이 충분히 낮으면 추가 손실 가능성도 낮다.</p>
        </div>
      </div>
      <p className={quote}>패닉 상태에서 사람들은 엄청난 기회를 놓칠까봐 걱정해야 할 시간에, 손실을 없애는 데 시간을 100% 쓴다.</p>
    </Card>
  )
}

// 3. 투자자 4가지 유형 (p.348~354)
const investorTypes = [
  { name: '고르는 실력 없음', up: '시장만큼', down: '시장만큼', note: '오르는 종목과 내리는 종목의 비율이 시장과 같다. 시장이 좋으면 잘하고 나쁘면 못한다.', cls: 'border-gray-300 dark:border-gray-700' },
  { name: '실력 있음 + 늘 공격적', up: '시장보다 더 많이', down: '시장보다 더 많이', note: '오를 때 우수함이 드러나지만, 내릴 때는 그만큼 더 잃는다. 실력은 오를 때만 보인다.', cls: 'border-red-300 dark:border-red-700' },
  { name: '실력 있음 + 늘 방어적', up: '시장보다 조금 덜', down: '시장보다 덜', note: '내릴 때 실력이 빛나고, 오를 때도 고르는 실력 덕에 크게 뒤처지지 않는다.', cls: 'border-blue-300 dark:border-blue-700' },
  { name: '실력 있음 + 사이클 따라 조절', up: '시장보다 더 많이', down: '시장보다 덜', note: '적절한 때 시장 노출을 늘리고 줄인다. 오를 때 더 벌고 내릴 때 덜 잃는 — 가장 바람직한 비대칭.', cls: 'border-emerald-400 dark:border-emerald-600' },
]

export function InvestorFourTypes() {
  return (
    <Card title="투자자 4가지 유형" desc="책 p.348~354 — 종목 고르는 실력 × 공격·방어 태도에 따라 성과가 갈린다">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {investorTypes.map(t => (
          <div key={t.name} className={`rounded-xl border-2 p-4 space-y-2 ${t.cls}`}>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">오를 때: {t.up}</span>
              <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">내릴 때: {t.down}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{t.note}</p>
          </div>
        ))}
      </div>
      <p className={quote}>우수한 투자자들의 좋은 결과, 즉 오를 때 더 벌고 내릴 때 덜 잃는 분포를 만드는 가장 좋은 방법 중 하나는 시장의 경향을 내 편으로 만드는 것이다.</p>
    </Card>
  )
}

// 4. 너무 일찍 맞는 것은 틀린 것과 같다 / 5. 언제 하느냐
export function TimingAndPatience() {
  return (
    <>
      <Card title="너무 일찍 맞는 것은 틀린 것과 같다" desc="책 p.355~368 — 옳은 판단과 그것이 증명되는 날 사이의 긴 시간">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {[
            ['타당한 결론', '일어날 확률이 높은 일을 안다'],
            ['긴 시간 차이', '몇 달, 때로는 몇 년 — 그 사이 틀린 사람처럼 보인다'],
            ['증명', '실제로 일어난다'],
          ].map(([k, v], i) => (
            <div key={k} className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-center">
              <p className="text-xs font-black text-blue-600 dark:text-blue-400">{i + 1}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{k}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 break-keep">{v}</p>
            </div>
          ))}
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
          <li>이 시간 차이를 견디려면 <b>감정적으로 강해야</b> 한다. 처음에 기대만큼 오르지 않거나 반대로 가도, 포지션을 유지하거나 늘릴 만큼 자기 판단을 믿어야 한다.</li>
          <li>&ldquo;시대를 지나치게 앞선 것은 틀린 것과 다르지 않다.&rdquo; 판단이 옳았다는 게 확인되기까지 수년이 걸린 투자자들도 있었다.</li>
          <li><b>몇 년 뒤 내가 할 말을 떠올려 보라.</b> &ldquo;그때 왜 안 샀을까&rdquo; 또는 &ldquo;그때 왜 안 팔았을까&rdquo; — 그 말이 오늘 무엇을 해야 할지 알려준다.</li>
          <li>비결은 가장 뜨거운 종목을 찾거나 예측을 맞히는 게 아니라 <b>살아남는 것</b>이다. 그러려면 틀릴 수 있다는 것을 받아들여야 한다.</li>
        </ul>
      </Card>

      <Card title="같은 일도 언제 하느냐에 따라 다르다" desc="책 p.236~249 — 부동산 사이클로 본 타이밍">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 space-y-1.5">
            <p className="text-sm font-bold text-red-700 dark:text-red-300">호황기에 시작한 개발 사업</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">돈은 쉽게 빌려지고 다들 짓는다. 몇 년 뒤 완공될 때쯤 공급이 쏟아지고 경기가 꺾여 있다 — 위험의 원천이 된다.</p>
          </div>
          <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-1.5">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">불황기에 사들인 사업</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">불황기엔 아무도 짓지 않는다. 경기가 돌아오면 쓸 수 있는 건물이 거의 없어 임대료와 가격이 오른다 — 아주 높은 수익을 낸다.</p>
          </div>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
          <li>사람들은 자주 <b>다른 사람들이 무엇을 하는지</b> 고려하지 않고 결정한다. 모두가 같은 시기에 같은 일을 하면 그 자체가 위험이다.</li>
          <li>오크트리는 금융위기 뒤 &ldquo;주택 수요는 늘 그렇듯 사이클을 따르고 언젠가 회복된다&rdquo;며 사회적 통념을 거부했고, 극단에 있던 사이클이 보낸 신호대로 움직여 높은 수익을 냈다.</li>
        </ul>
        <p className={quote}>호황기에 프로젝트를 시작하면 위험의 근원이 될 수 있다. 반면 불황기에 프로젝트를 매수하면 아주 높은 수익을 올릴 수 있다. 모든 것은 당신이 무엇을 언제 하느냐에 달려 있다.</p>
      </Card>
    </>
  )
}
