import { format, parseISO, subDays } from 'date-fns'
import {
  Activity,
  Award,
  BookOpen,
  CalendarDays,
  Flame,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LearningStyleType } from '@/api/types'
import { DrillDownDrawer } from '@/components/DrillDownDrawer'
import { ExportButton } from '@/components/ExportButton'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useActiveUsersFunnel,
  useActiveUsersList,
  useActiveUsersTrend,
  useMetricDrillDown,
  useUserCohortRetention,
} from '@/hooks/useActiveUsersTrend'
import {
  useEngagementStats,
  useOnboardingStats,
  useQuizAnalyticsStats,
} from '@/hooks/useOnboardingAnalytics'
import { cn } from '@/lib/utils'

const COHORT_COLUMNS = ['Day 1', 'Day 7', 'Day 14', 'Day 30', 'Day 60', 'Day 90']

const ROLE_ORDER: LearningStyleType[] = ['D', 'A', 'O', 'L', 'C']

const ROLE_META: Record<LearningStyleType, { label: string; color: string; textColor: string }> = {
  D: { label: '探究者（探探島）', color: '#78C8E8', textColor: '#1a5a7a' },
  A: { label: '行動者（動動島）', color: '#F5A01A', textColor: '#fff' },
  O: { label: '結構者（構構島）', color: '#2BADA0', textColor: '#fff' },
  L: { label: '流動者（跨跨島）', color: '#E86B2A', textColor: '#fff' },
  C: { label: '連結者（連連島）', color: '#F0D020', textColor: '#7a5c00' },
}

