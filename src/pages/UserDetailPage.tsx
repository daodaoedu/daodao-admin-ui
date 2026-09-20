import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Clock,
  Eye,
  FileText,
  Heart,
  Loader2,
  LogIn,
  MapPin,
  MessageSquare,
  Monitor,
  Shield,
  Star,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUserPersonaProfile } from '@/api/admin-community'
import { listRoles, updateUserRole } from '@/api/admin-server'
import { getUserPractices, updateAdminUserStatus, updatePracticeStatus } from '@/api/admin-users'
import type {
  AdminActivityStats,
  AdminLoginHistoryItem,
  PracticeEntity,
  PracticeStatus,
} from '@/api/types'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { APP_BASE_URL, getPracticePublicUrl } from '@/config'
import {
  useActivityTimeline,
  useAdminActivityStats,
  useAdminLoginHistory,
  useAdminUserDetail,
} from '@/hooks/useAdminUserDetail'
import { cn } from '@/lib/utils'

const PERSONA_LABELS: Record<string, string> = {
  D: '探探島',
  A: '動動島',
  O: '構構島',
  L: '跨跨島',
  C: '連連島',
}

type EventType =
  | '登入'
  | '打卡'
  | '發文'
  | '實踐'
  | '人物誌'
  | '瀏覽'
  | '反應'
  | '留言'
  | 'AI 查詢'
  | '角色變更'
  | '註冊'
  | '操作'

interface TimelineEvent {
  id: number
  type: EventType
  description: string
  timestamp: string
  url?: string
}

const eventTypeConfig: Record<EventType, { color: string; icon: typeof LogIn }> = {
  登入: { color: 'border-info', icon: LogIn },
  打卡: { color: 'border-success', icon: MapPin },
  發文: { color: 'border-info', icon: FileText },
  實踐: { color: 'border-info', icon: BookOpen },
  人物誌: { color: 'border-warning', icon: Star },
  瀏覽: { color: 'border-muted', icon: Eye },
  反應: { color: 'border-warning', icon: Heart },
  留言: { color: 'border-info', icon: MessageSquare },
  'AI 查詢': { color: 'border-warning', icon: Brain },
  角色變更: { color: 'border-destructive', icon: Shield },
  註冊: { color: 'border-success', icon: UserPlus },
  操作: { color: 'border-info', icon: Monitor },
}

const tabs = ['活動時間軸', '活動統計', '登入歷史', '角色管理', '實踐', '人物誌'] as const
type Tab = (typeof tabs)[number]

const TIMELINE_TYPE_MAP: Record<string, EventType> = {
  login: '登入',
  checkin: '打卡',
  post: '發文',
  practice: '實踐',
  persona: '人物誌',
  view: '瀏覽',
  reaction: '反應',
  comment: '留言',
}

