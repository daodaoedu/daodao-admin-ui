import apiClient from './client'
import type { ApiResponse } from './types'

// ── Knowledge Base ────────────────────────────────────────

export interface KnowledgeEntry {
  id: number
  name: string
  type: 'text' | 'pdf' | 'md'
  size: string
  uploadedAt: string
}

export const listKnowledgeEntries = (params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<KnowledgeEntry[]>>(
    '/daodao-server/api/v1/admin/ai-assistant/knowledge',
    { params },
  )

export const uploadKnowledgeEntry = (data: FormData) =>
  apiClient.post<ApiResponse<KnowledgeEntry>>(
    '/daodao-server/api/v1/admin/ai-assistant/knowledge',
    data,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )

export const deleteKnowledgeEntry = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(
    `/daodao-server/api/v1/admin/ai-assistant/knowledge/${id}`,
  )

// ── Conversations ─────────────────────────────────────────

export interface ConversationMessage {
  id: number
  sender: 'user' | 'ai'
  content: string
  time: string
}

export interface ConversationListItem {
  id: number
  user: string
  lastMessage: string
  status: 'ai-resolved' | 'escalated' | 'needs-human'
  time: string
}

export interface ConversationDetail extends ConversationListItem {
  messages: ConversationMessage[]
}

export const listConversations = (params?: { limit?: number; offset?: number; status?: string }) =>
  apiClient.get<ApiResponse<ConversationListItem[]>>(
    '/daodao-server/api/v1/admin/ai-assistant/conversations',
    { params },
  )

export const getConversation = (id: number) =>
  apiClient.get<ApiResponse<ConversationDetail>>(
    `/daodao-server/api/v1/admin/ai-assistant/conversations/${id}`,
  )

export const takeoverConversation = (id: number, data: { message?: string }) =>
  apiClient.post<ApiResponse<{ success: boolean }>>(
    `/daodao-server/api/v1/admin/ai-assistant/conversations/${id}/takeover`,
    data,
  )

// ── Stats ─────────────────────────────────────────────────

export interface AIAssistantStats {
  totalConversations: number
  aiResolvedRate: number
  avgResponseSeconds: number
  escalationRate: number
}

export const getAIAssistantStats = () =>
  apiClient.get<ApiResponse<AIAssistantStats>>('/daodao-server/api/v1/admin/ai-assistant/stats')

// ── Config ────────────────────────────────────────────────

export interface AIAssistantConfig {
  persona: string
  tone: string
  fallbackMessage: string
  [key: string]: unknown
}

export const getAIAssistantConfig = () =>
  apiClient.get<ApiResponse<AIAssistantConfig>>('/daodao-server/api/v1/admin/ai-assistant/config')

export const updateAIAssistantConfig = (data: Partial<AIAssistantConfig>) =>
  apiClient.put<ApiResponse<AIAssistantConfig>>(
    '/daodao-server/api/v1/admin/ai-assistant/config',
    data,
  )
