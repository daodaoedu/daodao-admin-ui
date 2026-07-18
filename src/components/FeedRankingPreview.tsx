import { useState } from 'react'

export interface PreviewWeights {
  w_social: number
  w_engagement: number
  w_content: number
  w_decay: number
  w_freshness: number
  freshness_window_hours: number
  w_featured: number
}

export const SIGNAL_META = [
  {
    key: 'w_social' as const,
    color: '#0072b2',
    label: '社群親密度',
    desc: 'connection / follow / 互動次數，登入者的個人化核心',
  },
  {
    key: 'w_engagement' as const,
    color: '#e69f00',
    label: '互動熱度',
    desc: '(reaction + comment×2) ÷ 發布天數',
  },
  {
    key: 'w_content' as const,
    color: '#009e73',
    label: '內容完整度',
    desc: '有圖片、長文字、進度、模板等',
  },
  {
    key: 'w_decay' as const,
    color: '#56b4e9',
    label: '時間衰退',
    desc: '越舊分數越低（對數衰退）',
  },
  {
    key: 'w_freshness' as const,
    color: '#cc79a7',
    label: '新內容加分',
    desc: '發布當下加滿分，視窗內線性遞減至 0，獎勵新發布內容',
  },
  {
    key: 'w_featured' as const,
    color: '#7c4dbc',
    label: '精選加分',
    desc: '管理員標記的精選實踐固定加分（內容分析頁設定）；0 表示不影響排序',
  },
]

export const SIGNAL_COLORS: Record<string, string> = Object.fromEntries(
  SIGNAL_META.map((s) => [s.key, s.color]),
)

// ── 計分公式（對應 daodao-ai-backend feed_ranking.py）────────────
const freshnessBoost = (hours: number, w: PreviewWeights) =>
  w.freshness_window_hours > 0
    ? w.w_freshness * Math.max(0, 1 - hours / w.freshness_window_hours)
    : 0

const timeDecay = (days: number) => 1 / (1 + Math.log(1 + Math.max(days, 1)))

interface Contribution {
  w_social: number
  w_engagement: number
  w_content: number
  w_decay: number
  w_freshness: number
  w_featured: number
}

const total = (c: Contribution) =>
  c.w_social + c.w_engagement + c.w_content + c.w_decay + c.w_freshness + c.w_featured

/**
 * 三個示範情境（皆為陌生人的內容，social = 0、content 0.7）：
 * A：剛發布 1 小時、0 互動；B：3 天前發布、2 reactions + 1 comment；
 * C：5 天前發布的精選實踐、0 互動
 */
function scenarioScores(w: PreviewWeights): {
  fresh: Contribution
  hot: Contribution
  featured: Contribution
} {
  const fresh: Contribution = {
    w_social: 0,
    w_engagement: 0,
    w_content: w.w_content * 0.7,
    w_decay: w.w_decay * timeDecay(1),
    w_freshness: freshnessBoost(1, w),
    w_featured: 0,
  }
  const hot: Contribution = {
    w_social: 0,
    w_engagement: w.w_engagement * ((2 + 1 * 2) / 3),
    w_content: w.w_content * 0.7,
    w_decay: w.w_decay * timeDecay(3),
    w_freshness: freshnessBoost(72, w),
    w_featured: 0,
  }
  const featured: Contribution = {
    w_social: 0,
    w_engagement: 0,
    w_content: w.w_content * 0.7,
    w_decay: w.w_decay * timeDecay(5),
    w_freshness: freshnessBoost(120, w),
    w_featured: w.w_featured,
  }
  return { fresh, hot, featured }
}

// ── 遞減曲線 ────────────────────────────────────────────────
const VW = 560
const VH = 150
const PAD = { l: 40, r: 14, t: 16, b: 24 }
const X_MAX_HOURS = 168

