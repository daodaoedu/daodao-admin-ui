import { useQuery } from '@tanstack/react-query'
import { getEngagementStats, getPersonaStats, getQuizStats } from '@/api/admin-community'

export function useQuizAnalyticsStats() {
  return useQuery({
    queryKey: ['admin', 'quiz', 'stats'],
    queryFn: () => getQuizStats().then((r) => r.data.data),
  })
}

export function usePersonaStats(days?: number) {
  return useQuery({
    queryKey: ['admin', 'persona', 'stats', days],
    queryFn: () =>
      getPersonaStats(days === undefined ? undefined : { days }).then((r) => r.data.data),
  })
}

export function useEngagementStats() {
  return useQuery({
    queryKey: ['admin', 'engagement', 'stats'],
    queryFn: () => getEngagementStats().then((r) => r.data.data),
  })
}
