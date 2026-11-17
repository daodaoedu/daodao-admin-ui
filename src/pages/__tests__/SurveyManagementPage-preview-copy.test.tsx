import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AdminSurveyCreatePayload, AdminSurveyDetail } from '@/api/types'

const api = vi.hoisted(() => ({
  listAdminSurveys: vi.fn(),
  getAdminSurvey: vi.fn(),
  createAdminSurvey: vi.fn(),
  listAdminSurveyImages: vi.fn(),
}))
vi.mock('@/api/admin-survey', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/admin-survey')>()),
  ...api,
}))

import { SurveyManagementPage } from '../SurveyManagementPage'

const base: AdminSurveyDetail = {
  id: 7,
  external_id: 'preview-only',
  title: '管理員預覽問卷',
  description: '預覽描述',
  status: 'draft',
  managed_version: 1,
  is_public: true,
  is_anonymous: true,
  tags: [],
  view_count: 0,
  response_count: 0,
  created_at: '2026-11-17T00:00:00Z',
  updated_at: '2026-11-17T00:00:00Z',
  creator: { id: 1, email: null, nickname: '管理員' },
  logo_url: null,
  cover_url: null,
  thank_you_message: '',
  max_responses: null,
  questions: [
    {
      id: 71,
      question_text: '預覽題目',
      question_type: 'text',
      input_type: 'text',
      is_required: false,
      position: 0,
      options: [],
    },
  ],
}
function renderSurvey(survey: AdminSurveyDetail) {
  api.listAdminSurveys.mockResolvedValue({
    data: { data: [survey], pagination: { total: 1, limit: 30, offset: 0, hasMore: false } },
  })
  api.getAdminSurvey.mockResolvedValue({ data: { data: survey } })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <SurveyManagementPage />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}
beforeEach(() => {
  vi.clearAllMocks()
  api.listAdminSurveyImages.mockResolvedValue({ data: { data: [] } })
  api.createAdminSurvey.mockResolvedValue({ data: { data: { id: 8, external_id: 'copy' } } })
  vi.spyOn(window, 'open').mockImplementation(() => null)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('managed survey list preview', () => {
  it.each([
    { name: 'draft', status: 'draft', response_count: 0, max_responses: null },
    { name: 'closed', status: 'closed', response_count: 0, max_responses: null },
    { name: 'archived', status: 'archived', response_count: 0, max_responses: null },
    { name: 'full', status: 'active', response_count: 1, max_responses: 1 },
  ] as const)('opens authorized local preview for $name without a public window', async (state) => {
    const user = renderSurvey({
      ...base,
      status: state.status,
      response_count: state.response_count,
      max_responses: state.max_responses,
    })
    await user.click(await screen.findByRole('button', { name: '預覽問卷' }))
    expect(window.open).not.toHaveBeenCalled()
    expect(await screen.findByRole('textbox', { name: '預覽題目' })).toBeVisible()
    expect(screen.getByRole('button', { name: '預覽', pressed: true })).toBeVisible()
    expect(api.createAdminSurvey).not.toHaveBeenCalled()
  })
})

describe('survey title copied within server UTF16 limit', () => {
  it.each([
    { name: 'ASCII200', title: 'A'.repeat(200), expected: `${'A'.repeat(196)}（副本）` },
    { name: 'emoji200units', title: '😀'.repeat(100), expected: `${'😀'.repeat(98)}（副本）` },
    {
      name: 'surrogate boundary',
      title: `${'A'.repeat(195)}😀BBB`,
      expected: `${'A'.repeat(195)}（副本）`,
    },
  ])('copies $name without truncating a surrogate pair or changing the source', async ({
    title,
    expected,
  }) => {
    const source = { ...base, title }
    const user = renderSurvey(source)
    await user.click(await screen.findByRole('button', { name: '複製問卷' }))
    await waitFor(() => expect(api.createAdminSurvey).toHaveBeenCalledOnce())
    const payload: AdminSurveyCreatePayload = api.createAdminSurvey.mock.calls[0][0]
    expect(payload.title).toBe(expected)
    expect(payload.title.length).toBeLessThanOrEqual(200)
    expect(Array.from(payload.title).some((char) => /^[\uD800-\uDFFF]$/.test(char))).toBe(false)
    expect(source.title).toBe(title)
  })
})
