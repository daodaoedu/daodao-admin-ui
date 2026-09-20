import { describe, expect, it } from 'vitest'
import { isBlockedInPreviewMode } from '@/api/client'

describe('isBlockedInPreviewMode', () => {
  it('預覽模式擋下所有會寫入後端的方法', () => {
    for (const method of ['post', 'put', 'patch', 'delete', 'POST', 'DELETE']) {
      expect(isBlockedInPreviewMode(true, method)).toBe(true)
    }
  })

  it('預覽模式仍允許唯讀請求', () => {
    for (const method of ['get', 'GET', 'head', 'options', undefined]) {
      expect(isBlockedInPreviewMode(true, method)).toBe(false)
    }
  })

  it('非預覽模式不攔截任何請求', () => {
    for (const method of ['get', 'post', 'put', 'delete']) {
      expect(isBlockedInPreviewMode(false, method)).toBe(false)
    }
  })
})
