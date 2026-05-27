import { Lock, Search } from 'lucide-react'
import { useState } from 'react'
import { ExportButton } from '@/components/ExportButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  登入: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  角色變更: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  用戶停用: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  設定修改: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  資料匯出: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  通知發送: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
}

const mockLogs: AuditLogItem[] = [
  {
    id: 1,
    time: '2025-12-20 14:32:10',
    admin: 'Admin1',
    actionType: '登入',
    target: '系統',
    detail: '管理員 Admin1 登入後台',
    ip: '192.168.1.100',
  },
  {
    id: 2,
    time: '2025-12-20 14:15:45',
    admin: 'Admin1',
    actionType: '角色變更',
    target: '用戶 #123',
    detail: '將用戶 #123 角色從 member 改為 moderator',
    ip: '192.168.1.100',
  },
  {
    id: 3,
    time: '2025-12-20 13:50:22',
    admin: 'Admin2',
    actionType: '用戶停用',
    target: '用戶 #456',
    detail: '因違規行為停用用戶 #456 帳號',
    ip: '10.0.0.55',
  },
  {
    id: 4,
    time: '2025-12-20 11:20:00',
    admin: 'Admin1',
    actionType: '設定修改',
    target: '系統設定',
    detail: '修改站內通知預設頻率為每週一次',
    ip: '192.168.1.100',
  },
  {
    id: 5,
    time: '2025-12-19 17:00:30',
    admin: 'Admin2',
    actionType: '資料匯出',
    target: '用戶資料',
    detail: '匯出 2025 年 12 月用戶清單（CSV）',
    ip: '10.0.0.55',
  },
  {
    id: 6,
    time: '2025-12-19 16:45:10',
    admin: 'Admin1',
    actionType: '通知發送',
    target: '全體用戶',
    detail: '發送系統維護公告通知至全體用戶',
    ip: '192.168.1.100',
  },
  {
    id: 7,
    time: '2025-12-19 10:30:00',
    admin: 'Admin2',
    actionType: '登入',
    target: '系統',
    detail: '管理員 Admin2 登入後台',
    ip: '10.0.0.55',
  },
  {
    id: 8,
    time: '2025-12-18 15:20:18',
    admin: 'Admin1',
    actionType: '角色變更',
    target: '用戶 #789',
    detail: '將用戶 #789 角色從 guest 改為 member',
    ip: '192.168.1.100',
  },
  {
    id: 9,
    time: '2025-12-18 09:10:05',
    admin: 'Admin2',
    actionType: '設定修改',
    target: 'AI 服務',
    detail: '調整 AI 助手每日免費使用次數從 5 改為 10',
    ip: '10.0.0.55',
  },
  {
    id: 10,
    time: '2025-12-17 14:55:33',
    admin: 'Admin1',
    actionType: '用戶停用',
    target: '用戶 #321',
    detail: '因帳號異常活動停用用戶 #321 帳號',
    ip: '192.168.1.100',
  },
]

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

  const allLogs = (apiData?.items as unknown as AuditLogItem[] | undefined) ?? mockLogs

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">審計日誌</h1>
        <ExportButton
          data={filtered as unknown as Record<string, unknown>[]}
          columns={exportColumns}
          fileName="audit-log"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">管理員</label>
          <select
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={adminFilter}
            onChange={(e) => {
              setAdminFilter(e.target.value)
              setPage(1)
            }}
          >
            {adminOptions.map((a) => (
              <option key={a} value={a}>
                {a === '全部' ? '全部管理員' : a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">操作類型</label>
          <select
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
          >
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {a === '全部' ? '全部類型' : a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">起始日期</label>
          <Input
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
          <label className="mb-1 block text-xs font-medium text-muted-foreground">結束日期</label>
          <Input
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
          <label className="mb-1 block text-xs font-medium text-muted-foreground">全文搜尋</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
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
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-muted-foreground">
              {['時間', '管理員', '操作類型', '目標', '詳情', 'IP'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  無符合條件的日誌
                </td>
              </tr>
            ) : (
              paginated.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border last:border-0 hover:bg-accent transition-colors"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{log.time}</td>
                  <td className="px-4 py-3 font-medium">{log.admin}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        actionBadgeClass[log.actionType],
                      )}
                    >
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.target}</td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">{log.detail}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.ip}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">合規鎖定</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          鎖定期間內的日誌不會被自動清除，以符合稽核與合規需求。
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              鎖定起始日期
            </label>
            <Input
              type="date"
              className="w-44"
              value={lockFrom}
              onChange={(e) => setLockFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              鎖定結束日期
            </label>
            <Input
              type="date"
              className="w-44"
              value={lockTo}
              onChange={(e) => setLockTo(e.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={() =>
              alert(lockFrom && lockTo ? `已啟用鎖定：${lockFrom} ~ ${lockTo}` : '請先選擇日期範圍')
            }
          >
            <Lock className="h-4 w-4" />
            啟用鎖定
          </Button>
        </div>
      </div>
    </div>
  )
}
