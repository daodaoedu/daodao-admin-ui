import { CheckCircle, Clock, ListChecks, Plus, UserPlus } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useOnboardingFlows } from '@/hooks/useOnboardingFlows'
import { cn } from '@/lib/utils'

const FLOW_STEPS = [
  {
    id: 1,
    question: '你對什麼感興趣？',
    type: '單選',
    topAnswer: '程式設計',
    topPercent: 45,
    completionRate: 100,
  },
  {
    id: 2,
    question: '你的學習目標？',
    type: '多選',
    topAnswer: '轉職',
    topPercent: 38,
    completionRate: 85,
  },
  {
    id: 3,
    question: '你的經驗程度？',
    type: '單選',
    topAnswer: '初學者',
    topPercent: 52,
    completionRate: 72,
  },
]

const FUNNEL_STEPS = [
  { label: 'Step 1', value: 100 },
  { label: 'Step 2', value: 85 },
  { label: 'Step 3', value: 72 },
  { label: '完成', value: 68 },
]

export function OnboardingFlowsPage() {
  const { data: flows } = useOnboardingFlows()
  const activeFlow = flows?.find((f) => f.isActive) ?? null
  const displaySteps = activeFlow?.steps ?? FLOW_STEPS
  const completionRate = activeFlow?.completionRate ?? 68
  const avgDuration = activeFlow?.avgDurationMinutes ?? 3.2
  const newUsers = activeFlow?.newUsersThisMonth ?? 234

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">Onboarding 流程</h1>
        <Button type="button">
          <Plus className="h-4 w-4" />
          建立流程
        </Button>
      </div>

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
          title="本月新用戶"
          value={newUsers}
          change={12.1}
          changeLabel="vs 上月"
          icon={UserPlus}
        />
      </div>

      {/* Active Flow */}
      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            <h2 className="heading-sm">目前啟用的流程</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            啟用
          </span>
        </div>

        <p className="mb-4 text-sm text-foreground font-medium">
          {activeFlow?.name ?? '新手引導 v2'}
        </p>

        <div className="space-y-4">
          {displaySteps.map((step) => (
            <div key={step.id} className="admin-card-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {step.id}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{step.question}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {step.type} &middot; 最常回答：{step.topAnswer}（{step.topPercent}%）
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-foreground">
                  {step.completionRate}%
                </span>
              </div>
              {/* Completion bar */}
              <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    (step.completionRate ?? 0) >= 80 ? 'bg-success' : 'bg-primary',
                  )}
                  style={{ width: `${step.completionRate ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel Analytics */}
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">Onboarding 漏斗分析</h2>
        <div className="flex items-end gap-2">
          {FUNNEL_STEPS.map((step, i) => (
            <div key={step.label} className="flex flex-1 flex-col items-center gap-2">
              {/* Bar */}
              <div className="relative flex h-48 w-full items-end justify-center">
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all',
                    i === FUNNEL_STEPS.length - 1 ? 'bg-success' : 'bg-primary/80',
                  )}
                  style={{ height: `${step.value}%` }}
                />
                <span className="absolute top-0 left-1/2 -translate-x-1/2 text-sm font-semibold text-foreground">
                  {step.value}%
                </span>
              </div>
              {/* Label */}
              <span className="text-xs text-muted-foreground">{step.label}</span>
              {/* Arrow */}
              {i < FUNNEL_STEPS.length - 1 && <span className="absolute text-muted-foreground" />}
            </div>
          ))}
        </div>
        {/* Drop-off summary */}
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span>Step 1 → 2：-15%</span>
          <span>Step 2 → 3：-13%</span>
          <span>Step 3 → 完成：-4%</span>
        </div>
      </div>
    </div>
  )
}
