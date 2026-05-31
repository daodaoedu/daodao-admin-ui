import apiClient from './client'
import type { ApiResponse } from './types'

// ── Admin Notifications ─────────────────────────────────

export interface AdminNotification {
  id: number
  title: string
  content: string | null
  type: string
  target: string
  status: string
  sent_at: string | null
  read_count: number
  total_sent: number
  created_at: string
  updated_at: string
  created_by: number | null
}

export interface AdminNotificationListResponse {
  items: AdminNotification[]
  total: number
}

export interface AdminNotificationStats {
  totalSent: number
  avgReadRate: number
  scheduled: number
}

export interface CreateAdminNotificationPayload {
  title: string
  content?: string
  type: string
  target: string
  status?: 'draft' | 'scheduled' | 'sent'
}

export const listAdminNotifications = (params?: {
  limit?: number
  offset?: number
  status?: string
  type?: string
}) =>
  apiClient.get<ApiResponse<AdminNotificationListResponse>>('/api/v1/admin/notifications', {
    params,
  })

export const getAdminNotificationStats = () =>
  apiClient.get<ApiResponse<AdminNotificationStats>>('/api/v1/admin/notifications/stats')

export const createAdminNotification = (data: CreateAdminNotificationPayload) =>
  apiClient.post<ApiResponse<AdminNotification>>('/api/v1/admin/notifications', data)

export const updateAdminNotification = (
  id: number,
  data: Partial<CreateAdminNotificationPayload>,
) => apiClient.put<ApiResponse<AdminNotification>>(`/api/v1/admin/notifications/${id}`, data)

export const sendAdminNotification = (id: number) =>
  apiClient.post<ApiResponse<AdminNotification>>(`/api/v1/admin/notifications/${id}/send`)

export const deleteAdminNotification = (id: number) =>
  apiClient.delete<ApiResponse<null>>(`/api/v1/admin/notifications/${id}`)

// ── Triggered Email Rules ───────────────────────────────

export interface EmailTriggerRule {
  id: number
  name: string
  description: string | null
  trigger_type: string
  trigger_config: Record<string, unknown>
  template: string
  subject: string
  enabled: boolean
  sent_count: number
  open_rate: number
  created_at: string
  updated_at: string
  created_by: number | null
}

export interface EmailTriggerRuleListResponse {
  items: EmailTriggerRule[]
  total: number
}

export interface EmailTriggerLog {
  id: number
  rule_id: number
  rule_name: string
  recipient: string
  status: string
  sent_at: string
}

export interface EmailTriggerLogListResponse {
  items: EmailTriggerLog[]
  total: number
}

export interface EmailTriggerStats {
  totalRules: number
  enabledRules: number
  monthlySent: number
  monthlySuccess: number
  avgOpenRate: number
}

export interface CreateEmailTriggerRulePayload {
  name: string
  description?: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  template: string
  subject: string
  enabled?: boolean
}

export const listEmailTriggerRules = (params?: {
  limit?: number
  offset?: number
  enabled?: boolean
}) =>
  apiClient.get<ApiResponse<EmailTriggerRuleListResponse>>('/api/v1/admin/email/trigger-rules', {
    params,
  })

export const getEmailTriggerStats = () =>
  apiClient.get<ApiResponse<EmailTriggerStats>>('/api/v1/admin/email/trigger-rules/stats')

export const createEmailTriggerRule = (data: CreateEmailTriggerRulePayload) =>
  apiClient.post<ApiResponse<EmailTriggerRule>>('/api/v1/admin/email/trigger-rules', data)

export const updateEmailTriggerRule = (id: number, data: Partial<CreateEmailTriggerRulePayload>) =>
  apiClient.put<ApiResponse<EmailTriggerRule>>(`/api/v1/admin/email/trigger-rules/${id}`, data)

export const toggleEmailTriggerRule = (id: number, enabled: boolean) =>
  apiClient.patch<ApiResponse<EmailTriggerRule>>(`/api/v1/admin/email/trigger-rules/${id}/toggle`, {
    enabled,
  })

export const deleteEmailTriggerRule = (id: number) =>
  apiClient.delete<ApiResponse<null>>(`/api/v1/admin/email/trigger-rules/${id}`)

export const listEmailTriggerLogs = (params?: {
  limit?: number
  offset?: number
  rule_id?: number
  status?: string
}) =>
  apiClient.get<ApiResponse<EmailTriggerLogListResponse>>('/api/v1/admin/email/trigger-logs', {
    params,
  })
