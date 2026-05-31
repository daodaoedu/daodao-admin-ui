import { useQuery } from '@tanstack/react-query'
import {
  getAIAssistantConfig,
  getAIAssistantStats,
  getConversation,
  listConversations,
  listKnowledgeEntries,
} from '@/api/admin-ai-assistant'

export function useKnowledgeEntries(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['admin', 'ai-assistant', 'knowledge', params],
    queryFn: () => listKnowledgeEntries(params).then((r) => r.data.data),
  })
}

export function useConversations(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'ai-assistant', 'conversations', params],
    queryFn: () => listConversations(params).then((r) => r.data.data),
  })
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'ai-assistant', 'conversations', id],
    queryFn: () => getConversation(id as number).then((r) => r.data.data),
    enabled: id !== null,
  })
}

export function useAIAssistantStats() {
  return useQuery({
    queryKey: ['admin', 'ai-assistant', 'stats'],
    queryFn: () => getAIAssistantStats().then((r) => r.data.data),
  })
}

export function useAIAssistantConfig() {
  return useQuery({
    queryKey: ['admin', 'ai-assistant', 'config'],
    queryFn: () => getAIAssistantConfig().then((r) => r.data.data),
  })
}
