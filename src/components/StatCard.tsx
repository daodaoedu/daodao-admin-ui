import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
}

export function StatCard({ title, value, change, changeLabel, icon: Icon }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="admin-kpi-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="mt-1 text-2xl font-bold text-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {(change !== undefined || changeLabel) && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          {change !== undefined && (
            <>
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={cn('font-medium', isPositive ? 'text-success' : 'text-destructive')}>
                {isPositive ? '+' : ''}
                {change.toFixed(1)}%
              </span>
            </>
          )}
          {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}
