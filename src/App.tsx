import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { AIServiceConfigsPage } from '@/pages/AIServiceConfigsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { ModelManagementPage } from '@/pages/ModelManagementPage'
import { PlaygroundPage } from '@/pages/PlaygroundPage'
import { QueryLogsPage } from '@/pages/QueryLogsPage'
import { SystemPromptsPage } from '@/pages/SystemPromptsPage'
import { UserQuotasPage } from '@/pages/UserQuotasPage'

export function App() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoading ? null : isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <AppShell>
              <Navigate to="/dashboard" replace />
            </AppShell>
          }
          path="/"
        />
        <Route
          path="/dashboard"
          element={
            <AppShell>
              <DashboardPage />
            </AppShell>
          }
        />
        <Route
          path="/query-logs"
          element={
            <AppShell>
              <QueryLogsPage />
            </AppShell>
          }
        />
        <Route
          path="/system-prompts"
          element={
            <AppShell>
              <SystemPromptsPage />
            </AppShell>
          }
        />
        <Route
          path="/ai-configs"
          element={
            <AppShell>
              <AIServiceConfigsPage />
            </AppShell>
          }
        />
        <Route
          path="/models"
          element={
            <AppShell>
              <ModelManagementPage />
            </AppShell>
          }
        />
        <Route
          path="/user-quotas"
          element={
            <AppShell>
              <UserQuotasPage />
            </AppShell>
          }
        />
        <Route
          path="/playground"
          element={
            <AppShell>
              <PlaygroundPage />
            </AppShell>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
