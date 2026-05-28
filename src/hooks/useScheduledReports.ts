import { useQuery } from '@tanstack/react-query'
import { getScheduledReportHistory, listScheduledReports } from '@/api/admin-reports'

export function useScheduledReports() {
  return useQuery({
    queryKey: ['admin', 'reports', 'scheduled'],
    queryFn: () => listScheduledReports().then((r) => r.data.data),
  })
}

export function useScheduledReportHistory(id: string) {
  return useQuery({
    queryKey: ['admin', 'reports', 'scheduled', id, 'history'],
    queryFn: () => getScheduledReportHistory(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
