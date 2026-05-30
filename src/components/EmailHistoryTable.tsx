import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import { getEmailHistory } from '@/api/admin-system'
import type { EmailHistoryItem, EmailHistoryResponse } from '@/api/types'

interface EmailHistoryParams {
  status?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  recipient?: string
  emailType?: string
  startDate?: string
  endDate?: string
}

const STATUS_OPTIONS = [
  { value: '', label: '全部狀態' },
  { value: 'sent', label: '已發送' },
  { value: 'failed', label: '失敗' },
  { value: 'pending', label: '待發送' },
]

const STATUS_BADGE: Record<string, string> = {
  sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
}

const STATUS_LABEL: Record<string, string> = {
  sent: '已發送',
  failed: '失敗',
  pending: '待發送',
}

const PAGE_SIZE = 20

export function EmailHistoryTable() {
  const [filters, setFilters] = useState<EmailHistoryParams>({
    status: 'failed',
    page: 1,
    limit: PAGE_SIZE,
    sortBy: 'sentAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'email-history', filters],
    queryFn: () =>
      getEmailHistory({
        limit: filters.limit,
        offset: filters.page ? (filters.page - 1) * (filters.limit ?? PAGE_SIZE) : 0,
        status: filters.status,
      }).then((r: { data: { data: EmailHistoryResponse } }) => r.data.data),
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters((prev: EmailHistoryParams) => ({
      ...prev,
      recipient: searchInput || undefined,
      page: 1,
    }))
  }

  const items = data?.items ?? []
  const pagination = data?.pagination

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="heading-sm mb-4">郵件發送紀錄</h2>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜尋收件人 email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-56 rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              搜尋
            </button>
          </form>

          {/* Status filter */}
          <select
            value={filters.status ?? ''}
            onChange={(e) =>
              setFilters((prev: EmailHistoryParams) => ({
                ...prev,
                status: e.target.value || undefined,
                page: 1,
              }))
            }
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Email type filter */}
          <input
            type="text"
            placeholder="郵件類型"
            value={filters.emailType ?? ''}
            onChange={(e) =>
              setFilters((prev: EmailHistoryParams) => ({
                ...prev,
                emailType: e.target.value || undefined,
                page: 1,
              }))
            }
            className="w-32 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Date range */}
          <input
            type="date"
            value={filters.startDate ?? ''}
            onChange={(e) =>
              setFilters((prev: EmailHistoryParams) => ({
                ...prev,
                startDate: e.target.value || undefined,
                page: 1,
              }))
            }
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-sm text-muted-foreground">~</span>
          <input
            type="date"
            value={filters.endDate ?? ''}
            onChange={(e) =>
              setFilters((prev: EmailHistoryParams) => ({
                ...prev,
                endDate: e.target.value || undefined,
                page: 1,
              }))
            }
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">載入中…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            沒有符合條件的郵件紀錄
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">收件人</th>
                <th className="px-5 py-3 font-medium">主旨</th>
                <th className="px-5 py-3 font-medium">類型</th>
                <th className="px-5 py-3 font-medium">狀態</th>
                <th className="px-5 py-3 font-medium">發送時間</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: EmailHistoryItem) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-5 py-3 font-mono text-xs">{item.recipient}</td>
                  <td className="max-w-[200px] truncate px-5 py-3">{item.subject}</td>
                  <td className="px-5 py-3 text-xs">{item.type}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {STATUS_LABEL[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {item.sentAt ? new Date(item.sentAt).toLocaleString('zh-TW') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-muted-foreground">共 {pagination.total_count} 筆</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setFilters((prev: EmailHistoryParams) => ({
                  ...prev,
                  page: (prev.page ?? 1) - 1,
                }))
              }
              disabled={!filters.page || filters.page <= 1}
              className="rounded-md border border-border p-1 hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm">第 {filters.page ?? 1} 頁</span>
            <button
              type="button"
              onClick={() =>
                setFilters((prev: EmailHistoryParams) => ({
                  ...prev,
                  page: (prev.page ?? 1) + 1,
                }))
              }
              disabled={!pagination.has_next}
              className="rounded-md border border-border p-1 hover:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
