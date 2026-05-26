import { Mail, MailCheck, MailWarning, Send, Timer } from 'lucide-react'
import { ExportButton } from '@/components/ExportButton'
import { StatCard } from '@/components/StatCard'

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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">郵件管理</h1>
        <ExportButton data={exportData} columns={exportColumns} fileName="emails" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="總發送" value="12,345" icon={Mail} change={8.1} changeLabel="較上月" />
        <StatCard title="成功率" value="98.5%" icon={MailCheck} change={0.3} changeLabel="較上月" />
        <StatCard title="退信率" value="1.2%" icon={MailWarning} change={-0.2} changeLabel="較上月" />
        <StatCard title="佇列待發" value={3} icon={Timer} />
      </div>

      {/* SMTP Status + Send Form */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* SMTP Status */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="heading-sm mb-4">SMTP 狀態</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">狀態</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                已連線
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">提供者</span>
              <span className="text-sm font-medium">SendGrid</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">最後檢查</span>
              <span className="text-sm font-medium">2 分鐘前</span>
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
