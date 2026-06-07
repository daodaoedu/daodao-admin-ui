import { formatDate } from 'date-fns'
import { Heart, Link2, MessageSquare, UserPlus } from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Select } from '@/components/ui/select'
import {
  useCommunityInteractionDetails,
  useCommunityInteractionStats,
} from '@/hooks/useCommunityMap'
import { useUserTags } from '@/hooks/useUserTags'

type Period = '7d' | '30d' | '90d'

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: '90d', label: '近 90 天' },
]

const CHART_COLORS = {
  reactions: 'var(--chart-1)',
  comments: 'var(--chart-2)',
  follows: 'var(--chart-3)',
  connects: 'var(--chart-4)',
}

const SERIES = [
  { key: 'reactions', label: '迴響', color: CHART_COLORS.reactions },
  { key: 'comments', label: '留言', color: CHART_COLORS.comments },
  { key: 'follows', label: '追蹤', color: CHART_COLORS.follows },
  { key: 'connects', label: '連結', color: CHART_COLORS.connects },
] as const

const REACTION_LABELS: Record<string, string> = {
  useful: '👍🏻 加油',
  touched: '💓 共鳴',
  fire: '🔥 啟發',
  curious: '🧐 好奇',
}

const PIE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--primary-lighter)',
  'var(--primary-darker)',
  'var(--primary-base)',
]

const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六']

const HOUR_BUCKETS = [
  { label: '凌晨\n0–3', hours: [0, 1, 2, 3] },
  { label: '清晨\n4–7', hours: [4, 5, 6, 7] },
  { label: '上午\n8–11', hours: [8, 9, 10, 11] },
  { label: '下午\n12–15', hours: [12, 13, 14, 15] },
  { label: '傍晚\n16–19', hours: [16, 17, 18, 19] },
  { label: '晚上\n20–23', hours: [20, 21, 22, 23] },
]

const CARD_CLASS = 'rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm'
const SECTION_TITLE_CLASS = 'text-base leading-none font-semibold tracking-tight text-foreground'
const LOADING_CLASS = 'flex h-40 items-center justify-center text-sm text-muted-foreground'
const EMPTY_CLASS = 'flex h-40 items-center justify-center text-sm text-muted-foreground'

const PERIOD_LABELS: Record<string, string> = {
  '7d': '近 7 天',
  '30d': '近 30 天',
  '90d': '近 90 天',
}

