import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AdminSurveyCreatePayload, AdminSurveyDetail } from '@/api/types'

const api = vi.hoisted(() => ({
  listAdminSurveys: vi.fn(),
  getAdminSurvey: vi.fn(),
  createAdminSurvey: vi.fn(),
  updateAdminSurvey: vi.fn(),
  deleteAdminSurvey: vi.fn(),
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
function renderSurvey(survey: AdminSurveyDetail, client?: QueryClient) {
  api.listAdminSurveys.mockResolvedValue({
    data: { data: [survey], pagination: { total: 1, limit: 30, offset: 0, hasMore: false } },
  })
  api.getAdminSurvey.mockResolvedValue({ data: { data: survey } })
  const queryClient =
    client ??
    new QueryClient({
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

it('reopens saved detail without rendering the previous cached title or questions', async () => {
  const user = renderSurvey(base)
  await user.click(await screen.findByRole('button', { name: '編輯問卷' }))
  const title = await screen.findByRole('textbox', { name: '問卷標題' })
  await user.clear(title)
  await user.type(title, '已保存新標題')
  api.updateAdminSurvey.mockResolvedValue({ data: { data: { id: base.id, updated: true } } })
  const saved = {
    ...base,
    title: '已保存新標題',
    questions: [{ ...base.questions[0], question_text: '最新題目' }],
  }
  api.getAdminSurvey.mockResolvedValue({ data: { data: saved } })
  await user.click(screen.getByRole('button', { name: '儲存' }))
  await waitFor(() => expect(screen.getByRole('button', { name: '儲存' })).toBeDisabled())
  await waitFor(() => expect(screen.getByRole('button', { name: '返回問卷管理' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: '返回問卷管理' }))
  let finishFreshRead: (value: { data: { data: AdminSurveyDetail } }) => void = () => {}
  api.getAdminSurvey.mockReturnValueOnce(
    new Promise((resolve) => {
      finishFreshRead = resolve
    }),
  )
  await user.click(await screen.findByRole('button', { name: '預覽問卷' }))
  expect(screen.getByRole('button', { name: '預覽問卷' })).toBeVisible()
  expect(screen.queryByRole('textbox', { name: '預覽題目' })).not.toBeInTheDocument()
  await act(async () => finishFreshRead({ data: { data: saved } }))
  expect(await screen.findByRole('textbox', { name: '最新題目' })).toBeVisible()
  expect(screen.getByRole('heading', { name: '已保存新標題' })).toBeVisible()
  expect(screen.queryByRole('textbox', { name: '預覽題目' })).not.toBeInTheDocument()
})

it('keeps the list visible when the fresh authorized detail cannot be loaded', async () => {
  const user = renderSurvey(base)
  api.getAdminSurvey.mockRejectedValue(new Error('offline'))
  const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
  await user.click(await screen.findByRole('button', { name: '預覽問卷' }))
  await waitFor(() => expect(alert).toHaveBeenCalled())
  expect(screen.getByRole('button', { name: '預覽問卷' })).toBeVisible()
  expect(screen.queryByRole('button', { name: '返回問卷管理' })).not.toBeInTheDocument()
})

it('preserves unsaved create input after an earlier list detail request resolves', async () => {
  const user = renderSurvey(base)
  let finish: (value: { data: { data: AdminSurveyDetail } }) => void = () => {}
  api.getAdminSurvey.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  await user.click(await screen.findByRole('button', { name: '預覽問卷' }))
  await user.click(screen.getByRole('button', { name: '新增問卷' }))
  const title = await screen.findByRole('textbox', { name: '問卷標題' })
  await user.type(title, '不可丟失的新草稿')
  await act(async () => finish({ data: { data: base } }))
  expect(title).toBeVisible()
  expect(title).toHaveValue('不可丟失的新草稿')
  expect(screen.getByRole('button', { name: '儲存' })).toBeEnabled()
})

it('supersedes a pre-save in-flight detail refetch when reopening the saved survey', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const user = renderSurvey(base, client)
  await user.click(await screen.findByRole('button', { name: '編輯問卷' }))
  const title = await screen.findByRole('textbox', { name: '問卷標題' })
  let finishOldRead: (value: AdminSurveyDetail) => void = () => {}
  const oldRead = client
    .fetchQuery({
      queryKey: ['admin-survey-detail', base.id],
      queryFn: () =>
        new Promise<AdminSurveyDetail>((resolve) => {
          finishOldRead = resolve
        }),
      staleTime: 0,
    })
    .catch(() => {})
  await user.clear(title)
  await user.type(title, '真正已保存標題')
  api.updateAdminSurvey.mockResolvedValue({ data: { data: { id: base.id, updated: true } } })
  api.getAdminSurvey.mockResolvedValue({ data: { data: { ...base, title: '真正已保存標題' } } })
  await user.click(screen.getByRole('button', { name: '儲存' }))
  await waitFor(() => expect(screen.getByRole('button', { name: '返回問卷管理' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: '返回問卷管理' }))
  await user.click(await screen.findByRole('button', { name: '預覽問卷' }))
  await act(async () => finishOldRead(base))
  await oldRead
  expect(await screen.findByRole('heading', { name: '真正已保存標題' })).toBeVisible()
})

it('does not open a deleted survey when its earlier detail request completes', async () => {
  const user = renderSurvey(base)
  let finish: (value: { data: { data: AdminSurveyDetail } }) => void = () => {}
  api.getAdminSurvey.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  api.deleteAdminSurvey.mockResolvedValue({ data: { data: { deleted: true } } })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  await user.click(await screen.findByRole('button', { name: '預覽問卷' }))
  api.listAdminSurveys.mockResolvedValue({
    data: { data: [], pagination: { total: 0, limit: 30, offset: 0, hasMore: false } },
  })
  await user.click(screen.getByRole('button', { name: '刪除問卷' }))
  await waitFor(() => expect(api.deleteAdminSurvey).toHaveBeenCalledWith(base.id))
  await act(async () => finish({ data: { data: base } }))
  expect(screen.queryByRole('button', { name: '返回問卷管理' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '新增問卷' })).toBeVisible()
})
