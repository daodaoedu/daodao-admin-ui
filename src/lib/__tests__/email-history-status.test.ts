import { describe, expect, it } from 'vitest'
import {
  EMAIL_HISTORY_STATUS_OPTIONS,
  emailHistoryStatusBadge,
  emailHistoryStatusLabel,
} from '../email-history-status'

// daodao#292 AC-02：發送紀錄把 skipped 顯示為「略過」，篩選可選「略過」
describe('emailHistoryStatusLabel', () => {
  it('skipped 顯示為「略過」', () => {
    expect(emailHistoryStatusLabel('skipped')).toBe('略過')
  })

  it('既有狀態維持原本的中文', () => {
    expect(emailHistoryStatusLabel('sent')).toBe('已發送')
    expect(emailHistoryStatusLabel('failed')).toBe('失敗')
    expect(emailHistoryStatusLabel('pending')).toBe('待發送')
  })

  it('未知狀態原樣顯示並用中性樣式', () => {
    expect(emailHistoryStatusLabel('bounced')).toBe('bounced')
    expect(emailHistoryStatusBadge('bounced')).toBe('bg-gray-100 text-gray-700')
  })
})

describe('EMAIL_HISTORY_STATUS_OPTIONS', () => {
  it('篩選選項包含「略過」，送出的值是 skipped', () => {
    expect(EMAIL_HISTORY_STATUS_OPTIONS).toContainEqual({ value: 'skipped', label: '略過' })
  })

  it('第一個選項是不篩選', () => {
    expect(EMAIL_HISTORY_STATUS_OPTIONS[0]).toEqual({ value: '', label: '全部狀態' })
  })
})
