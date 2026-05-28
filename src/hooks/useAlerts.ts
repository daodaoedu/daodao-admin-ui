import { useQuery } from '@tanstack/react-query'
import { listAlertHistory, listAlertRules } from '@/api/admin-reports'

export function useAlertRules() {
  return useQuery({
    queryKey: ['admin', 'alerts', 'rules'],
    queryFn: () => listAlertRules().then((r) => r.data.data),
  })
}

export function useAlertHistory(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['admin', 'alerts', 'history', params],
    queryFn: () => listAlertHistory(params).then((r) => r.data.data),
  })
}
