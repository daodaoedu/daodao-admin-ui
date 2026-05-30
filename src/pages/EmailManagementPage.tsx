import { useMutation } from '@tanstack/react-query'
import { Loader2, Mail, MailCheck, MailWarning, RefreshCcw, Send, Timer } from 'lucide-react'
import { useState } from 'react'
import { retryFailedEmails, sendCustomEmail } from '@/api/admin-system'
import { EmailHistoryTable } from '@/components/EmailHistoryTable'
import { ExportButton } from '@/components/ExportButton'
import { StatCard } from '@/components/StatCard'
import { useEmailHealth, useEmailStats } from '@/hooks/useEmailManagement'

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
  const { data: stats, isLoading: statsLoading } = useEmailStats()
  const { data: health, isLoading: healthLoading } = useEmailHealth()

  const [formData, setFormData] = useState({ to: '', subject: '', body: '' })
  const [sendResult, setSendResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [retryResult, setRetryResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const retryMutation = useMutation({
    mutationFn: () => retryFailedEmails(),
    onSuccess: (res) => {
      const data = res.data.data
      setRetryResult({
        type: 'success',
        message: `重試完成：${data.retried} 封重新排入佇列，${data.failed} 封失敗`,
      })
      setTimeout(() => setRetryResult(null), 5000)
    },
    onError: (err: Error) => {
      setRetryResult({ type: 'error', message: err.message || '重試失敗' })
      setTimeout(() => setRetryResult(null), 5000)
    },
  })

  const sendMutation = useMutation({
    mutationFn: (data: { to: string; subject: string; body: string }) =>
      sendCustomEmail({
        to: data.to,
        subject: data.subject,
        htmlContent: `<div style="font-family: sans-serif; line-height: 1.6;">${data.body.replace(/\n/g, '<br />')}</div>`,
      }),
    onSuccess: () => {
      setSendResult({ type: 'success', message: '郵件發送成功' })
      setFormData({ to: '', subject: '', body: '' })
      setTimeout(() => setSendResult(null), 3000)
    },
    onError: (err: Error) => {
      setSendResult({ type: 'error', message: err.message || '郵件發送失敗' })
      setTimeout(() => setSendResult(null), 5000)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.to || !formData.subject || !formData.body) return
    setSendResult(null)
    sendMutation.mutate(formData)
  }

  const isConnected = health?.status === 'connected'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">郵件管理</h1>
        <ExportButton data={exportData} columns={exportColumns} fileName="emails" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="總發送"
          value={statsLoading ? '—' : (stats?.totalSent.toLocaleString() ?? '—')}
          icon={Mail}
          change={stats?.sentChange}
          changeLabel="較上月"
        />
        <StatCard
          title="成功率"
          value={statsLoading ? '—' : stats ? `${stats.successRate}%` : '—'}
          icon={MailCheck}
          change={stats?.successRateChange}
          changeLabel="較上月"
        />
        <StatCard
          title="退信率"
          value={statsLoading ? '—' : stats ? `${stats.bounceRate}%` : '—'}
          icon={MailWarning}
          change={stats?.bounceRateChange}
          changeLabel="較上月"
        />
        <StatCard
          title="佇列待發"
          value={statsLoading ? '—' : (stats?.queuePending ?? '—')}
          icon={Timer}
        />
      </div>

      {/* Retry Failed Emails */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading-sm">失敗郵件重試</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              重新發送佇列中所有失敗的郵件（最多 50 封）
            </p>
          </div>
          <button
            type="button"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {retryMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            {retryMutation.isPending ? '重試中…' : '重試失敗郵件'}
          </button>
        </div>
        {retryResult && (
          <div
            className={`mt-3 rounded-md px-3 py-2 text-sm ${
              retryResult.type === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {retryResult.message}
          </div>
        )}
      </div>

      {/* SMTP Status + Send Form */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* SMTP Status */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="heading-sm mb-4">SMTP 狀態</h2>
          {healthLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">載入中…</span>
            </div>
          ) : health ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">狀態</span>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
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
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">無法取得 SMTP 狀態</p>
          )}
        </div>

        {/* Send Email Form */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="heading-sm mb-4">手動發信</h2>
          {sendResult && (
            <div
              className={`mb-3 rounded-md px-3 py-2 text-sm ${
                sendResult.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {sendResult.message}
            </div>
          )}
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email-to" className="mb-1 block text-sm font-medium">
                收件人
              </label>
              <input
                id="email-to"
                type="email"
                required
                placeholder="user@example.com"
                value={formData.to}
                onChange={(e) => setFormData((prev) => ({ ...prev, to: e.target.value }))}
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
                required
                placeholder="郵件主旨"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
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
                required
                placeholder="郵件內容..."
                value={formData.body}
                onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sendMutation.isPending ? '發送中…' : '發送'}
            </button>
          </form>
        </div>
      </div>

      {/* Email History Table */}
      <EmailHistoryTable />
    </div>
  )
}
