import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EmailTemplate } from '@/api/types'

const api = vi.hoisted(() => ({
  getEmailTemplate: vi.fn(),
  updateEmailTemplate: vi.fn(),
}))

vi.mock('@/api/admin-system', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/admin-system')>()),
  getEmailTemplate: api.getEmailTemplate,
  updateEmailTemplate: api.updateEmailTemplate,
}))

vi.mock('@/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/config')>()),
  USE_PREVIEW_MOCK: false,
}))

// CodeMirror 在 jsdom 量不到版面，換成 textarea；本測試只驗存檔回饋
vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange }: { value: string; onChange?: (v: string) => void }) => (
    <textarea aria-label="HTML 內容" value={value} onChange={(e) => onChange?.(e.target.value)} />
  ),
}))

import EmailTemplateEditorPage from '../EmailTemplateEditorPage'

const PE01: EmailTemplate = {
  id: 9,
  name: 'PE01 實踐建立確認',
  slug: 'practice-created',
  subject: '開啟你的小而美學習生活提案',
  preheader: '恭喜開啟',
  body: '<p>Hello {{userName}}</p>',
  variables: ['userName'],
  dataSource: 'practice',
  isActive: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
}

function renderEditor() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/email-templates/9/edit']}>
        <Routes>
          <Route path="/email-templates/:id/edit" element={<EmailTemplateEditorPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function editSubjectAndSave(subject: string) {
  const input = await screen.findByDisplayValue(PE01.subject)
  fireEvent.change(input, { target: { value: subject } })
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
}

describe('EmailTemplateEditorPage 存檔回饋（daodao#236 PM 驗收步驟 1）', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    api.getEmailTemplate.mockResolvedValue({ data: { data: PE01 } })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('儲存成功後顯示「已儲存」，且不會幾秒後自己消失', async () => {
    api.updateEmailTemplate.mockResolvedValue({ data: { data: PE01 } })
    renderEditor()
    await editSubjectAndSave(`${PE01.subject}【驗收】`)

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('已儲存，最多 5 分鐘後生效')

    // PM 看到按鈕轉圈恢復後才找提示；原本 2 秒就收掉，這裡推進 10 秒仍要在
    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByRole('status')).toHaveTextContent('已儲存，最多 5 分鐘後生效')
  })

  it('儲存後再編輯，「已儲存」提示收起，避免誤以為新內容已存', async () => {
    api.updateEmailTemplate.mockResolvedValue({ data: { data: PE01 } })
    renderEditor()
    await editSubjectAndSave(`${PE01.subject}【驗收】`)
    await screen.findByRole('status')

    fireEvent.change(screen.getByDisplayValue(`${PE01.subject}【驗收】`), {
      target: { value: PE01.subject },
    })
    expect(screen.queryByText(/已儲存/)).not.toBeInTheDocument()
  })

  it('儲存失敗時顯示錯誤訊息，不顯示「已儲存」', async () => {
    api.updateEmailTemplate.mockRejectedValue({
      response: { data: { error: { message: '模板主旨不可為空' } } },
    })
    renderEditor()
    await editSubjectAndSave(`${PE01.subject}【驗收】`)

    expect(await screen.findByRole('alert')).toHaveTextContent('模板主旨不可為空')
    expect(screen.queryByText(/已儲存/)).not.toBeInTheDocument()
  })

  it('沒有 slug 的模板成功儲存時顯示「已儲存」', async () => {
    api.getEmailTemplate.mockResolvedValue({ data: { data: { ...PE01, slug: null } } })
    api.updateEmailTemplate.mockResolvedValue({ data: { data: { ...PE01, slug: null } } })
    renderEditor()
    await editSubjectAndSave('新主旨')

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^已儲存$/))
  })
})
