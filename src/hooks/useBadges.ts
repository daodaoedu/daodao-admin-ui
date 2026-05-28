import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BadgeCreate } from '@/api/admin-gamification'
import { awardBadge, createBadge, listBadges, revokeBadge } from '@/api/admin-gamification'

export function useBadges() {
  return useQuery({
    queryKey: ['admin', 'gamification', 'badges'],
    queryFn: () => listBadges().then((r) => r.data.data),
  })
}

export function useCreateBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BadgeCreate) => createBadge(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gamification', 'badges'] })
    },
  })
}

export function useAwardBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ badgeId, userId }: { badgeId: number; userId: number }) =>
      awardBadge(badgeId, userId).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gamification', 'badges'] })
    },
  })
}

export function useRevokeBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ badgeId, userId }: { badgeId: number; userId: number }) =>
      revokeBadge(badgeId, userId).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gamification', 'badges'] })
    },
  })
}
