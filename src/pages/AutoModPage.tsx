import { Bot, ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/* ---------- Mock data ---------- */

const initialKeywordRules = [
  { id: 1, name: '廣告連結', pattern: 'wildcard' as const, action: '刪除' as const, enabled: true },
  {
    id: 2,
    name: '仇恨言論',
    pattern: 'contains' as const,
    action: '禁言 30min' as const,
    enabled: true,
  },
  { id: 3, name: '個資外洩', pattern: 'contains' as const, action: '刪除' as const, enabled: true },
  { id: 4, name: '釣魚網址', pattern: 'exact' as const, action: '刪除' as const, enabled: false },
  { id: 5, name: '政治敏感', pattern: 'contains' as const, action: '警告' as const, enabled: true },
]

const initialSensitiveLibs = [
  { name: '不雅用語', enabled: true },
  { name: '色情內容', enabled: true },
  { name: '垃圾訊息', enabled: false },
]

const auditLog = [
  {
    time: '2025-05-27 14:32',
    summary: '「快來加入 Lin...」',
    rule: '廣告連結',
    action: '刪除',
    user: '匿名123',
  },
  {
    time: '2025-05-27 13:10',
    summary: '「你這個 XX...」',
    rule: '不雅用語',
    action: '警告',
    user: 'user_456',
  },
  {
    time: '2025-05-27 11:45',
    summary: '「我的電話是 09...」',
    rule: '個資外洩',
    action: '刪除',
    user: '王小明',
  },
  {
    time: '2025-05-26 22:30',
    summary: '「免費領取 BTC...」',
    rule: 'ML 垃圾偵測',
    action: '刪除',
    user: 'spammer99',
  },
  {
    time: '2025-05-26 18:05',
    summary: '「政府的陰謀是...」',
    rule: '政治敏感',
    action: '警告',
    user: '李大偉',
  },
  {
    time: '2025-05-26 15:20',
    summary: '「http://phish...」',
    rule: '釣魚網址',
    action: '刪除',
    user: '陳怡君',
  },
]

const initialReportQueue = [
  {
    id: 1,
    content: '「這個社群真的很爛...」',
    reporters: 5,
    priority: '高' as const,
    reason: '仇恨言論',
  },
  {
    id: 2,
    content: '「加我 Line 免費送...」',
    reporters: 3,
    priority: '中' as const,
    reason: '垃圾訊息',
  },
  {
    id: 3,
    content: '「大家不要相信管理...」',
    reporters: 2,
    priority: '低' as const,
    reason: '不實資訊',
  },
  {
    id: 4,
    content: '「私訊我拿折扣碼...」',
    reporters: 4,
    priority: '高' as const,
    reason: '廣告',
  },
]

const initialBlacklist = ['admin', 'moderator', 'official', 'system']

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
  const [keywordRules, setKeywordRules] = useState(initialKeywordRules)
  const [sensitiveLibs, setSensitiveLibs] = useState(initialSensitiveLibs)
  const [mlEnabled, setMlEnabled] = useState(false)
  const [blacklist, setBlacklist] = useState(initialBlacklist)
  const [newBlacklistWord, setNewBlacklistWord] = useState('')
  const [threshold, setThreshold] = useState(3)
  const [reportQueue, setReportQueue] = useState(initialReportQueue)

  const toggleRule = (id: number) => {
    setKeywordRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  const toggleLib = (name: string) => {
    setSensitiveLibs((prev) =>
      prev.map((l) => (l.name === name ? { ...l, enabled: !l.enabled } : l)),
    )
  }

  const addBlacklistWord = () => {
    const word = newBlacklistWord.trim()
    if (word && !blacklist.includes(word)) {
      setBlacklist((prev) => [...prev, word])
      setNewBlacklistWord('')
    }
  }

  const removeBlacklistWord = (word: string) => {
    setBlacklist((prev) => prev.filter((w) => w !== word))
  }

  const handleReport = (id: number, action: 'approve' | 'reject') => {
    alert(`${action === 'approve' ? '同意' : '駁回'}檢舉 #${id}`)
    setReportQueue((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <h1 className="heading-lg">AutoMod 自動審核</h1>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Keyword rules */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="heading-sm">關鍵字規則</h2>
              <Button type="button" size="sm" onClick={() => alert('新增規則')}>
                新增規則
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted text-muted-foreground">
                    {['規則名稱', '模式', '動作', '狀態'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keywordRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-border hover:bg-accent transition-colors"
                    >
                      <td className="px-4 py-2 font-medium">{rule.name}</td>
                      <td className="px-4 py-2">{patternBadge(rule.pattern)}</td>
                      <td className="px-4 py-2">{actionBadge(rule.action)}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => toggleRule(rule.id)}
                          className={cn(
                            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                            rule.enabled ? 'bg-primary' : 'bg-muted',
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                              rule.enabled ? 'translate-x-4' : 'translate-x-1',
                            )}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sensitive word libraries */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="heading-sm mb-4">預設敏感詞庫</h2>
            <div className="space-y-3">
              {sensitiveLibs.map((lib) => (
                <div key={lib.name} className="flex items-center justify-between">
                  <span className="text-sm">{lib.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {lib.enabled ? '啟用' : '停用'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleLib(lib.name)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        lib.enabled ? 'bg-primary' : 'bg-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                          lib.enabled ? 'translate-x-4' : 'translate-x-1',
                        )}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* ML spam detection */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
                <h2 className="heading-sm">ML 垃圾偵測</h2>
              </div>
              <button
                type="button"
                onClick={() => setMlEnabled(!mlEnabled)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  mlEnabled ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                    mlEnabled ? 'translate-x-4' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              使用機器學習模型自動偵測垃圾訊息（實驗功能）
            </p>
          </div>

          {/* Username blacklist */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="heading-sm mb-4">用戶名黑名單</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {blacklist.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => removeBlacklistWord(word)}
                    className="text-red-400 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
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
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <h2 className="heading-sm">社群自治設定</h2>
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
                onChange={(e) => setThreshold(Number(e.target.value))}
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
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="heading-sm mb-4">審核動作紀錄</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground">
                {['時間', '內容摘要', '觸發規則', '執行動作', '用戶'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLog.map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-accent transition-colors">
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {row.time}
                  </td>
                  <td className="px-4 py-2 max-w-[200px] truncate">{row.summary}</td>
                  <td className="px-4 py-2">
                    <Badge variant="primary">{row.rule}</Badge>
                  </td>
                  <td className="px-4 py-2">{actionBadge(row.action)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report queue - full width */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="heading-sm mb-4">檢舉佇列</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground">
                {['內容', '檢舉人數', '優先度', '檢舉原因', '操作'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    目前無待處理檢舉
                  </td>
                </tr>
              ) : (
                reportQueue.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border hover:bg-accent transition-colors"
                  >
                    <td className="px-4 py-2 max-w-[200px] truncate">{row.content}</td>
                    <td className="px-4 py-2 font-medium">{row.reporters}</td>
                    <td className="px-4 py-2">{priorityBadge(row.priority)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.reason}</td>
                    <td className="px-4 py-2">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
