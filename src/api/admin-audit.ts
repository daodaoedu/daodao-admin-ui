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
  apiClient.get<ApiResponse<AuditLogListResponse>>('/daodao-server/api/v1/admin/audit-logs', {
    params,
  })

// ── Compliance Hold ──────────────────────────────────────

export interface ComplianceHoldBody {
  dateFrom: string
  dateTo: string
}

export const createComplianceHold = (body: ComplianceHoldBody) =>
  apiClient.post<ApiResponse<null>>('/daodao-server/api/v1/admin/audit-logs/compliance-hold', body)

// ── Data Retention Policy ────────────────────────────────

export interface DataRetentionPolicy {
  retentionDays: number
  [key: string]: unknown
}

export const getDataRetentionPolicy = () =>
  apiClient.get<ApiResponse<DataRetentionPolicy>>(
    '/daodao-server/api/v1/admin/data-retention-policy',
  )

export const updateDataRetentionPolicy = (body: DataRetentionPolicy) =>
  apiClient.put<ApiResponse<DataRetentionPolicy>>(
    '/daodao-server/api/v1/admin/data-retention-policy',
    body,
  )
