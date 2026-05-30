import { ChevronRight, Home, LayoutDashboard, LogOut, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/query-logs': '查詢日誌',
  '/system-prompts': 'System Prompts',
  '/ai-configs': 'AI 服務設定',
  '/models': '模型管理',
  '/playground': 'Playground',
  '/user-management': '用戶管理',
  '/user-analytics': '用戶分析',
  '/users/:userId': '用戶詳情',
  '/user-tags': '用戶標籤',
  '/roles-permissions': '角色權限',
  '/user-quotas': 'Token 配額',
  '/practices': '主題實踐',
  '/content-performance': '內容績效',
  '/notifications': '站內通知',
  '/triggered-emails': '觸發式郵件',
  '/scheduled-reports': '排程報表',
  '/custom-reports': '自訂報表',
  '/anomaly-alerts': '異常警報',
  '/feedback': '意見回饋',
  '/faq': 'FAQ 管理',
  '/system-monitor': '系統監控',
  '/email-management': '郵件管理',
  '/audit-log': '審計日誌',
  '/trust-levels': '信任等級',
  '/automod': 'AutoMod',
  '/learning-progress': '課程進度',
  '/drip-content': '內容滴灌',
  '/quizzes': '測驗管理',
  '/certificates': '證書管理',
  '/learning-paths': '學習路徑',
  '/badges': '徽章管理',
  '/challenges': '挑戰管理',
  '/leaderboards': '排行榜',
  '/onboarding-flows': 'Onboarding 流程',
  '/member-directory': '會員名錄',
  '/ai-assistant': 'AI 助手',
  '/events': '活動管理',
}

export function Header() {
  const { adminInfo, logout } = useAuth()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = adminInfo?.nickname ? adminInfo.nickname.slice(0, 2).toUpperCase() : 'AD'

  const pageTitle = (() => {
    if (location.pathname.startsWith('/users/')) return ROUTE_TITLES['/users/:userId']

    return ROUTE_TITLES[location.pathname] || location.pathname.replace('/', '') || 'Dashboard'
  })()

  return (
    <header className="sticky top-0 z-40 hidden border-b border-[var(--admin-panel-border)] bg-background/90 px-6 py-4 backdrop-blur md:flex md:h-16 md:items-center md:gap-4">
      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜尋..."
            className="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 h-9 w-full pl-9 pr-12"
          />

          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="hidden min-h-[2.75rem] flex-1 items-center gap-2 text-sm text-muted-foreground md:flex">
        <Home className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
        <LayoutDashboard className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">{pageTitle}</span>
      </div>

      <div className="relative" ref={menuRef}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setUserMenuOpen((v) => !v)}
          onBlur={(e) => {
            if (!menuRef.current?.contains(e.relatedTarget as Node)) {
              setUserMenuOpen(false)
            }
          }}
          className={cn(
            'flex items-center gap-2 rounded-full p-0.5 transition-colors',
            'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
        </Button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border bg-popover p-1 shadow-lg">
            <div className="border-b border-border px-3 py-2">
              <p className="text-sm font-medium text-foreground">
                {adminInfo?.nickname ?? 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground">管理員</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setUserMenuOpen(false)
                logout()
              }}
              className="mt-1 w-full justify-start gap-2 rounded-sm text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              登出
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
