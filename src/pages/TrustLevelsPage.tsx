import { ArrowUpDown, Shield, Star, UserPlus, Users } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const trustLevelConfig = [
  {
    level: 'Lv0',
    name: '新手',
    requirement: '（預設）',
    abilities: '基本瀏覽、點讚',
  },
  {
    level: 'Lv1',
    name: '基本',
    requirement: '閱讀 30 篇 + 造訪 5 天 + 10 分鐘閱讀',
    abilities: '完整功能 + 檢舉 + 上傳圖片',
  },
  {
    level: 'Lv2',
    name: '成員',
    requirement: '造訪 15 天 + 給讚/獲讚 + 回覆 3 + 建立主題',
    abilities: '邀請好友 + 群組 PM + 忽略用戶',
  },
  {
    level: 'Lv3',
    name: '常客',
    requirement: '50% 造訪率（100 天）+ 25% 內容閱讀',
    abilities: '重新分類 + 重命名 + Wiki + 檢舉自動隱藏',
  },
]

const recentChanges = [
  {
    user: '王小明',
    from: 'Lv1',
    to: 'Lv2',
    direction: 'up' as const,
    reason: '自動',
    time: '2025-05-27 14:30',
  },
  {
    user: '李美玲',
    from: 'Lv0',
    to: 'Lv1',
    direction: 'up' as const,
    reason: '自動',
    time: '2025-05-27 13:15',
  },
  {
    user: '張大偉',
    from: 'Lv3',
    to: 'Lv2',
    direction: 'down' as const,
    reason: '手動',
    time: '2025-05-27 11:00',
  },
  {
    user: '陳怡君',
    from: 'Lv1',
    to: 'Lv2',
    direction: 'up' as const,
    reason: '自動',
    time: '2025-05-26 22:45',
  },
  {
    user: '黃建國',
    from: 'Lv2',
    to: 'Lv3',
    direction: 'up' as const,
    reason: '自動',
    time: '2025-05-26 18:20',
  },
  {
    user: '林志明',
    from: 'Lv2',
    to: 'Lv1',
    direction: 'down' as const,
    reason: '手動',
    time: '2025-05-26 10:05',
  },
]

const groups = [
  { name: 'content_team', members: 12, override: '編輯所有內容' },
  { name: 'beta_testers', members: 45, override: '存取測試功能' },
  { name: 'mentors', members: 8, override: '管理社群空間' },
]

export function TrustLevelsPage() {
  return (
    <div className="space-y-6">
      <h1 className="heading-lg">信任等級</h1>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Lv0 新手" value={1234} icon={Users} change={-2.1} changeLabel="較上月" />
        <StatCard title="Lv1 基本" value={3456} icon={Star} change={5.3} changeLabel="較上月" />
        <StatCard title="Lv2 成員" value={2100} icon={Shield} change={3.8} changeLabel="較上月" />
        <StatCard title="Lv3 常客" value={890} icon={UserPlus} change={1.2} changeLabel="較上月" />
      </div>

      {/* Trust level config */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="heading-sm mb-4">等級設定</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground">
                {['等級', '名稱', '升級條件', '解鎖能力', '操作'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trustLevelConfig.map((row) => (
                <tr
                  key={row.level}
                  className="border-b border-border hover:bg-accent transition-colors"
                >
                  <td className="px-4 py-2">
                    <Badge variant="primary">{row.level}</Badge>
                  </td>
                  <td className="px-4 py-2 font-medium">{row.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.requirement}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.abilities}</td>
                  <td className="px-4 py-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => alert(`編輯 ${row.level} ${row.name}`)}
                    >
                      編輯
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent promotions/demotions */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="heading-sm mb-4">近期升降級</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground">
                {['用戶', '變更', '原因', '時間'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentChanges.map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-accent transition-colors">
                  <td className="px-4 py-2 font-medium">{row.user}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <Badge variant={row.direction === 'up' ? 'success' : 'error'}>
                        <ArrowUpDown className="mr-1 h-3 w-3" />
                        {row.from} → {row.to}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{row.reason}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Groups */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-sm">群組管理</h2>
          <Button type="button" size="sm" onClick={() => alert('新增群組')}>
            新增群組
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground">
                {['群組名稱', '成員數', '權限覆寫', '操作'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr
                  key={g.name}
                  className="border-b border-border hover:bg-accent transition-colors"
                >
                  <td className="px-4 py-2">
                    <Badge variant="primary">{g.name}</Badge>
                  </td>
                  <td className="px-4 py-2 font-medium">{g.members}</td>
                  <td className="px-4 py-2 text-muted-foreground">{g.override}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => alert(`編輯群組 ${g.name}`)}
                      >
                        編輯
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        onClick={() => alert(`刪除群組 ${g.name}`)}
                      >
                        刪除
                      </Button>
                    </div>
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
