import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listContentPerformance, setContentFeatured } from '@/api/admin-content'

export function useContentPerformance() {
  return useQuery({
    queryKey: ['admin', 'content', 'performance'],
    queryFn: () => listContentPerformance().then((r) => r.data.data),
  })
}

export function useSetContentFeatured() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) =>
      setContentFeatured(id, featured),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'content', 'performance'] }),
  })
}
