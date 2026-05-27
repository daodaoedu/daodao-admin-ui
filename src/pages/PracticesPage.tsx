import { BookOpen, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { ExportButton } from '@/components/ExportButton'
import { StatCard } from '@/components/StatCard'
import { usePracticeStats } from '@/hooks/usePracticeStats'
import { cn } from '@/lib/utils'

type PracticeStatus = 'active' | 'inactive' | 'draft'

interface Practice {
  id: number
  title: string
  status: PracticeStatus
  creator: string
  createdAt: string
  participants: number
  likes: number
}

const mockPractices: Practice[] = [
  {
    id: 1,
    title: '每日冥想 10 分鐘',
    status: 'active',
    creator: '陳小明',
    createdAt: '2025-12-01',
    participants: 320,
    likes: 89,
  },
  {
    id: 2,
    title: '閱讀一本好書',
    status: 'active',
    creator: '林美玲',
    createdAt: '2025-11-15',
    participants: 256,
    likes: 72,
  },
  {
    id: 3,
    title: '每週運動三次',
    status: 'active',
    creator: '王大華',
    createdAt: '2025-10-20',
    participants: 198,
    likes: 65,
  },
  {
    id: 4,
    title: '感恩日記',
    status: 'inactive',
    creator: '張小芳',
    createdAt: '2025-09-10',
    participants: 145,
    likes: 43,
  },
  {
    id: 5,
    title: '數位排毒挑戰',
    status: 'active',
    creator: '李志明',
    createdAt: '2025-08-05',
    participants: 112,
    likes: 38,
  },
  {
    id: 6,
    title: '早起習慣養成',
    status: 'draft',
    creator: '黃雅琪',
    createdAt: '2025-07-22',
    participants: 0,
    likes: 12,
  },
  {
    id: 7,
    title: '每日學習 30 分鐘',
    status: 'active',
    creator: '劉建國',
    createdAt: '2025-06-18',
    participants: 95,
    likes: 29,
  },
  {
    id: 8,
    title: '斷捨離生活實踐',
    status: 'inactive',
    creator: '吳佳蓉',
    createdAt: '2025-05-30',
    participants: 108,
    likes: 34,
  },
]

const statusMap: Record<PracticeStatus, { label: string; className: string }> = {
  active: {
    label: '活躍',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  inactive: {
    label: '停用',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  },
  draft: {
    label: '草稿',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
}

const exportColumns = [
  { key: 'title', header: '標題' },
  { key: 'status', header: '狀態' },
  { key: 'creator', header: '建立者' },
  { key: 'createdAt', header: '建立日期' },
  { key: 'participants', header: '參與人數' },
  { key: 'likes', header: '按讚數' },
]

export function PracticesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PracticeStatus>('all')
  const [sort, setSort] = useState<'createdAt' | 'likes' | 'participants'>('createdAt')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: practiceStats } = usePracticeStats()

  const filtered = mockPractices
    .filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'createdAt') return b.createdAt.localeCompare(a.createdAt)
      if (sort === 'likes') return b.likes - a.likes
      return b.participants - a.participants
    })

  const exportData = filtered.map((p) => ({
    ...p,
    status: statusMap[p.status].label,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">主題實踐管理</h1>
        <ExportButton data={exportData} columns={exportColumns} fileName="practices" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="總實踐數" value={practiceStats?.total ?? 42} icon={BookOpen} />
        <StatCard
          title="活躍中"
          value={practiceStats?.active ?? 28}
          change={5.2}
          changeLabel="較上月"
        />
        <StatCard
          title="總打卡次數"
          value={practiceStats?.totalCheckIns?.toLocaleString() ?? '1,234'}
          icon={Users}
          change={12.3}
          changeLabel="較上月"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜尋實踐..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | PracticeStatus)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">全部狀態</option>
          <option value="active">活躍</option>
          <option value="inactive">停用</option>
          <option value="draft">草稿</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'createdAt' | 'likes' | 'participants')}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="createdAt">建立日期</option>
          <option value="likes">按讚數</option>
          <option value="participants">參與人數</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 font-medium text-muted-foreground">標題</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">狀態</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">建立者</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">建立日期</th>
              <th className="px-5 py-3 font-medium text-muted-foreground text-right">參與人數</th>
              <th className="px-5 py-3 font-medium text-muted-foreground text-right">按讚數</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((practice) => {
              const status = statusMap[practice.status]
              return (
                <tr
                  key={practice.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium">{practice.title}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{practice.creator}</td>
                  <td className="px-5 py-3 text-muted-foreground">{practice.createdAt}</td>
                  <td className="px-5 py-3 text-right">{practice.participants.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">{practice.likes.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        practice.status === 'active'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
                      )}
                    >
                      {practice.status === 'active' ? '停用' : '啟用'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center rounded-md border border-border p-2 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {[1, 2, 3].map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setCurrentPage(page)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors',
              currentPage === page
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:bg-accent',
            )}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
          disabled={currentPage === 3}
          className="inline-flex items-center justify-center rounded-md border border-border p-2 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
