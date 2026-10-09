import type { EmailTemplateUpdate } from '@/api/types'
import { detectVariables } from '@/lib/email-preview'

export interface EmailTemplateSaveInput {
  /** 模板目前登記在 DB 的變數清單 */
  registeredVariables: readonly string[]
  body: string
  subject: string
  preheader: string
  dataSource: 'user' | 'practice' | 'event' | 'none'
  isActive: boolean
}

/**
 * 模板的變數清單：保留原本登記的變數（順序不變），再補上主旨／預覽文字／HTML 新偵測到的變數。
 *
 * 登記清單是後台告訴編輯者「這封信可用哪些變數」的依據，HTML 沒用到不代表變數不存在，
 * 所以存檔只增不減（daodao#292 AC-01）。
 */
export function mergeTemplateVariables(
  registeredVariables: readonly string[],
  sources: readonly string[],
): string[] {
  const detected = sources.flatMap((source) => detectVariables(source))
  return [...new Set([...registeredVariables, ...detected])]
}

export function buildEmailTemplateUpdate(input: EmailTemplateSaveInput): EmailTemplateUpdate {
  return {
    body: input.body,
    subject: input.subject,
    preheader: input.preheader || undefined,
    variables: mergeTemplateVariables(input.registeredVariables, [
      input.subject,
      input.preheader,
      input.body,
    ]),
    dataSource: input.dataSource,
    isActive: input.isActive,
  }
}

const FIELD_LABEL: Record<string, string> = {
  subject: '主旨',
  preheader: '預覽文字',
  body: 'HTML 內容',
  variables: '變數清單',
  dataSource: '資料來源',
}

/**
 * 存檔失敗時給編輯者看的訊息：server 的 message 加上欄位級 details（VALIDATION_ERROR 時才有）。
 * 不是 API 錯誤（斷線等）時回 fallback。
 */
export function templateSaveErrorMessage(
  error: unknown,
  fallback = '儲存失敗，請稍後再試',
): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback
  const apiError = (
    error as {
      response?: { data?: { error?: { message?: string; details?: Record<string, unknown> } } }
    }
  ).response?.data?.error
  if (!apiError?.message) return fallback
  const details = Object.entries(apiError.details ?? {})
    .filter(([, detail]) => typeof detail === 'string')
    .map(([field, detail]) => `${FIELD_LABEL[field] ?? field}：${detail}`)
  return details.length > 0 ? `${apiError.message}（${details.join('；')}）` : apiError.message
}
