import { useQuery } from '@tanstack/react-query'
import { getCustomReportFields, listSavedReports } from '@/api/admin-reports'

export function useCustomReportFields() {
  return useQuery({
    queryKey: ['admin', 'reports', 'custom', 'fields'],
    queryFn: () => getCustomReportFields().then((r) => r.data.data),
  })
}

export function useSavedReports() {
  return useQuery({
    queryKey: ['admin', 'reports', 'custom', 'saved'],
    queryFn: () => listSavedReports().then((r) => r.data.data),
  })
}
