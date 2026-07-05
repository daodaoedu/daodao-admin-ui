import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bot, ShieldAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type {
  AutoModFlagQueueItem,
  AutoModLogItem,
  AutoModRule,
  AutoModWordList,
} from '@/api/admin-trust'
import {
  actionAutoModFlagQueue,
  addAutoModUsernameBlocklist,
  deleteAutoModUsernameBlocklist,
  toggleAutoModWordList,
  updateAutoModCommunityModConfig,
  updateAutoModRule,
  updateAutoModSpamDetection,
} from '@/api/admin-trust'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAutoModCommunityModConfig,
  useAutoModFlagQueue,
  useAutoModLog,
  useAutoModRules,
  useAutoModSpamDetection,
  useAutoModUsernameBlocklist,
  useAutoModWordLists,
} from '@/hooks/useAutoMod'
import { cn } from '@/lib/utils'

/* ---------- Helpers ---------- */

const patternBadge = (pattern: string) => {
  switch (pattern) {
    case 'exact':
      return <Badge variant="primary">exact</Badge>
    case 'wildcard':
      return <Badge variant="warning">wildcard</Badge>
    case 'contains':
      return <Badge>contains</Badge>
    default:
      return <Badge>{pattern}</Badge>
  }
}

const actionBadge = (action: string) => {
  if (action.includes('刪除')) return <Badge variant="error">{action}</Badge>
  if (action.includes('禁言')) return <Badge variant="warning">{action}</Badge>
  return <Badge variant="default">{action}</Badge>
}

const priorityBadge = (priority: string) => {
  switch (priority) {
    case '高':
      return <Badge variant="error">{priority}</Badge>
    case '中':
      return <Badge variant="warning">{priority}</Badge>
    default:
      return <Badge>{priority}</Badge>
  }
}

/* ---------- Component ---------- */