function formatTrendDate(value: string) {
  const date = parseISO(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MM/dd')
}

function formatNumber(value?: number) {
  return (value ?? 0).toLocaleString()
}

function retentionBg(pct: number): string {
  if (pct >= 80) return 'bg-success/70 text-primary-foreground'
  if (pct >= 60) return 'bg-success/60 text-primary-foreground'
  if (pct >= 40) return 'bg-success text-primary-foreground'
  if (pct >= 25) return 'text-success text-foreground'
  if (pct >= 15) return 'text-success text-foreground'
  return 'text-success text-foreground'
}

type DrillDownState =
  | { type: 'active'; title: string; date: string; period: 'day' | 'week' | 'month' }
  | { type: 'metric'; title: string; metric: string }

export function UserAnalyticsPage() {
  const defaultDateFrom = useMemo(() => format(subDays(new Date(), 29), 'yyyy-MM-dd'), [])
  const defaultDateTo = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const [dateFrom, setDateFrom] = useState(defaultDateFrom)
  const [dateTo, setDateTo] = useState(defaultDateTo)

  const trendQuery = useMemo(() => {
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(defaultDateFrom)
    const toDate = dateTo ? new Date(dateTo) : new Date(defaultDateTo)
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
      return { startDate: defaultDateFrom, endDate: defaultDateTo }
    }
    return { startDate: format(fromDate, 'yyyy-MM-dd'), endDate: format(toDate, 'yyyy-MM-dd') }
  }, [dateFrom, dateTo, defaultDateFrom, defaultDateTo])

  const {
    data: trendData,
    isLoading: isTrendLoading,
    isError: isTrendError,
  } = useActiveUsersTrend(trendQuery)

  const {
    data: funnelData,
    isLoading: isFunnelLoading,
    isError: isFunnelError,
  } = useActiveUsersFunnel(trendQuery)

  const {
    data: cohortData,
    isLoading: isCohortLoading,
    isError: isCohortError,
  } = useUserCohortRetention(trendQuery)

  const { data: onboardingStats } = useOnboardingStats()
  const { data: quizStats } = useQuizAnalyticsStats()
  const { data: engagementStats } = useEngagementStats()

  const summary = trendData?.summary

  const trendRows = useMemo(
    () =>
      (trendData?.data ?? []).map((item) => ({
        date: formatTrendDate(item.date),
        dau: item.dau,
        wau: item.wau,
        mau: item.mau,
      })),
    [trendData],
  )

  const funnelStages = useMemo(() => {
    if (!funnelData?.steps?.length) return []
    return funnelData.steps
  }, [funnelData])

  const funnelBase = useMemo(() => funnelStages[0]?.value || 1, [funnelStages])

  const cohortRows = useMemo(() => {
    if (!cohortData?.rows?.length) return []
    return cohortData.rows.map((row) => ({
      period: row.label || '未知週期',
      values: [row.day1, row.day7, row.day14, row.day30, row.day60, row.day90],
    }))
  }, [cohortData])

  const retentionRows = useMemo(() => engagementStats?.retentionByDay ?? [], [engagementStats])

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null)

  const activeQuery = useMemo(
    () =>
      drillDown?.type === 'active' ? { date: drillDown.date, period: drillDown.period } : null,
    [drillDown],
  )
  const metricQuery = useMemo(
    () => (drillDown?.type === 'metric' ? drillDown.metric : null),
    [drillDown],
  )

  const activeResult = useActiveUsersList(activeQuery)
  const metricResult = useMetricDrillDown(metricQuery)

  const drillDownUsers = drillDown?.type === 'active' ? activeResult.data : metricResult.data
  const isDrillDownLoading =
    drillDown?.type === 'active' ? activeResult.isLoading : metricResult.isLoading
  const isDrillDownError =
    drillDown?.type === 'active' ? activeResult.isError : metricResult.isError

  const exportColumns = [
    { key: 'date', header: '日期' },
    { key: 'dau', header: 'DAU' },
    { key: 'wau', header: 'WAU' },
    { key: 'mau', header: 'MAU' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="用戶分析"
        description="深入分析用戶行為、留存率、活躍週期與成長趨勢，支援數據驅動決策。"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <ExportButton
              data={trendRows as unknown as Record<string, unknown>[]}
              columns={exportColumns}
              fileName="user_analytics"
            />
          </div>
        }
      />

      {/* Section 1: DAU / WAU / MAU */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="DAU (日活躍)"
          description="Daily Active Users：當日至少登入或操作一次的用戶數"
          value={formatNumber(summary?.currentDau)}
          change={summary?.dauChangePercent ?? 0}
          changeLabel="vs 上週同日"
          icon={Users}
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
          title="WAU (週活躍)"
          description="Weekly Active Users：近 7 天內至少登入或操作一次的用戶數"
          value={formatNumber(summary?.currentWau)}
          change={summary?.wauChangePercent ?? 0}
          changeLabel="vs 上週"
          icon={Activity}
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
          title="MAU (月活躍)"
          description="Monthly Active Users：近 30 天內至少登入或操作一次的用戶數"
          value={formatNumber(summary?.currentMau)}
          change={summary?.mauChangePercent ?? 0}
          changeLabel="vs 上月"
          icon={TrendingUp}
          onClick={() =>
            setDrillDown({
              type: 'active',
              title: 'MAU — 近 30 天活躍用戶',
              date: today,
              period: 'month',
            })
          }
        />
      </div>

      {/* Section 2: Onboarding & engagement KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Badge 完成率"
          description="已獲得至少一個徽章的用戶佔總用戶比例，反映任務完成度"
          value={`${onboardingStats?.badgeGrantedRate ?? 0}%`}
          icon={Award}
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
          description="完成島嶼人格測驗（學習風格）的用戶比例，越高代表用戶越願意參與引導流程"
          value={`${quizStats?.quizCompletedRate ?? 0}%`}
          icon={BookOpen}
          onClick={() =>
            setDrillDown({ type: 'metric', title: '已完成測驗的用戶', metric: 'quiz_completed' })
          }
        />
        <StatCard
          title="實踐放棄率"
          description="已開始但未完成實踐任務的用戶比例，越低越好"
          value={`${engagementStats?.practiceStats.abandonmentRate ?? 0}%`}
          icon={TrendingDown}
          onClick={() =>
            setDrillDown({
              type: 'metric',
              title: '已放棄實踐的用戶',
              metric: 'practice_abandoned',
            })
          }
        />
        <StatCard
          title="Streak 7天+ 人數"
          description="連續打卡達 7 天以上的用戶人數，代表高度活躍的核心用戶群"
          value={formatNumber(engagementStats?.checkinStats.usersWithStreak7Plus)}
          icon={Flame}
          onClick={() =>
            setDrillDown({
              type: 'metric',
              title: '連續打卡 7 天以上的用戶',
              metric: 'streak_7plus',
            })
          }
        />
      </div>

      {/* Section 3: Active trend chart */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              每日活躍趨勢（DAU / WAU / MAU）
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              追蹤日、週、月活躍用戶在所選時間區間內的變化，可用於判斷用戶成長與留存健康度
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-4 rounded-sm"
                style={{ backgroundColor: 'var(--chart-2)' }}
              />
              DAU（日活）
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-4 rounded-sm"
                style={{ backgroundColor: 'var(--chart-3)' }}
              />
              WAU（週活）
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-4 rounded-sm"
                style={{ backgroundColor: 'var(--chart-4)' }}
              />
              MAU（月活）
            </span>
          </div>
        </div>
        {isTrendLoading ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : trendRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isTrendError ? '無法載入活躍趨勢資料' : '目前沒有可顯示的趨勢資料'}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name.toUpperCase(),
                ]}
              />
              <Line
                type="monotone"
                dataKey="dau"
                name="dau"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="wau"
                name="wau"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="mau"
                name="mau"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 4: Learning style distribution */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              學習風格分布
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              依島嶼人格測驗結果分類，顯示社群用戶的學習風格組成比例
            </p>
          </div>
          {quizStats && (
            <span className="text-sm text-muted-foreground">
              測驗完成率 {quizStats.quizCompletedRate}%（
              {quizStats.quizCompletedCount.toLocaleString()} /{' '}
              {quizStats.totalUsers.toLocaleString()} 人）
            </span>
          )}
        </div>
        {!quizStats ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : (
          <div className="space-y-3">
            {ROLE_ORDER.map((code) => {
              const meta = ROLE_META[code]
              const roleData = quizStats.byRole[code]
              const count = roleData?.count ?? 0
              const rate = roleData?.rate ?? 0
              return (
                <button
                  type="button"
                  key={code}
                  onClick={() =>
                    setDrillDown({
                      type: 'metric',
                      title: `${code} ${meta.label} 的用戶`,
                      metric: `persona_${code}`,
                    })
                  }
                  className="flex w-full items-center gap-4 rounded-lg px-1 py-0.5 transition-colors hover:bg-muted/50"
                >
                  <span className="w-36 shrink-0 text-right text-sm font-medium text-foreground">
                    {code} {meta.label}
                  </span>
                  <div className="flex-1">
                    <div
                      className="flex h-8 items-center rounded-md px-3 text-xs font-semibold transition-all"
                      style={{
                        width: `${Math.max(rate, 4)}%`,
                        backgroundColor: meta.color,
                        color: meta.textColor,
                      }}
                    >
                      <span className="whitespace-nowrap">
                        {count.toLocaleString()} ({rate}%)
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 5: Funnel visualization */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            轉換漏斗
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            追蹤用戶從註冊到完成核心行為的各階段轉換率，百分比以第一階段為基準（100%）
          </p>
        </div>
        {isFunnelLoading ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : isFunnelError ? (
          <p className="text-sm text-muted-foreground">
            後端尚未提供 /api/v1/admin/user-stats/funnel
          </p>
        ) : funnelStages.length === 0 ? (
          <p className="text-sm text-muted-foreground">目前沒有可顯示的漏斗資料</p>
        ) : (
          <div className="space-y-3">
            {funnelStages.map((stage) => {
              const pct = (stage.value / funnelBase) * 100
              const barClass =
                pct >= 90 ? 'bg-primary' : pct >= 70 ? 'bg-primary/85' : 'bg-primary/65'
              return (
                <div key={stage.label} className="flex items-center gap-4">
                  <span className="w-20 shrink-0 text-right text-sm font-medium text-foreground">
                    {stage.label}
                  </span>
                  <div className="relative flex-1">
                    <div
                      className={cn(
                        'flex h-9 items-center rounded-md px-3 text-sm font-medium text-primary-foreground transition-all',
                        barClass,
                      )}
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      <span className="whitespace-nowrap">
                        {stage.value.toLocaleString()} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 6: Checkin retention by day */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              打卡留存率（30天）
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              用戶首次打卡後，在接下來各天仍持續打卡的比例。第 1 天為 100%，數值越平緩代表留存越好
            </p>
          </div>
          {engagementStats && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>平均最長 streak：{engagementStats.checkinStats.avgMaxStreak} 天</span>
              <span>
                30天+ streak：{engagementStats.checkinStats.usersWithStreak30Plus.toLocaleString()}{' '}
                人
              </span>
            </div>
          )}
        </div>
        {retentionRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {engagementStats ? '目前沒有打卡留存資料' : '載入中...'}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={retentionRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                label={{ value: '第幾天', position: 'insideBottomRight', offset: -8, fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
                formatter={(value: number) => [`${value}%`, '留存率']}
                labelFormatter={(label) => `第 ${label} 天`}
              />
              <Line
                type="monotone"
                dataKey="retentionRate"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 7: Cohort retention heatmap */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              Cohort 留存率
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              依加入月份分群，追蹤各群用戶在第 1、7、14、30、60、90
              天後仍活躍的比例。顏色越深代表留存率越高
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            <span>低</span>
            <span className="flex items-center gap-0.5">
              {[15, 25, 40, 60, 80].map((pct) => (
                <span key={pct} className={`inline-block h-4 w-6 rounded-sm ${retentionBg(pct)}`} />
              ))}
            </span>
            <span>高</span>
          </div>
        </div>
        {isCohortLoading ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : isCohortError ? (
          <p className="text-sm text-muted-foreground">
            後端尚未提供 /api/v1/admin/user-stats/cohort-retention
          </p>
        ) : cohortRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">目前沒有可顯示的留存資料</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-2">月份</TableHead>
                {COHORT_COLUMNS.map((col) => (
                  <TableHead key={col} className="py-2 text-center">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohortRows.map((row) => (
                <TableRow key={row.period} className="border-t border-border">
                  <TableCell className="font-medium text-foreground">{row.period}</TableCell>
                  {row.values.map((val, ci) => {
                    const safeValue = Math.max(0, Math.min(100, Math.round(val)))
                    return (
                      <TableCell key={COHORT_COLUMNS[ci]} className="px-1 py-1 text-center">
                        <span
                          className={cn(
                            'inline-flex h-8 w-full items-center justify-center rounded-md text-xs font-semibold',
                            retentionBg(safeValue),
                          )}
                        >
                          {safeValue}%
                        </span>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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
