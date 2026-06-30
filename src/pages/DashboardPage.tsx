import { format, subDays } from 'date-fns'
import {
  CheckCircle,
  CircleDollarSign,
  Database,
  Flame,
  Hash,
  Mail,
  MessageSquare,
  Server,
  Target,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ExportButton } from '@/components/ExportButton'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { useActiveUsersTrend } from '@/hooks/useActiveUsersTrend'
import { useCommunityInteractionStats } from '@/hooks/useCommunityMap'
import { useContentPerformance } from '@/hooks/useContentPerformance'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useEmailHealth } from '@/hooks/useEmailManagement'
import {
  useEngagementStats,
  useOnboardingStats,
  usePersonaStats,
} from '@/hooks/useOnboardingAnalytics'
import { useDbInfo, useRedisInfo } from '@/hooks/useSystemMonitor'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────
type DatePreset = '1' | '7' | '30'

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: '今天', value: '1' },
  { label: '7 天', value: '7' },
  { label: '30 天', value: '30' },
]

// ── Service health ────────────────────────────────────────
const getServiceStatus = (status?: string) =>
  status === 'connected' ? ('healthy' as const) : status ? ('down' as const) : ('degraded' as const)

const SERVICE_CONFIG = [
  { key: 'email' as const, label: '郵件', icon: Mail },
  { key: 'db' as const, label: '資料庫', icon: Database },
  { key: 'redis' as const, label: '快取', icon: Server },
]

const STATUS_STYLES = {
  healthy: 'bg-success/15 text-success',
  degraded: 'bg-warning/15 text-warning',
  down: 'bg-destructive/15 text-destructive',
} as const

const STATUS_LABELS = { healthy: '正常', degraded: '降級', down: '異常' } as const

// ── Helpers ───────────────────────────────────────────────
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function pct(n: number | undefined, decimals = 1): string {
  if (n === undefined) return '—'
  return `${n.toFixed(decimals)}%`
}

// ── Section label ─────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
      {children}
    </p>
  )
}

