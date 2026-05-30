import apiClient from './client'
import type { ApiResponse } from './types'

// ── Feedback, FAQ ────────────────────────────────────────

export interface FeedbackItem {
  id: number
  userName: string
  avatarColor: string
  date: string
  category: string
  status: string
  content: string
}

export interface FeedbackListResponse {
  items: FeedbackItem[]
  stats: {
    total: number
    pending: number
    thisMonth: number
    totalChange: number
    pendingChange: number
    thisMonthChange: number
  }
}

export const listFeedback = (params?: {
  status?: string
  category?: string
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
