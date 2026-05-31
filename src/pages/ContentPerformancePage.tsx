import {
  AlertCircle,
  BookOpen,
  Brain,
  Eye,
  Layers,
  SmilePlus,
  Star,
  Timer,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { ExportButton } from '@/components/ExportButton'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useContentPerformance, useSetContentFeatured } from '@/hooks/useContentPerformance'
import { cn } from '@/lib/utils'

type SortField = 'views' | 'depth' | 'avgTime' | 'interactionRate'
type TabKey = 'practice' | 'checkin' | 'quiz' | 'persona' | 'category'
type DatePreset = '1' | '7' | '30'

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: '今天', value: '1' },
  { label: '7 天', value: '7' },
  { label: '30 天', value: '30' },
]

const SORT_COLUMNS: { key: SortField; label: string; hint: string }[] = [
  { key: 'views', label: '瀏覽數', hint: '累積不重複瀏覽' },
  { key: 'depth', label: '閱讀深度', hint: '平均捲動 %（需累積）' },
  { key: 'avgTime', label: '平均停留', hint: '平均停留分鐘（需累積）' },
  { key: 'interactionRate', label: '互動率', hint: '留言 + reaction / 瀏覽' },
]

const MOOD_LABELS: Record<string, { label: string; color: string }> = {
  happy: { label: '開心 😊', color: 'bg-success/15 text-success' },
  good: { label: '良好 🙂', color: 'bg-primary/10 text-primary' },
  neutral: { label: '普通 😐', color: 'bg-muted text-muted-foreground' },
  bored: { label: '無聊 😑', color: 'bg-warning/10 text-warning' },
  frustrated: { label: '挫折 😤', color: 'bg-warning/15 text-warning' },
  give_up: { label: '放棄 😞', color: 'bg-destructive/10 text-destructive' },
}

function extractShortName(description: string, slug: string): string {
  const beforeRelated = description.split('相關')[0]
  if (beforeRelated && beforeRelated.length < description.length && beforeRelated.length <= 10)
    return beforeRelated
  const beforeDash = description.split(' - ')[0]
  if (beforeDash && beforeDash.length < description.length && beforeDash.length <= 10)
    return beforeDash
  return slug
}

const ROLE_LABELS: Record<string, string> = {
  D: 'Doer',
  A: 'Analyzer',
  O: 'Observer',
  L: 'Learner',
  C: 'Creator',
}

