import { ChevronDown, Inbox, MessageSquare, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useFeedback } from '@/hooks/useFeedback'
import { cn } from '@/lib/utils'

type FeedbackStatus = '待處理' | '已回覆' | '已關閉'
type FeedbackCategory = 'Bug' | '功能建議' | '問題' | '其他'

interface FeedbackItem {
  id: number
  userName: string
  avatarColor: string
  date: string
  category: FeedbackCategory
  status: FeedbackStatus
  content: string
}

const categoryBadgeClass: Record<FeedbackCategory, string> = {
  Bug: 'bg-destructive/15 text-destructive',
  功能建議: 'bg-info/15 text-info',
  問題: 'bg-warning/15 text-warning',
  其他: 'bg-muted text-muted-foreground',
}

const statusBadgeClass: Record<FeedbackStatus, string> = {
  待處理: 'bg-warning/15 text-warning',
  已回覆: 'bg-success/15 text-success',
  已關閉: 'bg-muted text-muted-foreground',
}

const statusOptions: ('全部' | FeedbackStatus)[] = ['全部', '待處理', '已回覆', '已關閉']
const categoryOptions: ('全部' | FeedbackCategory)[] = ['全部', 'Bug', '功能建議', '問題', '其他']
const STATUS_SELECT_OPTIONS = statusOptions.map((status) => ({
  value: status,
  label: status === '全部' ? '全部狀態' : status,
}))
const CATEGORY_SELECT_OPTIONS = categoryOptions.map((category) => ({
  value: category,
  label: category === '全部' ? '全部分類' : category,
}))

export function FeedbackPage() {
  const [statusFilter, setStatusFilter] = useState<'全部' | FeedbackStatus>('全部')
  const [categoryFilter, setCategoryFilter] = useState<'全部' | FeedbackCategory>('全部')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({})
  const [statusChanges, setStatusChanges] = useState<Record<number, FeedbackStatus>>({})

  const { data: apiData } = useFeedback({
    status: statusFilter !== '全部' ? statusFilter : undefined,
    category: categoryFilter !== '全部' ? categoryFilter : undefined,
  })

  const feedbackItems: FeedbackItem[] =
    (apiData?.items as unknown as FeedbackItem[] | undefined) ?? []
  const feedbackStats = apiData?.stats ?? {
    total: 0,
    pending: 0,
    thisMonth: 0,
    totalChange: 0,
    pendingChange: 0,
    thisMonthChange: 0,
  }

  const filtered = feedbackItems.filter((f) => {
    if (statusFilter !== '全部' && f.status !== statusFilter) return false
    if (categoryFilter !== '全部' && f.category !== categoryFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="heading-lg">意見回饋</h1>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as '全部' | FeedbackStatus)}
            options={STATUS_SELECT_OPTIONS}
            triggerClassName="admin-select"
          />
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as '全部' | FeedbackCategory)}
            options={CATEGORY_SELECT_OPTIONS}
            triggerClassName="admin-select"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="總回饋"
          value={feedbackStats.total}
          icon={MessageSquare}
          change={feedbackStats.totalChange}
          changeLabel="較上月"
        />
        <StatCard
          title="待處理"
          value={feedbackStats.pending}
          icon={Inbox}
          change={feedbackStats.pendingChange}
          changeLabel="較上月"
        />
        <StatCard
          title="本月新增"
          value={feedbackStats.thisMonth}
          icon={TrendingUp}
          change={feedbackStats.thisMonthChange}
          changeLabel="較上月"
        />
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id
          return (
            <div key={item.id} className="admin-panel-card transition-shadow hover:shadow-md">
              {/* Summary row */}
              <Button
                type="button"
                variant="ghost"
                className="flex h-auto w-full items-start gap-4 p-5 text-left"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground',
                    item.avatarColor,
                  )}
                >
                  {item.userName[0]}
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
                      {item.category}
                    </span>
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusBadgeClass[item.status],
                      )}
                    >
                      {item.status}
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

                  <div className="mt-4 space-y-3">
                    <Textarea
                      placeholder="輸入回覆內容..."
                      rows={3}
                      value={replyTexts[item.id] ?? ''}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          alert(`已送出回覆：${replyTexts[item.id] ?? '(空白)'}`)
                          setReplyTexts((prev) => ({ ...prev, [item.id]: '' }))
                        }}
                      >
                        送出回覆
                      </Button>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">變更狀態：</span>
                        <Select
                          value={statusChanges[item.id] ?? item.status}
                          onValueChange={(value) =>
                            setStatusChanges((prev) => ({
                              ...prev,
                              [item.id]: value as FeedbackStatus,
                            }))
                          }
                          options={statusOptions
                            .filter((s) => s !== '全部')
                            .map((status) => ({ value: status, label: status }))}
                          triggerClassName="admin-select"
                          className="min-w-32"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            alert(`狀態已變更為：${statusChanges[item.id] ?? item.status}`)
                          }
                        >
                          確認
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="admin-panel-card p-10 text-center shadow-sm">
            <p className="text-muted-foreground">沒有符合條件的回饋</p>
          </div>
        )}
      </div>
    </div>
  )
}
