import { useQuery } from '@tanstack/react-query'
import { listFeedback } from '@/api/admin-support'

export function useFeedback(params?: { status?: string; category?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['admin', 'feedback', params],
    queryFn: () => listFeedback(params).then((r) => r.data.data),
  })
}
