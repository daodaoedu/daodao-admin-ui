import { useQuery } from '@tanstack/react-query'
import { listLearningPaths } from '@/api/admin-learning'

export function useLearningPaths() {
  return useQuery({
    queryKey: ['admin', 'learning', 'paths'],
    queryFn: () => listLearningPaths().then((r) => r.data.data),
  })
}
