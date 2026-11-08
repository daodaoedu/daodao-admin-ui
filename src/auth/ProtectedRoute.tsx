import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { USE_PREVIEW_MOCK } from '@/config'
import { clearPostLoginPath, rememberPostLoginPath } from '@/lib/post-login-redirect'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // 僅在明確開啟本機預覽模式（VITE_USE_PREVIEW_MOCK=true）時略過登入
  if (USE_PREVIEW_MOCK) return <Outlet />

  if (isLoading) return null
  if (!isAuthenticated) {
    // 記住原本要開的頁（例如通知信的 /feedback?id=），登入後回到這裡
    rememberPostLoginPath(`${location.pathname}${location.search}`)
    return <Navigate to="/login" replace />
  }
  clearPostLoginPath()
  return <Outlet />
}
