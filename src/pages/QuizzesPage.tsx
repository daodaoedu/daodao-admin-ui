import { useQuery } from '@tanstack/react-query'
import { ClipboardList, FileQuestion, Hash, Percent, Plus } from 'lucide-react'
import { useState } from 'react'
import type { Quiz } from '@/api/admin-learning'
import { listQuizQuestions } from '@/api/admin-learning'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQuizzes } from '@/hooks/useQuizzes'
import { cn } from '@/lib/utils'

export function QuizzesPage() {
  const { data: quizzesData } = useQuizzes()
  const quizzes = quizzesData ?? ([] as Quiz[])

  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const activeQuizId = selectedQuizId ?? quizzes[0]?.id ?? null
  const activeQuiz = quizzes.find((q) => q.id === activeQuizId)

  const { data: quizQuestions = [] } = useQuery({
    queryKey: ['admin', 'learning', 'quizzes', activeQuizId, 'questions'],
    queryFn: () => listQuizQuestions(activeQuizId as string).then((r) => r.data.data),
    enabled: !!activeQuizId,
  })

  const avgPassRate =
    quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.passRate, 0) / quizzes.length)
      : 0

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <PageHeader
        title="測驗管理"
        description="建立與管理知識測驗題庫，設定通過條件與用戶作答結果查看。"
        actions={
          <Button type="button">
            <Plus className="h-4 w-4" />
            建立測驗
          </Button>
        }
      />

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="總測驗" value={quizzes.length} icon={ClipboardList} />
        <StatCard title="平均通過率" value={`${avgPassRate}%`} icon={Percent} />
        <StatCard
          title="總題目數"
          value={quizzes.reduce((sum, q) => sum + q.questions, 0)}
          icon={Hash}
        />
      </div>

      {/* ── Quiz table ─────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
          測驗列表
        </h2>
        <Table>
          <TableHeader>
            <TableRow className="text-left">
              <TableHead className="pr-4">測驗名稱</TableHead>
              <TableHead className="pr-4">附加課程</TableHead>
              <TableHead className="pr-4">題目數</TableHead>
              <TableHead className="pr-4">及格線</TableHead>
              <TableHead className="pr-4">平均分</TableHead>
              <TableHead className="pr-4">通過率</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.map((quiz) => (
              <TableRow
                key={quiz.id}
                className={cn(
                  'last:border-0 cursor-pointer',
                  quiz.id === activeQuizId && 'bg-muted/50',
                )}
                onClick={() => setSelectedQuizId(quiz.id)}
              >
                <TableCell className="pr-4 font-medium text-foreground">{quiz.name}</TableCell>
                <TableCell className="pr-4 text-muted-foreground">{quiz.course}</TableCell>
                <TableCell className="pr-4 text-foreground">{quiz.questions}</TableCell>
                <TableCell className="pr-4 text-foreground">{quiz.passingScore}%</TableCell>
                <TableCell className="pr-4">
                  <span
                    className={cn(
                      'font-medium',
                      quiz.avgScore >= quiz.passingScore ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {quiz.avgScore}
                  </span>
                </TableCell>
                <TableCell className="pr-4">
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
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-auto px-0 py-0 text-primary"
                  >
                    編輯
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Per-question stats ─────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileQuestion className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            題目分析
          </h2>
          {activeQuiz && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {activeQuiz.name}
            </span>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow className="text-left">
              <TableHead className="pr-4">題目</TableHead>
              <TableHead className="pr-4">類型</TableHead>
              <TableHead className="pr-4">正確率</TableHead>
              <TableHead>最常錯答案</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizQuestions.map((q) => (
              <TableRow key={q.question} className="last:border-0">
                <TableCell className="pr-4 font-medium text-foreground max-w-xs truncate">
                  {q.question}
                </TableCell>
                <TableCell className="pr-4">
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
                </TableCell>
                <TableCell className="pr-4">
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
                </TableCell>
                <TableCell className="text-muted-foreground">{q.commonWrong}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
