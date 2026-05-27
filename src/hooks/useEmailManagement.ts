import { useQuery } from '@tanstack/react-query'
import { getEmailStats, getEmailHealth } from '@/api/admin-system'

export function useEmailStats() {
  return useQuery({
    queryKey: ['admin', 'email-stats'],
    queryFn: () => getEmailStats().then((r) => r.data.data),
  })
}

export function useEmailHealth() {
  return useQuery({
    queryKey: ['admin', 'email-health'],
    queryFn: () => getEmailHealth().then((r) => r.data.data),
  })
}
