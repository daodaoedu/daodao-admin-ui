import { useQuery } from '@tanstack/react-query'
import { listQuizzes } from '@/api/admin-learning'

export function useQuizzes() {
  return useQuery({
    queryKey: ['admin', 'learning', 'quizzes'],
    queryFn: () => listQuizzes().then((r) => r.data.data),
  })
}
