import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { listAdminUsers } from '@/api/admin-server'

function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export function useTodayRegistrations() {
  const today = toDateStr(new Date())
  const yesterday = toDateStr(subDays(new Date(), 1))

  const todayQuery = useQuery({
    queryKey: ['admin', 'today-registrations', today],
    queryFn: () =>
      listAdminUsers({
        createdFrom: today,
        createdTo: today,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50,
      }).then((r) => r.data),
  })

  const yesterdayQuery = useQuery({
    queryKey: ['admin', 'yesterday-registrations', yesterday],
    queryFn: () =>
      listAdminUsers({
        createdFrom: yesterday,
        createdTo: yesterday,
        limit: 1,
      }).then((r) => r.data),
  })

  const todayCount = todayQuery.data?.pagination.totalItems ?? 0
  const yesterdayCount = yesterdayQuery.data?.pagination.totalItems ?? 0

  let changePercent: number | undefined
  if (yesterdayCount > 0) {
    changePercent = ((todayCount - yesterdayCount) / yesterdayCount) * 100
  }

  return {
    users: todayQuery.data?.data ?? [],
    todayCount,
    yesterdayCount,
    changePercent,
    isLoading: todayQuery.isLoading,
  }
}
