import { useQuery } from '@tanstack/react-query'
import { getPracticeStats } from '@/api/admin-users'

export function usePracticeStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['admin', 'practice-stats', startDate, endDate],
    queryFn: () => getPracticeStats({ startDate, endDate }).then((r) => r.data.data),
  })
}
