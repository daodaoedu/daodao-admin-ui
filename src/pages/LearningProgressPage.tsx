import { AlertTriangle, BookOpen, Eye, Percent } from 'lucide-react'
import { useState } from 'react'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useLearningCourses, useStalledUsers } from '@/hooks/useLearningCourses'
import { cn } from '@/lib/utils'

export function LearningProgressPage() {
  const { data: coursesData } = useLearningCourses()
  const courses = coursesData ?? []

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const { data: stalledUsers = [] } = useStalledUsers(selectedCourseId)

  const selectedCourse = courses.find((c) => c.id === selectedCourseId)

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <h1 className="heading-lg">課程進度追蹤</h1>

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
          value={`${courses.length > 0 ? Math.round(courses.reduce((s, c) => s + c.completionRate, 0) / courses.length) : 0}%`}
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
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">課程概覽</h2>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="pb-3 pr-4 font-medium">課程名稱</th>
                <th className="pb-3 pr-4 font-medium">註冊數</th>
                <th className="pb-3 pr-4 font-medium">完成率</th>
                <th className="pb-3 pr-4 font-medium">平均進度</th>
                <th className="pb-3 pr-4 font-medium">卡關課時</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id ?? course.name} className="admin-table-row last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{course.name}</td>
                  <td className="py-3 pr-4 text-foreground">{course.enrolled.toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            course.completionRate >= 60
                              ? 'bg-success'
                              : course.completionRate >= 40
                                ? 'bg-warning'
                                : 'bg-destructive',
                          )}
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                      <span className="text-foreground">{course.completionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-foreground">{course.avgProgress}%</td>
                  <td className="py-3 pr-4 text-muted-foreground">{course.stuckLesson}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Stalled users ──────────────────────────────── */}
      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="heading-sm">停滯用戶{selectedCourse ? `：${selectedCourse.name}` : ''}</h2>
        </div>
        {!selectedCourseId && (
          <p className="text-sm text-muted-foreground">請先從上方課程表選擇一門課</p>
        )}
        {selectedCourseId && (
          <div className="overflow-x-auto">
            <table className="admin-table-shell text-sm">
              <thead>
                <tr className="admin-table-head">
                  <th className="pb-3 pr-4 font-medium">用戶</th>
                  <th className="pb-3 pr-4 font-medium">課程</th>
                  <th className="pb-3 pr-4 font-medium">進度</th>
                  <th className="pb-3 font-medium">停滯天數</th>
                </tr>
              </thead>
              <tbody>
                {stalledUsers.map((row) => (
                  <tr key={`${row.user}-${row.course}`} className="admin-table-row last:border-0">
                    <td className="py-3 pr-4 font-medium text-foreground">{row.user}</td>
                    <td className="py-3 pr-4 text-foreground">{row.course}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-warning"
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                        <span className="text-foreground">{row.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          row.stalledDays >= 21
                            ? 'bg-destructive/15 text-destructive'
                            : row.stalledDays >= 14
                              ? 'bg-warning/15 text-warning'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {row.stalledDays} 天
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
