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
  Shield,
  UserCheck,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { updateAdminUserStatus } from '@/api/admin-users'
import type { AdminActivityStats, AdminLoginHistoryItem } from '@/api/types'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useAdminActivityStats,
  useAdminLoginHistory,
  useAdminUserDetail,
} from '@/hooks/useAdminUserDetail'
import { cn } from '@/lib/utils'

type EventType = '登入' | '打卡' | '發文' | 'AI 查詢' | '角色變更'

interface TimelineEvent {
  id: number
  type: EventType
  description: string
  timestamp: string
}

const eventTypeConfig: Record<EventType, { color: string; icon: typeof LogIn }> = {
  登入: { color: 'border-info', icon: LogIn },
  打卡: { color: 'border-success', icon: MapPin },
  發文: { color: 'border-info', icon: FileText },
  'AI 查詢': { color: 'border-warning', icon: Brain },
  角色變更: { color: 'border-destructive', icon: Shield },
}

const tabs = ['活動時間軸', 'AI 用量', '登入歷史', '角色管理'] as const
type Tab = (typeof tabs)[number]

const eventFilterOptions: ('全部' | EventType)[] = ['全部', '登入', '打卡', '發文', 'AI 查詢']

function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  const [filter, setFilter] = useState<'全部' | EventType>('全部')

  const filtered = filter === '全部' ? events : events.filter((e) => e.type === filter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {eventFilterOptions.map((opt) => (
          <Button
            type="button"
            key={opt}
            variant="outline"
            size="sm"
            onClick={() => setFilter(opt)}
            className={cn(
              filter === opt
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {opt}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((event) => {
          const config = eventTypeConfig[event.type]
          const Icon = config.icon
          return (
            <div key={event.id} className={cn('admin-card-soft border-l-4', config.color)}>
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

function AIUsageTab({ stats }: { stats: AdminActivityStats | undefined }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="總發文數" value={stats?.totalPosts ?? 0} icon={FileText} />
      <StatCard title="總留言數" value={stats?.totalComments ?? 0} icon={Hash} />
      <StatCard title="總打卡數" value={stats?.totalCheckins ?? 0} icon={DollarSign} />
      <StatCard title="總反應數" value={stats?.totalReactions ?? 0} icon={Zap} />
    </div>
  )
}

function LoginHistoryTab({
  rows,
}: {
  rows: { id: number; time: string; ip: string; device: string }[]
}) {
  return (
    <div className="overflow-x-auto admin-panel-card">
      <table className="admin-table-shell text-sm">
        <thead>
          <tr className="admin-table-head">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">時間</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">裝置 / 瀏覽器</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="admin-table-row last:border-0">
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

function RoleManagementTab({
  defaultRole,
  permissions,
}: {
  defaultRole: string
  permissions: string[]
}) {
  const [selectedRole, setSelectedRole] = useState(defaultRole)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const roleOptions = ['viewer', 'member', 'moderator', 'admin']

  return (
    <div className="space-y-6">
      <div className="admin-panel-card p-5">
        <h3 className="heading-sm mb-4">目前角色</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">{selectedRole}</span>
          </div>
        </div>

        <div className="mt-4">
          <span className="mb-1.5 block text-sm text-muted-foreground">變更角色</span>
          <div className="relative inline-block">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex h-9 items-center gap-2"
            >
              {selectedRole}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
            {dropdownOpen && (
              <div className="absolute left-0 z-10 mt-1 w-40 admin-popover">
                {roleOptions.map((role) => (
                  <Button
                    type="button"
                    key={role}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role)
                      setDropdownOpen(false)
                    }}
                    className={cn(
                      'mt-0 block w-full justify-start rounded-none px-4 text-left',
                      role === selectedRole ? 'font-medium text-primary' : 'text-foreground',
                    )}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-panel-card p-5">
        <h3 className="heading-sm mb-4">權限列表</h3>
        {permissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無可顯示權限</p>
        ) : (
          <ul className="space-y-2">
            {permissions.map((perm) => (
              <li key={perm} className="flex items-center gap-2 text-sm text-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {perm}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

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
        permissions: userDetail.data.permissions,
      }
    : null

  const loginHistoryRows = (loginHistory.data ?? []).map(
    (item: AdminLoginHistoryItem, idx: number) => ({
      id: item.id ?? idx,
      time: item.loginAt,
      ip: item.ipAddress ?? '-',
      device: item.userAgent ?? '-',
    }),
  )
  const timelineEvents: TimelineEvent[] = loginHistoryRows.map((row) => ({
    id: row.id,
    type: '登入',
    description: row.device ? `從 ${row.device} 登入` : '使用者登入',
    timestamp: row.time,
  }))

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        找不到該用戶資料
      </div>
    )
  }

  const initials = user.name.slice(-2)

  return (
    <div className="space-y-6">
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

      <div className="admin-panel-card p-5">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex shrink-0 items-start justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </div>
          </div>

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

      <div className="admin-segmented flex w-full flex-wrap gap-0 pb-0">
        {tabs.map((tab) => (
          <Button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'admin-segmented-item flex-1 justify-center',
              activeTab === tab
                ? 'admin-segmented-item-active'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </Button>
        ))}
      </div>

      <div>
        {activeTab === '活動時間軸' && <ActivityTimeline events={timelineEvents} />}
        {activeTab === 'AI 用量' && <AIUsageTab stats={activityStats.data} />}
        {activeTab === '登入歷史' && <LoginHistoryTab rows={loginHistoryRows} />}
        {activeTab === '角色管理' && (
          <RoleManagementTab defaultRole={user.role} permissions={user.permissions ?? []} />
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
