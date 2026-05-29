import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

// Existing pages (eager load)
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'

// Lazy-loaded pages
const QueryLogsPage = lazy(() =>
  import('@/pages/QueryLogsPage').then((m) => ({ default: m.QueryLogsPage })),
)
const SystemPromptsPage = lazy(() =>
  import('@/pages/SystemPromptsPage').then((m) => ({ default: m.SystemPromptsPage })),
)
const AIServiceConfigsPage = lazy(() =>
  import('@/pages/AIServiceConfigsPage').then((m) => ({ default: m.AIServiceConfigsPage })),
)
const ModelManagementPage = lazy(() =>
  import('@/pages/ModelManagementPage').then((m) => ({ default: m.ModelManagementPage })),
)
const UserQuotasPage = lazy(() =>
  import('@/pages/UserQuotasPage').then((m) => ({ default: m.UserQuotasPage })),
)
const PlaygroundPage = lazy(() =>
  import('@/pages/PlaygroundPage').then((m) => ({ default: m.PlaygroundPage })),
)
const RolesPermissionsPage = lazy(() =>
  import('@/pages/RolesPermissionsPage').then((m) => ({ default: m.RolesPermissionsPage })),
)
const UserManagementPage = lazy(() =>
  import('@/pages/UserManagementPage').then((m) => ({ default: m.UserManagementPage })),
)

// New pages (Phase 1+)
const UserAnalyticsPage = lazy(() =>
  import('@/pages/UserAnalyticsPage').then((m) => ({ default: m.UserAnalyticsPage })),
)
const UserTagsPage = lazy(() =>
  import('@/pages/UserTagsPage').then((m) => ({ default: m.UserTagsPage })),
)
const UserDetailPage = lazy(() =>
  import('@/pages/UserDetailPage').then((m) => ({ default: m.UserDetailPage })),
)
const PracticesPage = lazy(() =>
  import('@/pages/PracticesPage').then((m) => ({ default: m.PracticesPage })),
)
const SystemMonitorPage = lazy(() =>
  import('@/pages/SystemMonitorPage').then((m) => ({ default: m.SystemMonitorPage })),
)
const EmailManagementPage = lazy(() =>
  import('@/pages/EmailManagementPage').then((m) => ({ default: m.EmailManagementPage })),
)
const NotificationsPage = lazy(() =>
  import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)
