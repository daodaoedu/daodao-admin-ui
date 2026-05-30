import apiClient from './client'
import type {
  AdminRoadmapItem,
  AdminWishItem,
  ApiResponse,
  CreateRoadmapItemPayload,
  CursorPagination,
  LinkWishPayload,
  PromoteWishPayload,
  RoadmapReport,
  RoadmapStatus,
  UpdateRoadmapItemPayload,
  WishCategory,
  WishStatus,
} from './types'

// ── Wishes Inbox ─────────────────────────────────────────

export const listAdminWishes = (params?: {
  status?: WishStatus
  category?: WishCategory
  q?: string
  cursor?: string
  limit?: number
}) =>
  apiClient.get<ApiResponse<AdminWishItem[]> & { pagination: CursorPagination }>(
    '/daodao-server/api/v1/admin/wishes',
    { params },
  )

export const linkWish = (id: number, data: LinkWishPayload) =>
  apiClient.post<ApiResponse<{ success: boolean }>>(
    `/daodao-server/api/v1/admin/wishes/${id}/link`,
    data,
  )

export const promoteWish = (id: number, data: PromoteWishPayload) =>
  apiClient.post<ApiResponse<{ success: boolean }>>(
    `/daodao-server/api/v1/admin/wishes/${id}/promote`,
    data,
  )

export const archiveWish = (id: number) =>
  apiClient.post<ApiResponse<{ success: boolean }>>(
    `/daodao-server/api/v1/admin/wishes/${id}/archive`,
  )

// ── Roadmap Items ────────────────────────────────────────

export const listAdminRoadmapItems = (params?: {
  status?: RoadmapStatus
  category?: WishCategory
  cursor?: string
  limit?: number
}) =>
  apiClient.get<ApiResponse<AdminRoadmapItem[]> & { pagination: CursorPagination }>(
    '/daodao-server/api/v1/admin/roadmap/items',
    { params },
  )

export const createRoadmapItem = (data: CreateRoadmapItemPayload) =>
  apiClient.post<ApiResponse<AdminRoadmapItem>>('/daodao-server/api/v1/admin/roadmap/items', data)

export const updateRoadmapItem = (id: number, data: UpdateRoadmapItemPayload) =>
  apiClient.patch<ApiResponse<AdminRoadmapItem>>(
    `/daodao-server/api/v1/admin/roadmap/items/${id}`,
    data,
  )

// ── Reports ──────────────────────────────────────────────

export const getRoadmapReport = (params?: {
  range?: 'week' | 'month' | 'quarter' | 'year'
  status?: RoadmapStatus
}) =>
  apiClient.get<ApiResponse<RoadmapReport>>('/daodao-server/api/v1/admin/roadmap/reports', {
    params,
  })
