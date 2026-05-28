import { ArrowUpDown, Shield, Star, UserPlus, Users } from 'lucide-react'
import type {
  TrustLevelConfigItem,
  TrustLevelDistributionItem,
  TrustLevelHistoryItem,
} from '@/api/admin-trust'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useTrustLevelConfig,
  useTrustLevelDistribution,
  useTrustLevelHistory,
} from '@/hooks/useTrustLevels'

const groups = [
  { name: 'content_team', members: 12, override: '編輯所有內容' },
  { name: 'beta_testers', members: 45, override: '存取測試功能' },
  { name: 'mentors', members: 8, override: '管理社群空間' },
]

const levelIcons = [Users, Star, Shield, UserPlus]
const levelNames = ['Lv0 新手', 'Lv1 基本', 'Lv2 成員', 'Lv3 常客']

export function TrustLevelsPage() {
  const { data: configData } = useTrustLevelConfig()
  const { data: distributionData } = useTrustLevelDistribution()
  const { data: historyData } = useTrustLevelHistory()

  const trustLevelConfig: TrustLevelConfigItem[] = configData?.levels ?? []
  const distribution: TrustLevelDistributionItem[] = distributionData?.items ?? []
  const recentChanges: TrustLevelHistoryItem[] = historyData?.items ?? []
  return (
    <div className="space-y-6">
      <h1 className="heading-lg">信任等級</h1>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {distribution.map((d, i) => (
          <StatCard
            key={d.level}
            title={levelNames[i] ?? d.level}
            value={d.count}
            icon={levelIcons[i] ?? Users}
            change={d.changePercent}
            changeLabel="較上月"
          />
        ))}
      </div>

      {/* Trust level config */}
      <div className="admin-panel-card p-5">
        <h2 className="heading-sm mb-4">等級設定</h2>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                {['等級', '名稱', '升級條件', '解鎖能力', '操作'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trustLevelConfig.map((row) => (
                <tr key={row.level} className="admin-table-row transition-colors">
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
      <div className="admin-panel-card p-5">
        <h2 className="heading-sm mb-4">近期升降級</h2>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                {['用戶', '變更', '原因', '時間'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentChanges.map((row) => (
                <tr key={`${row.user}-${row.time}`} className="admin-table-row transition-colors">
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
      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-sm">群組管理</h2>
          <Button type="button" size="sm" onClick={() => alert('新增群組')}>
            新增群組
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                {['群組名稱', '成員數', '權限覆寫', '操作'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.name} className="admin-table-row transition-colors">
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
