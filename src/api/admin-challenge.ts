import apiClient from '@/api/client'
import type {
  ApiResponse,
  ChallengeCohort,
  ChallengeCohortCreate,
  ChallengeCohortUpdate,
  ChallengeParticipant,
  ChallengeProgram,
  ChallengeProgramCreate,
  ChallengeProgramUpdate,
  ChallengeTemplate,
  ChallengeTemplateCreate,
  ChallengeTemplateUpdate,
} from '@/api/types'

const BASE_PATH = '/daodao-server/api/v1/admin/challenges'

// ── 主題（program）──────────────────────────────────────────────

export const listChallengePrograms = (params?: { organizationId?: number }) =>
  apiClient.get<ApiResponse<ChallengeProgram[]>>(`${BASE_PATH}/programs`, { params })

export const createChallengeProgram = (data: ChallengeProgramCreate) =>
  apiClient.post<ApiResponse<ChallengeProgram>>(`${BASE_PATH}/programs`, data)

export const updateChallengeProgram = (programId: number, data: ChallengeProgramUpdate) =>
  apiClient.patch<ApiResponse<ChallengeProgram>>(`${BASE_PATH}/programs/${programId}`, data)

export const archiveChallengeProgram = (programId: number) =>
  apiClient.delete(`${BASE_PATH}/programs/${programId}`)

export const duplicateChallengeProgram = (programId: number) =>
  apiClient.post<ApiResponse<ChallengeProgram>>(`${BASE_PATH}/programs/${programId}/duplicate`)

// ── 挑戰（cohort）──────────────────────────────────────────────

export const listChallengeCohorts = (programId: number) =>
  apiClient.get<ApiResponse<ChallengeCohort[]>>(`${BASE_PATH}/programs/${programId}/cohorts`)

export const createChallengeCohort = (programId: number, data: ChallengeCohortCreate) =>
  apiClient.post<ApiResponse<ChallengeCohort>>(`${BASE_PATH}/programs/${programId}/cohorts`, data)

export const updateChallengeCohort = (
  programId: number,
  cohortId: number,
  data: ChallengeCohortUpdate,
) =>
  apiClient.patch<ApiResponse<ChallengeCohort>>(
    `${BASE_PATH}/programs/${programId}/cohorts/${cohortId}`,
    data,
  )

export const setChallengeCohortStatus = (
  programId: number,
  cohortId: number,
  status: 'draft' | 'published',
) =>
  apiClient.post<ApiResponse<ChallengeCohort>>(
    `${BASE_PATH}/programs/${programId}/cohorts/${cohortId}/status`,
    { status },
  )

export const archiveChallengeCohort = (programId: number, cohortId: number) =>
  apiClient.delete(`${BASE_PATH}/programs/${programId}/cohorts/${cohortId}`)

export const duplicateChallengeCohort = (programId: number, cohortId: number) =>
  apiClient.post<ApiResponse<ChallengeCohort>>(
    `${BASE_PATH}/programs/${programId}/cohorts/${cohortId}/duplicate`,
  )

export const listChallengeParticipants = (programId: number, cohortId: number) =>
  apiClient.get<ApiResponse<ChallengeParticipant[]>>(
    `${BASE_PATH}/programs/${programId}/cohorts/${cohortId}/participants`,
  )

// ── 模板（template）────────────────────────────────────────────

export const listChallengeTemplates = (organizationId: number) =>
  apiClient.get<ApiResponse<ChallengeTemplate[]>>(`${BASE_PATH}/templates`, {
    params: { organizationId },
  })

export const createChallengeTemplate = (data: ChallengeTemplateCreate) =>
  apiClient.post<ApiResponse<ChallengeTemplate>>(`${BASE_PATH}/templates`, data)

export const updateChallengeTemplate = (templateId: number, data: ChallengeTemplateUpdate) =>
  apiClient.patch<ApiResponse<ChallengeTemplate>>(`${BASE_PATH}/templates/${templateId}`, data)

export const deleteChallengeTemplate = (templateId: number) =>
  apiClient.delete(`${BASE_PATH}/templates/${templateId}`)
