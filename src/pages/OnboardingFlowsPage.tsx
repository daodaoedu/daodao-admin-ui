import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Clock, ListChecks, Plus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  getEmailOnboardingStats,
  getEngagementStats,
  getOnboardingStats,
  getPersonaStats,
  getQuizStats,
} from '@/api/admin-community'
import type { LearningStyleType, OnboardingEmailType } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useOnboardingFlowAnalytics, useOnboardingFlows } from '@/hooks/useOnboardingFlows'
import { cn } from '@/lib/utils'

const QUESTION_TYPE_LABEL: Record<string, string> = {
  single: '單選',
  multi: '多選',
  text: '文字',
}

const REGISTRATION_FLOW_LABEL: Record<string, string> = {
  landing_page: 'Landing Page',
  quiz: '測驗',
  action_maker: 'Action Maker',
}

const CREATION_METHOD_LABEL: Record<string, string> = {
  self_created: '自建',
  copied: '複製',
  action_generator: '產生器',
}

const LEARNING_STYLE_LABEL: Record<LearningStyleType, { name: string; island: string }> = {
  D: { name: '探究者', island: '探探島' },
  A: { name: '行動者', island: '動動島' },
  O: { name: '結構者', island: '構構島' },
  L: { name: '流動者', island: '跨跨島' },
  C: { name: '連結者', island: '連連島' },
}

const EMAIL_TYPE_LABEL: Record<OnboardingEmailType, string> = {
  L0: 'L0 歡迎信',
  A: 'A 任務A',
  B: 'B 任務B',
  C: 'C 任務C',
  D: 'D 任務D',
  E: 'E 任務E',
}

const ROLE_ORDER: LearningStyleType[] = ['D', 'A', 'O', 'L', 'C']
const EMAIL_ORDER: OnboardingEmailType[] = ['L0', 'A', 'B', 'C', 'D', 'E']

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

