import apiClient from './client'
import type { ApiResponse } from './types'

// ── System Monitoring, Email Management ──────────────────

export const getSystemMonitor = () =>
  apiClient.get<ApiResponse<unknown>>('/api/v1/admin/system/monitor')

export const getEmailStats = () =>
  apiClient.get<ApiResponse<unknown>>('/api/v1/admin/email/stats')

export const getEmailHealth = () =>
  apiClient.get<ApiResponse<unknown>>('/api/v1/admin/email/health')

// TODO: implement remaining system endpoints
