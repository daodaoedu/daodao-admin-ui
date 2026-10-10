import type { FeedbackCategory, FeedbackItem, FeedbackStatus } from '@/api/admin-support'

/** server 的狀態值 → 畫面標籤 */
export const STATUS_LABEL: Record<FeedbackStatus, string> = {
  pending: '待處理',
  replied: '已回覆',
  closed: '已關閉',
}

/** server 的分類值 → 畫面標籤 */
export const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  feature: '功能建議',
  question: '問題',
  other: '其他',
}

export type FeedbackListState = 'loading' | 'error' | 'empty' | 'list'

/** API 失敗要顯示錯誤，不能落到「沒有符合條件的回饋」 */
export function feedbackListState({
  isLoading,
  isError,
  itemCount,
}: {
  isLoading: boolean
  isError: boolean
  itemCount: number
}): FeedbackListState {
  if (isError) return 'error'
  if (isLoading) return 'loading'
  return itemCount === 0 ? 'empty' : 'list'
}

/** 篩選選單的值（'all' 或 server 值）→ API query；server 只接受英文值 */
export function toFeedbackQuery(
  status: FeedbackStatus | 'all',
  category: FeedbackCategory | 'all',
): { status?: FeedbackStatus; category?: FeedbackCategory } {
  return {
    status: status === 'all' ? undefined : status,
    category: category === 'all' ? undefined : category,
  }
}

export interface FeedbackView {
  id: number
  userName: string
  initial: string
  date: string
  category: FeedbackCategory
  categoryLabel: string
  status: FeedbackStatus
  statusLabel: string
  content: string
}

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** server 回饋 → 畫面用資料（中文標籤、台灣日期、沒有暱稱的使用者給替代名稱） */
export function toFeedbackView(item: FeedbackItem): FeedbackView {
  const name = item.userName?.trim()
  const userName = name || (item.userId === null ? '已刪除的用戶' : `用戶 #${item.userId}`)
  return {
    id: item.id,
    userName,
    initial: Array.from(userName)[0] ?? '?',
    date: dateFormatter.format(new Date(item.createdAt)),
    category: item.category,
    categoryLabel: CATEGORY_LABEL[item.category] ?? item.category,
    status: item.status,
    statusLabel: STATUS_LABEL[item.status] ?? item.status,
    content: item.content,
  }
}
