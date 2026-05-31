import apiClient from './client'
import type {
  ApiResponse,
  EmailOnboardingStats,
  EngagementStats,
  OnboardingStats,
  PersonaStats,
  PersonaUserProfile,
  QuizStats,
  UserOnboardingDetail,
} from './types'

// ── Member Directory ──────────────────────────────────────

export interface ProfileField {
  id: number
  name: string
  type: 'text' | 'dropdown' | 'multi-select' | 'URL'
  required: boolean
  visibility: string
  fillRate: number
  order?: number
}

export interface ProfileFieldCreate {
  name: string
  type: 'text' | 'dropdown' | 'multi-select' | 'URL'
  required?: boolean
  visibility?: string
}

export interface ProfileFieldUpdate {
  name?: string
  type?: 'text' | 'dropdown' | 'multi-select' | 'URL'
  required?: boolean
  visibility?: string
}

export interface MemberDirectoryStats {
  searchCount: number
  profileViews: number
  connectionRate: number
}

export interface MemberDirectoryAnalytics {
  searchCount: number
  profileViews: number
  connectionRate: number
  [key: string]: unknown
}

export const listMemberDirectoryFields = () =>
  apiClient.get<ApiResponse<ProfileField[]>>('/daodao-server/api/v1/admin/member-directory/fields')

export const createMemberDirectoryField = (data: ProfileFieldCreate) =>
  apiClient.post<ApiResponse<ProfileField>>(
    '/daodao-server/api/v1/admin/member-directory/fields',
    data,
  )

export const updateMemberDirectoryField = (id: number, data: ProfileFieldUpdate) =>
  apiClient.put<ApiResponse<ProfileField>>(
    `/daodao-server/api/v1/admin/member-directory/fields/${id}`,
    data,
  )

export const deleteMemberDirectoryField = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(
    `/daodao-server/api/v1/admin/member-directory/fields/${id}`,
  )

export const reorderMemberDirectoryFields = (data: { ids: number[] }) =>
  apiClient.patch<ApiResponse<{ success: boolean }>>(
    '/daodao-server/api/v1/admin/member-directory/fields/reorder',
    data,
  )

export const getMemberDirectoryStats = () =>
  apiClient.get<ApiResponse<MemberDirectoryStats>>(
    '/daodao-server/api/v1/admin/member-directory/stats',
  )

export const getMemberDirectoryAnalytics = () =>
  apiClient.get<ApiResponse<MemberDirectoryAnalytics>>(
    '/daodao-server/api/v1/admin/member-directory/analytics',
  )

// ── Onboarding Flows ─────────────────────────────────────

export interface OnboardingFlow {
  id: number
  name: string
  isEnabled: boolean
  steps: OnboardingStep[]
  completionRate: number
  createdAt: string
}

export interface OnboardingStep {
  id: number
  questionText: string
  questionType: 'single' | 'multi' | 'text'
  options?: string[]
  completionRate: number
}

export interface OnboardingFlowCreate {
  name: string
  isEnabled?: boolean
  steps?: Array<{
    questionText: string
    questionType: 'single' | 'multi' | 'text'
    options?: string[]
  }>
}

export interface OnboardingFlowUpdate {
  name?: string
  isEnabled?: boolean
  steps?: Array<{
    questionText: string
    questionType: 'single' | 'multi' | 'text'
    options?: string[]
  }>
}

export interface OnboardingFlowAnalytics {
  flowId: number
  totalStarted: number
  totalCompleted: number
  averageTimeMinutes: number
  dropOffSteps: Array<{ stepId: number; dropRate: number }>
}

export const listOnboardingFlows = () =>
  apiClient.get<ApiResponse<OnboardingFlow[]>>('/daodao-server/api/v1/admin/onboarding/flows')

export const createOnboardingFlow = (data: OnboardingFlowCreate) =>
  apiClient.post<ApiResponse<OnboardingFlow>>('/daodao-server/api/v1/admin/onboarding/flows', data)

export const updateOnboardingFlow = (id: number, data: OnboardingFlowUpdate) =>
  apiClient.put<ApiResponse<OnboardingFlow>>(
    `/daodao-server/api/v1/admin/onboarding/flows/${id}`,
    data,
  )

export const deleteOnboardingFlow = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(
    `/daodao-server/api/v1/admin/onboarding/flows/${id}`,
  )

export const getOnboardingFlowAnalytics = (id: number) =>
  apiClient.get<ApiResponse<OnboardingFlowAnalytics>>(
    `/daodao-server/api/v1/admin/onboarding/flows/${id}/analytics`,
  )

// ── Onboarding Analytics ──────────────────────────────────────────────────────

export const getOnboardingStats = () =>
  apiClient.get<ApiResponse<OnboardingStats>>('/daodao-server/api/v1/admin/onboarding/stats')

export const getUserOnboardingDetail = (userId: string) =>
  apiClient.get<ApiResponse<UserOnboardingDetail>>(
    `/daodao-server/api/v1/admin/users/${userId}/onboarding`,
  )

export const getQuizStats = () =>
  apiClient.get<ApiResponse<QuizStats>>('/daodao-server/api/v1/admin/quiz/stats')

export const getPersonaStats = () =>
  apiClient.get<ApiResponse<PersonaStats>>('/daodao-server/api/v1/admin/persona/stats')

export const getEmailOnboardingStats = () =>
  apiClient.get<ApiResponse<EmailOnboardingStats>>(
    '/daodao-server/api/v1/admin/email/onboarding-stats',
  )

export const getEngagementStats = () =>
  apiClient.get<ApiResponse<EngagementStats>>('/daodao-server/api/v1/admin/engagement/stats')

export const getUserPersonaProfile = (userUuid: string) =>
  apiClient.get<ApiResponse<PersonaUserProfile>>(
    `/daodao-server/api/v1/persona/profile/${userUuid}`,
  )
