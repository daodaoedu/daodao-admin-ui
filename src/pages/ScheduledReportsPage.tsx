import { CalendarClock, CheckCircle2, Clock, Plus, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScheduledReports } from '@/hooks/useScheduledReports'
import { cn } from '@/lib/utils'

const frequencyColor: Record<string, string> = {
  每日: 'bg-info/15 text-info',
  每週: 'bg-info/15 text-info',
  每月: 'bg-warning/15 text-warning',
}

export function ScheduledReportsPage() {
  const { data: apiSchedules } = useScheduledReports()
  const schedules = apiSchedules ?? []
  const executionHistory: {
    name: string
    sentAt: string
    recipients: string
    success: boolean
  }[] = []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">排程報表</h1>
        <Button type="button">
          <Plus className="h-4 w-4" />
          新增排程
        </Button>
      </div>

      {/* Schedules Table */}
      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">報表排程</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="pb-3 pr-4 font-medium">報表名稱</th>
                <th className="pb-3 pr-4 font-medium">頻率</th>
                <th className="pb-3 pr-4 font-medium">收件人</th>
                <th className="pb-3 pr-4 font-medium">包含區段</th>
                <th className="pb-3 pr-4 font-medium">上次發送</th>
                <th className="pb-3 font-medium">狀態</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id ?? s.name} className="admin-table-row last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{s.name}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        frequencyColor[s.frequency],
                      )}
                    >
                      {s.frequency}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{s.recipients}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{s.sections}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{s.lastSent}</td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        s.enabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {s.enabled ? '啟用' : '停用'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution History */}
      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">最近執行</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="pb-3 pr-4 font-medium">報表名稱</th>
                <th className="pb-3 pr-4 font-medium">發送時間</th>
                <th className="pb-3 pr-4 font-medium">收件人</th>
                <th className="pb-3 font-medium">狀態</th>
              </tr>
            </thead>
            <tbody>
              {executionHistory.map((h) => (
                <tr key={`${h.name}-${h.sentAt}`} className="admin-table-row last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{h.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{h.sentAt}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{h.recipients}</td>
                  <td className="py-3">
                    {h.success ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        成功
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                        <XCircle className="h-3 w-3" />
                        失敗
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
