import apiClient, { slowApiClient } from './client'
import type {
  AdminPingData,
  AIQueryLog,
  AIServiceConfig,
  AIServiceConfigCreate,
  AIServiceConfigUpdate,
  ApiResponse,
  DashboardStats,
  InsightPractice,
  InsightUser,
  LLMModel,
  LLMModelCreate,
  ModelSyncResult,
  OffsetPagination,
  PlaygroundChatRequest,
  PlaygroundChatResponse,
  PlaygroundInsightRequest,
  PlaygroundInsightResponse,
  QueryLogFilters,
  SystemPrompt,
  SystemPromptCreate,
  SystemPromptUpdate,
  UserQuota,
  UserWithQuota,
} from './types'

// ── Auth ──────────────────────────────────────────────────
export const ping = () => apiClient.get<ApiResponse<AdminPingData>>('/api/v1/admin/ping')

// ── Dashboard ─────────────────────────────────────────────
export const getDashboardStats = (dateFrom?: string, dateTo?: string) =>
  apiClient.get<ApiResponse<DashboardStats>>('/api/v1/admin/dashboard/stats', {
    params: { date_from: dateFrom, date_to: dateTo },
  })

// ── System Prompts ────────────────────────────────────────
export const listSystemPrompts = (params?: {
  is_active?: boolean
  limit?: number
  offset?: number
}) =>
  apiClient.get<ApiResponse<SystemPrompt[]>>('/api/v1/admin/system-prompts', {
    params,
  })

export const getSystemPrompt = (id: number) =>
  apiClient.get<ApiResponse<SystemPrompt>>(`/api/v1/admin/system-prompts/${id}`)

export const createSystemPrompt = (data: SystemPromptCreate) =>
  apiClient.post<ApiResponse<SystemPrompt>>('/api/v1/admin/system-prompts', data)

export const updateSystemPrompt = (id: number, data: SystemPromptUpdate) =>
  apiClient.put<ApiResponse<SystemPrompt>>(`/api/v1/admin/system-prompts/${id}`, data)

export const deleteSystemPrompt = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean; id: number }>>(
    `/api/v1/admin/system-prompts/${id}`,
  )

// ── LLM Models ────────────────────────────────────────────
export const listLLMModels = (params?: { provider?: string; is_active?: boolean }) =>
  apiClient.get<ApiResponse<LLMModel[]>>('/api/v1/admin/llm-models', { params })

export const createLLMModel = (data: LLMModelCreate) =>
  apiClient.post<ApiResponse<LLMModel>>('/api/v1/admin/llm-models', data)

export const updateLLMModel = (id: number, data: Partial<LLMModelCreate>) =>
  apiClient.put<ApiResponse<LLMModel>>(`/api/v1/admin/llm-models/${id}`, data)

export const deleteLLMModel = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean; id: number }>>(`/api/v1/admin/llm-models/${id}`)

export const syncProviderModels = (provider: string) =>
  apiClient.post<ApiResponse<ModelSyncResult>>(`/api/v1/admin/llm-models/sync/${provider}`)

// ── AI Query Logs ─────────────────────────────────────────
export const listQueryLogs = (params?: QueryLogFilters) =>
  apiClient.get<ApiResponse<AIQueryLog[]> & { pagination: OffsetPagination }>(
    '/api/v1/admin/query-logs',
    { params },
  )

export const getQueryLog = (id: number) =>
  apiClient.get<ApiResponse<AIQueryLog>>(`/api/v1/admin/query-logs/${id}`)

// ── User Quotas ───────────────────────────────────────────
export const listUsers = (params?: { limit?: number; offset?: number; search?: string }) =>
  apiClient.get<ApiResponse<UserWithQuota[]>>('/api/v1/admin/users', { params })

export const getUserQuota = (userId: number) =>
  apiClient.get<
    ApiResponse<{
      user_id: number
      current_month_tokens_used: number
      quota: UserQuota | null
    }>
  >(`/api/v1/admin/users/${userId}/quota`)

// ── Playground ────────────────────────────────────────────
export const playgroundChat = (data: PlaygroundChatRequest) =>
  slowApiClient.post<ApiResponse<PlaygroundChatResponse>>('/api/v1/admin/playground/chat', data)

// ── User Quotas ───────────────────────────────────────────
export const upsertUserQuota = (
  userId: number,
  data: {
    monthly_token_limit: number
    daily_token_limit?: number | null
    quota_month?: number
  },
) => apiClient.put<ApiResponse<UserQuota>>(`/api/v1/admin/users/${userId}/quota`, data)

// ── Insight Playground ────────────────────────────────────
export const listInsightUsers = () =>
  apiClient.get<ApiResponse<InsightUser[]>>('/api/v1/admin/playground/insight/users')

export const listInsightPractices = (userId: number) =>
  apiClient.get<ApiResponse<InsightPractice[]>>('/api/v1/admin/playground/insight/practices', {
    params: { user_id: userId },
  })

export const playgroundInsight = (body: PlaygroundInsightRequest) =>
  slowApiClient.post<ApiResponse<PlaygroundInsightResponse>>(
    '/api/v1/admin/playground/insight',
    body,
  )

export const saveInsightResult = (data: { practice_id: number; insight: string }) =>
  apiClient.post<ApiResponse<{ saved: boolean; practice_id: number }>>(
    '/api/v1/admin/playground/insight/save',
    data,
  )

// ── AI Service Configs ────────────────────────────────
export const listAIServiceConfigs = (params?: { service?: string }) =>
  apiClient.get<ApiResponse<AIServiceConfig[]>>('/api/v1/admin/ai-service-configs', { params })

export const createAIServiceConfig = (data: AIServiceConfigCreate) =>
  apiClient.post<ApiResponse<AIServiceConfig>>('/api/v1/admin/ai-service-configs', data)

export const updateAIServiceConfig = (id: number, data: AIServiceConfigUpdate) =>
  apiClient.put<ApiResponse<AIServiceConfig>>(`/api/v1/admin/ai-service-configs/${id}`, data)

export const deleteAIServiceConfig = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean; id: number }>>(
    `/api/v1/admin/ai-service-configs/${id}`,
  )

export const activateAIServiceConfig = (id: number) =>
  apiClient.post<ApiResponse<AIServiceConfig>>(`/api/v1/admin/ai-service-configs/${id}/activate`)
