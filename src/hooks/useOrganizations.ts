import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addOrganizationMember,
  approveOrganizationInvitation,
  createOrganization,
  inviteOrganizationOwner,
  listOrganizationInvitations,
  listOrganizationMembers,
  listOrganizations,
  removeOrganizationMember,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
  updateOrganization,
} from '@/api/admin-organization'
import type { OrganizationCreate, OrganizationUpdate } from '@/api/types'

const ORGANIZATION_QUERY_KEY = ['admin', 'organizations'] as const

export function useOrganizations() {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: () => listOrganizations().then((response) => response.data.data),
  })
}

export function useOrganizationMembers(organizationId: number | null) {
  return useQuery({
    queryKey: [...ORGANIZATION_QUERY_KEY, organizationId, 'members'],
    queryFn: () =>
      listOrganizationMembers(organizationId as number).then((response) => response.data.data),
    enabled: organizationId !== null,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: OrganizationCreate) => createOrganization(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY }),
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, data }: { organizationId: number; data: OrganizationUpdate }) =>
      updateOrganization(organizationId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY }),
  })
}

export function useAddOrganizationMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: number; userId: number }) =>
      addOrganizationMember(organizationId, userId),
    onSuccess: (_response, variables) =>
      queryClient.invalidateQueries({
        queryKey: [...ORGANIZATION_QUERY_KEY, variables.organizationId, 'members'],
      }),
  })
}

export function useRemoveOrganizationMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: number; userId: number }) =>
      removeOrganizationMember(organizationId, userId),
    onSuccess: (_response, variables) =>
      queryClient.invalidateQueries({
        queryKey: [...ORGANIZATION_QUERY_KEY, variables.organizationId, 'members'],
      }),
  })
}

export function useOrganizationInvitations(organizationId: number) {
  return useQuery({
    queryKey: [...ORGANIZATION_QUERY_KEY, organizationId, 'invitations'],
    refetchInterval: 30000,
    queryFn: () =>
      listOrganizationInvitations(organizationId).then((response) => response.data.data),
  })
}

export function useInviteOrganizationOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, email }: { organizationId: number; email: string }) =>
      inviteOrganizationOwner(organizationId, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY }),
  })
}

export function useResendOrganizationInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      invitationId,
    }: {
      organizationId: number
      invitationId: number
    }) => resendOrganizationInvitation(organizationId, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY }),
  })
}

export function useRevokeOrganizationInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      invitationId,
    }: {
      organizationId: number
      invitationId: number
    }) => revokeOrganizationInvitation(organizationId, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY }),
  })
}

export function useApproveOrganizationInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      invitationId,
      requestId,
    }: {
      organizationId: number
      invitationId: number
      requestId: number
    }) => approveOrganizationInvitation(organizationId, invitationId, requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY }),
  })
}
