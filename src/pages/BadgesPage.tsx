import {
  Award,
  Flame,
  Heart,
  MessageCircle,
  Pencil,
  Plus,
  Star,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MOCK_BADGES = [
  {
    id: 1,
    name: '首次打卡',
    icon: Target,
    description: '完成第一次每日打卡',
    trigger: '自動',
    awarded: 1234,
  },
  {
    id: 2,
    name: '連續7天',
    icon: Flame,
    description: '連續打卡達 7 天',
    trigger: '自動',
    awarded: 890,
  },
  {
    id: 3,
    name: '百篇筆記',
    icon: Pencil,
    description: '累計撰寫 100 篇學習筆記',
    trigger: '自動',
    awarded: 45,
  },
  {
    id: 4,
    name: '社群之星',
    icon: Star,
    description: '由管理員手動頒發給傑出貢獻者',
    trigger: '手動',
    awarded: 12,
  },
  {
    id: 5,
    name: '熱心助人',
    icon: Heart,
    description: '累計回覆他人問題 50 次',
    trigger: '自動',
    awarded: 67,
  },
  {
    id: 6,
    name: '討論王',
    icon: MessageCircle,
    description: '單月留言數達 100 則',
    trigger: '自動',
    awarded: 34,
  },
  {
    id: 7,
    name: '學習達人',
    icon: Trophy,
    description: '完成 10 門課程',
    trigger: '自動',
    awarded: 156,
  },
  {
    id: 8,
    name: '人氣王',
    icon: Users,
    description: '被追蹤數達 50 人',
    trigger: '自動',
    awarded: 78,
  },
]

const MOCK_RECENT_AWARDS = [
  { id: 1, user: '陳小明', badge: '連續7天', method: '自動', time: '5 分鐘前' },
  { id: 2, user: '林美玲', badge: '首次打卡', method: '自動', time: '12 分鐘前' },
  { id: 3, user: '王大偉', badge: '社群之星', method: '手動', time: '1 小時前' },
  { id: 4, user: '張雅婷', badge: '百篇筆記', method: '自動', time: '3 小時前' },
  { id: 5, user: '李志豪', badge: '熱心助人', method: '自動', time: '5 小時前' },
]

export function BadgesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">徽章管理</h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          建立徽章
        </button>
      </div>

      {/* Badge Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_BADGES.map((badge) => {
          const Icon = badge.icon
          return (
            <div key={badge.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground">{badge.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{badge.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    badge.trigger === '自動'
                      ? 'bg-success/15 text-success'
                      : 'bg-warning/15 text-warning',
                  )}
                >
                  {badge.trigger}
                </span>
                <span className="text-muted-foreground">
                  <Award className="mr-1 inline h-3.5 w-3.5" />
                  已頒發 {badge.awarded.toLocaleString()}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Awards Table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 heading-sm">最近頒發</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">用戶</th>
                <th className="pb-3 font-medium text-muted-foreground">徽章</th>
                <th className="pb-3 font-medium text-muted-foreground">頒發方式</th>
                <th className="pb-3 font-medium text-muted-foreground">時間</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RECENT_AWARDS.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground">{row.user}</td>
                  <td className="py-3 text-foreground">{row.badge}</td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        row.method === '自動'
                          ? 'bg-success/15 text-success'
                          : 'bg-warning/15 text-warning',
                      )}
                    >
                      {row.method}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
