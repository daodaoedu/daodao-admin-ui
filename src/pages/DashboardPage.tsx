import { format, formatDistanceToNow, subDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Database,
  Eye,
  Flame,
  Hash,
  Heart,
  LogIn,
  Mail,
  MessageSquare,
  Server,
  Target,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { getActivityTimeline } from '@/api/admin-users'
import type { ActivityTimelineEvent, AdminUserListItem, RegistrationFlow } from '@/api/types'
import { DrillDownDrawer } from '@/components/DrillDownDrawer'
import { ExportButton } from '@/components/ExportButton'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { UserLink } from '@/components/UserLink'
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet'
import {
  useActiveUsersList,
  useActiveUsersTrend,
  useMetricDrillDown,
} from '@/hooks/useActiveUsersTrend'
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
import { useTodayRegistrations } from '@/hooks/useTodayRegistrations'
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

// ── Registration helpers ──────────────────────────────────
const REG_FLOW_LABEL: Record<RegistrationFlow, string> = {
  landing_page: 'Landing Page',
  quiz: '測驗',
  action_maker: 'Action Maker',
}

const TIMELINE_ICON: Partial<Record<ActivityTimelineEvent['type'], typeof LogIn>> = {
  login: LogIn,
  checkin: CheckCircle,
  practice: CheckCircle,
  persona: Users,
  view: Eye,
  reaction: Heart,
  comment: MessageSquare,
}

function relativeTime(ts: string | null | undefined) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: zhTW })
}

