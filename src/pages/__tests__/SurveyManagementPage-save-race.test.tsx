import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AdminSurveyDetail } from '@/api/types'

const api = vi.hoisted(() => ({
  listAdminSurveys: vi.fn(),
  getAdminSurvey: vi.fn(),
  updateAdminSurvey: vi.fn(),
  createAdminSurvey: vi.fn(),
  listAdminSurveyImages: vi.fn(),
  uploadAdminSurveyImage: vi.fn(),
}))
vi.mock('@/api/admin-survey', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/admin-survey')>()),
  ...api,
}))

import { SurveyManagementPage } from '../SurveyManagementPage'

const survey: AdminSurveyDetail = {
  id: 1,
  external_id: 'survey-race',
  title: '原問卷',
  description: '原描述',
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
      id: 10,
      question_text: '原問題',
      question_type: 'text',
      is_required: false,
      position: 0,
      input_type: 'text',
      options: [],
    },
  ],
}
function pendingResponse<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('Response is not ready')
  }
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
async function openEditor() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={queryClient}>
      <SurveyManagementPage />
    </QueryClientProvider>,
  )
  await user.click(await screen.findByRole('button', { name: '編輯問卷' }))
  await screen.findByRole('textbox', { name: '問卷標題' })
  return user
}
beforeEach(() => {
  vi.clearAllMocks()
  api.listAdminSurveys.mockResolvedValue({
    data: { data: [survey], pagination: { total: 1, limit: 30, offset: 0, hasMore: false } },
  })
  api.getAdminSurvey.mockResolvedValue({ data: { data: survey } })
  api.listAdminSurveyImages.mockResolvedValue({
    data: { data: [{ id: 11, url: 'https://example.com/library.png' }] },
  })
})
afterEach(cleanup)

