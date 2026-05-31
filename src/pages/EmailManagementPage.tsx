import { useMutation } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  History,
  Loader2,
  Mail,
  MailCheck,
  MailWarning,
  RefreshCcw,
  Send,
  Timer,
} from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { retryFailedEmails, sendCustomEmail } from '@/api/admin-system'
import { EmailHistoryTable } from '@/components/EmailHistoryTable'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { useEmailHealth, useEmailStats } from '@/hooks/useEmailManagement'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import { cn } from '@/lib/utils'

type EmailTab = 'history' | 'compose' | 'retry'

const tabs: Array<{ value: EmailTab; label: string; icon: typeof History }> = [
  { value: 'history', label: '發送紀錄', icon: History },
  { value: 'compose', label: '手動發信', icon: Send },
  { value: 'retry', label: '失敗重試', icon: RefreshCcw },
]

function ResultNotice({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
        type === 'success'
          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      )}
    >
      {type === 'success' ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {message}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function EmailManagementPage() {
  const { data: stats, isLoading: statsLoading } = useEmailStats()
  const { data: health, isLoading: healthLoading } = useEmailHealth()

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as EmailTab | null) ?? 'history'
  function setActiveTab(tab: EmailTab) {
    setSearchParams({ tab }, { replace: true })
  }
  const [formData, setFormData] = useState({ to: '', subject: '', body: '' })
  const { data: templates } = useEmailTemplates()
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
    mutationFn: (data: { to: string; subject: string; body: string }) => {
      const isFullHtml =
        data.body.trimStart().startsWith('<!DOCTYPE') || data.body.trimStart().startsWith('<html')
      return sendCustomEmail({
        to: data.to,
        subject: data.subject,
        htmlContent: isFullHtml
          ? data.body
          : `<div style="font-family: sans-serif; line-height: 1.6;">${data.body.replace(/\n/g, '<br />')}</div>`,
      })
    },
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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!formData.to || !formData.subject || !formData.body) return
    setSendResult(null)
    sendMutation.mutate(formData)
  }

  const isConnected = health?.status === 'connected'

  return (
    <div className="space-y-5">
      <PageHeader
        title="郵件管理"
        description="查看郵件發送歷史、退信狀態與佇列，手動重試失敗任務。"
        actions={
          <div
            className={cn(
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
              isConnected
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300',
            )}
          >
            <span
              className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')}
            />
            {healthLoading ? '檢查 SMTP...' : isConnected ? 'SMTP 已連線' : 'SMTP 已斷線'}
          </div>
        }
      />

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

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex flex-wrap rounded-lg bg-muted p-1 gap-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const selected = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    selected
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 px-1 text-xs text-muted-foreground">
            {healthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{health?.provider ?? 'SMTP'}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>{health?.lastChecked ?? '尚未檢查'}</span>
              </>
            )}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'history' && <EmailHistoryTable />}

          {activeTab === 'compose' && (
            <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {sendResult && <ResultNotice type={sendResult.type} message={sendResult.message} />}
                {templates && templates.length > 0 && (
                  <div>
                    <label htmlFor="email-template" className="mb-1 block text-sm font-medium">
                      套用模板
                    </label>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        id="email-template"
                        className="w-full appearance-none rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        defaultValue=""
                        onChange={(e) => {
                          const tpl = templates.find((t) => String(t.id) === e.target.value)
                          if (!tpl) return
                          setFormData((prev) => ({
                            ...prev,
                            subject: tpl.subject,
                            body: tpl.body,
                          }))
                        }}
                      >
                        <option value="">選擇模板（選填）</option>
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
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
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, to: event.target.value }))
                      }
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
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, subject: event.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email-body" className="mb-1 block text-sm font-medium">
                    內容
                  </label>
                  <textarea
                    id="email-body"
                    rows={9}
                    required
                    placeholder="郵件內容..."
                    value={formData.body}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, body: event.target.value }))
                    }
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
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
                  {sendMutation.isPending ? '發送中...' : '發送'}
                </button>
              </div>

              <div className="rounded-lg border border-border bg-muted/35 p-4">
                <h2 className="text-sm font-semibold text-foreground">發送狀態</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">SMTP</span>
                    <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                      {isConnected ? '已連線' : '已斷線'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">提供者</span>
                    <span>{health?.provider ?? 'SMTP'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">最後檢查</span>
                    <span>{health?.lastChecked ?? '尚未檢查'}</span>
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'retry' && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
                    失敗郵件重試
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    重新發送佇列中所有失敗的郵件，每次最多處理 50 封。
                  </p>
                </div>
                {retryResult && (
                  <ResultNotice type={retryResult.type} message={retryResult.message} />
                )}
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
                  {retryMutation.isPending ? '重試中...' : '重試失敗郵件'}
                </button>
              </div>

              <div className="rounded-lg border border-border bg-muted/35 p-4">
                <h2 className="text-sm font-semibold text-foreground">處理範圍</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">單次上限</dt>
                    <dd className="font-medium">50 封</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">待發佇列</dt>
                    <dd className="font-medium">
                      {statsLoading ? '—' : (stats?.queuePending ?? '—')}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">退信率</dt>
                    <dd className="font-medium">
                      {statsLoading ? '—' : stats ? `${stats.bounceRate}%` : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
