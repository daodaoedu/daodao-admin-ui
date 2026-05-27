import { Mail, MailCheck, Percent, Plus, Zap } from 'lucide-react'
import { useState } from 'react'
import { StatCard } from '@/components/StatCard'
import { cn } from '@/lib/utils'

interface Rule {
  name: string
  trigger: string
  template: string
  sent: number
  openRate: number
  enabled: boolean
}

const initialRules: Rule[] = [
  {
    name: '沉睡喚回',
    trigger: '30天未登入',
    template: '喚回信模板',
    sent: 89,
    openRate: 42,
    enabled: true,
  },
  {
    name: '新手引導',
    trigger: '註冊3天未打卡',
    template: '引導信模板',
    sent: 56,
    openRate: 61,
    enabled: true,
  },
  {
    name: '週報通知',
    trigger: '每週一',
    template: '週報模板',
    sent: 78,
    openRate: 38,
    enabled: true,
  },
  {
    name: '標籤歡迎',
    trigger: '加入VIP標籤',
    template: 'VIP歡迎信',
    sent: 11,
    openRate: 72,
    enabled: false,
  },
]

const executionLogs = [
  {
    rule: '沉睡喚回',
    recipient: 'user42@example.com',
    sentAt: '2025-12-20 14:32',
    status: '成功',
  },
  {
    rule: '新手引導',
    recipient: 'newbie@example.com',
    sentAt: '2025-12-20 10:15',
    status: '成功',
  },
  {
    rule: '週報通知',
    recipient: 'active@example.com',
    sentAt: '2025-12-19 09:00',
    status: '成功',
  },
  {
    rule: '沉睡喚回',
    recipient: 'old_user@example.com',
    sentAt: '2025-12-19 08:45',
    status: '失敗',
  },
  {
    rule: '標籤歡迎',
    recipient: 'vip_new@example.com',
    sentAt: '2025-12-18 16:20',
    status: '成功',
  },
]

export function TriggeredEmailsPage() {
  const [rules, setRules] = useState<Rule[]>(initialRules)

  function toggleRule(index: number) {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, enabled: !r.enabled } : r)))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">觸發式郵件</h1>
        <button
          type="button"
          onClick={() => alert('功能開發中')}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          新增規則
        </button>
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
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="heading-sm mb-4">郵件規則</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
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
                <tr key={rule.name} className="border-b border-border last:border-0">
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
                    <button
                      type="button"
                      onClick={() => toggleRule(index)}
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
                          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
                          rule.enabled ? 'translate-x-4' : 'translate-x-0',
                        )}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Log */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="heading-sm mb-4">最近執行紀錄</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">規則</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">收件人</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">發送時間</th>
                <th className="pb-3 font-medium text-muted-foreground">狀態</th>
              </tr>
            </thead>
            <tbody>
              {executionLogs.map((log) => (
                <tr
                  key={`${log.rule}-${log.sentAt}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-3 pr-4 font-medium">{log.rule}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{log.recipient}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{log.sentAt}</td>
                  <td
                    className={cn(
                      'py-3 text-sm font-medium',
                      log.status === '成功'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400',
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
