import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  Cpu,
  FileText,
  Folder,
  HelpCircle,
  LayoutDashboard,
  List,
  LogOut,
  Mail,
  Medal,
  Menu,
  MessageSquare,
  Monitor,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Trophy,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: '總覽',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: '用戶',
    items: [
      { to: '/user-management', label: '用戶管理', icon: UserCog },
      { to: '/user-analytics', label: '用戶分析', icon: TrendingUp },
      { to: '/user-tags', label: '用戶標籤', icon: Users },
      { to: '/roles-permissions', label: '角色權限', icon: Shield },
      { to: '/user-quotas', label: 'Token 配額', icon: Users },
    ],
  },
  {
    title: 'AI 服務',
    items: [
      { to: '/query-logs', label: '查詢日誌', icon: List },
      { to: '/models', label: '模型管理', icon: Cpu },
      { to: '/system-prompts', label: 'System Prompts', icon: FileText },
      { to: '/ai-configs', label: '服務設定', icon: Settings },
      { to: '/playground', label: 'Playground', icon: MessageSquare },
    ],
  },
  {
    title: '內容',
    items: [{ to: '/practices', label: '主題實踐', icon: Target }],
  },
  {
    title: '溝通',
    items: [
      { to: '/notifications', label: '站內通知', icon: Bell },
      { to: '/triggered-emails', label: '觸發式郵件', icon: Mail },
    ],
  },
  {
    title: '報表',
    items: [
      { to: '/scheduled-reports', label: '排程報表', icon: FileText },
      { to: '/custom-reports', label: '自訂報表', icon: BarChart3 },
      { to: '/anomaly-alerts', label: '異常警報', icon: Monitor },
    ],
  },
  {
    title: '支援',
    items: [
      { to: '/feedback', label: '意見回饋', icon: MessageSquare },
      { to: '/faq', label: 'FAQ 管理', icon: HelpCircle },
    ],
  },
  {
    title: '系統',
    items: [
      { to: '/system-monitor', label: '系統監控', icon: Monitor },
      { to: '/email-management', label: '郵件管理', icon: Mail },
      { to: '/audit-log', label: '審計日誌', icon: Folder },
    ],
  },
  {
    title: '信任與審核',
    items: [
      { to: '/trust-levels', label: '信任等級', icon: Shield },
      { to: '/automod', label: 'AutoMod', icon: Shield },
    ],
  },
  {
    title: '學習',
    items: [
      { to: '/learning-progress', label: '課程進度', icon: BookOpen },
      { to: '/drip-content', label: '內容滴灌', icon: BookOpen },
      { to: '/quizzes', label: '測驗管理', icon: BookOpen },
      { to: '/certificates', label: '證書管理', icon: Medal },
      { to: '/learning-paths', label: '學習路徑', icon: BookOpen },
    ],
  },
  {
    title: '遊戲化',
    items: [
      { to: '/badges', label: '徽章', icon: Trophy },
      { to: '/challenges', label: '挑戰', icon: Target },
      { to: '/leaderboards', label: '排行榜', icon: BarChart3 },
    ],
  },
  {
    title: '社群',
    items: [
      { to: '/onboarding-flows', label: 'Onboarding', icon: UserPlus },
      { to: '/content-performance', label: '內容績效', icon: TrendingUp },
      { to: '/member-directory', label: '會員名錄', icon: Users },
      { to: '/ai-assistant', label: 'AI 助手', icon: MessageSquare },
    ],
  },
  {
    title: '活動',
    items: [{ to: '/events', label: '活動管理', icon: BarChart3 }],
  },
]

const STORAGE_KEY = 'admin-sidebar-collapsed'

function getInitialCollapsed(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

function SidebarGroup({
  group,
  collapsed,
  onToggle,
}: { group: NavGroup; collapsed: boolean; onToggle: () => void }) {
  const location = useLocation()

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        {group.title}
        <ChevronDown
          className={cn('h-3 w-3 transition-transform', collapsed && '-rotate-90')}
        />
      </button>
      {!collapsed && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)

  const toggle = useCallback(
    (title: string) => {
      setCollapsed((prev) => {
        const next = { ...prev, [title]: !prev[title] }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    [],
  )

  return (
    <>
      <div className="flex h-14 items-center px-4 border-b border-border shrink-0">
        <span className="heading-sm text-primary">DaoDao Admin</span>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-2 py-3 space-y-3 scrollbar-hide"
        onClick={onNavigate}
        onKeyDown={undefined}
      >
        {navGroups.map((group) => (
          <SidebarGroup
            key={group.title}
            group={group}
            collapsed={!!collapsed[group.title]}
            onToggle={() => toggle(group.title)}
          />
        ))}
      </nav>

      <div className="border-t border-border p-2 shrink-0">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          登出
        </button>
      </div>
    </>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex h-screen w-56 flex-col border-r border-border bg-card">
      <SidebarContent />
    </aside>
  )
}

export function MobileHeader({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  return (
    <>
      <header className="flex lg:hidden h-14 items-center gap-3 border-b border-border bg-card px-4">
        <button type="button" onClick={() => setOpen(true)} className="text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <span className="heading-sm text-primary">DaoDao Admin</span>
        {children}
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} onKeyDown={undefined} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card shadow-xl">
            <div className="absolute right-2 top-3">
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
