import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTrustLevelConfig,
  getTrustLevelDistribution,
  getTrustLevelHistory,
  listUserGroups,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
} from '@/api/admin-trust'

export function useTrustLevelConfig() {
  return useQuery({
    queryKey: ['admin', 'trust-levels', 'config'],
    queryFn: () => getTrustLevelConfig().then((r) => r.data.data),
  })
}

export function useTrustLevelDistribution() {
  return useQuery({
    queryKey: ['admin', 'trust-levels', 'distribution'],
    queryFn: () => getTrustLevelDistribution().then((r) => r.data.data),
  })
}

export function useTrustLevelHistory() {
  return useQuery({
    queryKey: ['admin', 'trust-levels', 'history'],
    queryFn: () => getTrustLevelHistory().then((r) => r.data.data),
  })
}

export function useUserGroups() {
  return useQuery({
    queryKey: ['admin', 'user-groups'],
    queryFn: () => listUserGroups().then((r) => r.data.data),
  })
}

export function useCreateUserGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createUserGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'user-groups'] }),
  })
}

export function useUpdateUserGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateUserGroup>[1] }) =>
      updateUserGroup(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'user-groups'] }),
  })
}

export function useDeleteUserGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteUserGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'user-groups'] }),
  })
}
