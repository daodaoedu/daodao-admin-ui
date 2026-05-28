import apiClient from './client'
import type {
  ActiveUsersFunnelResponse,
  ActiveUsersTrendResponse,
  AdminActivityStats,
  AdminLoginHistoryItem,
  AdminUserDetail,
  ApiResponse,
  PracticeStats,
  UserCohortResponse,
} from './types'

// ── User Detail ──────────────────────────────────────────
export interface ActiveUsersTrendQueryParams {
  days?: number
  startDate?: string
  endDate?: string
}

export const getAdminUserDetail = (userId: string) =>
  apiClient.get<ApiResponse<AdminUserDetail>>(`/daodao-server/api/v1/admin/users/${userId}`)

export const getAdminLoginHistory = (
  userId: string,
  params?: { startDate?: string; endDate?: string },
) =>
  apiClient.get<ApiResponse<AdminLoginHistoryItem[]>>(
    `/daodao-server/api/v1/admin/users/${userId}/login-history`,
    { params },
  )

export const getAdminActivityStats = (userId: string) =>
  apiClient.get<ApiResponse<AdminActivityStats>>(
    `/daodao-server/api/v1/admin/users/${userId}/activity-stats`,
  )

export const updateAdminUserStatus = (userId: string, data: { isActive: boolean }) =>
  apiClient.put<ApiResponse<{ success: boolean }>>(
    `/daodao-server/api/v1/admin/users/${userId}/status`,
    data,
  )

// ── Tags ────────────────────────────────────────────────
export interface TagItem {
  id: number
  name: string
  color: string
  colorClass: string
  userCount: number
  createdAt: string
}

export interface TagRule {
  id: number
  name: string
  condition: string
  matchedUsers: number
  enabled: boolean
}

export const listTags = () =>
  apiClient.get<ApiResponse<TagItem[]>>('/daodao-server/api/v1/admin/tags')

export const createTag = (data: { name: string; color: string }) =>
  apiClient.post<ApiResponse<TagItem>>('/daodao-server/api/v1/admin/tags', data)

export const updateTag = (id: number, data: { name?: string; color?: string }) =>
  apiClient.put<ApiResponse<TagItem>>(`/daodao-server/api/v1/admin/tags/${id}`, data)

export const deleteTag = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/daodao-server/api/v1/admin/tags/${id}`)

export const listTagRules = () =>
  apiClient.get<ApiResponse<TagRule[]>>('/daodao-server/api/v1/admin/tag-rules')

export const createTagRule = (data: { name: string; condition: string }) =>
  apiClient.post<ApiResponse<TagRule>>('/daodao-server/api/v1/admin/tag-rules', data)

export const deleteTagRule = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/daodao-server/api/v1/admin/tag-rules/${id}`)

export const bulkTagUsers = (data: {
  userIds: number[]
  tagIds: number[]
  action: 'add' | 'remove'
}) =>
  apiClient.post<ApiResponse<{ success: boolean }>>(
    '/daodao-server/api/v1/admin/users/bulk-tag',
    data,
  )

// ── Statistics ───────────────────────────────────────────
export const getActiveUsersTrend = (params?: ActiveUsersTrendQueryParams) =>
  apiClient.get<ApiResponse<ActiveUsersTrendResponse>>(
    '/daodao-server/api/v1/admin/user-stats/active-users/trend',
    { params },
  )

export const getActiveUsersFunnel = (params?: { startDate?: string; endDate?: string }) =>
  apiClient.get<ApiResponse<ActiveUsersFunnelResponse>>(
    '/daodao-server/api/v1/admin/user-stats/funnel',
    { params },
  )

export const getUserCohortRetention = (params?: { startDate?: string; endDate?: string }) =>
  apiClient.get<ApiResponse<UserCohortResponse>>(
    '/daodao-server/api/v1/admin/user-stats/cohort-retention',
    { params },
  )

export const getPracticeStats = (params?: { startDate?: string; endDate?: string }) =>
  apiClient.get<ApiResponse<PracticeStats>>('/daodao-server/api/v1/admin/practices/stats', {
    params,
  })
