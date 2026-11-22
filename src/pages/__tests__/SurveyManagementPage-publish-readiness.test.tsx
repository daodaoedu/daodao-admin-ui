import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AdminSurveyDetail } from '@/api/types'

const api = vi.hoisted(() => ({
  listAdminSurveys: vi.fn(),
  getAdminSurvey: vi.fn(),
  createAdminSurvey: vi.fn(),
  updateAdminSurveyStatus: vi.fn(),
  listAdminSurveyImages: vi.fn(),
}))
vi.mock('@/api/admin-survey', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/admin-survey')>()),
  ...api,
}))

import { SurveyManagementPage } from '../SurveyManagementPage'

const detail: AdminSurveyDetail = {
  id: 7,
  external_id: 'new-draft',
  title: '新問卷',
  description: null,
  managed_version: 1,
  status: 'draft',
  is_public: false,
  is_anonymous: true,
  tags: [],
  view_count: 0,
  response_count: 0,
  max_responses: null,
  created_at: '2026-11-22T00:00:00Z',
  updated_at: '2026-11-22T00:00:00Z',
  creator: { id: 301, email: null, nickname: '管理員' },
  logo_url: null,
  cover_url: null,
  thank_you_message: '',
  questions: ['回答', '電子郵件'].map((question_text, position) => ({
    id: 71 + position,
    question_text,
    question_type: 'text',
    input_type: position === 0 ? 'text' : 'email',
    is_required: true,
    position,
    options: [],
  })),
}
beforeEach(() => {
  vi.clearAllMocks()
  api.listAdminSurveys.mockResolvedValue({
    data: { data: [], pagination: { total: 0, limit: 30, offset: 0, hasMore: false } },
  })
  api.listAdminSurveyImages.mockResolvedValue({ data: { data: [] } })
  api.createAdminSurvey.mockResolvedValue({ data: { data: { id: 7, external_id: 'new-draft' } } })
  api.updateAdminSurveyStatus.mockResolvedValue({ data: { data: { id: 7, status: 'active' } } })
})
afterEach(cleanup)

async function createWhileDetailLoads() {
  let resolve: (value: { data: { data: AdminSurveyDetail } }) => void = () => {}
  let reject: (error: Error) => void = () => {}
  api.getAdminSurvey.mockReturnValue(
    new Promise((ok, fail) => {
      resolve = ok
      reject = fail
    }),
  )
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={query}>
      <SurveyManagementPage />
    </QueryClientProvider>,
  )
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: '新增問卷' }))
  await user.type(screen.getByRole('textbox', { name: '問卷標題' }), '新問卷')
  for (const [type, text] of [
    ['文字', '回答'],
    ['Email', '電子郵件'],
  ]) {
    await user.click(screen.getByRole('button', { name: '新增題目' }))
    await user.click(screen.getByRole('button', { name: new RegExp(`^${type}`) }))
    await user.type(screen.getByRole('textbox', { name: '問題' }), text)
    await user.click(screen.getByRole('button', { name: '加入題目' }))
  }
  await user.click(screen.getByRole('button', { name: '設定' }))
  await user.click(screen.getByRole('button', { name: /參與者限定/ }))
  await user.keyboard('{Escape}')
  await user.click(screen.getByRole('button', { name: '儲存' }))
  await screen.findByText('載入中...', { exact: true })
  return { user, resolve, reject }
}

describe('saved draft header readiness', () => {
  it('keeps actions unavailable until fresh detail mounts, then publishes once with the saved id', async () => {
    const { user, resolve } = await createWhileDetailLoads()
    expect(screen.getByRole('button', { name: '發布' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '儲存' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '預覽' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '設定' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '返回問卷管理' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '發布' }))
    expect(api.updateAdminSurveyStatus).not.toHaveBeenCalled()
    await act(async () => resolve({ data: { data: detail } }))
    await screen.findByRole('textbox', { name: '問卷標題' })
    await waitFor(() => expect(screen.getByRole('button', { name: '發布' })).toBeEnabled())
    expect(screen.getByRole('button', { name: '預覽' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '發布' }))
    await waitFor(() =>
      expect(api.updateAdminSurveyStatus).toHaveBeenCalledExactlyOnceWith(7, 'active'),
    )
  })

  it('leaves form actions unavailable and return usable when the fresh detail read fails', async () => {
    const { reject } = await createWhileDetailLoads()
    await act(async () => reject(new Error('detail unavailable')))
    await screen.findByRole('alert')
    for (const name of ['發布', '儲存', '預覽', '設定'])
      expect(screen.getByRole('button', { name })).toBeDisabled()
    expect(screen.getByRole('button', { name: '返回問卷管理' })).toBeEnabled()
  })
})
