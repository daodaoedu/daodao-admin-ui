import { useQuery } from '@tanstack/react-query'
import {
  getCommunityInteractionStats,
  getCommunityMapAnalytics,
  getCommunityMapStats,
  getInteractionDetails,
  listCommunityMapFields,
} from '@/api/admin-community'

export function useCommunityMapFields() {
  return useQuery({
    queryKey: ['admin', 'community-map', 'fields'],
    queryFn: () => listCommunityMapFields().then((r) => r.data.data),
  })
}

export function useCommunityMapStats() {
  return useQuery({
    queryKey: ['admin', 'community-map', 'stats'],
    queryFn: () => getCommunityMapStats().then((r) => r.data.data),
  })
}

export function useCommunityMapAnalytics() {
  return useQuery({
    queryKey: ['admin', 'community-map', 'analytics'],
    queryFn: () => getCommunityMapAnalytics().then((r) => r.data.data),
  })
}

export function useCommunityInteractionStats(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: ['admin', 'community-map', 'interaction-stats', period],
    queryFn: () => getCommunityInteractionStats({ period }).then((r) => r.data.data),
  })
}

export function useCommunityInteractionDetails(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: ['admin', 'community-map', 'interaction-details', period],
    queryFn: () => getInteractionDetails({ period }).then((r) => r.data.data),
  })
}