// ── Skeleton ──────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 rounded bg-muted" />
      {(['user', 'community', 'content', 'ai'] as const).map((section) => (
        <div key={section} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(['a', 'b', 'c', 'd'] as const).map((slot) => (
            <div
              key={`${section}-${slot}`}
              className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm"
            >
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="mt-2 h-7 w-28 rounded bg-muted" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export function DashboardPage() {
  const [preset, setPreset] = useState<DatePreset>('7')
  const days = Number(preset)
  const dateTo = format(new Date(), 'yyyy-MM-dd')
  const dateFrom = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')

  // Data fetching
  const { data: aiData, isLoading, error } = useDashboardStats(dateFrom, dateTo)
  const { data: userTrend } = useActiveUsersTrend({ days })
  const period = preset === '30' ? '30d' : '7d'
  const { data: content } = useContentPerformance()
  const { data: interaction } = useCommunityInteractionStats(period)
  const { data: onboarding } = useOnboardingStats()
  const { data: engagement } = useEngagementStats()
  const { data: personaStats } = usePersonaStats()
  const { data: emailHealth } = useEmailHealth()
  const { data: dbInfo } = useDbInfo()
  const { data: redisInfo } = useRedisInfo()

  if (isLoading) return <DashboardSkeleton />
  if (error || !aiData) return <div className="text-destructive">載入失敗</div>

  // AI derived
  const totalTokens = aiData.total_input_tokens + aiData.total_output_tokens
  const avgCostPerQuery =
    aiData.total_queries > 0 ? Number(aiData.total_cost_usd) / aiData.total_queries : 0

  // User trend summary
  const trend = userTrend?.summary

  // Content / checkin
  const checkin = content?.checkinSummary

  // System health
  const serviceStatus = {
    email: getServiceStatus(emailHealth?.status),
    db: getServiceStatus(dbInfo?.status),
    redis: getServiceStatus(redisInfo?.status),
  }
  const allHealthy = Object.values(serviceStatus).every((s) => s === 'healthy')

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        description="社群核心指標一覽"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border bg-background">
              {DATE_PRESETS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPreset(value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    preset === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <ExportButton
              data={
                [
                  { label: 'DAU', value: trend?.currentDau ?? '—' },
                  { label: 'WAU', value: trend?.currentWau ?? '—' },
                  { label: 'MAU', value: trend?.currentMau ?? '—' },
                  { label: '總用戶', value: onboarding?.totalUsers ?? '—' },
                  { label: '本週打卡', value: checkin?.last7Days ?? '—' },
                  {
                    label: 'AI 總費用 (USD)',
                    value: `$${Number(aiData.total_cost_usd).toFixed(4)}`,
                  },
                  { label: 'AI 查詢次數', value: aiData.total_queries },
                ] as unknown as Record<string, unknown>[]
              }
              columns={[
                { key: 'label', header: '指標' },
                { key: 'value', header: '數值' },
              ]}
              fileName="dashboard-kpi"
            />
          </div>
        }
      />

      {/* ── 用戶活躍 ─────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionLabel>用戶活躍</SectionLabel>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="DAU"
            value={trend?.currentDau.toLocaleString() ?? '—'}
            icon={Users}
            change={trend?.dauChangePercent}
            changeLabel="vs 上期"
            description="Daily Active Users：當日至少有一次互動的用戶數"
          />
          <StatCard
            title="WAU"
            value={trend?.currentWau.toLocaleString() ?? '—'}
            icon={Users}
            change={trend?.wauChangePercent}
            changeLabel="vs 上期"
            description="Weekly Active Users：過去 7 天內有互動的不重複用戶數"
          />
          <StatCard
            title="MAU"
            value={trend?.currentMau.toLocaleString() ?? '—'}
            icon={Users}
            change={trend?.mauChangePercent}
            changeLabel="vs 上期"
            description="Monthly Active Users：過去 30 天內有互動的不重複用戶數"
          />
          <StatCard
            title="總用戶"
            value={onboarding?.totalUsers.toLocaleString() ?? '—'}
            icon={UserCheck}
            description="平台上所有已完成 Onboarding 流程的用戶總數"
          />
        </div>
      </div>

      {/* ── 社群互動 ─────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionLabel>社群互動</SectionLabel>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="迴響"
            value={interaction?.current.reactions.toLocaleString() ?? '—'}
            icon={Flame}
            change={interaction?.changes.reactions}
            changeLabel="vs 上期"
            description="所選期間內的迴響總數（對打卡、內容等的情感迴響）"
          />
          <StatCard
            title="留言"
            value={interaction?.current.comments.toLocaleString() ?? '—'}
            icon={MessageSquare}
            change={interaction?.changes.comments}
            changeLabel="vs 上期"
            description="所選期間內的留言總數"
          />
          <StatCard
            title="追蹤"
            value={interaction?.current.follows.toLocaleString() ?? '—'}
            icon={Users}
            change={interaction?.changes.follows}
            changeLabel="vs 上期"
            description="所選期間內的追蹤動作總數（用戶追蹤其他用戶或主題）"
          />
          <StatCard
            title="連結"
            value={interaction?.current.connects.toLocaleString() ?? '—'}
            icon={UserCheck}
            change={interaction?.changes.connects}
            changeLabel="vs 上期"
            description="所選期間內的互相連結數（雙向關係建立）"
          />
        </div>
      </div>

      {/* ── 內容 ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionLabel>內容</SectionLabel>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Onboarding 完成率"
            value={pct(onboarding?.badgeGrantedRate)}
            icon={CheckCircle}
            description="完成所有 Onboarding 任務並獲得徽章的用戶比例"
          />
          <StatCard
            title="測驗完成率"
            value={pct(content?.quizSummary?.completionRate)}
            icon={Target}
            description="完成學習風格測驗（D/A/O/L/C 五型）的用戶比例"
          />
          <StatCard
            title="人物誌解鎖率"
            value={pct(personaStats?.unlockedRate)}
            icon={CheckCircle}
            description="完成人物誌問卷（persona_answers）並解鎖個人人物誌的用戶比例"
          />
          <StatCard
            title="平均主題實踐數"
            value={
              engagement?.practiceStats.avgPracticeCount !== undefined
                ? engagement.practiceStats.avgPracticeCount.toFixed(1)
                : '—'
            }
            icon={Target}
            description="每位用戶平均加入的主題實踐數，反映用戶的內容參與深度"
          />
        </div>
      </div>

      {/* ── AI 使用 ───────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionLabel>AI 使用</SectionLabel>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="總費用 (USD)"
            value={`$${(Number(aiData.total_cost_usd) || 0).toFixed(4)}`}
            icon={CircleDollarSign}
            description="所選時間範圍內，所有 AI 後端（OpenAI、Gemini 等）的合計費用"
          />
          <StatCard
            title="查詢次數"
            value={aiData.total_queries.toLocaleString()}
            icon={MessageSquare}
            description="所選時間範圍內，用戶發出的 AI 查詢總次數"
          />
          <StatCard
            title="總 Tokens"
            value={formatTokens(totalTokens)}
            icon={Hash}
            description="Input tokens 與 Output tokens 的合計，反映 AI 使用量"
          />
          <StatCard
            title="平均費用/次"
            value={`$${avgCostPerQuery.toFixed(5)}`}
            icon={Zap}
            description="每次 AI 查詢的平均費用（總費用 ÷ 查詢次數）"
          />
        </div>
      </div>

      {/* ── Charts ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">每日查詢趨勢</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={aiData.daily_series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="query_count"
                stroke="var(--primary)"
                name="查詢次數"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total_tokens"
                stroke="var(--success)"
                name="Tokens"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">各 Backend 費用</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={aiData.by_backend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="backend" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${Number(v).toFixed(5)}`, '費用']} />
              <Bar dataKey="cost_usd" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 系統健康 ─────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 px-5 py-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SectionLabel>系統健康</SectionLabel>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
              allHealthy ? STATUS_STYLES.healthy : STATUS_STYLES.degraded,
            )}
          >
            <CheckCircle className="h-3 w-3" />
            {allHealthy ? '全部正常' : '部分異常'}
          </span>
          <div className="h-3.5 w-px bg-border" />
          {SERVICE_CONFIG.map(({ key, label, icon: Icon }) => {
            const status = serviceStatus[key]
            return (
              <span
                key={key}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  STATUS_STYLES[status],
                )}
              >
                <Icon className="h-3 w-3" />
                {label}：{STATUS_LABELS[status]}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
