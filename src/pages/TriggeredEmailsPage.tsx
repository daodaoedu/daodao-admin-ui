import { Loader2, Mail, MailCheck, Percent, Plus, Zap } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useEmailTriggerLogs,
  useEmailTriggerRules,
  useEmailTriggerStats,
  useToggleEmailTriggerRule,
} from '@/hooks/useEmailTrigger'
import { cn } from '@/lib/utils'

export function TriggeredEmailsPage() {
  const { data: rulesData, isLoading: rulesLoading } = useEmailTriggerRules()
  const { data: statsData, isLoading: statsLoading } = useEmailTriggerStats()
  const { data: logsData, isLoading: logsLoading } = useEmailTriggerLogs({ limit: 10 })
  const toggleMutation = useToggleEmailTriggerRule()

  const rules = rulesData?.items ?? []
  const logs = logsData?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="觸發式郵件"
        description="設定由用戶行為自動觸發的郵件規則，例如歡迎信、提醒信與里程碑通知。"
        actions={
          <button
            type="button"
            onClick={() => alert('功能開發中')}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            新增規則
          </button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="活躍規則數"
          value={statsLoading ? '—' : (statsData?.enabledRules ?? '—')}
          icon={Zap}
        />
        <StatCard
          title="本月發送"
          value={statsLoading ? '—' : (statsData?.monthlySent ?? '—')}
          icon={Mail}
        />
        <StatCard
          title="平均開信率"
          value={
            statsLoading ? '—' : statsData ? `${Math.round(statsData.avgOpenRate * 10) / 10}%` : '—'
          }
          icon={Percent}
        />
      </div>

      {/* Rules Table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
          郵件規則
        </h2>
        {rulesLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">載入中…</span>
          </div>
        ) : rules.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">尚無郵件規則</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-left">
                <TableHead className="pr-4">規則名稱</TableHead>
                <TableHead className="pr-4">觸發條件</TableHead>
                <TableHead className="pr-4">郵件模板</TableHead>
                <TableHead className="pr-4">已發送</TableHead>
                <TableHead className="pr-4">開信率</TableHead>
                <TableHead>狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} className="last:border-0">
                  <TableCell className="pr-4 font-medium">
                    <div className="flex items-center gap-2">
                      <MailCheck className="h-4 w-4 text-muted-foreground" />
                      {rule.name}
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground">{rule.trigger_type}</TableCell>
                  <TableCell className="pr-4 text-muted-foreground">{rule.template}</TableCell>
                  <TableCell className="pr-4 text-muted-foreground">{rule.sent_count}</TableCell>
                  <TableCell className="pr-4 text-muted-foreground">{rule.open_rate}%</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
                      disabled={toggleMutation.isPending}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                        rule.enabled ? 'bg-primary' : 'bg-muted',
                      )}
                      role="switch"
                      aria-checked={rule.enabled}
                      aria-label={`${rule.name} ${rule.enabled ? '啟用' : '停用'}`}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
                          rule.enabled ? 'translate-x-4' : 'translate-x-0',
                        )}
                      />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Execution Log */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
          最近執行紀錄
        </h2>
        {logsLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">載入中…</span>
          </div>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">尚無執行紀錄</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-left">
                <TableHead className="pr-4">規則</TableHead>
                <TableHead className="pr-4">收件人</TableHead>
                <TableHead className="pr-4">發送時間</TableHead>
                <TableHead>狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="last:border-0">
                  <TableCell className="pr-4 font-medium">{log.rule_name}</TableCell>
                  <TableCell className="pr-4 text-muted-foreground">{log.recipient}</TableCell>
                  <TableCell className="pr-4 text-muted-foreground">{log.sent_at}</TableCell>
                  <TableCell
                    className={cn(
                      'text-sm font-medium',
                      log.status === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {log.status === 'success' ? '成功' : '失敗'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
