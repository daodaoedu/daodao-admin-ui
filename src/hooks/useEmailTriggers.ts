import { useQuery } from '@tanstack/react-query'
import {
  getEmailTriggerLog,
  getEmailTriggerStats,
  listEmailTriggers,
} from '@/api/admin-communication'

export function useEmailTriggers() {
  return useQuery({
    queryKey: ['admin', 'email-triggers'],
    queryFn: () => listEmailTriggers().then((r) => r.data.data),
  })
}

export function useEmailTriggerLog(id: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['admin', 'email-triggers', id, 'log', params],
    queryFn: () => getEmailTriggerLog(id, params).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useEmailTriggerStats(id: string) {
  return useQuery({
    queryKey: ['admin', 'email-triggers', id, 'stats'],
    queryFn: () => getEmailTriggerStats(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
