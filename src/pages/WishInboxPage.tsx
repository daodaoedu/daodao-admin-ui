import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { archiveWish, linkWish, listRoadmapItems, listWishes, promoteWish } from '@/api/admin'
import type { AdminWishItem, RoadmapStatus, WishCategory, WishStatus } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  ROADMAP_STATUS_OPTIONS,
  WISH_STATUS_LABELS,
  WISH_STATUS_OPTIONS,
} from '@/constants/wishpool'

const LIMIT = 30

interface Filters {
  status?: WishStatus
  category?: WishCategory
  q?: string
}

type ActionMode = 'link' | 'promote' | null

function statusBadgeVariant(status: WishStatus): 'warning' | 'success' | 'default' {
  if (status === 'pending') return 'warning'
  if (status === 'linked') return 'success'
  return 'default'
}

export function WishInboxPage() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState<Filters>({ status: 'pending' })
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wishes', filters],
    queryFn: () => listWishes({ ...filters, limit: LIMIT }).then((r) => r.data),
  })

  // 游標載入更多（於第一頁之後追加）
  const [extraPages, setExtraPages] = useState<AdminWishItem[][]>([])
  const [moreCursor, setMoreCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // 篩選變更時重置追加頁
  // biome-ignore lint/correctness/useExhaustiveDependencies: filters 作為重置觸發
  useEffect(() => {
    setExtraPages([])
    setMoreCursor(null)
  }, [filters])

  const page1 = data?.data ?? []
  const seenIds = new Set<number>()
  const wishes = [...page1, ...extraPages.flat()].filter((w) => {
    if (seenIds.has(w.id)) return false
    seenIds.add(w.id)
    return true
  })
  const effectiveCursor =
    extraPages.length === 0 ? (data?.pagination?.nextCursor ?? null) : moreCursor

  const invalidate = () => {
    setExtraPages([])
    setMoreCursor(null)
    qc.invalidateQueries({ queryKey: ['admin-wishes'] })
  }

  const loadMore = async () => {
    if (!effectiveCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await listWishes({ ...filters, limit: LIMIT, cursor: effectiveCursor })
      setExtraPages((p) => [...p, res.data.data])
      setMoreCursor(res.data.pagination?.nextCursor ?? null)
    } finally {
      setLoadingMore(false)
    }
  }

  // ── 動作 dialog ──────────────────────────────────────────
  const [actionWish, setActionWish] = useState<AdminWishItem | null>(null)
  const [mode, setMode] = useState<ActionMode>(null)

  const [linkForm, setLinkForm] = useState<{
    roadmap_item_id: string
    internal_module_tag: string
  }>({ roadmap_item_id: '', internal_module_tag: '' })
  const [promoteForm, setPromoteForm] = useState<{
    title: string
    description: string
    category: WishCategory
    status: RoadmapStatus
    internal_module_tag: string
  }>({
    title: '',
    description: '',
    category: 'operation',
    status: 'collected',
    internal_module_tag: '',
  })

  // 歸併 dialog 需要既有項目清單
  const { data: itemsData } = useQuery({
    queryKey: ['admin-roadmap-items-for-link'],
    queryFn: () => listRoadmapItems({ limit: 100 }).then((r) => r.data),
    enabled: mode === 'link',
  })
  const itemOptions = (itemsData?.data ?? []).map((it) => ({
    value: String(it.id),
    label: `${it.title}（${it.support_count} 票）`,
  }))

  const openLink = (wish: AdminWishItem) => {
    setActionWish(wish)
    setLinkForm({ roadmap_item_id: '', internal_module_tag: '' })
    setMode('link')
  }

  const openPromote = (wish: AdminWishItem) => {
    setActionWish(wish)
    setPromoteForm({
      title: '',
      description: wish.desire,
      category: wish.category,
      status: 'collected',
      internal_module_tag: '',
    })
    setMode('promote')
  }

  const closeDialog = () => {
    setMode(null)
    setActionWish(null)
  }

  const isOther = actionWish?.category === 'other'

  const linkMut = useMutation({
    mutationFn: () =>
      linkWish(actionWish?.id ?? 0, {
        roadmap_item_id: Number(linkForm.roadmap_item_id),
        internal_module_tag: linkForm.internal_module_tag || undefined,
      }),
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
  })

  const promoteMut = useMutation({
    mutationFn: () =>
      promoteWish(actionWish?.id ?? 0, {
        title: promoteForm.title,
        description: promoteForm.description,
        category: promoteForm.category,
        status: promoteForm.status,
        internal_module_tag: promoteForm.internal_module_tag || undefined,
      }),
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
  })

  const archiveMut = useMutation({
    mutationFn: (id: number) => archiveWish(id),
    onSuccess: invalidate,
  })

  const handleArchive = (wish: AdminWishItem) => {
    if (window.confirm(`確定封存此許願？（保留原文）\n\n${wish.situation}`)) {
      archiveMut.mutate(wish.id)
    }
  }

  const linkValid =
    linkForm.roadmap_item_id !== '' && (!isOther || linkForm.internal_module_tag.trim() !== '')
  const promoteValid =
    promoteForm.title.trim() !== '' &&
    promoteForm.description.trim() !== '' &&
    (!isOther || promoteForm.internal_module_tag.trim() !== '')

  return (
    <div className="space-y-4">
      <h1 className="heading-lg">許願收件匣</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Select
            value={filters.status ?? ''}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, status: (v || undefined) as WishStatus | undefined }))
            }
            options={[{ value: '', label: '全部狀態' }, ...WISH_STATUS_OPTIONS]}
            placeholder="狀態"
          />
        </div>
        <div className="w-40">
          <Select
            value={filters.category ?? ''}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, category: (v || undefined) as WishCategory | undefined }))
            }
            options={[{ value: '', label: '全部分類' }, ...CATEGORY_OPTIONS]}
            placeholder="分類"
          />
        </div>
        <Input
          placeholder="搜尋情境 / 期待"
          aria-label="搜尋關鍵字"
          className="w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setFilters((f) => ({ ...f, q: search || undefined }))
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setFilters((f) => ({ ...f, q: search || undefined }))}
        >
          搜尋
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : wishes.length === 0 ? (
          <p className="text-sm text-muted-foreground">無符合的許願</p>
        ) : (
          wishes.map((wish) => (
            <div key={wish.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">{CATEGORY_LABELS[wish.category]}</Badge>
                <Badge variant={statusBadgeVariant(wish.status)}>
                  {WISH_STATUS_LABELS[wish.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">來源：{wish.source}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {format(new Date(wish.created_at), 'yyyy-MM-dd HH:mm')}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">情境：</span>
                  {wish.situation}
                </p>
                <p>
                  <span className="text-muted-foreground">期待：</span>
                  {wish.desire}
                </p>
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>許願者：{wish.submitter.nickname ?? '-'}</span>
                <span>聯絡：{wish.contact_email ?? wish.submitter.email ?? '-'}</span>
                {wish.internal_module_tag && <span>模組：{wish.internal_module_tag}</span>}
              </div>

              {wish.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="xs" onClick={() => openLink(wish)}>
                    歸入現有項目
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    onClick={() => openPromote(wish)}
                  >
                    促成新項目
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="destructive"
                    onClick={() => handleArchive(wish)}
                  >
                    封存
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
        {effectiveCursor && (
          <div className="text-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore ? '載入中...' : '載入更多'}
            </Button>
          </div>
        )}
      </div>

      {/* Action dialog */}
      <Dialog open={mode !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="h-auto max-h-[85vh] max-w-lg overflow-y-auto p-6">
          {mode === 'link' && actionWish && (
            <div className="space-y-4">
              <h2 className="heading-sm">歸入現有路線圖項目</h2>
              <div>
                <label htmlFor="link-item" className="mb-1 block text-sm font-medium">
                  選擇項目
                </label>
                <Select
                  id="link-item"
                  value={linkForm.roadmap_item_id}
                  onValueChange={(v) => setLinkForm((f) => ({ ...f, roadmap_item_id: v }))}
                  options={itemOptions}
                  placeholder="選擇要歸入的項目"
                />
              </div>
              {isOther && (
                <div>
                  <label htmlFor="link-tag" className="mb-1 block text-sm font-medium">
                    內部模組子標籤（其他分類必填）
                  </label>
                  <Input
                    id="link-tag"
                    value={linkForm.internal_module_tag}
                    onChange={(e) =>
                      setLinkForm((f) => ({ ...f, internal_module_tag: e.target.value }))
                    }
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  取消
                </Button>
                <Button
                  type="button"
                  disabled={!linkValid || linkMut.isPending}
                  onClick={() => linkMut.mutate()}
                >
                  {linkMut.isPending ? '處理中…' : '確認歸併'}
                </Button>
              </div>
            </div>
          )}

          {mode === 'promote' && actionWish && (
            <div className="space-y-4">
              <h2 className="heading-sm">促成新路線圖項目</h2>
              <div>
                <label htmlFor="promote-title" className="mb-1 block text-sm font-medium">
                  對外標題
                </label>
                <Input
                  id="promote-title"
                  value={promoteForm.title}
                  onChange={(e) => setPromoteForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="promote-desc" className="mb-1 block text-sm font-medium">
                  對外描述
                </label>
                <Textarea
                  id="promote-desc"
                  rows={4}
                  value={promoteForm.description}
                  onChange={(e) => setPromoteForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="promote-category" className="mb-1 block text-sm font-medium">
                    分類
                  </label>
                  <Select
                    id="promote-category"
                    value={promoteForm.category}
                    onValueChange={(v) =>
                      setPromoteForm((f) => ({ ...f, category: v as WishCategory }))
                    }
                    options={CATEGORY_OPTIONS}
                  />
                </div>
                <div>
                  <label htmlFor="promote-status" className="mb-1 block text-sm font-medium">
                    初始狀態
                  </label>
                  <Select
                    id="promote-status"
                    value={promoteForm.status}
                    onValueChange={(v) =>
                      setPromoteForm((f) => ({ ...f, status: v as RoadmapStatus }))
                    }
                    options={ROADMAP_STATUS_OPTIONS}
                  />
                </div>
              </div>
              {isOther && (
                <div>
                  <label htmlFor="promote-tag" className="mb-1 block text-sm font-medium">
                    內部模組子標籤（其他分類必填）
                  </label>
                  <Input
                    id="promote-tag"
                    value={promoteForm.internal_module_tag}
                    onChange={(e) =>
                      setPromoteForm((f) => ({ ...f, internal_module_tag: e.target.value }))
                    }
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  取消
                </Button>
                <Button
                  type="button"
                  disabled={!promoteValid || promoteMut.isPending}
                  onClick={() => promoteMut.mutate()}
                >
                  {promoteMut.isPending ? '處理中…' : '建立並歸併'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
