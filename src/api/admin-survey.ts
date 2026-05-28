import apiClient from './client'
import type {
  AdminSurveyDetail,
  AdminSurveyListItem,
  AdminSurveyResponse,
  ApiResponse,
  OffsetPagination,
  SurveyStatus,
} from './types'

interface SurveyListResponse {
  success: boolean
  data: AdminSurveyListItem[]
  pagination: OffsetPagination
}

interface SurveyResponseListResponse {
  success: boolean
  data: AdminSurveyResponse[]
  pagination: OffsetPagination
}

export const listAdminSurveys = (params?: {
  status?: SurveyStatus
  q?: string
  limit?: number
  offset?: number
}) => apiClient.get<SurveyListResponse>('/daodao-server/api/v1/admin/surveys', { params })

export const getAdminSurvey = (id: number) =>
  apiClient.get<ApiResponse<AdminSurveyDetail>>(`/daodao-server/api/v1/admin/surveys/${id}`)

export const updateAdminSurveyStatus = (id: number, status: SurveyStatus) =>
  apiClient.patch<ApiResponse<{ id: number; status: SurveyStatus; updated_at: string }>>(
    `/daodao-server/api/v1/admin/surveys/${id}/status`,
    { status },
  )

export const deleteAdminSurvey = (id: number) =>
  apiClient.delete(`/daodao-server/api/v1/admin/surveys/${id}`)

export const listAdminSurveyResponses = (
  id: number,
  params?: { limit?: number; offset?: number },
) =>
  apiClient.get<SurveyResponseListResponse>(`/daodao-server/api/v1/admin/surveys/${id}/responses`, {
    params,
  })

export const deleteAdminSurveyResponse = (surveyId: number, responseId: number) =>
  apiClient.delete(`/daodao-server/api/v1/admin/surveys/${surveyId}/responses/${responseId}`)
