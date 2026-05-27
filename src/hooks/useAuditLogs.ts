import { useQuery } from '@tanstack/react-query'
import { listAuditLogs } from '@/api/admin-audit'
import type { AuditLogFilters } from '@/api/admin-audit'

export function useAuditLogs(params?: AuditLogFilters) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => listAuditLogs(params).then((r) => r.data.data),
  })
}