function SectionHeader({
  title,
  description,
  period,
}: {
  title: string
  description: string
  period?: Period
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
        {period && (
          <span className="inline-flex items-center rounded-full border border-[var(--admin-card-border)] bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {PERIOD_LABELS[period]}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function SectionLoading() {
  return <div className={LOADING_CLASS}>載入中…</div>
}

function SectionEmpty() {
  return <div className={EMPTY_CLASS}>尚無資料</div>
}

// ── Heatmap ──────────────────────────────────────────────────────────────────

function buildHeatmapGrid(
  heatmap: Array<{ dow: number; hour: number; count: number }>,
): number[][] {
  // grid[dow][bucketIdx]
  const grid: number[][] = Array.from({ length: 7 }, () => Array(6).fill(0))
  for (const cell of heatmap) {
    const bucketIdx = Math.floor(cell.hour / 4)
    const dow = cell.dow // 0=Sun
    grid[dow][bucketIdx] += cell.count
  }
  return grid
}

function HeatmapSection({
  heatmap,
  period,
}: {
  heatmap: Array<{ dow: number; hour: number; count: number }>
  period: Period
}) {
  const grid = buildHeatmapGrid(heatmap)
  const allCounts = grid.flat()
  const maxCount = Math.max(...allCounts, 1)

  return (
    <div className={CARD_CLASS}>
      <SectionHeader
        title="互動熱力圖"
        description="縱軸為星期（週日～週六），橫軸為時段（每格跨 4 小時）。顏色越深代表該時段互動（按讚＋留言）越多，可用來安排最佳發文或推播時機。"
        period={period}
      />
      {heatmap.length === 0 ? (
        <SectionEmpty />
      ) : (
        <div className="overflow-x-auto">
          <div className="mb-1 pl-10 text-[10px] text-muted-foreground/60 text-center tracking-wide">
            ← 時段（每格跨 4 小時） →
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="w-10 pr-2 text-right text-muted-foreground font-normal text-[10px]">
                  星期
                </th>
                {HOUR_BUCKETS.map((b) => (
                  <th
                    key={b.label}
                    className="px-1 pb-2 text-center text-muted-foreground font-medium whitespace-pre-line leading-tight"
                  >
                    {b.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOW_LABELS.map((dow, dowIdx) => (
                <tr key={dow}>
                  <td className="pr-2 py-0.5 text-right text-muted-foreground whitespace-nowrap">
                    週{dow}
                  </td>
                  {HOUR_BUCKETS.map((bucket, bucketIdx) => {
                    const count = grid[dowIdx][bucketIdx]
                    const intensity = count / maxCount
                    const alpha = count > 0 ? (intensity * 0.75 + 0.12).toFixed(2) : '0.04'
                    return (
                      <td key={bucket.label} className="px-1 py-0.5">
                        <div
                          title={`週${dow} ${HOUR_BUCKETS[bucketIdx].label.replace('\n', ' ')}: ${count} 次`}
                          className="h-7 w-full min-w-[36px] rounded cursor-default"
                          style={{
                            backgroundColor: `oklch(var(--primary) / ${alpha})`,
                          }}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>少</span>
            {[0.08, 0.2, 0.38, 0.58, 0.87].map((alpha) => (
              <div
                key={alpha}
                className="h-3 w-6 rounded"
                style={{ backgroundColor: `oklch(var(--primary) / ${alpha})` }}
              />
            ))}
            <span>多</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Engagement Funnel ─────────────────────────────────────────────────────────

function EngagementFunnelSection({
  funnel,
  commentReplyRate,
  period,
}: {
  funnel: { reactors: number; commenters: number; followers: number; connectors: number }
  commentReplyRate: number
  period: Period
}) {
  const steps = [
    { label: '迴響者', value: funnel.reactors, color: 'var(--primary-lighter)' },
    { label: '留言者', value: funnel.commenters, color: 'var(--primary-base)' },
    { label: '追蹤者', value: funnel.followers, color: 'var(--primary-darker)' },
    { label: '連結者', value: funnel.connectors, color: 'var(--chart-2)' },
  ]
  const maxVal = Math.max(...steps.map((s) => s.value), 1)

  return (
    <div className={CARD_CLASS}>
      <SectionHeader
        title="參與漏斗"
        description="從按讚到建立連結的參與深度——每一層代表更深的社群投入。「前一步 X%」表示從上一層留存到這層的比例，越高代表轉化越好。"
        period={period}
      />
      <div className="space-y-3">
        {steps.map((step, i) => {
          const pct = Math.round((step.value / maxVal) * 100)
          const prevVal = i > 0 ? steps[i - 1].value : step.value
          const dropPct = i > 0 && prevVal > 0 ? Math.round((step.value / prevVal) * 100) : 100

          return (
            <div key={step.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{step.label}</span>
                <span className="text-muted-foreground">
                  {step.value.toLocaleString()}
                  {i > 0 && <span className="ml-2 text-xs">（前一步 {dropPct}%）</span>}
                </span>
              </div>
              <div className="h-6 w-full overflow-hidden rounded bg-muted/40">
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${pct}%`, backgroundColor: step.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 rounded-lg bg-muted/30 px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-foreground">留言回覆率</span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              有多少留言是在回覆他人——比例越高，代表對話越活躍、社群凝聚力越強。
            </p>
          </div>
          <span className="ml-4 shrink-0 text-2xl font-bold tabular-nums text-foreground">
            {Math.round(commentReplyRate * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Top Content Table ─────────────────────────────────────────────────────────

const TYPE_BADGE_COLORS: Record<string, string> = {
  practice: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  checkin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  post: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  event: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_BADGE_COLORS[type] ?? 'bg-muted text-muted-foreground'
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>{type}</span>
  )
}

function TopContentSection({
  topContent,
  period,
}: {
  topContent: Array<{
    targetType: string
    targetId: number
    targetName: string
    reactions: number
    comments: number
    total: number
  }>
  period: Period
}) {
  if (topContent.length === 0) {
    return (
      <div className={CARD_CLASS}>
        <SectionHeader
          title="熱門內容 Top 10"
          description="本期按讚＋留言合計最高的內容，反映成員最感興趣的主題與形式，可作為後續選題的參考依據。"
          period={period}
        />
        <SectionEmpty />
      </div>
    )
  }

  return (
    <div className={CARD_CLASS}>
      <SectionHeader
        title="熱門內容 Top 10"
        description="本期按讚＋留言合計最高的內容，反映成員最感興趣的主題與形式，可作為後續選題的參考依據。"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-card-border)] text-xs text-muted-foreground">
              <th className="pb-2 text-left font-medium">類型</th>
              <th className="pb-2 text-left font-medium">內容</th>
              <th className="pb-2 text-right font-medium">迴響</th>
              <th className="pb-2 text-right font-medium">留言</th>
              <th className="pb-2 text-right font-medium">合計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-card-border)]">
            {topContent.slice(0, 10).map((item) => (
              <tr key={item.targetId} className="hover:bg-muted/20 transition-colors">
                <td className="py-2 pr-3">
                  <TypeBadge type={item.targetType} />
                </td>
                <td className="py-2 pr-3 max-w-[240px] truncate text-foreground">
                  {item.targetName}
                </td>
                <td className="py-2 text-right tabular-nums">{item.reactions.toLocaleString()}</td>
                <td className="py-2 text-right tabular-nums">{item.comments.toLocaleString()}</td>
                <td className="py-2 text-right font-semibold tabular-nums">
                  {item.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Top Users ─────────────────────────────────────────────────────────────────

function TopUsersList({
  title,
  users,
  metaLabel,
  metaKey,
}: {
  title: string
  users: Array<{ userId: number; name: string; avatarUrl: string | null; [key: string]: unknown }>
  metaLabel: string
  metaKey: string
}) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無資料</p>
      ) : (
        <ol className="space-y-2">
          {users.slice(0, 10).map((user, idx) => (
            <li key={user.userId} className="flex items-center gap-2 text-sm">
              <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {idx + 1}.
              </span>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="flex-1 truncate text-foreground">{user.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground text-xs">
                {(user[metaKey] as number).toLocaleString()} {metaLabel}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function CommunityMapPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [tagFilter, setTagFilter] = useState('all')
  const { data: availableTags = [] } = useUserTags()
  const { data, isLoading } = useCommunityInteractionStats(period)
  const { data: details, isLoading: detailsLoading } = useCommunityInteractionDetails(period)

  const current = data?.current
  const changes = data?.changes
  const trend = data?.trend ?? []

  const formattedTrend = trend.map((row) => ({
    ...row,
    label: formatDate(new Date(row.date), 'MM/dd'),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="社群互動分析"
        description="追蹤社群成員的互動行為，包含迴響、留言、追蹤與連結。"
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={tagFilter}
              onValueChange={setTagFilter}
              options={[
                { value: 'all', label: '全部標籤' },
                ...availableTags.map((t) => ({ value: String(t.id), label: t.name })),
              ]}
              triggerClassName="min-w-[120px]"
            />
            <div className="flex items-center rounded-lg border border-[var(--admin-card-border)] bg-muted/40 p-0.5">
              {PERIODS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    period === value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="迴響"
          value={isLoading ? '-' : (current?.reactions ?? 0)}
          change={changes?.reactions}
          changeLabel="vs 上一期"
          icon={Heart}
        />
        <StatCard
          title="留言"
          value={isLoading ? '-' : (current?.comments ?? 0)}
          change={changes?.comments}
          changeLabel="vs 上一期"
          icon={MessageSquare}
        />
        <StatCard
          title="追蹤"
          value={isLoading ? '-' : (current?.follows ?? 0)}
          change={changes?.follows}
          changeLabel="vs 上一期"
          icon={UserPlus}
        />
        <StatCard
          title="連結"
          value={isLoading ? '-' : (current?.connects ?? 0)}
          change={changes?.connects}
          changeLabel="vs 上一期"
          icon={Link2}
        />
      </div>

      {/* ── Trend Chart ── */}
      <div className={CARD_CLASS}>
        <SectionHeader
          title="互動趨勢"
          description="期間內每日的按讚、留言、追蹤、連結數量變化，可觀察互動高峰與低谷是否對應特定事件或內容發布。"
          period={period}
        />
        {isLoading ? (
          <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
            載入中…
          </div>
        ) : formattedTrend.length === 0 ? (
          <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
            尚無資料
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={formattedTrend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                {SERIES.map(({ key, color }) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'var(--foreground)', marginBottom: 4 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value) => SERIES.find((s) => s.key === value)?.label ?? value}
              />
              {SERIES.map(({ key, color }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${key})`}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Section A: Reaction Donut + Connection Funnel ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Reaction Type Donut */}
        <div className={CARD_CLASS}>
          <SectionHeader
            title="Reaction 類型分布"
            description="成員對內容使用的各種 Reaction 表情比例，反映社群的整體情緒氛圍與內容共鳴方式。"
            period={period}
          />
          {detailsLoading ? (
            <SectionLoading />
          ) : !details?.reactionTypes?.length ? (
            <SectionEmpty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={details.reactionTypes}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {details.reactionTypes.map((entry, index) => (
                    <Cell key={entry.type} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    REACTION_LABELS[name] ?? name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => REACTION_LABELS[value] ?? value}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Connection Funnel */}
        <div className={CARD_CLASS}>
          <SectionHeader
            title="連結請求漏斗"
            description="成員互相發出配對請求的轉化狀況。接受率高代表媒合品質好；待處理數多代表有人還沒回應，可考慮發送提醒通知。"
            period={period}
          />
          {detailsLoading ? (
            <SectionLoading />
          ) : !details?.connectionFunnel ? (
            <SectionEmpty />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: '總請求',
                    value: details.connectionFunnel.requests,
                    color: 'text-foreground',
                  },
                  {
                    label: '已接受',
                    value: details.connectionFunnel.accepted,
                    color: 'text-green-600 dark:text-green-400',
                  },
                  {
                    label: '已拒絕',
                    value: details.connectionFunnel.rejected,
                    color: 'text-red-500 dark:text-red-400',
                  },
                  {
                    label: '待處理',
                    value: details.connectionFunnel.pending,
                    color: 'text-yellow-600 dark:text-yellow-400',
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-muted/30 px-3 py-3 text-center">
                    <div className={`text-2xl font-bold tabular-nums ${item.color}`}>
                      {item.value.toLocaleString()}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-muted/30 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">接受率</span>
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    details.connectionFunnel.acceptRate >= 0.5
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {Math.round(details.connectionFunnel.acceptRate * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section B: Engagement Funnel ── */}
      {detailsLoading ? (
        <div className={CARD_CLASS}>
          <SectionHeader title="參與漏斗" description="" period={period} />
          <SectionLoading />
        </div>
      ) : details?.engagementFunnel ? (
        <EngagementFunnelSection
          funnel={details.engagementFunnel}
          commentReplyRate={details.commentReplyRate ?? 0}
          period={period}
        />
      ) : null}

      {/* ── Section C: Heatmap ── */}
      {detailsLoading ? (
        <div className={CARD_CLASS}>
          <SectionHeader title="互動熱力圖" description="" period={period} />
          <SectionLoading />
        </div>
      ) : (
        <HeatmapSection heatmap={details?.heatmap ?? []} period={period} />
      )}

      {/* ── Section D: Top Content ── */}
      {detailsLoading ? (
        <div className={CARD_CLASS}>
          <SectionHeader title="熱門內容 Top 10" description="" period={period} />
          <SectionLoading />
        </div>
      ) : (
        <TopContentSection topContent={details?.topContent ?? []} period={period} />
      )}

      {/* ── Section E: Top Users ── */}
      <div className={CARD_CLASS}>
        <SectionHeader
          title="活躍用戶排行"
          description="本期互動最多的成員（左）與被最多人追蹤的成員（右）。這兩份名單有助於識別社群中的關鍵推動者與意見領袖。"
          period={period}
        />
        {detailsLoading ? (
          <SectionLoading />
        ) : (
          <div className="flex flex-col gap-8 sm:flex-row">
            <TopUsersList
              title="最活躍用戶"
              users={details?.topActiveUsers ?? []}
              metaLabel="次互動"
              metaKey="interactions"
            />
            <div className="hidden sm:block w-px bg-[var(--admin-card-border)]" />
            <TopUsersList
              title="最多追蹤"
              users={details?.topFollowedUsers ?? []}
              metaLabel="位追蹤者"
              metaKey="followers"
            />
          </div>
        )}
      </div>
    </div>
  )
}
