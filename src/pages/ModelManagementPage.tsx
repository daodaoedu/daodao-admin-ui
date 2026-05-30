import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  createLLMModel,
  deleteLLMModel,
  listLLMModels,
  syncProviderModels,
  updateLLMModel,
} from '@/api/admin-ai'
import type { LLMModel, LLMModelCreate, ModelSyncResult } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const PROVIDERS = [
  'groq',
  'openai',
  'anthropic',
  'gemini',
  'cloudflare',
  'nvidia',
  'cerebras',
  'openrouter',
  'ollama_cloud',
  'ollama',
]

interface FormState {
  provider: string
  model_name: string
  display_name: string
  is_active: boolean
  input_cost_per_1m: string
  output_cost_per_1m: string
  cached_input_cost_per_1m: string
  notes: string
}

function ModelForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initial?: Partial<LLMModelCreate>
  onSubmit: (data: LLMModelCreate) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [form, setForm] = useState<FormState>({
    provider: initial?.provider ?? '',
    model_name: initial?.model_name ?? '',
    display_name: initial?.display_name ?? '',
    is_active: initial?.is_active ?? true,
    input_cost_per_1m: initial?.input_cost_per_1m ?? '0',
    output_cost_per_1m: initial?.output_cost_per_1m ?? '0',
    cached_input_cost_per_1m: initial?.cached_input_cost_per_1m ?? '0',
    notes: initial?.notes ?? '',
  })

  const textField = (key: keyof FormState, label: string, disabled = false) => (
    <div key={key} className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        value={String(form[key])}
        disabled={disabled}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
      />
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Provider</span>
        <Select
          value={form.provider}
          onValueChange={(v) => setForm((prev) => ({ ...prev, provider: v }))}
          options={PROVIDERS.map((p) => ({ value: p, label: p }))}
          placeholder="選擇…"
          disabled={!!initial?.provider}
          triggerClassName="py-1.5"
        />
      </div>
      {textField('model_name', 'Model Name', !!initial?.model_name)}
      {textField('display_name', 'Display Name')}
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Is Active</span>
        <div className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={form.is_active}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: !!checked }))}
          />
          啟用
        </div>
      </div>
      {textField('input_cost_per_1m', 'Input Cost / 1M tokens')}
      {textField('output_cost_per_1m', 'Output Cost / 1M tokens')}
      {textField('cached_input_cost_per_1m', 'Cached Input Cost / 1M tokens')}
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Notes</span>
        <Textarea
          rows={3}
          className="resize-none"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          取消
        </Button>
        <Button
          type="button"
          onClick={() =>
            onSubmit({
              provider: form.provider,
              model_name: form.model_name,
              display_name: form.display_name || undefined,
              is_active: form.is_active,
              input_cost_per_1m: form.input_cost_per_1m,
              output_cost_per_1m: form.output_cost_per_1m,
              cached_input_cost_per_1m: form.cached_input_cost_per_1m,
              notes: form.notes || undefined,
            })
          }
          disabled={isLoading || !form.provider || !form.model_name}
        >
          {isLoading ? '儲存中…' : '儲存'}
        </Button>
      </div>
    </div>
  )
}