describe('survey save and upload mutual exclusion', () => {
  it('keeps the visible saved value equal to the submitted value until save completes, then allows another edit', async () => {
    const pending = pendingResponse<{ data: { data: { id: number; updated: boolean } } }>()
    api.updateAdminSurvey.mockReturnValue(pending.promise)
    const user = await openEditor()
    const title = screen.getByRole('textbox', { name: '問卷標題' })
    const description = screen.getByRole('textbox', { name: '問卷描述（選填）' })
    await user.clear(title)
    await user.type(title, '版本 A')
    await user.clear(description)
    await user.type(description, '描述 A')
    await user.click(screen.getByRole('button', { name: '儲存' }))
    await waitFor(() => expect(api.updateAdminSurvey).toHaveBeenCalledOnce())
    expect(title).toBeDisabled()
    expect(description).toBeDisabled()
    expect(screen.getByRole('button', { name: '返回問卷管理' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '設定' })).toBeDisabled()
    await user.type(title, ' B')
    await user.type(description, ' B')
    expect(title).toHaveValue('版本 A')
    expect(description).toHaveValue('描述 A')
    await act(async () => pending.resolve({ data: { data: { id: 1, updated: true } } }))
    await waitFor(() => expect(title).toBeEnabled())
    expect(screen.getByRole('button', { name: '儲存' })).toBeDisabled()
    await user.type(title, ' B')
    expect(screen.getByRole('button', { name: '儲存' })).toBeEnabled()
    expect(api.updateAdminSurvey.mock.calls[0][1]).toMatchObject({
      title: '版本 A',
      description: '描述 A',
    })
  })

  it('waits for an image upload before allowing metadata to save its URL', async () => {
    const upload = pendingResponse<{ data: { data: { id: number; url: string } } }>()
    api.uploadAdminSurveyImage.mockReturnValue(upload.promise)
    api.updateAdminSurvey.mockResolvedValue({ data: { data: { id: 1, updated: true } } })
    const user = await openEditor()
    await user.click(screen.getByRole('button', { name: '問卷圖片' }))
    const title = screen.getByRole('textbox', { name: '問卷標題' })
    await user.type(title, ' A')
    const file = new File(['image'], 'logo.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('上傳Logo', { exact: true }), file)
    await waitFor(() => expect(api.uploadAdminSurveyImage).toHaveBeenCalledOnce())
    expect(title).toBeDisabled()
    const busySave = screen.getByRole('button', { name: /儲存|處理中/ })
    expect(busySave).toBeDisabled()
    fireEvent.click(busySave)
    expect(api.updateAdminSurvey).not.toHaveBeenCalled()
    await act(async () =>
      upload.resolve({ data: { data: { id: 12, url: 'https://example.com/uploaded.png' } } }),
    )
    await waitFor(() => expect(title).toBeEnabled())
    await user.click(screen.getByRole('button', { name: '儲存' }))
    await waitFor(() => expect(api.updateAdminSurvey).toHaveBeenCalledOnce())
    expect(api.updateAdminSurvey.mock.calls[0][1]).toMatchObject({
      logo_url: 'https://example.com/uploaded.png',
    })
  })

  it.each([
    '問卷設定',
    '題目設定',
    '圖片庫',
  ])('locks controls in an already open %s portal during a save', async (portal) => {
    const pending = pendingResponse<{ data: { data: { id: number; updated: boolean } } }>()
    api.updateAdminSurvey.mockReturnValue(pending.promise)
    const user = await openEditor()
    await user.type(screen.getByRole('textbox', { name: '問卷標題' }), ' A')
    const save = screen.getByRole('button', { name: '儲存' })
    if (portal === '問卷設定') await user.click(screen.getByRole('button', { name: '設定' }))
    if (portal === '題目設定') await user.click(screen.getByRole('button', { name: '編輯第 1 題' }))
    if (portal === '圖片庫') {
      await user.click(screen.getByRole('button', { name: '問卷圖片' }))
      await user.click(screen.getByRole('button', { name: '從圖片庫選擇Logo' }))
    }
    // A pending transition must also cover a portal already present when submission starts.
    fireEvent.click(save)
    await waitFor(() => expect(api.updateAdminSurvey).toHaveBeenCalledOnce())
    if (portal === '問卷設定')
      expect(screen.getByRole('button', { name: /參與者限定/ })).toBeDisabled()
    if (portal === '題目設定') expect(screen.getByRole('textbox', { name: '問題' })).toBeDisabled()
    if (portal === '圖片庫') expect(screen.getByRole('button', { name: '圖片 #11' })).toBeDisabled()
    await act(async () => pending.resolve({ data: { data: { id: 1, updated: true } } }))
  })
})

describe('survey duplicate and metadata privacy settings', () => {
  it('makes a new public legacy duplicate anonymous before it can receive responses', async () => {
    api.getAdminSurvey.mockResolvedValue({
      data: { data: { ...survey, managed_version: null, is_anonymous: false } },
    })
    api.createAdminSurvey.mockResolvedValue({ data: { data: { id: 2 } } })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={queryClient}>
        <SurveyManagementPage />
      </QueryClientProvider>,
    )
    await user.click(await screen.findByRole('button', { name: '複製問卷' }))
    await waitFor(() => expect(api.createAdminSurvey).toHaveBeenCalledOnce())
    expect(api.createAdminSurvey.mock.calls[0][0]).toMatchObject({
      managed_version: 1,
      is_public: true,
      is_anonymous: true,
    })
  })

  it('preserves the stored anonymity setting when changing metadata after a response', async () => {
    api.getAdminSurvey.mockResolvedValue({
      data: { data: { ...survey, is_anonymous: false, response_count: 1, structure_locked: true } },
    })
    api.updateAdminSurvey.mockResolvedValue({ data: { data: { id: 1, updated: true } } })
    const user = await openEditor()
    await user.type(screen.getByRole('textbox', { name: '問卷描述（選填）' }), ' 新描述')
    await user.click(screen.getByRole('button', { name: '儲存' }))
    await waitFor(() => expect(api.updateAdminSurvey).toHaveBeenCalledOnce())
    expect(api.updateAdminSurvey.mock.calls[0][1]).toMatchObject({
      is_public: true,
      is_anonymous: false,
      description: '原描述 新描述',
    })
    expect(api.updateAdminSurvey.mock.calls[0][1]).not.toHaveProperty('questions')
  })
})

it('explains why a legacy one-option choice cannot be duplicated without modifying its question', async () => {
  api.getAdminSurvey.mockResolvedValue({
    data: {
      data: {
        ...survey,
        managed_version: null,
        questions: [
          {
            ...survey.questions[0],
            question_type: 'single_choice',
            options: [{ id: 1, option_text: '唯一選項', position: 0 }],
          },
        ],
      },
    },
  })
  const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={queryClient}>
      <SurveyManagementPage />
    </QueryClientProvider>,
  )
  await user.click(await screen.findByRole('button', { name: '複製問卷' }))
  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('第 1 題的選項不足兩個')),
  )
  expect(api.createAdminSurvey).not.toHaveBeenCalled()
  alert.mockRestore()
})
