import { useQuery } from '@tanstack/react-query'
import { listTags, listTagRules } from '@/api/admin-users'

export function useUserTags() {
  return useQuery({
    queryKey: ['admin', 'tags'],
    queryFn: () => listTags().then((r) => r.data.data),
  })
}

export function useTagRules() {
  return useQuery({
    queryKey: ['admin', 'tag-rules'],
    queryFn: () => listTagRules().then((r) => r.data.data),
  })
}
