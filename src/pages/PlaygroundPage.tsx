import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  createAIServiceConfig,
  createSystemPrompt,
  getUserQuota,
  listInsightPractices,
  listInsightUsers,
  listLLMModels,
  listSystemPrompts,
  playgroundChat,
  playgroundInsight,
  saveInsightResult,
  updateSystemPrompt,
} from '@/api/admin-ai'
import type { ChatMessage, PlaygroundChatResponse, PlaygroundInsightResponse } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

/** 將原始後端錯誤訊息轉為使用者友善文字 */
function _toFriendlyError(raw: string | null | undefined): string {
  if (!raw) return '發生未知錯誤，請重試'
  const s = raw.toLowerCase()
  if (s.includes('token 配額已用盡') || s.includes('quota exceeded')) return raw // 已是友善訊息，直接顯示
  if (s.includes('credit balance') || s.includes('billing') || s.includes('payment'))
    return '模型 API 餘額不足，請至供應商後台儲值後再試'
  if (s.includes('quota') || s.includes('rate limit') || s.includes('rate_limit'))
    return '已達 API 使用限制，請稍後再試'
  if (s.includes('invalid_api_key') || s.includes('api key') || s.includes('authentication'))
    return 'API 金鑰無效或未設定，請確認後端設定'
  if (s.includes('model') && (s.includes('not found') || s.includes('does not exist')))
    return '指定模型不存在或已停用，請重新選擇'
  if (s.includes('context length') || s.includes('token limit') || s.includes('too long'))
    return '訊息超過模型 context 長度上限，請縮短內容'
  if (s.includes('timeout') || s.includes('timed out')) return '請求逾時，請稍後再試'
  if (s.includes('connection') || s.includes('network') || s.includes('unreachable'))
    return '無法連線至 AI 服務，請確認網路或後端狀態'
  // 其他：顯示簡短摘要（最多 80 字）
  return raw.length > 80 ? `${raw.slice(0, 80)}…` : raw
}

/** token 用量百分比 → Tailwind 顏色 */
function _usageColor(used: number, limit: number): string {
  const pct = limit > 0 ? used / limit : 0
  if (pct >= 1) return 'bg-destructive'
  if (pct >= 0.8) return 'bg-tips'
  return 'bg-primary'
}

let _msgIdCounter = 0
function nextMsgId() {
  return `msg-${++_msgIdCounter}-${Date.now()}`
}

function InsightResultCard({
  card,
  onSave,
  onRemove,
}: {
  card: {
    id: string
    model_used: string
    timestamp: string
    data: PlaygroundInsightResponse
    savedOverride?: boolean
  }
  onSave: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [showThinking, setShowThinking] = useState(false)
  const isSaved = card.savedOverride || card.data.saved

  return (
    <div className="rounded-lg border border-[var(--admin-panel-border)] bg-card/90 p-4 shadow-sm">
      {/* header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div>
          <p className="text-xs font-medium text-foreground">{card.model_used}</p>
          <p className="text-xs text-muted-foreground">{card.timestamp}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="ml-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(card.id)}
          aria-label="刪除此卡片"
        >
          ✕
        </Button>
      </div>

      {/* body */}
      <div className="flex-1 p-3 space-y-3">
        <p className="text-sm whitespace-pre-wrap">{card.data.insight}</p>

        {/* footer stats */}
        <div className="text-xs text-muted-foreground">
          {(card.data.input_tokens + card.data.output_tokens).toLocaleString()} tokens
          {card.data.cost_usd > 0 && ` · $${card.data.cost_usd.toFixed(6)}`}
          {card.data.latency_ms >= 1000
            ? ` · ${(card.data.latency_ms / 1000).toFixed(1)}s`
            : ` · ${card.data.latency_ms}ms`}
          {isSaved && ' · ✓ 已儲存'}
        </div>

        {/* thinking toggle */}
        {card.data.thinking && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="block px-0 py-0 h-auto text-xs text-warning hover:text-warning/80"
              onClick={() => setShowThinking((v) => !v)}
            >
              {showThinking ? '▾ 隱藏思考過程' : '▸ 查看思考過程'}
            </Button>
            {showThinking && (
              <pre className="text-xs bg-warning/10 border border-warning/30 p-2 rounded overflow-x-auto whitespace-pre-wrap text-warning">
                {card.data.thinking}
              </pre>
            )}
          </>
        )}

        {/* prompt toggle */}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="block px-0 py-0 h-auto text-xs"
          onClick={() => setShowPrompt((v) => !v)}
        >
          {showPrompt ? '▾ 隱藏 Prompt' : '▸ 查看 Prompt'}
        </Button>
        {showPrompt && (
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
            {card.data.prompt_used}
          </pre>
        )}

        {/* save button */}
        {!isSaved && (
          <Button type="button" variant="destructive" size="xs" onClick={() => onSave(card.id)}>
            儲存此結果
          </Button>
        )}
      </div>
    </div>
  )
}

