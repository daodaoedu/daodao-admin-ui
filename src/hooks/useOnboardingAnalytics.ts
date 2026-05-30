import { useQuery } from '@tanstack/react-query'
import {
  getEmailOnboardingStats,
  getEngagementStats,
  getOnboardingStats,
  getPersonaStats,
  getQuizStats,
  getUserOnboardingDetail,
} from '@/api/admin-community'

export function useOnboardingStats() {
  return useQuery({
    queryKey: ['admin', 'onboarding', 'stats'],
    queryFn: () => getOnboardingStats().then((r) => r.data.data),
  })
}

export function useUserOnboardingDetail(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'onboarding'],
    queryFn: () => getUserOnboardingDetail(userId).then((r) => r.data.data),
    enabled: !!userId,
  })
}

export function useQuizAnalyticsStats() {
  return useQuery({
    queryKey: ['admin', 'quiz', 'stats'],
    queryFn: () => getQuizStats().then((r) => r.data.data),
  })
}

export function usePersonaStats() {
  return useQuery({
    queryKey: ['admin', 'persona', 'stats'],
    queryFn: () => getPersonaStats().then((r) => r.data.data),
  })
}

export function useEmailOnboardingStats() {
  return useQuery({
    queryKey: ['admin', 'email', 'onboarding-stats'],
    queryFn: () => getEmailOnboardingStats().then((r) => r.data.data),
  })
}

export function useEngagementStats() {
  return useQuery({
    queryKey: ['admin', 'engagement', 'stats'],
    queryFn: () => getEngagementStats().then((r) => r.data.data),
  })
}
