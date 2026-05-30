import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, MailCheck, Percent, Plus, Zap } from 'lucide-react'
import type { EmailTriggerRule } from '@/api/admin-communication'
import { updateEmailTrigger } from '@/api/admin-communication'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useEmailTriggers } from '@/hooks/useEmailTriggers'
import { cn } from '@/lib/utils'

export function TriggeredEmailsPage() {
  const queryClient = useQueryClient()
  const { data: apiRules } = useEmailTriggers()
  const rules = (apiRules ?? []) as EmailTriggerRule[]

  // Compute stats from real data
  const activeRulesCount = rules.filter((r) => r.enabled).length
  const totalSent = rules.reduce((sum, r) => sum + (r.sent || 0), 0)
  const avgOpenRate =
    rules.length > 0
      ? (rules.reduce((sum, r) => sum + (r.openRate || 0), 0) / rules.length).toFixed(1)
      : '0'

  const executionLogs: {
    id: string
    rule: string
    recipient: string
    sentAt: string
    status: string
  }[] = []

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateEmailTrigger(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-triggers'] })
    },
  })

  function toggleRule(rule: EmailTriggerRule) {
    toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">觸發式郵件</h1>
        <Button type="button" onClick={() => alert('功能開發中')}>
          <Plus className="h-4 w-4" />
          新增規則
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="活躍規則數" value={activeRulesCount} icon={Zap} />
        <StatCard title="本月發送" value={totalSent} icon={Mail} />
        <StatCard title="平均開信率" value={`${avgOpenRate}%`} icon={Percent} />
      </div>

      {/* Rules Table */}
      <div className="admin-panel-card p-5">
        <h2 className="heading-sm mb-4">郵件規則</h2>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">規則名稱</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">觸發條件</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">郵件模板</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">本月發送</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">開信率</th>
                <th className="pb-3 font-medium text-muted-foreground">狀態</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id ?? rule.name} className="admin-table-row last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    <div className="flex items-center gap-2">
                      <MailCheck className="h-4 w-4 text-muted-foreground" />
                      {rule.name}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.trigger}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.template}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.sent}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.openRate}%</td>
                  <td className="py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleRule(rule)}
                      disabled={toggleMutation.isPending}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                        rule.enabled ? 'bg-primary' : 'bg-muted',
                      )}
                      role="switch"
                      aria-checked={rule.enabled}
                      aria-label={`${rule.name} ${rule.enabled ? '啟用' : '停用'}`}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform',
                          rule.enabled ? 'translate-x-4' : 'translate-x-0',
                        )}
                      />
                    </Button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                    尚無郵件規則
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Log */}
      <div className="admin-panel-card p-5">
        <h2 className="heading-sm mb-4">最近執行紀錄</h2>
        {executionLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">每筆規則的執行記錄可個別查詢</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table-shell text-sm">
              <thead>
                <tr className="admin-table-head">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">規則</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">收件人</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">發送時間</th>
                  <th className="pb-3 font-medium text-muted-foreground">狀態</th>
                </tr>
              </thead>
              <tbody>
                {executionLogs.map((log) => (
                  <tr
                    key={log.id ?? `${log.rule}-${log.sentAt}`}
                    className="admin-table-row last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium">{log.rule}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{log.recipient}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{log.sentAt}</td>
                    <td
                      className={cn(
                        'py-3 text-sm font-medium',
                        log.status === '成功' ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {log.status}
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
