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
  apiClient.get<ApiResponse<NotificationListResponse>>(
    '/daodao-server/api/v1/admin/notifications',
    { params },
  )

export interface NotificationCreate {
  title: string
  type: string
  target: string
  content?: string
  scheduledAt?: string
}

export const createNotification = (data: NotificationCreate) =>
  apiClient.post<ApiResponse<NotificationItem>>('/daodao-server/api/v1/admin/notifications', data)

export const sendNotification = (id: string) =>
  apiClient.post<ApiResponse<null>>(`/daodao-server/api/v1/admin/notifications/${id}/send`)

export interface NotificationStats {
  sent: number
  read: number
  readRate: number
}

export const getNotificationStats = (id: string) =>
  apiClient.get<ApiResponse<NotificationStats>>(
    `/daodao-server/api/v1/admin/notifications/${id}/stats`,
  )

// ── Email Triggers ────────────────────────────────────────

export interface EmailTriggerRule {
  id: string
  name: string
  trigger: string
  template: string
  sent: number
  openRate: number
  enabled: boolean
}

export interface EmailTriggerLog {
  id: string
  rule: string
  recipient: string
  sentAt: string
  status: string
}

export interface EmailTriggerStats {
  totalSent: number
  openRate: number
  activeRules: number
  sentChange: number
  openRateChange: number
}

export interface EmailTriggerCreate {
  name: string
  trigger: string
  template: string
  enabled?: boolean
}

export interface EmailTriggerUpdate {
  name?: string
  trigger?: string
  template?: string
  enabled?: boolean
}

export const listEmailTriggers = () =>
  apiClient.get<ApiResponse<EmailTriggerRule[]>>('/daodao-server/api/v1/admin/email-triggers')

export const createEmailTrigger = (data: EmailTriggerCreate) =>
  apiClient.post<ApiResponse<EmailTriggerRule>>('/daodao-server/api/v1/admin/email-triggers', data)

export const updateEmailTrigger = (id: string, data: EmailTriggerUpdate) =>
  apiClient.put<ApiResponse<EmailTriggerRule>>(
    `/daodao-server/api/v1/admin/email-triggers/${id}`,
    data,
  )

export const deleteEmailTrigger = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`/daodao-server/api/v1/admin/email-triggers/${id}`)

export const getEmailTriggerLog = (id: string, params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<EmailTriggerLog[]>>(
    `/daodao-server/api/v1/admin/email-triggers/${id}/log`,
    { params },
  )

export const getEmailTriggerStats = (id: string) =>
  apiClient.get<ApiResponse<EmailTriggerStats>>(
    `/daodao-server/api/v1/admin/email-triggers/${id}/stats`,
  )

// ── Email Templates ───────────────────────────────────────

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  createdAt: string
  updatedAt: string | null
}

export interface EmailTemplateCreate {
  name: string
  subject: string
  body: string
}

export interface EmailTemplateUpdate {
  name?: string
  subject?: string
  body?: string
}

export const listEmailTemplates = () =>
  apiClient.get<ApiResponse<EmailTemplate[]>>('/daodao-server/api/v1/admin/email-templates')

export const createEmailTemplate = (data: EmailTemplateCreate) =>
  apiClient.post<ApiResponse<EmailTemplate>>('/daodao-server/api/v1/admin/email-templates', data)

export const updateEmailTemplate = (id: string, data: EmailTemplateUpdate) =>
  apiClient.put<ApiResponse<EmailTemplate>>(
    `/daodao-server/api/v1/admin/email-templates/${id}`,
    data,
  )

export const deleteEmailTemplate = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`/daodao-server/api/v1/admin/email-templates/${id}`)
