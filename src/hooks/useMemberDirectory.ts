import { useQuery } from '@tanstack/react-query'
import {
  getMemberDirectoryAnalytics,
  getMemberDirectoryStats,
  listMemberDirectoryFields,
} from '@/api/admin-community'

export function useMemberDirectoryFields() {
  return useQuery({
    queryKey: ['admin', 'member-directory', 'fields'],
    queryFn: () => listMemberDirectoryFields().then((r) => r.data.data),
  })
}

export function useMemberDirectoryStats() {
  return useQuery({
    queryKey: ['admin', 'member-directory', 'stats'],
    queryFn: () => getMemberDirectoryStats().then((r) => r.data.data),
  })
}

export function useMemberDirectoryAnalytics() {
  return useQuery({
    queryKey: ['admin', 'member-directory', 'analytics'],
    queryFn: () => getMemberDirectoryAnalytics().then((r) => r.data.data),
  })
}
