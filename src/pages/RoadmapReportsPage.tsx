import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getRoadmapReport } from '@/api/admin-roadmap'
import { PageHeader } from '@/components/PageHeader'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CATEGORY_LABELS, ROADMAP_STATUS_LABELS } from '@/constants/wishpool'

type Range = 'week' | 'month' | 'quarter' | 'year'

const RANGE_OPTIONS = [
  { value: 'week', label: '本週' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '近三月' },
  { value: 'year', label: '近一年' },
]

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function RoadmapReportsPage() {
  const [range, setRange] = useState<Range>('month')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-roadmap-report', range],
    queryFn: () => getRoadmapReport({ range }).then((r) => r.data.data),
  })

  const categoryChart = (data?.popularCategories ?? []).map((c) => ({
    name: CATEGORY_LABELS[c.category],
    count: c.count,
  }))
  const trendChart = (data?.wishTrend ?? []).map((t) => ({ period: t.period, count: t.count }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="許願池趨勢報表"
        description="統計用戶功能需求投票，分析熱門需求排行與票數變化趨勢。"
        actions={
          <div className="w-40">
            <Select
              value={range}
              onValueChange={(v) => setRange(v as Range)}
              options={RANGE_OPTIONS}
            />
          </div>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : error || !data ? (
        <p className="text-sm text-destructive">載入失敗</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="待處理許願" value={String(data.backlog.pendingCount)} />
            <StatCard
              label="最舊待處理等待"
              value={
                data.backlog.oldestPendingWaitingHours === null
                  ? '-'
                  : `${data.backlog.oldestPendingWaitingHours} 小時`
              }
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
              熱門分類（許願量）
            </h2>
            {categoryChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">期間內無資料</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categoryChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v} 則`, '許願量']} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
              許願量趨勢
            </h2>
            {trendChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">期間內無資料</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v} 則`, '許願量']} />
                  <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
              熱門項目（依票數）
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>標題</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>票數</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.popularItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-4 text-center text-muted-foreground">
                      無資料
                    </TableCell>
                  </TableRow>
                ) : (
                  data.popularItems.map((it) => (
                    <TableRow key={it.external_id}>
                      <TableCell>{it.title}</TableCell>
                      <TableCell>{ROADMAP_STATUS_LABELS[it.status]}</TableCell>
                      <TableCell className="font-medium">{it.support_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
