import { useMutation } from '@tanstack/react-query'
import { Lock, Search } from 'lucide-react'
import { useState } from 'react'
import { createComplianceHold } from '@/api/admin-audit'
import { ExportButton } from '@/components/ExportButton'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { cn } from '@/lib/utils'

type ActionType = '登入' | '角色變更' | '用戶停用' | '設定修改' | '資料匯出' | '通知發送'

interface AuditLogItem {
  id: number
  time: string
  admin: string
  actionType: ActionType
  target: string
  detail: string
  ip: string
}

const actionBadgeClass: Record<ActionType, string> = {
  登入: 'bg-success/15 text-success',
  角色變更: 'bg-info/15 text-info',
  用戶停用: 'bg-destructive/15 text-destructive',
  設定修改: 'bg-warning/15 text-warning',
  資料匯出: 'bg-info/15 text-info',
  通知發送: 'bg-info/15 text-info',
}

const adminOptions = ['全部', 'Admin1', 'Admin2'] as const
const actionOptions: ('全部' | ActionType)[] = [
  '全部',
  '登入',
  '角色變更',
  '用戶停用',
  '設定修改',
  '資料匯出',
  '通知發送',
]
const ADMIN_FILTER_OPTIONS = adminOptions.map((admin) => ({
  value: admin,
  label: admin === '全部' ? '全部管理員' : admin,
}))
const ACTION_FILTER_OPTIONS = actionOptions.map((action) => ({
  value: action,
  label: action === '全部' ? '全部類型' : action,
}))

const exportColumns = [
  { key: 'time', header: '時間' },
  { key: 'admin', header: '管理員' },
  { key: 'actionType', header: '操作類型' },
  { key: 'target', header: '目標' },
  { key: 'detail', header: '詳情' },
  { key: 'ip', header: 'IP' },
]

export function AuditLogPage() {
  const [adminFilter, setAdminFilter] = useState<string>('全部')
  const [actionFilter, setActionFilter] = useState<string>('全部')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [lockFrom, setLockFrom] = useState('')
  const [lockTo, setLockTo] = useState('')

  const complianceHoldMutation = useMutation({
    mutationFn: (body: { dateFrom: string; dateTo: string }) => createComplianceHold(body),
  })

  const PAGE_SIZE = 5

  const { data: apiData } = useAuditLogs({
    admin: adminFilter !== '全部' ? adminFilter : undefined,
    actionType: actionFilter !== '全部' ? actionFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: searchText || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const allLogs = (apiData?.items as unknown as AuditLogItem[] | undefined) ?? []

  const filtered = allLogs.filter((log) => {
    if (adminFilter !== '全部' && log.admin !== adminFilter) return false
    if (actionFilter !== '全部' && log.actionType !== actionFilter) return false
    if (dateFrom && log.time < dateFrom) return false
    if (dateTo && log.time.slice(0, 10) > dateTo) return false
    if (searchText) {
      const q = searchText.toLowerCase()
      const haystack =
        `${log.admin} ${log.actionType} ${log.target} ${log.detail} ${log.ip}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const serverTotal = apiData?.total ?? filtered.length
  const totalPages = Math.max(1, Math.ceil(serverTotal / PAGE_SIZE))
  const paginated = apiData?.items
    ? filtered
    : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader
        title="審計日誌"
        description="追蹤所有管理員操作記錄，確保操作可稽核、可追溯，符合資安合規需求。"
        actions={
          <ExportButton
            data={filtered as unknown as Record<string, unknown>[]}
            columns={exportColumns}
            fileName="audit-log"
          />
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="audit-admin-filter"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            管理員
          </label>
          <Select
            id="audit-admin-filter"
            value={adminFilter}
            onValueChange={(value) => {
              setAdminFilter(value)
              setPage(1)
            }}
            options={ADMIN_FILTER_OPTIONS}
            triggerClassName="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 h-9 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>

        <div>
          <label
            htmlFor="audit-action-filter"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            操作類型
          </label>
          <Select
            id="audit-action-filter"
            value={actionFilter}
            onValueChange={(value) => {
              setActionFilter(value)
              setPage(1)
            }}
            options={ACTION_FILTER_OPTIONS}
            triggerClassName="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 h-9 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>

        <div>
          <label
            htmlFor="audit-date-from"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            起始日期
          </label>
          <Input
            id="audit-date-from"
            type="date"
            className="w-40"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div>
          <label
            htmlFor="audit-date-to"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            結束日期
          </label>
          <Input
            id="audit-date-to"
            type="date"
            className="w-40"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div>
          <label
            htmlFor="audit-search"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            全文搜尋
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="audit-search"
              placeholder="搜尋..."
              className="w-52 pl-8"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {['時間', '管理員', '操作類型', '目標', '詳情', 'IP'].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  無符合條件的日誌
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">{log.time}</TableCell>
                  <TableCell className="font-medium">{log.admin}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        actionBadgeClass[log.actionType],
                      )}
                    >
                      {log.actionType}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.target}</TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">{log.detail}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {log.ip}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          共 {filtered.length} 筆日誌，第 {page}/{totalPages} 頁
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 disabled:opacity-40"
          >
            上一頁
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="xs"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 disabled:opacity-40"
          >
            下一頁
          </Button>
        </div>
      </div>

      {/* Compliance Lock Section */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            合規鎖定
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          鎖定期間內的日誌不會被自動清除，以符合稽核與合規需求。
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="audit-lock-from"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              鎖定起始日期
            </label>
            <Input
              id="audit-lock-from"
              type="date"
              className="w-44"
              value={lockFrom}
              onChange={(e) => setLockFrom(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="audit-lock-to"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              鎖定結束日期
            </label>
            <Input
              id="audit-lock-to"
              type="date"
              className="w-44"
              value={lockTo}
              onChange={(e) => setLockTo(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={complianceHoldMutation.isPending}
            onClick={() => {
              if (!lockFrom || !lockTo) {
                alert('請先選擇日期範圍')
                return
              }
              complianceHoldMutation.mutate(
                { dateFrom: lockFrom, dateTo: lockTo },
                {
                  onSuccess: () => alert(`已啟用鎖定：${lockFrom} ~ ${lockTo}`),
                  onError: () => alert('鎖定失敗，請稍後再試'),
                },
              )
            }}
          >
            <Lock className="h-4 w-4" />
            啟用鎖定
          </Button>
        </div>
      </div>
    </div>
  )
}
