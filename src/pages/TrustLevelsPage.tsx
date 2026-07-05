import { ArrowUpDown, Shield, Star, UserPlus, Users } from 'lucide-react'
import type {
  TrustLevelConfigItem,
  TrustLevelDistributionItem,
  TrustLevelHistoryItem,
} from '@/api/admin-trust'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useDeleteUserGroup,
  useTrustLevelConfig,
  useTrustLevelDistribution,
  useTrustLevelHistory,
  useUserGroups,
} from '@/hooks/useTrustLevels'

const levelIcons = [Users, Star, Shield, UserPlus]
const levelNames = ['Lv0 新手', 'Lv1 基本', 'Lv2 成員', 'Lv3 常客']

export function TrustLevelsPage() {
  const { data: configData } = useTrustLevelConfig()
  const { data: distributionData } = useTrustLevelDistribution()
  const { data: historyData } = useTrustLevelHistory()
  const { data: groups = [], isLoading: groupsLoading } = useUserGroups()
  const deleteGroupMut = useDeleteUserGroup()

  const trustLevelConfig: TrustLevelConfigItem[] = configData?.levels ?? []
  const distribution: TrustLevelDistributionItem[] = distributionData?.items ?? []
  const recentChanges: TrustLevelHistoryItem[] = historyData?.items ?? []

  function handleDeleteGroup(id: number, name: string) {
    if (!confirm(`確定刪除群組 ${name}？`)) return
    deleteGroupMut.mutate(id)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="信任等級"
        description="設定用戶信任等級的晉升條件與對應權限，建立社群貢獻激勵機制。"
      />

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
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
          等級設定
        </h2>
        <Table>
          <TableHeader>
            <TableRow className="text-left">
              {['等級', '名稱', '升級條件', '解鎖能力', '操作'].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {trustLevelConfig.map((row) => (
              <TableRow key={row.level}>
                <TableCell>
                  <Badge variant="primary">{row.level}</Badge>
                </TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.requirement}</TableCell>
                <TableCell className="text-muted-foreground">{row.abilities}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => alert(`編輯 ${row.level} ${row.name}`)}
                  >
                    編輯
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Recent promotions/demotions */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
          近期升降級
        </h2>
        <Table>
          <TableHeader>
            <TableRow className="text-left">
              {['用戶', '變更', '原因', '時間'].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentChanges.map((row) => (
              <TableRow key={`${row.user}-${row.time}`}>
                <TableCell className="font-medium">{row.user}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Badge variant={row.direction === 'up' ? 'success' : 'error'}>
                      <ArrowUpDown className="mr-1 h-3 w-3" />
                      {row.from} → {row.to}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.reason}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Groups */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            群組管理
          </h2>
          <Button type="button" size="sm" onClick={() => alert('新增群組')}>
            新增群組
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="text-left">
              {['群組名稱', '成員數', '權限覆寫', '操作'].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupsLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                  載入中...
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                  尚無群組
                </TableCell>
              </TableRow>
            ) : (
              groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <Badge variant="primary">{g.name}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{g.members}</TableCell>
                  <TableCell className="text-muted-foreground">{g.override}</TableCell>
                  <TableCell>
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
                        onClick={() => handleDeleteGroup(g.id, g.name)}
                        disabled={deleteGroupMut.isPending}
                      >
                        刪除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
