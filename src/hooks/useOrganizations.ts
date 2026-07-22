import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addOrganizationMember,
  createOrganization,
  listOrganizationMembers,
  listOrganizations,
  removeOrganizationMember,
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
