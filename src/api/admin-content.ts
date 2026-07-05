import apiClient from './client'
import type { ApiResponse } from './types'

// ── Content Performance ───────────────────────────────────

export interface ContentPerformanceItem {
  id: number
  title: string
  creatorName: string | null
  creatorEmail: string | null
  copyCount: number
  copiedFromTitle: string | null
  views: number
  depth: number
  avgTime: number
  interactionRate: number
  featured: boolean
}

export interface ContentCollection {
  id: string
  name: string
  description: string
  count: number
}

export interface CheckinSummary {
  total: number
  last7Days: number
  uniqueUsers: number
  withReaction: number
  withComment: number
  moodDistribution: Array<{ mood: string; count: number }>
}

export interface QuizSummary {
  completed: number
  completionRate: number
  byRole: Array<{ role: string; count: number; rate: number }>
}

export interface PersonaSummary {
  totalQuestions: number
  usersAnswered: number
  totalAnswers: number
  questions: Array<{ id: number; prompt: string; answerCount: number }>
}

export interface ContentPerformanceData {
  items: ContentPerformanceItem[]
  collections: ContentCollection[]
  checkinSummary: CheckinSummary
  quizSummary: QuizSummary
  personaSummary: PersonaSummary
}

export const listContentPerformance = (params?: { days?: number }) =>
  apiClient.get<ApiResponse<ContentPerformanceData>>(
    '/daodao-server/api/v1/admin/content/performance',
    { params },
  )

export const setContentFeatured = (id: number, featured: boolean) =>
  apiClient.patch<ApiResponse<ContentPerformanceItem>>(
    `/daodao-server/api/v1/admin/content/${id}/featured`,
    { featured },
  )

// ── Checkin List ─────────────────────────────────────────

export interface CheckinRecord {
  id: number
  userId: number
  userName: string | null
  userEmail: string | null
  practiceId: number
  practiceTitle: string
  mood: string | null
  content: string | null
  reactionCount: number
  commentCount: number
  createdAt: string
}

interface CheckinBackendPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNext: boolean
  hasPrev: boolean
}

export const listCheckins = (params?: { days?: number; limit?: number; offset?: number }) =>
  apiClient
    .get<{ success: boolean; data: CheckinRecord[]; pagination: CheckinBackendPagination }>(
      '/daodao-server/api/v1/admin/content/checkins',
      { params },
    )
    .then((res) => ({
      ...res,
      data: {
        ...res.data,
        pagination: res.data.pagination
          ? {
              total_count: res.data.pagination.totalItems,
              limit: res.data.pagination.itemsPerPage,
              offset: (res.data.pagination.currentPage - 1) * res.data.pagination.itemsPerPage,
              has_next: res.data.pagination.hasNext,
            }
          : null,
      },
    }))
