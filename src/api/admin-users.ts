import apiClient from './client'
import type {
  ActiveUserListItem,
  ActiveUsersFunnelResponse,
  ActiveUsersTrendResponse,
  ActivityTimelineEvent,
  AdminActivityStats,
  AdminLoginHistoryItem,
  AdminUserDetail,
  ApiResponse,
  PaginatedApiResponse,
  PracticeEntity,
  PracticeStats,
  PracticeStatus,
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

export const getActivityTimeline = (userId: string, params?: { limit?: number }) =>
  apiClient.get<ApiResponse<ActivityTimelineEvent[]>>(
    `/daodao-server/api/v1/admin/users/${userId}/activity-timeline`,
    { params },
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
  description: string | null
  type: 'manual' | 'auto'
  userCount: number
  createdAt: string
  updatedAt: string | null
}

export interface TagRule {
  id: number
  tagId: number
  conditionType: string
  conditionOperator: string
  conditionValue: string
  logicOperator: 'AND' | 'OR'
  isEnabled: boolean
  createdAt: string
  updatedAt: string | null
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

export const createTagRule = (data: {
  tagId: number
  conditionType: string
  conditionOperator?: string
  conditionValue: string
  logicOperator?: 'AND' | 'OR'
  isEnabled?: boolean
}) => apiClient.post<ApiResponse<TagRule>>('/daodao-server/api/v1/admin/tag-rules', data)

export const patchTagRule = (
  id: number,
  data: {
    conditionType?: string
    conditionOperator?: string
    conditionValue?: string
    logicOperator?: 'AND' | 'OR'
    isEnabled?: boolean
  },
) => apiClient.patch<ApiResponse<TagRule>>(`/daodao-server/api/v1/admin/tag-rules/${id}`, data)

export const deleteTagRule = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/daodao-server/api/v1/admin/tag-rules/${id}`)

export const bulkTagUsers = (data: {
  userIds: number[]
  tagId: number
  action: 'add' | 'remove'
}) =>
  apiClient.post<ApiResponse<{ affected: number }>>(
    '/daodao-server/api/v1/admin/users/bulk-tag',
    data,
  )

// ── Statistics ───────────────────────────────────────────
export const getActiveUsersTrend = (params?: ActiveUsersTrendQueryParams) =>
  apiClient.get<ApiResponse<ActiveUsersTrendResponse>>(
    '/daodao-server/api/v1/admin/user-stats/active-users/trend',
    { params },
  )

export const getActiveUsersList = (params: { date: string; period: 'day' | 'week' | 'month' }) =>
  apiClient.get<ApiResponse<ActiveUserListItem[]>>(
    '/daodao-server/api/v1/admin/user-stats/active-users/list',
    { params },
  )

export const getMetricDrillDown = (metric: string, period?: string) =>
  apiClient.get<ApiResponse<ActiveUserListItem[]>>(
    '/daodao-server/api/v1/admin/metrics/drilldown',
    { params: { metric, period } },
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

export const listPractices = (params?: {
  page?: number
  limit?: number
  query?: string
  status?: PracticeStatus | 'all'
  privacyStatus?: string
  durationDays?: number
  tagId?: number
  startDate?: string
  endDate?: string
  sort?: 'createdAt' | 'updatedAt' | 'likeCount'
  order?: 'asc' | 'desc'
}) =>
  apiClient.get<PaginatedApiResponse<PracticeEntity>>('/daodao-server/api/v1/practices', {
    params,
  })

export const updatePracticeStatus = (id: string, status: PracticeStatus) =>
  apiClient.patch<ApiResponse<PracticeEntity>>(
    `/daodao-server/api/v1/admin/practices/${id}/status`,
    { status },
  )

export const getUserPractices = (
  userId: string,
  params?: {
    limit?: number
    sort?: 'createdAt' | 'updatedAt' | 'likeCount'
    order?: 'asc' | 'desc'
  },
) =>
  apiClient.get<PaginatedApiResponse<PracticeEntity>>(
    `/daodao-server/api/v1/admin/users/${userId}/practices`,
    { params },
  )
