import { ChevronDown, Inbox, Loader2, MessageSquare, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import type { FeedbackCategory, FeedbackStatus } from '@/api/admin-support'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useFeedback, useReplyToFeedback, useUpdateFeedbackStatus } from '@/hooks/useFeedback'
import {
  CATEGORY_LABEL,
  feedbackActionErrorMessage,
  feedbackListState,
  STATUS_LABEL,
  toFeedbackQuery,
  toFeedbackView,
  toReplyPayload,
  toStatusPayload,
} from '@/lib/feedback'
import { cn } from '@/lib/utils'

const categoryBadgeClass: Record<FeedbackCategory, string> = {
  bug: 'bg-destructive/15 text-destructive',
  feature: 'bg-info/15 text-info',
  question: 'bg-warning/15 text-warning',
  other: 'bg-muted text-muted-foreground',
}

const statusBadgeClass: Record<FeedbackStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  replied: 'bg-success/15 text-success',
  closed: 'bg-muted text-muted-foreground',
}

const STATUS_VALUES = Object.keys(STATUS_LABEL) as FeedbackStatus[]
const CATEGORY_VALUES = Object.keys(CATEGORY_LABEL) as FeedbackCategory[]
const STATUS_SELECT_OPTIONS = [
  { value: 'all', label: '全部狀態' },
  ...STATUS_VALUES.map((status) => ({ value: status, label: STATUS_LABEL[status] })),
]
const CATEGORY_SELECT_OPTIONS = [
  { value: 'all', label: '全部分類' },
  ...CATEGORY_VALUES.map((category) => ({ value: category, label: CATEGORY_LABEL[category] })),
]

