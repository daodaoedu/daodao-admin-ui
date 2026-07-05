import apiClient from './client'
import type {
  ApiResponse,
  EmailOnboardingStats,
  EngagementStats,
  OnboardingStats,
  PersonaQuestionAnswers,
  PersonaStats,
  PersonaUser,
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
  totalMembers: number
  completedProfiles: number
  averageFillRate: number
}

export interface MemberDirectoryAnalytics {
  fieldFillRates: Array<{ fieldId: number; fieldName: string; fillRate: number }>
  signupTrend: Array<{ date: string; count: number }>
}

export interface CommunityMapStats {
  totalMembers: number
  completedProfiles: number
  averageFillRate: number
}

export interface CommunityMapAnalytics {
  fieldFillRates: Array<{ fieldId: number; fieldName: string; fillRate: number }>
  signupTrend: Array<{ date: string; count: number }>
}

export interface CommunityInteractionPeriodStats {
  reactions: number
  comments: number
  follows: number
  connects: number
}

export interface CommunityInteractionStats {
  current: CommunityInteractionPeriodStats
  changes: {
    reactions: number
    comments: number
    follows: number
    connects: number
  }
  trend: Array<{
    date: string
    reactions: number
    comments: number
    follows: number
    connects: number
  }>
}

export interface InteractionDetails {
  reactionTypes: Array<{ type: string; count: number }>
  commentReplyRate: number
  connectionFunnel: {
    requests: number
    accepted: number
    rejected: number
    pending: number
    acceptRate: number
  }
  topContent: Array<{
    targetType: string
    targetId: number
    targetName: string
    reactions: number
    comments: number
    total: number
  }>
  topActiveUsers: Array<{
    userId: number
    name: string
    avatarUrl: string | null
    interactions: number
  }>
  topFollowedUsers: Array<{
    userId: number
    name: string
    avatarUrl: string | null
    followers: number
  }>
  heatmap: Array<{ dow: number; hour: number; count: number }>
  engagementFunnel: {
    reactors: number
    commenters: number
    followers: number
    connectors: number
  }
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

export const getCommunityInteractionStats = (params?: { period?: '7d' | '30d' | '90d' }) =>
  apiClient.get<ApiResponse<CommunityInteractionStats>>(
    '/daodao-server/api/v1/admin/community/interaction-stats',
    { params },
  )

export const getInteractionDetails = (params?: { period?: '7d' | '30d' | '90d' }) =>
  apiClient.get<ApiResponse<InteractionDetails>>(
    '/daodao-server/api/v1/admin/community/interaction-details',
    { params },
  )

export const listCommunityMapFields = listMemberDirectoryFields
export const createCommunityMapField = createMemberDirectoryField
export const updateCommunityMapField = updateMemberDirectoryField
export const deleteCommunityMapField = deleteMemberDirectoryField
export const reorderCommunityMapFields = reorderMemberDirectoryFields

export const getCommunityMapStats = () =>
  apiClient.get<ApiResponse<CommunityMapStats>>(
    '/daodao-server/api/v1/admin/member-directory/stats',
  )

export const getCommunityMapAnalytics = () =>
  apiClient.get<ApiResponse<CommunityMapAnalytics>>(
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

export const getOnboardingStats = (params?: { days?: number }) =>
  apiClient.get<ApiResponse<OnboardingStats>>('/daodao-server/api/v1/admin/onboarding/stats', {
    params,
  })

export const getUserOnboardingDetail = (userId: string) =>
  apiClient.get<ApiResponse<UserOnboardingDetail>>(
    `/daodao-server/api/v1/admin/users/${userId}/onboarding`,
  )

export const getQuizStats = (params?: { days?: number }) =>
  apiClient.get<ApiResponse<QuizStats>>('/daodao-server/api/v1/admin/quiz/stats', { params })

export const getPersonaStats = (params?: { days?: number }) =>
  apiClient.get<ApiResponse<PersonaStats>>('/daodao-server/api/v1/admin/persona/stats', { params })

export const getEmailOnboardingStats = (params?: { days?: number }) =>
  apiClient.get<ApiResponse<EmailOnboardingStats>>(
    '/daodao-server/api/v1/admin/email/onboarding-stats',
    { params },
  )

export const getEngagementStats = (params?: { days?: number }) =>
  apiClient.get<ApiResponse<EngagementStats>>('/daodao-server/api/v1/admin/engagement/stats', {
    params,
  })

export const getUserPersonaProfile = (userUuid: string) =>
  apiClient.get<ApiResponse<PersonaUserProfile>>(
    `/daodao-server/api/v1/persona/profile/${userUuid}`,
  )

export const listPersonaUsers = (params?: {
  search?: string
  sort?: string
  order?: string
  limit?: number
  offset?: number
}) =>
  apiClient.get<ApiResponse<PersonaUser[]>>('/daodao-server/api/v1/admin/persona/users', { params })

export const getPersonaQuestionAnswers = (
  questionId: number,
  params?: { limit?: number; cursor?: string },
) =>
  apiClient.get<ApiResponse<PersonaQuestionAnswers>>(
    `/daodao-server/api/v1/persona/questions/${questionId}/answers`,
    { params },
  )
