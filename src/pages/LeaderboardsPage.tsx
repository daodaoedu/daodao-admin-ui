import { Crown, Medal, Settings, Trophy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Period = '本週' | '本月' | '總計'

const PERIODS: Period[] = ['本週', '本月', '總計']

const WEIGHT_CONFIG = [
  { label: '發文', key: 'post', value: 10 },
  { label: '留言', key: 'comment', value: 5 },
  { label: '獲讚', key: 'like', value: 3 },
  { label: '完成課程', key: 'course', value: 50 },
]

const MOCK_USERS = [
  {
    rank: 1,
    name: '陳小明',
    avatar: '陳',
    score: 1250,
    posts: 32,
    comments: 85,
    likes: 210,
    courses: 8,
  },
  {
    rank: 2,
    name: '林美玲',
    avatar: '林',
    score: 1120,
    posts: 28,
    comments: 92,
    likes: 180,
    courses: 7,
  },
  {
    rank: 3,
    name: '王大偉',
    avatar: '王',
    score: 980,
    posts: 25,
    comments: 68,
    likes: 165,
    courses: 6,
  },
  {
    rank: 4,
    name: '張雅婷',
    avatar: '張',
    score: 870,
    posts: 22,
    comments: 55,
    likes: 140,
    courses: 5,
  },
  {
    rank: 5,
    name: '李志豪',
    avatar: '李',
    score: 760,
    posts: 18,
    comments: 48,
    likes: 120,
    courses: 5,
  },
  {
    rank: 6,
    name: '吳佳蓉',
    avatar: '吳',
    score: 650,
    posts: 15,
    comments: 42,
    likes: 98,
    courses: 4,
  },
  {
    rank: 7,
    name: '劉建國',
    avatar: '劉',
    score: 540,
    posts: 12,
    comments: 35,
    likes: 85,
    courses: 3,
  },
  {
    rank: 8,
    name: '黃淑芬',
    avatar: '黃',
    score: 430,
    posts: 10,
    comments: 28,
    likes: 72,
    courses: 2,
  },
  {
    rank: 9,
    name: '周明哲',
    avatar: '周',
    score: 320,
    posts: 8,
    comments: 22,
    likes: 55,
    courses: 1,
  },
  {
    rank: 10,
    name: '許雅琪',
    avatar: '許',
    score: 210,
    posts: 5,
    comments: 15,
    likes: 40,
    courses: 1,
  },
]

const RANK_STYLES: Record<number, string> = {
  1: 'border-l-4 border-l-yellow-500 bg-yellow-500/5',
  2: 'border-l-4 border-l-gray-400 bg-gray-400/5',
  3: 'border-l-4 border-l-amber-700 bg-amber-700/5',
}

const RANK_ICONS: Record<number, typeof Crown> = {
  1: Crown,
  2: Medal,
  3: Trophy,
}

const RANK_ICON_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-700',
}

export function LeaderboardsPage() {
  const [period, setPeriod] = useState<Period>('本週')
  const [weights, setWeights] = useState(
    Object.fromEntries(WEIGHT_CONFIG.map((w) => [w.key, w.value])),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="heading-lg">排行榜</h1>

      {/* Weight Config */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h2 className="heading-sm">活動權重設定</h2>
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
                <input
                  id={`weight-${item.key}`}
                  type="range"
                  min={1}
                  max={100}
                  value={weights[item.key]}
                  onChange={(e) =>
                    setWeights((prev) => ({
                      ...prev,
                      [item.key]: Number(e.target.value),
                    }))
                  }
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                />
                <span className="w-12 text-right text-sm font-medium text-foreground">
                  {weights[item.key]} 分
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              period === p
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
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
              {MOCK_USERS.map((user) => {
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
