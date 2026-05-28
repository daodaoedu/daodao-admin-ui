import { Bell, Clock, Eye, Megaphone, Plus } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

const typeBadgeClass: Record<string, string> = {
  公告: 'bg-info/15 text-info',
  提醒: 'bg-warning/15 text-warning',
  系統通知: 'bg-muted text-muted-foreground',
}

const statusClass: Record<string, string> = {
  已發送: 'text-success',
  排程中: 'text-info',
  草稿: 'text-muted-foreground',
}

export function NotificationsPage() {
  const { data: apiData } = useNotifications()

  const notifications = apiData?.items ?? []
  const stats = apiData?.stats ?? {
    totalSent: 0,
    avgReadRate: 0,
    scheduled: 0,
    sentChange: 0,
    readRateChange: 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">站內通知</h1>
        <Button type="button" onClick={() => alert('功能開發中')}>
          <Plus className="h-4 w-4" />
          建立通知
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="總發送"
          value={stats.totalSent}
          icon={Megaphone}
          change={stats.sentChange}
          changeLabel="較上月"
        />
        <StatCard
          title="平均已讀率"
          value={`${stats.avgReadRate}%`}
          icon={Eye}
          change={stats.readRateChange}
          changeLabel="較上月"
        />
        <StatCard title="排程中" value={stats.scheduled} icon={Clock} />
      </div>

      {/* Notification History Table */}
      <div className="admin-panel-card p-5">
        <h2 className="heading-sm mb-4">通知紀錄</h2>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">標題</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">類型</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">目標</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">發送時間</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">已讀率</th>
                <th className="pb-3 font-medium text-muted-foreground">狀態</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.title} className="admin-table-row last:border-0">
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
                        typeBadgeClass[n.type],
                      )}
                    >
                      {n.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{n.target}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{n.sentAt || '-'}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {n.status === '已發送' ? `${n.readRate}%` : '-'}
                  </td>
                  <td className={cn('py-3 text-sm font-medium', statusClass[n.status])}>
                    {n.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
