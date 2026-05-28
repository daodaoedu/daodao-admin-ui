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
