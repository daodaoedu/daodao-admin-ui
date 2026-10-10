import { useQuery } from '@tanstack/react-query'
import { type FeedbackCategory, type FeedbackStatus, listFeedback } from '@/api/admin-support'

export function useFeedback(params?: {
  status?: FeedbackStatus
  category?: FeedbackCategory
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['admin', 'feedback', params],
    queryFn: () => listFeedback(params).then((r) => r.data.data),
  })
}
