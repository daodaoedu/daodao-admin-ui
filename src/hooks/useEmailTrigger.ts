import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type CreateEmailTriggerRulePayload,
  createEmailTriggerRule,
  deleteEmailTriggerRule,
  getEmailTriggerStats,
  listEmailTriggerLogs,
  listEmailTriggerRules,
  toggleEmailTriggerRule,
  updateEmailTriggerRule,
} from '@/api/admin-communication'

export function useEmailTriggerRules(params?: {
  limit?: number
  offset?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['admin', 'email-trigger-rules', params],
    queryFn: () => listEmailTriggerRules(params).then((r) => r.data.data),
  })
}

export function useEmailTriggerStats() {
  return useQuery({
    queryKey: ['admin', 'email-trigger-stats'],
    queryFn: () => getEmailTriggerStats().then((r) => r.data.data),
  })
}

export function useEmailTriggerLogs(params?: {
  limit?: number
  offset?: number
  rule_id?: number
}) {
  return useQuery({
    queryKey: ['admin', 'email-trigger-logs', params],
    queryFn: () => listEmailTriggerLogs(params).then((r) => r.data.data),
  })
}

export function useCreateEmailTriggerRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEmailTriggerRulePayload) => createEmailTriggerRule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-rules'] })
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-stats'] })
    },
  })
}

export function useUpdateEmailTriggerRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateEmailTriggerRulePayload> }) =>
      updateEmailTriggerRule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-rules'] })
    },
  })
}

export function useToggleEmailTriggerRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      toggleEmailTriggerRule(id, enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-rules'] })
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-stats'] })
    },
  })
}

export function useDeleteEmailTriggerRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEmailTriggerRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-rules'] })
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-stats'] })
    },
  })
}
