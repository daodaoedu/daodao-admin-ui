import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveChallengeCohort,
  archiveChallengeProgram,
  createChallengeCohort,
  createChallengeProgram,
  createChallengeTemplate,
  deleteChallengeTemplate,
  duplicateChallengeCohort,
  duplicateChallengeProgram,
  listChallengeCohorts,
  listChallengeParticipants,
  listChallengePrograms,
  listChallengeTemplates,
  setChallengeCohortStatus,
  updateChallengeCohort,
  updateChallengeProgram,
  updateChallengeTemplate,
} from '@/api/admin-challenge'
import type {
  ChallengeCohortCreate,
  ChallengeCohortUpdate,
  ChallengeProgramCreate,
  ChallengeProgramUpdate,
  ChallengeTemplateCreate,
  ChallengeTemplateUpdate,
} from '@/api/types'

export const KEY = ['admin', 'group-challenges'] as const
const programsKey = (organizationId?: number) => [...KEY, 'programs', organizationId ?? 'all']
const cohortsKey = (programId: number | null) => [...KEY, 'cohorts', programId]
const templatesKey = (organizationId: number | null) => [...KEY, 'templates', organizationId]

// ── 主題 ──────────────────────────────────────────────────────

export function useChallengePrograms(organizationId?: number) {
  return useQuery({
    queryKey: programsKey(organizationId),
    queryFn: () => listChallengePrograms({ organizationId }).then((r) => r.data.data),
  })
}

function useInvalidatePrograms() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [...KEY, 'programs'] })
}

export function useCreateChallengeProgram() {
  const invalidate = useInvalidatePrograms()
  return useMutation({
    mutationFn: (data: ChallengeProgramCreate) => createChallengeProgram(data),
    onSuccess: invalidate,
  })
}

export function useUpdateChallengeProgram() {
  const invalidate = useInvalidatePrograms()
  return useMutation({
    mutationFn: ({ programId, data }: { programId: number; data: ChallengeProgramUpdate }) =>
      updateChallengeProgram(programId, data),
    onSuccess: invalidate,
  })
}

export function useArchiveChallengeProgram() {
  const invalidate = useInvalidatePrograms()
  return useMutation({
    mutationFn: (programId: number) => archiveChallengeProgram(programId),
    onSuccess: invalidate,
  })
}

export function useDuplicateChallengeProgram() {
  const invalidate = useInvalidatePrograms()
  return useMutation({
    mutationFn: (programId: number) => duplicateChallengeProgram(programId),
    onSuccess: invalidate,
  })
}

// ── 挑戰（期）──────────────────────────────────────────────────

export function useChallengeCohorts(programId: number | null) {
  return useQuery({
    queryKey: cohortsKey(programId),
    queryFn: () => listChallengeCohorts(programId as number).then((r) => r.data.data),
    enabled: programId !== null,
  })
}

function useInvalidateCohorts() {
  const queryClient = useQueryClient()
  return (programId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: cohortsKey(programId) }),
      queryClient.invalidateQueries({ queryKey: [...KEY, 'programs'] }),
      queryClient.invalidateQueries({ queryKey: [...KEY, 'templates'] }),
    ])
}

export function useCreateChallengeCohort() {
  const invalidate = useInvalidateCohorts()
  return useMutation({
    mutationFn: ({ programId, data }: { programId: number; data: ChallengeCohortCreate }) =>
      createChallengeCohort(programId, data),
    onSuccess: (_r, v) => invalidate(v.programId),
  })
}

export function useUpdateChallengeCohort() {
  const invalidate = useInvalidateCohorts()
  return useMutation({
    mutationFn: ({
      programId,
      cohortId,
      data,
    }: {
      programId: number
      cohortId: number
      data: ChallengeCohortUpdate
    }) => updateChallengeCohort(programId, cohortId, data),
    onSuccess: (_r, v) => invalidate(v.programId),
  })
}

export function useSetChallengeCohortStatus() {
  const invalidate = useInvalidateCohorts()
  return useMutation({
    mutationFn: ({
      programId,
      cohortId,
      status,
    }: {
      programId: number
      cohortId: number
      status: 'draft' | 'published'
    }) => setChallengeCohortStatus(programId, cohortId, status),
    onSuccess: (_r, v) => invalidate(v.programId),
  })
}

export function useArchiveChallengeCohort() {
  const invalidate = useInvalidateCohorts()
  return useMutation({
    mutationFn: ({ programId, cohortId }: { programId: number; cohortId: number }) =>
      archiveChallengeCohort(programId, cohortId),
    onSuccess: (_r, v) => invalidate(v.programId),
  })
}

export function useDuplicateChallengeCohort() {
  const invalidate = useInvalidateCohorts()
  return useMutation({
    mutationFn: ({ programId, cohortId }: { programId: number; cohortId: number }) =>
      duplicateChallengeCohort(programId, cohortId),
    onSuccess: (_r, v) => invalidate(v.programId),
  })
}

export function useChallengeParticipants(programId: number | null, cohortId: number | null) {
  return useQuery({
    queryKey: [...KEY, 'participants', programId, cohortId],
    queryFn: () =>
      listChallengeParticipants(programId as number, cohortId as number).then((r) => r.data.data),
    enabled: programId !== null && cohortId !== null,
  })
}

// ── 模板 ──────────────────────────────────────────────────────

export function useChallengeTemplates(organizationId: number | null) {
  return useQuery({
    queryKey: templatesKey(organizationId),
    queryFn: () => listChallengeTemplates(organizationId as number).then((r) => r.data.data),
    enabled: organizationId !== null,
  })
}

function useInvalidateTemplates() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [...KEY, 'templates'] })
}

export function useCreateChallengeTemplate() {
  const invalidate = useInvalidateTemplates()
  return useMutation({
    mutationFn: (data: ChallengeTemplateCreate) => createChallengeTemplate(data),
    onSuccess: invalidate,
  })
}

export function useUpdateChallengeTemplate() {
  const invalidate = useInvalidateTemplates()
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: number; data: ChallengeTemplateUpdate }) =>
      updateChallengeTemplate(templateId, data),
    onSuccess: invalidate,
  })
}

export function useDeleteChallengeTemplate() {
  const invalidate = useInvalidateTemplates()
  return useMutation({
    mutationFn: (templateId: number) => deleteChallengeTemplate(templateId),
    onSuccess: invalidate,
  })
}
