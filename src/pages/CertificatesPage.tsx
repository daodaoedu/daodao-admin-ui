import { Award, CheckCircle, ExternalLink, FileText, Plus, XCircle } from 'lucide-react'
import type { CertificateTemplate, IssuedCertificate } from '@/api/admin-learning'
import { Button } from '@/components/ui/button'
import { useCertificateTemplates, useIssuedCertificates } from '@/hooks/useCertificates'
import { cn } from '@/lib/utils'

export function CertificatesPage() {
  const { data: templatesData } = useCertificateTemplates()
  const { data: issuedData } = useIssuedCertificates()
  const templates = templatesData ?? ([] as CertificateTemplate[])
  const issued = issuedData ?? ([] as IssuedCertificate[])

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">證書管理</h1>
        <Button type="button">
          <Plus className="h-4 w-4" />
          建立模板
        </Button>
      </div>

      {/* ── Certificate templates ──────────────────────── */}
      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="heading-sm">證書模板</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((tpl) => (
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
                <Button type="button" variant="outline" size="sm">
                  編輯
                </Button>
                <Button type="button" size="sm">
                  發放
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Issued certificates ────────────────────────── */}
      <div className="admin-panel-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          <h2 className="heading-sm">已發放證書</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="pb-3 pr-4 font-medium">證書</th>
                <th className="pb-3 pr-4 font-medium">用戶</th>
                <th className="pb-3 pr-4 font-medium">發放日期</th>
                <th className="pb-3 pr-4 font-medium">驗證連結</th>
                <th className="pb-3 font-medium">狀態</th>
              </tr>
            </thead>
            <tbody>
              {issued.map((row) => (
                <tr key={row.link} className="admin-table-row last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{row.cert}</td>
                  <td className="py-3 pr-4 text-foreground">{row.user}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.date}</td>
                  <td className="py-3 pr-4">
                    <a
                      href={row.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
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
