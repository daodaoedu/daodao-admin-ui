import { useQuery } from '@tanstack/react-query'
import {
  getEmailTriggerStats,
  listEmailTriggerLogs,
  listEmailTriggerRules,
} from '@/api/admin-communication'

export function useEmailTriggers() {
  return useQuery({
    queryKey: ['admin', 'email-triggers'],
    queryFn: () => listEmailTriggerRules().then((r) => r.data.data),
  })
}

export function useEmailTriggerLog(id: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['admin', 'email-triggers', id, 'log', params],
    queryFn: () =>
      listEmailTriggerLogs({ rule_id: Number(id), ...params }).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useEmailTriggerStats() {
  return useQuery({
    queryKey: ['admin', 'email-trigger-stats'],
    queryFn: () => getEmailTriggerStats().then((r) => r.data.data),
  })
}
