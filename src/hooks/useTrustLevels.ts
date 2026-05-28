import { useQuery } from '@tanstack/react-query'
import {
  getTrustLevelConfig,
  getTrustLevelDistribution,
  getTrustLevelHistory,
} from '@/api/admin-trust'

export function useTrustLevelConfig() {
  return useQuery({
    queryKey: ['admin', 'trust-levels', 'config'],
    queryFn: () => getTrustLevelConfig().then((r) => r.data.data),
  })
}

export function useTrustLevelDistribution() {
  return useQuery({
    queryKey: ['admin', 'trust-levels', 'distribution'],
    queryFn: () => getTrustLevelDistribution().then((r) => r.data.data),
  })
}

export function useTrustLevelHistory() {
  return useQuery({
    queryKey: ['admin', 'trust-levels', 'history'],
    queryFn: () => getTrustLevelHistory().then((r) => r.data.data),
  })
}
