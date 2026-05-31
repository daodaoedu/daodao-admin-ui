import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  Heart,
  MessageSquare,
  Search,
  Share2,
  Star,
  X,
  Zap,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { listPractices, updatePracticeStatus } from '@/api/admin-users'
import type { PracticeEntity, PracticeStatus } from '@/api/types'
import { ExportButton } from '@/components/ExportButton'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { UserLink } from '@/components/UserLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { usePracticeStats } from '@/hooks/usePracticeStats'
import { cn } from '@/lib/utils'

type SortField = 'createdAt' | 'updatedAt' | 'likeCount'

// ─── Constants ────────────────────────────────────────────────────────────────

const statusConfig: Record<PracticeStatus, { label: string; className: string; color: string }> = {
  active: {
    label: '活躍',
    className: 'bg-success/15 text-success',
    color: 'oklch(0.763 0.172 132.6)',
  },
  not_started: {
    label: '尚未開始',
    className: 'bg-muted text-muted-foreground',
    color: 'oklch(0.675 0.008 219.6)',
  },
  archived: {
    label: '已封存',
    className: 'bg-muted text-muted-foreground',
    color: 'oklch(0.483 0.019 221.3)',
  },
  draft: {
    label: '草稿',
    className: 'bg-warning/15 text-warning',
    color: 'oklch(0.786 0.17 68.2)',
  },
  completed: {
    label: '已完成',
    className: 'bg-primary/15 text-primary',
    color: 'oklch(0.711 0.12 190.6)',
  },
}

const exportColumns = [
  { key: 'title', header: '標題' },
  { key: 'status', header: '狀態' },
  { key: 'creator', header: '建立者' },
  { key: 'createdAt', header: '建立日期' },
  { key: 'participants', header: '打卡次數' },
  { key: 'views', header: '瀏覽數' },
  { key: 'likes', header: '迴響數' },
  { key: 'comments', header: '留言數' },
]

