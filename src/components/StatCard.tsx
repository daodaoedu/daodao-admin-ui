import { Info, type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  description?: string
  iconClassName?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  description,
  iconClassName,
  onClick,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  const CardElement = onClick ? 'button' : 'div'

  return (
    <CardElement
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm text-left w-full',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md hover:border-primary/30',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          {description && (
            <div className="group relative">
              <Info className="h-3 w-3 cursor-help text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/70" />
              <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-foreground shadow-md opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                {description}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
              </div>
            </div>
          )}
        </div>
        {Icon &&
          (iconClassName ? (
            <div className={cn('p-2 rounded-lg flex items-center justify-center', iconClassName)}>
              <Icon className="h-4 w-4" />
            </div>
          ) : (
            <Icon className="h-4 w-4 text-muted-foreground" />
          ))}
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
    </CardElement>
  )
}
