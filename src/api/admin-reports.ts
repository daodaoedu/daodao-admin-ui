import apiClient from './client'
import type { ApiResponse } from './types'

// ── Scheduled Reports ─────────────────────────────────────

export interface ScheduledReport {
  id: string
  name: string
  frequency: string
  recipients: string
  sections: string
  lastSent: string | null
  enabled: boolean
}

export interface ScheduledReportHistory {
  id: string
  reportId: string
  name: string
  sentAt: string
  recipients: string
  success: boolean
}

export interface ScheduledReportCreate {
  name: string
  frequency: string
  recipients: string
  sections: string
  enabled?: boolean
}

export interface ScheduledReportUpdate {
  name?: string
  frequency?: string
  recipients?: string
  sections?: string
  enabled?: boolean
}

export const listScheduledReports = () =>
  apiClient.get<ApiResponse<ScheduledReport[]>>('/daodao-server/api/v1/admin/reports/scheduled')

export const createScheduledReport = (data: ScheduledReportCreate) =>
  apiClient.post<ApiResponse<ScheduledReport>>(
    '/daodao-server/api/v1/admin/reports/scheduled',
    data,
  )

export const updateScheduledReport = (id: string, data: ScheduledReportUpdate) =>
  apiClient.put<ApiResponse<ScheduledReport>>(
    `/daodao-server/api/v1/admin/reports/scheduled/${id}`,
    data,
  )

export const deleteScheduledReport = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`/daodao-server/api/v1/admin/reports/scheduled/${id}`)

export const getScheduledReportHistory = (id: string) =>
  apiClient.get<ApiResponse<ScheduledReportHistory[]>>(
    `/daodao-server/api/v1/admin/reports/scheduled/${id}/history`,
  )

// ── Custom Reports ────────────────────────────────────────

export interface CustomReportField {
  key: string
  label: string
}

export interface CustomReportQueryResult {
  fields: string[]
  rows: Record<string, string>[]
}

export interface SavedReport {
  id: string
  name: string
  fields: string[]
  createdAt: string
}

export interface CustomReportQueryParams {
  fields: string[]
  filters?: Record<string, unknown>
  limit?: number
  offset?: number
}

export interface SaveReportParams {
  name: string
  fields: string[]
}

export const getCustomReportFields = () =>
  apiClient.get<ApiResponse<CustomReportField[]>>(
    '/daodao-server/api/v1/admin/reports/custom/fields',
  )

export const runCustomReportQuery = (params: CustomReportQueryParams) =>
  apiClient.post<ApiResponse<CustomReportQueryResult>>(
    '/daodao-server/api/v1/admin/reports/custom/query',
    params,
  )

export const listSavedReports = () =>
  apiClient.get<ApiResponse<SavedReport[]>>('/daodao-server/api/v1/admin/reports/custom/saved')

export const saveCustomReport = (params: SaveReportParams) =>
  apiClient.post<ApiResponse<SavedReport>>(
    '/daodao-server/api/v1/admin/reports/custom/saved',
    params,
  )

export const deleteSavedReport = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`/daodao-server/api/v1/admin/reports/custom/saved/${id}`)

// ── Alerts ────────────────────────────────────────────────

export interface AlertRule {
  id: string
  name: string
  metric: string
  condition: string
  threshold: string
  notification: string
  enabled: boolean
}

export interface AlertHistoryItem {
  id: string
  rule: string
  triggeredAt: string
  metricValue: string
  threshold: string
  handled: boolean
}

export interface AlertRuleCreate {
  name: string
  metric: string
  condition: string
  threshold: string
  notification: string
  enabled?: boolean
}

export interface AlertRuleUpdate {
  name?: string
  metric?: string
  condition?: string
  threshold?: string
  notification?: string
  enabled?: boolean
}

export const listAlertRules = () =>
  apiClient.get<ApiResponse<AlertRule[]>>('/daodao-server/api/v1/admin/alerts/rules')

export const createAlertRule = (data: AlertRuleCreate) =>
  apiClient.post<ApiResponse<AlertRule>>('/daodao-server/api/v1/admin/alerts/rules', data)

export const updateAlertRule = (id: string, data: AlertRuleUpdate) =>
  apiClient.put<ApiResponse<AlertRule>>(`/daodao-server/api/v1/admin/alerts/rules/${id}`, data)

export const deleteAlertRule = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`/daodao-server/api/v1/admin/alerts/rules/${id}`)

export const listAlertHistory = (params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<AlertHistoryItem[]>>('/daodao-server/api/v1/admin/alerts/history', {
    params,
  })
