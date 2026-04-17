import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-primary/10 text-primary',
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
      warning: 'bg-orange-100 text-orange-700',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
