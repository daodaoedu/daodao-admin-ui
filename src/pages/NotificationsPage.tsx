import { Bell, Clock, Eye, Loader2, Megaphone, Plus } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { useAdminNotificationStats, useAdminNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

const typeBadgeClass: Record<string, string> = {
  公告: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  提醒: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  系統通知: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const statusClass: Record<string, string> = {
  sent: 'text-green-600 dark:text-green-400',
  scheduled: 'text-blue-600 dark:text-blue-400',
  draft: 'text-muted-foreground',
}

const statusLabel: Record<string, string> = {
  sent: '已發送',
  scheduled: '排程中',
  draft: '草稿',
}

export function NotificationsPage() {
  const { data: listData, isLoading: listLoading } = useAdminNotifications()
  const { data: stats, isLoading: statsLoading } = useAdminNotificationStats()

  const notifications = listData?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="站內通知"
        description="向全體或特定用戶發送站內通知，管理通知類型與已讀狀態。"
        actions={
          <button
            type="button"
            onClick={() => alert('功能開發中')}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            建立通知
          </button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="總發送"
          value={statsLoading ? '—' : (stats?.totalSent ?? '—')}
          icon={Megaphone}
        />
        <StatCard
          title="平均已讀率"
          value={statsLoading ? '—' : stats ? `${stats.avgReadRate}%` : '—'}
          icon={Eye}
        />
        <StatCard
          title="排程中"
          value={statsLoading ? '—' : (stats?.scheduled ?? '—')}
          icon={Clock}
        />
      </div>

      {/* Notification History Table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
          通知紀錄
        </h2>
        {listLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">載入中…</span>
          </div>
        ) : notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">尚無通知紀錄</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">標題</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">類型</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">目標</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">發送時間</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">已讀率</th>
                  <th className="pb-3 font-medium text-muted-foreground">狀態</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => {
                  const readRate =
                    n.total_sent > 0 ? Math.round((n.read_count / n.total_sent) * 100 * 10) / 10 : 0

                  return (
                    <tr key={n.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          {n.title}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                            typeBadgeClass[n.type] ??
                              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                          )}
                        >
                          {n.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{n.target}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{n.sent_at ?? '-'}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {n.status === 'sent' ? `${readRate}%` : '-'}
                      </td>
                      <td className={cn('py-3 text-sm font-medium', statusClass[n.status])}>
                        {statusLabel[n.status] ?? n.status}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
