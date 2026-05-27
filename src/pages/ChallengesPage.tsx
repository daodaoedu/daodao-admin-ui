import { CalendarDays, Plus, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Tab = '進行中' | '即將開始' | '已結束'

const TABS: { label: Tab; count: number }[] = [
  { label: '進行中', count: 2 },
  { label: '即將開始', count: 1 },
  { label: '已結束', count: 3 },
]

interface Challenge {
  id: number
  name: string
  description: string
  currentDay: number
  totalDays: number
  participants: number
  completionRate: number
  status: Tab
}

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 1,
    name: '7天閱讀挑戰',
    description: '每天至少閱讀一篇文章並撰寫心得筆記',
    currentDay: 4,
    totalDays: 7,
    participants: 156,
    completionRate: 68,
    status: '進行中',
  },
  {
    id: 2,
    name: '30天打卡挑戰',
    description: '連續 30 天每日打卡，培養學習習慣',
    currentDay: 18,
    totalDays: 30,
    participants: 89,
    completionRate: 42,
    status: '進行中',
  },
  {
    id: 3,
    name: '新年寫作挑戰',
    description: '每週完成一篇原創文章，共四週',
    currentDay: 0,
    totalDays: 28,
    participants: 0,
    completionRate: 0,
    status: '即將開始',
  },
  {
    id: 4,
    name: '14天冥想挑戰',
    description: '每天完成 10 分鐘引導冥想',
    currentDay: 14,
    totalDays: 14,
    participants: 203,
    completionRate: 71,
    status: '已結束',
  },
  {
    id: 5,
    name: '讀書馬拉松',
    description: '一個月內閱讀 5 本書並發表書評',
    currentDay: 30,
    totalDays: 30,
    participants: 67,
    completionRate: 35,
    status: '已結束',
  },
  {
    id: 6,
    name: '程式碼挑戰',
    description: '每天完成一道演算法題目',
    currentDay: 21,
    totalDays: 21,
    participants: 112,
    completionRate: 58,
    status: '已結束',
  },
]

const STREAK_DATA = [
  { label: '1-3 天', value: 2345, max: 2345 },
  { label: '4-7 天', value: 890, max: 2345 },
  { label: '8-14 天', value: 456, max: 2345 },
  { label: '15-30 天', value: 123, max: 2345 },
  { label: '30 天+', value: 45, max: 2345 },
]

export function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('進行中')

  const filteredChallenges = MOCK_CHALLENGES.filter(
    (c) => c.status === activeTab,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">挑戰活動</h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          建立挑戰
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.label)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.label
                ? 'bg-card text-foreground shadow-sm'
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
              {tab.count}
            </span>
          </button>
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
            <div
              key={challenge.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">
                    {challenge.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {challenge.description}
                  </p>
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
          <p className="col-span-full py-8 text-center text-muted-foreground">
            此分類沒有挑戰活動
          </p>
        )}
      </div>

      {/* Streak Distribution */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 heading-sm">連續打卡分布</h2>
        <div className="space-y-3">
          {STREAK_DATA.map((row) => {
            const pct = Math.round((row.value / row.max) * 100)
            return (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">
                  {row.label}
                </span>
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
