/**
 * 登入後回到原本要開的後台頁（daodao#451：通知信的 /admin/feedback?id= 連結，未登入時也要能回到該則回報）
 *
 * Google 登入會整頁跳到 server 再回 /auth/callback，React state 帶不過去，所以存在 sessionStorage。
 * 只接受站內路徑，避免被塞外部網址變成 open redirect。
 */

const STORAGE_KEY = 'daodao_admin_post_login_path'
export const DEFAULT_POST_LOGIN_PATH = '/dashboard'

/** 只允許 router 內的相對路徑；拒絕 //host、反斜線、協定與登入相關頁 */
export function safePostLoginPath(value: string | null | undefined): string | null {
  if (!value?.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  if (/^\/(login|auth)(\/|\?|$)/.test(value)) return null
  return value
}

export function rememberPostLoginPath(path: string): void {
  const safe = safePostLoginPath(path)
  if (!safe || safe === '/') return
  try {
    sessionStorage.setItem(STORAGE_KEY, safe)
  } catch {
    // 無痕或停用儲存時就回預設頁
  }
}

/** 讀出登入後要去的頁；沒有或不合法時回 /dashboard。只讀不刪，render 重跑也拿到同一個值 */
export function peekPostLoginPath(): string {
  try {
    return safePostLoginPath(sessionStorage.getItem(STORAGE_KEY)) ?? DEFAULT_POST_LOGIN_PATH
  } catch {
    return DEFAULT_POST_LOGIN_PATH
  }
}

/** 已登入並進到受保護頁後清掉，下次登入不會被舊值帶走 */
export function clearPostLoginPath(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
