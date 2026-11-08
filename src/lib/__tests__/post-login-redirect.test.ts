import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearPostLoginPath,
  peekPostLoginPath,
  rememberPostLoginPath,
  safePostLoginPath,
} from '../post-login-redirect'

// daodao#451：通知信的 /admin/feedback?id= 連結，未登入時登入後要回到該則回報
describe('post-login redirect', () => {
  beforeEach(() => sessionStorage.clear())

  it('登入後回到原本要開的回饋頁，進到頁面後清掉', () => {
    rememberPostLoginPath('/feedback?id=12')
    expect(peekPostLoginPath()).toBe('/feedback?id=12')
    // render 重跑仍拿到同一個值
    expect(peekPostLoginPath()).toBe('/feedback?id=12')
    clearPostLoginPath()
    expect(peekPostLoginPath()).toBe('/dashboard')
  })

  it('沒有記錄時回 /dashboard', () => {
    expect(peekPostLoginPath()).toBe('/dashboard')
  })

  it.each([
    'https://evil.example/x',
    '//evil.example/x',
    '/\\evil.example',
    'javascript:alert(1)',
    '/login',
    '/auth/callback?x=1',
  ])('不接受外部網址或登入頁：%s', (value) => {
    expect(safePostLoginPath(value)).toBeNull()
    rememberPostLoginPath(value)
    expect(peekPostLoginPath()).toBe('/dashboard')
  })
})
