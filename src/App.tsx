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
import { RoadmapItemsPage } from '@/pages/RoadmapItemsPage'
import { RoadmapReportsPage } from '@/pages/RoadmapReportsPage'
import { RolesPermissionsPage } from '@/pages/RolesPermissionsPage'
import { SystemPromptsPage } from '@/pages/SystemPromptsPage'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { UserQuotasPage } from '@/pages/UserQuotasPage'
import { WishInboxPage } from '@/pages/WishInboxPage'

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
        <Route
          path="/roles-permissions"
          element={
            <AppShell>
              <RolesPermissionsPage />
            </AppShell>
          }
        />
        <Route
          path="/user-management"
          element={
            <AppShell>
              <UserManagementPage />
            </AppShell>
          }
        />
        <Route
          path="/wishes"
          element={
            <AppShell>
              <WishInboxPage />
            </AppShell>
          }
        />
        <Route
          path="/roadmap-items"
          element={
            <AppShell>
              <RoadmapItemsPage />
            </AppShell>
          }
        />
        <Route
          path="/roadmap-reports"
          element={
            <AppShell>
              <RoadmapReportsPage />
            </AppShell>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
