import { Crown, Medal, Settings, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { LeaderboardUser, LeaderboardWeightConfig } from '@/api/admin-gamification'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLeaderboard, useLeaderboardConfig } from '@/hooks/useLeaderboard'
import { cn } from '@/lib/utils'

type Period = '本週' | '本月' | '總計'

const PERIODS: Period[] = ['本週', '本月', '總計']

const WEIGHT_CONFIG = [
  { label: '發文', key: 'post', value: 10 },
  { label: '留言', key: 'comment', value: 5 },
  { label: '獲讚', key: 'like', value: 3 },
  { label: '完成課程', key: 'course', value: 50 },
]

const RANK_STYLES: Record<number, string> = {
  1: 'border-l-4 border-l-warning bg-warning/5',
  2: 'border-l-4 border-l-muted bg-muted/5',
  3: 'border-l-4 border-l-warning bg-warning/5',
}

const RANK_ICONS: Record<number, typeof Crown> = {
  1: Crown,
  2: Medal,
  3: Trophy,
}

const RANK_ICON_COLORS: Record<number, string> = {
  1: 'text-warning',
  2: 'text-muted-foreground',
  3: 'text-warning',
}

export function LeaderboardsPage() {
  const [period, setPeriod] = useState<Period>('本週')

  const { data: configData } = useLeaderboardConfig()
  const { data: leaderboardData } = useLeaderboard(period)

  const defaultWeights = Object.fromEntries(
    WEIGHT_CONFIG.map((w) => [w.key, w.value]),
  ) as unknown as LeaderboardWeightConfig
  const [weights, setWeights] = useState<LeaderboardWeightConfig>(defaultWeights)

  useEffect(() => {
    if (configData?.weights) setWeights(configData.weights)
  }, [configData])

  const users = (leaderboardData?.items ?? []) as LeaderboardUser[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="排行榜"
        description="查看積分、貢獻度或學習進度的用戶排名，激發良性競爭。"
      />

      {/* Weight Config */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            活動權重設定
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WEIGHT_CONFIG.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <label
                htmlFor={`weight-${item.key}`}
                className="w-20 shrink-0 text-sm text-muted-foreground"
              >
                {item.label}
              </label>
              <div className="flex flex-1 items-center gap-2">
                <Input
                  id={`weight-${item.key}`}
                  type="number"
                  min={1}
                  max={100}
                  value={weights[item.key as keyof typeof weights] ?? item.value}
                  onChange={(e) =>
                    setWeights((prev) => ({
                      ...prev,
                      [item.key]: Math.min(100, Math.max(1, Number(e.target.value))),
                    }))
                  }
                  className="w-20"
                />
                <span className="w-12 text-right text-sm font-medium text-foreground">分</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Period Tabs */}
      <div className="inline-flex rounded-lg border border-[var(--admin-panel-border)] bg-background/65 p-1">
        {PERIODS.map((p) => (
          <Button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-transparent bg-transparent shadow-none hover:bg-muted hover:text-foreground flex-1',
              period === p
                ? 'bg-background/70 text-foreground shadow-sm hover:bg-background/70'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                <th className="pb-3 font-medium text-muted-foreground">排名</th>
                <th className="pb-3 font-medium text-muted-foreground">用戶</th>
                <th className="pb-3 text-right font-medium text-muted-foreground">分數</th>
                <th className="pb-3 text-right font-medium text-muted-foreground">發文</th>
                <th className="pb-3 text-right font-medium text-muted-foreground">留言</th>
                <th className="pb-3 text-right font-medium text-muted-foreground">獲讚</th>
                <th className="pb-3 text-right font-medium text-muted-foreground">課程</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const RankIcon = RANK_ICONS[user.rank]
                return (
                  <tr
                    key={user.rank}
                    className={cn('border-b border-border last:border-0', RANK_STYLES[user.rank])}
                  >
                    <td className="py-3 text-foreground">
                      <div className="flex items-center gap-1.5">
                        {RankIcon ? (
                          <RankIcon className={cn('h-4 w-4', RANK_ICON_COLORS[user.rank])} />
                        ) : (
                          <span className="inline-flex h-4 w-4 items-center justify-center text-xs text-muted-foreground">
                            {user.rank}
                          </span>
                        )}
                        <span className="font-medium">{user.rank}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                          {user.avatar}
                        </div>
                        <span className="text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-semibold text-foreground">
                      {user.score.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">{user.posts}</td>
                    <td className="py-3 text-right text-muted-foreground">{user.comments}</td>
                    <td className="py-3 text-right text-muted-foreground">{user.likes}</td>
                    <td className="py-3 text-right text-muted-foreground">{user.courses}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
