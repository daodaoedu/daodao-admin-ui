import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/api/admin'

export function useDashboardStats(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['admin', 'dashboard', dateFrom, dateTo],
    queryFn: () => getDashboardStats(dateFrom, dateTo).then((r) => r.data.data),
    refetchInterval: 60_000,
  })
}
