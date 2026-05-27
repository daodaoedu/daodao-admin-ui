import { AlertTriangle, BookOpen, Eye, Percent, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatCard } from '@/components/StatCard'

const MOCK_COURSES = [
  { name: 'React 入門實戰', enrolled: 342, completionRate: 68, avgProgress: 72, stuckLesson: 'State 管理' },
  { name: 'TypeScript 完全指南', enrolled: 256, completionRate: 45, avgProgress: 51, stuckLesson: '泛型進階' },
  { name: 'Node.js 後端開發', enrolled: 198, completionRate: 32, avgProgress: 38, stuckLesson: 'Stream 處理' },
  { name: 'CSS 動畫大師班', enrolled: 167, completionRate: 55, avgProgress: 60, stuckLesson: 'Keyframes 組合' },
  { name: 'Git 版本控制', enrolled: 423, completionRate: 78, avgProgress: 82, stuckLesson: 'Rebase 互動模式' },
]

const MOCK_STALLED_USERS = [
  { user: '王小明', course: 'TypeScript 完全指南', progress: 35, stalledDays: 14 },
  { user: '李美華', course: 'Node.js 後端開發', progress: 22, stalledDays: 21 },
  { user: '張志遠', course: 'React 入門實戰', progress: 48, stalledDays: 9 },
  { user: '陳佳琳', course: 'CSS 動畫大師班', progress: 15, stalledDays: 30 },
  { user: '林大偉', course: 'TypeScript 完全指南', progress: 60, stalledDays: 7 },
]

export function LearningProgressPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <h1 className="heading-lg">課程進度追蹤</h1>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="總課程" value={12} icon={BookOpen} change={2.0} changeLabel="較上月" />
        <StatCard title="平均完成率" value="45%" icon={Percent} change={3.5} changeLabel="較上月" />
        <StatCard title="停滯用戶" value={23} icon={AlertTriangle} change={-8.2} changeLabel="較上月" />
      </div>

      {/* ── Course table ───────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 heading-sm">課程概覽</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">課程名稱</th>
                <th className="pb-3 pr-4 font-medium">註冊數</th>
                <th className="pb-3 pr-4 font-medium">完成率</th>
                <th className="pb-3 pr-4 font-medium">平均進度</th>
                <th className="pb-3 pr-4 font-medium">卡關課時</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_COURSES.map((course) => (
                <tr key={course.name} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{course.name}</td>
                  <td className="py-3 pr-4 text-foreground">{course.enrolled.toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            course.completionRate >= 60 ? 'bg-success' : course.completionRate >= 40 ? 'bg-warning' : 'bg-destructive',
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
                    <button className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Eye className="h-3.5 w-3.5" />
                      查看詳情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Stalled users ──────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="heading-sm">停滯用戶</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">用戶</th>
                <th className="pb-3 pr-4 font-medium">課程</th>
                <th className="pb-3 pr-4 font-medium">進度</th>
                <th className="pb-3 font-medium">停滯天數</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_STALLED_USERS.map((row) => (
                <tr key={`${row.user}-${row.course}`} className="border-b border-border last:border-0">
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
                        row.stalledDays >= 21 ? 'bg-destructive/15 text-destructive' : row.stalledDays >= 14 ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground',
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
      </div>
    </div>
  )
}
