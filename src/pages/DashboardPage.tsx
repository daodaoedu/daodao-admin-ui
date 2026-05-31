import { format, subDays } from 'date-fns'
import {
  Activity,
  CheckCircle,
  CircleDollarSign,
  Database,
  Hash,
  Mail,
  MessageSquare,
  Server,
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
import { StatCard } from '@/components/StatCard'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useEmailHealth } from '@/hooks/useEmailManagement'
import { useDbInfo, useRedisInfo } from '@/hooks/useSystemMonitor'

const getServiceStatus = (status?: string) =>
  status === 'connected' ? ('healthy' as const) : status ? ('down' as const) : ('degraded' as const)

const SERVICE_ICONS: Record<string, typeof Mail> = {
  SMTP: Mail,
  Database: Database,
  Redis: Server,
}

const STATUS_STYLES = {
  healthy: 'bg-success/15 text-success',
  degraded: 'bg-warning/15 text-warning',
  down: 'bg-destructive/15 text-destructive',
} as const

const STATUS_LABELS = {
  healthy: '正常',
  degraded: '降級',
  down: '異常',
} as const

// ── Skeleton loader ──────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title */}
      <div className="h-8 w-40 rounded bg-muted" />
      <div className="h-4 w-56 rounded bg-muted" />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {['kpi-a', 'kpi-b', 'kpi-c', 'kpi-d'].map((id) => (
          <div
            key={id}
            className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5"
          >
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="mt-2 h-7 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Chart placeholders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {['chart-a', 'chart-b'].map((id) => (
          <div
            key={id}
            className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5"
          >
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="mt-4 h-[240px] rounded bg-muted/50" />
          </div>
        ))}
      </div>

      {/* System health placeholder */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="mt-4 grid grid-cols-3 gap-4">
          {['health-a', 'health-b', 'health-c'].map((id) => (
            <div key={id} className="h-16 rounded-lg bg-muted/50" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────
export function DashboardPage() {
  const [dateFrom] = useState(() => format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [dateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const { data, isLoading, error } = useDashboardStats(dateFrom, dateTo)
  const { data: emailHealth } = useEmailHealth()
  const { data: dbInfo } = useDbInfo()
  const { data: redisInfo } = useRedisInfo()

  if (isLoading) return <DashboardSkeleton />
  if (error || !data) return <div className="text-destructive">載入失敗</div>

  const serviceStatus = {
    email: getServiceStatus(emailHealth?.status),
    db: getServiceStatus(dbInfo?.status),
    redis: getServiceStatus(redisInfo?.status),
  }

  const systemHealth = {
    status:
      serviceStatus.email === 'healthy' &&
      serviceStatus.db === 'healthy' &&
      serviceStatus.redis === 'healthy'
        ? ('healthy' as const)
        : ('degraded' as const),
    services: [
      {
        name: 'SMTP',
        status: serviceStatus.email,
        label: '郵件服務',
      },
      {
        name: 'Database',
        status: serviceStatus.db,
        label: '資料庫',
      },
      {
        name: 'Redis',
        status: serviceStatus.redis,
        label: '快取',
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* ── Title + date range ─────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl leading-none font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dateFrom} ~ {dateTo}
          </p>
        </div>
        <ExportButton
          data={
            [
              { label: '總費用 (USD)', value: `$${(Number(data.total_cost_usd) || 0).toFixed(4)}` },
              { label: '總查詢次數', value: data.total_queries },
              { label: 'Input Tokens', value: data.total_input_tokens },
              { label: 'Output Tokens', value: data.total_output_tokens },
            ] as unknown as Record<string, unknown>[]
          }
          columns={[
            { key: 'label', header: '指標' },
            { key: 'value', header: '數值' },
          ]}
          fileName="dashboard-kpi"
        />
      </div>

      {/* ── KPI row ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="總費用 (USD)"
          value={`$${(Number(data.total_cost_usd) || 0).toFixed(4)}`}
          icon={CircleDollarSign}
        />
        <StatCard
          title="總查詢次數"
          value={data.total_queries.toLocaleString()}
          icon={MessageSquare}
        />
        <StatCard
          title="Input Tokens"
          value={data.total_input_tokens.toLocaleString()}
          icon={Hash}
        />
        <StatCard
          title="Output Tokens"
          value={data.total_output_tokens.toLocaleString()}
          icon={Hash}
        />
      </div>

      {/* ── AI 成本 section ────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By backend */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
            各 Backend 費用
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.by_backend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="backend" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${Number(v).toFixed(5)}`, '費用']} />
              <Bar dataKey="cost_usd" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily trend */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
            每日查詢趨勢
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.daily_series}>
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
      </div>

      {/* ── System health section ─────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            系統健康
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[systemHealth.status]}`}
          >
            <CheckCircle className="h-3 w-3" />
            {STATUS_LABELS[systemHealth.status]}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {systemHealth.services.map((svc) => {
            const Icon = SERVICE_ICONS[svc.name] ?? Activity
            return (
              <div
                key={svc.name}
                className="rounded-lg border border-[var(--admin-panel-border)] bg-card/90 p-4 shadow-sm flex items-center gap-3"
              >
                <div className={`rounded-lg p-2 ${STATUS_STYLES[svc.status]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{svc.label}</p>
                  <p className="text-xs text-muted-foreground">{STATUS_LABELS[svc.status]}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
