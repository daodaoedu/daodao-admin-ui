import { describe, expect, it } from 'vitest'
import type { FeedbackItem } from '@/api/admin-support'
import {
  CATEGORY_LABEL,
  feedbackActionErrorMessage,
  feedbackListState,
  STATUS_LABEL,
  toFeedbackQuery,
  toFeedbackView,
  toReplyPayload,
  toStatusPayload,
} from '../feedback'

const apiItem = (overrides: Partial<FeedbackItem> = {}): FeedbackItem => ({
  id: 7,
  userId: 12,
  userName: '小島',
  content: '送出按鈕沒反應',
  category: 'bug',
  status: 'pending',
  createdAt: '2026-10-09T17:30:00.000Z',
  repliedAt: null,
  screenshots: [],
  replies: [],
  ...overrides,
})

describe('feedbackListState', () => {
  it('API 失敗時是 error，不能被當成空列表（daodao#140 AC-4b）', () => {
    expect(feedbackListState({ isLoading: false, isError: true, itemCount: 0 })).toBe('error')
  })

  it('載入中、無資料、有資料各自分開', () => {
    expect(feedbackListState({ isLoading: true, isError: false, itemCount: 0 })).toBe('loading')
    expect(feedbackListState({ isLoading: false, isError: false, itemCount: 0 })).toBe('empty')
    expect(feedbackListState({ isLoading: false, isError: false, itemCount: 3 })).toBe('list')
  })
})

describe('toFeedbackQuery', () => {
  it('篩選送 server 接受的英文值，「全部」不帶參數', () => {
    expect(toFeedbackQuery('all', 'all')).toEqual({ status: undefined, category: undefined })
    expect(toFeedbackQuery('pending', 'bug')).toEqual({ status: 'pending', category: 'bug' })
  })
})

describe('toFeedbackView', () => {
  it('帶出錯誤回報的截圖網址，後台展開時才能顯示圖片（daodao#166）', () => {
    const url = 'https://storage-dev.daodao.so/bug-reports/1791698535059-fd8570e1.png'
    expect(toFeedbackView(apiItem({ screenshots: [url] })).screenshots).toEqual([url])
  })

  it('舊版 server 回應沒有 screenshots 時給空陣列', () => {
    const { screenshots: _omit, ...legacy } = apiItem()
    expect(toFeedbackView(legacy as FeedbackItem).screenshots).toEqual([])
  })

  it('把 server 的英文分類／狀態轉成中文標籤，日期以台灣時間顯示', () => {
    const view = toFeedbackView(apiItem())
    expect(view.categoryLabel).toBe('Bug')
    expect(view.statusLabel).toBe('待處理')
    expect(view.date).toBe('2026-10-10')
    expect(view.userName).toBe('小島')
    expect(view.initial).toBe('小')
  })

  it('使用者沒有暱稱或已刪除時不會因 null 崩潰', () => {
    expect(toFeedbackView(apiItem({ userName: null })).userName).toBe('用戶 #12')
    expect(toFeedbackView(apiItem({ userName: '  ' })).userName).toBe('用戶 #12')
    const deleted = toFeedbackView(apiItem({ userId: null, userName: null }))
    expect(deleted.userName).toBe('已刪除的用戶')
    expect(deleted.initial).toBe('已')
  })

  it('未知的分類／狀態值原樣顯示', () => {
    const view = toFeedbackView(
      apiItem({
        category: 'spam' as FeedbackItem['category'],
        status: 'archived' as FeedbackItem['status'],
      }),
    )
    expect(view.categoryLabel).toBe('spam')
    expect(view.statusLabel).toBe('archived')
  })

  it('標籤涵蓋 server 允許的全部值', () => {
    expect(Object.keys(STATUS_LABEL).sort()).toEqual(['closed', 'pending', 'replied'])
    expect(Object.keys(CATEGORY_LABEL).sort()).toEqual(['bug', 'feature', 'other', 'question'])
  })

  it('帶出已送出的回覆，時間以台灣時間顯示（daodao#313 AC-01）', () => {
    const view = toFeedbackView(
      apiItem({
        status: 'replied',
        replies: [{ id: 3, content: '在右上角頭像選單', createdAt: '2026-10-21T05:00:00.000Z' }],
      }),
    )
    expect(view.replies).toEqual([{ id: 3, content: '在右上角頭像選單', time: '2026-10-21 13:00' }])
  })

  it('舊版 server 回應沒有 replies 時給空陣列', () => {
    const { replies: _omit, ...legacy } = apiItem()
    expect(toFeedbackView(legacy as FeedbackItem).replies).toEqual([])
  })
})

describe('toReplyPayload（daodao#313）', () => {
  it('送出的回覆內容去頭尾空白', () => {
    expect(toReplyPayload('  已修正，謝謝回報 \n')).toEqual({ content: '已修正，謝謝回報' })
  })

  it('空白或只有空白不送出', () => {
    expect(toReplyPayload('')).toBeNull()
    expect(toReplyPayload('  \n ')).toBeNull()
  })
})

describe('toStatusPayload（daodao#313）', () => {
  it('選的狀態和目前不同才送出', () => {
    expect(toStatusPayload('pending', 'closed')).toEqual({ status: 'closed' })
    expect(toStatusPayload('closed', 'closed')).toBeNull()
  })
})

describe('feedbackActionErrorMessage（daodao#313 AC-03）', () => {
  const apiError = (error: unknown) => ({ response: { data: { success: false, error } } })

  it('顯示 server 回的訊息', () => {
    expect(
      feedbackActionErrorMessage(
        apiError({ code: 'APP_ERROR', message: '找不到這則意見回饋' }),
        '回覆失敗',
      ),
    ).toBe('找不到這則意見回饋')
  })

  it('驗證錯誤附上欄位訊息', () => {
    expect(
      feedbackActionErrorMessage(
        apiError({
          code: 'VALIDATION_ERROR',
          message: '請求資料格式錯誤',
          details: { content: '回覆內容不可空白' },
        }),
        '回覆失敗',
      ),
    ).toBe('請求資料格式錯誤（回覆內容不可空白）')
  })

  it('斷線等非 API 錯誤用預設訊息', () => {
    expect(feedbackActionErrorMessage(new Error('Network Error'), '回覆失敗，請稍後再試')).toBe(
      '回覆失敗，請稍後再試',
    )
    expect(feedbackActionErrorMessage(apiError(undefined), '回覆失敗')).toBe('回覆失敗')
  })
})
