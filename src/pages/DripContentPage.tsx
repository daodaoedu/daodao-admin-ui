import { Calendar, Clock, Lock, Unlock, Users } from 'lucide-react'
import { useState } from 'react'
import { StatCard } from '@/components/StatCard'

const MOCK_SCHEDULE = [
  { course: '基礎課程', module: 'Module 2', condition: '註冊後 7 天', conditionType: 'days' as const, unlocked: 234, waiting: 56 },
  { course: '基礎課程', module: 'Module 3', condition: '註冊後 14 天', conditionType: 'days' as const, unlocked: 189, waiting: 101 },
  { course: '進階課程', module: 'Module 1', condition: '2024-03-01', conditionType: 'date' as const, unlocked: 145, waiting: 78 },
  { course: '進階課程', module: 'Module 2', condition: '完成 Module 1 後 7 天', conditionType: 'days' as const, unlocked: 98, waiting: 125 },
  { course: '實戰專案', module: 'Module 1', condition: '2024-04-15', conditionType: 'date' as const, unlocked: 67, waiting: 156 },
  { course: '實戰專案', module: 'Module 2', condition: '註冊後 30 天', conditionType: 'days' as const, unlocked: 34, waiting: 189 },
]

export function DripContentPage() {
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedModule, setSelectedModule] = useState('')

  function handleUnlock() {
    if (!selectedUser || !selectedModule) {
      alert('請選擇用戶與模組')
      return
    }
    alert(`已手動解鎖：${selectedUser} — ${selectedModule}`)
    setSelectedUser('')
    setSelectedModule('')
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <h1 className="heading-lg">內容滴灌排程</h1>

      {/* ── Schedule list ──────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="heading-sm">排程列表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">課程</th>
                <th className="pb-3 pr-4 font-medium">Module</th>
                <th className="pb-3 pr-4 font-medium">解鎖條件</th>
                <th className="pb-3 pr-4 font-medium">已解鎖用戶</th>
                <th className="pb-3 font-medium">等待中用戶</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SCHEDULE.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{row.course}</td>
                  <td className="py-3 pr-4 text-foreground">{row.module}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        row.conditionType === 'days'
                          ? 'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
                          : 'inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning'
                      }
                    >
                      {row.conditionType === 'days' ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      {row.condition}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1 text-success">
                      <Unlock className="h-3 w-3" />
                      {row.unlocked.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      {row.waiting.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Manual unlock ──────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Unlock className="h-4 w-4 text-muted-foreground" />
          <h2 className="heading-sm">手動解鎖</h2>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground">用戶</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">選擇用戶...</option>
              <option value="王小明">王小明</option>
              <option value="李美華">李美華</option>
              <option value="張志遠">張志遠</option>
              <option value="陳佳琳">陳佳琳</option>
              <option value="林大偉">林大偉</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground">Module</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">選擇模組...</option>
              {MOCK_SCHEDULE.map((row, i) => (
                <option key={i} value={`${row.course} — ${row.module}`}>
                  {row.course} — {row.module}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleUnlock}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Unlock className="h-4 w-4" />
            解鎖
          </button>
        </div>
      </div>
    </div>
  )
}
