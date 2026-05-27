import { AlertTriangle, Bell, Clock, Plus, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertRules = [
  {
    name: 'DAU 驟降',
    metric: 'DAU',
    condition: '日降幅 >',
    threshold: '20%',
    notification: 'Email',
    enabled: true,
  },
  {
    name: 'AI 成本暴增',
    metric: '每日 AI 成本',
    condition: '超過',
    threshold: '$50',
    notification: 'Email + 站內',
    enabled: true,
  },
  {
    name: '退信率過高',
    metric: '郵件退信率',
    condition: '超過',
    threshold: '5%',
    notification: 'Email',
    enabled: true,
  },
  {
    name: '系統錯誤率',
    metric: '錯誤率',
    condition: '超過',
    threshold: '1%',
    notification: '站內通知',
    enabled: false,
  },
]

const alertHistory = [
  {
    rule: 'DAU 驟降',
    triggeredAt: '2024-06-02 14:30',
    metricValue: '-25.3%',
    threshold: '20%',
    handled: false,
  },
  {
    rule: 'AI 成本暴增',
    triggeredAt: '2024-06-01 23:00',
    metricValue: '$62.40',
    threshold: '$50',
    handled: true,
  },
  {
    rule: '退信率過高',
    triggeredAt: '2024-05-30 10:15',
    metricValue: '7.2%',
    threshold: '5%',
    handled: true,
  },
  {
    rule: 'DAU 驟降',
    triggeredAt: '2024-05-28 14:00',
    metricValue: '-22.1%',
    threshold: '20%',
    handled: true,
  },
  {
    rule: 'AI 成本暴增',
    triggeredAt: '2024-05-25 22:45',
    metricValue: '$55.80',
    threshold: '$50',
    handled: false,
  },
]

export function AnomalyAlertsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">異常警報</h1>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors',
            'hover:bg-primary/90',
          )}
        >
          <Plus className="h-4 w-4" />
          新增規則
        </button>
      </div>

      {/* Alert Rules */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">警報規則</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">規則名稱</th>
                <th className="pb-3 pr-4 font-medium">監控指標</th>
                <th className="pb-3 pr-4 font-medium">條件</th>
                <th className="pb-3 pr-4 font-medium">閾值</th>
                <th className="pb-3 pr-4 font-medium">通知方式</th>
                <th className="pb-3 font-medium">狀態</th>
              </tr>
            </thead>
            <tbody>
              {alertRules.map((rule) => (
                <tr key={rule.name} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{rule.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.metric}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.condition}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-foreground">
                      {rule.threshold}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.notification}</td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        rule.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                      )}
                    >
                      {rule.enabled ? '啟用' : '停用'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert History */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">觸發歷史</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">規則</th>
                <th className="pb-3 pr-4 font-medium">觸發時間</th>
                <th className="pb-3 pr-4 font-medium">指標值</th>
                <th className="pb-3 pr-4 font-medium">閾值</th>
                <th className="pb-3 font-medium">處理狀態</th>
              </tr>
            </thead>
            <tbody>
              {alertHistory.map((h) => (
                <tr
                  key={`${h.rule}-${h.triggeredAt}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      {h.rule}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{h.triggeredAt}</td>
                  <td className="py-3 pr-4">
                    <span className="font-medium text-destructive">{h.metricValue}</span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{h.threshold}</td>
                  <td className="py-3">
                    {h.handled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <Bell className="h-3 w-3" />
                        已處理
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <Clock className="h-3 w-3" />
                        待處理
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
