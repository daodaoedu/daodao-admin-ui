import apiClient from './client'
import type { ApiResponse } from './types'

// ── Notifications, Triggered Emails ──────────────────────

export interface NotificationItem {
  title: string
  type: string
  target: string
  sentAt: string
  readRate: number
  status: string
}

export interface NotificationListResponse {
  items: NotificationItem[]
  stats: {
    totalSent: number
    avgReadRate: number
    scheduled: number
    sentChange: number
    readRateChange: number
  }
}

export const listNotifications = (params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<NotificationListResponse>>('/api/v1/admin/notifications', { params })
