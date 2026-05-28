import { useQuery } from '@tanstack/react-query'
import { listNotifications } from '@/api/admin-communication'

export function useNotifications(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['admin', 'notifications', params],
    queryFn: () => listNotifications(params).then((r) => r.data.data),
  })
}
