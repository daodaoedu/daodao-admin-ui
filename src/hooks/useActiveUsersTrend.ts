import { useQuery } from '@tanstack/react-query'
import type { ActiveUsersTrendQueryParams } from '@/api/admin-users'
import {
  getActiveUsersFunnel,
  getActiveUsersTrend,
  getUserCohortRetention,
} from '@/api/admin-users'

export function useActiveUsersTrend(params?: ActiveUsersTrendQueryParams) {
  return useQuery({
    queryKey: ['admin', 'active-users-trend', params?.days, params?.startDate, params?.endDate],
    queryFn: () => getActiveUsersTrend(params).then((r) => r.data.data),
  })
}

export function useActiveUsersFunnel(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['admin', 'active-users-funnel', params?.startDate, params?.endDate],
    queryFn: () => getActiveUsersFunnel(params).then((r) => r.data.data),
  })
}

export function useUserCohortRetention(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['admin', 'user-cohort-retention', params?.startDate, params?.endDate],
    queryFn: () => getUserCohortRetention(params).then((r) => r.data.data),
  })
}
