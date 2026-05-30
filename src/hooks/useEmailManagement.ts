import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getEmailHealth, getEmailHistory, getEmailStats, sendCustomEmail } from '@/api/admin-system'

export function useEmailStats() {
  return useQuery({
    queryKey: ['admin', 'email-stats'],
    queryFn: () => getEmailStats().then((r) => r.data.data),
  })
}

export function useEmailHealth() {
  return useQuery({
    queryKey: ['admin', 'email-health'],
    queryFn: () => getEmailHealth().then((r) => r.data.data),
  })
}

export function useEmailHistory(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'email-history', params],
    queryFn: () => getEmailHistory(params).then((r) => r.data.data),
  })
}

export function useSendEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { to: string; subject: string; body: string }) =>
      sendCustomEmail({ to: data.to, subject: data.subject, htmlContent: data.body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-history'] })
    },
  })
}
