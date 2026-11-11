import { afterEach, describe, expect, it, vi } from 'vitest'
import { APP_BASE_URL, getPracticePublicUrl, resolveAppBaseUrl, SURVEY_PUBLIC_BASE } from '@/config'

const PROD = 'https://app.daodao.so'
const DEV = 'https://app-dev.daodao.so'

describe('resolveAppBaseUrl', () => {
  // #525：VITE_SURVEY_PUBLIC_BASE 是 build-time 變數，部署的 image 沒帶 → admin-dev 連結開到 prod
  it('admin-dev 主機沒有 build-time 設定時指向 app-dev', () => {
    expect(resolveAppBaseUrl(undefined, 'admin-dev.daodao.so')).toBe(DEV)
  })

  it('admin-dev 主機即使 build 帶到 prod 設定，仍指向 app-dev', () => {
    expect(resolveAppBaseUrl('https://app.daodao.so/survey/r', 'admin-dev.daodao.so')).toBe(DEV)
  })

  it('正式 admin 主機指向 app', () => {
    expect(resolveAppBaseUrl(undefined, 'admin.daodao.so')).toBe(PROD)
    expect(resolveAppBaseUrl('https://app-dev.daodao.so/survey/r', 'admin.daodao.so')).toBe(PROD)
  })

  it('本機以 env 為準，接受含 /survey/r 或結尾斜線的寫法', () => {
    expect(resolveAppBaseUrl('http://localhost:3001/survey/r/', 'localhost')).toBe(
      'http://localhost:3001',
    )
    expect(resolveAppBaseUrl('https://app-dev.daodao.so/', 'localhost')).toBe(DEV)
  })

  it('本機沒設定時指向 app-dev，避免本機測試資料開到正式站', () => {
    expect(resolveAppBaseUrl(undefined, 'localhost')).toBe(DEV)
    expect(resolveAppBaseUrl('', '127.0.0.1')).toBe(DEV)
  })

  it('未知主機且沒設定時退回正式站', () => {
    expect(resolveAppBaseUrl(undefined, 'example.com')).toBe(PROD)
    expect(resolveAppBaseUrl(undefined, undefined)).toBe(PROD)
  })
})

describe('public URLs', () => {
  it('問卷與實踐連結都以 APP_BASE_URL 組成', () => {
    expect(SURVEY_PUBLIC_BASE).toBe(`${APP_BASE_URL}/survey/r`)
    expect(getPracticePublicUrl('abc-123')).toBe(`${APP_BASE_URL}/practices/abc-123`)
  })
})

describe('APP_BASE_URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('依目前頁面主機決定（jsdom 為 localhost、未設 env → app-dev）', async () => {
    vi.stubEnv('VITE_SURVEY_PUBLIC_BASE', '')
    vi.resetModules()
    const config = await import('@/config')
    expect(window.location.hostname).toBe('localhost')
    expect(config.APP_BASE_URL).toBe(DEV)
  })
})
