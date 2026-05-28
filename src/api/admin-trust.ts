import apiClient from './client'
import type { ApiResponse } from './types'

// ── Trust Level Types ─────────────────────────────────────

export interface TrustLevelConfigItem {
  level: string
  name: string
  requirement: string
  abilities: string
}

export interface TrustLevelConfig {
  levels: TrustLevelConfigItem[]
}

export interface TrustLevelDistributionItem {
  level: string
  count: number
  changePercent: number
}

export interface TrustLevelDistribution {
  items: TrustLevelDistributionItem[]
}

export interface TrustLevelHistoryItem {
  user: string
  from: string
  to: string
  direction: 'up' | 'down'
  reason: string
  time: string
}

export interface TrustLevelHistory {
  items: TrustLevelHistoryItem[]
}

// ── Trust Level Endpoints ─────────────────────────────────

export const getTrustLevelConfig = () =>
  apiClient.get<ApiResponse<TrustLevelConfig>>('/daodao-server/api/v1/admin/trust-levels/config')

export const updateTrustLevelConfig = (body: TrustLevelConfig) =>
  apiClient.put<ApiResponse<TrustLevelConfig>>(
    '/daodao-server/api/v1/admin/trust-levels/config',
    body,
  )

export const getTrustLevelDistribution = () =>
  apiClient.get<ApiResponse<TrustLevelDistribution>>(
    '/daodao-server/api/v1/admin/trust-levels/distribution',
  )

export const getTrustLevelHistory = () =>
  apiClient.get<ApiResponse<TrustLevelHistory>>('/daodao-server/api/v1/admin/trust-levels/history')

export const patchUserTrustLevel = (userId: number | string, level: string) =>
  apiClient.patch<ApiResponse<null>>(`/daodao-server/api/v1/admin/users/${userId}/trust-level`, {
    level,
  })

// ── AutoMod Types ─────────────────────────────────────────

export interface AutoModRule {
  id: number
  name: string
  pattern: 'exact' | 'wildcard' | 'contains'
  action: string
  enabled: boolean
}

export interface AutoModRuleCreate {
  name: string
  pattern: 'exact' | 'wildcard' | 'contains'
  action: string
  enabled?: boolean
}

export interface AutoModWordList {
  id: number
  name: string
  enabled: boolean
}

export interface AutoModLogItem {
  time: string
  summary: string
  rule: string
  action: string
  user: string
}

export interface AutoModLogResponse {
  items: AutoModLogItem[]
}

export interface AutoModSpamDetection {
  enabled: boolean
  [key: string]: unknown
}

export interface AutoModUsernameBlocklistResponse {
  items: string[]
}

export interface AutoModFlagQueueItem {
  id: number
  content: string
  reporters: number
  priority: '高' | '中' | '低'
  reason: string
}

export interface AutoModFlagQueueResponse {
  items: AutoModFlagQueueItem[]
}

export interface AutoModCommunityModConfig {
  threshold: number
  [key: string]: unknown
}

// ── AutoMod Endpoints ─────────────────────────────────────

export const getAutoModRules = () =>
  apiClient.get<ApiResponse<{ items: AutoModRule[] }>>('/daodao-server/api/v1/admin/automod/rules')

export const createAutoModRule = (body: AutoModRuleCreate) =>
  apiClient.post<ApiResponse<AutoModRule>>('/daodao-server/api/v1/admin/automod/rules', body)

export const updateAutoModRule = (id: number, body: Partial<AutoModRule>) =>
  apiClient.put<ApiResponse<AutoModRule>>(`/daodao-server/api/v1/admin/automod/rules/${id}`, body)

export const deleteAutoModRule = (id: number) =>
  apiClient.delete<ApiResponse<null>>(`/daodao-server/api/v1/admin/automod/rules/${id}`)

export const getAutoModWordLists = () =>
  apiClient.get<ApiResponse<{ items: AutoModWordList[] }>>(
    '/daodao-server/api/v1/admin/automod/word-lists',
  )

export const toggleAutoModWordList = (id: number) =>
  apiClient.put<ApiResponse<AutoModWordList>>(
    `/daodao-server/api/v1/admin/automod/word-lists/${id}/toggle`,
    {},
  )

export const getAutoModLog = () =>
  apiClient.get<ApiResponse<AutoModLogResponse>>('/daodao-server/api/v1/admin/automod/log')

export const getAutoModSpamDetection = () =>
  apiClient.get<ApiResponse<AutoModSpamDetection>>(
    '/daodao-server/api/v1/admin/automod/spam-detection',
  )

export const updateAutoModSpamDetection = (body: AutoModSpamDetection) =>
  apiClient.put<ApiResponse<AutoModSpamDetection>>(
    '/daodao-server/api/v1/admin/automod/spam-detection',
    body,
  )

export const getAutoModUsernameBlocklist = () =>
  apiClient.get<ApiResponse<AutoModUsernameBlocklistResponse>>(
    '/daodao-server/api/v1/admin/automod/username-blocklist',
  )

export const addAutoModUsernameBlocklist = (username: string) =>
  apiClient.post<ApiResponse<null>>('/daodao-server/api/v1/admin/automod/username-blocklist', {
    username,
  })

export const deleteAutoModUsernameBlocklist = (username: string) =>
  apiClient.delete<ApiResponse<null>>(
    `/daodao-server/api/v1/admin/automod/username-blocklist/${username}`,
  )

export const getAutoModFlagQueue = () =>
  apiClient.get<ApiResponse<AutoModFlagQueueResponse>>(
    '/daodao-server/api/v1/admin/automod/flag-queue',
  )

export const actionAutoModFlagQueue = (id: number, action: 'approve' | 'reject') =>
  apiClient.post<ApiResponse<null>>(`/daodao-server/api/v1/admin/automod/flag-queue/${id}/action`, {
    action,
  })

export const getAutoModCommunityModConfig = () =>
  apiClient.get<ApiResponse<AutoModCommunityModConfig>>(
    '/daodao-server/api/v1/admin/automod/community-mod-config',
  )

export const updateAutoModCommunityModConfig = (body: AutoModCommunityModConfig) =>
  apiClient.put<ApiResponse<AutoModCommunityModConfig>>(
    '/daodao-server/api/v1/admin/automod/community-mod-config',
    body,
  )