const PAGE_SIZE_OPTIONS = [
  { value: '20', label: '20 筆/頁' },
  { value: '50', label: '50 筆/頁' },
  { value: '100', label: '100 筆/頁' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string) {
  if (!value) return '—'
  return value.split('T')[0] ?? value
}

function getPrivacyLabel(privacyStatus: string): string {
  if (privacyStatus === 'public') return '公開'
  if (privacyStatus === 'private') return '私密'
  return privacyStatus
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function _CreatorAvatar({ name, photoURL }: { name: string; photoURL: string | null }) {
  if (photoURL) {
    return (
      <img src={photoURL} alt={name} className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
    )
  }
  return (
    <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-semibold flex-shrink-0">
      {name.charAt(0)}
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2.5">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  align = 'left',
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentOrder: 'asc' | 'desc'
  onSort: (field: SortField) => void
  align?: 'left' | 'right'
}) {
  const isActive = currentSort === field
  return (
    <th
      className="px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      <div className={cn('flex items-center gap-1', align === 'right' && 'justify-end')}>
        {label}
        {isActive ? (
          <span className="text-xs text-primary">{currentOrder === 'desc' ? '↓' : '↑'}</span>
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </div>
    </th>
  )
}

// ─── Status Distribution Chart ────────────────────────────────────────────────

function StatusDistributionChart({ data }: { data?: Array<{ status: string; count: number }> }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        暫無資料
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: statusConfig[item.status as PracticeStatus]?.label ?? item.status,
    count: item.count,
    color: statusConfig[item.status as PracticeStatus]?.color ?? '#94a3b8',
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 60 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value: number) => [value.toLocaleString(), '數量']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Category Distribution Chart ──────────────────────────────────────────────

const CATEGORY_COLORS = [
  'oklch(0.711 0.12 190.6)',
  'oklch(0.786 0.17 68.2)',
  'oklch(0.763 0.172 132.6)',
  'oklch(0.908 0.186 102.5)',
  'oklch(0.577 0.245 27.325)',
  'oklch(0.675 0.008 219.6)',
]

function CategoryDistributionChart({ data }: { data: Array<{ category: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        暫無資料
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 6)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 60 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value: number) => [value.toLocaleString(), '數量']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {sorted.map((entry, index) => (
            <Cell key={entry.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Batch Action Bar ─────────────────────────────────────────────────────────

function BatchActionBar({
  count,
  onStatusChange,
  onClear,
  isPending,
}: {
  count: number
  onStatusChange: (status: PracticeStatus) => void
  onClear: () => void
  isPending: boolean
}) {
  const [batchStatus, setBatchStatus] = useState<PracticeStatus | ''>('')

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
      <span className="text-sm font-medium text-primary shrink-0">已選 {count} 筆</span>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select
          value={batchStatus}
          onValueChange={(v) => setBatchStatus(v as PracticeStatus | '')}
          placeholder="選擇狀態..."
          options={[
            { value: 'draft', label: '草稿' },
            { value: 'not_started', label: '尚未開始' },
            { value: 'active', label: '活躍' },
            { value: 'completed', label: '已完成' },
            { value: 'archived', label: '已封存' },
          ]}
          triggerClassName="w-36"
          disabled={isPending}
        />
        <Button
          type="button"
          size="sm"
          disabled={!batchStatus || isPending}
          onClick={() => {
            if (batchStatus) onStatusChange(batchStatus as PracticeStatus)
          }}
        >
          {isPending ? '套用中...' : '套用'}
        </Button>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function PracticeDetail({
  practice,
  onClose,
  onStatusChange,
  isChangingStatus,
}: {
  practice: PracticeEntity
  onClose: () => void
  onStatusChange: (status: PracticeStatus) => void
  isChangingStatus: boolean
}) {
  const status = statusConfig[practice.status]
  const privacyLabel = getPrivacyLabel(practice.privacyStatus)

  const socialStats = [
    { icon: Eye, label: '瀏覽', value: practice.stats.viewCount },
    { icon: Heart, label: '迴響', value: practice.stats.likeCount },
    { icon: Star, label: '收藏', value: practice.stats.favoriteCount },
    { icon: MessageSquare, label: '留言', value: practice.stats.commentCount },
    { icon: Share2, label: '分享', value: practice.stats.shareCount },
  ]

  const hasFrequency =
    practice.frequencyMinDays !== undefined || practice.frequencyMaxDays !== undefined

  function getFrequencyLabel(): string {
    const min = practice.frequencyMinDays ?? '?'
    const max = practice.frequencyMaxDays
    if (max && max !== practice.frequencyMinDays) return `每 ${min}–${max} 天一次`
    return `每 ${min} 天一次`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-foreground leading-snug">{practice.title}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={cn(
                'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                status.className,
              )}
            >
              {status.label}
            </span>
            <Badge variant="default">{privacyLabel}</Badge>
            {practice.hasResources && <Badge variant="primary">有資源</Badge>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Creator */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            建立者
          </h3>
          <div className="flex items-center gap-3">
            {practice.user.photoURL ? (
              <img
                src={practice.user.photoURL}
                alt={practice.user.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-semibold">
                {practice.user.name.charAt(0)}
              </div>
            )}
            <div>
              <UserLink
                userId={practice.user.id}
                name={practice.user.name}
                showAvatar={false}
                className="text-sm font-medium text-foreground"
              />
              <p className="text-xs text-muted-foreground">ID: {practice.user.id}</p>
            </div>
          </div>
        </section>

        {/* Practice goal */}
        {practice.practiceAction && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              實踐目標
            </h3>
            <p className="text-sm bg-muted/50 rounded-lg px-3 py-2">{practice.practiceAction}</p>
          </section>
        )}

        {/* Time settings */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            時間設定
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <InfoCell label="開始日期" value={formatDate(practice.startDate)} />
            <InfoCell label="結束日期" value={formatDate(practice.endDate)} />
            {practice.durationDays !== undefined && (
              <InfoCell label="持續天數" value={`${practice.durationDays} 天`} />
            )}
            {practice.sessionDurationMinutes !== undefined && (
              <InfoCell label="每次時長" value={`${practice.sessionDurationMinutes} 分鐘`} />
            )}
          </div>
          {hasFrequency && (
            <div className="mt-2">
              <InfoCell label="頻率" value={getFrequencyLabel()} />
            </div>
          )}
          {practice.practiceTimePeriods.length > 0 && (
            <div className="mt-2 bg-muted/40 rounded-lg px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-1.5">實踐時段</p>
              <div className="flex flex-wrap gap-1">
                {practice.practiceTimePeriods.map((period) => (
                  <Badge key={period} variant="default">
                    {period}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Progress */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            進度追蹤
          </h3>
          {practice.progressPercentage !== undefined && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">完成進度</span>
                <span className="text-xs font-semibold text-primary">
                  {Math.round(practice.progressPercentage)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, practice.progressPercentage)}%` }}
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 text-center">
              <p className="text-xl font-bold text-foreground">{practice.checkInCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">打卡次數</p>
            </div>
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 text-center">
              <p className="text-sm font-medium text-foreground">
                {formatDate(practice.firstCheckinAt)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">首次打卡</p>
            </div>
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 text-center">
              <p className="text-sm font-medium text-foreground">
                {formatDate(practice.lastCheckinAt)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">最近打卡</p>
            </div>
          </div>
        </section>

        {/* Social stats */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            社群互動
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {socialStats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-muted/40 rounded-lg p-2.5 text-center">
                <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-semibold">{value.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tags */}
        {practice.tags.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              標籤
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {practice.tags.map((tag) => (
                <Badge key={tag} variant="primary">
                  #{tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Metadata */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            系統資訊
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <InfoCell label="建立日期" value={formatDate(practice.createdAt)} />
            <InfoCell label="最後更新" value={formatDate(practice.updatedAt)} />
          </div>
        </section>
      </div>

      {/* Footer – status change */}
      <div className="border-t border-border p-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">變更狀態</span>
        <Select
          value={practice.status}
          onValueChange={(value) => onStatusChange(value as PracticeStatus)}
          disabled={isChangingStatus}
          options={[
            { value: 'draft', label: '草稿' },
            { value: 'not_started', label: '尚未開始' },
            { value: 'active', label: '活躍' },
            { value: 'completed', label: '已完成' },
            { value: 'archived', label: '已封存' },
          ]}
        />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PracticesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedPractice, setSelectedPractice] = useState<PracticeEntity | null>(null)
  const checkAllRef = useRef<HTMLInputElement>(null)

  // Filter state derived from URL
  const search = searchParams.get('q') ?? ''
  const statusFilter = (searchParams.get('status') ?? 'all') as 'all' | PracticeStatus
  const privacyFilter = searchParams.get('privacy') ?? 'all'
  const startDate = searchParams.get('from') ?? ''
  const endDate = searchParams.get('to') ?? ''
  const sort = (searchParams.get('sort') ?? 'createdAt') as SortField
  const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc'
  const currentPage = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('limit') ?? '20')

  function setFilter(updates: Record<string, string>, resetPage = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const defaults: Record<string, string> = {
        status: 'all',
        privacy: 'all',
        sort: 'createdAt',
        order: 'desc',
        limit: '20',
        q: '',
        from: '',
        to: '',
      }
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === defaults[key]) {
          next.delete(key)
        } else {
          next.set(key, value)
        }
      }
      if (resetPage) next.delete('page')
      return next
    })
  }

  function setPage(page: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (page <= 1) {
        next.delete('page')
      } else {
        next.set('page', String(page))
      }
      return next
    })
  }

  function handleSort(field: SortField) {
    if (sort === field) {
      setFilter({ sort: field, order: order === 'desc' ? 'asc' : 'desc' })
    } else {
      setFilter({ sort: field, order: 'desc' })
    }
  }

  const queryClient = useQueryClient()
  const { data: practiceStats } = usePracticeStats()

  const { data: practicesResponse, isFetching } = useQuery({
    queryKey: [
      'admin',
      'practices',
      currentPage,
      pageSize,
      search,
      statusFilter,
      privacyFilter,
      startDate,
      endDate,
      sort,
      order,
    ],
    queryFn: () =>
      listPractices({
        page: currentPage,
        limit: pageSize,
        query: search || undefined,
        status: statusFilter,
        privacyStatus: privacyFilter === 'all' ? undefined : privacyFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sort,
        order,
      }).then((r) => r.data),
  })

  const { mutate: changeStatus, isPending: isChangingStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PracticeStatus }) =>
      updatePracticeStatus(id, status),
    onMutate: ({ status }) => {
      setSelectedPractice((prev) => (prev ? { ...prev, status } : null))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'practices'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'practice-stats'] })
    },
  })

  const { mutate: batchChangeStatus, isPending: isBatchChanging } = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: PracticeStatus }) => {
      await Promise.all(ids.map((id) => updatePracticeStatus(id, status)))
    },
    onSuccess: () => {
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey: ['admin', 'practices'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'practice-stats'] })
    },
  })

  const practices = practicesResponse?.data ?? []
  const pagination = practicesResponse?.pagination
  const totalPages = pagination?.totalPages ?? 1
  const totalItems = pagination?.totalItems ?? 0

  const allPageSelected = practices.length > 0 && practices.every((p) => selectedIds.has(p.id))
  const somePageSelected = practices.some((p) => selectedIds.has(p.id)) && !allPageSelected

  if (checkAllRef.current) {
    checkAllRef.current.indeterminate = somePageSelected
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        for (const p of practices) next.delete(p.id)
      } else {
        for (const p of practices) next.add(p.id)
      }
      return next
    })
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const exportData = practices.map((p) => ({
    title: p.title,
    status: statusConfig[p.status].label,
    creator: p.user.name,
    createdAt: formatDate(p.createdAt),
    participants: p.checkInCount,
    views: p.stats.viewCount,
    likes: p.stats.likeCount,
    comments: p.stats.commentCount,
  }))

  const completionRateDisplay =
    practiceStats?.averageCompletionRate !== undefined
      ? `${Math.round(practiceStats.averageCompletionRate)}%`
      : '—'

  const totalCheckIns = practiceStats?.totalCheckIns ?? 0
  const avgCheckInsDisplay =
    practiceStats?.avgCheckInsPerPractice !== undefined
      ? practiceStats.avgCheckInsPerPractice.toFixed(1)
      : '—'

  return (
    <div className="space-y-6">
      <PageHeader
        title="主題實踐管理"
        description="管理島島各主題下的實踐任務，設定完成條件與對應積分。"
        actions={<ExportButton data={exportData} columns={exportColumns} fileName="practices" />}
      />

      {/* ── Section 1: 概覽 ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          title="總實踐數"
          value={practiceStats?.total ?? 0}
          icon={BookOpen}
          iconClassName="bg-primary/15 text-primary"
        />
        <StatCard
          title="活躍中"
          value={practiceStats?.active ?? 0}
          icon={Zap}
          iconClassName="bg-success/15 text-success"
        />
        <StatCard
          title="已完成"
          value={practiceStats?.completed ?? 0}
          icon={CheckCircle2}
          iconClassName="bg-warning/15 text-warning"
        />
        <StatCard
          title="平均完成率"
          value={completionRateDisplay}
          icon={BarChart3}
          iconClassName="bg-destructive/15 text-destructive"
        />
        <StatCard
          title="總打卡次數"
          value={totalCheckIns}
          icon={CalendarCheck}
          iconClassName="bg-info/15 text-info"
        />
        <StatCard
          title="平均打卡/實踐"
          value={avgCheckInsDisplay}
          icon={Activity}
          iconClassName="bg-accent text-accent-foreground"
          description="每個實踐的平均打卡次數"
        />
      </div>

      {/* ── Section 1b: 分布圖 ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-4">狀態分布</p>
          <StatusDistributionChart data={practiceStats?.practicesByStatus} />
        </div>
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-4">分類分布</p>
          <CategoryDistributionChart data={practiceStats?.practicesByCategory ?? []} />
        </div>
      </div>

      {/* ── Section 2: 篩選 ── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜尋實踐..."
              value={search}
              onChange={(e) => setFilter({ q: e.target.value })}
              className="w-full pl-9 pr-3"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setFilter({ status: v })}
            options={[
              { value: 'all', label: '全部狀態' },
              { value: 'active', label: '活躍' },
              { value: 'not_started', label: '尚未開始' },
              { value: 'draft', label: '草稿' },
              { value: 'completed', label: '已完成' },
              { value: 'archived', label: '已封存' },
            ]}
            triggerClassName="min-w-[120px]"
          />
          <Select
            value={privacyFilter}
            onValueChange={(v) => setFilter({ privacy: v })}
            options={[
              { value: 'all', label: '全部隱私' },
              { value: 'public', label: '公開' },
              { value: 'private', label: '私密' },
            ]}
            triggerClassName="min-w-[100px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="date-from" className="text-xs text-muted-foreground shrink-0">
              從
            </label>
            <Input
              id="date-from"
              type="date"
              value={startDate}
              onChange={(e) => setFilter({ from: e.target.value })}
              className="w-36 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="date-to" className="text-xs text-muted-foreground shrink-0">
              至
            </label>
            <Input
              id="date-to"
              type="date"
              value={endDate}
              onChange={(e) => setFilter({ to: e.target.value })}
              className="w-36 text-sm"
            />
          </div>
          <div className="ml-auto">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setFilter({ limit: v })}
              options={PAGE_SIZE_OPTIONS}
              triggerClassName="min-w-[100px]"
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: 批次操作 (conditional) ── */}
      {selectedIds.size > 0 && (
        <BatchActionBar
          count={selectedIds.size}
          onStatusChange={(status) => batchChangeStatus({ ids: Array.from(selectedIds), status })}
          onClear={() => setSelectedIds(new Set())}
          isPending={isBatchChanging}
        />
      )}

      {/* ── Section 4: 列表 ── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">
            實踐列表
            {totalItems > 0 && (
              <span className="ml-1.5 font-normal text-muted-foreground">
                · 共 {totalItems.toLocaleString()} 筆
              </span>
            )}
          </p>
          {isFetching && <span className="text-xs text-muted-foreground">更新中...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 w-10">
                  <input
                    ref={checkAllRef}
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="rounded border-input accent-primary"
                  />
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">標題</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">狀態</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">建立者</th>
                <SortableHeader
                  label="建立日期"
                  field="createdAt"
                  currentSort={sort}
                  currentOrder={order}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">打卡次數</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">瀏覽數</th>
                <SortableHeader
                  label="迴響數"
                  field="likeCount"
                  currentSort={sort}
                  currentOrder={order}
                  onSort={handleSort}
                  align="right"
                />
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">留言數</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {practices.map((practice) => {
                const status = statusConfig[practice.status]
                const isSelected = selectedIds.has(practice.id)
                return (
                  <tr
                    key={practice.id}
                    className={cn(
                      'border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0',
                      isSelected && 'bg-primary/5',
                    )}
                  >
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(practice.id)}
                        className="rounded border-input accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <button
                        type="button"
                        className="font-medium text-foreground hover:text-primary transition-colors text-left leading-snug"
                        onClick={() => setSelectedPractice(practice)}
                      >
                        {practice.title}
                      </button>
                      {practice.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {practice.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-block bg-muted rounded px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                          {practice.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{practice.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                          status.className,
                        )}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <UserLink
                        userId={practice.user.id}
                        name={practice.user.name}
                        photoURL={practice.user.photoURL}
                        className="text-muted-foreground max-w-[140px]"
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(practice.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {practice.checkInCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {practice.stats.viewCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {practice.stats.likeCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {practice.stats.commentCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPractice(practice)}
                      >
                        查看
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {practices.length === 0 && (
                <tr>
                  <td className="px-5 py-10 text-center text-muted-foreground" colSpan={10}>
                    {isFetching ? '載入中...' : '沒有符合條件的實踐'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 5: 分頁 ── */}
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          size="icon"
          onClick={() => setPage(currentPage - 1)}
          disabled={!pagination?.hasPrev}
          variant="outline"
          className="px-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-sm text-muted-foreground">
          第 {currentPage} / {totalPages} 頁
        </span>
        <Button
          type="button"
          size="icon"
          onClick={() => setPage(currentPage + 1)}
          disabled={!pagination?.hasNext}
          variant="outline"
          className="px-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Detail Panel */}
      <Sheet
        open={selectedPractice !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPractice(null)
        }}
      >
        <SheetContent>
          {selectedPractice && (
            <PracticeDetail
              practice={selectedPractice}
              onClose={() => setSelectedPractice(null)}
              onStatusChange={(status) => changeStatus({ id: selectedPractice.id, status })}
              isChangingStatus={isChangingStatus}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
