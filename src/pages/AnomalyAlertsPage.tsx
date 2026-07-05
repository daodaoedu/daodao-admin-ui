import { AlertTriangle, Bell, Clock, Plus, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pr-4">規則名稱</TableHead>
              <TableHead className="pr-4">監控指標</TableHead>
              <TableHead className="pr-4">條件</TableHead>
              <TableHead className="pr-4">閾值</TableHead>
              <TableHead className="pr-4">通知方式</TableHead>
              <TableHead>狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertRules.map((rule) => (
              <TableRow key={rule.id ?? rule.name}>
                <TableCell className="pr-4 font-medium text-foreground">{rule.name}</TableCell>
                <TableCell className="pr-4 text-muted-foreground">{rule.metric}</TableCell>
                <TableCell className="pr-4 text-muted-foreground">{rule.condition}</TableCell>
                <TableCell className="pr-4">
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    {rule.threshold}
                  </span>
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground">{rule.notification}</TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Alert History */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            觸發歷史
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pr-4">規則</TableHead>
              <TableHead className="pr-4">觸發時間</TableHead>
              <TableHead className="pr-4">指標值</TableHead>
              <TableHead className="pr-4">閾值</TableHead>
              <TableHead>處理狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertHistory.map((h) => (
              <TableRow key={h.id ?? `${h.rule}-${h.triggeredAt}`}>
                <TableCell className="pr-4 font-medium text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    {h.rule}
                  </span>
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground">{h.triggeredAt}</TableCell>
                <TableCell className="pr-4">
                  <span className="font-medium text-destructive">{h.metricValue}</span>
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground">{h.threshold}</TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
