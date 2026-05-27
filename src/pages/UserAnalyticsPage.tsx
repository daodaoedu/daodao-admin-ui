import { format, subDays } from 'date-fns'
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
import { useActiveUsersTrend } from '@/hooks/useActiveUsersTrend'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Mock data generators
// ---------------------------------------------------------------------------

function generateRegistrationTrend() {
  const today = new Date()
  return Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i)
    return {
      date: format(date, 'MM/dd'),
      count: Math.floor(Math.random() * 150) + 50,
    }
  })
}

const FUNNEL_STAGES: { label: string; value: number }[] = [
  { label: '註冊', value: 10_000 },
  { label: '首次登入', value: 8_500 },
  { label: '首次打卡', value: 4_200 },
  { label: '7日回訪', value: 2_800 },
  { label: '30日活躍', value: 1_500 },
]

const COHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const COHORT_COLUMNS = ['Day 1', 'Day 7', 'Day 14', 'Day 30', 'Day 60', 'Day 90']

function generateCohortData() {
  return COHORT_MONTHS.map((month) => {
    const day1 = Math.floor(Math.random() * 10) + 85
    const day7 = Math.floor(Math.random() * 15) + 55
    const day14 = Math.floor(Math.random() * 15) + 38
    const day30 = Math.floor(Math.random() * 12) + 25
    const day60 = Math.floor(Math.random() * 10) + 15
    const day90 = Math.floor(Math.random() * 8) + 8
    return {
      month,
      values: [day1, day7, day14, day30, day60, day90],
    }
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a retention percentage (0-100) to a green intensity class. */
function retentionBg(pct: number): string {
  if (pct >= 80) return 'bg-green-700 text-white'
  if (pct >= 60) return 'bg-green-600 text-white'
  if (pct >= 40) return 'bg-green-500 text-white'
  if (pct >= 25) return 'bg-green-400 text-green-950'
  if (pct >= 15) return 'bg-green-300 text-green-950'
  return 'bg-green-200 text-green-950'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 29), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const { data: trendData } = useActiveUsersTrend(30)

  const registrationTrend = useMemo(() => generateRegistrationTrend(), [])
  const cohortData = useMemo(() => generateCohortData(), [])

  // Flatten registration trend for export
  const exportColumns = [
    { key: 'date', header: '日期' },
    { key: 'count', header: '註冊數' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="heading-lg">用戶分析</h1>
        <div className="flex items-center gap-3">
          {/* Date range filter (visual only) */}
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-sm"
            />
            <span className="text-muted-foreground">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-sm"
            />
          </div>
          <ExportButton
            data={registrationTrend as unknown as Record<string, unknown>[]}
            columns={exportColumns}
            fileName="user_analytics"
          />
        </div>
      </div>

      {/* Section 1: DAU / WAU / MAU */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="DAU (日活躍)"
          value={trendData?.summary?.currentDau?.toLocaleString() ?? '1,234'}
          change={trendData?.summary?.dauChangePercent ?? 5.2}
          changeLabel="vs 上週"
          icon={Users}
        />
        <StatCard
          title="WAU (週活躍)"
          value={trendData?.summary?.currentWau?.toLocaleString() ?? '4,567'}
          change={trendData?.summary?.wauChangePercent ?? 3.1}
          changeLabel="vs 上週"
          icon={Activity}
        />
        <StatCard
          title="MAU (月活躍)"
          value={trendData?.summary?.currentMau?.toLocaleString() ?? '12,345'}
          change={trendData?.summary?.mauChangePercent ?? 8.7}
          changeLabel="vs 上月"
          icon={TrendingUp}
        />
      </div>

      {/* Section 2: Registration trend chart */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 heading-sm">每日註冊趨勢（近 30 天）</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={registrationTrend}>
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
              formatter={(v: number) => [v, '註冊數']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Section 3: Funnel visualization */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 heading-sm">轉換漏斗</h2>
        <div className="space-y-3">
          {FUNNEL_STAGES.map((stage, idx) => {
            const pct = (stage.value / FUNNEL_STAGES[0].value) * 100
            return (
              <div key={stage.label} className="flex items-center gap-4">
                <span className="w-20 shrink-0 text-right text-sm font-medium text-foreground">
                  {stage.label}
                </span>
                <div className="relative flex-1">
                  <div
                    className={cn(
                      'flex h-9 items-center rounded-md px-3 text-sm font-medium text-white transition-all',
                      idx === 0
                        ? 'bg-primary'
                        : idx === 1
                          ? 'bg-primary/85'
                          : idx === 2
                            ? 'bg-primary/65'
                            : idx === 3
                              ? 'bg-primary/50'
                              : 'bg-primary/35',
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
      </div>

      {/* Section 4: Cohort retention heatmap */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 heading-sm">Cohort 留存率</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">月份</th>
                {COHORT_COLUMNS.map((col) => (
                  <th key={col} className="px-3 py-2 text-center font-medium text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortData.map((row) => (
                <tr key={row.month} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-foreground">{row.month}</td>
                  {row.values.map((val, ci) => (
                    <td key={COHORT_COLUMNS[ci]} className="px-1 py-1 text-center">
                      <span
                        className={cn(
                          'inline-flex h-8 w-full items-center justify-center rounded-md text-xs font-semibold',
                          retentionBg(val),
                        )}
                      >
                        {val}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
