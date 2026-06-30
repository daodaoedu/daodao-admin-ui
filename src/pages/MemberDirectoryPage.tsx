import {
  CheckCircle,
  Eye,
  EyeOff,
  GripVertical,
  Link,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { ProfileField } from '@/api/admin-community'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { useMemberDirectoryFields, useMemberDirectoryStats } from '@/hooks/useMemberDirectory'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────
interface PendingProfile {
  id: number
  user: string
  field: string
  reason: string
}

// ── Mock data ────────────────────────────────────────────
const FALLBACK_PENDING_PROFILES: PendingProfile[] = []

const TYPE_STYLES: Record<ProfileField['type'], string> = {
  text: 'bg-primary/15 text-primary',
  dropdown: 'bg-success/15 text-success',
  'multi-select': 'bg-warning/15 text-warning',
  URL: 'bg-info/15 text-info',
}

const VISIBILITY_ICONS: Record<ProfileField['visibility'], typeof Eye> = {
  公開: Eye,
  僅會員: Users,
  僅管理員: EyeOff,
}

// ── Component ────────────────────────────────────────────
export function MemberDirectoryPage() {
  const [directoryEnabled, setDirectoryEnabled] = useState(true)
  const { data: fields } = useMemberDirectoryFields()
  const { data: stats } = useMemberDirectoryStats()

  const displayFields = (fields ?? []) as ProfileField[]

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <h1 className="heading-lg">會員名錄管理</h1>

      {/* ── Feature toggle ──────────────────────────────── */}
      <div className="admin-panel-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">名錄功能</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                啟用後，會員可在社群內搜尋並瀏覽其他會員的公開資料
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDirectoryEnabled(!directoryEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
              directoryEnabled ? 'bg-primary' : 'bg-muted',
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-background shadow-sm transition-transform',
                directoryEnabled ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              directoryEnabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
            )}
          >
            {directoryEnabled ? '已啟用' : '已停用'}
          </span>
        </div>
      </div>

      {/* ── 自訂 Profile 欄位 ──────────────────────────── */}
      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-sm">自訂 Profile 欄位</h2>
          <Button type="button">
            <Plus className="h-4 w-4" />
            新增欄位
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="w-8 pb-3" />
                <th className="pb-3 font-medium text-muted-foreground">欄位名稱</th>
                <th className="pb-3 font-medium text-muted-foreground">類型</th>
                <th className="pb-3 font-medium text-muted-foreground">必填/選填</th>
                <th className="pb-3 font-medium text-muted-foreground">可見性</th>
                <th className="pb-3 font-medium text-muted-foreground">填寫率</th>
                <th className="pb-3 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {displayFields.map((field) => {
                const VisIcon =
                  VISIBILITY_ICONS[field.visibility as keyof typeof VISIBILITY_ICONS] ?? Eye
                return (
                  <tr key={field.id} className="admin-table-row last:border-0">
                    <td className="py-3">
                      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/50" />
                    </td>
                    <td className="py-3 font-medium text-foreground">{field.name}</td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          TYPE_STYLES[field.type],
                        )}
                      >
                        {field.type === 'URL' && <Link className="mr-1 h-3 w-3" />}
                        {field.type}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          field.required ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {field.required ? '必填' : '選填'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <VisIcon className="h-3 w-3" />
                        {field.visibility}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${field.fillRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{field.fillRate}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="xs" className="h-6 w-6 p-0">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="xs"
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 使用分析 ────────────────────────────────────── */}
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">使用分析</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="目錄搜尋次數"
            value={stats?.searchCount ?? '1,234'}
            changeLabel="每月"
            icon={Search}
          />
          <StatCard
            title="Profile 瀏覽次數"
            value={stats?.profileViews ?? '3,456'}
            changeLabel="每月"
            icon={Eye}
          />
          <StatCard
            title="連結成功率"
            value={stats ? `${stats.connectionRate}%` : '12%'}
            icon={ShieldCheck}
          />
        </div>
      </div>

      {/* ── 待審核 Profile ──────────────────────────────── */}
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">待審核 Profile</h2>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="pb-3 font-medium text-muted-foreground">用戶</th>
                <th className="pb-3 font-medium text-muted-foreground">問題欄位</th>
                <th className="pb-3 font-medium text-muted-foreground">原因</th>
                <th className="pb-3 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {FALLBACK_PENDING_PROFILES.map((row) => (
                <tr key={row.id} className="admin-table-row last:border-0">
                  <td className="py-3 font-medium text-foreground">{row.user}</td>
                  <td className="py-3 text-foreground">{row.field}</td>
                  <td className="py-3 text-muted-foreground">{row.reason}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-success/30 text-success hover:bg-success/10 hover:text-success"
                      >
                        <CheckCircle className="h-3 w-3" />
                        通過
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <XCircle className="h-3 w-3" />
                        隱藏
                      </Button>
                    </div>
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
