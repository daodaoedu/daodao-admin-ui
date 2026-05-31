import apiClient from './client'
import type {
  AdminPersonaQuestion,
  AdminPersonaQuestionCreate,
  AdminPersonaQuestionUpdate,
  AdminPersonaTranslationUpsert,
  ApiResponse,
} from './types'

const BASE = '/daodao-server/api/v1/admin/persona'

export const listPersonaQuestions = () =>
  apiClient.get<ApiResponse<AdminPersonaQuestion[]>>(`${BASE}/questions`)

export const getPersonaQuestion = (id: number) =>
  apiClient.get<ApiResponse<AdminPersonaQuestion>>(`${BASE}/questions/${id}`)

export const createPersonaQuestion = (data: AdminPersonaQuestionCreate) =>
  apiClient.post<ApiResponse<AdminPersonaQuestion>>(`${BASE}/questions`, data)

export const updatePersonaQuestion = (id: number, data: AdminPersonaQuestionUpdate) =>
  apiClient.put<ApiResponse<AdminPersonaQuestion>>(`${BASE}/questions/${id}`, data)

export const deletePersonaQuestion = (id: number) =>
  apiClient.delete<ApiResponse<{ message: string }>>(`${BASE}/questions/${id}`)

export const upsertPersonaTranslation = (
  questionId: number,
  locale: string,
  data: AdminPersonaTranslationUpsert,
) =>
  apiClient.put<ApiResponse<AdminPersonaQuestion>>(
    `${BASE}/questions/${questionId}/translations/${locale}`,
    data,
  )

export const deletePersonaTranslation = (questionId: number, locale: string) =>
  apiClient.delete<ApiResponse<{ message: string }>>(
    `${BASE}/questions/${questionId}/translations/${locale}`,
  )
