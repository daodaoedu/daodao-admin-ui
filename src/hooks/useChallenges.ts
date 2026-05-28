import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChallengeCreate } from '@/api/admin-gamification'
import { createChallenge, getStreakDistribution, listChallenges } from '@/api/admin-gamification'

export function useChallenges() {
  return useQuery({
    queryKey: ['admin', 'gamification', 'challenges'],
    queryFn: () => listChallenges().then((r) => r.data.data),
  })
}

export function useCreateChallenge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ChallengeCreate) => createChallenge(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gamification', 'challenges'] })
    },
  })
}

export function useStreakDistribution() {
  return useQuery({
    queryKey: ['admin', 'gamification', 'streaks', 'distribution'],
    queryFn: () => getStreakDistribution().then((r) => r.data.data),
  })
}