export function ModelManagementPage() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<LLMModel | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [syncResults, setSyncResults] = useState<
    Record<string, ModelSyncResult & { loading?: boolean }>
  >({})
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [collapsedProviders, setCollapsedProviders] = useState<Set<string>>(new Set())
  const [collapsedInitialized, setCollapsedInitialized] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['llm-models'],
    queryFn: () => listLLMModels().then((r) => r.data.data),
  })

  // Initialize collapsed state once when data loads
  useEffect(() => {
    if (!data || collapsedInitialized) return
    const initial = new Set<string>()
    const ag = data.reduce<Record<string, LLMModel[]>>((acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = []
      acc[m.provider].push(m)
      return acc
    }, {})
    Object.entries(ag).forEach(([provider, models]) => {
      if (models.every((m) => !m.is_active)) initial.add(provider)
    })
    setCollapsedProviders(initial)
    setCollapsedInitialized(true)
  }, [data, collapsedInitialized])

  const createMutation = useMutation({
    mutationFn: createLLMModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-models'] })
      setShowCreateModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LLMModelCreate> }) =>
      updateLLMModel(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['llm-models'] })
      setSelected(res.data.data)
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLLMModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-models'] })
      setSelected(null)
      setDeleteConfirm(false)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateLLMModel(id, { is_active }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['llm-models'] })
      if (selected?.id === res.data.data?.id) setSelected(res.data.data)
    },
  })

  // Keep `selected` in sync with fresh list data after any query refetch
  useEffect(() => {
    if (!data || !selected) return
    const fresh = data.find((m) => m.id === selected.id)
    if (fresh && fresh !== selected) setSelected(fresh)
  }, [data, selected])

  const handleSync = async (provider: string) => {
    setSyncResults((prev) => ({
      ...prev,
      [provider]: { provider, added: 0, existing: 0, loading: true },
    }))
    try {
      const res = await syncProviderModels(provider)
      const result = res.data.data
      setSyncResults((prev) => ({ ...prev, [provider]: result }))
      queryClient.invalidateQueries({ queryKey: ['llm-models'] })
    } catch {
      setSyncResults((prev) => ({ ...prev, [provider]: { provider, added: -1, existing: 0 } }))
    }
  }

  // 1. Apply activeOnly filter
  const afterActiveFilter = (data ?? []).filter((m) => (activeOnly ? m.is_active : true))

  // 2. Apply search filter
  const q = searchQuery.trim().toLowerCase()
  const afterSearch = q
    ? afterActiveFilter.filter(
        (m) =>
          m.model_name.toLowerCase().includes(q) ||
          (m.display_name ?? '').toLowerCase().includes(q),
      )
    : afterActiveFilter

  // 3. Group by provider
  const grouped = afterSearch.reduce<Record<string, LLMModel[]>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = []
    acc[m.provider].push(m)
    return acc
  }, {})

  // 4. Compute initial collapsed state (providers where ALL models are inactive)
  //    We use the full data (no filters) to determine if a provider has any active model.
  const allGrouped = (data ?? []).reduce<Record<string, LLMModel[]>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = []
    acc[m.provider].push(m)
    return acc
  }, {})

  const toggleCollapse = (provider: string) => {
    setCollapsedProviders((prev) => {
      const next = new Set(prev)
      if (next.has(provider)) next.delete(provider)
      else next.add(provider)
      return next
    })
  }

  const isCollapsed = (provider: string): boolean => {
    if (q) return false // searching → all matching groups expanded
    return collapsedProviders.has(provider)
  }

  const costFields = [
    { key: 'input_cost_per_1m', label: 'Input Cost / 1M tokens' },
    { key: 'output_cost_per_1m', label: 'Output Cost / 1M tokens' },
    { key: 'cached_input_cost_per_1m', label: 'Cached Input Cost / 1M tokens' },
  ] as const

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      {/* 左側列表 */}
      <div className="admin-panel-card p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h1 className="heading-sm">LLM Models</h1>
          <Button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="text-xs px-3 py-1.5 h-auto"
          >
            + 新增模型
          </Button>
        </div>

        {/* Search + Active-only filter */}
        <div className="space-y-2">
          <Input
            placeholder="搜尋模型…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox
              checked={activeOnly}
              onCheckedChange={(checked) => setActiveOnly(!!checked)}
            />
            <span className="text-muted-foreground">只顯示啟用</span>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-muted-foreground">找不到符合的模型</p>
        ) : (
          Object.entries(grouped).map(([provider, models]) => {
            const providerAll = allGrouped[provider] ?? []
            const activeCount = providerAll.filter((m) => m.is_active).length
            const totalCount = providerAll.length
            const collapsed = isCollapsed(provider)

            return (
              <div key={provider} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => toggleCollapse(provider)}
                    className="h-auto px-0 py-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    <span>{collapsed ? '▶' : '▼'}</span>
                    <span>{provider}</span>
                    <span className="normal-case font-normal text-muted-foreground/70">
                      ({activeCount} / {totalCount} active)
                    </span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {syncResults[provider] && !syncResults[provider].loading && (
                      <span className="text-xs text-muted-foreground">
                        {syncResults[provider].added >= 0
                          ? `+${syncResults[provider].added} / ${syncResults[provider].existing} 已存在`
                          : '同步失敗'}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-7 px-0 py-0 text-xs disabled:opacity-50"
                      onClick={() => handleSync(provider)}
                      disabled={syncResults[provider]?.loading}
                    >
                      {syncResults[provider]?.loading ? '同步中…' : '同步'}
                    </Button>
                  </div>
                </div>
                {!collapsed &&
                  models.map((m) => (
                    <Button
                      type="button"
                      key={m.id}
                      variant="ghost"
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selected?.id === m.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent'
                      }`}
                      onClick={() => {
                        setSelected(m)
                        setIsEditing(false)
                        setDeleteConfirm(false)
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium truncate">
                          {m.display_name ?? m.model_name}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          aria-label={m.is_active ? '停用此模型' : '啟用此模型'}
                          disabled={toggleActiveMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleActiveMutation.mutate({ id: m.id, is_active: !m.is_active })
                          }}
                          className={cn(
                            'ml-1 shrink-0 h-auto px-2 py-0 text-xs font-medium',
                            m.is_active
                              ? 'border-success/20 bg-success/15 text-success hover:bg-success/20'
                              : 'border-muted bg-muted/40 text-muted-foreground hover:bg-muted',
                          )}
                        >
                          {m.is_active ? 'active' : 'inactive'}
                        </Button>
                      </div>
                      {m.display_name && (
                        <div className="mt-0.5 text-xs text-muted-foreground truncate">
                          {m.model_name}
                        </div>
                      )}
                    </Button>
                  ))}
              </div>
            )
          })
        )}
      </div>

      {/* 右側詳情 */}
      {selected && (
        <div className="space-y-4 overflow-y-auto">
          {isEditing ? (
            <div className="admin-panel-card p-5">
              <h2 className="heading-sm mb-4">編輯模型</h2>
              <ModelForm
                initial={{
                  provider: selected.provider,
                  model_name: selected.model_name,
                  display_name: selected.display_name ?? undefined,
                  is_active: selected.is_active,
                  input_cost_per_1m: selected.input_cost_per_1m,
                  output_cost_per_1m: selected.output_cost_per_1m,
                  cached_input_cost_per_1m: selected.cached_input_cost_per_1m,
                  notes: selected.notes ?? undefined,
                }}
                isLoading={updateMutation.isPending}
                onCancel={() => setIsEditing(false)}
                onSubmit={(formData) =>
                  updateMutation.mutate({
                    id: selected.id,
                    data: {
                      display_name: formData.display_name,
                      is_active: formData.is_active,
                      input_cost_per_1m: formData.input_cost_per_1m,
                      output_cost_per_1m: formData.output_cost_per_1m,
                      cached_input_cost_per_1m: formData.cached_input_cost_per_1m,
                      notes: formData.notes,
                    },
                  })
                }
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h2 className="heading-sm">{selected.display_name ?? selected.model_name}</h2>
                <Badge variant={selected.is_active ? 'success' : 'default'}>
                  {selected.is_active ? 'active' : 'inactive'}
                </Badge>
                <div className="ml-auto flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                    編輯
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    刪除
                  </Button>
                </div>
              </div>

              {deleteConfirm && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm text-destructive">
                    確定刪除 <strong>{selected.model_name}</strong>？此操作無法復原。
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(selected.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? '刪除中…' : '確認刪除'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setDeleteConfirm(false)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}

              <section className="admin-card-soft p-4 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">基本資訊</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Provider</dt>
                    <dd>
                      <Badge variant="primary" className="text-sm">
                        {selected.provider}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Model Name</dt>
                    <dd className="font-mono text-foreground">{selected.model_name}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground mb-0.5">Display Name</dt>
                    <dd className="text-foreground">{selected.display_name ?? '—'}</dd>
                  </div>
                </dl>
              </section>

              <section className="admin-card-soft p-4 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  費率（USD per 1M tokens）
                </h3>
                <dl className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  {costFields.map(({ key, label }) => (
                    <div key={key}>
                      <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
                      <dd className="font-mono text-foreground">${selected[key]}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="admin-card-soft p-4 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">其他</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Notes</dt>
                    <dd className="whitespace-pre-wrap text-foreground">{selected.notes || '—'}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6">
                    <div>
                      <dt className="text-xs text-muted-foreground mb-0.5">建立時間</dt>
                      <dd className="text-foreground">
                        {new Date(selected.created_at).toLocaleString('zh-TW')}
                      </dd>
                    </div>
                    {selected.updated_at && (
                      <div>
                        <dt className="text-xs text-muted-foreground mb-0.5">更新時間</dt>
                        <dd className="text-foreground">
                          {new Date(selected.updated_at).toLocaleString('zh-TW')}
                        </dd>
                      </div>
                    )}
                  </div>
                </dl>
              </section>
            </>
          )}
        </div>
      )}

      {!selected && (
        <div className="admin-panel-card p-5 text-sm text-muted-foreground">
          請從左側選取模型，或點擊「新增模型」建立新項目。
        </div>
      )}

      {/* 新增 Modal */}
      {showCreateModal &&
        createPortal(
          <div className="admin-modal-overlay">
            <div className="admin-modal-panel overflow-y-auto max-h-[90vh] p-6">
              <h2 className="heading-sm">新增模型</h2>
              <ModelForm
                isLoading={createMutation.isPending}
                onCancel={() => setShowCreateModal(false)}
                onSubmit={(data) => createMutation.mutate(data)}
              />
              {createMutation.isError && (
                <p className="text-xs text-destructive">
                  新增失敗，請確認 provider/model_name 是否重複
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
