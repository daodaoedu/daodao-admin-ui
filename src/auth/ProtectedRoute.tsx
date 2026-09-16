import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  // Keep local previews navigable without requiring a live admin account.
  if (import.meta.env.DEV) return <Outlet />

  if (isLoading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