export function ContentPerformancePage() {
  const [tab, setTab] = useState<TabKey>('practice')
  const [sortBy, setSortBy] = useState<SortField>('views')
  const [preset, setPreset] = useState<DatePreset>('7')
  const { data, isLoading } = useContentPerformance(Number(preset))
  const { mutate: setFeatured } = useSetContentFeatured()

  const content = data?.items ?? []
  const collections = data?.collections ?? []
  const checkins = data?.checkinSummary
  const quiz = data?.quizSummary
  const persona = data?.personaSummary

  const sorted = [...content].sort((a, b) => {
    if (sortBy === 'avgTime') return b.avgTime - a.avgTime
    if (sortBy === 'interactionRate') return b.interactionRate - a.interactionRate
    return (b[sortBy] as number) - (a[sortBy] as number)
  })

  const TABS: {
    key: TabKey
    label: string
    icon: typeof BookOpen
    summary: string
    desc: string
  }[] = [
    {
      key: 'practice',
      label: 'Practice',
      icon: BookOpen,
      summary: `${content.length} 個`,
      desc: '公開任務',
    },
    {
      key: 'checkin',
      label: '打卡動態',
      icon: SmilePlus,
      summary: `${checkins?.total ?? 0} 則`,
      desc: '打卡記錄',
    },
    {
      key: 'quiz',
      label: '學習風格',
      icon: Brain,
      summary: `${quiz?.completed ?? 0} 人完成`,
      desc: '測驗結果',
    },
    {
      key: 'persona',
      label: '人物誌',
      icon: Users,
      summary: `${persona?.totalAnswers ?? 0} 則回答`,
      desc: '問卷填答',
    },
    {
      key: 'category',
      label: '模板主題',
      icon: Layers,
      summary: `${collections.length} 個`,
      desc: '主題分布',
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="內容分析"
        description="追蹤 Practice、打卡、測驗、人物誌四種 user-created content 的健康度"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--admin-card-border)] bg-muted/40 p-0.5">
              {DATE_PRESETS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPreset(value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    preset === value
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <ExportButton
              data={sorted as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'title', header: '標題' },
                { key: 'views', header: '瀏覽數' },
                { key: 'depth', header: '閱讀深度%' },
                { key: 'avgTime', header: '平均停留(分)' },
                { key: 'interactionRate', header: '互動率%' },
                { key: 'featured', header: '精選' },
              ]}
              fileName="content-performance"
            />
          </div>
        }
      />

      {/* ── Tab Bar ──────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-[var(--admin-card-border)] bg-muted/40 p-1">
        {TABS.map(({ key, label, icon: Icon, summary }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              tab === key
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/60',
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', tab === key && 'text-primary')} />
            <span className="hidden sm:inline">{label}</span>
            <span
              className={cn(
                'hidden lg:inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                tab === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {summary}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 py-16 text-center text-sm text-muted-foreground">
          載入中...
        </div>
      ) : (
        <>
          {/* ─ Practice ─ */}
          {tab === 'practice' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard title="公開 Practice" value={content.length} icon={BookOpen} />
                <StatCard
                  title="有互動"
                  value={content.filter((i) => i.interactionRate > 0).length}
                  icon={Zap}
                />
                <StatCard
                  title="零互動"
                  value={content.filter((i) => i.interactionRate === 0).length}
                  icon={AlertCircle}
                />
                <StatCard
                  title="精選中"
                  value={content.filter((i) => i.featured).length}
                  icon={Star}
                />
              </div>

              <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm">
                <div className="border-b border-border px-5 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    點擊欄位標題排序・<span className="text-warning font-medium">琥珀色</span>
                    列表示尚無任何互動
                  </p>
                </div>
                {sorted.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    目前尚無公開 Practice
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-4 py-3 font-medium text-muted-foreground">標題</th>
                          {SORT_COLUMNS.map((col) => (
                            <th key={col.key} className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  className={cn(
                                    'w-fit px-0 py-0 h-auto font-medium text-muted-foreground',
                                    sortBy === col.key && 'text-primary underline',
                                    'hover:bg-transparent hover:text-primary',
                                  )}
                                  onClick={() => setSortBy(col.key)}
                                >
                                  {col.label}
                                  {sortBy === col.key && <span className="ml-1">↓</span>}
                                </Button>
                                <span className="text-[10px] text-muted-foreground/60 font-normal leading-tight">
                                  {col.hint}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 font-medium text-muted-foreground">精選</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((item) => (
                          <tr
                            key={item.id}
                            className={cn(
                              'border-b border-border transition-colors',
                              item.interactionRate === 0
                                ? 'bg-warning/5 hover:bg-warning/10'
                                : 'hover:bg-muted/30',
                            )}
                          >
                            <td className="px-4 py-3 font-medium max-w-[220px] truncate">
                              {item.title}
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              {item.views.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              {item.depth > 0 ? (
                                `${item.depth}%`
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              {item.avgTime > 0 ? (
                                `${item.avgTime} 分`
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              {item.interactionRate > 0 ? (
                                <span
                                  className={cn(
                                    'font-medium',
                                    item.interactionRate >= 10
                                      ? 'text-success'
                                      : item.interactionRate >= 3
                                        ? 'text-primary'
                                        : 'text-muted-foreground',
                                  )}
                                >
                                  {item.interactionRate}%
                                </span>
                              ) : (
                                <span className="text-warning/70 font-medium">0%</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {item.featured && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  <Star className="h-3 w-3 fill-current" /> 精選
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="h-auto px-0 py-0 font-medium text-primary hover:text-primary/80"
                                onClick={() =>
                                  setFeatured({ id: item.id, featured: !item.featured })
                                }
                              >
                                {item.featured ? '取消精選' : '設為精選'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ Checkin ─ */}
          {tab === 'checkin' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard title="總打卡數" value={checkins?.total ?? 0} icon={SmilePlus} />
                <StatCard title="近 7 天" value={checkins?.last7Days ?? 0} icon={Timer} />
                <StatCard title="打卡用戶數" value={checkins?.uniqueUsers ?? 0} icon={Users} />
                <StatCard
                  title="獲得互動"
                  value={(checkins?.withReaction ?? 0) + (checkins?.withComment ?? 0)}
                  icon={Eye}
                />
              </div>

              <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-foreground">打卡心情分布</h3>
                {(checkins?.moodDistribution?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">尚無心情資料</p>
                ) : (
                  <div className="space-y-3">
                    {checkins?.moodDistribution.map(({ mood, count }) => {
                      const cfg = MOOD_LABELS[mood] ?? {
                        label: mood,
                        color: 'bg-muted text-muted-foreground',
                      }
                      const total = checkins?.moodDistribution.reduce((s, m) => s + m.count, 0)
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0
                      return (
                        <div key={mood} className="flex items-center gap-3">
                          <span
                            className={cn(
                              'w-28 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-center',
                              cfg.color,
                            )}
                          >
                            {cfg.label}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-20 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                            {count} 次 ({pct}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ Quiz ─ */}
          {tab === 'quiz' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard title="完成測驗人數" value={quiz?.completed ?? 0} icon={Brain} />
                <StatCard title="完成率" value={`${quiz?.completionRate ?? 0}%`} icon={Eye} />
              </div>

              <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-foreground">學習風格分布</h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  測驗結果依學習風格類型（D/A/O/L/C）分布，反映用戶行動傾向
                </p>
                {(quiz?.byRole?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">尚無測驗資料</p>
                ) : (
                  <div className="space-y-3">
                    {quiz?.byRole.map(({ role, count, rate }) => (
                      <div key={role} className="flex items-center gap-3">
                        <div className="w-32 shrink-0">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            <span className="font-mono font-bold">{role}</span>
                            <span className="font-normal text-primary/80">
                              {ROLE_LABELS[role] ?? ''}
                            </span>
                          </span>
                        </div>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                          {count} 人 ({rate}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ Persona ─ */}
          {tab === 'persona' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard title="題目總數" value={persona?.totalQuestions ?? 0} icon={Users} />
                <StatCard title="有回答用戶" value={persona?.usersAnswered ?? 0} icon={Users} />
                <StatCard title="總回答數" value={persona?.totalAnswers ?? 0} icon={Eye} />
              </div>

              <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-foreground">各題回答率</h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  人物誌問卷中每道題目的填答人數，可了解哪些問題最受用戶回應
                </p>
                {(persona?.questions?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">尚無人物誌資料</p>
                ) : (
                  <div className="space-y-3">
                    {persona?.questions.map(({ id, prompt, answerCount }) => {
                      const maxCount = Math.max(
                        ...(persona?.questions ?? []).map((q) => q.answerCount),
                        1,
                      )
                      const pct = Math.round((answerCount / maxCount) * 100)
                      return (
                        <div key={id} className="flex items-center gap-3">
                          <span className="w-6 shrink-0 text-xs font-mono text-muted-foreground text-right">
                            Q{id}
                          </span>
                          <span
                            className="w-64 shrink-0 text-xs text-foreground truncate"
                            title={prompt}
                          >
                            {prompt}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                            {answerCount} 人
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ Category ─ */}
          {tab === 'category' && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">
                平台提供的 Practice 模板依主題分類，共{' '}
                <span className="font-medium text-foreground">{collections.length}</span> 個主題
              </p>
              {collections.length === 0 ? (
                <p className="text-sm text-muted-foreground">目前尚無主題資料</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className="rounded-xl border border-[var(--admin-card-border)] bg-primary/5 p-4 flex items-center gap-3"
                    >
                      <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                        <Layers className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">
                          {extractShortName(col.description, col.name)}
                        </p>
                        <p
                          className="text-xs text-muted-foreground truncate"
                          title={col.description}
                        >
                          {col.description || col.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 tabular-nums mt-0.5">
                          {col.count} 個模板
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
