import { useQuery } from '@tanstack/react-query'
import { listLearningCourses } from '@/api/admin-learning'

export function useLearningCourses() {
  return useQuery({
    queryKey: ['admin', 'learning', 'courses'],
    queryFn: () => listLearningCourses().then((r) => r.data.data),
  })
}
