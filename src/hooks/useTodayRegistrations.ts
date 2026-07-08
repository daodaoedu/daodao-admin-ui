import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { listAdminUsers } from '@/api/admin-server'

function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export function useTodayRegistrations() {
  const today = toDateStr(new Date())
  const yesterday = toDateStr(subDays(new Date(), 1))
  const sevenDaysAgo = toDateStr(subDays(new Date(), 7))

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

  const weekQuery = useQuery({
    queryKey: ['admin', 'week-registrations', sevenDaysAgo, yesterday],
    queryFn: () =>
      listAdminUsers({
        createdFrom: sevenDaysAgo,
        createdTo: yesterday,
        limit: 1,
      }).then((r) => r.data),
  })

  const todayCount = todayQuery.data?.pagination.totalItems ?? 0
  const weekTotal = weekQuery.data?.pagination.totalItems ?? 0
  const weekAvg = weekTotal / 7

  let changePercent: number | undefined
  if (weekAvg > 0) {
    changePercent = ((todayCount - weekAvg) / weekAvg) * 100
  }

  return {
    users: todayQuery.data?.data ?? [],
    todayCount,
    weekAvg: Math.round(weekAvg * 10) / 10,
    changePercent,
    isLoading: todayQuery.isLoading,
  }
}
