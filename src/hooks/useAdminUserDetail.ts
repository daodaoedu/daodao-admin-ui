import { useQuery } from '@tanstack/react-query'
import { getAdminUserDetail, getAdminLoginHistory, getAdminActivityStats } from '@/api/admin-users'

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => getAdminUserDetail(userId).then((r) => r.data.data),
    enabled: !!userId,
  })
}

export function useAdminLoginHistory(userId: string) {
  return useQuery({
    queryKey: ['admin', 'user', userId, 'login-history'],
    queryFn: () => getAdminLoginHistory(userId).then((r) => r.data.data),
    enabled: !!userId,
  })
}

export function useAdminActivityStats(userId: string) {
  return useQuery({
    queryKey: ['admin', 'user', userId, 'activity-stats'],
    queryFn: () => getAdminActivityStats(userId).then((r) => r.data.data),
    enabled: !!userId,
  })
}