// ── Expandable user row inside drawer ────────────────────
function DrawerUserRow({ user }: { user: AdminUserListItem }) {
  const [expanded, setExpanded] = useState(false)
  const [timeline, setTimeline] = useState<ActivityTimelineEvent[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  function handleToggle() {
    if (!expanded && timeline.length === 0) {
      setTimelineLoading(true)
      getActivityTimeline(user.id, { limit: 5 })
        .then((r) => setTimeline(r.data.data))
        .catch(() => {})
        .finally(() => setTimelineLoading(false))
    }
    setExpanded((v) => !v)
  }

  const Arrow = expanded ? ChevronDown : ChevronRight

  return (
    <div className="rounded-lg transition-colors hover:bg-muted/50">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <UserLink userId={user.internalId} name={user.name ?? '未命名'} photoURL={user.photoURL} />
        <div className="ml-auto flex items-center gap-3">
          <div className="flex flex-col items-end gap-0.5">
            {user.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
            <span className="text-[10px] text-muted-foreground/70">
              {user.registrationFlow ? REG_FLOW_LABEL[user.registrationFlow] : '—'}
              {' · '}
              {relativeTime(user.lastActiveAt)}
            </span>
          </div>
          <Arrow className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-3">
          {timelineLoading ? (
            <p className="text-xs text-muted-foreground animate-pulse">載入活動紀錄...</p>
          ) : timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground">尚無活動紀錄</p>
          ) : (
            <div className="space-y-1.5 border-l-2 border-border pl-3">
              {timeline.map((ev) => {
                const Icon = TIMELINE_ICON[ev.type] ?? CheckCircle
                return (
                  <div key={ev.id} className="flex items-center gap-2 text-xs">
                    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="text-foreground">{ev.description}</span>
                    <span className="ml-auto text-muted-foreground whitespace-nowrap">
                      {format(new Date(ev.timestamp), 'HH:mm')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Today registrations drawer ───────────────────────────
function TodayRegistrationsDrawer({
  open,
  onOpenChange,
  users,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: AdminUserListItem[]
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">今日註冊用戶</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              共 {users.length} 位 · 點擊展開查看活動紀錄
            </p>
          </div>
          <SheetClose className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </SheetClose>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {users.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              今天還沒有新使用者註冊
            </p>
          ) : (
            <div className="space-y-1">
              {users.map((u) => (
                <DrawerUserRow key={u.id} user={u} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Drill-down types ─────────────────────────────────────
type DrillDownState =
  | { type: 'active'; title: string; date: string; period: 'day' | 'week' | 'month' }
  | { type: 'metric'; title: string; metric: string; period?: string }

// ── Main ──────────────────────────────────────────────────
export function DashboardPage() {
  const [regDrawerOpen, setRegDrawerOpen] = useState(false)
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null)
  const [preset, setPreset] = useState<DatePreset>('7')
  const days = Number(preset)
  const dateTo = format(new Date(), 'yyyy-MM-dd')
  const dateFrom = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')

  // Data fetching
  const {
    users: todayUsers,
    todayCount,
    changePercent: regChangePercent,
    isLoading: regLoading,
  } = useTodayRegistrations()
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

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const activeQuery = useMemo(
    () =>
      drillDown?.type === 'active' ? { date: drillDown.date, period: drillDown.period } : null,
    [drillDown],
  )
  const metricQuery = useMemo(
    () => (drillDown?.type === 'metric' ? drillDown.metric : null),
    [drillDown],
  )
  const metricPeriod = useMemo(
    () => (drillDown?.type === 'metric' ? drillDown.period : undefined),
    [drillDown],
  )
  const activeResult = useActiveUsersList(activeQuery)
  const metricResult = useMetricDrillDown(metricQuery, metricPeriod)

  const drillDownUsers = drillDown?.type === 'active' ? activeResult.data : metricResult.data
  const isDrillDownLoading =
    drillDown?.type === 'active' ? activeResult.isLoading : metricResult.isLoading
  const isDrillDownError =
    drillDown?.type === 'active' ? activeResult.isError : metricResult.isError

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

      {/* ── 今日新進 ─────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionLabel>今日新進</SectionLabel>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="今日註冊"
            value={regLoading ? '—' : todayCount}
            icon={UserPlus}
            change={regChangePercent}
            changeLabel="vs 昨天"
            description="今天完成註冊的新使用者人數，點擊查看清單"
            onClick={() => setRegDrawerOpen(true)}
          />
        </div>
      </div>

      <TodayRegistrationsDrawer
        open={regDrawerOpen}
        onOpenChange={setRegDrawerOpen}
        users={todayUsers}
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
            onClick={() =>
              setDrillDown({
                type: 'active',
                title: 'DAU — 今日活躍用戶',
                date: today,
                period: 'day',
              })
            }
          />
          <StatCard
            title="WAU"
            value={trend?.currentWau.toLocaleString() ?? '—'}
            icon={Users}
            change={trend?.wauChangePercent}
            changeLabel="vs 上期"
            description="Weekly Active Users：過去 7 天內有互動的不重複用戶數"
            onClick={() =>
              setDrillDown({
                type: 'active',
                title: 'WAU — 近 7 天活躍用戶',
                date: today,
                period: 'week',
              })
            }
          />
          <StatCard
            title="MAU"
            value={trend?.currentMau.toLocaleString() ?? '—'}
            icon={Users}
            change={trend?.mauChangePercent}
            changeLabel="vs 上期"
            description="Monthly Active Users：過去 30 天內有互動的不重複用戶數"
            onClick={() =>
              setDrillDown({
                type: 'active',
                title: 'MAU — 近 30 天活躍用戶',
                date: today,
                period: 'month',
              })
            }
          />
          <StatCard
            title="總用戶"
            value={onboarding?.totalUsers.toLocaleString() ?? '—'}
            icon={UserCheck}
            description="平台上所有註冊用戶總數"
            onClick={() => setDrillDown({ type: 'metric', title: '全部用戶', metric: 'all_users' })}
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
            onClick={() =>
              setDrillDown({ type: 'metric', title: '有迴響的用戶', metric: 'reactions', period })
            }
          />
          <StatCard
            title="留言"
            value={interaction?.current.comments.toLocaleString() ?? '—'}
            icon={MessageSquare}
            change={interaction?.changes.comments}
            changeLabel="vs 上期"
            description="所選期間內的留言總數"
            onClick={() =>
              setDrillDown({ type: 'metric', title: '有留言的用戶', metric: 'comments', period })
            }
          />
          <StatCard
            title="追蹤"
            value={interaction?.current.follows.toLocaleString() ?? '—'}
            icon={Users}
            change={interaction?.changes.follows}
            changeLabel="vs 上期"
            description="所選期間內的追蹤動作總數（用戶追蹤其他用戶或主題）"
            onClick={() =>
              setDrillDown({ type: 'metric', title: '有追蹤的用戶', metric: 'follows', period })
            }
          />
          <StatCard
            title="連結"
            value={interaction?.current.connects.toLocaleString() ?? '—'}
            icon={UserCheck}
            change={interaction?.changes.connects}
            changeLabel="vs 上期"
            description="所選期間內的互相連結數（雙向關係建立）"
            onClick={() =>
              setDrillDown({ type: 'metric', title: '有連結的用戶', metric: 'connects', period })
            }
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
            onClick={() =>
              setDrillDown({
                type: 'metric',
                title: '已完成 Badge 的用戶',
                metric: 'badge_completed',
              })
            }
          />
          <StatCard
            title="測驗完成率"
            value={pct(content?.quizSummary?.completionRate)}
            icon={Target}
            description="完成學習風格測驗（D/A/O/L/C 五型）的用戶比例"
            onClick={() =>
              setDrillDown({ type: 'metric', title: '已完成測驗的用戶', metric: 'quiz_completed' })
            }
          />
          <StatCard
            title="人物誌解鎖率"
            value={pct(personaStats?.unlockedRate)}
            icon={CheckCircle}
            description="回答至少 5 題人物誌問卷並解鎖個人人物誌的用戶比例"
            onClick={() =>
              setDrillDown({
                type: 'metric',
                title: '已解鎖人物誌的用戶',
                metric: 'persona_unlocked',
              })
            }
          />
          <StatCard
            title="平均主題實踐數"
            value={
              engagement?.practiceStats.avgPracticeCount !== undefined
                ? engagement.practiceStats.avgPracticeCount.toFixed(1)
                : '—'
            }
            icon={Target}
            description="有加入實踐的用戶中，平均每人加入的主題實踐數"
            onClick={() =>
              setDrillDown({ type: 'metric', title: '有加入實踐的用戶', metric: 'has_practices' })
            }
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
            onClick={() =>
              setDrillDown({ type: 'metric', title: '有使用 AI 的用戶', metric: 'ai_users' })
            }
          />
          <StatCard
            title="查詢次數"
            value={aiData.total_queries.toLocaleString()}
            icon={MessageSquare}
            description="所選時間範圍內，用戶發出的 AI 查詢總次數"
            onClick={() =>
              setDrillDown({ type: 'metric', title: '有使用 AI 的用戶', metric: 'ai_users' })
            }
          />
          <StatCard
            title="總 Tokens"
            value={formatTokens(totalTokens)}
            icon={Hash}
            description="Input tokens 與 Output tokens 的合計，反映 AI 使用量"
            onClick={() =>
              setDrillDown({ type: 'metric', title: '有使用 AI 的用戶', metric: 'ai_users' })
            }
          />
          <StatCard
            title="平均費用/次"
            value={`$${avgCostPerQuery.toFixed(5)}`}
            icon={Zap}
            description="每次 AI 查詢的平均費用（總費用 ÷ 查詢次數）"
            onClick={() =>
              setDrillDown({ type: 'metric', title: '有使用 AI 的用戶', metric: 'ai_users' })
            }
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

      {/* ── Drill-down drawer ─────────────────────────────── */}
      <DrillDownDrawer
        open={drillDown !== null}
        onOpenChange={(open) => {
          if (!open) setDrillDown(null)
        }}
        title={drillDown?.title ?? ''}
        users={drillDownUsers ?? []}
        isLoading={isDrillDownLoading}
        isError={isDrillDownError}
      />
    </div>
  )
}
