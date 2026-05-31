import { Activity, Cpu, Database, HardDrive, MemoryStick, RefreshCw } from 'lucide-react'
import type { DbInfo, RedisInfo, SystemMonitorData } from '@/api/admin-system'
import { useDbInfo, useRedisInfo, useSystemMonitor } from '@/hooks/useSystemMonitor'
import { cn } from '@/lib/utils'

const FALLBACK_MONITOR: SystemMonitorData = {
  cpu: { percent: 0 },
  memory: { percent: 0, usedGb: 0, totalGb: 0 },
  disk: { percent: 0, usedGb: 0, totalGb: 0 },
}

const FALLBACK_DB_INFO: DbInfo = {
  status: 'disconnected',
  activeConnections: 0,
  maxConnections: 0,
  idleConnections: 0,
  totalQueries: 0,
  avgLatencyMs: 0,
}

const FALLBACK_REDIS_INFO: RedisInfo = {
  status: 'disconnected',
  memoryUsedMb: 0,
  memoryMaxMb: 0,
  connections: 0,
  hitRate: 0,
}

function getBarColor(percent: number): string {
  if (percent >= 80) return 'bg-destructive'
  if (percent >= 60) return 'bg-warning'
  return 'bg-success'
}

function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{percent}%</span>
        </div>
      )}
      <div className="h-3 w-full rounded-full bg-muted">
        <div
          className={cn('h-3 rounded-full transition-all', getBarColor(percent))}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export function SystemMonitorPage() {
  const { data: monitorData } = useSystemMonitor()
  const { data: dbData } = useDbInfo()
  const { data: redisData } = useRedisInfo()

  const monitor = monitorData ?? FALLBACK_MONITOR
  const db = dbData ?? FALLBACK_DB_INFO
  const redis = redisData ?? FALLBACK_REDIS_INFO

  const dbStatusLabel = db.status === 'connected' ? '已連線' : '已斷線'
  const redisStatusLabel = redis.status === 'connected' ? '已連線' : '已斷線'
  const dbStatusConnected = db.status === 'connected'
  const redisStatusConnected = redis.status === 'connected'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl leading-none font-semibold tracking-tight text-foreground">
          系統監控
        </h1>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />每 30 秒自動刷新
        </span>
      </div>

      {/* Resource Gauges */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* CPU */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              CPU
            </h2>
          </div>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold">{monitor.cpu.percent}</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <ProgressBar percent={monitor.cpu.percent} />
        </div>

        {/* Memory */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              記憶體
            </h2>
          </div>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold">{monitor.memory.percent}</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <ProgressBar percent={monitor.memory.percent} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {monitor.memory.usedGb} / {monitor.memory.totalGb} GB
          </p>
        </div>

        {/* Disk */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              磁碟
            </h2>
          </div>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold">{monitor.disk.percent}</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <ProgressBar percent={monitor.disk.percent} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {monitor.disk.usedGb} / {monitor.disk.totalGb} GB
          </p>
        </div>
      </div>

      {/* Database cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* PostgreSQL */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              PostgreSQL
            </h2>
            <span
              className={cn(
                'ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                dbStatusConnected
                  ? 'bg-success/15 text-success'
                  : 'bg-destructive/15 text-destructive',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  dbStatusConnected ? 'bg-success' : 'bg-destructive',
                )}
              />
              {dbStatusLabel}
            </span>
          </div>
          <div className="space-y-0">
            <MetricRow
              label="連線池 — 活躍"
              value={`${db.activeConnections} / ${db.maxConnections}`}
            />
            <MetricRow label="連線池 — 閒置" value={String(db.idleConnections)} />
            <MetricRow label="總查詢" value={db.totalQueries.toLocaleString()} />
            <MetricRow label="平均延遲" value={`${db.avgLatencyMs} ms`} />
          </div>
        </div>

        {/* Redis */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              Redis
            </h2>
            <span
              className={cn(
                'ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                redisStatusConnected
                  ? 'bg-success/15 text-success'
                  : 'bg-destructive/15 text-destructive',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  redisStatusConnected ? 'bg-success' : 'bg-destructive',
                )}
              />
              {redisStatusLabel}
            </span>
          </div>
          <div className="space-y-0">
            <MetricRow
              label="記憶體"
              value={`${redis.memoryUsedMb} MB / ${redis.memoryMaxMb >= 1024 ? `${(redis.memoryMaxMb / 1024).toFixed(0)} GB` : `${redis.memoryMaxMb} MB`}`}
            />
            <MetricRow label="連線數" value={String(redis.connections)} />
            <MetricRow label="Hit Rate" value={`${redis.hitRate}%`} />
          </div>
        </div>
      </div>
    </div>
  )
}
