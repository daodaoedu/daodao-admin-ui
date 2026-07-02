import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Brain,
  CheckCircle2,
  Eye,
  PieChart,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { useContentPerformance } from '@/hooks/useContentPerformance'
import { usePersonaStats } from '@/hooks/useOnboardingAnalytics'

type DatePreset = '1' | '7' | '30'

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: '今天', value: '1' },
  { label: '7 天', value: '7' },
  { label: '30 天', value: '30' },
]

export function PersonaStatusPage() {
  const [preset, setPreset] = useState<DatePreset>('7')
  const { data: performanceData, isLoading: isLoadingPerformance } = useContentPerformance(
    Number(preset),
  )
  const { data: personaAnalytics, isLoading: isLoadingPersonaStats } = usePersonaStats(
    Number(preset),
  )

  const isLoading = isLoadingPerformance || isLoadingPersonaStats
  const distribution = personaAnalytics?.answerCountDistribution ?? []
  const topQuestions = personaAnalytics?.topQuestions ?? []
  const personaQuestionRows = performanceData?.personaSummary?.questions ?? []
  const persona = performanceData?.personaSummary

  const totalUsersByDistribution = useMemo(
    () => distribution.reduce((acc, item) => acc + item.userCount, 0),
    [distribution],
  )
  const maxTopQuestionCount = useMemo(
    () => Math.max(...topQuestions.map((q) => q.answerCount), 1),
    [topQuestions],
  )
  const maxQuestionAnswerCount = useMemo(
    () => Math.max(...personaQuestionRows.map((q) => q.answerCount), 1),
    [personaQuestionRows],
  )
  const anyAnswerRate = personaAnalytics?.anyAnswerRate ?? 0
  const avgAnswerCountText = Number((personaAnalytics?.avgAnswerCount ?? 0).toFixed(1))
  const totalQuestions = persona?.totalQuestions ?? 0
  const totalAnsweredUsers = persona?.usersAnswered ?? 0
  const totalAnswers = persona?.totalAnswers ?? 0
  const unlockedUsers = personaAnalytics?.unlockedCount ?? 0
  const unansweredQuestions = useMemo(
    () => personaQuestionRows.filter((q) => q.answerCount === 0).length,
    [personaQuestionRows],
  )
  const unansweredRate =
    totalQuestions > 0 ? Math.round((unansweredQuestions / totalQuestions) * 100) : 0
  const topQuestionCoverage = useMemo(
    () => personaQuestionRows.filter((q) => q.answerCount > 0).length,
    [personaQuestionRows],
  )
  const topQuestionCoverageRate =
    totalQuestions > 0 ? Math.round((topQuestionCoverage / totalQuestions) * 100) : 0
  const nonRespondedUsers = Math.max(unlockedUsers - totalAnsweredUsers, 0)
  const nonRespondedRate =
    unlockedUsers > 0 ? Math.round((nonRespondedUsers / unlockedUsers) * 100) : 0
  const lowProgressUsers = useMemo(
    () =>
      distribution
        .filter((item) => item.answerCount >= 1 && item.answerCount <= 2)
        .reduce((acc, item) => acc + item.userCount, 0),
    [distribution],
  )
  const midProgressUsers = useMemo(
    () =>
      distribution
        .filter((item) => item.answerCount >= 3 && item.answerCount <= 5)
        .reduce((acc, item) => acc + item.userCount, 0),
    [distribution],
  )
  const highProgressUsers = useMemo(
    () =>
      distribution
        .filter((item) => item.answerCount >= 6)
        .reduce((acc, item) => acc + item.userCount, 0),
    [distribution],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="人物誌填寫統計"
        description="運營診斷儀表板：先看題目是否被完整設計與覆蓋，再看用戶填寫是否有斷流。可直接用於題目優化會議與填寫率改善。"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--admin-card-border)] bg-muted/40 p-0.5">
              {DATE_PRESETS.map(({ label, value }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setPreset(value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    preset === value
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link
              to="/persona-questions"
              className="inline-flex h-9 items-center rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
            >
              前往人物誌題目管理
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 py-16 text-center text-sm text-muted-foreground">
          載入中...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">指標口訣（先讀）</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              不把題目管理與填寫統計混在一起，才不會把「題目好不好」和「流程有沒有流失」判斷成一件事。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  題目管理：題目設計與題庫質量
                </div>
                包含題目總數、未回覆題目、熱門題、逐題回答人次。
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-foreground">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  填寫統計：用戶進度與答題率
                </div>
                包含有回答用戶、平均回答題數、回答題數分布、未作答與高作答人群。
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">本頁區分指標</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              題目管理與填寫統計採用不同邏輯，請先確認是「題目品質」問題還是「流程漏斗」問題。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="mr-1 font-medium text-foreground">題目管理：</span>
                以題目數量、每題回答人次與熱門題目熱度檢查題庫完整性與品質。
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="mr-1 font-medium text-foreground">填寫統計：</span>
                以答題用戶、總回答、回答題數分佈、平均每人回答題數與有回答率檢視落版效率。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatCard title="題目總數" value={persona?.totalQuestions ?? 0} icon={Brain} />
            <StatCard title="有回答用戶" value={totalAnsweredUsers} icon={Users} />
            <StatCard title="總回答數" value={totalAnswers} icon={Eye} />
            <StatCard title="有回答率" value={`${anyAnswerRate}%`} icon={PieChart} />
            <StatCard title="平均回答題數" value={avgAnswerCountText} icon={BarChart3} />
            <StatCard title="已解鎖" value={`${unlockedUsers} 人`} icon={Users} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-4 shadow-sm">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                題目管理健康檢查
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  未回覆題目：
                  <span className="font-medium text-foreground">{unansweredQuestions}</span> 題（
                  {unansweredRate}%）
                </li>
                <li>
                  有回覆題目：
                  <span className="font-medium text-foreground">{topQuestionCoverage}</span> 題（
                  {topQuestionCoverageRate}%）
                </li>
                <li className="text-[11px] text-muted-foreground/80">
                  判讀方式：未回覆題目比例高時，優先檢查題幹、選項可理解度、排序與曝光位置。
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-4 shadow-sm">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <ArrowUpDown className="h-4 w-4 text-primary" />
                填寫流程風險
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  未作答用戶：
                  <span className="font-medium text-foreground">{nonRespondedUsers}</span> 人 （
                  {nonRespondedRate}%）
                </li>
                <li>低進度（1-2題）：{lowProgressUsers} 人</li>
                <li>中進度（3-5題）：{midProgressUsers} 人</li>
                <li>高進度（6+題）：{highProgressUsers} 人</li>
                <li className="text-[11px] text-muted-foreground/80">
                  判讀方式：低進度比例高通常代表導引文案、題目難度或頁面體驗需要修正。
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">回答題數分佈</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              查看每位使用者實際有回答的題目數分布
            </p>
            {distribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無填寫分佈資料</p>
            ) : (
              <div className="space-y-3">
                {[...distribution]
                  .sort((a, b) => a.answerCount - b.answerCount)
                  .map(({ answerCount, userCount }) => {
                    const pct =
                      totalUsersByDistribution > 0
                        ? Math.round((userCount / totalUsersByDistribution) * 100)
                        : 0
                    return (
                      <div key={answerCount} className="flex items-center gap-3">
                        <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                          {answerCount} 題
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                          {userCount} 人 ({pct}%)
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">熱門題目</h3>
            <p className="mb-4 text-xs text-muted-foreground">按回答數排序的題目關注程度</p>
            {topQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無題目回覆資料</p>
            ) : (
              <div className="space-y-3">
                {topQuestions.map(({ questionId, prompt, answerCount }) => {
                  const pct = Math.round((answerCount / maxTopQuestionCount) * 100)
                  return (
                    <div key={questionId} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        Q{questionId}
                      </span>
                      <span className="flex-1 text-xs text-foreground truncate" title={prompt}>
                        {prompt}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[240px]">
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

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">題目回答率（逐題）</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              以內容分析彙總的每題回答數做對比，對應上方「題目管理健康檢查」定位題目風險。
            </p>
            {personaQuestionRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無題目資料</p>
            ) : (
              <div className="space-y-3">
                {personaQuestionRows.map(({ id, prompt, answerCount }) => {
                  const pct = Math.round((answerCount / maxQuestionAnswerCount) * 100)
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
    </div>
  )
}
