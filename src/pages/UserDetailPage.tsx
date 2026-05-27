import {
  ArrowLeft,
  Brain,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  Hash,
  Loader2,
  LogIn,
  MapPin,
  Monitor,
  Search,
  Shield,
  UserCheck,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { updateAdminUserStatus } from '@/api/admin-users'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useAdminUserDetail,
  useAdminLoginHistory,
  useAdminActivityStats,
} from '@/hooks/useAdminUserDetail'
import { cn } from '@/lib/utils'

// ── Mock Data ──────────────────────────────────────────────

const mockUser = {
  id: 1,
  name: '王小明',
  email: 'test@example.com',
  avatar: null,
  registeredAt: '2024-01-15',
  lastLoginAt: '2024-06-01 14:30',
  status: 'active' as const,
  role: 'member',
}

type EventType = '登入' | '打卡' | '發文' | 'AI 查詢' | '角色變更'

interface TimelineEvent {
  id: number
  type: EventType
  description: string
  timestamp: string
}

const eventTypeConfig: Record<EventType, { color: string; icon: typeof LogIn }> = {
  登入: { color: 'border-blue-400', icon: LogIn },
  打卡: { color: 'border-green-400', icon: MapPin },
  發文: { color: 'border-purple-400', icon: FileText },
  'AI 查詢': { color: 'border-amber-400', icon: Brain },
  角色變更: { color: 'border-red-400', icon: Shield },
}

const mockEvents: TimelineEvent[] = [
  { id: 1, type: '登入', description: '從 Chrome 瀏覽器登入', timestamp: '2024-06-01 14:30' },
  {
    id: 2,
    type: 'AI 查詢',
    description: '查詢「如何提升團隊效率」',
    timestamp: '2024-06-01 13:15',
  },
  { id: 3, type: '發文', description: '在「產品討論」發布新文章', timestamp: '2024-05-31 16:42' },
  { id: 4, type: '打卡', description: '完成每日打卡任務', timestamp: '2024-05-31 09:00' },
  { id: 5, type: 'AI 查詢', description: '查詢「React 最佳實踐」', timestamp: '2024-05-30 11:20' },
  { id: 6, type: '登入', description: '從 Safari 瀏覽器登入', timestamp: '2024-05-30 10:05' },
  {
    id: 7,
    type: '角色變更',
    description: '角色從 viewer 變更為 member',
    timestamp: '2024-05-28 15:30',
  },
  { id: 8, type: '發文', description: '在「技術分享」發布新文章', timestamp: '2024-05-27 14:10' },
  { id: 9, type: '打卡', description: '完成每日打卡任務', timestamp: '2024-05-27 08:55' },
  {
    id: 10,
    type: 'AI 查詢',
    description: '查詢「專案管理工具比較」',
    timestamp: '2024-05-26 17:00',
  },
]

const mockLoginHistory = [
  { id: 1, time: '2024-06-01 14:30', ip: '203.204.15.62', device: 'Chrome 125 / macOS' },
  { id: 2, time: '2024-05-30 10:05', ip: '203.204.15.62', device: 'Safari 17 / macOS' },
  { id: 3, time: '2024-05-25 09:12', ip: '118.163.42.88', device: 'Chrome 125 / Windows' },
  { id: 4, time: '2024-05-20 16:48', ip: '203.204.15.62', device: 'Chrome Mobile / iOS' },
  { id: 5, time: '2024-05-15 11:33', ip: '61.220.18.201', device: 'Firefox 126 / Linux' },
]

const allPermissions = [
  '瀏覽社群內容',
  '發布文章與留言',
  '使用 AI 助手',
  '參加活動',
  '每日打卡',
  '查看排行榜',
]

const roleOptions = ['viewer', 'member', 'moderator', 'admin']

// ── Components ─────────────────────────────────────────────

const tabs = ['活動時間軸', 'AI 用量', '登入歷史', '角色管理'] as const
type Tab = (typeof tabs)[number]

const eventFilterOptions: ('全部' | EventType)[] = ['全部', '登入', '打卡', '發文', 'AI 查詢']