const TriggeredEmailsPage = lazy(() =>
  import('@/pages/TriggeredEmailsPage').then((m) => ({ default: m.TriggeredEmailsPage })),
)
const ScheduledReportsPage = lazy(() =>
  import('@/pages/ScheduledReportsPage').then((m) => ({ default: m.ScheduledReportsPage })),
)
const CustomReportsPage = lazy(() =>
  import('@/pages/CustomReportsPage').then((m) => ({ default: m.CustomReportsPage })),
)
const AnomalyAlertsPage = lazy(() =>
  import('@/pages/AnomalyAlertsPage').then((m) => ({ default: m.AnomalyAlertsPage })),
)
const FeedbackPage = lazy(() =>
  import('@/pages/FeedbackPage').then((m) => ({ default: m.FeedbackPage })),
)
const FAQManagementPage = lazy(() =>
  import('@/pages/FAQManagementPage').then((m) => ({ default: m.FAQManagementPage })),
)
const AuditLogPage = lazy(() =>
  import('@/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
)
const TrustLevelsPage = lazy(() =>
  import('@/pages/TrustLevelsPage').then((m) => ({ default: m.TrustLevelsPage })),
)
const AutoModPage = lazy(() =>
  import('@/pages/AutoModPage').then((m) => ({ default: m.AutoModPage })),
)
const LearningProgressPage = lazy(() =>
  import('@/pages/LearningProgressPage').then((m) => ({ default: m.LearningProgressPage })),
)
const DripContentPage = lazy(() =>
  import('@/pages/DripContentPage').then((m) => ({ default: m.DripContentPage })),
)
const QuizzesPage = lazy(() =>
  import('@/pages/QuizzesPage').then((m) => ({ default: m.QuizzesPage })),
)
const CertificatesPage = lazy(() =>
  import('@/pages/CertificatesPage').then((m) => ({ default: m.CertificatesPage })),
)
const LearningPathsPage = lazy(() =>
  import('@/pages/LearningPathsPage').then((m) => ({ default: m.LearningPathsPage })),
)
const BadgesPage = lazy(() => import('@/pages/BadgesPage').then((m) => ({ default: m.BadgesPage })))
const ChallengesPage = lazy(() =>
  import('@/pages/ChallengesPage').then((m) => ({ default: m.ChallengesPage })),
)
const LeaderboardsPage = lazy(() =>
  import('@/pages/LeaderboardsPage').then((m) => ({ default: m.LeaderboardsPage })),
)
const OnboardingFlowsPage = lazy(() =>
  import('@/pages/OnboardingFlowsPage').then((m) => ({ default: m.OnboardingFlowsPage })),
)
const ContentPerformancePage = lazy(() =>
  import('@/pages/ContentPerformancePage').then((m) => ({ default: m.ContentPerformancePage })),
)
const MemberDirectoryPage = lazy(() =>
  import('@/pages/MemberDirectoryPage').then((m) => ({ default: m.MemberDirectoryPage })),
)
const AIAssistantPage = lazy(() =>
  import('@/pages/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })),
)
const EventsPage = lazy(() => import('@/pages/EventsPage').then((m) => ({ default: m.EventsPage })))

// Wishpool pages
const WishInboxPage = lazy(() =>
  import('@/pages/WishInboxPage').then((m) => ({ default: m.WishInboxPage })),
)
const RoadmapItemsPage = lazy(() =>
  import('@/pages/RoadmapItemsPage').then((m) => ({ default: m.RoadmapItemsPage })),
)
const RoadmapReportsPage = lazy(() =>
  import('@/pages/RoadmapReportsPage').then((m) => ({ default: m.RoadmapReportsPage })),
)

// Survey pages
const SurveyManagementPage = lazy(() =>
  import('@/pages/SurveyManagementPage').then((m) => ({ default: m.SurveyManagementPage })),
)

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export function App() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoading ? null : isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Dashboard (eager) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* AI 服務 */}
          <Route
            path="/query-logs"
            element={
              <LazyPage>
                <QueryLogsPage />
              </LazyPage>
            }
          />
          <Route
            path="/system-prompts"
            element={
              <LazyPage>
                <SystemPromptsPage />
              </LazyPage>
            }
          />
          <Route
            path="/ai-configs"
            element={
              <LazyPage>
                <AIServiceConfigsPage />
              </LazyPage>
            }
          />
          <Route
            path="/models"
            element={
              <LazyPage>
                <ModelManagementPage />
              </LazyPage>
            }
          />
          <Route
            path="/playground"
            element={
              <LazyPage>
                <PlaygroundPage />
              </LazyPage>
            }
          />

          {/* 用戶 */}
          <Route
            path="/user-management"
            element={
              <LazyPage>
                <UserManagementPage />
              </LazyPage>
            }
          />
          <Route
            path="/users/:userId"
            element={
              <LazyPage>
                <UserDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="/user-analytics"
            element={
              <LazyPage>
                <UserAnalyticsPage />
              </LazyPage>
            }
          />
          <Route
            path="/user-tags"
            element={
              <LazyPage>
                <UserTagsPage />
              </LazyPage>
            }
          />
          <Route
            path="/roles-permissions"
            element={
              <LazyPage>
                <RolesPermissionsPage />
              </LazyPage>
            }
          />
          <Route
            path="/user-quotas"
            element={
              <LazyPage>
                <UserQuotasPage />
              </LazyPage>
            }
          />

          {/* 內容 */}
          <Route
            path="/practices"
            element={
              <LazyPage>
                <PracticesPage />
              </LazyPage>
            }
          />
          <Route
            path="/content-performance"
            element={
              <LazyPage>
                <ContentPerformancePage />
              </LazyPage>
            }
          />

          {/* 溝通 */}
          <Route
            path="/notifications"
            element={
              <LazyPage>
                <NotificationsPage />
              </LazyPage>
            }
          />
          <Route
            path="/triggered-emails"
            element={
              <LazyPage>
                <TriggeredEmailsPage />
              </LazyPage>
            }
          />

          {/* 報表 */}
          <Route
            path="/scheduled-reports"
            element={
              <LazyPage>
                <ScheduledReportsPage />
              </LazyPage>
            }
          />
          <Route
            path="/custom-reports"
            element={
              <LazyPage>
                <CustomReportsPage />
              </LazyPage>
            }
          />
          <Route
            path="/anomaly-alerts"
            element={
              <LazyPage>
                <AnomalyAlertsPage />
              </LazyPage>
            }
          />

          {/* 支援 */}
          <Route
            path="/feedback"
            element={
              <LazyPage>
                <FeedbackPage />
              </LazyPage>
            }
          />
          <Route
            path="/faq"
            element={
              <LazyPage>
                <FAQManagementPage />
              </LazyPage>
            }
          />

          {/* 系統 */}
          <Route
            path="/system-monitor"
            element={
              <LazyPage>
                <SystemMonitorPage />
              </LazyPage>
            }
          />
          <Route
            path="/email-management"
            element={
              <LazyPage>
                <EmailManagementPage />
              </LazyPage>
            }
          />
          <Route
            path="/audit-log"
            element={
              <LazyPage>
                <AuditLogPage />
              </LazyPage>
            }
          />

          {/* 信任與審核 */}
          <Route
            path="/trust-levels"
            element={
              <LazyPage>
                <TrustLevelsPage />
              </LazyPage>
            }
          />
          <Route
            path="/automod"
            element={
              <LazyPage>
                <AutoModPage />
              </LazyPage>
            }
          />

          {/* 學習 */}
          <Route
            path="/learning-progress"
            element={
              <LazyPage>
                <LearningProgressPage />
              </LazyPage>
            }
          />
          <Route
            path="/drip-content"
            element={
              <LazyPage>
                <DripContentPage />
              </LazyPage>
            }
          />
          <Route
            path="/quizzes"
            element={
              <LazyPage>
                <QuizzesPage />
              </LazyPage>
            }
          />
          <Route
            path="/certificates"
            element={
              <LazyPage>
                <CertificatesPage />
              </LazyPage>
            }
          />
          <Route
            path="/learning-paths"
            element={
              <LazyPage>
                <LearningPathsPage />
              </LazyPage>
            }
          />

          {/* 遲戲化 */}
          <Route
            path="/badges"
            element={
              <LazyPage>
                <BadgesPage />
              </LazyPage>
            }
          />
          <Route
            path="/challenges"
            element={
              <LazyPage>
                <ChallengesPage />
              </LazyPage>
            }
          />
          <Route
            path="/leaderboards"
            element={
              <LazyPage>
                <LeaderboardsPage />
              </LazyPage>
            }
          />

          {/* 社群 */}
          <Route
            path="/onboarding-flows"
            element={
              <LazyPage>
                <OnboardingFlowsPage />
              </LazyPage>
            }
          />
          <Route
            path="/member-directory"
            element={
              <LazyPage>
                <MemberDirectoryPage />
              </LazyPage>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <LazyPage>
                <AIAssistantPage />
              </LazyPage>
            }
          />

          {/* 活動 */}
          <Route
            path="/events"
            element={
              <LazyPage>
                <EventsPage />
              </LazyPage>
            }
          />

          {/* 許願池 */}
          <Route
            path="/wishes"
            element={
              <LazyPage>
                <WishInboxPage />
              </LazyPage>
            }
          />
          <Route
            path="/roadmap-items"
            element={
              <LazyPage>
                <RoadmapItemsPage />
              </LazyPage>
            }
          />
          <Route
            path="/roadmap-reports"
            element={
              <LazyPage>
                <RoadmapReportsPage />
              </LazyPage>
            }
          />

          {/* 問卷 */}
          <Route
            path="/surveys"
            element={
              <LazyPage>
                <SurveyManagementPage />
              </LazyPage>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
