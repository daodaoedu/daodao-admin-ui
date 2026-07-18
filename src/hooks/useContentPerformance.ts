import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type FeaturedSchedule,
  listCheckins,
  listContentPerformance,
  setContentFeatured,
} from '@/api/admin-content'

export function useContentPerformance(days?: number) {
  return useQuery({
    queryKey: ['admin', 'content', 'performance', days],
    queryFn: () => listContentPerformance({ days }).then((r) => r.data.data),
  })
}

export function useCheckinList(days?: number, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['admin', 'content', 'checkins', days, limit, offset],
    queryFn: () =>
      listCheckins({ days, limit, offset }).then((r) => ({
        items: r.data.data,
        pagination: r.data.pagination,
      })),
  })
}

export function useSetContentFeatured() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      featured,
      schedule,
    }: {
      id: number
      featured: boolean
      schedule?: FeaturedSchedule
    }) => setContentFeatured(id, featured, schedule),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'content', 'performance'] }),
  })
}
