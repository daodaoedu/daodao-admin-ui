import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  activateAIServiceConfig,
  createAIServiceConfig,
  deleteAIServiceConfig,
  listAIServiceConfigs,
  updateAIServiceConfig,
} from '@/api/admin-ai'
import type { AIServiceConfig, AIServiceConfigCreate, AIServiceConfigUpdate } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const EMPTY_FORM: AIServiceConfigCreate = {
  service: '',
  name: '',
  model_id: 0,
  system_prompt_id: null,
  max_tokens: null,
  temperature: null,
  top_p: null,
  top_k: null,
  is_active: false,
  notes: null,
}

function ParamBadge({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === undefined) return null
  return (
    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs bg-muted text-muted-foreground">
      {label}={value}
    </span>
  )
}

export function AIServiceConfigsPage() {
  const qc = useQueryClient()
  const [activeService, setActiveService] = useState<string>('全部')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<AIServiceConfigCreate>(EMPTY_FORM)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<AIServiceConfig | null>(null)
  const [editForm, setEditForm] = useState<AIServiceConfigUpdate>({})
  const [editError, setEditError] = useState<string | null>(null)
  const [confirmActivateId, setConfirmActivateId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['ai-service-configs'],
    queryFn: () => listAIServiceConfigs().then((r) => r.data.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ai-service-configs'] })

  const createMut = useMutation({
    mutationFn: createAIServiceConfig,
    onSuccess: () => {
      invalidate()
      setShowCreate(false)
      setForm(EMPTY_FORM)
      setCreateError(null)
    },
    onError: (e: Error) => {
      setCreateError(e.message ?? '建立失敗')
    },
  })

  const activateMut = useMutation({
    mutationFn: activateAIServiceConfig,
    onSuccess: () => {
      invalidate()
      setConfirmActivateId(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteAIServiceConfig,
    onSuccess: () => {
      invalidate()
      setConfirmDeleteId(null)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AIServiceConfigUpdate }) =>
      updateAIServiceConfig(id, data),
    onSuccess: () => {
      invalidate()
      setEditingConfig(null)
      setEditError(null)
    },
    onError: (e: Error) => setEditError(e.message ?? '更新失敗'),
  })

  const openEdit = (cfg: AIServiceConfig) => {
    setEditingConfig(cfg)
    setEditError(null)
    setEditForm({
      name: cfg.name,
      model_id: cfg.model_id,
      system_prompt_id: cfg.system_prompt_id,
      max_tokens: cfg.max_tokens,
      temperature: cfg.temperature !== null ? Number(cfg.temperature) : null,
      top_p: cfg.top_p !== null ? Number(cfg.top_p) : null,
      top_k: cfg.top_k,
      notes: cfg.notes,
    })
  }

  const setEditField = <K extends keyof AIServiceConfigUpdate>(
    key: K,
    value: AIServiceConfigUpdate[K],
  ) => setEditForm((f) => ({ ...f, [key]: value }))

  // Derive unique services from data
  const services = ['全部', ...Array.from(new Set(data.map((c) => c.service))).sort()]

  const filtered = activeService === '全部' ? data : data.filter((c) => c.service === activeService)

  const handleCreate = () => {
    if (!form.service.trim() || !form.name.trim() || !form.model_id) {
      setCreateError('service、name、model_id 為必填')
      return
    }
    setCreateError(null)
    createMut.mutate(form)
  }

  const setField = <K extends keyof AIServiceConfigCreate>(
    key: K,
    value: AIServiceConfigCreate[K],
  ) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">AI 服務設定</h1>
        <Button
          type="button"
          size="xs"
          onClick={() => {
            setForm(EMPTY_FORM)
            setCreateError(null)
            setShowCreate(true)
          }}
          className="px-3"
        >
          + 新增設定
        </Button>
      </div>

      {/* Service tab bar */}
      <div className="admin-segmented">
        {services.map((svc) => (
          <Button
            key={svc}
            type="button"
            onClick={() => setActiveService(svc)}
            className={`admin-segmented-item flex-1 justify-center ${
              activeService === svc
                ? 'admin-segmented-item-active'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {svc}
          </Button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">目前沒有設定</p>
      ) : (
        <div className="admin-panel-card overflow-hidden">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Service</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Model ID
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">參數</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">狀態</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">備註</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cfg) => (
                <ConfigRow
                  key={cfg.id}
                  cfg={cfg}
                  onEdit={() => openEdit(cfg)}
                  onActivate={() => setConfirmActivateId(cfg.id)}
                  onDelete={() => setConfirmDeleteId(cfg.id)}
                  isActivating={activateMut.isPending && activateMut.variables === cfg.id}
                  isDeleting={deleteMut.isPending && deleteMut.variables === cfg.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <span className="font-semibold text-sm">新增 AI 服務設定</span>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>
          <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="cfg-service"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  service *
                </label>
                <Input
                  id="cfg-service"
                  value={form.service}
                  onChange={(e) => setField('service', e.target.value)}
                  placeholder="insight"
                />
              </div>
              <div>
                <label
                  htmlFor="cfg-name"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  name *
                </label>
                <Input
                  id="cfg-name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="設定名稱"
                />
              </div>
              <div>
                <label
                  htmlFor="cfg-model-id"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  model_id *
                </label>
                <Input
                  id="cfg-model-id"
                  type="number"
                  value={form.model_id || ''}
                  onChange={(e) =>
                    setField('model_id', e.target.value ? Number(e.target.value) : 0)
                  }
                  placeholder="Model DB ID"
                />
              </div>
              <div>
                <label
                  htmlFor="cfg-prompt-id"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  system_prompt_id
                </label>
                <Input
                  id="cfg-prompt-id"
                  type="number"
                  value={form.system_prompt_id ?? ''}
                  onChange={(e) =>
                    setField('system_prompt_id', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
              <div>
                <label
                  htmlFor="cfg-max-tokens"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  max_tokens
                </label>
                <Input
                  id="cfg-max-tokens"
                  type="number"
                  value={form.max_tokens ?? ''}
                  onChange={(e) =>
                    setField('max_tokens', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
              <div>
                <label
                  htmlFor="cfg-temperature"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  temperature
                </label>
                <Input
                  id="cfg-temperature"
                  type="number"
                  step="0.1"
                  value={form.temperature ?? ''}
                  onChange={(e) =>
                    setField('temperature', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
              <div>
                <label
                  htmlFor="cfg-top-p"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  top_p
                </label>
                <Input
                  id="cfg-top-p"
                  type="number"
                  step="0.05"
                  value={form.top_p ?? ''}
                  onChange={(e) =>
                    setField('top_p', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
              <div>
                <label
                  htmlFor="cfg-top-k"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  top_k
                </label>
                <Input
                  id="cfg-top-k"
                  type="number"
                  value={form.top_k ?? ''}
                  onChange={(e) =>
                    setField('top_k', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="cfg-notes"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                notes
              </label>
              <Input
                id="cfg-notes"
                value={form.notes ?? ''}
                onChange={(e) => setField('notes', e.target.value || null)}
                placeholder="備註（選填）"
              />
            </div>
            {createError && <p className="text-xs text-destructive">{createError}</p>}
          </div>
          <div className="border-t border-border px-5 py-3 flex gap-2 shrink-0">
            <Button type="button" onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? '建立中…' : '建立'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activate confirm dialog */}
      <Dialog
        open={confirmActivateId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmActivateId(null)
        }}
      >
        <DialogContent>
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <span className="font-semibold text-sm">確認啟用</span>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>
          <div className="px-5 py-4 text-sm">
            確定要啟用此設定？同一 service 的其他設定將會被停用。
          </div>
          <div className="border-t border-border px-5 py-3 flex gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => {
                if (confirmActivateId !== null) activateMut.mutate(confirmActivateId)
              }}
              disabled={activateMut.isPending}
            >
              {activateMut.isPending ? '啟用中…' : '確認啟用'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmActivateId(null)}>
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editingConfig !== null}
        onOpenChange={(open) => {
          if (!open) setEditingConfig(null)
        }}
      >
        <DialogContent>
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <span className="font-semibold text-sm">編輯 AI 服務設定</span>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>
          <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label
                  htmlFor="edit-cfg-name"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  name *
                </label>
                <Input
                  id="edit-cfg-name"
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditField('name', e.target.value)}
                  placeholder="設定名稱"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-cfg-model-id"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  model_id *
                </label>
                <Input
                  id="edit-cfg-model-id"
                  type="number"
                  value={editForm.model_id ?? ''}
                  onChange={(e) =>
                    setEditField('model_id', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="Model DB ID"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-cfg-prompt-id"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  system_prompt_id
                </label>
                <Input
                  id="edit-cfg-prompt-id"
                  type="number"
                  value={editForm.system_prompt_id ?? ''}
                  onChange={(e) =>
                    setEditField('system_prompt_id', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-cfg-max-tokens"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  max_tokens
                </label>
                <Input
                  id="edit-cfg-max-tokens"
                  type="number"
                  value={editForm.max_tokens ?? ''}
                  onChange={(e) =>
                    setEditField('max_tokens', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-cfg-temperature"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  temperature
                </label>
                <Input
                  id="edit-cfg-temperature"
                  type="number"
                  step="0.1"
                  value={editForm.temperature ?? ''}
                  onChange={(e) =>
                    setEditField('temperature', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-cfg-top-p"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  top_p
                </label>
                <Input
                  id="edit-cfg-top-p"
                  type="number"
                  step="0.05"
                  value={editForm.top_p ?? ''}
                  onChange={(e) =>
                    setEditField('top_p', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-cfg-top-k"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  top_k
                </label>
                <Input
                  id="edit-cfg-top-k"
                  type="number"
                  value={editForm.top_k ?? ''}
                  onChange={(e) =>
                    setEditField('top_k', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="選填"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="edit-cfg-notes"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                notes
              </label>
              <Input
                id="edit-cfg-notes"
                value={editForm.notes ?? ''}
                onChange={(e) => setEditField('notes', e.target.value || null)}
                placeholder="備註（選填）"
              />
            </div>
            {editError && <p className="text-xs text-destructive">{editError}</p>}
          </div>
          <div className="border-t border-border px-5 py-3 flex gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => {
                if (editingConfig) updateMut.mutate({ id: editingConfig.id, data: editForm })
              }}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? '儲存中…' : '儲存'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditingConfig(null)}>
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
      >
        <DialogContent>
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <span className="font-semibold text-sm">確認刪除</span>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>
          <div className="px-5 py-4 text-sm">確定要刪除此設定？此操作無法復原。</div>
          <div className="border-t border-border px-5 py-3 flex gap-2 shrink-0">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId !== null) deleteMut.mutate(confirmDeleteId)
              }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? '刪除中…' : '確認刪除'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmDeleteId(null)}>
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ConfigRow({
  cfg,
  onEdit,
  onActivate,
  onDelete,
  isActivating,
  isDeleting,
}: {
  cfg: AIServiceConfig
  onEdit: () => void
  onActivate: () => void
  onDelete: () => void
  isActivating: boolean
  isDeleting: boolean
}) {
  return (
    <tr
      className={`admin-table-row ${cfg.is_active ? 'bg-success/10' : 'hover:bg-accent/30'} transition-colors`}
    >
      <td className="px-4 py-2.5 font-mono text-xs">{cfg.service}</td>
      <td className="px-4 py-2.5 font-medium">{cfg.name}</td>
      <td className="px-4 py-2.5 text-muted-foreground">{cfg.model_id}</td>
      <td className="px-4 py-2.5">
        <div className="flex flex-wrap gap-1">
          <ParamBadge label="max_tokens" value={cfg.max_tokens} />
          <ParamBadge label="temp" value={cfg.temperature} />
          <ParamBadge label="top_p" value={cfg.top_p} />
          <ParamBadge label="top_k" value={cfg.top_k} />
        </div>
      </td>
      <td className="px-4 py-2.5">
        {cfg.is_active ? (
          <Badge variant="success" className="px-1.5">
            active
          </Badge>
        ) : (
          <Badge variant="default" className="px-1.5">
            inactive
          </Badge>
        )}
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[120px] truncate">
        {cfg.notes ?? '—'}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Button type="button" size="xs" variant="ghost" onClick={onEdit}>
            編輯
          </Button>
          {!cfg.is_active && (
            <Button
              type="button"
              size="xs"
              variant="secondary"
              onClick={onActivate}
              disabled={isActivating}
            >
              {isActivating ? '啟用中…' : '啟用'}
            </Button>
          )}
          <Button
            type="button"
            size="xs"
            variant="destructive"
            onClick={cfg.is_active ? undefined : onDelete}
            disabled={cfg.is_active || isDeleting}
            title={cfg.is_active ? '無法刪除已啟用的設定' : '刪除'}
          >
            {isDeleting ? '刪除中…' : '刪除'}
          </Button>
        </div>
      </td>
    </tr>
  )
}
