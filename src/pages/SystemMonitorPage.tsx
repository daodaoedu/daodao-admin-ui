import { Activity, Cpu, Database, HardDrive, MemoryStick, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSystemMonitor, useDbInfo, useRedisInfo } from '@/hooks/useSystemMonitor'
import type { SystemMonitorData, DbInfo, RedisInfo } from '@/api/admin-system'

const mockMonitor: SystemMonitorData = {
  cpu: { percent: 45 },
  memory: { percent: 68, usedGb: 6.8, totalGb: 10 },
  disk: { percent: 52, usedGb: 52, totalGb: 100 },
}

const mockDb: DbInfo = {
  status: 'connected',
  activeConnections: 12,
  maxConnections: 50,
  idleConnections: 38,
  totalQueries: 1_234_567,
  avgLatencyMs: 2.3,
}

const mockRedis: RedisInfo = {
  status: 'connected',
  memoryUsedMb: 256,
  memoryMaxMb: 1024,
  connections: 8,
  hitRate: 99.2,
}

function getBarColor(percent: number): string {
  if (percent >= 80) return 'bg-red-500'
  if (percent >= 60) return 'bg-yellow-500'
  return 'bg-green-500'
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

  const monitor = monitorData ?? mockMonitor
  const db = dbData ?? mockDb
  const redis = redisData ?? mockRedis

  const dbStatusLabel = db.status === 'connected' ? '已連線' : '已斷線'
  const redisStatusLabel = redis.status === 'connected' ? '已連線' : '已斷線'
  const dbStatusConnected = db.status === 'connected'
  const redisStatusConnected = redis.status === 'connected'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">系統監控</h1>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          每 30 秒自動刷新
        </span>
      </div>

      {/* Resource Gauges */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* CPU */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <h2 className="heading-sm">CPU</h2>
          </div>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold">{monitor.cpu.percent}</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <ProgressBar percent={monitor.cpu.percent} />
        </div>

        {/* Memory */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
            <h2 className="heading-sm">記憶體</h2>
          </div>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold">{monitor.memory.percent}</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <ProgressBar percent={monitor.memory.percent} />
          <p className="mt-2 text-center text-xs text-muted-foreground">{monitor.memory.usedGb} / {monitor.memory.totalGb} GB</p>
        </div>

        {/* Disk */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <h2 className="heading-sm">磁碟</h2>
          </div>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold">{monitor.disk.percent}</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <ProgressBar percent={monitor.disk.percent} />
          <p className="mt-2 text-center text-xs text-muted-foreground">{monitor.disk.usedGb} / {monitor.disk.totalGb} GB</p>
        </div>
      </div>

      {/* Database cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* PostgreSQL */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h2 className="heading-sm">PostgreSQL</h2>
            <span className={cn(
              'ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
              dbStatusConnected
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', dbStatusConnected ? 'bg-green-500' : 'bg-red-500')} />
              {dbStatusLabel}
            </span>
          </div>
          <div className="space-y-0">
            <MetricRow label="連線池 — 活躍" value={`${db.activeConnections} / ${db.maxConnections}`} />
            <MetricRow label="連線池 — 閒置" value={String(db.idleConnections)} />
            <MetricRow label="總查詢" value={db.totalQueries.toLocaleString()} />
            <MetricRow label="平均延遲" value={`${db.avgLatencyMs} ms`} />
          </div>
        </div>

        {/* Redis */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="heading-sm">Redis</h2>
            <span className={cn(
              'ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
              redisStatusConnected
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', redisStatusConnected ? 'bg-green-500' : 'bg-red-500')} />
              {redisStatusLabel}
            </span>
          </div>
          <div className="space-y-0">
            <MetricRow label="記憶體" value={`${redis.memoryUsedMb} MB / ${redis.memoryMaxMb >= 1024 ? `${(redis.memoryMaxMb / 1024).toFixed(0)} GB` : `${redis.memoryMaxMb} MB`}`} />
            <MetricRow label="連線數" value={String(redis.connections)} />
            <MetricRow label="Hit Rate" value={`${redis.hitRate}%`} />
          </div>
        </div>
      </div>
    </div>
  )
}