export function AutoModPage() {
  const queryClient = useQueryClient()

  const { data: rulesData } = useAutoModRules()
  const { data: wordListsData } = useAutoModWordLists()
  const { data: logData } = useAutoModLog()
  const { data: spamData } = useAutoModSpamDetection()
  const { data: blocklistData } = useAutoModUsernameBlocklist()
  const { data: flagQueueData } = useAutoModFlagQueue()
  const { data: communityConfigData } = useAutoModCommunityModConfig()

  const keywordRules: AutoModRule[] = rulesData?.items ?? []
  const sensitiveLibs: AutoModWordList[] = wordListsData?.items ?? []
  const auditLogItems: AutoModLogItem[] = logData?.items ?? []
  const blacklist: string[] = blocklistData?.items ?? []
  const reportQueue: AutoModFlagQueueItem[] = flagQueueData?.items ?? []

  const [mlEnabled, setMlEnabled] = useState(false)
  const [newBlacklistWord, setNewBlacklistWord] = useState('')
  const [threshold, setThreshold] = useState(3)

  useEffect(() => {
    if (spamData?.enabled !== undefined) setMlEnabled(spamData.enabled)
  }, [spamData?.enabled])

  useEffect(() => {
    if (communityConfigData?.threshold !== undefined) setThreshold(communityConfigData.threshold)
  }, [communityConfigData?.threshold])

  const toggleRuleMutation = useMutation({
    mutationFn: (rule: { id: number; enabled: boolean }) =>
      updateAutoModRule(rule.id, { enabled: !rule.enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'automod', 'rules'] }),
  })

  const toggleLibMutation = useMutation({
    mutationFn: (id: number) => toggleAutoModWordList(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'automod', 'word-lists'] }),
  })

  const addBlocklistMutation = useMutation({
    mutationFn: (username: string) => addAutoModUsernameBlocklist(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'automod', 'username-blocklist'] })
      setNewBlacklistWord('')
    },
  })

  const removeBlocklistMutation = useMutation({
    mutationFn: (username: string) => deleteAutoModUsernameBlocklist(username),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'automod', 'username-blocklist'] }),
  })

  const flagActionMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      actionAutoModFlagQueue(id, action),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'automod', 'flag-queue'] }),
  })

  const spamToggleMutation = useMutation({
    mutationFn: (enabled: boolean) => updateAutoModSpamDetection({ ...(spamData ?? {}), enabled }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'automod', 'spam-detection'] }),
  })

  const communityConfigMutation = useMutation({
    mutationFn: (newThreshold: number) =>
      updateAutoModCommunityModConfig({ ...(communityConfigData ?? {}), threshold: newThreshold }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'automod', 'community-mod-config'] }),
  })

  const toggleRule = (id: number) => {
    const rule = keywordRules.find((r) => r.id === id)
    if (rule) toggleRuleMutation.mutate({ id, enabled: rule.enabled })
  }

  const toggleLib = (id: number) => {
    toggleLibMutation.mutate(id)
  }

  const addBlacklistWord = () => {
    const word = newBlacklistWord.trim()
    if (word && !blacklist.includes(word)) {
      addBlocklistMutation.mutate(word)
    }
  }

  const removeBlacklistWord = (word: string) => {
    removeBlocklistMutation.mutate(word)
  }

  const handleReport = (id: number, action: 'approve' | 'reject') => {
    flagActionMutation.mutate({ id, action })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AutoMod 自動審核"
        description="設定自動內容審核規則，過濾違規發文與留言，維護社群討論品質。"
      />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Keyword rules */}
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
                關鍵字規則
              </h2>
              <Button type="button" size="sm" onClick={() => alert('新增規則')}>
                新增規則
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {['規則名稱', '模式', '動作', '狀態'].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywordRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{patternBadge(rule.pattern)}</TableCell>
                    <TableCell>{actionBadge(rule.action)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => toggleRule(rule.id)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          rule.enabled ? 'bg-primary' : 'bg-muted',
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-3.5 w-3.5 rounded-full bg-background transition-transform',
                            rule.enabled ? 'translate-x-4' : 'translate-x-1',
                          )}
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Sensitive word libraries */}
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
              預設敏感詞庫
            </h2>
            <div className="space-y-3">
              {sensitiveLibs.map((lib) => (
                <div key={lib.name} className="flex items-center justify-between">
                  <span className="text-sm">{lib.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {lib.enabled ? '啟用' : '停用'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleLib(lib.id)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        lib.enabled ? 'bg-primary' : 'bg-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-3.5 w-3.5 rounded-full bg-background transition-transform',
                          lib.enabled ? 'translate-x-4' : 'translate-x-1',
                        )}
                      />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* ML spam detection */}
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
                  ML 垃圾偵測
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const next = !mlEnabled
                  setMlEnabled(next)
                  spamToggleMutation.mutate(next)
                }}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  mlEnabled ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-background transition-transform',
                    mlEnabled ? 'translate-x-4' : 'translate-x-1',
                  )}
                />
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              使用機器學習模型自動偵測垃圾訊息（實驗功能）
            </p>
          </div>

          {/* Username blacklist */}
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
              用戶名黑名單
            </h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {blacklist.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 rounded bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive"
                >
                  {word}
                  <Button
                    type="button"
                    onClick={() => removeBlacklistWord(word)}
                    variant="ghost"
                    size="xs"
                    className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="新增黑名單字詞..."
                value={newBlacklistWord}
                onChange={(e) => setNewBlacklistWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addBlacklistWord()
                }}
              />
              <Button type="button" size="sm" onClick={addBlacklistWord}>
                新增
              </Button>
            </div>
          </div>

          {/* Community self-governance */}
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
                社群自治設定
              </h2>
            </div>
            <div className="space-y-2">
              <label htmlFor="threshold" className="block text-sm font-medium">
                檢舉閾值
              </label>
              <Input
                id="threshold"
                type="number"
                min={1}
                max={20}
                value={threshold}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setThreshold(val)
                  communityConfigMutation.mutate(val)
                }}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                當 {threshold} 位 Lv2+ 用戶檢舉同一內容時，自動隱藏
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit log - full width */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
          審核動作紀錄
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              {['時間', '內容摘要', '觸發規則', '執行動作', '用戶'].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogItems.map((row) => (
              <TableRow key={`${row.time}-${row.user}`}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {row.time}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{row.summary}</TableCell>
                <TableCell>
                  <Badge variant="primary">{row.rule}</Badge>
                </TableCell>
                <TableCell>{actionBadge(row.action)}</TableCell>
                <TableCell className="text-muted-foreground">{row.user}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Report queue - full width */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
        <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
          檢舉佇列
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              {['內容', '檢舉人數', '優先度', '檢舉原因', '操作'].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportQueue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  目前無待處理檢舉
                </TableCell>
              </TableRow>
            ) : (
              reportQueue.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-[200px] truncate">{row.content}</TableCell>
                  <TableCell className="font-medium">{row.reporters}</TableCell>
                  <TableCell>{priorityBadge(row.priority)}</TableCell>
                  <TableCell className="text-muted-foreground">{row.reason}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => handleReport(row.id, 'approve')}
                      >
                        同意
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => handleReport(row.id, 'reject')}
                      >
                        駁回
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
