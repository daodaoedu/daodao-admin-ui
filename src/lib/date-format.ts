import { format } from 'date-fns'
/** Use one display format throughout survey administration and CSV exports. */
export function formatAdminDateTime(value: string | Date, includeTime = true): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  if (!includeTime) return date.toISOString().slice(0, 10).replace(/-/g, '/')
  return format(date, 'yyyy/MM/dd HH:mm')
}
