import { Award, CheckCircle, ExternalLink, FileText, Plus, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOCK_TEMPLATES = [
  {
    name: '基礎課程結業證書',
    criteria: '完成所有課時 + 測驗 >= 70%',
    issued: 156,
    color: 'from-primary/20 to-primary/5',
  },
  {
    name: '進階學習認證',
    criteria: '完成 3 門課程 + 專案',
    issued: 23,
    color: 'from-warning/20 to-warning/5',
  },
]

const MOCK_ISSUED = [
  {
    cert: '基礎課程結業證書',
    user: '王小明',
    date: '2024-03-15',
    link: 'https://cert.daodao.co/v/abc123',
    status: 'active' as const,
  },
  {
    cert: '基礎課程結業證書',
    user: '李美華',
    date: '2024-03-12',
    link: 'https://cert.daodao.co/v/def456',
    status: 'active' as const,
  },
  {
    cert: '進階學習認證',
    user: '張志遠',
    date: '2024-03-10',
    link: 'https://cert.daodao.co/v/ghi789',
    status: 'active' as const,
  },
  {
    cert: '基礎課程結業證書',
    user: '陳佳琳',
    date: '2024-02-28',
    link: 'https://cert.daodao.co/v/jkl012',
    status: 'revoked' as const,
  },
  {
    cert: '進階學習認證',
    user: '林大偉',
    date: '2024-02-20',
    link: 'https://cert.daodao.co/v/mno345',
    status: 'active' as const,
  },
]

export function CertificatesPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">證書管理</h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          建立模板
        </button>
      </div>

      {/* ── Certificate templates ──────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="heading-sm">證書模板</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {MOCK_TEMPLATES.map((tpl) => (
            <div
              key={tpl.name}
              className={cn('rounded-lg border border-border bg-gradient-to-br p-5', tpl.color)}
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="rounded-lg bg-background/80 p-2">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{tpl.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tpl.criteria}</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                已發放 <span className="font-medium text-foreground">{tpl.issued}</span> 張
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  編輯
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  發放
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Issued certificates ────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          <h2 className="heading-sm">已發放證書</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">證書</th>
                <th className="pb-3 pr-4 font-medium">用戶</th>
                <th className="pb-3 pr-4 font-medium">發放日期</th>
                <th className="pb-3 pr-4 font-medium">驗證連結</th>
                <th className="pb-3 font-medium">狀態</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ISSUED.map((row) => (
                <tr key={row.link} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{row.cert}</td>
                  <td className="py-3 pr-4 text-foreground">{row.user}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.date}</td>
                  <td className="py-3 pr-4">
                    <a
                      href={row.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      驗證
                    </a>
                  </td>
                  <td className="py-3">
                    {row.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                        <CheckCircle className="h-3 w-3" />
                        有效
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                        <XCircle className="h-3 w-3" />
                        已撤銷
                      </span>
                    )}
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
