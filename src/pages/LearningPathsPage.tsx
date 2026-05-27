import { ArrowRight, BookOpen, GraduationCap, Plus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOCK_PATHS = [
  {
    name: '前端開發入門',
    description: '從零開始學習前端開發，涵蓋 HTML、CSS、JavaScript 到 React 框架。',
    courses: ['HTML 基礎', 'CSS 基礎', 'JavaScript 入門', 'React 入門'],
    enrolled: 234,
    completionRate: 38,
  },
  {
    name: '資料科學基礎',
    description: '掌握資料科學核心技能，從 Python 程式設計到資料視覺化。',
    courses: ['Python 入門', '統計基礎', '資料視覺化'],
    enrolled: 156,
    completionRate: 42,
  },
  {
    name: 'AI 應用開發',
    description: '深入學習 AI 與機器學習，從基礎理論到 LLM 應用實作。',
    courses: ['ML 基礎', '深度學習', 'LLM 應用'],
    enrolled: 89,
    completionRate: 25,
  },
]

export function LearningPathsPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">學習路徑</h1>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          建立路徑
        </button>
      </div>

      {/* ── Path cards ─────────────────────────────────── */}
      {MOCK_PATHS.map((path) => (
        <div
          key={path.name}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          {/* Path header */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="heading-sm">{path.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{path.description}</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{path.courses.length} 門課程</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{path.enrolled} 已註冊</span>
              </div>
            </div>
          </div>

          {/* Course sequence */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {path.courses.map((course, i) => (
              <div key={course} className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
                  {course}
                </span>
                {i < path.courses.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Completion rate bar */}
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className={cn(
                  'h-2 rounded-full',
                  path.completionRate >= 40 ? 'bg-success' : path.completionRate >= 30 ? 'bg-warning' : 'bg-destructive',
                )}
                style={{ width: `${path.completionRate}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground">{path.completionRate}% 完成率</span>
          </div>
        </div>
      ))}
    </div>
  )
}
