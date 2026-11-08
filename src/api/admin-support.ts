import apiClient from './client'
import type { ApiResponse } from './types'

// ── Feedback, FAQ ────────────────────────────────────────

// 對應 daodao-server src/types/admin-feedback.types.ts（FeedbackItem／FeedbackListResult）
export type FeedbackStatus = 'pending' | 'replied' | 'closed'
export type FeedbackCategory = 'bug' | 'feature' | 'question' | 'other'

export interface FeedbackItem {
  id: number
  userId: number | null
  userName: string | null
  /** 回報者帳號 email；沒有或使用者已刪除為 null（daodao#451；舊版 server 沒有此欄位） */
  userEmail?: string | null
  content: string
  category: FeedbackCategory
  status: FeedbackStatus
  createdAt: string
  repliedAt: string | null
  /** 錯誤回報附的截圖網址（http(s)）；沒有截圖為空陣列 */
  screenshots: string[]
  /** 錯誤回報表單的處理資訊；不是錯誤回報表單來的為 null（daodao#451；舊版 server 沒有此欄位） */
  bugReport?: FeedbackBugReport | null
  /** 後台送出的回覆，依時間由舊到新；沒有回覆為空陣列 */
  replies: FeedbackReply[]
}

export interface FeedbackBugReport {
  area: string | null
  link: string | null
  /** 送出回報時所在頁面 */
  referrer: string | null
  userAgent: string | null
}

/** 回覆信寄送結果；本功能上線前的回覆沒有紀錄為 null */
export type FeedbackReplyEmailStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export interface FeedbackReply {
  id: number
  content: string
  createdAt: string
  /** daodao#451；舊版 server 沒有此欄位 */
  emailStatus?: FeedbackReplyEmailStatus | null
}

/**
 * 回覆後 server 回傳的寄信結果：no_recipient＝回報者已刪除或沒有聯絡信箱；
 * not_applicable＝不是錯誤回報表單來的回饋，回覆只記在後台
 */
export interface FeedbackReplyResult {
  replyId: number
  emailStatus: 'sent' | 'failed' | 'no_recipient' | 'not_applicable'
}

export interface FeedbackListResponse {
  items: FeedbackItem[]
  /** 符合篩選條件的筆數 */
  total: number
  /** 全部回饋的統計（不受篩選影響） */
  stats: {
    total: number
    pending: number
    thisMonth: number
  }
}

export const listFeedback = (params?: {
  /** 只取這一則（通知信的後台連結 ?id=） */
  id?: number
  status?: FeedbackStatus
  category?: FeedbackCategory
  limit?: number
  offset?: number
}) =>
  apiClient.get<ApiResponse<FeedbackListResponse>>('/daodao-server/api/v1/admin/feedback', {
    params,
  })

export const updateFeedbackStatus = (id: number, data: { status: FeedbackStatus }) =>
  apiClient.patch<ApiResponse<{ updated: boolean }>>(
    `/daodao-server/api/v1/admin/feedback/${id}`,
    data,
  )

/** 寫入回覆後，server 寄信給回報者並建立站內通知；收件人由 server 從該筆回報取得（daodao#451） */
export const replyToFeedback = (id: number, data: { content: string }) =>
  apiClient.post<ApiResponse<FeedbackReplyResult>>(
    `/daodao-server/api/v1/admin/feedback/${id}/reply`,
    data,
  )

// ── FAQ Types ─────────────────────────────────────────────

export interface FaqCategory {
  id: number
  name: string
  slug: string
  order: number
}

export interface FaqItem {
  id: number
  categoryId: number
  question: string
  answer: string
  isPublished: boolean
  order: number
}

export interface FaqItemCreate {
  categoryId: number
  question: string
  answer: string
  isPublished?: boolean
}

export interface FaqItemUpdate {
  question?: string
  answer?: string
  isPublished?: boolean
}

// ── FAQ Endpoints ─────────────────────────────────────────

export const listFaqCategories = () =>
  apiClient.get<ApiResponse<FaqCategory[]>>('/daodao-server/api/v1/admin/faq/categories')

export const createFaqCategory = (data: { name: string; slug: string }) =>
  apiClient.post<ApiResponse<FaqCategory>>('/daodao-server/api/v1/admin/faq/categories', data)

export const listFaqItems = (params?: { categoryId?: number }) =>
  apiClient.get<ApiResponse<FaqItem[]>>('/daodao-server/api/v1/admin/faq/items', { params })

export const createFaqItem = (data: FaqItemCreate) =>
  apiClient.post<ApiResponse<FaqItem>>('/daodao-server/api/v1/admin/faq/items', data)

export const updateFaqItem = (id: number, data: FaqItemUpdate) =>
  apiClient.put<ApiResponse<FaqItem>>(`/daodao-server/api/v1/admin/faq/items/${id}`, data)

export const deleteFaqItem = (id: number) =>
  apiClient.delete<ApiResponse<null>>(`/daodao-server/api/v1/admin/faq/items/${id}`)

export const bulkPublishFaqItems = (data: { ids: number[]; isPublished: boolean }) =>
  apiClient.patch<ApiResponse<{ updated: number }>>(
    '/daodao-server/api/v1/admin/faq/items/bulk-publish',
    data,
  )
