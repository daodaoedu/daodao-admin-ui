import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type FeedbackCategory,
  type FeedbackStatus,
  listFeedback,
  replyToFeedback,
  updateFeedbackStatus,
} from '@/api/admin-support'

const FEEDBACK_KEY = ['admin', 'feedback'] as const

export function useFeedback(params?: {
  status?: FeedbackStatus
  category?: FeedbackCategory
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: [...FEEDBACK_KEY, params],
    queryFn: () => listFeedback(params).then((r) => r.data.data),
  })
}

/**
 * 每次送出都會呼叫的回呼。寫在 hook 層而不是 mutate() 的第二個參數：
 * 多則回饋同時送出時，mutate() 的回呼只會跑最後一次，前一則會收不到結果。
 */
interface MutationHandlers<TVariables> {
  onSuccess?: (variables: TVariables) => void
  onError?: (error: unknown, variables: TVariables) => void
}

/** 送出回覆；成功後重抓列表（狀態會變成已回覆、回覆內容出現在展開區） */
export function useReplyToFeedback(handlers: MutationHandlers<{ id: number; content: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      replyToFeedback(id, { content }).then((r) => r.data.data),
    onSuccess: (_data, variables) => {
      handlers.onSuccess?.(variables)
      return queryClient.invalidateQueries({ queryKey: FEEDBACK_KEY })
    },
    onError: (error, variables) => handlers.onError?.(error, variables),
  })
}

/** 變更狀態；成功後重抓列表與統計 */
export function useUpdateFeedbackStatus(
  handlers: MutationHandlers<{ id: number; status: FeedbackStatus }>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FeedbackStatus }) =>
      updateFeedbackStatus(id, { status }).then((r) => r.data.data),
    onSuccess: (_data, variables) => {
      handlers.onSuccess?.(variables)
      return queryClient.invalidateQueries({ queryKey: FEEDBACK_KEY })
    },
    onError: (error, variables) => handlers.onError?.(error, variables),
  })
}
