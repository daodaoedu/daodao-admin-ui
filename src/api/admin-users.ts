import apiClient from './client'
import type {
  AdminActivityStats,
  AdminLoginHistoryItem,
  AdminUserDetail,
  ActiveUsersTrendResponse,
  ApiResponse,
  PracticeStats,
} from './types'

// ── User Detail ──────────────────────────────────────────
export const getAdminUserDetail = (userId: string) =>
  apiClient.get<ApiResponse<AdminUserDetail>>(`/api/v1/admin/users/${userId}`)

export const getAdminLoginHistory = (userId: string, params?: { startDate?: string; endDate?: string }) =>
  apiClient.get<ApiResponse<AdminLoginHistoryItem[]>>(`/api/v1/admin/users/${userId}/login-history`, { params })

export const getAdminActivityStats = (userId: string) =>
  apiClient.get<ApiResponse<AdminActivityStats>>(`/api/v1/admin/users/${userId}/activity-stats`)

export const updateAdminUserStatus = (userId: string, data: { isActive: boolean }) =>
  apiClient.put<ApiResponse<{ success: boolean }>>(`/api/v1/admin/users/${userId}/status`, data)

// ── Tags ────────────────────────────────────────────────
export const listTags = () =>
  apiClient.get<ApiResponse<unknown>>('/api/v1/admin/tags')

// ── Statistics ───────────────────────────────────────────
export const getActiveUsersTrend = (days?: number) =>
  apiClient.get<ApiResponse<ActiveUsersTrendResponse>>('/api/v1/admin/user-stats/active-users/trend', { params: { days } })

export const getPracticeStats = (params?: { startDate?: string; endDate?: string }) =>
  apiClient.get<ApiResponse<PracticeStats>>('/api/v1/admin/practices/stats', { params })
