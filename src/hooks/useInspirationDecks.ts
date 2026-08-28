import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addInspirationCard,
  assignInspirationDeck,
  createInspirationDeck,
  deleteInspirationCard,
  deleteInspirationDeck,
  duplicateInspirationDeck,
  getInspirationDeck,
  importInspirationCards,
  listInspirationDecks,
  renameInspirationDeck,
  unassignInspirationDeck,
  updateInspirationCard,
} from '@/api/admin-inspiration'
import type { InspirationDeckCreate } from '@/api/types'

const KEY = ['admin', 'inspiration-decks'] as const
const CHALLENGE_KEY = ['admin', 'group-challenges'] as const

export function useInspirationDecks() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => listInspirationDecks().then((r) => r.data.data),
  })
}

export function useInspirationDeck(deckId: number | null) {
  return useQuery({
    queryKey: [...KEY, deckId],
    queryFn: () => getInspirationDeck(deckId as number).then((r) => r.data.data),
    enabled: deckId !== null,
  })
}

function useInvalidateDecks() {
  const queryClient = useQueryClient()
  // 回傳 promise 讓 mutateAsync 等 refetch 完成，呼叫端選取新建項目時清單已是最新
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: KEY }),
      // 指派狀態也顯示在挑戰管理頁
      queryClient.invalidateQueries({ queryKey: [...CHALLENGE_KEY, 'cohorts'] }),
    ])
}

export function useCreateInspirationDeck() {
  const invalidate = useInvalidateDecks()
  return useMutation({
    mutationFn: (data: InspirationDeckCreate) => createInspirationDeck(data),
    onSuccess: invalidate,
  })
}

export function useRenameInspirationDeck() {
  const invalidate = useInvalidateDecks()
  return useMutation({
    mutationFn: ({ deckId, name }: { deckId: number; name: string }) =>
      renameInspirationDeck(deckId, name),
    onSuccess: invalidate,
  })
}

export function useDeleteInspirationDeck() {
  const invalidate = useInvalidateDecks()
  return useMutation({
    mutationFn: (deckId: number) => deleteInspirationDeck(deckId),
    onSuccess: invalidate,
  })
}

export function useDuplicateInspirationDeck() {
  const invalidate = useInvalidateDecks()
  return useMutation({
    mutationFn: (deckId: number) => duplicateInspirationDeck(deckId),
    onSuccess: invalidate,
  })
}

export function useAddInspirationCard() {
  const invalidate = useInvalidateDecks()
  return useMutation({
    mutationFn: ({ deckId, content }: { deckId: number; content: string }) =>
      addInspirationCard(deckId, content),
    onSuccess: invalidate,
  })
}

export function useUpdateInspirationCard() {
  const invalidate = useInvalidateDecks()
  return useMutation({
    mutationFn: ({
      deckId,
      cardId,
      content,
    }: {
      deckId: number
      cardId: number
      content: string
    }) => updateInspirationCard(deckId, cardId, content),
    onSuccess: invalidate,
  })
}

export function useDeleteInspirationCard() {
  const invalidate = useInvalidateDecks()
  return useMutation({
    mutationFn: ({ deckId, cardId }: { deckId: number; cardId: number }) =>
      deleteInspirationCard(deckId, cardId),
    onSuccess: invalidate,
  })
}

export function useImportInspirationCards() {
  const invalidate = useInvalidateDecks()
  return useMutation({
    mutationFn: ({ deckId, file }: { deckId: number; file: File }) =>
      importInspirationCards(deckId, file).then((r) => r.data.data),
    onSuccess: invalidate,
  })
}

export function useAssignInspirationDeck() {
  const invalidate = useInvalidateDecks()
  return useMutation({
    mutationFn: ({
      deckId,
      cohortId,
      assign,
    }: {
      deckId: number
      cohortId: number
      assign: boolean
    }) =>
      assign ? assignInspirationDeck(deckId, cohortId) : unassignInspirationDeck(deckId, cohortId),
    onSuccess: invalidate,
  })
}
