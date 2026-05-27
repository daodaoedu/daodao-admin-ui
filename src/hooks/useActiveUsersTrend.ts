import { useQuery } from '@tanstack/react-query'
import { getActiveUsersTrend } from '@/api/admin-users'

export function useActiveUsersTrend(days?: number) {
  return useQuery({
    queryKey: ['admin', 'active-users-trend', days],
    queryFn: () => getActiveUsersTrend(days).then((r) => r.data.data),
  })
}
