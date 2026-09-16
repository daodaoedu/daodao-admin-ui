import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/api/admin-ai'
import type { DashboardStats } from '@/api/types'

const PREVIEW_DASHBOARD_STATS: DashboardStats = {
  total_cost_usd: '42.68',
  total_queries: 1824,
  total_input_tokens: 914200,
  total_output_tokens: 281600,
  by_backend: [
    { backend: 'OpenAI', query_count: 1268, cost_usd: '31.42', total_tokens: 882400 },
    { backend: 'Gemini', query_count: 556, cost_usd: '11.26', total_tokens: 313400 },
  ],
  daily_series: [],
}

export function useDashboardStats(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['admin', 'dashboard', dateFrom, dateTo],
    queryFn: () =>
      import.meta.env.DEV
        ? Promise.resolve(PREVIEW_DASHBOARD_STATS)
        : getDashboardStats(dateFrom, dateTo).then((r) => r.data.data),
    refetchInterval: 60_000,
  })
}
