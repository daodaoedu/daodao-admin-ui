import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Clock, ListChecks, Plus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getEngagementStats, getPersonaStats, getQuizStats } from '@/api/admin-community'
import type { LearningStyleType } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useOnboardingFlowAnalytics, useOnboardingFlows } from '@/hooks/useOnboardingFlows'
import { cn } from '@/lib/utils'

const PERIOD_OPTIONS = [
  { value: '0', label: '全部期間' },
  { value: '7', label: '近 7 天' },
  { value: '14', label: '近 14 天' },
  { value: '30', label: '近 30 天' },
  { value: '90', label: '近 90 天' },
]

const QUESTION_TYPE_LABEL: Record<string, string> = {
  single: '單選',
  multi: '多選',
  text: '文字',
}

const LEARNING_STYLE_LABEL: Record<LearningStyleType, { name: string; island: string }> = {
  D: { name: '探究者', island: '探探島' },
  A: { name: '行動者', island: '動動島' },
  O: { name: '結構者', island: '構構島' },
  L: { name: '流動者', island: '跨跨島' },
  C: { name: '連結者', island: '連連島' },
}

const ROLE_ORDER: LearningStyleType[] = ['D', 'A', 'O', 'L', 'C']

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
      <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ─── Section A: 學習風格測驗分布 ──────────────────────────────────────────────

