import { AlertTriangle, BookOpen, Eye, Percent } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useLearningCourses, useStalledUsers } from '@/hooks/useLearningCourses'
import { clampPercent, safeNumber } from '@/lib/number'
import { cn } from '@/lib/utils'

export function LearningProgressPage() {
  const { data: coursesData } = useLearningCourses()
  const courses = coursesData ?? []

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const { data: stalledUsers = [] } = useStalledUsers(selectedCourseId)

  const selectedCourse = courses.find((c) => c.id === selectedCourseId)
  const averageCompletionRate =
    courses.length > 0
      ? Math.round(
          courses.reduce((sum, course) => sum + clampPercent(course.completionRate), 0) /
            courses.length,
        )
      : 0

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <PageHeader
        title="課程進度追蹤"
        description="查看成員的學習完成率、停滯點與整體進度，找出需要輔助的對象。"
      />

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="總課程"
          value={courses.length}
          icon={BookOpen}
          change={2.0}
          changeLabel="較上月"
        />
        <StatCard
          title="平均完成率"
          value={`${averageCompletionRate}%`}
          icon={Percent}
          change={3.5}
          changeLabel="較上月"
        />
        <StatCard
          title="停滯用戶"
          value={stalledUsers.length}
          icon={AlertTriangle}
          change={-8.2}
          changeLabel="較上月"
        />
      </div>

      {/* ── Course table ───────────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
          課程概覽
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">課程名稱</th>
                <th className="pb-3 pr-4 font-medium">註冊數</th>
                <th className="pb-3 pr-4 font-medium">完成率</th>
                <th className="pb-3 pr-4 font-medium">平均進度</th>
                <th className="pb-3 pr-4 font-medium">卡關課時</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const enrolled = safeNumber(course.enrolled)
                const completionRate = clampPercent(course.completionRate)
                const avgProgress = clampPercent(course.avgProgress)

                return (
                  <tr
                    key={course.id ?? course.name}
                    className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">{course.name}</td>
                    <td className="py-3 pr-4 text-foreground">{enrolled.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-2 rounded-full',
                              completionRate >= 60
                                ? 'bg-success'
                                : completionRate >= 40
                                  ? 'bg-warning'
                                  : 'bg-destructive',
                            )}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-foreground">{completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-foreground">{avgProgress}%</td>
                    <td className="py-3 pr-4 text-muted-foreground">{course.stuckLesson || '-'}</td>
                    <td className="py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="h-auto px-0 py-0 text-primary"
                        onClick={() => setSelectedCourseId(course.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        查看詳情
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Stalled users ──────────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            停滯用戶{selectedCourse ? `：${selectedCourse.name}` : ''}
          </h2>
        </div>
        {!selectedCourseId && (
          <p className="text-sm text-muted-foreground">請先從上方課程表選擇一門課</p>
        )}
        {selectedCourseId && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">用戶</th>
                  <th className="pb-3 pr-4 font-medium">課程</th>
                  <th className="pb-3 pr-4 font-medium">進度</th>
                  <th className="pb-3 font-medium">停滯天數</th>
                </tr>
              </thead>
              <tbody>
                {stalledUsers.map((row) => {
                  const progress = clampPercent(row.progress)
                  const stalledDays = safeNumber(row.stalledDays)

                  return (
                    <tr
                      key={`${row.user}-${row.course}`}
                      className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                    >
                      <td className="py-3 pr-4 font-medium text-foreground">{row.user}</td>
                      <td className="py-3 pr-4 text-foreground">{row.course}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-warning"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-foreground">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            stalledDays >= 21
                              ? 'bg-destructive/15 text-destructive'
                              : stalledDays >= 14
                                ? 'bg-warning/15 text-warning'
                                : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {stalledDays} 天
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
