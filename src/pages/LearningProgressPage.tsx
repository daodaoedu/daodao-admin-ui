import { AlertTriangle, BookOpen, Eye, Percent } from 'lucide-react'
import { useState } from 'react'
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
        <StatCard title="總課程" value={courses.length} icon={BookOpen} />
        <StatCard title="平均完成率" value={`${averageCompletionRate}%`} icon={Percent} />
        <StatCard title="停滯用戶" value={stalledUsers.length} icon={AlertTriangle} />
      </div>

      {/* ── Course table ───────────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
          課程概覽
        </h2>
        <Table>
          <TableHeader>
            <TableRow className="text-left">
              <TableHead className="pr-4">課程名稱</TableHead>
              <TableHead className="pr-4">註冊數</TableHead>
              <TableHead className="pr-4">完成率</TableHead>
              <TableHead className="pr-4">平均進度</TableHead>
              <TableHead className="pr-4">卡關課時</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => {
              const enrolled = safeNumber(course.enrolled)
              const completionRate = clampPercent(course.completionRate)
              const avgProgress = clampPercent(course.avgProgress)

              return (
                <TableRow key={course.id ?? course.name}>
                  <TableCell className="pr-4 font-medium text-foreground">{course.name}</TableCell>
                  <TableCell className="pr-4 text-foreground">
                    {enrolled.toLocaleString()}
                  </TableCell>
                  <TableCell className="pr-4">
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
                  </TableCell>
                  <TableCell className="pr-4 text-foreground">{avgProgress}%</TableCell>
                  <TableCell className="pr-4 text-muted-foreground">
                    {course.stuckLesson || '-'}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
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
          <Table>
            <TableHeader>
              <TableRow className="text-left">
                <TableHead className="pr-4">用戶</TableHead>
                <TableHead className="pr-4">課程</TableHead>
                <TableHead className="pr-4">進度</TableHead>
                <TableHead>停滯天數</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stalledUsers.map((row) => {
                const progress = clampPercent(row.progress)
                const stalledDays = safeNumber(row.stalledDays)

                return (
                  <TableRow key={`${row.user}-${row.course}`}>
                    <TableCell className="pr-4 font-medium text-foreground">{row.user}</TableCell>
                    <TableCell className="pr-4 text-foreground">{row.course}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-warning"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-foreground">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
