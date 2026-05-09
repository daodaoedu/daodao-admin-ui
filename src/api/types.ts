// ── API 回應外殼 ──────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  error: null | { code: string; message: string }
  pagination: null | OffsetPagination
  cacheHit: boolean
  processingTime: number
  timestamp: string
  requestId: string
}

export interface OffsetPagination {
  total_count: number
  limit: number
  offset: number
  has_next: boolean
}

// ── Auth ──────────────────────────────────────────────────
export interface AdminPingData {
  status: string
  admin_id: number
  admin_mongo_id: string | null
  nickname: string | null
}

// ── Dashboard ─────────────────────────────────────────────
export interface BackendStat {
  backend: string
  query_count: number
  cost_usd: string
  total_tokens: number
}

export interface DailyStatPoint {
  date: string
  cost_usd: string
  query_count: number
  total_tokens: number
}

export interface DashboardStats {
  total_cost_usd: string
  total_queries: number
  total_input_tokens: number
  total_output_tokens: number
  by_backend: BackendStat[]
  daily_series: DailyStatPoint[]
}

// ── System Prompts ────────────────────────────────────────
export interface SystemPrompt {
  id: number
  name: string
  content: string
  is_active: boolean
  version: number
  created_by: number | null
  updated_by: number | null
  created_at: string
  updated_at: string | null
}

export interface SystemPromptCreate {
  name: string
  content: string
  is_active?: boolean
}

export interface SystemPromptUpdate {
  name?: string
  content?: string
  is_active?: boolean
}

// ── LLM Models ────────────────────────────────────────────
export interface LLMModel {
  id: number
  provider: string
  model_name: string
  display_name: string | null
  is_active: boolean
  input_cost_per_1m: string
  output_cost_per_1m: string
  cached_input_cost_per_1m: string
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface LLMModelCreate {
  provider: string
  model_name: string
  display_name?: string
  is_active?: boolean
  input_cost_per_1m?: string
  output_cost_per_1m?: string
  cached_input_cost_per_1m?: string
  notes?: string
}

// ── AI Query Logs ─────────────────────────────────────────
export interface AIQueryLog {
  id: number
  request_id: string
  backend: string
  model_name: string | null
  context: string | null
  user_id: number | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  cost_usd: string | null
  latency_ms: number | null
  status: string
  error_message: string | null
  prompt_chars: number | null
  created_at: string
  usage_detail?: Record<string, unknown>
}

// ── Playground ────────────────────────────────────────────
export interface PlaygroundChatRequest {
  model_id: number
  system_prompt_id?: number | null
  message: string
  max_tokens?: number | null
  temperature?: number | null
  top_p?: number | null
  top_k?: number | null
}

export interface PlaygroundChatResponse {
  response: string
  model_used: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  latency_ms: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  meta?: {
    input_tokens: number
    output_tokens: number
    cost_usd: number
    latency_ms: number
    model_used: string
  }
}

// ── AI Query Log Filters ─────────────────────────────────
export interface QueryLogFilters {
  backend?: string
  context?: string
  user_id?: number
  status?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

// ── User Quotas ───────────────────────────────────────────
export interface UserQuota {
  id: number
  user_id: number
  monthly_token_limit: number
  daily_token_limit: number | null
  quota_month: number | null
  created_at: string
  updated_at: string | null
}

export interface UserWithQuota {
  id: number
  mongo_id: string | null
  nickname: string | null
  external_id: string | null
  role_id: number | null
  current_month_tokens_used: number
  quota: UserQuota | null
}

// ── Insight Playground ────────────────────────────────────
export interface InsightUser {
  id: number
  nickname: string | null
}

export interface InsightPractice {
  id: number
  title: string
  has_insight: boolean
}

export interface PlaygroundInsightRequest {
  practice_id: number
  model_id: number
  save?: boolean
  system_prompt_override?: string | null
  include_user_profile?: boolean
  include_practice_info?: boolean
  include_checkin_stats?: boolean
  include_notable_notes?: boolean
  max_tokens?: number | null
  temperature?: number | null
  top_p?: number | null
  top_k?: number | null
}

export interface InsightCheckinStats {
  total: number
  max_streak: number
  top_weekdays: string[]
  mood_summary: string
}

export interface PlaygroundInsightResponse {
  insight: string
  thinking?: string | null
  prompt_used: string
  checkin_stats: InsightCheckinStats
  user_profile_used: Record<string, unknown>
  model_used: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  latency_ms: number
  saved: boolean
}

export interface ModelSyncResult {
  provider: string
  added: number
  existing: number
}

// ── AI Service Configs ────────────────────────────────
export interface AIServiceConfig {
  id: number
  service: string
  name: string
  model_id: number
  system_prompt_id: number | null
  max_tokens: number | null
  temperature: string | null // Decimal from backend comes as string
  top_p: string | null
  top_k: number | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface AIServiceConfigCreate {
  service: string
  name: string
  model_id: number
  system_prompt_id?: number | null
  max_tokens?: number | null
  temperature?: number | null
  top_p?: number | null
  top_k?: number | null
  is_active?: boolean
  notes?: string | null
}

export interface AIServiceConfigUpdate {
  name?: string
  model_id?: number
  system_prompt_id?: number | null
  max_tokens?: number | null
  temperature?: number | null
  top_p?: number | null
  top_k?: number | null
  is_active?: boolean
  notes?: string | null
}
