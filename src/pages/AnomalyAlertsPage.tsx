import { AlertTriangle, Bell, Clock, Plus, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useAlertHistory, useAlertRules } from '@/hooks/useAlerts'
import { cn } from '@/lib/utils'

export function AnomalyAlertsPage() {
  const { data: apiRules } = useAlertRules()
  const { data: apiHistory } = useAlertHistory()
  const alertRules = apiRules ?? []
  const alertHistory = apiHistory ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="異常警報"
        description="監控系統異常事件，設定告警規則與通知條件，快速定位問題根源。"
        actions={
          <Button type="button">
            <Plus className="h-4 w-4" />
            新增規則
          </Button>
        }
      />

      {/* Alert Rules */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            警報規則
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
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
                <tr
                  key={rule.id ?? rule.name}
                  className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">{rule.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.metric}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.condition}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      {rule.threshold}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.notification}</td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        rule.enabled
                          ? 'bg-success/15 text-success'
                          : 'bg-muted text-muted-foreground',
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
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            觸發歷史
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
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
                  key={h.id ?? `${h.rule}-${h.triggeredAt}`}
                  className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                        <Bell className="h-3 w-3" />
                        已處理
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
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
