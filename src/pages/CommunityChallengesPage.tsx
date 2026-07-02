import { AlertTriangle, CalendarDays, CheckCircle2, Flame, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * 共同挑戰管理 POC（mock data）
 * 對應 daodao-server docs/b2b/FRD-共同挑戰.md 的 Admin 後台規格
 */

type SeasonStatus = 'active' | 'upcoming' | 'ended'

interface MockSeason {
  id: string
  seasonNumber: number
  targetDescription: string
  startDate: string
  endDate: string
  status: SeasonStatus
  memberCount: number
  todayCheckins: number
  checkinRate: number
  retention: { d7: number; d14: number; d30: number }
}

interface MockChallenge {
  id: string
  title: string
  category: string
  isRecurring: boolean
  seasons: MockSeason[]
}

interface MockMember {
  name: string
  totalCheckins: number
  streak: number
  daysSinceLast: number
}

const STATUS_META: Record<SeasonStatus, { label: string; className: string }> = {
  active: { label: '進行中', className: 'bg-emerald-500/15 text-emerald-600' },
  upcoming: { label: '即將開始', className: 'bg-sky-500/15 text-sky-600' },
  ended: { label: '已結束', className: 'bg-muted text-muted-foreground' },
}

const MOCK_CHALLENGES: MockChallenge[] = [
  {
    id: 'jlpt-n3',
    title: '日檢 N3 備考衝刺',
    category: '備考',
    isRecurring: true,
    seasons: [
      {
        id: 'jlpt-n3-s1',
        seasonNumber: 1,
        targetDescription: '通過 2026 年 7 月 JLPT N3',
        startDate: '2026-04-01',
        endDate: '2026-07-05',
        status: 'active',
        memberCount: 128,
        todayCheckins: 73,
        checkinRate: 73,
        retention: { d7: 82, d14: 71, d30: 64 },
      },
      {
        id: 'jlpt-n3-s2',
        seasonNumber: 2,
        targetDescription: '通過 2026 年 12 月 JLPT N3',
        startDate: '2026-09-01',
        endDate: '2026-12-06',
        status: 'upcoming',
        memberCount: 23,
        todayCheckins: 0,
        checkinRate: 0,
        retention: { d7: 0, d14: 0, d30: 0 },
      },
    ],
  },
  {
    id: 'neuroplasticity-book',
    title: '《神經可塑性》共讀挑戰',
    category: '讀書',
    isRecurring: false,
    seasons: [
      {
        id: 'neuro-s1',
        seasonNumber: 1,
        targetDescription: '30 天內讀完全書並寫下心得',
        startDate: '2026-06-15',
        endDate: '2026-07-15',
        status: 'active',
        memberCount: 64,
        todayCheckins: 41,
        checkinRate: 64,
        retention: { d7: 78, d14: 66, d30: 0 },
      },
    ],
  },
  {
    id: 'half-marathon',
    title: '半馬完賽訓練',
    category: '運動',
    isRecurring: true,
    seasons: [
      {
        id: 'half-marathon-s2',
        seasonNumber: 2,
        targetDescription: '完成 2026 春季半馬',
        startDate: '2026-01-01',
        endDate: '2026-04-26',
        status: 'ended',
        memberCount: 96,
        todayCheckins: 0,
        checkinRate: 68,
        retention: { d7: 85, d14: 74, d30: 61 },
      },
    ],
  },
]

const MOCK_TOP_MEMBERS: MockMember[] = [
  { name: '王小明', totalCheckins: 88, streak: 21, daysSinceLast: 0 },
  { name: '李大華', totalCheckins: 82, streak: 18, daysSinceLast: 0 },
  { name: '陳美玲', totalCheckins: 76, streak: 15, daysSinceLast: 1 },
]

const MOCK_STALLED_MEMBERS: MockMember[] = [
  { name: '張大同', totalCheckins: 12, streak: 0, daysSinceLast: 7 },
  { name: '林小茜', totalCheckins: 25, streak: 0, daysSinceLast: 10 },
]

function CreateChallengeDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="h-4 w-4" />
          建立挑戰主題
        </Button>
      </DialogTrigger>
      <DialogContent className="h-auto max-w-lg">
        <div>
          <h2 className="text-lg font-semibold">建立挑戰主題</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            主題永久存在，之後可在主題底下開設多個期數（Season）。
          </p>
        </div>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="challenge-title">主題名稱</Label>
            <Input id="challenge-title" placeholder="例：日檢 N3 備考衝刺" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="challenge-category">分類</Label>
            <Input id="challenge-category" placeholder="備考 / 讀書 / 運動 / 認證 / 其他" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="challenge-prompt">每日打卡提示語</Label>
            <Input id="challenge-prompt" placeholder="例：今天練了幾題？有哪題卡住？" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button type="button" onClick={() => setOpen(false)}>
            建立（POC 僅示意）
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SeasonStatsPanel({ challenge, season }: { challenge: MockChallenge; season: MockSeason }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">
          {challenge.title} · 第 {season.seasonNumber} 期
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {season.targetDescription} · {season.startDate} → {season.endDate}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="加入人數" value={season.memberCount} icon={Users} />
        <StatCard
          title="今日打卡"
          value={`${season.todayCheckins} 人`}
          icon={CheckCircle2}
          description="今天已打卡的成員數"
        />
        <StatCard title="整體打卡率" value={`${season.checkinRate}%`} change={5.0} icon={Flame} />
        <StatCard
          title="D7 / D14 / D30 留存"
          value={`${season.retention.d7}% / ${season.retention.d14}% / ${season.retention.d30}%`}
          icon={CalendarDays}
          description="加入後第 7 / 14 / 30 天仍在打卡的比例"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5">
          <h4 className="text-sm font-semibold">活躍成員</h4>
          <div className="mt-3 space-y-2">
            {MOCK_TOP_MEMBERS.map((member) => (
              <div key={member.name} className="flex items-center justify-between text-sm">
                <span>{member.name}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  共 {member.totalCheckins} 次 ·
                  <Flame className="h-3 w-3 text-amber-500" />
                  連續 {member.streak} 天
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            停滯預警
          </h4>
          <div className="mt-3 space-y-2">
            {MOCK_STALLED_MEMBERS.map((member) => (
              <div key={member.name} className="flex items-center justify-between text-sm">
                <span>{member.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{member.daysSinceLast} 天未打卡</span>
                  <Button type="button" size="sm" variant="outline">
                    發通知
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CommunityChallengesPage() {
  const [selectedSeasonKey, setSelectedSeasonKey] = useState<string>('jlpt-n3-s1')

  const selected = MOCK_CHALLENGES.flatMap((challenge) =>
    challenge.seasons.map((season) => ({ challenge, season })),
  ).find(({ season }) => season.id === selectedSeasonKey)

  const activeSeasonCount = MOCK_CHALLENGES.flatMap((c) => c.seasons).filter(
    (s) => s.status === 'active',
  ).length
  const totalActiveMembers = MOCK_CHALLENGES.flatMap((c) => c.seasons)
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.memberCount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="共同挑戰"
        description="管理共同挑戰主題與期數，查看各期打卡與留存數據。（POC，mock data）"
        actions={<CreateChallengeDialog />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="進行中期數" value={activeSeasonCount} icon={CalendarDays} />
        <StatCard title="進行中總成員" value={totalActiveMembers} icon={Users} />
        <StatCard title="今日整體打卡率" value="69%" change={3.2} icon={Flame} />
      </div>

      {/* 主題與期數列表 */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95">
        <div className="border-b border-[var(--admin-card-border)] px-5 py-3">
          <h3 className="text-sm font-semibold">挑戰主題</h3>
        </div>
        <div className="divide-y divide-[var(--admin-card-border)]">
          {MOCK_CHALLENGES.map((challenge) => (
            <div key={challenge.id} className="px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">{challenge.title}</span>
                <Badge variant="primary">{challenge.category}</Badge>
                {challenge.isRecurring && <Badge>定期舉辦</Badge>}
                <Button type="button" size="sm" variant="ghost" className="ml-auto">
                  <Plus className="h-3.5 w-3.5" />
                  開新期數
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {challenge.seasons.map((season) => (
                  <button
                    key={season.id}
                    type="button"
                    onClick={() => setSelectedSeasonKey(season.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                      selectedSeasonKey === season.id
                        ? 'border-primary bg-primary/10'
                        : 'border-[var(--admin-card-border)] hover:bg-muted/50',
                    )}
                  >
                    <span>第 {season.seasonNumber} 期</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs',
                        STATUS_META[season.status].className,
                      )}
                    >
                      {STATUS_META[season.status].label}
                    </span>
                    <span className="text-muted-foreground">{season.memberCount} 人</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && <SeasonStatsPanel challenge={selected.challenge} season={selected.season} />}
    </div>
  )
}