export function FeedbackPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | FeedbackCategory>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({})
  const [statusChanges, setStatusChanges] = useState<Record<number, FeedbackStatus>>({})
  const [notices, setNotices] = useState<
    Record<number, { type: 'success' | 'error'; message: string }>
  >({})

  // 各則回饋各自的送出中狀態（多則可同時送出）
  const [pendingReplies, setPendingReplies] = useState<Record<number, boolean>>({})
  const [pendingStatuses, setPendingStatuses] = useState<Record<number, boolean>>({})

  const setNotice = (id: number, notice?: { type: 'success' | 'error'; message: string }) =>
    setNotices((prev) => {
      const next = { ...prev }
      if (notice) next[id] = notice
      else delete next[id]
      return next
    })

  const replyMutation = useReplyToFeedback({
    onSuccess: ({ id }) => {
      setPendingReplies((prev) => ({ ...prev, [id]: false }))
      setReplyTexts((prev) => ({ ...prev, [id]: '' }))
      setNotice(id, { type: 'success', message: '已送出回覆' })
    },
    // 失敗時保留已輸入的內容
    onError: (error, { id }) => {
      setPendingReplies((prev) => ({ ...prev, [id]: false }))
      setNotice(id, {
        type: 'error',
        message: feedbackActionErrorMessage(error, '回覆失敗，請稍後再試'),
      })
    },
  })

  const statusMutation = useUpdateFeedbackStatus({
    onSuccess: ({ id, status }) => {
      setPendingStatuses((prev) => ({ ...prev, [id]: false }))
      setStatusChanges((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setNotice(id, { type: 'success', message: `狀態已變更為「${STATUS_LABEL[status]}」` })
    },
    onError: (error, { id }) => {
      setPendingStatuses((prev) => ({ ...prev, [id]: false }))
      setNotice(id, {
        type: 'error',
        message: feedbackActionErrorMessage(error, '變更狀態失敗，請稍後再試'),
      })
    },
  })

  const submitReply = (id: number) => {
    const payload = toReplyPayload(replyTexts[id] ?? '')
    if (!payload) {
      setNotice(id, { type: 'error', message: '請先輸入回覆內容' })
      return
    }
    setNotice(id)
    setPendingReplies((prev) => ({ ...prev, [id]: true }))
    replyMutation.mutate({ id, ...payload })
  }

  const submitStatus = (id: number, current: FeedbackStatus) => {
    const payload = toStatusPayload(current, statusChanges[id] ?? current)
    if (!payload) return
    setNotice(id)
    setPendingStatuses((prev) => ({ ...prev, [id]: true }))
    statusMutation.mutate({ id, ...payload })
  }

  const {
    data: apiData,
    isLoading,
    isError,
    refetch,
  } = useFeedback(toFeedbackQuery(statusFilter, categoryFilter))

  const items = (apiData?.items ?? []).map(toFeedbackView)
  const listState = feedbackListState({ isLoading, isError, itemCount: items.length })
  const filtered = listState === 'list' ? items : []
  // 失敗或載入中不顯示 0，避免看起來像「沒有回饋」
  const statValue = (value: number | undefined) => (apiData ? (value ?? 0) : '—')

  return (
    <div className="space-y-6">
      <PageHeader
        title="意見回饋"
        description="收集用戶對平台的建議與問題回報，了解待改善的功能與痛點。"
        actions={
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | FeedbackStatus)}
              options={STATUS_SELECT_OPTIONS}
              triggerClassName="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 h-9 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as 'all' | FeedbackCategory)}
              options={CATEGORY_SELECT_OPTIONS}
              triggerClassName="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 h-9 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="總回饋" value={statValue(apiData?.stats?.total)} icon={MessageSquare} />
        <StatCard title="待處理" value={statValue(apiData?.stats?.pending)} icon={Inbox} />
        <StatCard title="本月新增" value={statValue(apiData?.stats?.thisMonth)} icon={TrendingUp} />
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {listState === 'loading' && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            載入意見回饋中
          </div>
        )}

        {listState === 'error' && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-12 text-center"
          >
            <p className="text-sm text-destructive">無法載入意見回饋，請稍後再試。</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
              再試一次
            </Button>
          </div>
        )}

        {filtered.map((item) => {
          const isExpanded = expandedId === item.id
          const isReplying = pendingReplies[item.id] === true
          const isUpdatingStatus = pendingStatuses[item.id] === true
          const selectedStatus = statusChanges[item.id] ?? item.status
          const notice = notices[item.id]
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Summary row */}
              <Button
                type="button"
                variant="ghost"
                className="flex h-auto w-full items-start gap-4 p-5 text-left"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.initial}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.userName}</span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        categoryBadgeClass[item.category],
                      )}
                    >
                      {item.categoryLabel}
                    </span>
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusBadgeClass[item.status],
                      )}
                    >
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
                </div>

                {/* Expand icon */}
                <ChevronDown
                  className={cn(
                    'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-180',
                  )}
                />
              </Button>

              {/* Expanded area */}
              {isExpanded && (
                <div className="border-t border-border px-5 pb-5 pt-4">
                  <p className="text-sm leading-relaxed">{item.content}</p>

                  {item.screenshots.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.screenshots.map((url, index) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block size-24 overflow-hidden rounded-md border border-border"
                        >
                          <img
                            src={url}
                            alt={`截圖 ${index + 1}`}
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {item.replies.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">已送出的回覆</p>
                      {item.replies.map((reply) => (
                        <div key={reply.id} className="rounded-md bg-muted/60 px-3 py-2">
                          <p className="whitespace-pre-wrap text-sm">{reply.content}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{reply.time}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    <Textarea
                      placeholder="輸入回覆內容..."
                      aria-label="回覆內容"
                      rows={3}
                      className="w-full"
                      value={replyTexts[item.id] ?? ''}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      回覆只會記錄在後台，不會寄信或通知使用者。
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        disabled={isReplying}
                        onClick={() => submitReply(item.id)}
                      >
                        {isReplying && <Loader2 className="h-4 w-4 animate-spin" />}
                        送出回覆
                      </Button>

                      <div className="flex items-center gap-2">
                        <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                          變更狀態：
                        </span>
                        <Select
                          value={selectedStatus}
                          onValueChange={(value) =>
                            setStatusChanges((prev) => ({
                              ...prev,
                              [item.id]: value as FeedbackStatus,
                            }))
                          }
                          options={STATUS_VALUES.map((status) => ({
                            value: status,
                            label: STATUS_LABEL[status],
                          }))}
                          triggerClassName="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 h-9 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                          className="min-w-32"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="shrink-0 whitespace-nowrap"
                          disabled={isUpdatingStatus || selectedStatus === item.status}
                          onClick={() => submitStatus(item.id, item.status)}
                        >
                          {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                          確認
                        </Button>
                      </div>
                    </div>
                    {notice && (
                      <p
                        role={notice.type === 'error' ? 'alert' : 'status'}
                        className={cn(
                          'text-sm',
                          notice.type === 'error' ? 'text-destructive' : 'text-success',
                        )}
                      >
                        {notice.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {listState === 'empty' && (
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-10 text-center shadow-sm">
            <p className="text-muted-foreground">沒有符合條件的回饋</p>
          </div>
        )}
      </div>
    </div>
  )
}
