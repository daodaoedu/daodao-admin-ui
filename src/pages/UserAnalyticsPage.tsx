import { format, parseISO, subDays } from 'date-fns'
import { Activity, CalendarDays, TrendingUp, Users } from 'lucide-react'
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
import { ExportButton } from '@/components/ExportButton'
import { StatCard } from '@/components/StatCard'
import { Input } from '@/components/ui/input'
import {
  useActiveUsersFunnel,
  useActiveUsersTrend,
  useUserCohortRetention,
} from '@/hooks/useActiveUsersTrend'
import { cn } from '@/lib/utils'

const COHORT_COLUMNS = ['Day 1', 'Day 7', 'Day 14', 'Day 30', 'Day 60', 'Day 90']

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

  const exportColumns = [
    { key: 'date', header: '日期' },
    { key: 'dau', header: 'DAU' },
    { key: 'wau', header: 'WAU' },
    { key: 'mau', header: 'MAU' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="heading-lg">用戶分析</h1>
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
      </div>

      {/* Section 1: DAU / WAU / MAU */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="DAU (日活躍)"
          value={formatNumber(summary?.currentDau)}
          change={summary?.dauChangePercent ?? 0}
          changeLabel="vs 上週"
          icon={Users}
        />
        <StatCard
          title="WAU (週活躍)"
          value={formatNumber(summary?.currentWau)}
          change={summary?.wauChangePercent ?? 0}
          changeLabel="vs 上週"
          icon={Activity}
        />
        <StatCard
          title="MAU (月活躍)"
          value={formatNumber(summary?.currentMau)}
          change={summary?.mauChangePercent ?? 0}
          changeLabel="vs 上月"
          icon={TrendingUp}
        />
      </div>

      {/* Section 2: Active trend chart */}
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">每日活躍趨勢（DAU / WAU / MAU）</h2>
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

      {/* Section 3: Funnel visualization */}
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">轉換漏斗</h2>
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
              return (
                <div key={stage.label} className="flex items-center gap-4">
                  <span className="w-20 shrink-0 text-right text-sm font-medium text-foreground">
                    {stage.label}
                  </span>
                  <div className="relative flex-1">
                    <div
                      className={cn(
                        'flex h-9 items-center rounded-md px-3 text-sm font-medium text-primary-foreground transition-all',
                        pct >= 90 ? 'bg-primary' : pct >= 70 ? 'bg-primary/85' : 'bg-primary/65',
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

      {/* Section 4: Cohort retention heatmap */}
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">Cohort 留存率</h2>
        {isCohortLoading ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : isCohortError ? (
          <p className="text-sm text-muted-foreground">
            後端尚未提供 /api/v1/admin/user-stats/cohort-retention
          </p>
        ) : cohortRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">目前沒有可顯示的留存資料</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table-shell text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">月份</th>
                  {COHORT_COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-center font-medium text-muted-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortRows.map((row) => (
                  <tr key={row.period} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">{row.period}</td>
                    {row.values.map((val, ci) => {
                      const safeValue = Math.max(0, Math.min(100, Math.round(val)))
                      return (
                        <td key={COHORT_COLUMNS[ci]} className="px-1 py-1 text-center">
                          <span
                            className={cn(
                              'inline-flex h-8 w-full items-center justify-center rounded-md text-xs font-semibold',
                              retentionBg(safeValue),
                            )}
                          >
                            {safeValue}%
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
