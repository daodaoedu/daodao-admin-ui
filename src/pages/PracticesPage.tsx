import { BookOpen, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { ExportButton } from '@/components/ExportButton'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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

const fallbackPractices: Practice[] = []

const statusMap: Record<PracticeStatus, { label: string; className: string }> = {
  active: {
    label: '活躍',
    className: 'bg-success/15 text-success',
  },
  inactive: {
    label: '停用',
    className: 'bg-muted text-muted-foreground',
  },
  draft: {
    label: '草稿',
    className: 'bg-warning/15 text-warning',
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

  const filtered = (fallbackPractices ?? [])
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
          <Input
            type="text"
            placeholder="搜尋實踐..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as 'all' | PracticeStatus)}
          options={[
            { value: 'all', label: '全部狀態' },
            { value: 'active', label: '活躍' },
            { value: 'inactive', label: '停用' },
            { value: 'draft', label: '草稿' },
          ]}
          triggerClassName="admin-control"
        />
        <Select
          value={sort}
          onValueChange={(v) => setSort(v as 'createdAt' | 'likes' | 'participants')}
          options={[
            { value: 'createdAt', label: '建立日期' },
            { value: 'likes', label: '按讚數' },
            { value: 'participants', label: '參與人數' },
          ]}
          triggerClassName="admin-control"
        />
      </div>

      {/* Table */}
      <div className="admin-panel-card overflow-x-auto">
        <table className="admin-table-shell text-sm">
          <thead>
            <tr className="admin-table-head">
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
                <tr key={practice.id} className="admin-table-row last:border-0 transition-colors">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => alert('功能開發中')}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        practice.status === 'active'
                          ? 'bg-muted text-muted-foreground hover:bg-muted'
                          : 'bg-success/15 text-success hover:text-success',
                      )}
                    >
                      {practice.status === 'active' ? '停用' : '啟用'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1">
        <Button
          type="button"
          size="icon"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          variant="outline"
          className="px-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {[1, 2, 3].map((page) => (
          <Button
            key={page}
            type="button"
            size="sm"
            onClick={() => setCurrentPage(page)}
            variant={currentPage === page ? 'primary' : 'outline'}
            className={cn(
              'h-9 w-9',
              currentPage === page && 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {page}
          </Button>
        ))}
        <Button
          type="button"
          size="icon"
          onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
          disabled={currentPage === 3}
          variant="outline"
          className="px-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
