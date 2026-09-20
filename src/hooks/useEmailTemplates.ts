import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplate,
  listEmailTemplates,
  updateEmailTemplate,
} from '@/api/admin-system'
import type { EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate } from '@/api/types'
import { USE_PREVIEW_MOCK } from '@/config'

const QUERY_KEY = ['email-templates']

const CURRENT_TEMPLATE_CATALOG = [
  ['歡迎信（預設版）', '歡迎來到島島阿學', ['name', 'practiceUrl', 'unsubscribeUrl']],
  ['歡迎信（社群媒體來源）', '歡迎來到島島阿學', ['name', 'practiceUrl', 'unsubscribeUrl']],
  ['歡迎信（社群推薦來源）', '歡迎來到島島阿學', ['name', 'practiceUrl', 'unsubscribeUrl']],
  ['信箱驗證', '請驗證你的島島阿學帳號', ['name', 'verifyLink']],
  ['密碼重設', '重設你的島島阿學密碼', ['name', 'resetLink']],
  [
    '馬拉松報名確認',
    '你已成功報名 {{marathonTitle}}',
    ['name', 'marathonTitle', 'marathonDate', 'marathonDescription'],
  ],
  ['許願採納通知', '你的許願已被採納', ['recipientName', 'itemTitle', 'url', 'unsubscribeUrl']],
  [
    '共鳴通知',
    '「{{practiceTitle}}」獲得了共鳴！',
    ['recipientName', 'practiceTitle', 'reactionCount', 'practiceUrl'],
  ],
  ['4小時通知摘要', '【島島阿學】你有新的通知', ['recipientName', 'notifications']],
  ['每週通知摘要', '【島島阿學】本週學習回顧', ['recipientName', 'weeklyStats']],
  ['PE01 實踐建立確認', '開啟你的小而美學習生活提案', ['name', 'practiceTitle', 'practiceUrl']],
  [
    'PE02 第一次打卡鼓勵',
    '你在【{{practiceTitle}}】的第一次打卡紀錄 ✨',
    ['name', 'practiceTitle', 'checkinNote', 'practiceUrl'],
  ],
  [
    'PE03 每週回顧（有筆記）',
    '【{{practiceTitle}}】每週回顧：看見生活中的成長微光 ✨',
    ['practiceTitle', 'checkinCount', 'notes', 'practiceUrl'],
  ],
  [
    'PE04 每週回顧（無筆記）',
    '【{{practiceTitle}}】每週回顧：看見生活中的成長微光 ✨',
    ['practiceTitle', 'checkinCount', 'practiceUrl'],
  ],
  ['PE05 每週回顧（未打卡）', '看不見的成長，也在悄悄發生', ['practiceTitle', 'practiceUrl']],
  ['PE06 實踐沉睡喚醒', '關於【{{practiceTitle}}】的下一步 🛤️', ['practiceTitle', 'practiceUrl']],
  [
    'PE07 最終總結（有打卡）',
    '這是你的【{{practiceTitle}}】成長足跡',
    ['practiceTitle', 'totalCheckins', 'practiceUrl'],
  ],
  ['PE08 最終總結（無打卡）', '關於【{{practiceTitle}}】', ['practiceTitle', 'practiceUrl']],
  ['入門任務 A', '【島島阿學】完成入門任務 A', ['name']],
  ['入門任務 B', '【島島阿學】完成入門任務 B', ['name']],
  ['入門任務 C', '【島島阿學】完成入門任務 C', ['name']],
  ['入門任務 D', '【島島阿學】完成入門任務 D', ['name']],
  ['入門任務 E', '【島島阿學】完成入門任務 E', ['name']],
] as const

export const AVAILABLE_EMAIL_VARIABLES = [
  ...new Set(CURRENT_TEMPLATE_CATALOG.flatMap(([, , variables]) => variables)),
]

