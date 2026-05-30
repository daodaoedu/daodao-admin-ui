import { FileText, Search, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { runCustomReportQuery } from '@/api/admin-reports'
import { ExportButton } from '@/components/ExportButton'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useCustomReportFields, useSavedReports } from '@/hooks/useCustomReports'

type ReportRow = Record<string, string>

export function CustomReportsPage() {
  const { data: fieldsData } = useCustomReportFields()
  const { data: savedData } = useSavedReports()

  const availableFields = fieldsData?.map((f) => f.label) ?? []
  const savedReports = savedData ?? []

  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [rows, setRows] = useState<ReportRow[]>([])
  const [isQuerying, setIsQuerying] = useState(false)

  useEffect(() => {
    if (selectedFields.length === 0 && availableFields.length > 0) {
      setSelectedFields(availableFields.slice(0, 3))
    }
  }, [selectedFields.length, availableFields])

  const runReport = async () => {
    if (selectedFields.length === 0 || isQuerying) return
    setIsQuerying(true)
    try {
      const { data } = await runCustomReportQuery({ fields: selectedFields })
      setRows(data.data.rows)
    } finally {
      setIsQuerying(false)
    }
  }

  function toggleField(field: string) {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    )
  }

  function removeField(field: string) {
    setSelectedFields((prev) => prev.filter((f) => f !== field))
  }

  function loadReport(fields: string[]) {
    setSelectedFields(fields)
  }

  const exportColumns = selectedFields.map((f) => ({ key: f, header: f }))
  const exportData = rows.map((row) => {
    const obj: Record<string, unknown> = {}
    for (const f of selectedFields) {
      obj[f] = row[f]
    }
    return obj
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">自訂報表</h1>
        <ExportButton data={exportData} columns={exportColumns} fileName="custom-report" />
      </div>

      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">報表產生器</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">可用欄位</p>
            <div className="space-y-2">
              {availableFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">尚未取得可用欄位</p>
              ) : (
                availableFields.map((field) => (
                  <label
                    key={field}
                    htmlFor={`field-${field}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                  >
                    <Checkbox
                      id={`field-${field}`}
                      checked={selectedFields.includes(field)}
                      onCheckedChange={() => toggleField(field)}
                    />
                    <span className="text-foreground">{field}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">已選欄位</p>
            <div className="flex flex-wrap gap-2">
              {selectedFields.length === 0 && (
                <p className="text-sm text-muted-foreground">尚未選擇任何欄位</p>
              )}
              {selectedFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {field}
                  <Button
                    type="button"
                    onClick={() => removeField(field)}
                    variant="ghost"
                    size="xs"
                    className="h-5 w-5 p-0 text-primary"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Button
            type="button"
            disabled={selectedFields.length === 0 || isQuerying}
            className="disabled:pointer-events-none"
            onClick={runReport}
          >
            <Search className="h-4 w-4" />
            {isQuerying ? '查詢中...' : '查詢'}
          </Button>
        </div>
      </div>

      <div className="admin-panel-card p-5">
        <h2 className="heading-sm mb-4">查詢結果</h2>
        {selectedFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">請先選擇欄位後再查詢</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚未查詢到資料</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table-shell text-sm">
              <thead>
                <tr className="admin-table-head">
                  {selectedFields.map((field) => (
                    <th key={field} className="pb-3 pr-4 font-medium">
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id ?? index} className="admin-table-row last:border-0">
                    {selectedFields.map((field) => (
                      <td key={field} className="py-3 pr-4 text-foreground">
                        {row[field]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">已儲存的報表</h2>
        </div>
        <div className="space-y-3">
          {savedReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">目前尚無已儲存報表</p>
          ) : (
            savedReports.map((report) => (
              <div
                key={report.id ?? report.name}
                className="admin-card-soft flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{report.name}</p>
                  <p className="text-xs text-muted-foreground">欄位: {report.fields.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => loadReport(report.fields)}
                    variant="outline"
                    size="sm"
                  >
                    載入
                  </Button>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
