import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  activateFeedRankingConfig,
  createFeedRankingConfig,
  deleteFeedRankingConfig,
  listFeedRankingConfigs,
  updateFeedRankingConfig,
} from '@/api/admin-ai'
import type {
  FeedRankingConfig,
  FeedRankingConfigCreate,
  FeedRankingConfigUpdate,
} from '@/api/types'
import {
  FeedRankingPreview,
  type PreviewWeights,
  SIGNAL_COLORS,
} from '@/components/FeedRankingPreview'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const EMPTY_FORM: FeedRankingConfigCreate = {
  name: '',
  w_social: 0.35,
  w_engagement: 0.3,
  w_content: 0.15,
  w_decay: 0.2,
  w_freshness: 0.3,
  freshness_window_hours: 72,
  w_featured: 0.5,
  is_active: false,
  notes: null,
}

const WEIGHT_FIELDS: {
  key: 'w_social' | 'w_engagement' | 'w_content' | 'w_decay' | 'w_freshness' | 'w_featured'
  label: string
  hint: string
}[] = [
  { key: 'w_social', label: '社群親密度', hint: 'connection / follow / 互動次數' },
  { key: 'w_engagement', label: '互動熱度', hint: '(reaction + comment×2) / 天數' },
  { key: 'w_content', label: '內容完整度', hint: '圖片、長文字、進度等' },
  { key: 'w_decay', label: '時間衰退', hint: '越舊分數越低' },
  { key: 'w_freshness', label: '新內容加分', hint: '視窗內線性遞減，獎勵新發布內容' },
  { key: 'w_featured', label: '精選加分', hint: '內容分析頁標記的精選實踐加分' },
]

// 程式碼預設值（無 active 設定時 feed 實際使用的權重）
const DEFAULT_PREVIEW: PreviewWeights = {
  w_social: 0.35,
  w_engagement: 0.3,
  w_content: 0.15,
  w_decay: 0.2,
  w_freshness: 0.3,
  freshness_window_hours: 72,
  w_featured: 0.5,
}

const formToPreview = (v: FeedRankingConfigCreate | FeedRankingConfigUpdate): PreviewWeights => ({
  w_social: v.w_social ?? DEFAULT_PREVIEW.w_social,
  w_engagement: v.w_engagement ?? DEFAULT_PREVIEW.w_engagement,
  w_content: v.w_content ?? DEFAULT_PREVIEW.w_content,
  w_decay: v.w_decay ?? DEFAULT_PREVIEW.w_decay,
  w_freshness: v.w_freshness ?? DEFAULT_PREVIEW.w_freshness,
  freshness_window_hours: v.freshness_window_hours ?? DEFAULT_PREVIEW.freshness_window_hours,
  w_featured: v.w_featured ?? DEFAULT_PREVIEW.w_featured,
})

const configToPreview = (c: FeedRankingConfig): PreviewWeights => ({
  w_social: Number(c.w_social),
  w_engagement: Number(c.w_engagement),
  w_content: Number(c.w_content),
  w_decay: Number(c.w_decay),
  w_freshness: Number(c.w_freshness),
  freshness_window_hours: c.freshness_window_hours,
  w_featured: Number(c.w_featured),
})

function SignalDot({ signalKey }: { signalKey: string }) {
  return (
    <span
      className="mr-1.5 inline-block h-2 w-2 rounded-sm align-baseline"
      style={{ backgroundColor: SIGNAL_COLORS[signalKey] }}
    />
  )
}

function WeightBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs bg-muted text-muted-foreground">
      {label}={value}
    </span>
  )
}

