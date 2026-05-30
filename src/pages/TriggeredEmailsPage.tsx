import { Mail, MailCheck, Percent, Plus, Zap } from 'lucide-react'
import { useState } from 'react'
import type { EmailTriggerRule } from '@/api/admin-communication'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useEmailTriggers } from '@/hooks/useEmailTriggers'
import { cn } from '@/lib/utils'

export function TriggeredEmailsPage() {
  const { data: apiRules } = useEmailTriggers()
  const rules = (apiRules ?? []) as EmailTriggerRule[]
  const executionLogs: {
    id: string
    rule: string
    recipient: string
    sentAt: string
    status: string
  }[] = []

  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({})

  function toggleRule(index: number) {
    const rule = rules[index]
    if (!rule) return
    setLocalToggles((prev) => ({
      ...prev,
      [rule.id]: !(localToggles[rule.id] ?? rule.enabled),
    }))
  }

  function isEnabled(rule: (typeof rules)[number]) {
    return localToggles[rule.id] ?? rule.enabled
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
        <StatCard title="活躍規則數" value={5} icon={Zap} />
        <StatCard title="本月發送" value={234} icon={Mail} change={15.2} changeLabel="較上月" />
        <StatCard
          title="平均開信率"
          value="45.2%"
          icon={Percent}
          change={2.8}
          changeLabel="較上月"
        />
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
              {rules.map((rule, index) => (
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
                      onClick={() => toggleRule(index)}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                        isEnabled(rule) ? 'bg-primary' : 'bg-muted',
                      )}
                      role="switch"
                      aria-checked={isEnabled(rule)}
                      aria-label={`${rule.name} ${isEnabled(rule) ? '啟用' : '停用'}`}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform',
                          isEnabled(rule) ? 'translate-x-4' : 'translate-x-0',
                        )}
                      />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Log */}
      <div className="admin-panel-card p-5">
        <h2 className="heading-sm mb-4">最近執行紀錄</h2>
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
      </div>
    </div>
  )
}
