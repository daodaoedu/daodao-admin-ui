import { useState } from 'react'
import { FileText, Search, Trash2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExportButton } from '@/components/ExportButton'

const availableFields = [
  '用戶ID',
  '用戶名稱',
  'Email',
  '註冊日期',
  '最後登入',
  '角色',
  'AI查詢次數',
  'Token用量',
  '打卡次數',
] as const

type Field = (typeof availableFields)[number]

const defaultSelected: Field[] = ['用戶名稱', 'Email', 'AI查詢次數', 'Token用量']

const mockData: Record<Field, string>[] = [
  { 用戶ID: 'U001', 用戶名稱: '王小明', Email: 'ming@example.com', 註冊日期: '2024-01-15', 最後登入: '2024-06-02', 角色: 'Admin', AI查詢次數: '328', Token用量: '45,200', 打卡次數: '120' },
  { 用戶ID: 'U002', 用戶名稱: '李美華', Email: 'meihua@example.com', 註冊日期: '2024-02-20', 最後登入: '2024-06-01', 角色: 'User', AI查詢次數: '156', Token用量: '21,800', 打卡次數: '95' },
  { 用戶ID: 'U003', 用戶名稱: '張大偉', Email: 'david@example.com', 註冊日期: '2024-03-10', 最後登入: '2024-05-30', 角色: 'User', AI查詢次數: '89', Token用量: '12,400', 打卡次數: '78' },
  { 用戶ID: 'U004', 用戶名稱: '陳怡君', Email: 'yijun@example.com', 註冊日期: '2024-01-08', 最後登入: '2024-06-02', 角色: 'Admin', AI查詢次數: '412', Token用量: '58,100', 打卡次數: '145' },
  { 用戶ID: 'U005', 用戶名稱: '林志豪', Email: 'zhihao@example.com', 註冊日期: '2024-04-01', 最後登入: '2024-05-28', 角色: 'User', AI查詢次數: '67', Token用量: '9,300', 打卡次數: '42' },
]

const savedReports = [
  { name: 'AI 重度使用者', fields: ['用戶名稱', 'Email', 'AI查詢次數', 'Token用量'] },
  { name: '近期活躍用戶', fields: ['用戶名稱', 'Email', '最後登入', '打卡次數'] },
]

export function CustomReportsPage() {
  const [selectedFields, setSelectedFields] = useState<Field[]>(defaultSelected)

  function toggleField(field: Field) {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    )
  }

  function removeField(field: Field) {
    setSelectedFields((prev) => prev.filter((f) => f !== field))
  }

  function loadReport(fields: string[]) {
    setSelectedFields(fields as Field[])
  }

  const exportColumns = selectedFields.map((f) => ({ key: f, header: f }))
  const exportData = mockData.map((row) => {
    const obj: Record<string, unknown> = {}
    for (const f of selectedFields) {
      obj[f] = row[f]
    }
    return obj
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">自訂報表</h1>
        <ExportButton data={exportData} columns={exportColumns} fileName="custom-report" />
      </div>

      {/* Report Builder */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">報表產生器</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Available Fields */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">可用欄位</p>
            <div className="space-y-2">
              {availableFields.map((field) => (
                <label
                  key={field}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field)}
                    onChange={() => toggleField(field)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary"
                  />
                  <span className="text-foreground">{field}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Selected Fields */}
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
                  <button
                    type="button"
                    onClick={() => removeField(field)}
                    className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            disabled={selectedFields.length === 0}
            className={cn(
              'inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors',
              'hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            <Search className="h-4 w-4" />
            查詢
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="heading-sm mb-4">查詢結果</h2>
        {selectedFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">請先選擇欄位後再查詢</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  {selectedFields.map((field) => (
                    <th key={field} className="pb-3 pr-4 font-medium">
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockData.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
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

      {/* Saved Reports */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <h2 className="heading-sm">已儲存的報表</h2>
        </div>
        <div className="space-y-3">
          {savedReports.map((report) => (
            <div
              key={report.name}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{report.name}</p>
                <p className="text-xs text-muted-foreground">
                  欄位: {report.fields.join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadReport(report.fields)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                >
                  載入
                </button>
                <button
                  type="button"
                  className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
