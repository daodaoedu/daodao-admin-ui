import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEmailTrigger,
  deleteEmailTrigger,
  type EmailTriggerCreate,
  type EmailTriggerRule,
  type EmailTriggerUpdate,
  getEmailTriggerLog,
  getEmailTriggerStats,
  listEmailTriggers,
  updateEmailTrigger,
} from '@/api/admin-communication'
import type { ApiResponse } from '@/api/types'

export function useEmailTriggerRules() {
  return useQuery({
    queryKey: ['admin', 'email-trigger-rules'],
    queryFn: () =>
      listEmailTriggers().then((r: { data: ApiResponse<EmailTriggerRule[]> }) => r.data.data),
  })
}

export function useEmailTriggerStats(id: string) {
  return useQuery({
    queryKey: ['admin', 'email-trigger-stats', id],
    queryFn: () => getEmailTriggerStats(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useEmailTriggerLogs(
  id: string,
  params?: {
    limit?: number
    offset?: number
  },
) {
  return useQuery({
    queryKey: ['admin', 'email-trigger-logs', id, params],
    queryFn: () => getEmailTriggerLog(id, params).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateEmailTriggerRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EmailTriggerCreate) => createEmailTrigger(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-rules'] })
    },
  })
}

export function useUpdateEmailTriggerRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmailTriggerUpdate }) =>
      updateEmailTrigger(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-rules'] })
    },
  })
}

export function useToggleEmailTriggerRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateEmailTrigger(id, { enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-rules'] })
    },
  })
}

export function useDeleteEmailTriggerRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEmailTrigger(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-trigger-rules'] })
    },
  })
}
