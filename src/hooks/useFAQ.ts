import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkPublishFaqItems,
  createFaqCategory,
  createFaqItem,
  deleteFaqItem,
  listFaqCategories,
  listFaqItems,
  updateFaqItem,
} from '@/api/admin-support'

export function useFaqCategories() {
  return useQuery({
    queryKey: ['admin', 'faq', 'categories'],
    queryFn: () => listFaqCategories().then((r) => r.data.data),
  })
}

export function useFaqItems(categoryId?: number) {
  return useQuery({
    queryKey: ['admin', 'faq', 'items', categoryId],
    queryFn: () => listFaqItems({ categoryId }).then((r) => r.data.data),
    enabled: categoryId !== undefined,
  })
}

export function useCreateFaqItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createFaqItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faq', 'items'] }),
  })
}

export function useUpdateFaqItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateFaqItem>[1] }) =>
      updateFaqItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faq', 'items'] }),
  })
}

export function useDeleteFaqItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteFaqItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faq', 'items'] }),
  })
}

export function useCreateFaqCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createFaqCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faq', 'categories'] }),
  })
}

export function useBulkPublishFaqItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bulkPublishFaqItems,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faq', 'items'] }),
  })
}
