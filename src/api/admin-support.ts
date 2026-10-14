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
  content: string
  category: FeedbackCategory
  status: FeedbackStatus
  createdAt: string
  repliedAt: string | null
  /** 錯誤回報附的截圖網址（http(s)）；沒有截圖為空陣列 */
  screenshots: string[]
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
  status?: FeedbackStatus
  category?: FeedbackCategory
  limit?: number
  offset?: number
}) =>
  apiClient.get<ApiResponse<FeedbackListResponse>>('/daodao-server/api/v1/admin/feedback', {
    params,
  })

export const updateFeedbackStatus = (id: number, data: { status: string }) =>
  apiClient.patch<ApiResponse<{ success: boolean }>>(
    `/daodao-server/api/v1/admin/feedback/${id}`,
    data,
  )

export const replyToFeedback = (id: number, data: { content: string }) =>
  apiClient.post<ApiResponse<{ success: boolean }>>(
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
