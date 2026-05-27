import apiClient from './client'
import type { ApiResponse } from './types'

// ── Audit Log ────────────────────────────────────────────

export interface AuditLogItem {
  id: number
  time: string
  admin: string
  actionType: string
  target: string
  detail: string
  ip: string
}

export interface AuditLogListResponse {
  items: AuditLogItem[]
  total: number
}

export interface AuditLogFilters {
  admin?: string
  actionType?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  limit?: number
  offset?: number
}

export const listAuditLogs = (params?: AuditLogFilters) =>
  apiClient.get<ApiResponse<AuditLogListResponse>>('/api/v1/admin/audit-logs', { params })
