import {
  CheckCircle,
  Eye,
  EyeOff,
  GripVertical,
  Link,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import type { ProfileField } from '@/api/admin-community'
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
  const { data: fields } = useMemberDirectoryFields()
  const { data: stats } = useMemberDirectoryStats()

  const displayFields = (fields ?? []) as ProfileField[]

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <h1 className="heading-lg">會員名錄管理</h1>

      {/* ── 自訂 Profile 欄位 ──────────────────────────── */}
      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-sm">自訂 Profile 欄位</h2>
          <Button type="button">
            <Plus className="h-4 w-4" />
            新增欄位
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="text-left">
              <TableHead className="w-8" />
              <TableHead>欄位名稱</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>必填/選填</TableHead>
              <TableHead>可見性</TableHead>
              <TableHead>填寫率</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayFields.map((field) => {
              const VisIcon =
                VISIBILITY_ICONS[field.visibility as keyof typeof VISIBILITY_ICONS] ?? Eye
              return (
                <TableRow key={field.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/50" />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{field.name}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        TYPE_STYLES[field.type],
                      )}
                    >
                      {field.type === 'URL' && <Link className="mr-1 h-3 w-3" />}
                      {field.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        field.required ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {field.required ? '必填' : '選填'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <VisIcon className="h-3 w-3" />
                      {field.visibility}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${field.fillRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{field.fillRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="xs" className="h-6 w-6 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="destructive" size="xs" className="h-6 w-6 p-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── 使用分析 ────────────────────────────────────── */}
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">使用分析</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="會員總數" value={stats?.totalMembers ?? '—'} icon={Users} />
          <StatCard
            title="已完善 Profile"
            value={stats?.completedProfiles ?? '—'}
            icon={UserCheck}
          />
          <StatCard
            title="平均填寫率"
            value={stats ? `${stats.averageFillRate}%` : '—'}
            icon={Eye}
          />
        </div>
      </div>

      {/* ── 待審核 Profile ──────────────────────────────── */}
      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">待審核 Profile</h2>
        <Table>
          <TableHeader>
            <TableRow className="text-left">
              <TableHead>用戶</TableHead>
              <TableHead>問題欄位</TableHead>
              <TableHead>原因</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FALLBACK_PENDING_PROFILES.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-foreground">{row.user}</TableCell>
                <TableCell className="text-foreground">{row.field}</TableCell>
                <TableCell className="text-muted-foreground">{row.reason}</TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
