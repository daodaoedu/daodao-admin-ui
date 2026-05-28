import apiClient from './client'
import type { ApiResponse } from './types'

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
  isActive: boolean
  steps: OnboardingStep[]
  completionRate?: number
  avgDurationMinutes?: number
  newUsersThisMonth?: number
}

export interface OnboardingStep {
  id: number
  question: string
  type: string
  topAnswer?: string
  topPercent?: number
  completionRate?: number
}

export interface OnboardingFlowCreate {
  name: string
  steps?: Omit<OnboardingStep, 'id'>[]
}

export interface OnboardingFlowUpdate {
  name?: string
  isActive?: boolean
  steps?: Omit<OnboardingStep, 'id'>[]
}

export interface OnboardingFlowAnalytics {
  completionRate: number
  avgDurationMinutes: number
  newUsersThisMonth: number
  funnelSteps: Array<{ label: string; value: number }>
  [key: string]: unknown
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
