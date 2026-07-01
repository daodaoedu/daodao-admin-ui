import { useQuery } from '@tanstack/react-query'
import type { ActiveUsersTrendQueryParams } from '@/api/admin-users'
import {
  getActiveUsersFunnel,
  getActiveUsersList,
  getActiveUsersTrend,
  getMetricDrillDown,
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

export function useActiveUsersList(
  params: { date: string; period: 'day' | 'week' | 'month' } | null,
) {
  return useQuery({
    queryKey: ['admin', 'active-users-list', params?.date, params?.period],
    queryFn: () => {
      if (!params) throw new Error('params required')
      return getActiveUsersList(params).then((r) => r.data.data)
    },
    enabled: params !== null,
  })
}

export function useMetricDrillDown(metric: string | null) {
  return useQuery({
    queryKey: ['admin', 'metric-drilldown', metric],
    queryFn: () => {
      if (!metric) throw new Error('metric required')
      return getMetricDrillDown(metric).then((r) => r.data.data)
    },
    enabled: metric !== null,
  })
}
