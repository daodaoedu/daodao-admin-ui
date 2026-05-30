import { Calendar, Clock, Lock, Unlock } from 'lucide-react'
import { useState } from 'react'
import type { DripSchedule } from '@/api/admin-learning'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useDripSchedules } from '@/hooks/useDripSchedules'

export function DripContentPage() {
  const { data: schedulesData } = useDripSchedules()
  const schedules = schedulesData ?? ([] as DripSchedule[])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedModule, setSelectedModule] = useState('')

  const moduleOptions = schedules.map((row) => ({
    value: `${row.course} — ${row.module}`,
    label: `${row.course} — ${row.module}`,
  }))
  const manualUserOptions = [
    { value: '', label: '選擇用戶...' },
    { value: '王小明', label: '王小明' },
    { value: '李美華', label: '李美華' },
    { value: '張志遠', label: '張志遠' },
    { value: '陳佳琳', label: '陳佳琳' },
    { value: '林大偉', label: '林大偉' },
  ]
  const manualModuleOptions = [{ value: '', label: '選擇模組...' }, ...moduleOptions]

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
      <h1 className="text-2xl leading-none font-semibold tracking-tight text-foreground">
        內容滴灌排程
      </h1>

      {/* ── Schedule list ──────────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            排程列表
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">課程</th>
                <th className="pb-3 pr-4 font-medium">Module</th>
                <th className="pb-3 pr-4 font-medium">解鎖條件</th>
                <th className="pb-3 pr-4 font-medium">已解鎖用戶</th>
                <th className="pb-3 font-medium">等待中用戶</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((row) => (
                <tr
                  key={`${row.course}-${row.module}`}
                  className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                >
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
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <Unlock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            手動解鎖
          </h2>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="drip-user-select"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              用戶
            </label>
            <Select
              id="drip-user-select"
              value={selectedUser}
              onValueChange={(value) => setSelectedUser(value)}
              options={manualUserOptions}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="drip-module-select"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Module
            </label>
            <Select
              id="drip-module-select"
              value={selectedModule}
              onValueChange={(value) => setSelectedModule(value)}
              options={manualModuleOptions}
            />
          </div>
          <Button type="button" onClick={handleUnlock}>
            <Unlock className="h-4 w-4" />
            解鎖
          </Button>
        </div>
      </div>
    </div>
  )
}
