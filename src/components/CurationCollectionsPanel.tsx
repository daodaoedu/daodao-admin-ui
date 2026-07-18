import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Folders, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  addCurationCollectionItem,
  type CurationCollectionDetail,
  createCurationCollection,
  deleteCurationCollection,
  getCurationCollection,
  listCurationCollections,
  removeCurationCollectionItem,
  reorderCurationCollectionItems,
  updateCurationCollection,
} from '@/api/admin-content'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface PracticeOption {
  id: number
  title: string
}

/**
 * 策展合輯管理：建立/編輯合輯、加入/移除/排序內容項目。
 * practiceOptions 來自內容分析頁的 performance items，供「加入內容」選單使用。
 */
export function CurationCollectionsPanel({
  practiceOptions,
}: {
  practiceOptions: PracticeOption[]
}) {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [addPracticeId, setAddPracticeId] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['admin', 'content', 'collections'],
    queryFn: () => listCurationCollections().then((r) => r.data.data),
  })

  const { data: detail } = useQuery({
    queryKey: ['admin', 'content', 'collections', selectedId],
    queryFn: () => getCurationCollection(selectedId as number).then((r) => r.data.data),
    enabled: selectedId !== null,
  })

  const invalidate = (id?: number | null) => {
    qc.invalidateQueries({ queryKey: ['admin', 'content', 'collections'] })
    if (id) qc.invalidateQueries({ queryKey: ['admin', 'content', 'collections', id] })
  }

  const applyDetail = (updated: CurationCollectionDetail) => {
    qc.setQueryData(['admin', 'content', 'collections', updated.id], updated)
    qc.invalidateQueries({ queryKey: ['admin', 'content', 'collections'] })
  }

  const createMut = useMutation({
    mutationFn: () =>
      createCurationCollection({ name: form.name, description: form.description || null }),
    onSuccess: (r) => {
      invalidate()
      setShowCreate(false)
      setForm({ name: '', description: '' })
      setFormError(null)
      setSelectedId(r.data.data.id)
    },
    onError: (e: Error) => setFormError(e.message ?? '建立失敗'),
  })

  const updateMut = useMutation({
    mutationFn: (id: number) =>
      updateCurationCollection(id, { name: form.name, description: form.description || null }),
    onSuccess: (r) => {
      applyDetail(r.data.data)
      setEditing(false)
      setFormError(null)
    },
    onError: (e: Error) => setFormError(e.message ?? '更新失敗'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCurationCollection(id),
    onSuccess: (_r, id) => {
      invalidate()
      setConfirmDeleteId(null)
      if (selectedId === id) setSelectedId(null)
    },
  })

  const addItemMut = useMutation({
    mutationFn: ({ id, practiceId }: { id: number; practiceId: number }) =>
      addCurationCollectionItem(id, practiceId),
    onSuccess: (r) => {
      applyDetail(r.data.data)
      setAddPracticeId('')
      setActionError(null)
    },
    onError: (e: Error) => setActionError(e.message ?? '加入失敗'),
  })

  const removeItemMut = useMutation({
    mutationFn: ({ id, itemId }: { id: number; itemId: number }) =>
      removeCurationCollectionItem(id, itemId),
    onSuccess: (r) => {
      applyDetail(r.data.data)
      setActionError(null)
    },
    onError: (e: Error) => setActionError(e.message ?? '移除失敗'),
  })

  const reorderMut = useMutation({
    mutationFn: ({ id, itemIds }: { id: number; itemIds: number[] }) =>
      reorderCurationCollectionItems(id, itemIds),
    onSuccess: (r) => {
      applyDetail(r.data.data)
      setActionError(null)
    },
    onError: (e: Error) => setActionError(e.message ?? '排序失敗'),
  })

  const moveItem = (index: number, dir: -1 | 1) => {
    if (!detail) return
    const ids = detail.items.map((i) => i.id)
    const target = index + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderMut.mutate({ id: detail.id, itemIds: ids })
  }

  const openCreate = () => {
    setForm({ name: '', description: '' })
    setFormError(null)
    setShowCreate(true)
  }

  const openEdit = () => {
    if (!detail) return
    setForm({ name: detail.name, description: detail.description ?? '' })
    setFormError(null)
    setEditing(true)
  }

  const inCollection = new Set(detail?.items.map((i) => i.practiceId) ?? [])
  const addOptions = practiceOptions
    .filter((p) => !inCollection.has(p.id))
    .map((p) => ({ value: String(p.id), label: p.title }))

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-[60ch]">
          將多個內容組成主題合輯。點選左側合輯可管理內容項目與排序。
        </p>
        <Button type="button" size="xs" className="px-3 shrink-0" onClick={openCreate}>
          + 建立合輯
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無合輯，點「建立合輯」開始第一個主題策展</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Collection list */}
          <div className="space-y-2">
            {collections.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setSelectedId(col.id)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-colors',
                  selectedId === col.id
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-[var(--admin-card-border)] bg-card/95 hover:bg-accent/30',
                )}
              >
                <div className="flex items-center gap-2">
                  <Folders className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-medium text-sm truncate">{col.name}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {col.description || '—'}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70 tabular-nums">
                  {col.itemCount} 個內容
                </p>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-4">
            {!detail ? (
              <p className="text-sm text-muted-foreground">選擇左側合輯以管理內容</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{detail.name}</h3>
                    <p className="text-xs text-muted-foreground">{detail.description || '—'}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button type="button" size="xs" variant="ghost" onClick={openEdit}>
                      編輯
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={() => setConfirmDeleteId(detail.id)}
                    >
                      刪除
                    </Button>
                  </div>
                </div>

                {/* Add item */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      id="collection-add-practice"
                      value={addPracticeId}
                      onValueChange={setAddPracticeId}
                      options={addOptions}
                      placeholder={addOptions.length ? '選擇要加入的內容…' : '沒有可加入的內容'}
                    />
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    className="px-3"
                    disabled={!addPracticeId || addItemMut.isPending}
                    onClick={() =>
                      addItemMut.mutate({ id: detail.id, practiceId: Number(addPracticeId) })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> 加入
                  </Button>
                </div>

                {actionError && <p className="text-xs text-destructive">{actionError}</p>}

                {/* Items */}
                {detail.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">合輯尚無內容</p>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {detail.items.map((item, index) => (
                      <li key={item.id} className="flex items-center gap-2 px-3 py-2">
                        <span className="w-6 shrink-0 text-xs text-muted-foreground tabular-nums">
                          {index + 1}.
                        </span>
                        <span className="flex-1 truncate text-sm">{item.title}</span>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          disabled={index === 0 || reorderMut.isPending}
                          onClick={() => moveItem(index, -1)}
                          aria-label="上移"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          disabled={index === detail.items.length - 1 || reorderMut.isPending}
                          onClick={() => moveItem(index, 1)}
                          aria-label="下移"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={removeItemMut.isPending}
                          onClick={() => removeItemMut.mutate({ id: detail.id, itemId: item.id })}
                          aria-label="移除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog
        open={showCreate || editing}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false)
            setEditing(false)
          }
        }}
      >
        <DialogContent className="h-auto max-w-md">
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <span className="font-semibold text-sm">{editing ? '編輯合輯' : '建立合輯'}</span>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label
                htmlFor="collection-name"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                合輯名稱 *
              </label>
              <Input
                id="collection-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例：新手入門精選"
              />
            </div>
            <div>
              <label
                htmlFor="collection-description"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                合輯描述
              </label>
              <Input
                id="collection-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="選填"
              />
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <div className="border-t border-border px-5 py-3 flex gap-2 shrink-0">
            <Button
              type="button"
              disabled={createMut.isPending || updateMut.isPending}
              onClick={() => {
                if (!form.name.trim()) {
                  setFormError('合輯名稱為必填')
                  return
                }
                if (editing && detail) updateMut.mutate(detail.id)
                else createMut.mutate()
              }}
            >
              {createMut.isPending || updateMut.isPending ? '儲存中…' : '儲存'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreate(false)
                setEditing(false)
              }}
            >
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
        <DialogContent className="h-auto max-w-md">
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <span className="font-semibold text-sm">確認刪除合輯</span>
            <DialogClose
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              aria-label="關閉"
            >
              ✕
            </DialogClose>
          </div>
          <div className="px-5 py-4 text-sm">
            確定要刪除此合輯？合輯內的項目關聯將一併移除（內容本身不受影響），此操作無法復原。
          </div>
          <div className="border-t border-border px-5 py-3 flex gap-2 shrink-0">
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (confirmDeleteId !== null) deleteMut.mutate(confirmDeleteId)
              }}
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
