import { Calendar, Clock, Lock, Unlock } from 'lucide-react'
import { useState } from 'react'
import type { DripSchedule } from '@/api/admin-learning'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
      <PageHeader
        title="內容滴灌排程"
        description="設定依加入天數自動推送的內容序列，引導新成員逐步探索島島。"
      />

      {/* ── Schedule list ──────────────────────────────── */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
            排程列表
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>課程</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>解鎖條件</TableHead>
              <TableHead>已解鎖用戶</TableHead>
              <TableHead>等待中用戶</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((row) => (
              <TableRow key={`${row.course}-${row.module}`}>
                <TableCell className="font-medium text-foreground">{row.course}</TableCell>
                <TableCell className="text-foreground">{row.module}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-success">
                    <Unlock className="h-3 w-3" />
                    {row.unlocked.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    {row.waiting.toLocaleString()}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
