import { useMutation, useQuery } from '@tanstack/react-query'
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
import { retryFailedEmails, sendBulkEmail, sendCustomEmail } from '@/api/admin-system'
import { listAdminUsers } from '@/api/admin'
import { EmailHistoryTable } from '@/components/EmailHistoryTable'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { useEmailHealth, useEmailStats } from '@/hooks/useEmailManagement'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import { useUserTags } from '@/hooks/useUserTags'
import { cn } from '@/lib/utils'

type RecipientMode = 'email' | 'tag' | 'users'

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
  const [formData, setFormData] = useState({ to: '', subject: '', body: '', scheduledAt: '' })
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('email')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Array<{ id: number; name: string; email: string }>>([])
  const { data: tags = [] } = useUserTags()
  const { data: searchedUsers } = useQuery({
    queryKey: ['admin-user-search', userSearch],
    queryFn: () => listAdminUsers({ search: userSearch, limit: 10 }).then((r) => r.data.data ?? []),
    enabled: recipientMode === 'users' && userSearch.length >= 2,
  })
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
    mutationFn: (data: { to: string; subject: string; body: string; scheduledAt?: string }) => {
      const isFullHtml =
        data.body.trimStart().startsWith('<!DOCTYPE') || data.body.trimStart().startsWith('<html')
      return sendCustomEmail({
        to: data.to,
        subject: data.subject,
        htmlContent: isFullHtml
          ? data.body
          : `<div style="font-family: sans-serif; line-height: 1.6;">${data.body.replace(/\n/g, '<br />')}</div>`,
        scheduledAt: data.scheduledAt || undefined,
      })
    },
    onSuccess: () => {
      const isScheduled = formData.scheduledAt !== ''
      setSendResult({
        type: 'success',
        message: isScheduled ? `郵件已排程於 ${formData.scheduledAt} 發送` : '郵件發送成功',
      })
      setFormData({ to: '', subject: '', body: '', scheduledAt: '' })
      setTimeout(() => setSendResult(null), 3000)
    },
    onError: (err: Error) => {
      setSendResult({ type: 'error', message: err.message || '郵件發送失敗' })
      setTimeout(() => setSendResult(null), 5000)
    },
  })

  const bulkMutation = useMutation({
    mutationFn: (data: { subject: string; body: string; tagIds?: number[]; userIds?: number[]; scheduledAt?: string }) => {
      const isFullHtml =
        data.body.trimStart().startsWith('<!DOCTYPE') || data.body.trimStart().startsWith('<html')
      return sendBulkEmail({
        subject: data.subject,
        htmlContent: isFullHtml
          ? data.body
          : `<div style="font-family: sans-serif; line-height: 1.6;">${data.body.replace(/\n/g, '<br />')}</div>`,
        tagIds: data.tagIds,
        userIds: data.userIds,
        scheduledAt: data.scheduledAt,
      })
    },
    onSuccess: () => {
      setSendResult({ type: 'success', message: '批量郵件已排入佇列' })
      setFormData({ to: '', subject: '', body: '', scheduledAt: '' })
      setSelectedTagIds([])
      setSelectedUsers([])
      setTimeout(() => setSendResult(null), 3000)
    },
    onError: (err: Error) => {
      setSendResult({ type: 'error', message: err.message || '批量發送失敗' })
      setTimeout(() => setSendResult(null), 5000)
    },
  })

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!formData.subject || !formData.body) return
    setSendResult(null)

    if (recipientMode === 'email') {
      if (!formData.to) return
      sendMutation.mutate({
        to: formData.to,
        subject: formData.subject,
        body: formData.body,
        scheduledAt: formData.scheduledAt || undefined,
      })
    } else if (recipientMode === 'tag') {
      if (selectedTagIds.length === 0) return
      bulkMutation.mutate({
        subject: formData.subject,
        body: formData.body,
        tagIds: selectedTagIds,
        scheduledAt: formData.scheduledAt || undefined,
      })
    } else {
      if (selectedUsers.length === 0) return
      bulkMutation.mutate({
        subject: formData.subject,
        body: formData.body,
        userIds: selectedUsers.map((u) => u.id),
        scheduledAt: formData.scheduledAt || undefined,
      })
    }
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
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">收件對象</label>
                    <div className="inline-flex rounded-lg bg-muted p-0.5 gap-0.5">
                      {([
                        { value: 'email' as const, label: '指定 Email' },
                        { value: 'tag' as const, label: '依標籤' },
                        { value: 'users' as const, label: '搜尋用戶' },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRecipientMode(opt.value)}
                          className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            recipientMode === opt.value
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {recipientMode === 'email' && (
                    <div>
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
                  )}

                  {recipientMode === 'tag' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => {
                          const isSelected = selectedTagIds.includes(tag.id)
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() =>
                                setSelectedTagIds((prev) =>
                                  isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                                )
                              }
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border text-muted-foreground hover:border-primary/50',
                              )}
                            >
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                              <span className="text-[10px] opacity-60">{tag.userCount}</span>
                            </button>
                          )
                        })}
                      </div>
                      {selectedTagIds.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          已選 {selectedTagIds.length} 個標籤，預估{' '}
                          {tags
                            .filter((t) => selectedTagIds.includes(t.id))
                            .reduce((s, t) => s + t.userCount, 0)
                            .toLocaleString()}{' '}
                          位收件者
                        </p>
                      )}
                    </div>
                  )}

                  {recipientMode === 'users' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="搜尋用戶名稱或 Email（至少 2 字）..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      {searchedUsers && searchedUsers.length > 0 && (
                        <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background">
                          {searchedUsers.map((u) => {
                            const already = selectedUsers.some((su) => su.id === u.internalId)
                            return (
                              <button
                                key={u.internalId}
                                type="button"
                                disabled={already}
                                onClick={() =>
                                  setSelectedUsers((prev) => [
                                    ...prev,
                                    { id: u.internalId, name: u.name ?? '', email: u.email ?? '' },
                                  ])
                                }
                                className={cn(
                                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                                  already ? 'opacity-40' : 'hover:bg-muted/50',
                                )}
                              >
                                <span className="font-medium">{u.name ?? '—'}</span>
                                <span className="text-xs text-muted-foreground">{u.email}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedUsers.map((u) => (
                            <span
                              key={u.id}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs"
                            >
                              {u.name || u.email}
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedUsers((prev) => prev.filter((su) => su.id !== u.id))
                                }
                                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                <div>
                  <label htmlFor="email-scheduled" className="mb-1 block text-sm font-medium">
                    預約發送時間（選填）
                  </label>
                  <div className="relative">
                    <Timer className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email-scheduled"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, scheduledAt: event.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
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
                  disabled={sendMutation.isPending || bulkMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {sendMutation.isPending || bulkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {sendMutation.isPending || bulkMutation.isPending
                    ? '發送中...'
                    : formData.scheduledAt
                      ? '排程發送'
                      : '立即發送'}
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
