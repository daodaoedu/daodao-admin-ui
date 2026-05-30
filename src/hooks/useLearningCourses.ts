import { useQuery } from '@tanstack/react-query'
import { getCoursesStalledUsers, listLearningCourses } from '@/api/admin-learning'

export function useLearningCourses() {
  return useQuery({
    queryKey: ['admin', 'learning', 'courses'],
    queryFn: () => listLearningCourses().then((r) => r.data.data),
  })
}

export function useStalledUsers(courseId: string | null) {
  return useQuery({
    queryKey: ['admin', 'learning', 'stalled-users', courseId],
    queryFn: () => getCoursesStalledUsers(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
  })
}
