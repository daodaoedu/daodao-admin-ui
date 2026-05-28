import { useQuery } from '@tanstack/react-query'
import { listDripSchedules } from '@/api/admin-learning'

export function useDripSchedules() {
  return useQuery({
    queryKey: ['admin', 'learning', 'drip-schedules'],
    queryFn: () => listDripSchedules().then((r) => r.data.data),
  })
}
