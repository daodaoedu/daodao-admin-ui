import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ColumnConfig {
  key: string
  header: string
}

interface ExportButtonProps {
  data: Record<string, unknown>[]
  columns: ColumnConfig[]
  fileName: string
  disabled?: boolean
}

export function ExportButton({ data, columns, fileName, disabled }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleExport = useCallback(
    async (format: 'csv' | 'xlsx') => {
      if (data.length === 0) {
        alert('沒有資料可匯出')
        return
      }

      setLoading(true)
      setOpen(false)

      try {
        const { utils, writeFile } = await import('xlsx')
        const date = new Date().toISOString().slice(0, 10)
        const name = `${fileName}_${date}`

        const headers = columns.map((c) => c.header)
        const rows = data.map((row) => columns.map((c) => row[c.key] ?? ''))

        const ws = utils.aoa_to_sheet([headers, ...rows])
        const wb = utils.book_new()
        utils.book_append_sheet(wb, ws, 'Data')

        if (format === 'csv') {
          writeFile(wb, `${name}.csv`, { bookType: 'csv' })
        } else {
          writeFile(wb, `${name}.xlsx`, { bookType: 'xlsx' })
        }
      } finally {
        setLoading(false)
      }
    },
    [data, columns, fileName],
  )

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <Download className="h-4 w-4" />
        {loading ? '匯出中...' : '匯出'}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border border-border bg-card p-1 shadow-md">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
          >
            <FileText className="h-4 w-4" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel (.xlsx)
          </button>
        </div>
      )}
    </div>
  )
}
