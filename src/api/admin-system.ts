import apiClient from './client'
import type { ApiResponse, EmailHistoryResponse } from './types'

// ── Email ────────────────────────────────────────────────
export const getEmailHistory = (params?: { limit?: number; offset?: number; status?: string }) =>
  apiClient.get<ApiResponse<EmailHistoryResponse>>('/api/v1/admin/email/history', { params })