function FreshnessCurve({ weights }: { weights: PreviewWeights }) {
  const [hover, setHover] = useState<number | null>(null)
  const wf = weights.w_freshness
  const win = weights.freshness_window_hours
  const yMax = Math.max(wf, 0.2) * 1.08
  const x = (h: number) => PAD.l + (h / X_MAX_HOURS) * (VW - PAD.l - PAD.r)
  const y = (v: number) => VH - PAD.b - (v / yMax) * (VH - PAD.t - PAD.b)

  const pts: string[] = []
  for (let h = 0; h <= X_MAX_HOURS; h += 2) {
    pts.push(`${x(h).toFixed(1)},${y(freshnessBoost(h, weights)).toFixed(1)}`)
  }
  const points = pts.join(' ')

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * VW
    const h = Math.round(
      Math.min(Math.max(((relX - PAD.l) / (VW - PAD.l - PAD.r)) * X_MAX_HOURS, 0), X_MAX_HOURS),
    )
    setHover(h)
  }

  const fresh = SIGNAL_COLORS.w_freshness
  const hoverV = hover !== null ? freshnessBoost(hover, weights) : 0

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full"
      role="img"
      aria-label="新內容加分隨發布小時數遞減的折線圖"
      onPointerMove={handleMove}
      onPointerLeave={() => setHover(null)}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (yMax / 4) * i
        return (
          <g key={i}>
            <line
              x1={PAD.l}
              x2={VW - PAD.r}
              y1={y(v)}
              y2={y(v)}
              className="stroke-border"
              strokeWidth="1"
            />
            <text
              x={PAD.l - 6}
              y={y(v) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px] font-mono"
            >
              {v.toFixed(2)}
            </text>
          </g>
        )
      })}
      {[0, 24, 48, 72, 96, 120, 144, 168].map((h) => (
        <text
          key={h}
          x={x(h)}
          y={VH - PAD.b + 14}
          textAnchor="middle"
          className="fill-muted-foreground text-[9px] font-mono"
        >
          {h}h
        </text>
      ))}
      {wf > 0 ? (
        <>
          <polyline
            points={points}
            fill="none"
            stroke={fresh}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line
            x1={x(win)}
            x2={x(win)}
            y1={PAD.t}
            y2={y(0)}
            stroke={fresh}
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.65"
          />
          <text
            x={x(win)}
            y={PAD.t - 4}
            textAnchor="middle"
            className="text-[9.5px] font-mono font-bold"
            fill={fresh}
          >
            視窗 {win}h
          </text>
          <circle cx={x(0)} cy={y(wf)} r="3.5" fill={fresh} />
          <text
            x={x(0) + 8}
            y={y(wf) - 6}
            className="text-[9.5px] font-mono font-bold"
            fill={fresh}
          >
            發布當下 +{wf.toFixed(2)}
          </text>
          {hover !== null && (
            <>
              <circle cx={x(hover)} cy={y(hoverV)} r="3.5" fill={fresh} />
              <text
                x={Math.min(Math.max(x(hover), PAD.l + 44), VW - PAD.r - 44)}
                y={Math.max(y(hoverV) - 9, 10)}
                textAnchor="middle"
                className="fill-foreground text-[9.5px] font-mono"
              >
                {hover}h：+{hoverV.toFixed(3)}
              </text>
            </>
          )}
        </>
      ) : (
        <text
          x={(PAD.l + VW - PAD.r) / 2}
          y={(PAD.t + VH - PAD.b) / 2}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          權重為 0：不獎勵新內容（原演算法行為）
        </text>
      )}
    </svg>
  )
}

// ── 分數對決 ────────────────────────────────────────────────
function ScoreDuel({ weights }: { weights: PreviewWeights }) {
  const { fresh, hot, featured } = scenarioScores(weights)
  const totalFresh = total(fresh)
  const totalHot = total(hot)
  const totalFeatured = total(featured)
  const maxT = Math.max(totalFresh, totalHot, totalFeatured, 0.9)
  const freshWins = totalFresh >= totalHot
  const diff = Math.abs(totalFresh - totalHot).toFixed(2)

  const Bar = ({
    contribution,
    title,
    subtitle,
    score,
  }: {
    contribution: Contribution
    title: string
    subtitle: string
    score: number
  }) => (
    <div className="grid grid-cols-[150px_1fr_52px] items-center gap-2">
      <div className="text-xs leading-snug">
        <span className="font-medium">{title}</span>
        <span className="block text-[10.5px] text-muted-foreground">{subtitle}</span>
      </div>
      <div className="flex h-5 overflow-hidden rounded bg-muted">
        {SIGNAL_META.filter((s) => contribution[s.key] > 0.001).map((s, i) => (
          <span
            key={s.key}
            title={`${s.label}：${contribution[s.key].toFixed(3)}`}
            className={i > 0 ? 'ml-0.5 h-full' : 'h-full'}
            style={{
              width: `${((contribution[s.key] / maxT) * 100).toFixed(2)}%`,
              backgroundColor: s.color,
            }}
          />
        ))}
      </div>
      <div className="text-right font-mono text-sm font-bold tabular-nums">{score.toFixed(2)}</div>
    </div>
  )

  return (
    <div className="space-y-2">
      <Bar
        contribution={fresh}
        title="🌱 剛發布的打卡"
        subtitle="1 小時前・有圖＋心得・0 互動"
        score={totalFresh}
      />
      <Bar
        contribution={hot}
        title="🔥 三天前的打卡"
        subtitle="2 reactions＋1 留言"
        score={totalHot}
      />
      <Bar
        contribution={featured}
        title="⭐ 五天前的精選實踐"
        subtitle="管理員精選・0 互動"
        score={totalFeatured}
      />
      <p
        className={`rounded-md px-3 py-1.5 text-xs font-medium ${
          freshWins ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
        }`}
      >
        {freshWins
          ? `此設定下新內容排在前面（領先 ${diff} 分）`
          : `此設定下舊熱門仍排在前面（領先 ${diff} 分）——可調高「新內容加分」`}
      </p>
    </div>
  )
}

// ── 對外元件 ────────────────────────────────────────────────
export function FeedRankingPreview({
  weights,
  showSignalGuide = false,
}: {
  weights: PreviewWeights
  showSignalGuide?: boolean
}) {
  return (
    <div className="space-y-4">
      {showSignalGuide && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {SIGNAL_META.map((s) => (
            <div key={s.key} className="flex items-start gap-2 text-xs">
              <span
                className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span>
                <span className="font-medium">{s.label}</span>
                <span className="ml-1 font-mono tabular-nums text-muted-foreground">
                  {weights[s.key].toFixed(2)}
                </span>
                <span className="block text-[10.5px] leading-snug text-muted-foreground">
                  {s.desc}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-sm align-baseline"
            style={{ backgroundColor: SIGNAL_COLORS.w_freshness }}
          />
          新內容加分隨發布時間遞減
        </p>
        <FreshnessCurve weights={weights} />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          兩則打卡的分數對決（依真實計分公式即時計算，滑鼠移到色段可看各訊號貢獻）
        </p>
        <ScoreDuel weights={weights} />
      </div>
    </div>
  )
}
