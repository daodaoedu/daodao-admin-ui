import { ArrowRight, BookOpen, GraduationCap, Plus, Users } from 'lucide-react'
import type { LearningPath } from '@/api/admin-learning'
import { Button } from '@/components/ui/button'
import { useLearningPaths } from '@/hooks/useLearningPaths'
import { cn } from '@/lib/utils'

export function LearningPathsPage() {
  const { data: pathsData } = useLearningPaths()
  const paths = pathsData ?? ([] as LearningPath[])

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">學習路徑</h1>
        <Button type="button">
          <Plus className="h-4 w-4" />
          建立路徑
        </Button>
      </div>

      {/* ── Path cards ─────────────────────────────────── */}
      {paths.map((path) => (
        <div key={path.name} className="admin-panel-card p-5">
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
                <span className="admin-chip">{course}</span>
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
                  path.completionRate >= 40
                    ? 'bg-success'
                    : path.completionRate >= 30
                      ? 'bg-warning'
                      : 'bg-destructive',
                )}
                style={{ width: `${path.completionRate}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground">
              {path.completionRate}% 完成率
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
