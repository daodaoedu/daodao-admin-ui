import apiClient from './client'
import type { ApiResponse } from './types'

// ── Content Performance ───────────────────────────────────

export interface ContentPerformanceItem {
  id: number
  title: string
  views: number
  depth: number
  avgTime: number
  interactionRate: number
  featured: boolean
}

export interface ContentCollection {
  id: string
  name: string
  count: number
}

export interface ContentPerformanceData {
  items: ContentPerformanceItem[]
  collections: ContentCollection[]
}

export const listContentPerformance = () =>
  apiClient.get<ApiResponse<ContentPerformanceData>>(
    '/daodao-server/api/v1/admin/content/performance',
  )

export const setContentFeatured = (id: number, featured: boolean) =>
  apiClient.patch<ApiResponse<ContentPerformanceItem>>(
    `/daodao-server/api/v1/admin/content/${id}/featured`,
    { featured },
  )