function InsightTab() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedPracticeId, setSelectedPracticeId] = useState<number | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [includes, setIncludes] = useState({
    include_user_profile: true,
    include_practice_info: true,
    include_checkin_stats: true,
    include_notable_notes: true,
  })
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState('')
  const STORAGE_KEY = 'insight-playground-result-cards'
  const [resultCards, setResultCards] = useState<
    Array<{
      id: string
      model_used: string
      timestamp: string
      data: PlaygroundInsightResponse
      savedOverride?: boolean
    }>
  >(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [insightMaxTokens, setInsightMaxTokens] = useState<number | null>(null)
  const [insightTemperature, setInsightTemperature] = useState<number | null>(null)
  const [insightTopP, setInsightTopP] = useState<number | null>(null)
  const [insightTopK, setInsightTopK] = useState<number | null>(null)
  const [isSavingPrompt, setIsSavingPrompt] = useState(false)
  const [_savePromptError, setSavePromptError] = useState<string | null>(null)
  const [showNewVersionInput, setShowNewVersionInput] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState('')
  const [showSaveConfig, setShowSaveConfig] = useState(false)
  const [saveConfigName, setSaveConfigName] = useState('')
  const [saveConfigStatus, setSaveConfigStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle',
  )
  const [saveConfigError, setSaveConfigError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: users = [] } = useQuery({
    queryKey: ['insight-users'],
    queryFn: () => listInsightUsers().then((r) => r.data.data),
  })

  const { data: practices = [] } = useQuery({
    queryKey: ['insight-practices', selectedUserId],
    queryFn: () => listInsightPractices(selectedUserId as number).then((r) => r.data.data),
    enabled: selectedUserId !== null,
  })

  const { data: prompts = [] } = useQuery({
    queryKey: ['system-prompts-insight'],
    queryFn: () => listSystemPrompts({ is_active: true }).then((r) => r.data.data),
  })

  const { data: providerModels = [] } = useQuery({
    queryKey: ['llm-models', selectedProvider],
    queryFn: () => listLLMModels({ provider: selectedProvider }).then((r) => r.data.data),
    enabled: !!selectedProvider,
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resultCards))
    } catch {
      // localStorage 滿了或被禁用，靜默失敗
    }
  }, [resultCards])

  useEffect(() => {
    if (selectedPromptId === null && prompts.length > 0) {
      const insightPrompt =
        prompts.find((p) => p.name?.toLowerCase().includes('insight')) ?? prompts[0]
      setSelectedPromptId(insightPrompt.id)
      setSystemPrompt(insightPrompt.content)
      setDefaultSystemPrompt(insightPrompt.content)
    }
  }, [prompts, selectedPromptId])

  useEffect(() => {
    if (selectedPromptId === null) return
    const prompt = prompts.find((p) => p.id === selectedPromptId)
    if (prompt) {
      setSystemPrompt(prompt.content)
      setDefaultSystemPrompt(prompt.content)
    }
  }, [selectedPromptId, prompts])

  const handlePreview = async () => {
    if (!selectedPracticeId || !selectedModelId) return
    setIsRunning(true)
    setRunError(null)
    try {
      const res = await playgroundInsight({
        practice_id: selectedPracticeId,
        model_id: selectedModelId,
        save: false,
        system_prompt_id: selectedPromptId ?? undefined,
        system_prompt_override: systemPrompt !== defaultSystemPrompt ? systemPrompt : undefined,
        max_tokens: insightMaxTokens ?? undefined,
        temperature: insightTemperature ?? undefined,
        top_p: insightTopP ?? undefined,
        top_k: insightTopK ?? undefined,
        ...includes,
      })
      if (!res.data.success) {
        const errMsg = (res.data as { error?: { message?: string } }).error?.message ?? '發生錯誤'
        setRunError(errMsg)
        return
      }
      const d = res.data.data
      const newCard = {
        id: Date.now().toString(),
        model_used: d.model_used,
        timestamp: new Date().toLocaleTimeString('zh-TW'),
        data: d,
      }
      setResultCards((prev) => [newCard, ...prev])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '發生錯誤'
      setRunError(msg)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSave = async (id: string) => {
    if (!selectedPracticeId) return
    const card = resultCards.find((c) => c.id === id)
    if (!card) return
    const { insight } = card.data
    try {
      const res = await saveInsightResult({ practice_id: selectedPracticeId, insight })
      if (res.data.success) {
        setResultCards((prev) => prev.map((c) => (c.id === id ? { ...c, savedOverride: true } : c)))
      }
    } catch {
      // silently ignore save errors
    }
  }

  const handleRemoveCard = (id: string) => {
    setResultCards((prev) => prev.filter((c) => c.id !== id))
  }

  const handleCreateVersion = async (contentOverride?: string) => {
    if (!newVersionName.trim()) return
    setIsCreatingVersion(true)
    try {
      const res = await createSystemPrompt({
        name: newVersionName.trim(),
        content: contentOverride ?? systemPrompt,
        is_active: true,
      })
      const created = res.data.data
      await queryClient.invalidateQueries({ queryKey: ['system-prompts-insight'] })
      setSelectedPromptId(created.id)
      setDefaultSystemPrompt(systemPrompt)
      setShowNewVersionInput(false)
      setNewVersionName('')
    } catch {
      // silently ignore
    } finally {
      setIsCreatingVersion(false)
    }
  }

  const _handleSavePrompt = async () => {
    if (!selectedPromptId) return
    setIsSavingPrompt(true)
    setSavePromptError(null)
    try {
      await updateSystemPrompt(selectedPromptId, { content: systemPrompt })
      setDefaultSystemPrompt(systemPrompt)
    } catch {
      setSavePromptError('儲存失敗，請重試')
    } finally {
      setIsSavingPrompt(false)
    }
  }

  const PROVIDERS = [
    'groq',
    'anthropic',
    'gemini',
    'openai',
    'cloudflare',
    'nvidia',
    'cerebras',
    'openrouter',
    'ollama_cloud',
    'ollama',
  ]
  const INCLUDE_LABELS: Record<string, string> = {
    include_user_profile: '使用者個人資訊',
    include_practice_info: '實踐資訊',
    include_checkin_stats: '打卡統計',
    include_notable_notes: '精選筆記',
  }

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* 左側設定欄 */}
      <aside className="w-72 shrink-0 rounded-lg border border-[var(--admin-panel-border)] bg-background/70 p-2.5 shadow-sm border-r border-border flex flex-col gap-4 p-4 overflow-y-auto">
        <h2 className="font-semibold text-sm">Insight 設定</h2>

        {/* 使用者 */}
        <div className="space-y-1">
          <label
            htmlFor="insight-user-select"
            className="text-xs font-medium text-muted-foreground"
          >
            使用者
          </label>
          <Select
            value={selectedUserId?.toString() ?? ''}
            onValueChange={(v) => {
              setSelectedUserId(v ? Number(v) : null)
              setSelectedPracticeId(null)
            }}
            options={users.map((u) => ({
              value: u.id.toString(),
              label: u.nickname ?? `User #${u.id}`,
            }))}
            placeholder="選擇使用者…"
          />
        </div>

        {/* Practice */}
        <div className="space-y-1">
          <label
            htmlFor="insight-practice-select"
            className="text-xs font-medium text-muted-foreground"
          >
            Practice
          </label>
          <Select
            value={selectedPracticeId?.toString() ?? ''}
            onValueChange={(v) => setSelectedPracticeId(v ? Number(v) : null)}
            options={practices.map((p) => ({
              value: p.id.toString(),
              label: `${p.has_insight ? '✓ ' : ''}${p.title}`,
            }))}
            placeholder="選擇 Practice…"
            disabled={!selectedUserId}
          />
        </div>

        {/* 模型選擇 */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">模型</span>
          <Select
            value={selectedProvider}
            onValueChange={(v) => {
              setSelectedProvider(v)
              setSelectedModelId(null)
            }}
            options={PROVIDERS.map((p) => ({ value: p, label: p }))}
            placeholder="Provider…"
            triggerClassName="text-xs py-1 px-2"
          />
          <Select
            value={selectedModelId?.toString() ?? ''}
            onValueChange={(v) => setSelectedModelId(Number(v))}
            options={providerModels.map((m) => ({
              value: m.id.toString(),
              label: `${m.display_name ?? m.model_name}${m.is_active ? '' : ' (inactive)'}`,
            }))}
            placeholder="Model…"
            disabled={!selectedProvider || providerModels.length === 0}
            triggerClassName="text-xs py-1 px-2"
          />
        </div>

        {/* 參數設定 */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-muted-foreground">參數</span>
          <div className="space-y-1">
            <label htmlFor="insight-max-tokens" className="text-xs text-muted-foreground">
              Max tokens
            </label>
            <Input
              id="insight-max-tokens"
              type="number"
              min={1}
              max={32000}
              placeholder="預設 2000"
              value={insightMaxTokens ?? ''}
              onChange={(e) => setInsightMaxTokens(e.target.value ? Number(e.target.value) : null)}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="insight-temperature" className="text-xs text-muted-foreground">
              Temperature{insightTemperature !== null ? ` (${insightTemperature})` : ''}
            </label>
            <Input
              id="insight-temperature"
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={insightTemperature ?? 1}
              onChange={(e) => setInsightTemperature(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-auto px-0 py-0 text-xs"
                onClick={() => setInsightTemperature(null)}
              >
                重設
              </Button>
              <span>2</span>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="insight-top-p" className="text-xs text-muted-foreground">
              Top-p{insightTopP !== null ? ` (${insightTopP})` : ''}
            </label>
            <Input
              id="insight-top-p"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={insightTopP ?? 1}
              onChange={(e) => setInsightTopP(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-auto px-0 py-0 text-xs"
                onClick={() => setInsightTopP(null)}
              >
                重設
              </Button>
              <span>1</span>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="insight-top-k" className="text-xs text-muted-foreground">
              Top-k
            </label>
            <Input
              id="insight-top-k"
              type="number"
              min={1}
              max={200}
              placeholder="預設"
              value={insightTopK ?? ''}
              onChange={(e) => setInsightTopK(e.target.value ? Number(e.target.value) : null)}
              className="tabular-nums"
            />
          </div>
        </div>

        {/* 資料區塊 */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">資料區塊</span>
          {(Object.keys(includes) as Array<keyof typeof includes>).map((key) => (
            <div key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={includes[key]}
                onCheckedChange={(checked) =>
                  setIncludes((prev) => ({ ...prev, [key]: !!checked }))
                }
              />
              {INCLUDE_LABELS[key]}
            </div>
          ))}
        </div>

        {/* System Prompt */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">System Prompt</span>
            {systemPrompt !== defaultSystemPrompt && (
              <span className="text-xs text-success font-medium">已修改</span>
            )}
          </div>
          {prompts.length > 0 && (
            <Select
              value={selectedPromptId?.toString() ?? ''}
              onValueChange={(v) => setSelectedPromptId(v ? Number(v) : null)}
              options={prompts.map((p) => ({ value: p.id.toString(), label: p.name }))}
              placeholder="選擇版本…"
              triggerClassName="text-xs py-1 px-2"
            />
          )}
          {/* 摘要預覽 */}
          <Button
            type="button"
            variant="outline"
            className="w-full text-left rounded-md border border-input bg-muted/40 px-3 py-2 text-xs text-muted-foreground font-mono leading-relaxed line-clamp-3 min-h-[56px] cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => {
              setEditingPrompt(systemPrompt)
              setShowPromptEditor(true)
            }}
          >
            {systemPrompt || <span className="italic">（空白）</span>}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setEditingPrompt(systemPrompt)
              setShowPromptEditor(true)
            }}
            variant="outline"
            size="sm"
            className="w-full justify-start text-left"
          >
            ✏️ 編輯 System Prompt
          </Button>
        </div>
      </aside>

      {/* 中央結果區 */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* 操作列 */}
        <div className="border-b border-border p-3 flex gap-2 items-center">
          <Button
            type="button"
            onClick={handlePreview}
            disabled={!selectedPracticeId || !selectedModelId || isRunning}
            variant="secondary"
            size="sm"
          >
            {isRunning ? '生成中…' : '預覽'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setSaveConfigName('')
              setSaveConfigStatus('idle')
              setSaveConfigError(null)
              setShowSaveConfig(true)
            }}
            disabled={!selectedModelId || resultCards.length === 0}
            variant="outline"
            size="sm"
            className="disabled:cursor-not-allowed"
          >
            儲存為設定
          </Button>
          {resultCards.length > 0 && (
            <Button
              type="button"
              onClick={() => setResultCards([])}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              清除所有結果
            </Button>
          )}
          {runError && <p className="text-xs text-destructive ml-2">{runError}</p>}
        </div>

        {/* 結果卡片 */}
        <div className="flex-1 overflow-auto p-4">
          {resultCards.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              選擇模型後按「預覽」開始生成
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {resultCards.map((card) => (
                <InsightResultCard
                  key={card.id}
                  card={card}
                  onSave={handleSave}
                  onRemove={handleRemoveCard}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 儲存為 AI 設定 dialog */}
      <Dialog
        open={showSaveConfig}
        onOpenChange={(open) => {
          if (!open) setShowSaveConfig(false)
        }}
      >
        <DialogContent>
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <span className="font-semibold text-sm">儲存為 AI 設定</span>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              將目前的模型與參數設定儲存為 AI 服務設定（service: insight，預設停用，需在 AI
              服務設定頁面手動啟用）。
            </p>
            <div>
              <label
                htmlFor="save-config-name"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                設定名稱 *
              </label>
              <Input
                id="save-config-name"
                value={saveConfigName}
                onChange={(e) => setSaveConfigName(e.target.value)}
                placeholder="例：insight-v2-claude-3"
                autoFocus
              />
            </div>
            {saveConfigStatus === 'success' && (
              <p className="text-xs text-success">已成功儲存！可至「AI 服務設定」頁面查看。</p>
            )}
            {saveConfigStatus === 'error' && (
              <p className="text-xs text-destructive">{saveConfigError ?? '儲存失敗，請重試'}</p>
            )}
          </div>
          <div className="border-t border-border px-5 py-3 flex gap-2 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!saveConfigName.trim() || saveConfigStatus === 'saving'}
              onClick={async () => {
                if (!selectedModelId || !saveConfigName.trim()) return
                setSaveConfigStatus('saving')
                setSaveConfigError(null)
                try {
                  await createAIServiceConfig({
                    service: 'insight',
                    name: saveConfigName.trim(),
                    model_id: selectedModelId,
                    system_prompt_id: selectedPromptId,
                    max_tokens: insightMaxTokens,
                    temperature: insightTemperature,
                    top_p: insightTopP,
                    top_k: insightTopK,
                    is_active: false,
                  })
                  setSaveConfigStatus('success')
                } catch (e: unknown) {
                  setSaveConfigStatus('error')
                  setSaveConfigError(e instanceof Error ? e.message : '儲存失敗')
                }
              }}
            >
              {saveConfigStatus === 'saving' ? '儲存中…' : '儲存'}
            </Button>
            <Button
              type="button"
              onClick={() => setShowSaveConfig(false)}
              variant="outline"
              size="sm"
            >
              {saveConfigStatus === 'success' ? '關閉' : '取消'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPromptEditor} onOpenChange={setShowPromptEditor}>
        <DialogContent>
          {/* 頂部 */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm">編輯 System Prompt</span>
              {prompts.length > 0 && (
                <Select
                  value={selectedPromptId?.toString() ?? ''}
                  onValueChange={(v) => {
                    const newId = v ? Number(v) : null
                    setSelectedPromptId(newId)
                    const p = prompts.find((x) => x.id === newId)
                    if (p) setEditingPrompt(p.content)
                  }}
                  options={prompts.map((p) => ({ value: p.id.toString(), label: p.name }))}
                  placeholder="選擇版本…"
                  triggerClassName="text-xs py-1 px-2"
                />
              )}
              <span className="text-xs text-muted-foreground">
                {editingPrompt.length.toLocaleString()} 字元 · {editingPrompt.split('\n').length} 行
              </span>
            </div>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>

          {/* textarea */}
          <Textarea
            className="flex-1 rounded-lg border border-[var(--admin-panel-border)] bg-card/90 p-4 shadow-sm resize-none px-5 py-4 text-sm font-mono leading-relaxed focus:outline-none"
            value={editingPrompt}
            onChange={(e) => setEditingPrompt(e.target.value)}
            placeholder="在這裡撰寫 System Prompt…"
            autoFocus
          />

          {/* 底部操作 */}
          <div className="border-t border-border px-5 py-3 flex items-center gap-3 shrink-0">
            {showNewVersionInput ? (
              <>
                <Input
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="新版本名稱…"
                  className="text-xs w-48 py-1.5"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateVersion(editingPrompt)
                  }}
                />
                <Button
                  type="button"
                  onClick={async () => {
                    setSystemPrompt(editingPrompt)
                    await handleCreateVersion(editingPrompt)
                    setShowPromptEditor(false)
                  }}
                  disabled={isCreatingVersion || !newVersionName.trim()}
                  size="sm"
                >
                  {isCreatingVersion ? '建立中…' : '確認建立'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowNewVersionInput(false)}
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                >
                  取消
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    setSystemPrompt(editingPrompt)
                    setShowPromptEditor(false)
                    if (selectedPromptId) {
                      setIsSavingPrompt(true)
                      try {
                        await updateSystemPrompt(selectedPromptId, { content: editingPrompt })
                        setDefaultSystemPrompt(editingPrompt)
                      } catch {
                        setSavePromptError('儲存失敗')
                      } finally {
                        setIsSavingPrompt(false)
                      }
                    }
                  }}
                  disabled={isSavingPrompt}
                >
                  {isSavingPrompt ? '儲存中…' : '覆蓋儲存'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const base = prompts.find((p) => p.id === selectedPromptId)
                    setNewVersionName(base ? `${base.name} v2` : '')
                    setShowNewVersionInput(true)
                  }}
                >
                  另存為新版本
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSystemPrompt(editingPrompt)
                    setShowPromptEditor(false)
                  }}
                >
                  套用（不儲存）
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPromptEditor(false)}
                  className="ml-auto text-xs text-muted-foreground"
                >
                  取消
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function PlaygroundPage() {
  const { adminInfo } = useAuth()
  const [activeTab, setActiveTab] = useState<'chat' | 'insight'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [lastStats, setLastStats] = useState<PlaygroundChatResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chatMaxTokens, setChatMaxTokens] = useState<number | null>(null)
  const [chatTemperature, setChatTemperature] = useState<number | null>(null)
  const [chatTopP, setChatTopP] = useState<number | null>(null)
  const [chatTopK, setChatTopK] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: models = [] } = useQuery({
    queryKey: ['llm-models'],
    queryFn: () => listLLMModels().then((r) => r.data.data),
  })

  const { data: prompts = [] } = useQuery({
    queryKey: ['system-prompts', { is_active: true }],
    queryFn: () => listSystemPrompts({ is_active: true }).then((r) => r.data.data),
  })

  // 使用者 quota（有 userId 才查）
  const adminIdNum = adminInfo?.userId ? Number(adminInfo.userId) : null
  const { data: quotaData, refetch: refetchQuota } = useQuery({
    queryKey: ['admin-quota', adminIdNum],
    queryFn: () => getUserQuota(adminIdNum as number).then((r) => r.data.data),
    enabled: !!adminIdNum,
    staleTime: 30_000, // 30 秒內不重新查
  })

  // 自動選第一個 model
  useEffect(() => {
    if (models.length > 0 && selectedModelId === null) {
      setSelectedModelId(models[0].id)
    }
  }, [models, selectedModelId])

  // 捲到最新訊息
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    if (!input.trim() || !selectedModelId || isSending) return
    setError(null)

    const userMsg: ChatMessage = { id: nextMsgId(), role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsSending(true)

    try {
      const res = await playgroundChat({
        model_id: selectedModelId,
        system_prompt_id: selectedPromptId ?? undefined,
        message: userMsg.content,
        max_tokens: chatMaxTokens ?? undefined,
        temperature: chatTemperature ?? undefined,
        top_p: chatTopP ?? undefined,
        top_k: chatTopK ?? undefined,
      })

      // ── 後端 api_response_decorator 把所有錯誤都包成 HTTP 200 ──
      // 必須先判斷 success，否則 data 為 null 時存取 d.response 會拋 TypeError
      if (!res.data.success) {
        const errMsg =
          (res.data as { error?: { message?: string } }).error?.message ?? '發生未知錯誤'
        setError(_toFriendlyError(errMsg))
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      const d = res.data.data
      setLastStats(d)
      const assistantMsg: ChatMessage = {
        id: nextMsgId(),
        role: 'assistant',
        content: d.response,
        meta: {
          input_tokens: d.input_tokens,
          output_tokens: d.output_tokens,
          cost_usd: d.cost_usd,
          latency_ms: d.latency_ms,
          model_used: d.model_used,
        },
      }
      setMessages((prev) => [...prev, assistantMsg])
      // 送出後重新整理 quota 顯示
      refetchQuota()
    } catch (err: unknown) {
      // HTTP 4xx/5xx（理論上 decorator 會攔截，但保留作為備用）
      const raw =
        (err as { response?: { data?: { error?: { message?: string }; detail?: string } } })
          ?.response?.data?.error?.message ??
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err instanceof Error ? err.message : null)

      const friendly = _toFriendlyError(raw)
      setError(friendly)
      setMessages((prev) => prev.slice(0, -1)) // 移除 user 訊息
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const monthlyUsed = quotaData?.current_month_tokens_used ?? 0
  const monthlyLimit = quotaData?.quota?.monthly_token_limit ?? 0
  const dailyLimit = quotaData?.quota?.daily_token_limit ?? null

  return (
    <div className="flex min-h-0 flex-col">
      {/* Tab bar */}
      <div className="inline-flex rounded-lg border border-[var(--admin-panel-border)] bg-background/65 p-1">
        {(['chat', 'insight'] as const).map((tab) => (
          <Button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-transparent bg-transparent shadow-none hover:bg-muted hover:text-foreground flex-1 justify-center ${
              activeTab === tab
                ? 'bg-background/70 text-foreground shadow-sm hover:bg-background/70'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'chat' ? 'Chat' : 'Insight 測試'}
          </Button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'chat' ? (
        <div className="flex flex-1 min-h-0 flex-col xl:flex-row gap-4 xl:gap-0">
          {/* ── 左側設定欄 ── */}
          <aside className="w-full xl:w-64 xl:shrink-0 rounded-lg border border-[var(--admin-panel-border)] bg-background/70 p-2.5 shadow-sm border-b xl:border-b-0 xl:border-r border-border flex flex-col gap-4 p-4">
            <h2 className="font-semibold text-sm text-foreground">設定</h2>

            {/* Model 選擇 */}
            <div className="space-y-1">
              <label
                htmlFor="llm-model-select"
                className="text-xs font-medium text-muted-foreground"
              >
                LLM 模型
              </label>
              <Select
                value={selectedModelId?.toString() ?? ''}
                onValueChange={(v) => setSelectedModelId(Number(v))}
                options={models.map((m) => ({
                  value: m.id.toString(),
                  label: `${m.display_name ?? m.model_name}${m.is_active ? '' : ' (inactive)'}`,
                }))}
                placeholder="選擇模型…"
              />
            </div>

            {/* System Prompt 選擇 */}
            <div className="space-y-1">
              <label
                htmlFor="system-prompt-select"
                className="text-xs font-medium text-muted-foreground"
              >
                System Prompt
              </label>
              <Select
                value={selectedPromptId?.toString() ?? '__none__'}
                onValueChange={(v) => setSelectedPromptId(v === '__none__' ? null : Number(v))}
                options={[
                  { value: '__none__', label: '不使用' },
                  ...prompts.map((p) => ({ value: p.id.toString(), label: p.name })),
                ]}
                placeholder="不使用"
              />
            </div>

            {/* 參數設定 */}
            <div className="space-y-3">
              <span className="text-xs font-medium text-muted-foreground">參數</span>
              <div className="space-y-1">
                <label htmlFor="chat-max-tokens" className="text-xs text-muted-foreground">
                  Max tokens
                </label>
                <Input
                  id="chat-max-tokens"
                  type="number"
                  min={1}
                  max={32000}
                  placeholder="預設"
                  value={chatMaxTokens ?? ''}
                  onChange={(e) => setChatMaxTokens(e.target.value ? Number(e.target.value) : null)}
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="chat-temperature" className="text-xs text-muted-foreground">
                  Temperature{chatTemperature !== null ? ` (${chatTemperature})` : ''}
                </label>
                <Input
                  id="chat-temperature"
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={chatTemperature ?? 1}
                  onChange={(e) => setChatTemperature(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-auto px-0 py-0 text-xs"
                    onClick={() => setChatTemperature(null)}
                  >
                    重設
                  </Button>
                  <span>2</span>
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="chat-top-p" className="text-xs text-muted-foreground">
                  Top-p{chatTopP !== null ? ` (${chatTopP})` : ''}
                </label>
                <Input
                  id="chat-top-p"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={chatTopP ?? 1}
                  onChange={(e) => setChatTopP(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-auto px-0 py-0 text-xs"
                    onClick={() => setChatTopP(null)}
                  >
                    重設
                  </Button>
                  <span>1</span>
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="chat-top-k" className="text-xs text-muted-foreground">
                  Top-k
                </label>
                <Input
                  id="chat-top-k"
                  type="number"
                  min={1}
                  max={200}
                  placeholder="預設"
                  value={chatTopK ?? ''}
                  onChange={(e) => setChatTopK(e.target.value ? Number(e.target.value) : null)}
                  className="tabular-nums"
                />
              </div>
            </div>

            {/* 清除對話 */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setMessages([])
                setLastStats(null)
                setError(null)
              }}
              className="w-full rounded-md px-3 py-2"
            >
              <Trash2 className="h-4 w-4" />
              清除對話
            </Button>

            {/* 使用者資訊 & Quota */}
            {adminInfo && (
              <div className="mt-auto border-t border-border pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">目前使用者</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {adminInfo.nickname ?? `Admin #${adminInfo.userId}`}
                  </p>
                  <p className="text-xs text-muted-foreground">ID: {adminInfo.userId}</p>
                </div>

                {quotaData ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Token 配額（本月）</p>
                    {quotaData.quota !== null ? (
                      <>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{monthlyUsed.toLocaleString()}</span>
                          <span>{monthlyLimit.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${_usageColor(monthlyUsed, monthlyLimit)}`}
                            style={{
                              width: `${Math.min(100, monthlyLimit > 0 ? (monthlyUsed / monthlyLimit) * 100 : 0)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                          剩餘 {Math.max(0, monthlyLimit - monthlyUsed).toLocaleString()} tokens
                        </p>
                        {dailyLimit !== null && (
                          <p className="text-xs text-muted-foreground">
                            日限制：{dailyLimit.toLocaleString()} tokens
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        已用 {monthlyUsed.toLocaleString()} tokens（無配額限制）
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">配額載入中…</p>
                )}
              </div>
            )}
          </aside>

          {/* ── 中央聊天區 ── */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* 訊息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  選擇模型後輸入訊息開始測試
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.content}
                    {msg.role === 'assistant' && msg.meta && (
                      <div className="mt-1 text-xs opacity-60">
                        {(msg.meta.input_tokens + msg.meta.output_tokens).toLocaleString()} tokens
                        {msg.meta.cost_usd > 0 && ` · $${msg.meta.cost_usd.toFixed(6)}`}
                        {` · ${msg.meta.latency_ms}ms`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                    生成中…
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* 輸入區 */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2 items-end">
                <Textarea
                  rows={3}
                  className="flex-1 resize-none w-auto"
                  placeholder="輸入訊息… (Enter 送出，Shift+Enter 換行)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending || !selectedModelId}
                />
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !input.trim() || !selectedModelId}
                  className="rounded-md"
                >
                  <Send className="h-4 w-4" />
                  送出
                </Button>
              </div>
            </div>
          </div>

          {/* ── 右側統計欄 ── */}
          <aside className="w-full xl:w-52 xl:shrink-0 rounded-lg border border-[var(--admin-panel-border)] bg-background/70 p-2.5 shadow-sm border-t xl:border-t-0 xl:border-l border-border p-4 space-y-4">
            <h2 className="font-semibold text-sm text-foreground">最後一次統計</h2>
            {lastStats ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">模型</dt>
                  <dd className="font-medium text-foreground break-all">{lastStats.model_used}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Input tokens</dt>
                  <dd className="font-medium text-foreground">
                    {lastStats.input_tokens.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Output tokens</dt>
                  <dd className="font-medium text-foreground">
                    {lastStats.output_tokens.toLocaleString()}
                  </dd>
                </div>
                {lastStats.cost_usd > 0 && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Cost (USD)</dt>
                    <dd className="font-medium text-foreground">
                      ${lastStats.cost_usd.toFixed(6)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-muted-foreground">Latency</dt>
                  <dd className="font-medium text-foreground">{lastStats.latency_ms} ms</dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">送出第一則訊息後顯示</p>
            )}
          </aside>
        </div>
      ) : (
        <InsightTab />
      )}
    </div>
  )
}