const eventFilterOptions: ('全部' | EventType)[] = [
  '全部',
  '登入',
  '打卡',
  '發文',
  '實踐',
  '人物誌',
  '瀏覽',
  '反應',
  '留言',
]

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
            <div
              key={event.id}
              className={cn(
                'rounded-lg border border-[var(--admin-panel-border)] bg-card/90 p-4 shadow-sm border-l-4',
                config.color,
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-muted p-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{event.type}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {event.url ? (
                      <a
                        href={`${APP_BASE_URL}${event.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-muted-foreground/40 hover:text-foreground"
                      >
                        {event.description}
                      </a>
                    ) : (
                      event.description
                    )}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(event.timestamp).toLocaleString('zh-TW')}
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

function ActivityStatsTab({ stats }: { stats: AdminActivityStats | undefined }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="總實踐數" value={stats?.totalPractices ?? 0} icon={BookOpen} />
        <StatCard title="總打卡數" value={stats?.totalCheckins ?? 0} icon={MapPin} />
        <StatCard title="總發文數" value={stats?.totalPosts ?? 0} icon={FileText} />
        <StatCard title="總反應數" value={stats?.totalReactions ?? 0} icon={Heart} />
        <StatCard title="總登入次數" value={stats?.loginCount ?? 0} icon={LogIn} />
        <StatCard title="近30天登入" value={stats?.recentLoginCount ?? 0} icon={Clock} />
      </div>
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">最後登入:</span>
            <span className="font-medium text-foreground">
              {stats?.lastLoginAt ? new Date(stats.lastLoginAt).toLocaleString('zh-TW') : '-'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">最後操作:</span>
            <span className="font-medium text-foreground">
              {stats?.lastActiveAt ? new Date(stats.lastActiveAt).toLocaleString('zh-TW') : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginHistoryTab({
  rows,
}: {
  rows: { id: number; time: string; ip: string; device: string }[]
}) {
  return (
    <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>時間</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>裝置 / 瀏覽器</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap text-foreground">
                {row.time ? new Date(row.time).toLocaleString('zh-TW') : '-'}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                {row.ip}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" />
                  {row.device}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RoleManagementTab({
  userId,
  currentRoleId,
  roles,
  permissions,
  onSuccess,
}: {
  userId: number
  currentRoleId: number | undefined
  roles: { id: number; name: string }[]
  permissions: string[]
  onSuccess: () => void
}) {
  const { mutate: changeRole, isPending } = useMutation({
    mutationFn: (roleId: number) => updateUserRole(userId, roleId),
    onSuccess,
  })

  const roleOptions = [
    { value: '', label: '選擇角色' },
    ...roles.map((r) => ({ value: String(r.id), label: r.name })),
  ]

  const currentRoleName = roles.find((r) => r.id === currentRoleId)?.name ?? '無角色'

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <h3 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
          目前角色
        </h3>
        <div className="mb-4 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">{currentRoleName}</span>
        </div>
        <div>
          <label
            htmlFor="detail-role-select"
            className="mb-1.5 block text-sm text-muted-foreground"
          >
            變更角色
          </label>
          <div className="flex items-center gap-3">
            <Select
              id="detail-role-select"
              value={currentRoleId ? String(currentRoleId) : ''}
              onValueChange={(v) => {
                if (v) changeRole(Number(v))
              }}
              options={roleOptions}
            />
            {isPending && <span className="text-xs text-muted-foreground">儲存中...</span>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <h3 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
          權限列表
        </h3>
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

// ─── Practices Tab ────────────────────────────────────────────────────────────

const DORMANT_DAYS = 14

function relativeTime(dateStr?: string): string {
  if (!dateStr) return '從未'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 週前`
  return `${Math.floor(days / 30)} 個月前`
}

type EngagementLabel = '停滯中' | '從未打卡' | '高互動' | '已完成'
type Segment = '全部' | EngagementLabel

function getEngagementLabels(p: PracticeEntity): EngagementLabel[] {
  const labels: EngagementLabel[] = []
  if (p.checkInCount === 0) labels.push('從未打卡')
  if (p.status === 'active') {
    const noCheckin = !p.lastCheckinAt
    const dormant =
      p.lastCheckinAt &&
      Math.floor((Date.now() - new Date(p.lastCheckinAt).getTime()) / 86400000) > DORMANT_DAYS
    if (noCheckin || dormant) labels.push('停滯中')
  }
  if (p.stats.likeCount + p.stats.favoriteCount >= 5 || p.checkInCount >= 15) {
    labels.push('高互動')
  }
  if (p.status === 'completed') labels.push('已完成')
  return labels
}

const SEGMENTS: Segment[] = ['全部', '停滯中', '從未打卡', '高互動', '已完成']

function PracticesTab({ userId }: { userId: string }) {
  const [segment, setSegment] = useState<Segment>('全部')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user-practices', userId],
    queryFn: () =>
      getUserPractices(userId, { limit: 50, sort: 'updatedAt', order: 'desc' }).then(
        (r) => r.data.data,
      ),
  })

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PracticeStatus }) =>
      updatePracticeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-practices', userId] })
    },
  })

  const practices = data ?? []
  const labeled = practices.map((p) => ({ p, labels: getEngagementLabels(p) }))

  const counts = SEGMENTS.reduce(
    (acc, seg) => {
      acc[seg] =
        seg === '全部' ? practices.length : labeled.filter((lp) => lp.labels.includes(seg)).length
      return acc
    },
    {} as Record<Segment, number>,
  )

  const filtered =
    segment === '全部' ? labeled : labeled.filter((lp) => lp.labels.includes(segment))

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">載入中...</p>
  }

  return (
    <div className="space-y-4">
      {/* Segment pills */}
      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map((seg) => (
          <button
            type="button"
            key={seg}
            onClick={() => setSegment(seg)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              segment === seg
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {seg}
            <span
              className={cn(
                'inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px]',
                segment === seg ? 'bg-white/20 text-primary-foreground' : 'bg-muted',
              )}
            >
              {counts[seg]}
            </span>
          </button>
        ))}
      </div>

      {/* Practice rows */}
      <div className="space-y-2">
        {filtered.map(({ p, labels }) => {
          const dormantDays =
            p.status === 'active' && p.lastCheckinAt && p.checkInCount > 0
              ? Math.floor((Date.now() - new Date(p.lastCheckinAt).getTime()) / 86400000)
              : null

          return (
            <div
              key={p.id}
              className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 px-4 py-3.5 shadow-sm"
            >
              {/* Title + signals + status select */}
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={getPracticePublicUrl(p.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {p.title}
                    </a>
                    {dormantDays !== null && dormantDays > DORMANT_DAYS && (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
                        停滯 {dormantDays} 天
                      </span>
                    )}
                    {labels.includes('從未打卡') && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                        從未打卡
                      </span>
                    )}
                    {labels.includes('高互動') && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                        高互動
                      </span>
                    )}
                  </div>
                </div>
                <Select
                  value={p.status}
                  onValueChange={(v) => changeStatus({ id: p.id, status: v as PracticeStatus })}
                  options={[
                    { value: 'draft', label: '草稿' },
                    { value: 'not_started', label: '尚未開始' },
                    { value: 'active', label: '活躍' },
                    { value: 'completed', label: '已完成' },
                    { value: 'archived', label: '已封存' },
                  ]}
                  triggerClassName="h-7 w-auto shrink-0 min-w-[88px] px-2 text-xs"
                />
              </div>

              {/* Progress bar */}
              {p.progressPercentage !== undefined && (
                <div className="mt-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">完成進度</span>
                    <span className="text-[10px] font-semibold text-primary">
                      {Math.round(p.progressPercentage)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, p.progressPercentage)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {p.checkInCount} 次打卡
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {p.stats.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {p.stats.favoriteCount}
                </span>
                <span className="ml-auto">最後打卡 {relativeTime(p.lastCheckinAt)}</span>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">此分類沒有實踐</p>
        )}
      </div>
    </div>
  )
}

// ─── Persona Tab ─────────────────────────────────────────────────────────────

const QUESTION_TYPE_LABEL: Record<string, string> = {
  choice: '選擇題',
  sentence_completion: '句子完成',
  scenario: '情境題',
}

function PersonaTab({ userUuid }: { userUuid: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user-persona', userUuid],
    queryFn: () => getUserPersonaProfile(userUuid).then((r) => r.data.data),
    enabled: !!userUuid,
  })

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">載入中...</p>
  }

  if (!data) {
    return <p className="py-8 text-center text-sm text-muted-foreground">尚無人物誌資料</p>
  }

  const answered = data.questions.filter((q) => !q.isPlaceholder)
  const unanswered = data.questions.filter((q) => q.isPlaceholder)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
          <p className="text-xl font-bold text-foreground">{answered.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">已填寫</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
          <p className="text-xl font-bold text-foreground">{unanswered.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">未填寫</p>
        </div>
      </div>

      {answered.length === 0 && (
        <p className="py-4 text-sm text-muted-foreground">此用戶尚未填寫任何人物誌問題</p>
      )}

      {/* Answered questions */}
      <div className="space-y-3">
        {answered.map((q) => (
          <div
            key={q.id}
            className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-4 shadow-sm"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{q.prompt}</p>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {QUESTION_TYPE_LABEL[q.questionType] ?? q.questionType}
              </span>
            </div>
            {q.answer && (
              <div className="space-y-1.5">
                <p className="rounded-md bg-primary/8 px-3 py-2 text-sm text-foreground">
                  {q.answer.selectedValue ?? q.answer.textAnswer ?? '-'}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>共鳴 {q.answer.resonanceCount}</span>
                  <span>{q.answer.createdAt.slice(0, 10)}</span>
                  {q.isNewUserPriority && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] text-warning">
                      新用戶優先題
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Unanswered questions */}
      {unanswered.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground">
            未填寫的題目（{unanswered.length} 題）
          </summary>
          <div className="mt-3 space-y-2">
            {unanswered.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{q.prompt}</p>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {QUESTION_TYPE_LABEL[q.questionType] ?? q.questionType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Labels ──────────────────────────────────────────────────────────────────

const REFERRAL_SOURCE_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  discord: 'Discord',
  linkedin: 'LinkedIn',
  friend_referral: '朋友推薦',
  others: '其他',
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('活動時間軸')
  const [toggling, setToggling] = useState(false)

  const userDetail = useAdminUserDetail(userId ?? '')

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles().then((r) => r.data),
  })
  const roles = rolesData?.data ?? []
  const loginHistory = useAdminLoginHistory(userId ?? '')
  const activityStats = useAdminActivityStats(userId ?? '')
  const activityTimeline = useActivityTimeline(userId ?? '')

  const user = userDetail.data
    ? {
        id: userDetail.data.internalId,
        name: userDetail.data.name ?? '未命名',
        email: userDetail.data.email ?? '-',
        avatar: userDetail.data.photoURL,
        registeredAt: userDetail.data.createdAt?.slice(0, 10) ?? '-',
        lastLoginAt: userDetail.data.lastLoginAt
          ? new Date(userDetail.data.lastLoginAt).toLocaleString('zh-TW')
          : '-',
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
  const timelineEvents: TimelineEvent[] = (() => {
    const apiEvents: TimelineEvent[] = (activityTimeline.data ?? []).map((event, idx) => ({
      id: idx,
      type: TIMELINE_TYPE_MAP[event.type] ?? '登入',
      description: event.description,
      timestamp: event.timestamp,
      url: event.url,
    }))

    const syntheticEvents: TimelineEvent[] = []
    let synId = -1

    if (userDetail.data?.createdAt) {
      syntheticEvents.push({
        id: synId--,
        type: '註冊',
        description: '帳號建立',
        timestamp: userDetail.data.createdAt,
      })
    }

    if (activityStats.data?.lastLoginAt && !apiEvents.some((e) => e.type === '登入')) {
      syntheticEvents.push({
        id: synId--,
        type: '登入',
        description: '使用者登入',
        timestamp: activityStats.data.lastLoginAt,
      })
    }

    if (activityStats.data?.lastActiveAt) {
      syntheticEvents.push({
        id: synId--,
        type: '操作',
        description: '最近一次系統操作',
        timestamp: activityStats.data.lastActiveAt,
      })
    }

    return [...apiEvents, ...syntheticEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  })()

  const isLoading = userDetail.isLoading

  const handleToggleStatus = async (isActive: boolean) => {
    if (!userId) return
    setToggling(true)
    try {
      await updateAdminUserStatus(userId, { isActive })
      userDetail.refetch()
    } finally {
      setToggling(false)
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
        <h1 className="text-2xl leading-none font-semibold tracking-tight text-foreground">
          {user.name}
        </h1>
        <Badge variant={user.status === 'active' ? 'success' : 'error'}>
          {user.status === 'active' ? '活躍' : '停用'}
        </Badge>
      </div>

      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex shrink-0 items-start justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <InfoRow label="ID" value={`#${userDetail.data?.internalId}`} />
              <InfoRow label="名稱" value={user.name} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow
                label="Email 驗證"
                value={
                  userDetail.data?.emailVerified ? (
                    <span className="font-medium text-success">
                      已驗證
                      {userDetail.data.emailVerifiedAt
                        ? `（${userDetail.data.emailVerifiedAt.slice(0, 10)}）`
                        : ''}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">未驗證</span>
                  )
                }
              />
              <InfoRow label="註冊日期" value={user.registeredAt} />
              <InfoRow label="最後登入" value={user.lastLoginAt} />
              <InfoRow
                label="最後操作"
                value={
                  activityStats.data?.lastActiveAt
                    ? new Date(activityStats.data.lastActiveAt).toLocaleString('zh-TW')
                    : '-'
                }
              />
              <InfoRow
                label="狀態"
                value={
                  <Badge variant={user.status === 'active' ? 'success' : 'error'}>
                    {user.status === 'active' ? '活躍' : '停用'}
                  </Badge>
                }
              />
              <InfoRow label="角色" value={user.role} />
              <InfoRow
                label="管理標籤"
                value={
                  userDetail.data?.tags?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {userDetail.data.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow
                label="內容標籤"
                value={
                  userDetail.data?.entityTags?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {userDetail.data.entityTags.map((tag) => (
                        <Badge key={tag.id} variant="default">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow
                label="人物誌"
                value={
                  userDetail.data?.personaType
                    ? `${userDetail.data.personaType} ${PERSONA_LABELS[userDetail.data.personaType]}`
                    : '未測驗'
                }
              />
              <InfoRow
                label="從哪知道島島"
                value={
                  userDetail.data?.referralSource
                    ? (REFERRAL_SOURCE_LABEL[userDetail.data.referralSource] ??
                      userDetail.data.referralSource)
                    : '—'
                }
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {user.status === 'active' ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={toggling}
                  onClick={() => handleToggleStatus(false)}
                >
                  {toggling ? '處理中...' : '停用帳號'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={toggling}
                  onClick={() => handleToggleStatus(true)}
                >
                  {toggling ? '處理中...' : '啟用帳號'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-[var(--admin-panel-border)] bg-background/65 p-1 flex w-full flex-wrap gap-0 pb-0">
        {tabs.map((tab) => (
          <Button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-transparent bg-transparent shadow-none hover:bg-muted hover:text-foreground flex-1 justify-center',
              activeTab === tab
                ? 'bg-background/70 text-foreground shadow-sm hover:bg-background/70'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </Button>
        ))}
      </div>

      <div>
        {activeTab === '活動時間軸' &&
          (activityTimeline.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activityTimeline.isError ? (
            <p className="py-8 text-center text-sm text-destructive">無法載入活動時間軸</p>
          ) : (
            <ActivityTimeline events={timelineEvents} />
          ))}
        {activeTab === '活動統計' &&
          (activityStats.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activityStats.isError ? (
            <p className="py-8 text-center text-sm text-destructive">無法載入活動統計</p>
          ) : (
            <ActivityStatsTab stats={activityStats.data} />
          ))}
        {activeTab === '登入歷史' &&
          (loginHistory.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : loginHistory.isError ? (
            <p className="py-8 text-center text-sm text-destructive">無法���入登入歷史</p>
          ) : (
            <LoginHistoryTab rows={loginHistoryRows} />
          ))}
        {activeTab === '角色管理' && userDetail.data && (
          <RoleManagementTab
            userId={userDetail.data.internalId}
            currentRoleId={userDetail.data.roles[0]?.id}
            roles={roles}
            permissions={user.permissions ?? []}
            onSuccess={() => userDetail.refetch()}
          />
        )}
        {activeTab === '實踐' && <PracticesTab userId={userId ?? ''} />}
        {activeTab === '人物誌' && <PersonaTab userUuid={userDetail.data?.id ?? ''} />}
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
