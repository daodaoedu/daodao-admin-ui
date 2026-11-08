import type {
  FeedbackCategory,
  FeedbackItem,
  FeedbackReplyEmailStatus,
  FeedbackReplyResult,
  FeedbackStatus,
} from '@/api/admin-support'

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
  /** 回報者帳號 email；沒有為 null */
  userEmail: string | null
  content: string
  screenshots: string[]
  /** 錯誤回報的處理資訊（只列有值的欄位）；不是錯誤回報表單來的為空陣列（daodao#451 AC-03） */
  bugReportFields: BugReportField[]
  replies: FeedbackReplyView[]
}

export interface BugReportField {
  label: string
  value: string
  /** 可點開的 http(s) 連結 */
  href?: string
}

export interface FeedbackReplyView {
  id: number
  content: string
  /** 台灣時間 YYYY-MM-DD HH:mm */
  time: string
  /** 寄信狀態標籤；舊回覆沒有紀錄為 null */
  delivery: ReplyDeliveryView | null
}

export interface ReplyDeliveryView {
  label: string
  tone: 'success' | 'error' | 'muted'
}

/** server 的問題區域值 → 畫面標籤（與前台錯誤回報表單選項一致） */
export const BUG_AREA_LABEL: Record<string, string> = {
  ui: '介面顯示',
  performance: '效能',
  auth: '登入/帳號',
  data: '資料異常',
  other: '其他',
}

/** 回覆信寄送狀態 → 標籤；失敗不可顯示成已送達（daodao#451 AC-02） */
export function replyDeliveryView(
  status: FeedbackReplyEmailStatus | null | undefined,
): ReplyDeliveryView | null {
  switch (status) {
    case 'sent':
      return { label: '已寄信給回報者', tone: 'success' }
    case 'failed':
      return { label: '寄信失敗，回報者沒有收到信', tone: 'error' }
    case 'pending':
      return { label: '寄信中或結果未知', tone: 'muted' }
    case 'skipped':
      return { label: '未寄信', tone: 'muted' }
    default:
      return null
  }
}

/** 送出回覆後的提示：依 server 回傳的寄信結果，失敗時明講回報者沒收到 */
export function replyNotice(result: FeedbackReplyResult | undefined): {
  type: 'success' | 'error'
  message: string
} {
  switch (result?.emailStatus) {
    case 'sent':
      return { type: 'success', message: '已送出回覆，並寄信與站內通知回報者' }
    case 'no_recipient':
      return {
        type: 'error',
        message: '回覆已保存，但回報者沒有可寄送的信箱（或帳號已刪除），沒有寄出信件',
      }
    case 'failed':
      return { type: 'error', message: '回覆已保存，但寄信失敗，回報者沒有收到信' }
    default:
      return { type: 'error', message: '回覆已保存，但無法確認是否已寄信給回報者' }
  }
}

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value)

function toBugReportFields(bugReport: FeedbackItem['bugReport']): BugReportField[] {
  if (!bugReport) return []
  const fields: BugReportField[] = []
  if (bugReport.area)
    fields.push({ label: '問題區域', value: BUG_AREA_LABEL[bugReport.area] ?? bugReport.area })
  if (bugReport.link)
    fields.push({
      label: '相關連結',
      value: bugReport.link,
      href: isHttpUrl(bugReport.link) ? bugReport.link : undefined,
    })
  if (bugReport.referrer)
    fields.push({
      label: '來源頁面',
      value: bugReport.referrer,
      href: isHttpUrl(bugReport.referrer) ? bugReport.referrer : undefined,
    })
  if (bugReport.userAgent) fields.push({ label: '瀏覽器', value: bugReport.userAgent })
  return fields
}

/** 網址 ?id= → 要展開的回饋 id（通知信的後台連結，daodao#451 AC-04）；不是正整數回 null */
export function feedbackIdFromSearch(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const timeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const formatTaipeiTime = (iso: string): string => {
  const parts = Object.fromEntries(
    timeFormatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

/** 回覆輸入 → API body；空白不送出 */
export function toReplyPayload(text: string): { content: string } | null {
  const content = text.trim()
  return content ? { content } : null
}

/** 狀態選單 → API body；沒變就不送出 */
export function toStatusPayload(
  current: FeedbackStatus,
  selected: FeedbackStatus,
): { status: FeedbackStatus } | null {
  return current === selected ? null : { status: selected }
}

/**
 * 回覆／變更狀態失敗時顯示的訊息：server 的 message，驗證錯誤附上欄位訊息。
 * 不是 API 錯誤（斷線等）時回 fallback。
 */
export function feedbackActionErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback
  const apiError = (
    error as {
      response?: { data?: { error?: { message?: string; details?: Record<string, unknown> } } }
    }
  ).response?.data?.error
  if (!apiError?.message) return fallback
  const details = Object.values(apiError.details ?? {}).filter(
    (detail): detail is string => typeof detail === 'string',
  )
  return details.length > 0 ? `${apiError.message}（${details.join('；')}）` : apiError.message
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
    userEmail: item.userEmail?.trim() || null,
    content: item.content,
    // 舊版 server 回應沒有這個欄位
    screenshots: item.screenshots ?? [],
    bugReportFields: toBugReportFields(item.bugReport ?? null),
    // 舊版 server 回應沒有這個欄位
    replies: (item.replies ?? []).map((reply) => ({
      id: reply.id,
      content: reply.content,
      time: formatTaipeiTime(reply.createdAt),
      delivery: replyDeliveryView(reply.emailStatus),
    })),
  }
}
