import { Bell, Clock, Eye, Megaphone, Plus } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'
import type { NotificationListResponse } from '@/api/admin-communication'

const mockNotifications = [
  {
    title: '系統維護公告',
    type: '公告',
    target: '全體',
    sentAt: '2025-12-20 14:00',
    readRate: 81,
    status: '已發送',
  },
  {
    title: '新功能上線通知',
    type: '公告',
    target: '全體',
    sentAt: '2025-12-19 10:00',
    readRate: 76,
    status: '已發送',
  },
  {
    title: '打卡提醒',
    type: '提醒',
    target: 'VIP 標籤',
    sentAt: '2025-12-18 08:00',
    readRate: 68,
    status: '已發送',
  },
  {
    title: '聖誕節活動邀請',
    type: '公告',
    target: '全體',
    sentAt: '',
    readRate: 0,
    status: '排程中',
  },
  {
    title: '帳號安全提醒',
    type: '系統通知',
    target: '王小明',
    sentAt: '2025-12-17 16:30',
    readRate: 100,
    status: '已發送',
  },
  {
    title: '週報摘要通知',
    type: '提醒',
    target: '全體',
    sentAt: '',
    readRate: 0,
    status: '草稿',
  },
]

const typeBadgeClass: Record<string, string> = {
  公告: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  提醒: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  系統通知: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const statusClass: Record<string, string> = {
  已發送: 'text-green-600 dark:text-green-400',
  排程中: 'text-blue-600 dark:text-blue-400',
  草稿: 'text-muted-foreground',
}

export function NotificationsPage() {
  const { data: apiData } = useNotifications()

  const notifications = apiData?.items ?? mockNotifications
  const stats = apiData?.stats ?? { totalSent: 156, avgReadRate: 72.3, scheduled: 3, sentChange: 12.5, readRateChange: 3.1 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">站內通知</h1>
        <button
          type="button"
          onClick={() => alert('功能開發中')}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          建立通知
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="總發送" value={stats.totalSent} icon={Megaphone} change={stats.sentChange} changeLabel="較上月" />
        <StatCard title="平均已讀率" value={`${stats.avgReadRate}%`} icon={Eye} change={stats.readRateChange} changeLabel="較上月" />
        <StatCard title="排程中" value={stats.scheduled} icon={Clock} />
      </div>

      {/* Notification History Table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="heading-sm mb-4">通知紀錄</h2>
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
              {notifications.map((n) => (
                <tr key={n.title} className="border-b border-border last:border-0">
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
