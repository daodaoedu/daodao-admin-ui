import { Mail, MailCheck, MailWarning, Send, Timer } from 'lucide-react'
import { ExportButton } from '@/components/ExportButton'
import { StatCard } from '@/components/StatCard'
import { useEmailStats, useEmailHealth } from '@/hooks/useEmailManagement'
import type { EmailStats, EmailHealth } from '@/api/admin-system'

const mockStats: EmailStats = {
  totalSent: 12_345,
  successRate: 98.5,
  bounceRate: 1.2,
  queuePending: 3,
  sentChange: 8.1,
  successRateChange: 0.3,
  bounceRateChange: -0.2,
}

const mockHealth: EmailHealth = {
  status: 'connected',
  provider: 'SendGrid',
  lastChecked: '2 分鐘前',
}

const exportColumns = [
  { key: 'to', header: '收件人' },
  { key: 'subject', header: '主旨' },
  { key: 'status', header: '狀態' },
  { key: 'sentAt', header: '發送時間' },
]

const exportData = [
  { to: 'user1@example.com', subject: '歡迎加入', status: '已發送', sentAt: '2025-12-20 10:30' },
  { to: 'user2@example.com', subject: '密碼重設', status: '已發送', sentAt: '2025-12-20 09:15' },
  { to: 'user3@example.com', subject: '週報通知', status: '退信', sentAt: '2025-12-19 18:00' },
]

export function EmailManagementPage() {
  const { data: statsData } = useEmailStats()
  const { data: healthData } = useEmailHealth()

  const stats = statsData ?? mockStats
  const health = healthData ?? mockHealth

  const isConnected = health.status === 'connected'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">郵件管理</h1>
        <ExportButton data={exportData} columns={exportColumns} fileName="emails" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="總發送" value={stats.totalSent.toLocaleString()} icon={Mail} change={stats.sentChange} changeLabel="較上月" />
        <StatCard title="成功率" value={`${stats.successRate}%`} icon={MailCheck} change={stats.successRateChange} changeLabel="較上月" />
        <StatCard title="退信率" value={`${stats.bounceRate}%`} icon={MailWarning} change={stats.bounceRateChange} changeLabel="較上月" />
        <StatCard title="佇列待發" value={stats.queuePending} icon={Timer} />
      </div>

      {/* SMTP Status + Send Form */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* SMTP Status */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="heading-sm mb-4">SMTP 狀態</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">狀態</span>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                {isConnected ? '已連線' : '已斷線'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">提供者</span>
              <span className="text-sm font-medium">{health.provider}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">最後檢查</span>
              <span className="text-sm font-medium">{health.lastChecked}</span>
            </div>
          </div>
        </div>

        {/* Send Email Form */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="heading-sm mb-4">手動發信</h2>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              alert('功能開發中')
            }}
          >
            <div>
              <label htmlFor="email-to" className="mb-1 block text-sm font-medium">
                收件人
              </label>
              <input
                id="email-to"
                type="email"
                placeholder="user@example.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="email-subject" className="mb-1 block text-sm font-medium">
                主旨
              </label>
              <input
                id="email-subject"
                type="text"
                placeholder="郵件主旨"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="email-body" className="mb-1 block text-sm font-medium">
                內容
              </label>
              <textarea
                id="email-body"
                rows={4}
                placeholder="郵件內容..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
              發送
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
