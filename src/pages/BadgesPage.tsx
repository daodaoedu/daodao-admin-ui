import type { LucideIcon } from 'lucide-react'
import { Award, Plus, Target } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useBadges } from '@/hooks/useBadges'
import { cn } from '@/lib/utils'

export function BadgesPage() {
  const { data } = useBadges()

  const badges = data?.items ?? []
  const recentAwards = data?.recentAwards ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="徽章管理"
        description="設計與發放會員成就徽章，激勵用戶完成學習目標與社群參與。"
        actions={
          <Button type="button">
            <Plus className="h-4 w-4" />
            建立徽章
          </Button>
        }
      />

      {/* Badge Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => {
          const Icon: LucideIcon =
            'icon' in badge && badge.icon != null && typeof badge.icon !== 'string'
              ? (badge.icon as LucideIcon)
              : Target
          return (
            <div
              key={badge.id}
              className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground">{badge.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{badge.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    badge.trigger === '自動' || badge.trigger === 'auto'
                      ? 'bg-success/15 text-success'
                      : 'bg-warning/15 text-warning',
                  )}
                >
                  {badge.trigger}
                </span>
                <span className="text-muted-foreground">
                  <Award className="mr-1 inline h-3.5 w-3.5" />
                  已頒發 {(badge.awarded ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Awards Table */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
          最近頒發
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                <th className="pb-3 font-medium text-muted-foreground">用戶</th>
                <th className="pb-3 font-medium text-muted-foreground">徽章</th>
                <th className="pb-3 font-medium text-muted-foreground">頒發方式</th>
                <th className="pb-3 font-medium text-muted-foreground">時間</th>
              </tr>
            </thead>
            <tbody>
              {recentAwards.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                >
                  <td className="py-3 text-foreground">{row.user}</td>
                  <td className="py-3 text-foreground">{row.badge}</td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        row.method === '自動' || row.method === 'auto'
                          ? 'bg-success/15 text-success'
                          : 'bg-warning/15 text-warning',
                      )}
                    >
                      {row.method}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
