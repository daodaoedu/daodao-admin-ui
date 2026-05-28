import { CalendarDays, Plus, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import type { Challenge, StreakDistributionItem } from '@/api/admin-gamification'
import { Button } from '@/components/ui/button'
import { useChallenges, useStreakDistribution } from '@/hooks/useChallenges'
import { cn } from '@/lib/utils'

type Tab = '進行中' | '即將開始' | '已結束'

const TABS: { label: Tab }[] = [{ label: '進行中' }, { label: '即將開始' }, { label: '已結束' }]

export function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('進行中')

  const { data: challengesData } = useChallenges()
  const { data: streakData } = useStreakDistribution()

  const allChallenges = (challengesData?.items as (Challenge & { status: Tab })[] | undefined) ?? []
  const streakRows = (streakData ?? []) as StreakDistributionItem[]
  const tabCounts: Record<string, number> = { 進行中: 0, 即將開始: 0, 已結束: 0 }
  for (const tab of TABS) {
    tabCounts[tab.label] = allChallenges.filter((item) => item.status === tab.label).length
  }

  const filteredChallenges = allChallenges.filter((c) => c.status === activeTab)

  // Compute max for streak bars
  const streakMax = streakRows.reduce((acc, r) => Math.max(acc, r.value), 0) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">挑戰活動</h1>
        <Button type="button">
          <Plus className="h-4 w-4" />
          建立挑戰
        </Button>
      </div>

      {/* Tabs */}
      <div className="admin-segmented">
        {TABS.map((tab) => (
          <Button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.label)}
            className={cn(
              'admin-segmented-item flex-1',
              activeTab === tab.label
                ? 'admin-segmented-item-active'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
                activeTab === tab.label
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {tabCounts[tab.label]}
            </span>
          </Button>
        ))}
      </div>

      {/* Challenge Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredChallenges.map((challenge) => {
          const progress =
            challenge.totalDays > 0
              ? Math.round((challenge.currentDay / challenge.totalDays) * 100)
              : 0
          return (
            <div key={challenge.id} className="admin-panel-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{challenge.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{challenge.description}</p>
                </div>
                <Trophy className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Day {challenge.currentDay} / {challenge.totalDays}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {challenge.participants} 參與者
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  完成率 {challenge.completionRate}%
                </span>
              </div>
            </div>
          )
        })}
        {filteredChallenges.length === 0 && (
          <p className="col-span-full py-8 text-center text-muted-foreground">此分類沒有挑戰活動</p>
        )}
      </div>

      {/* Streak Distribution */}
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">連續打卡分布</h2>
        <div className="space-y-3">
          {streakRows.map((row) => {
            const pct = Math.round((row.value / (row.max ?? streakMax)) * 100)
            return (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">{row.label}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded bg-primary/80 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-foreground">
                    {row.value.toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
