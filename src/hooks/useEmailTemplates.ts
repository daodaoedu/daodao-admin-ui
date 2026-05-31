import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplate,
  listEmailTemplates,
  updateEmailTemplate,
} from '@/api/admin-system'
import type { EmailTemplateCreate, EmailTemplateUpdate } from '@/api/types'

const QUERY_KEY = ['email-templates']

export function useEmailTemplates() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listEmailTemplates().then((r) => r.data.data),
  })
}

export function useCreateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EmailTemplateCreate) => createEmailTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmailTemplateUpdate }) =>
      updateEmailTemplate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEmailTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useEmailTemplate(id: number | null) {
  return useQuery({
    queryKey: ['email-template', id],
    queryFn: () => getEmailTemplate(id!).then((r) => r.data.data),
    enabled: id !== null,
  })
}
