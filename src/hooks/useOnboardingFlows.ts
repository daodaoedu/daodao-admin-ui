import { useQuery } from '@tanstack/react-query'
import { getOnboardingFlowAnalytics, listOnboardingFlows } from '@/api/admin-community'

export function useOnboardingFlows() {
  return useQuery({
    queryKey: ['admin', 'onboarding', 'flows'],
    queryFn: () => listOnboardingFlows().then((r) => r.data.data),
  })
}

export function useOnboardingFlowAnalytics(id: number) {
  return useQuery({
    queryKey: ['admin', 'onboarding', 'flows', id, 'analytics'],
    queryFn: () => getOnboardingFlowAnalytics(id).then((r) => r.data.data),
    enabled: id > 0,
  })
}