function ActivityTimeline() {
  const [filter, setFilter] = useState<'全部' | EventType>('全部')

  const filtered = filter === '全部' ? mockEvents : mockEvents.filter((e) => e.type === filter)

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {eventFilterOptions.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => setFilter(opt)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              filter === opt
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.map((event) => {
          const config = eventTypeConfig[event.type]
          const Icon = config.icon
          return (
            <div
              key={event.id}
              className={cn('rounded-lg border-l-4 bg-card p-4 shadow-sm', config.color)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-muted p-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{event.type}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {event.timestamp}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">沒有符合條件的活動</p>
        )}
      </div>
    </div>
  )
}

function AIUsageTab() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="總查詢" value={156} icon={Search} change={12.5} changeLabel="較上月" />
      <StatCard title="總 Token" value="234,567" icon={Hash} change={8.3} changeLabel="較上月" />
      <StatCard title="總費用" value="$1.23" icon={DollarSign} change={-3.2} changeLabel="較上月" />
      <StatCard title="常用模型" value="Claude 3.5" icon={Zap} />
    </div>
  )
}

function LoginHistoryTab({
  rows,
}: {
  rows: { id: number; time: string; ip: string; device: string }[]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">時間</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">裝置 / 瀏覽器</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-b-0">
              <td className="whitespace-nowrap px-4 py-3 text-foreground">{row.time}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                {row.ip}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" />
                  {row.device}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RoleManagementTab() {
  const [selectedRole, setSelectedRole] = useState(mockUser.role)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Current role */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="heading-sm mb-4">目前角色</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">{selectedRole}</span>
          </div>
        </div>

        {/* Role selector */}
        <div className="mt-4">
          <span className="mb-1.5 block text-sm text-muted-foreground">變更角色</span>
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent"
            >
              {selectedRole}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 z-10 mt-1 w-40 rounded-md border border-border bg-card py-1 shadow-lg">
                {roleOptions.map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => {
                      setSelectedRole(role)
                      setDropdownOpen(false)
                    }}
                    className={cn(
                      'block w-full px-4 py-2 text-left text-sm hover:bg-accent',
                      role === selectedRole ? 'font-medium text-primary' : 'text-foreground',
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permissions list */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="heading-sm mb-4">權限列表</h3>
        <ul className="space-y-2">
          {allPermissions.map((perm) => (
            <li key={perm} className="flex items-center gap-2 text-sm text-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              {perm}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('活動時間軸')
  const [disabling, setDisabling] = useState(false)

  const userDetail = useAdminUserDetail(userId ?? '')
  const loginHistory = useAdminLoginHistory(userId ?? '')
  const activityStats = useAdminActivityStats(userId ?? '')

  const user = userDetail.data
    ? {
        id: userDetail.data.internalId,
        name: userDetail.data.name ?? '未命名',
        email: userDetail.data.email ?? '-',
        avatar: userDetail.data.photoURL,
        registeredAt: userDetail.data.createdAt?.slice(0, 10) ?? '-',
        lastLoginAt: userDetail.data.lastLoginAt ?? '-',
        status: userDetail.data.isActive ? ('active' as const) : ('inactive' as const),
        role: userDetail.data.roles[0]?.name ?? '-',
      }
    : mockUser

  const loginHistoryRows = loginHistory.data
    ? loginHistory.data.map((item, idx) => ({
        id: item.id ?? idx,
        time: item.loginAt,
        ip: item.ipAddress ?? '-',
        device: item.userAgent ?? '-',
      }))
    : mockLoginHistory

  const isLoading = userDetail.isLoading

  const handleDisableAccount = async () => {
    if (!userId) return
    setDisabling(true)
    try {
      await updateAdminUserStatus(userId, { isActive: false })
      userDetail.refetch()
    } finally {
      setDisabling(false)
    }
  }

  const initials = user.name.slice(-2)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/user-management"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          回用戶列表
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="heading-lg">{user.name}</h1>
        <Badge variant={user.status === 'active' ? 'success' : 'error'}>
          {user.status === 'active' ? '活躍' : '停用'}
        </Badge>
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Avatar */}
          <div className="flex shrink-0 items-start justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <InfoRow label="名稱" value={user.name} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="註冊日期" value={user.registeredAt} />
              <InfoRow label="最後登入" value={user.lastLoginAt} />
              <InfoRow
                label="狀態"
                value={
                  <Badge variant={user.status === 'active' ? 'success' : 'error'}>
                    {user.status === 'active' ? '活躍' : '停用'}
                  </Badge>
                }
              />
              <InfoRow label="角色" value={user.role} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={disabling}
                onClick={handleDisableAccount}
              >
                {disabling ? '處理中...' : '停用帳號'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => alert('功能開發中')}>
                匯出個人資料
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-px">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === '活動時間軸' && <ActivityTimeline />}
        {activeTab === 'AI 用量' && <AIUsageTab />}
        {activeTab === '登入歷史' && <LoginHistoryTab rows={loginHistoryRows} />}
        {activeTab === '角色管理' && <RoleManagementTab />}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
