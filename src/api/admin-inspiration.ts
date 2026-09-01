import apiClient from '@/api/client'
import type {
  ApiResponse,
  InspirationDeckCard,
  InspirationDeckCreate,
  InspirationDeckDetail,
  InspirationDeckSummary,
  InspirationImportResult,
} from '@/api/types'

const BASE_PATH = '/daodao-server/api/v1/admin/inspiration-decks'

export const listInspirationDecks = () =>
  apiClient.get<ApiResponse<InspirationDeckSummary[]>>(BASE_PATH)

export const getInspirationDeck = (deckId: number) =>
  apiClient.get<ApiResponse<InspirationDeckDetail>>(`${BASE_PATH}/${deckId}`)

export const createInspirationDeck = (data: InspirationDeckCreate) =>
  apiClient.post<ApiResponse<InspirationDeckDetail>>(BASE_PATH, data)

export const renameInspirationDeck = (deckId: number, name: string) =>
  apiClient.put<ApiResponse<InspirationDeckDetail>>(`${BASE_PATH}/${deckId}`, { name })

export const deleteInspirationDeck = (deckId: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(`${BASE_PATH}/${deckId}`)

export const duplicateInspirationDeck = (deckId: number) =>
  apiClient.post<ApiResponse<InspirationDeckDetail>>(`${BASE_PATH}/${deckId}/duplicate`)

export const addInspirationCard = (deckId: number, content: string) =>
  apiClient.post<ApiResponse<InspirationDeckCard>>(`${BASE_PATH}/${deckId}/cards`, { content })

export const updateInspirationCard = (deckId: number, cardId: number, content: string) =>
  apiClient.put<ApiResponse<InspirationDeckCard>>(`${BASE_PATH}/${deckId}/cards/${cardId}`, {
    content,
  })

export const deleteInspirationCard = (deckId: number, cardId: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(`${BASE_PATH}/${deckId}/cards/${cardId}`)

export const importInspirationCards = (deckId: number, file: File) => {
  const data = new FormData()
  data.append('file', file)
  return apiClient.post<ApiResponse<InspirationImportResult>>(
    `${BASE_PATH}/${deckId}/import`,
    data,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
}

export const assignInspirationDeck = (deckId: number, cohortId: number) =>
  apiClient.post<ApiResponse<null>>(`${BASE_PATH}/${deckId}/assign`, { cohortId })

export const unassignInspirationDeck = (deckId: number, cohortId: number) =>
  apiClient.post<ApiResponse<null>>(`${BASE_PATH}/${deckId}/unassign`, { cohortId })
