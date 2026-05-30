import apiClient from './client'
import type { ApiResponse } from './types'

// ── Badges ────────────────────────────────────────────────

export interface Badge {
  id: number
  name: string
  description: string
  icon?: string
  trigger?: string
  criteria?: string
  awarded?: number
}

export interface BadgeCreate {
  name: string
  description: string
  icon?: string
  trigger?: string
  criteria?: string
}

export interface RecentAward {
  id: number
  user: string
  badge: string
  method: string
  time: string
}

export interface BadgeListResponse {
  items: Badge[]
  recentAwards?: RecentAward[]
}

export const listBadges = () =>
  apiClient.get<ApiResponse<BadgeListResponse>>('/daodao-server/api/v1/admin/gamification/badges')

export const createBadge = (data: BadgeCreate) =>
  apiClient.post<ApiResponse<Badge>>('/daodao-server/api/v1/admin/gamification/badges', data)

export const awardBadge = (badgeId: number, userId: number) =>
  apiClient.post<ApiResponse<{ success: boolean }>>(
    `/daodao-server/api/v1/admin/gamification/badges/${badgeId}/award`,
    { userId },
  )

export const revokeBadge = (badgeId: number, userId: number) =>
  apiClient.delete<ApiResponse<{ success: boolean }>>(
    `/daodao-server/api/v1/admin/gamification/badges/${badgeId}/revoke/${userId}`,
  )

// ── Challenges ────────────────────────────────────────────

export interface Challenge {
  id: number
  name: string
  description: string
  currentDay: number
  totalDays: number
  participants: number
  completionRate: number
  status: string
}

export interface ChallengeCreate {
  name: string
  description: string
  totalDays: number
  startDate?: string
}

export interface ChallengeParticipant {
  userId: number
  name: string
  currentDay: number
  completedAt?: string
}

export interface ChallengeListResponse {
  items: Challenge[]
}

export const listChallenges = () =>
  apiClient.get<ApiResponse<ChallengeListResponse>>(
    '/daodao-server/api/v1/admin/gamification/challenges',
  )

export const createChallenge = (data: ChallengeCreate) =>
  apiClient.post<ApiResponse<Challenge>>(
    '/daodao-server/api/v1/admin/gamification/challenges',
    data,
  )

export const listChallengeParticipants = (challengeId: number) =>
  apiClient.get<ApiResponse<ChallengeParticipant[]>>(
    `/daodao-server/api/v1/admin/gamification/challenges/${challengeId}/participants`,
  )

// ── Streaks ───────────────────────────────────────────────

export interface StreakDistributionItem {
  label: string
  value: number
  max: number
}

export const getStreakDistribution = () =>
  apiClient.get<ApiResponse<StreakDistributionItem[]>>(
    '/daodao-server/api/v1/admin/gamification/streaks/distribution',
  )

// ── Leaderboard ───────────────────────────────────────────

export interface LeaderboardWeightConfig {
  post: number
  comment: number
  like: number
  course: number
}

export interface LeaderboardUser {
  rank: number
  name: string
  avatar: string
  score: number
  posts: number
  comments: number
  likes: number
  courses: number
}

export interface LeaderboardResponse {
  items: LeaderboardUser[]
}

export interface LeaderboardConfigResponse {
  weights: LeaderboardWeightConfig
}

export const getLeaderboardConfig = () =>
  apiClient.get<ApiResponse<LeaderboardConfigResponse>>(
    '/daodao-server/api/v1/admin/gamification/leaderboard/config',
  )

export const updateLeaderboardConfig = (data: LeaderboardWeightConfig) =>
  apiClient.put<ApiResponse<LeaderboardConfigResponse>>(
    '/daodao-server/api/v1/admin/gamification/leaderboard/config',
    data,
  )

export const getLeaderboard = (period?: string) =>
  apiClient.get<ApiResponse<LeaderboardResponse>>(
    '/daodao-server/api/v1/admin/gamification/leaderboard',
    { params: period ? { period } : undefined },
  )

export const resetLeaderboard = () =>
  apiClient.post<ApiResponse<{ success: boolean }>>(
    '/daodao-server/api/v1/admin/gamification/leaderboard/reset',
  )
