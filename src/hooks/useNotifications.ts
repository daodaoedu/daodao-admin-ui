import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type CreateAdminNotificationPayload,
  createAdminNotification,
  deleteAdminNotification,
  getAdminNotificationStats,
  listAdminNotifications,
  sendAdminNotification,
} from '@/api/admin-communication'

export function useAdminNotifications(params?: {
  limit?: number
  offset?: number
  status?: string
}) {
  return useQuery({
    queryKey: ['admin', 'notifications', params],
    queryFn: () => listAdminNotifications(params).then((r) => r.data.data),
  })
}

export function useAdminNotificationStats() {
  return useQuery({
    queryKey: ['admin', 'notification-stats'],
    queryFn: () => getAdminNotificationStats().then((r) => r.data.data),
  })
}

export function useCreateAdminNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAdminNotificationPayload) => createAdminNotification(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'notification-stats'] })
    },
  })
}

export function useSendAdminNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sendAdminNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'notification-stats'] })
    },
  })
}

export function useDeleteAdminNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAdminNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'notification-stats'] })
    },
  })
}

/** @deprecated Use useAdminNotifications instead */
export function useNotifications(params?: { limit?: number; offset?: number }) {
  return useAdminNotifications(params)
}
