import { CheckCircle, ClipboardList, FileQuestion, Hash, Percent, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatCard } from '@/components/StatCard'

const MOCK_QUIZZES = [
  { name: '前端基礎測驗', course: 'React 入門實戰', questions: 15, passingScore: 70, avgScore: 78, passRate: 82 },
  { name: 'TypeScript 型別挑戰', course: 'TypeScript 完全指南', questions: 20, passingScore: 75, avgScore: 62, passRate: 58 },
  { name: 'Node.js 核心概念', course: 'Node.js 後端開發', questions: 12, passingScore: 70, avgScore: 71, passRate: 72 },
  { name: 'CSS 選擇器測驗', course: 'CSS 動畫大師班', questions: 10, passingScore: 80, avgScore: 85, passRate: 88 },
  { name: 'Git 工作流程', course: 'Git 版本控制', questions: 8, passingScore: 60, avgScore: 74, passRate: 90 },
]

const MOCK_QUESTION_STATS = [
  { question: 'React 中 useEffect 的清理函式何時執行？', type: '選擇', correctRate: 45, commonWrong: '元件掛載時' },
  { question: 'Virtual DOM 的主要目的是什麼？', type: '選擇', correctRate: 72, commonWrong: '取代真實 DOM' },
  { question: 'JSX 是 JavaScript 的語法糖', type: '是非', correctRate: 88, commonWrong: '否' },
  { question: '解釋 React 中 key 的作用', type: '簡答', correctRate: 38, commonWrong: '未提及 reconciliation' },
]

export function QuizzesPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">測驗管理</h1>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          建立測驗
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="總測驗" value={8} icon={ClipboardList} change={1.5} changeLabel="較上月" />
        <StatCard title="平均通過率" value="72%" icon={Percent} change={4.2} changeLabel="較上月" />
        <StatCard title="總作答次數" value="1,234" icon={Hash} change={12.3} changeLabel="較上月" />
      </div>

      {/* ── Quiz table ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 heading-sm">測驗列表</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
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
              {MOCK_QUIZZES.map((quiz) => (
                <tr key={quiz.name} className="border-b border-border last:border-0">
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
                            quiz.passRate >= 75 ? 'bg-success' : quiz.passRate >= 50 ? 'bg-warning' : 'bg-destructive',
                          )}
                          style={{ width: `${quiz.passRate}%` }}
                        />
                      </div>
                      <span className="text-foreground">{quiz.passRate}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <button className="text-primary hover:underline">編輯</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Per-question stats ─────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileQuestion className="h-4 w-4 text-muted-foreground" />
          <h2 className="heading-sm">題目分析</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            前端基礎測驗
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">題目</th>
                <th className="pb-3 pr-4 font-medium">類型</th>
                <th className="pb-3 pr-4 font-medium">正確率</th>
                <th className="pb-3 font-medium">最常錯答案</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_QUESTION_STATS.map((q) => (
                <tr key={q.question} className="border-b border-border last:border-0">
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
                            q.correctRate >= 70 ? 'bg-success' : q.correctRate >= 50 ? 'bg-warning' : 'bg-destructive',
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
