import { CalendarClock, CheckCircle2, Clock, Plus, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const schedules = [
  {
    name: '每週 KPI 摘要',
    frequency: '每週',
    recipients: 'admin@daodao.tw',
    sections: '用戶 + AI 成本',
    lastSent: '2024-06-01',
    enabled: true,
  },
  {
    name: '每月營運報告',
    frequency: '每月',
    recipients: 'team@daodao.tw',
    sections: '全部',
    lastSent: '2024-06-01',
    enabled: true,
  },
  {
    name: '每日異常摘要',
    frequency: '每日',
    recipients: 'ops@daodao.tw',
    sections: '系統健康',
    lastSent: '2024-06-02',
    enabled: false,
  },
]

const executionHistory = [
  {
    name: '每週 KPI 摘要',
    sentAt: '2024-06-01 09:00',
    recipients: 'admin@daodao.tw',
    success: true,
  },
  { name: '每月營運報告', sentAt: '2024-06-01 08:00', recipients: 'team@daodao.tw', success: true },
  { name: '每日異常摘要', sentAt: '2024-06-02 07:00', recipients: 'ops@daodao.tw', success: false },
  {
    name: '每週 KPI 摘要',
    sentAt: '2024-05-25 09:00',
    recipients: 'admin@daodao.tw',
    success: true,
  },
  { name: '每月營運報告', sentAt: '2024-05-01 08:00', recipients: 'team@daodao.tw', success: true },
]

const frequencyColor: Record<string, string> = {
  每日: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  每週: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  每月: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

export function ScheduledReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">排程報表</h1>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors',
            'hover:bg-primary/90',
          )}
        >
          <Plus className="h-4 w-4" />
          新增排程
        </button>
      </div>

      {/* Schedules Table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">報表排程</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
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
                <tr key={s.name} className="border-b border-border last:border-0">
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
                        s.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
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
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">最近執行</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">報表名稱</th>
                <th className="pb-3 pr-4 font-medium">發送時間</th>
                <th className="pb-3 pr-4 font-medium">收件人</th>
                <th className="pb-3 font-medium">狀態</th>
              </tr>
            </thead>
            <tbody>
              {executionHistory.map((h) => (
                <tr key={`${h.name}-${h.sentAt}`} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{h.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{h.sentAt}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{h.recipients}</td>
                  <td className="py-3">
                    {h.success ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3" />
                        成功
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
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