export function FeedRankingConfigsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<FeedRankingConfigCreate>(EMPTY_FORM)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<FeedRankingConfig | null>(null)
  const [editForm, setEditForm] = useState<FeedRankingConfigUpdate>({})
  const [editError, setEditError] = useState<string | null>(null)
  const [confirmActivateId, setConfirmActivateId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['feed-ranking-configs'],
    queryFn: () => listFeedRankingConfigs().then((r) => r.data.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['feed-ranking-configs'] })

  const createMut = useMutation({
    mutationFn: createFeedRankingConfig,
    onSuccess: () => {
      invalidate()
      setShowCreate(false)
      setForm(EMPTY_FORM)
      setCreateError(null)
    },
    onError: (e: Error) => setCreateError(e.message ?? '建立失敗'),
  })

  const activateMut = useMutation({
    mutationFn: activateFeedRankingConfig,
    onSuccess: () => {
      invalidate()
      setConfirmActivateId(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteFeedRankingConfig,
    onSuccess: () => {
      invalidate()
      setConfirmDeleteId(null)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data: body }: { id: number; data: FeedRankingConfigUpdate }) =>
      updateFeedRankingConfig(id, body),
    onSuccess: () => {
      invalidate()
      setEditingConfig(null)
      setEditError(null)
    },
    onError: (e: Error) => setEditError(e.message ?? '更新失敗'),
  })

  const openEdit = (cfg: FeedRankingConfig) => {
    setEditingConfig(cfg)
    setEditError(null)
    setEditForm({
      name: cfg.name,
      w_social: Number(cfg.w_social),
      w_engagement: Number(cfg.w_engagement),
      w_content: Number(cfg.w_content),
      w_decay: Number(cfg.w_decay),
      w_freshness: Number(cfg.w_freshness),
      freshness_window_hours: cfg.freshness_window_hours,
      w_featured: Number(cfg.w_featured),
      notes: cfg.notes,
    })
  }

  const setField = <K extends keyof FeedRankingConfigCreate>(
    key: K,
    value: FeedRankingConfigCreate[K],
  ) => setForm((f) => ({ ...f, [key]: value }))

  const setEditField = <K extends keyof FeedRankingConfigUpdate>(
    key: K,
    value: FeedRankingConfigUpdate[K],
  ) => setEditForm((f) => ({ ...f, [key]: value }))

  const handleCreate = () => {
    if (!form.name.trim()) {
      setCreateError('設定名稱為必填')
      return
    }
    setCreateError(null)
    createMut.mutate(form)
  }

  const activeConfig = data.find((c) => c.is_active) ?? null

  return (
    <div className="space-y-4">
      <PageHeader
        title="Feed 演算法"
        description="調整 Feed 排序各訊號權重。「新內容加分」讓剛發布的內容在視窗期內獲得額外分數，避免新內容被舊熱門內容壓住。"
        actions={
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
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">目前沒有設定，Feed 使用程式碼內建的預設權重</p>
      ) : (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>設定名稱</TableHead>
                <TableHead>權重</TableHead>
                <TableHead>新內容視窗</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>備註</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((cfg) => (
                <TableRow
                  key={cfg.id}
                  className={cfg.is_active ? 'bg-success/10' : 'hover:bg-accent/30'}
                >
                  <TableCell className="font-medium">{cfg.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <WeightBadge label="社群" value={cfg.w_social} />
                      <WeightBadge label="互動" value={cfg.w_engagement} />
                      <WeightBadge label="內容" value={cfg.w_content} />
                      <WeightBadge label="衰退" value={cfg.w_decay} />
                      <WeightBadge label="新內容" value={cfg.w_freshness} />
                      <WeightBadge label="精選" value={cfg.w_featured} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{cfg.freshness_window_hours} 小時</TableCell>
                  <TableCell>
                    {cfg.is_active ? (
                      <Badge variant="success" className="px-1.5">
                        active
                      </Badge>
                    ) : (
                      <Badge variant="default" className="px-1.5">
                        inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                    {cfg.notes ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="xs" variant="ghost" onClick={() => openEdit(cfg)}>
                        編輯
                      </Button>
                      {!cfg.is_active && (
                        <Button
                          type="button"
                          size="xs"
                          variant="secondary"
                          onClick={() => setConfirmActivateId(cfg.id)}
                          disabled={activateMut.isPending && activateMut.variables === cfg.id}
                        >
                          {activateMut.isPending && activateMut.variables === cfg.id
                            ? '啟用中…'
                            : '啟用'}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="xs"
                        variant="destructive"
                        onClick={cfg.is_active ? undefined : () => setConfirmDeleteId(cfg.id)}
                        disabled={
                          cfg.is_active || (deleteMut.isPending && deleteMut.variables === cfg.id)
                        }
                        title={cfg.is_active ? '無法刪除已啟用的設定' : '刪除'}
                      >
                        {deleteMut.isPending && deleteMut.variables === cfg.id ? '刪除中…' : '刪除'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Active config preview */}
      {!isLoading && (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold">目前生效設定的效果預覽</h2>
            {activeConfig ? (
              <>
                <Badge variant="success" className="px-1.5">
                  active
                </Badge>
                <span className="text-xs text-muted-foreground">{activeConfig.name}</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                （無 active 設定，使用程式碼內建預設權重）
              </span>
            )}
          </div>
          <FeedRankingPreview
            weights={activeConfig ? configToPreview(activeConfig) : DEFAULT_PREVIEW}
            showSignalGuide
          />
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <span className="font-semibold text-sm">新增 Feed 演算法設定</span>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>
          <div className="px-5 py-4 overflow-y-auto flex-1">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="frc-name"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    設定名稱 *
                  </label>
                  <Input
                    id="frc-name"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="例：加強新內容曝光 v2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {WEIGHT_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label
                        htmlFor={`frc-${f.key}`}
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                        title={f.hint}
                      >
                        <SignalDot signalKey={f.key} />
                        {f.label}
                      </label>
                      <Input
                        id={`frc-${f.key}`}
                        type="number"
                        step="0.05"
                        min="0"
                        value={form[f.key] ?? ''}
                        onChange={(e) =>
                          setField(f.key, e.target.value ? Number(e.target.value) : 0)
                        }
                      />
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{f.hint}</p>
                    </div>
                  ))}
                  <div>
                    <label
                      htmlFor="frc-window"
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      <SignalDot signalKey="w_freshness" />
                      新內容視窗（小時）
                    </label>
                    <Input
                      id="frc-window"
                      type="number"
                      min="1"
                      max="720"
                      value={form.freshness_window_hours ?? ''}
                      onChange={(e) =>
                        setField(
                          'freshness_window_hours',
                          e.target.value ? Number(e.target.value) : 0,
                        )
                      }
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      發布超過此時數後不再獲得新內容加分
                    </p>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="frc-notes"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    備註
                  </label>
                  <Input
                    id="frc-notes"
                    value={form.notes ?? ''}
                    onChange={(e) => setField('notes', e.target.value || null)}
                    placeholder="選填"
                  />
                </div>
                {createError && <p className="text-xs text-destructive">{createError}</p>}
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <p className="mb-3 text-xs font-semibold">即時預覽（隨左側數值變化）</p>
                <FeedRankingPreview weights={formToPreview(form)} />
              </div>
            </div>
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

      {/* Edit dialog */}
      <Dialog
        open={editingConfig !== null}
        onOpenChange={(open) => {
          if (!open) setEditingConfig(null)
        }}
      >
        <DialogContent>
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <span className="font-semibold text-sm">編輯 Feed 演算法設定</span>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>
          <div className="px-5 py-4 overflow-y-auto flex-1">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="edit-frc-name"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    設定名稱 *
                  </label>
                  <Input
                    id="edit-frc-name"
                    value={editForm.name ?? ''}
                    onChange={(e) => setEditField('name', e.target.value)}
                    placeholder="設定名稱"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {WEIGHT_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label
                        htmlFor={`edit-frc-${f.key}`}
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                        title={f.hint}
                      >
                        <SignalDot signalKey={f.key} />
                        {f.label}
                      </label>
                      <Input
                        id={`edit-frc-${f.key}`}
                        type="number"
                        step="0.05"
                        min="0"
                        value={editForm[f.key] ?? ''}
                        onChange={(e) =>
                          setEditField(f.key, e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{f.hint}</p>
                    </div>
                  ))}
                  <div>
                    <label
                      htmlFor="edit-frc-window"
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      <SignalDot signalKey="w_freshness" />
                      新內容視窗（小時）
                    </label>
                    <Input
                      id="edit-frc-window"
                      type="number"
                      min="1"
                      max="720"
                      value={editForm.freshness_window_hours ?? ''}
                      onChange={(e) =>
                        setEditField(
                          'freshness_window_hours',
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="edit-frc-notes"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    備註
                  </label>
                  <Input
                    id="edit-frc-notes"
                    value={editForm.notes ?? ''}
                    onChange={(e) => setEditField('notes', e.target.value || null)}
                    placeholder="選填"
                  />
                </div>
                {editError && <p className="text-xs text-destructive">{editError}</p>}
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <p className="mb-3 text-xs font-semibold">即時預覽（隨左側數值變化）</p>
                <FeedRankingPreview weights={formToPreview(editForm)} />
              </div>
            </div>
          </div>
          <div className="border-t border-border px-5 py-3 flex gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => {
                if (!editForm.name?.trim()) {
                  setEditError('設定名稱為必填')
                  return
                }
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
            確定要啟用此設定？其他設定將會被停用，Feed 排序會在快取過期後（約 2 分鐘）套用新權重。
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
