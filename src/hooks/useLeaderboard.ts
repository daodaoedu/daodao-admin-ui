import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LeaderboardWeightConfig } from '@/api/admin-gamification'
import {
  getLeaderboard,
  getLeaderboardConfig,
  resetLeaderboard,
  updateLeaderboardConfig,
} from '@/api/admin-gamification'

export function useLeaderboard(period?: string) {
  return useQuery({
    queryKey: ['admin', 'gamification', 'leaderboard', period],
    queryFn: () => getLeaderboard(period).then((r) => r.data.data),
  })
}

export function useLeaderboardConfig() {
  return useQuery({
    queryKey: ['admin', 'gamification', 'leaderboard', 'config'],
    queryFn: () => getLeaderboardConfig().then((r) => r.data.data),
  })
}

export function useUpdateLeaderboardConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LeaderboardWeightConfig) =>
      updateLeaderboardConfig(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gamification', 'leaderboard'] })
    },
  })
}

export function useResetLeaderboard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => resetLeaderboard().then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gamification', 'leaderboard'] })
    },
  })
}
