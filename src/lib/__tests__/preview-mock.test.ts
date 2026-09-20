import { describe, expect, it } from 'vitest'
import { isPreviewMockEnabled } from '@/config'

describe('isPreviewMockEnabled', () => {
  it('預設關閉：dev build 未設旗標時仍走真實登入與 API', () => {
    expect(isPreviewMockEnabled({ DEV: true })).toBe(false)
    expect(isPreviewMockEnabled({ DEV: true, VITE_USE_PREVIEW_MOCK: 'false' })).toBe(false)
    expect(isPreviewMockEnabled({ DEV: true, VITE_USE_PREVIEW_MOCK: '1' })).toBe(false)
  })

  it('僅在 dev build 且明確設為 true 時啟用', () => {
    expect(isPreviewMockEnabled({ DEV: true, VITE_USE_PREVIEW_MOCK: 'true' })).toBe(true)
  })

  it('production build 即使設了旗標也不會啟用', () => {
    expect(isPreviewMockEnabled({ DEV: false, VITE_USE_PREVIEW_MOCK: 'true' })).toBe(false)
  })
})
