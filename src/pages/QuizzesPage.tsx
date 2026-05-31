import { ClipboardList, FileQuestion, Hash, Percent, Plus } from 'lucide-react'
import type { Quiz, QuizQuestion } from '@/api/admin-learning'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useQuizzes } from '@/hooks/useQuizzes'
import { cn } from '@/lib/utils'

export function QuizzesPage() {
  const { data: quizzesData } = useQuizzes()
  const quizzes = quizzesData ?? ([] as Quiz[])
  const quizQuestions: QuizQuestion[] = []

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl leading-none font-semibold tracking-tight text-foreground">
          測驗管理
        </h1>
        <Button type="button">
          <Plus className="h-4 w-4" />
          建立測驗
        </Button>
      </div>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="總測驗" value={8} icon={ClipboardList} change={1.5} changeLabel="較上月" />
        <StatCard title="平均通過率" value="72%" icon={Percent} change={4.2} changeLabel="較上月" />
        <StatCard title="總作答次數" value="1,234" icon={Hash} change={12.3} changeLabel="較上月" />
      </div>

      {/* ── Quiz table ─────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
          測驗列表
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">測驗名稱</th>
                <th className="pb-3 pr-4 font-medium">附加課程</th>
                <th className="pb-3 pr-4 font-medium">題目數</th>
                <th className="pb-3 pr-4 font-medium">及格線</th>
                <th className="pb-3 pr-4 font-medium">平均分</th>
                <th className="pb-3 pr-4 font-medium">通過率</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr
                  key={quiz.name}
                  className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">{quiz.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{quiz.course}</td>
                  <td className="py-3 pr-4 text-foreground">{quiz.questions}</td>
                  <td className="py-3 pr-4 text-foreground">{quiz.passingScore}%</td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        'font-medium',
                        quiz.avgScore >= quiz.passingScore ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {quiz.avgScore}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            quiz.passRate >= 75
                              ? 'bg-success'
                              : quiz.passRate >= 50
                                ? 'bg-warning'
                                : 'bg-destructive',
                          )}
                          style={{ width: `${quiz.passRate}%` }}
                        />
                      </div>
                      <span className="text-foreground">{quiz.passRate}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-auto px-0 py-0 text-primary"
                    >
                      編輯
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Per-question stats ─────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileQuestion className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            題目分析
          </h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            前端基礎測驗
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">題目</th>
                <th className="pb-3 pr-4 font-medium">類型</th>
                <th className="pb-3 pr-4 font-medium">正確率</th>
                <th className="pb-3 font-medium">最常錯答案</th>
              </tr>
            </thead>
            <tbody>
              {quizQuestions.map((q) => (
                <tr
                  key={q.question}
                  className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground max-w-xs truncate">
                    {q.question}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        q.type === '選擇'
                          ? 'bg-primary/10 text-primary'
                          : q.type === '是非'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning',
                      )}
                    >
                      {q.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            q.correctRate >= 70
                              ? 'bg-success'
                              : q.correctRate >= 50
                                ? 'bg-warning'
                                : 'bg-destructive',
                          )}
                          style={{ width: `${q.correctRate}%` }}
                        />
                      </div>
                      <span className="text-foreground">{q.correctRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{q.commonWrong}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
