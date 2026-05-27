import { useQuery } from '@tanstack/react-query'
import { getDbInfo, getRedisInfo, getSystemMonitor } from '@/api/admin-system'

export function useSystemMonitor() {
  return useQuery({
    queryKey: ['admin', 'system-monitor'],
    queryFn: () => getSystemMonitor().then((r) => r.data.data),
    refetchInterval: 30_000,
  })
}

export function useDbInfo() {
  return useQuery({
    queryKey: ['admin', 'db-info'],
    queryFn: () => getDbInfo().then((r) => r.data.data),
    refetchInterval: 30_000,
  })
}

export function useRedisInfo() {
  return useQuery({
    queryKey: ['admin', 'redis-info'],
    queryFn: () => getRedisInfo().then((r) => r.data.data),
    refetchInterval: 30_000,
  })
}
