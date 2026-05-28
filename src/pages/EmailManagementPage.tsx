import { Mail, MailCheck, MailWarning, Send, Timer } from 'lucide-react'
import { useState } from 'react'
import { ExportButton } from '@/components/ExportButton'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import {
  useEmailHealth,
  useEmailHistory,
  useEmailStats,
  useSendEmail,
} from '@/hooks/useEmailManagement'

const exportColumns = [
  { key: 'to', header: '收件人' },
  { key: 'subject', header: '主旨' },
  { key: 'status', header: '狀態' },
  { key: 'sentAt', header: '發送時間' },
]

export function EmailManagementPage() {
  const { data: statsData } = useEmailStats()
  const { data: healthData } = useEmailHealth()
  const { data: historyData } = useEmailHistory({ limit: 50 })
  const sendEmailMutation = useSendEmail()

  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  const stats = statsData ?? {
    totalSent: 0,
    successRate: 0,
    bounceRate: 0,
    queuePending: 0,
    sentChange: 0,
    successRateChange: 0,
    bounceRateChange: 0,
  }
  const health = healthData ?? {
    status: 'disconnected',
    provider: '未設定',
    lastChecked: '-',
  }
  const exportData = (historyData?.items ?? []).map((item) => ({
    to: item.recipient,
    subject: item.subject,
    status: item.status,
    sentAt: item.sentAt,
  }))

  const isConnected = health.status === 'connected'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">郵件管理</h1>
        <ExportButton
          data={exportData as unknown as Record<string, unknown>[]}
          columns={exportColumns}
          fileName="emails"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="總發送"
          value={stats.totalSent.toLocaleString()}
          icon={Mail}
          change={stats.sentChange}
          changeLabel="較上月"
        />
        <StatCard
          title="成功率"
          value={`${stats.successRate}%`}
          icon={MailCheck}
          change={stats.successRateChange}
          changeLabel="較上月"
        />
        <StatCard
          title="退信率"
          value={`${stats.bounceRate}%`}
          icon={MailWarning}
          change={stats.bounceRateChange}
          changeLabel="較上月"
        />
        <StatCard title="佇列待發" value={stats.queuePending} icon={Timer} />
      </div>

      {/* SMTP Status + Send Form */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* SMTP Status */}
        <div className="admin-panel-card p-5">
          <h2 className="heading-sm mb-4">SMTP 狀態</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">狀態</span>
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-medium ${isConnected ? 'text-success' : 'text-destructive'}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`}
                />
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
        <div className="admin-panel-card p-5">
          <h2 className="heading-sm mb-4">手動發信</h2>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!emailTo || !emailSubject || !emailBody) return
              sendEmailMutation.mutate(
                { to: emailTo, subject: emailSubject, body: emailBody },
                {
                  onSuccess: () => {
                    setEmailTo('')
                    setEmailSubject('')
                    setEmailBody('')
                  },
                },
              )
            }}
          >
            <div>
              <label htmlFor="email-to" className="mb-1 block text-sm font-medium">
                收件人
              </label>
              <Input
                id="email-to"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label htmlFor="email-subject" className="mb-1 block text-sm font-medium">
                主旨
              </label>
              <Input
                id="email-subject"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="郵件主旨"
              />
            </div>
            <div>
              <label htmlFor="email-body" className="mb-1 block text-sm font-medium">
                內容
              </label>
              <Textarea
                id="email-body"
                rows={4}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="郵件內容..."
                className="resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={sendEmailMutation.isPending || !emailTo || !emailSubject || !emailBody}
            >
              <Send className="h-4 w-4" />
              {sendEmailMutation.isPending ? '發送中...' : '發送'}
            </Button>
            {sendEmailMutation.isError && (
              <p className="text-sm text-destructive">發送失敗，請稍後再試</p>
            )}
            {sendEmailMutation.isSuccess && <p className="text-sm text-success">郵件已成功發送</p>}
          </form>
        </div>
      </div>
    </div>
  )
}
