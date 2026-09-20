import { Navigate, Outlet } from 'react-router-dom'
import { USE_PREVIEW_MOCK } from '@/config'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  // 僅在明確開啟本機預覽模式（VITE_USE_PREVIEW_MOCK=true）時略過登入
  if (USE_PREVIEW_MOCK) return <Outlet />

  if (isLoading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
