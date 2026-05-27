import { ChevronDown, Clock, Inbox, MessageSquare, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
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

const mockFeedback: FeedbackItem[] = [
  {
    id: 1,
    userName: '王小明',
    avatarColor: 'bg-blue-500',
    date: '2025-12-20',
    category: 'Bug',
    status: '待處理',
    content:
      '在使用學習路徑功能時，切換到第三個章節後頁面會卡住無法滾動。我嘗試了重新整理頁面但問題依然存在。使用的瀏覽器是 Chrome 120，作業系統是 macOS Sonoma。希望能儘快修復，因為這影響到我的學習進度。',
  },
  {
    id: 2,
    userName: '李美玲',
    avatarColor: 'bg-green-500',
    date: '2025-12-19',
    category: '功能建議',
    status: '已回覆',
    content:
      '建議新增深色模式功能，長時間使用平台時眼睛比較不會疲勞。另外，如果能支援自訂主題色彩就更好了，可以讓每個使用者有個人化的體驗。',
  },
  {
    id: 3,
    userName: '張大衛',
    avatarColor: 'bg-purple-500',
    date: '2025-12-18',
    category: '問題',
    status: '待處理',
    content:
      '請問如何將我的學習紀錄匯出成 PDF？我需要提交給學校作為學習證明，但找不到相關功能的位置。',
  },
  {
    id: 4,
    userName: '陳怡君',
    avatarColor: 'bg-amber-500',
    date: '2025-12-17',
    category: '其他',
    status: '已關閉',
    content:
      '感謝島島阿學團隊提供這麼棒的學習平台！我已經在上面學習了三個月，收穫很多。希望平台能持續成長，加油！',
  },
  {
    id: 5,
    userName: '林志偉',
    avatarColor: 'bg-red-500',
    date: '2025-12-16',
    category: 'Bug',
    status: '已回覆',
    content:
      '上傳頭像時出現錯誤訊息「檔案格式不支援」，但我上傳的是 PNG 檔案，應該是支援的格式才對。檔案大小約 500KB，並沒有超過限制。',
  },
  {
    id: 6,
    userName: '黃雅婷',
    avatarColor: 'bg-teal-500',
    date: '2025-12-15',
    category: '功能建議',
    status: '待處理',
    content:
      '希望能新增社群討論功能，讓學習相同主題的使用者可以互相交流心得。類似論壇的形式，可以發文和回覆，也可以按讚和收藏。',
  },
]

const categoryBadgeClass: Record<FeedbackCategory, string> = {
  Bug: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  功能建議: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  問題: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  其他: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const statusBadgeClass: Record<FeedbackStatus, string> = {
  待處理: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  已回覆: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  已關閉: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const statusOptions: ('全部' | FeedbackStatus)[] = ['全部', '待處理', '已回覆', '已關閉']
const categoryOptions: ('全部' | FeedbackCategory)[] = ['全部', 'Bug', '功能建議', '問題', '其他']

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
    (apiData?.items as unknown as FeedbackItem[] | undefined) ?? mockFeedback
  const feedbackStats = apiData?.stats ?? {
    total: 89,
    pending: 12,
    thisMonth: 23,
    totalChange: 8.2,
    pendingChange: -15.3,
    thisMonthChange: 5.1,
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
          <select
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '全部' | FeedbackStatus)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === '全部' ? '全部狀態' : s}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as '全部' | FeedbackCategory)}
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c === '全部' ? '全部分類' : c}
              </option>
            ))}
          </select>
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
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Summary row */}
              <button
                type="button"
                className="flex w-full items-start gap-4 p-5 text-left"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
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
              </button>

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
                        <select
                          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          value={statusChanges[item.id] ?? item.status}
                          onChange={(e) =>
                            setStatusChanges((prev) => ({
                              ...prev,
                              [item.id]: e.target.value as FeedbackStatus,
                            }))
                          }
                        >
                          <option value="待處理">待處理</option>
                          <option value="已回覆">已回覆</option>
                          <option value="已關閉">已關閉</option>
                        </select>
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
          <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
            <p className="text-muted-foreground">沒有符合條件的回饋</p>
          </div>
        )}
      </div>
    </div>
  )
}
