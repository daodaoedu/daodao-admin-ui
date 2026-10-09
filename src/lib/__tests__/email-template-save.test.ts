import { describe, expect, it } from 'vitest'
import { buildEmailTemplateUpdate, templateSaveErrorMessage } from '../email-template-save'

// daodao#292 AC-01：存檔不可刪減模板原本登記的變數清單
const welcomeLetter = {
  registeredVariables: ['name', 'practiceUrl', 'unsubscribeUrl'],
  body: '<p>{{name}} 你好，歡迎來到島島！</p>',
  subject: '歡迎來到島島',
  preheader: '',
  dataSource: 'user' as const,
  isActive: true,
}

describe('buildEmailTemplateUpdate', () => {
  it('只改主旨存檔時，保留原本登記但 HTML 沒用到的變數', () => {
    const data = buildEmailTemplateUpdate({ ...welcomeLetter, subject: '歡迎加入島島 🎉' })
    expect(data.variables).toEqual(['name', 'practiceUrl', 'unsubscribeUrl'])
    expect(data.subject).toBe('歡迎加入島島 🎉')
  })

  it('HTML 新增的變數會補在既有清單之後，既有順序不變', () => {
    const data = buildEmailTemplateUpdate({
      ...welcomeLetter,
      body: '<p>{{name}}，你的實踐 {{practiceTitle}} 開始了</p>',
    })
    expect(data.variables).toEqual(['name', 'practiceUrl', 'unsubscribeUrl', 'practiceTitle'])
  })

  it('主旨與預覽文字裡的新變數也會補上，且不重複', () => {
    const data = buildEmailTemplateUpdate({
      ...welcomeLetter,
      subject: '{{name}}，歡迎！',
      preheader: '{{recipientName}} 的第一封信',
    })
    expect(data.variables).toEqual(['name', 'practiceUrl', 'unsubscribeUrl', 'recipientName'])
  })

  it('模板原本沒登記任何變數時，用偵測到的變數', () => {
    const data = buildEmailTemplateUpdate({
      ...welcomeLetter,
      registeredVariables: [],
    })
    expect(data.variables).toEqual(['name'])
  })

  it('預覽文字留空時不送 preheader', () => {
    expect(buildEmailTemplateUpdate(welcomeLetter).preheader).toBeUndefined()
  })
})

describe('templateSaveErrorMessage', () => {
  it('server 驗證錯誤附上欄位名稱與原因', () => {
    const error = {
      response: {
        data: {
          error: {
            message: '請求資料格式錯誤',
            details: { subject: 'Too small: expected string to have >=1 characters' },
          },
        },
      },
    }
    expect(templateSaveErrorMessage(error)).toBe(
      '請求資料格式錯誤（主旨：Too small: expected string to have >=1 characters）',
    )
  })

  it('沒有 details 時只顯示 server message', () => {
    expect(
      templateSaveErrorMessage({ response: { data: { error: { message: '需要管理員權限' } } } }),
    ).toBe('需要管理員權限')
  })

  it('非 API 錯誤（例如斷線）用預設訊息', () => {
    expect(templateSaveErrorMessage(new Error('Network Error'))).toBe('儲存失敗，請稍後再試')
  })
})
