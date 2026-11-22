import apiClient from './client'
import type {
  AdminSurveyAnalytics,
  AdminSurveyCreatePayload,
  AdminSurveyDetail,
  AdminSurveyListItem,
  AdminSurveyResponse,
  AdminSurveyResponseDetail,
  AdminSurveyUpdatePayload,
  ApiResponse,
  SurveyStatus,
} from './types'

/** Survey endpoints return total/hasMore, independently of other admin pagination contracts. */
export interface SurveyOffsetPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface SurveyListResponse {
  success: boolean
  data: AdminSurveyListItem[]
  pagination: SurveyOffsetPagination
}

interface SurveyResponseListResponse {
  success: boolean
  data: AdminSurveyResponse[]
  pagination: SurveyOffsetPagination
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

export const createAdminSurvey = (data: AdminSurveyCreatePayload) =>
  apiClient.post<ApiResponse<{ id: number; external_id: string }>>(
    '/daodao-server/api/v1/admin/surveys',
    data,
  )

export const updateAdminSurvey = (id: number, data: AdminSurveyUpdatePayload) =>
  apiClient.put<ApiResponse<{ id: number; updated: boolean }>>(
    `/daodao-server/api/v1/admin/surveys/${id}`,
    data,
  )

export const getAdminSurveyResponseDetail = (surveyId: number, responseId: number) =>
  apiClient.get<ApiResponse<AdminSurveyResponseDetail>>(
    `/daodao-server/api/v1/admin/surveys/${surveyId}/responses/${responseId}`,
  )

export const getAdminSurveyAnalytics = (id: number) =>
  apiClient.get<ApiResponse<AdminSurveyAnalytics>>(
    `/daodao-server/api/v1/admin/surveys/${id}/analytics`,
  )

export interface AdminSurveyImage {
  id: number
  url: string
}
export const listAdminSurveyImages = () =>
  apiClient.get<ApiResponse<AdminSurveyImage[]>>('/daodao-server/api/v1/admin/surveys/images')
export const uploadAdminSurveyImage = (file: File) => {
  const data = new FormData()
  data.append('file', file)
  return apiClient.post<ApiResponse<AdminSurveyImage>>(
    '/daodao-server/api/v1/admin/surveys/images',
    data,
  )
}
export const deleteAdminSurveyImage = (imageId: number) =>
  apiClient.delete(`/daodao-server/api/v1/admin/surveys/images/${imageId}`)