const WELCOME_EMAIL_BODY = `
  <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;line-height:150%">Hello {{name}}，</h2>
  <p style="margin:0 0 20px;font-size:16px;line-height:180%">歡迎來到島島阿學！</p>
  <p style="margin:0 0 28px;font-size:16px;line-height:180%">想學新東西但不確定有沒有興趣？一個人學習覺得孤單？<br>我們以科技與社群打造島島阿學，在這裡，每個人都是知識的創造者與學習推動者！</p>
  <p style="margin:8px 0 28px;text-align:center"><a href="{{practiceUrl}}" style="display:inline-block;border-radius:6px;background:#F28C28;padding:14px 24px;color:#fff;font-size:16px;font-weight:700;text-decoration:none">進入島島阿學開始學習新生活</a></p>
  <p style="margin:0;color:#6b7280;font-size:13px;line-height:180%">若不想再收到信件，可在 <a href="{{unsubscribeUrl}}">這裡取消訂閱</a>。</p>
`

function previewBody(name: string, variables: readonly string[]) {
  if (name.startsWith('歡迎信')) return WELCOME_EMAIL_BODY

  const greetingVariable = variables.includes('name')
    ? '{{name}}'
    : variables.includes('recipientName')
      ? '{{recipientName}}'
      : ''
  const variableSummary = variables.map((variable) => `{{${variable}}}`).join('、')
  return `<h2>${name}</h2><p>${greetingVariable ? `Hello ${greetingVariable}，` : ''}</p><p>這是島島阿學的「${name}」通知內容。</p><p>相關資訊：${variableSummary}</p>`
}

let previewEmailTemplates: EmailTemplate[] = CURRENT_TEMPLATE_CATALOG.map(
  ([name, subject, variables], index) => ({
    id: index + 1,
    name,
    slug: null,
    subject,
    preheader: null,
    body: previewBody(name, variables),
    variables: [...variables],
    dataSource: 'none',
    isActive: true,
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-16T09:00:00Z',
  }),
)

export function useEmailTemplates() {
  return useQuery({
    queryKey: [...QUERY_KEY, USE_PREVIEW_MOCK ? 'preview' : 'api'],
    queryFn: () =>
      USE_PREVIEW_MOCK
        ? Promise.resolve(previewEmailTemplates)
        : listEmailTemplates().then((r) => r.data.data),
  })
}

export function useCreateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EmailTemplateCreate) => {
      if (!USE_PREVIEW_MOCK) return createEmailTemplate(data)

      const now = new Date().toISOString()
      const created: EmailTemplate = {
        id: Math.max(0, ...previewEmailTemplates.map((template) => template.id)) + 1,
        name: data.name,
        slug: data.slug ?? null,
        subject: data.subject,
        preheader: data.preheader ?? null,
        body: data.body,
        variables: data.variables ?? [],
        dataSource: data.dataSource ?? 'none',
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      }
      previewEmailTemplates = [...previewEmailTemplates, created]
      return Promise.resolve({ data: { data: created } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmailTemplateUpdate }) => {
      if (!USE_PREVIEW_MOCK) return updateEmailTemplate(id, data)

      const index = previewEmailTemplates.findIndex((template) => template.id === id)
      if (index === -1) throw new Error('Email template not found')
      const updated = {
        ...previewEmailTemplates[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      previewEmailTemplates = previewEmailTemplates.map((template) =>
        template.id === id ? updated : template,
      )
      return Promise.resolve({ data: { data: updated } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => {
      if (!USE_PREVIEW_MOCK) return deleteEmailTemplate(id)

      previewEmailTemplates = previewEmailTemplates.filter((template) => template.id !== id)
      return Promise.resolve({ data: { data: { deleted: true, id } } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useEmailTemplate(id: number | null) {
  return useQuery({
    queryKey: ['email-template', id, USE_PREVIEW_MOCK ? 'preview' : 'api'],
    queryFn: () => {
      if (id === null) throw new Error('Email template id is required')
      if (USE_PREVIEW_MOCK) {
        const template = previewEmailTemplates.find((item) => item.id === id)
        if (!template) throw new Error('Email template not found')
        return Promise.resolve(template)
      }
      return getEmailTemplate(id).then((r) => r.data.data)
    },
    enabled: id !== null,
  })
}