function QuizStatsSection({ days }: { days?: number }) {
  const { data } = useQuery({
    queryKey: ['admin', 'quiz-stats', days],
    queryFn: () => getQuizStats(days ? { days } : undefined).then((r) => r.data.data),
  })

  if (!data) return null

  return (
    <SectionCard title="A. 學習風格測驗分布">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniStat label="測驗完成率" value={`${data.quizCompletedRate?.toFixed(1) ?? 0}%`} />
          <MiniStat label="已測驗人數" value={data.quizCompletedCount?.toLocaleString() ?? 0} />
          <MiniStat label="總用戶數" value={data.totalUsers?.toLocaleString() ?? 0} />
        </div>

        <div className="space-y-3">
          {ROLE_ORDER.map((role) => {
            const info = data.byRole?.[role]
            return (
              <div key={role} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-foreground">
                  {role} {LEARNING_STYLE_LABEL[role].name}
                </span>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{info?.rate?.toFixed(1) ?? 0}%</span>
                    <span>{info?.count?.toLocaleString() ?? 0} 人</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${info?.rate ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Section B: 人物誌填寫狀況 ────────────────────────────────────────────────

function PersonaStatsSection({ days }: { days?: number }) {
  const { data } = useQuery({
    queryKey: ['admin', 'persona-stats', days],
    queryFn: () => getPersonaStats(days ? { days } : undefined).then((r) => r.data.data),
  })

  if (!data) return null

  return (
    <SectionCard title="B. 人物誌填寫狀況">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="至少填 1 題" value={`${data.anyAnswerRate?.toFixed(1) ?? 0}%`} />
          <MiniStat label="已解鎖（≥5 題）" value={`${data.unlockedRate?.toFixed(1) ?? 0}%`} />
          <MiniStat label="平均填題數" value={data.avgAnswerCount?.toFixed(1) ?? 0} />
          <MiniStat label="總用戶數" value={data.totalUsers?.toLocaleString() ?? 0} />
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">至少填 1 題</span>
              <span className="text-muted-foreground">
                {data.anyAnswerRate?.toFixed(1) ?? 0}%（{data.anyAnswerCount} / {data.totalUsers}{' '}
                人）
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${data.anyAnswerRate ?? 0}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">已解鎖（≥5 題）</span>
              <span className="text-muted-foreground">
                {data.unlockedRate?.toFixed(1) ?? 0}%（{data.unlockedCount} / {data.totalUsers} 人）
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${data.unlockedRate ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {(data.answerCountDistribution?.length ?? 0) > 0 && (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data.answerCountDistribution} margin={{ bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="answerCount"
                tick={{ fontSize: 11 }}
                label={{ value: '填題數', position: 'insideBottom', offset: -8, fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val) => [`${val} 人`, '用戶數']}
                labelFormatter={(v) => `填 ${v} 題`}
              />
              <Bar dataKey="userCount" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </SectionCard>
  )
}

// ─── Section C: 參與度指標 ────────────────────────────────────────────────────

function EngagementSection({ days }: { days?: number }) {
  const { data } = useQuery({
    queryKey: ['admin', 'engagement-stats', days],
    queryFn: () => getEngagementStats(days ? { days } : undefined).then((r) => r.data.data),
  })

  if (!data) return null

  return (
    <SectionCard title="C. 參與度指標">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MiniStat
          label="平均建立實踐數"
          value={data.practiceStats?.avgPracticeCount?.toFixed(1) ?? 0}
        />
        <MiniStat
          label="平均活躍實踐數"
          value={data.practiceStats?.avgActivePracticeCount?.toFixed(1) ?? 0}
        />
        <MiniStat
          label="實踐放棄率"
          value={`${data.practiceStats?.abandonmentRate?.toFixed(1) ?? 0}%`}
        />
        <MiniStat
          label="曾達 7 天 streak"
          value={data.checkinStats?.usersWithStreak7Plus?.toLocaleString() ?? 0}
        />
        <MiniStat
          label="曾達 30 天 streak"
          value={data.checkinStats?.usersWithStreak30Plus?.toLocaleString() ?? 0}
        />
      </div>
    </SectionCard>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OnboardingFlowsPage() {
  const [periodDays, setPeriodDays] = useState(0)
  const days = periodDays > 0 ? periodDays : undefined

  const { data: flows } = useOnboardingFlows()
  const activeFlow = flows?.find((f) => f.isEnabled) ?? null
  const { data: analytics } = useOnboardingFlowAnalytics(activeFlow?.id ?? 0)

  const completionRate = activeFlow?.completionRate ?? 0
  const avgDuration = analytics?.averageTimeMinutes ?? 0
  const totalStarted = analytics?.totalStarted ?? 0

  const funnelSteps = activeFlow
    ? [
        ...activeFlow.steps.map((step, i) => {
          const dropStep = analytics?.dropOffSteps.find((d) => d.stepId === step.id)
          return { label: `Step ${i + 1}`, value: dropStep != null ? 100 - dropStep.dropRate : 0 }
        }),
        { label: '完成', value: completionRate },
      ]
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding 流程"
        description="設計新用戶入門體驗步驟，追蹤各步驟完成率並優化引導流程。"
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={String(periodDays)}
              onValueChange={(v) => setPeriodDays(Number(v))}
              options={PERIOD_OPTIONS}
              triggerClassName="min-w-[120px]"
            />
            <Button type="button">
              <Plus className="h-4 w-4" />
              建立流程
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="完成率" value={`${completionRate}%`} icon={CheckCircle} />
        <StatCard title="平均完成時間" value={`${avgDuration} 分鐘`} icon={Clock} />
        <StatCard title="本月開始人數" value={totalStarted} icon={UserPlus} />
      </div>

      {/* Active Flow */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              目前啟用的流程
            </h2>
          </div>
          {activeFlow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              啟用
            </span>
          )}
        </div>

        {activeFlow ? (
          <>
            <p className="mb-4 text-sm font-medium text-foreground">{activeFlow.name}</p>
            <div className="space-y-4">
              {activeFlow.steps.map((step, i) => (
                <div
                  key={step.id}
                  className="rounded-lg border border-[var(--admin-panel-border)] bg-card/90 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{step.questionText}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {QUESTION_TYPE_LABEL[step.questionType] ?? step.questionType}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-foreground">
                      {step.completionRate}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        step.completionRate >= 80 ? 'bg-success' : 'bg-primary',
                      )}
                      style={{ width: `${step.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">目前沒有啟用的流程</p>
        )}
      </div>

      {/* Funnel Analytics */}
      {funnelSteps.length > 0 && (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
            Onboarding 漏斗分析
          </h2>
          <div className="flex items-end gap-2">
            {funnelSteps.map((step, i) => (
              <div key={step.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex h-48 w-full items-end justify-center">
                  <div
                    className={cn(
                      'w-full rounded-t-md transition-all',
                      i === funnelSteps.length - 1 ? 'bg-success' : 'bg-primary/80',
                    )}
                    style={{ height: `${step.value}%` }}
                  />
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 text-sm font-semibold text-foreground">
                    {step.value}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{step.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {funnelSteps.slice(0, -1).map((step, i) => {
              const next = funnelSteps[i + 1]
              const drop = step.value - (next?.value ?? 0)
              return (
                <span key={step.label}>
                  {step.label} → {next?.label}：-{drop}%
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Analytics Sections ─────────────────────────────────────────── */}
      <div className="border-t border-border pt-2">
        <h2 className="text-xl leading-none font-semibold tracking-tight text-foreground">
          註冊後追蹤分析
        </h2>
      </div>

      <QuizStatsSection days={days} />
      <PersonaStatsSection days={days} />
      <EngagementSection days={days} />
    </div>
  )
}
