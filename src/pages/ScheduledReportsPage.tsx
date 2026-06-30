import { CalendarClock, CheckCircle2, Clock, History, Plus, XCircle } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useScheduledReportHistory, useScheduledReports } from '@/hooks/useScheduledReports'
import { cn } from '@/lib/utils'

const frequencyColor: Record<string, string> = {
  每日: 'bg-info/15 text-info',
  每週: 'bg-info/15 text-info',
  每月: 'bg-warning/15 text-warning',
}

export function ScheduledReportsPage() {
  const { data: apiSchedules } = useScheduledReports()
  const schedules = apiSchedules ?? []

  const [selectedReportId, setSelectedReportId] = useState<string>('')
  const { data: historyData = [], isLoading: historyLoading } =
    useScheduledReportHistory(selectedReportId)

  const selectedReport = schedules.find((s) => s.id === selectedReportId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="排程報表"
        description="設定定時自動產生並寄送報表，讓關鍵指標定期送達指定收件人。"
        actions={
          <Button type="button">
            <Plus className="h-4 w-4" />
            新增排程
          </Button>
        }
      />

      {/* Schedules Table */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            報表排程
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">報表名稱</th>
                <th className="pb-3 pr-4 font-medium">頻率</th>
                <th className="pb-3 pr-4 font-medium">收件人</th>
                <th className="pb-3 pr-4 font-medium">包含區段</th>
                <th className="pb-3 pr-4 font-medium">上次發送</th>
                <th className="pb-3 pr-4 font-medium">狀態</th>
                <th className="pb-3 font-medium">執行歷史</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr
                  key={s.id ?? s.name}
                  className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                >
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
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        s.enabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {s.enabled ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td className="py-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => setSelectedReportId((prev) => (prev === s.id ? '' : s.id))}
                      aria-pressed={selectedReportId === s.id}
                    >
                      <History className="h-3.5 w-3.5" />
                      <span className="ml-1">查看歷史</span>
                    </Button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                    尚無排程報表
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution History */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            {selectedReport ? `執行歷史：${selectedReport.name}` : '最近執行'}
          </h2>
        </div>
        {!selectedReportId ? (
          <p className="text-sm text-muted-foreground">
            請點擊排程表格中的「查看歷史」按鈕以顯示執行歷史
          </p>
        ) : historyLoading ? (
          <p className="text-sm text-muted-foreground">載入中…</p>
        ) : historyData.length === 0 ? (
          <p className="text-sm text-muted-foreground">此排程尚無執行記錄</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">報表名稱</th>
                  <th className="pb-3 pr-4 font-medium">發送時間</th>
                  <th className="pb-3 pr-4 font-medium">收件人</th>
                  <th className="pb-3 font-medium">狀態</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((h) => (
                  <tr
                    key={h.id ?? `${h.name}-${h.sentAt}`}
                    className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                  >
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
        )}
      </div>
    </div>
  )
}
