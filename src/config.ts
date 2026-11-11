const PROD_APP_BASE = 'https://app.daodao.so'
const DEV_APP_BASE = 'https://app-dev.daodao.so'

/** 已部署的 admin 主機固定對應的前台網址；部署的 image 不帶 build-time env，靠主機判定 */
const DEPLOYED_ADMIN_HOSTS = new Map<string, string>([
  ['admin.daodao.so', PROD_APP_BASE],
  ['admin-dev.daodao.so', DEV_APP_BASE],
])

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * 決定前台（app）網址：已部署主機優先，其次 VITE_SURVEY_PUBLIC_BASE（本機用），
 * 本機沒設定時用 app-dev，其餘退回正式站。
 * VITE_* 只在 build 時注入，放在 runtime 的 .env 檔不會生效（#525）。
 */
export function resolveAppBaseUrl(
  envBase: string | undefined,
  hostname: string | undefined,
): string {
  const deployed = hostname ? DEPLOYED_ADMIN_HOSTS.get(hostname) : undefined
  if (deployed) return deployed

  const fromEnv = envBase
    ?.trim()
    .replace(/\/$/, '')
    .replace(/\/survey\/r$/, '')
  if (fromEnv) return fromEnv

  if (hostname && LOCAL_HOSTS.has(hostname)) return DEV_APP_BASE
  return PROD_APP_BASE
}

export const APP_BASE_URL = resolveAppBaseUrl(
  import.meta.env.VITE_SURVEY_PUBLIC_BASE,
  typeof window === 'undefined' ? undefined : window.location.hostname,
)

export const SURVEY_PUBLIC_BASE = `${APP_BASE_URL}/survey/r`

export const getPracticePublicUrl = (practiceId: string) =>
  `${APP_BASE_URL}/practices/${practiceId}`

/**
 * 本機預覽模式：明確設定 VITE_USE_PREVIEW_MOCK=true 才啟用，且僅限 dev build。
 * 啟用後略過登入並以前端 mock 取代 email 模板／dashboard／共同挑戰 API；
 * 預設關閉，一般 `pnpm dev` 仍走真實登入與後端。
 */
export function isPreviewMockEnabled(env: { DEV: boolean; VITE_USE_PREVIEW_MOCK?: string }) {
  return env.DEV && env.VITE_USE_PREVIEW_MOCK === 'true'
}

export const USE_PREVIEW_MOCK = isPreviewMockEnabled(import.meta.env)
