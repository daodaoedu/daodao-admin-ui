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
  ChallengeCohort,
  ChallengeCohortCreate,
  ChallengeCohortUpdate,
  ChallengeProgram,
  ChallengeProgramCreate,
  ChallengeProgramUpdate,
  ChallengeTemplate,
  ChallengeTemplateCreate,
  ChallengeTemplateUpdate,
} from '@/api/types'

const PREVIEW_PROGRAMS: ChallengeProgram[] = [
  {
    id: 1,
    organizationId: 1,
    organizationName: '島島阿學',
    name: '秋日覺察練習',
    description: '以每日短練習建立穩定的覺察習慣。',
    cohortCount: 2,
    publishedCohortCount: 1,
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-12T09:00:00Z',
  },
]

const PREVIEW_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 101,
    externalId: 'preview-mindful-morning',
    organizationId: 1,
    title: '每日三分鐘覺察',
    practiceAction: '寫下今天最想留意的一件事。',
    durationDays: 14,
    frequencyMinDays: 5,
    frequencyMaxDays: 7,
    sessionDurationMinutes: 3,
    practiceTimePeriods: ['morning'],
    boundCohortIds: [201],
    bindings: [{ cohortId: 201, startDate: '2026-09-16' }],
    resources: [],
    generatedDraftCount: 0,
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-08T09:00:00Z',
  },
]

const PREVIEW_COHORTS: ChallengeCohort[] = [
  {
    id: 201,
    programId: 1,
    slug: 'autumn-awareness-2026',
    displayName: '秋日覺察挑戰｜第一期',
    startDate: '2026-09-16',
    endDate: '2026-09-29',
    joinDeadline: '2026-09-15',
    capacity: 80,
    status: 'published',
    runStatus: 'upcoming',
    participantCount: 34,
    template: { id: 101, title: '每日三分鐘覺察', durationDays: 14 },
    decks: [{ id: 1, name: '覺察靈感卡' }],
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-12T09:00:00Z',
  },
]

export const KEY = ['admin', 'group-challenges'] as const
const programsKey = (organizationId?: number) => [...KEY, 'programs', organizationId ?? 'all']
const cohortsKey = (programId: number | null) => [...KEY, 'cohorts', programId]
const templatesKey = (organizationId: number | null) => [...KEY, 'templates', organizationId]

// ── 主題 ──────────────────────────────────────────────────────

export function useChallengePrograms(organizationId?: number) {
  return useQuery({
    queryKey: [...programsKey(organizationId), import.meta.env.DEV ? 'preview' : 'api'],
    queryFn: () =>
      import.meta.env.DEV
        ? Promise.resolve(PREVIEW_PROGRAMS)
        : listChallengePrograms({ organizationId }).then((r) => r.data.data),
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
    queryKey: [...cohortsKey(programId), import.meta.env.DEV ? 'preview' : 'api'],
    queryFn: () =>
      import.meta.env.DEV
        ? Promise.resolve(PREVIEW_COHORTS.filter((cohort) => cohort.programId === programId))
        : listChallengeCohorts(programId as number).then((r) => r.data.data),
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
    queryKey: [...templatesKey(organizationId), import.meta.env.DEV ? 'preview' : 'api'],
    queryFn: () =>
      import.meta.env.DEV
        ? Promise.resolve(
            PREVIEW_TEMPLATES.filter((template) => template.organizationId === organizationId),
          )
        : listChallengeTemplates(organizationId as number).then((r) => r.data.data),
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