function HBarRow({
  label,
  value,
  total,
  colorClass = 'bg-primary',
}: {
  label: string
  value: number
  total: number
  colorClass?: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {pct}%（{value.toLocaleString()} 人）
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
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

// ─── Section A + B + C + D (Onboarding Stats) ────────────────────────────────

function OnboardingStatsSection() {
  const { data } = useQuery({
    queryKey: ['admin', 'onboarding-stats'],
    queryFn: () => getOnboardingStats().then((r) => r.data.data),
  })

  if (!data) return null

  const regTotal = data.totalUsers
  const regRows = [
    { key: 'landing_page', value: data.byRegistrationFlow?.landing_page?.total ?? 0 },
    { key: 'quiz', value: data.byRegistrationFlow?.quiz?.total ?? 0 },
    { key: 'action_maker', value: data.byRegistrationFlow?.action_maker?.total ?? 0 },
  ]

  const creationTotal = Object.values(data.byCreationMethod ?? {}).reduce((s, v) => s + v, 0)
  const creationRows = [
    { key: 'self_created', value: data.byCreationMethod?.self_created ?? 0 },
    { key: 'copied', value: data.byCreationMethod?.copied ?? 0 },
    { key: 'action_generator', value: data.byCreationMethod?.action_generator ?? 0 },
  ]

  return (
    <>
      {/* A: 註冊來源分布 */}
      <SectionCard title="A. 註冊來源分布">
        <div className="space-y-3">
          {regRows.map(({ key, value }) => (
            <HBarRow
              key={key}
              label={REGISTRATION_FLOW_LABEL[key] ?? key}
              value={value}
              total={regTotal}
            />
          ))}
        </div>
      </SectionCard>

      {/* B: 實踐建立方式 */}
      <SectionCard title="B. 實踐建立方式">
        <div className="space-y-3">
          {creationRows.map(({ key, value }) => (
            <HBarRow
              key={key}
              label={CREATION_METHOD_LABEL[key] ?? key}
              value={value}
              total={creationTotal}
              colorClass="bg-blue-500"
            />
          ))}
        </div>
      </SectionCard>

      {/* C: Badge 完成率 */}
      <SectionCard title="C. Onboarding Badge 完成率">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Badge 完成率" value={`${data.badgeGrantedRate?.toFixed(1) ?? 0}%`} />
            <MiniStat label="已獲得 Badge" value={data.badgeGrantedCount?.toLocaleString() ?? 0} />
            <MiniStat
              label="平均完成天數"
              value={`${data.avgDaysToComplete?.toFixed(1) ?? 0} 天`}
            />
            <MiniStat label="總用戶數" value={data.totalUsers?.toLocaleString() ?? 0} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">已完成 Badge</span>
              <span className="text-muted-foreground">
                {data.badgeGrantedRate?.toFixed(1) ?? 0}%（{data.badgeGrantedCount} /{' '}
                {data.totalUsers} 人）
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${data.badgeGrantedRate ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* D: 完成天數分布 */}
      {(data.completionByDay?.length ?? 0) > 0 && (
        <SectionCard title="D. 任務完成天數分布（Histogram）">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.completionByDay} margin={{ bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="days"
                tick={{ fontSize: 11 }}
                label={{ value: '天數', position: 'insideBottom', offset: -8, fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val) => [`${val} 人`, '人數']}
                labelFormatter={(v) => `第 ${v} 天`}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}
    </>
  )
}

// ─── Section E: 學習風格測驗分布 ──────────────────────────────────────────────

function QuizStatsSection() {
  const [crossTab, setCrossTab] = useState<'badge' | 'source'>('badge')
  const { data } = useQuery({
    queryKey: ['admin', 'quiz-stats'],
    queryFn: () => getQuizStats().then((r) => r.data.data),
  })

  if (!data) return null

  return (
    <SectionCard title="E. 學習風格測驗分布">
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

        {/* Cross analysis */}
        <div>
          <div className="mb-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCrossTab('badge')}
              className={cn(
                crossTab === 'badge' ? 'border-primary bg-primary text-primary-foreground' : '',
              )}
            >
              角色 × Badge 完成率
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCrossTab('source')}
              className={cn(
                crossTab === 'source' ? 'border-primary bg-primary text-primary-foreground' : '',
              )}
            >
              角色 × 註冊來源
            </Button>
          </div>

          {crossTab === 'badge' && (
            <div className="space-y-2">
              {ROLE_ORDER.map((role) => {
                const info = data.byRoleAndBadge?.[role]
                const rate =
                  info?.total > 0 ? Math.round((info.badgeGranted / info.total) * 100) : 0
                return (
                  <div key={role} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 text-muted-foreground">
                      {role} {LEARNING_STYLE_LABEL[role].name}
                    </span>
                    <div
                      className="flex-1 overflow-hidden rounded-full bg-muted"
                      style={{ height: 8 }}
                    >
                      <div
                        className="h-full rounded-full bg-success"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-muted-foreground">{rate}%</span>
                  </div>
                )
              })}
            </div>
          )}

          {crossTab === 'source' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">角色</th>
                    <th className="pb-2 pr-4 font-medium">Landing Page</th>
                    <th className="pb-2 pr-4 font-medium">測驗</th>
                    <th className="pb-2 font-medium">Action Maker</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLE_ORDER.map((role) => {
                    const info = data.byRoleAndRegistrationFlow?.[role] ?? {}
                    return (
                      <tr key={role} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-4 text-foreground">
                          {role} {LEARNING_STYLE_LABEL[role].name}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {info.landing_page ?? 0}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{info.quiz ?? 0}</td>
                        <td className="py-2 text-muted-foreground">{info.action_maker ?? 0}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Section F: 人物誌填寫狀況 ────────────────────────────────────────────────

function PersonaStatsSection() {
  const { data } = useQuery({
    queryKey: ['admin', 'persona-stats'],
    queryFn: () => getPersonaStats().then((r) => r.data.data),
  })

  if (!data) return null

  return (
    <SectionCard title="F. 人物誌填寫狀況">
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

// ─── Section G: Email 序列開信率 ──────────────────────────────────────────────

function EmailStatsSection() {
  const { data } = useQuery({
    queryKey: ['admin', 'email-onboarding-stats'],
    queryFn: () => getEmailOnboardingStats().then((r) => r.data.data),
  })

  if (!data) return null

  return (
    <SectionCard title="G. Email 序列開信率">
      <div className="space-y-3">
        {EMAIL_ORDER.map((type) => {
          const info = data.byEmailType?.[type]
          if (!info) return null
          return (
            <div key={type} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{EMAIL_TYPE_LABEL[type]}</span>
                <span className="text-muted-foreground">
                  {info.openRate?.toFixed(1) ?? 0}% 開信率（已寄{' '}
                  {info.sentCount?.toLocaleString() ?? 0} 封）
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${info.openRate ?? 0}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ─── Section H: 參與度指標 ────────────────────────────────────────────────────

function EngagementSection() {
  const { data } = useQuery({
    queryKey: ['admin', 'engagement-stats'],
    queryFn: () => getEngagementStats().then((r) => r.data.data),
  })

  if (!data) return null

  return (
    <SectionCard title="H. 參與度指標">
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
          <Button type="button">
            <Plus className="h-4 w-4" />
            建立流程
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="完成率"
          value={`${completionRate}%`}
          change={3.2}
          changeLabel="vs 上月"
          icon={CheckCircle}
        />
        <StatCard
          title="平均完成時間"
          value={`${avgDuration} 分鐘`}
          change={-8.5}
          changeLabel="vs 上月"
          icon={Clock}
        />
        <StatCard
          title="本月開始人數"
          value={totalStarted}
          change={12.1}
          changeLabel="vs 上月"
          icon={UserPlus}
        />
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

      {/* ─── Analytics Sections A–H ─────────────────────────────────────── */}
      <div className="border-t border-border pt-2">
        <h2 className="text-xl leading-none font-semibold tracking-tight text-foreground">
          Onboarding 追蹤分析
        </h2>
      </div>

      <OnboardingStatsSection />
      <QuizStatsSection />
      <PersonaStatsSection />
      <EmailStatsSection />
      <EngagementSection />
    </div>
  )
}
