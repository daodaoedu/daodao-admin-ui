import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'
import { listQueryLogs } from '@/api/admin-ai'
import type { AIQueryLog, QueryLogFilters } from '@/api/types'
import { ExportButton } from '@/components/ExportButton'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const LIMIT = 50

export function QueryLogsPage() {
  const [filters, setFilters] = useState<QueryLogFilters>({})
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<AIQueryLog | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['query-logs', filters, offset],
    queryFn: () => listQueryLogs({ ...filters, limit: LIMIT, offset }).then((r) => r.data),
  })

  const logs = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI 查詢日誌"
        description="瀏覽所有 AI 對話記錄，分析使用模式、查詢品質與異常請求。"
        actions={
          <ExportButton
            data={logs as unknown as Record<string, unknown>[]}
            fileName="query-logs"
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'backend', header: 'Backend' },
              { key: 'context', header: 'Context' },
              { key: 'user_id', header: 'User' },
              { key: 'total_tokens', header: 'Tokens' },
              { key: 'cost_usd', header: 'Cost (USD)' },
              { key: 'latency_ms', header: 'Latency (ms)' },
              { key: 'finish_reason', header: 'Finish' },
              { key: 'status', header: 'Status' },
              { key: 'created_at', header: '時間' },
            ]}
          />
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['backend', 'context', 'status'] as const).map((field) => (
          <Input
            key={field}
            placeholder={field}
            aria-label={`Filter by ${field}`}
            className="w-auto"
            value={(filters as Record<string, string>)[field] ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, [field]: e.target.value || undefined }))
              setOffset(0)
            }}
          />
        ))}
        <Input
          type="date"
          aria-label="Filter by start date"
          className="w-auto"
          value={filters.date_from ?? ''}
          onChange={(e) => {
            setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))
            setOffset(0)
          }}
        />
        <Input
          type="date"
          aria-label="Filter by end date"
          className="w-auto"
          value={filters.date_to ?? ''}
          onChange={(e) => {
            setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))
            setOffset(0)
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="text-left">
              {[
                'ID',
                'Backend',
                'Context',
                'User',
                'Tokens',
                'Cost (USD)',
                'Latency',
                'Finish',
                'Status',
                '時間',
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                  載入中...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                  無資料
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(selected?.id === log.id ? null : log)}
                >
                  <TableCell className="font-mono text-xs">{log.id}</TableCell>
                  <TableCell>
                    <Badge variant="primary">{log.backend}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.context ?? '-'}</TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[100px]">
                    {log.user_id ?? '-'}
                  </TableCell>
                  <TableCell>{log.total_tokens?.toLocaleString() ?? '-'}</TableCell>
                  <TableCell>
                    {log.cost_usd ? `$${Number(log.cost_usd).toFixed(5)}` : '-'}
                  </TableCell>
                  <TableCell>
                    {log.latency_ms
                      ? log.latency_ms >= 1000
                        ? `${(log.latency_ms / 1000).toFixed(1)}s`
                        : `${log.latency_ms}ms`
                      : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.finish_reason ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'success' : 'error'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), 'MM-dd HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <h3 className="mb-3 font-semibold">Log #{selected.id} 詳情</h3>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
            {JSON.stringify(selected, null, 2)}
          </pre>
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>共 {pagination.total_count} 筆</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className="px-3 disabled:opacity-40"
            >
              上一頁
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={!pagination.has_next}
              onClick={() => setOffset(offset + LIMIT)}
              className="px-3 disabled:opacity-40"
            >
              下一頁
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
