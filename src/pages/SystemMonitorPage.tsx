import { Activity, Cpu, Database, HardDrive, MemoryStick, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

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
            <span className="text-3xl font-bold">45</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <ProgressBar percent={45} />
        </div>

        {/* Memory */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
            <h2 className="heading-sm">記憶體</h2>
          </div>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold">68</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <ProgressBar percent={68} />
          <p className="mt-2 text-center text-xs text-muted-foreground">6.8 / 10 GB</p>
        </div>

        {/* Disk */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <h2 className="heading-sm">磁碟</h2>
          </div>
          <div className="mb-2 text-center">
            <span className="text-3xl font-bold">52</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <ProgressBar percent={52} />
          <p className="mt-2 text-center text-xs text-muted-foreground">52 / 100 GB</p>
        </div>
      </div>

      {/* Database cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* PostgreSQL */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h2 className="heading-sm">PostgreSQL</h2>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              已連線
            </span>
          </div>
          <div className="space-y-0">
            <MetricRow label="連線池 — 活躍" value="12 / 50" />
            <MetricRow label="連線池 — 閒置" value="38" />
            <MetricRow label="總查詢" value="1,234,567" />
            <MetricRow label="平均延遲" value="2.3 ms" />
          </div>
        </div>

        {/* Redis */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="heading-sm">Redis</h2>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              已連線
            </span>
          </div>
          <div className="space-y-0">
            <MetricRow label="記憶體" value="256 MB / 1 GB" />
            <MetricRow label="連線數" value="8" />
            <MetricRow label="Hit Rate" value="99.2%" />
          </div>
        </div>
      </div>
    </div>
  )
}
