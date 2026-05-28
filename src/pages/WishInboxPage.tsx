import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  archiveWish,
  linkWish,
  listAdminRoadmapItems,
  listAdminWishes,
  promoteWish,
} from '@/api/admin-roadmap'
import type { AdminRoadmapItem, AdminWishItem, WishCategory, WishStatus } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<WishCategory, string> = {
  operation: '營運',
  practice: '實踐',
  social: '社群',
  explore: '探索',
  challenge: '挑戰',
  ai: 'AI',
  profile: '個人檔案',
  other: '其他',
}

const STATUS_LABELS: Record<WishStatus, string> = {
  pending: '待處理',
  linked: '已連結',
  archived: '已封存',
}

const CATEGORY_CLASS: Record<WishCategory, string> = {
  operation: 'bg-warning/15 text-warning',
  practice: 'bg-success/15 text-success',
  social: 'bg-info/15 text-info',
  explore: 'bg-primary/15 text-primary',
  challenge: 'bg-destructive/15 text-destructive',
  ai: 'bg-warning/15 text-warning',
  profile: 'bg-info/15 text-info',
  other: 'bg-muted text-muted-foreground',
}

const STATUS_CLASS: Record<WishStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  linked: 'bg-info/15 text-info',
  archived: 'bg-muted text-muted-foreground',
}

const ROADMAP_STATUS_LABELS = {
  collected: '收集中',
  discussing: '討論中',
  planned: '已規劃',
  in_progress: '進行中',
  done: '已完成',
  parked: '暫停',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function WishInboxPage() {
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<WishStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<WishCategory | ''>('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedQ = useDebounce(searchInput, 300)

  const [cursors, setCursors] = useState<string[]>([])
  const [allWishes, setAllWishes] = useState<AdminWishItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const queryParams = useMemo(
    () => ({
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      q: debouncedQ || undefined,
      cursor: cursors[cursors.length - 1],
      limit: 20,
    }),
    [statusFilter, categoryFilter, debouncedQ, cursors],
  )

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wishes', queryParams],
    queryFn: () => listAdminWishes(queryParams).then((r) => r.data),
  })

  useEffect(() => {
    if (!data) return
    const items = data.data ?? []
    if (cursors.length === 0) {
      setAllWishes(items)
    } else {
      setAllWishes((prev) => {
        const ids = new Set(prev.map((w) => w.id))
        return [...prev, ...items.filter((w) => !ids.has(w.id))]
      })
    }
    setNextCursor(
      (data as { pagination?: { next_cursor?: string | null } }).pagination?.next_cursor ?? null,
    )
  }, [data, cursors.length])

  const resetFilters = () => {
    setCursors([])
    setAllWishes([])
    setNextCursor(null)
  }

  const pendingCount = allWishes.filter((w) => w.status === 'pending').length

  const [linkTarget, setLinkTarget] = useState<AdminWishItem | null>(null)
  const [linkRoadmapId, setLinkRoadmapId] = useState<string>('')
  const [linkModuleTag, setLinkModuleTag] = useState('')
  const [roadmapSearch, setRoadmapSearch] = useState('')

  const [promoteTarget, setPromoteTarget] = useState<AdminWishItem | null>(null)
  const [promoteTitle, setPromoteTitle] = useState('')
  const [promoteDesc, setPromoteDesc] = useState('')
  const [promoteCategory, setPromoteCategory] = useState<WishCategory>('other')
  const [promoteStatus, setPromoteStatus] = useState('collected')
  const [promoteModuleTag, setPromoteModuleTag] = useState('')

  const { data: roadmapData } = useQuery({
    queryKey: ['admin-roadmap-items-select'],
    queryFn: () => listAdminRoadmapItems({ limit: 100 }).then((r) => r.data),
    enabled: !!linkTarget,
  })
  const roadmapItems: AdminRoadmapItem[] = roadmapData?.data ?? []

  const filteredRoadmapItems = useMemo(() => {
    if (!roadmapSearch) return roadmapItems
    return roadmapItems.filter((item) =>
      item.title.toLowerCase().includes(roadmapSearch.toLowerCase()),
    )
  }, [roadmapItems, roadmapSearch])

  const linkMut = useMutation({
    mutationFn: ({
      id,
      roadmap_item_id,
      internal_module_tag,
    }: {
      id: number
      roadmap_item_id: number
      internal_module_tag?: string
    }) => linkWish(id, { roadmap_item_id, internal_module_tag: internal_module_tag || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-wishes'] })
      setLinkTarget(null)
      setLinkRoadmapId('')
      setLinkModuleTag('')
      setRoadmapSearch('')
      resetFilters()
    },
  })

  const promoteMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof promoteWish>[1] }) =>
      promoteWish(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-wishes'] })
      setPromoteTarget(null)
      resetFilters()
    },
  })

  const archiveMut = useMutation({
    mutationFn: (id: number) => archiveWish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-wishes'] })
      resetFilters()
    },
  })

  const openLink = (wish: AdminWishItem) => {
    setLinkTarget(wish)
    setLinkRoadmapId('')
    setLinkModuleTag('')
    setRoadmapSearch('')
  }

  const openPromote = (wish: AdminWishItem) => {
    setPromoteTarget(wish)
    setPromoteTitle(wish.desire.slice(0, 60))
    setPromoteDesc(`情境：${wish.situation}\n\n期望：${wish.desire}`)
    setPromoteCategory(wish.category)
    setPromoteStatus('collected')
    setPromoteModuleTag(wish.internal_module_tag ?? '')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading-lg">許願收件匣</h1>
        {allWishes.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">目前有 {pendingCount} 則待處理許願</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as WishStatus | '')
            resetFilters()
          }}
          options={[
            { value: '', label: '全部狀態' },
            { value: 'pending', label: '待處理' },
            { value: 'linked', label: '已連結' },
            { value: 'archived', label: '已封存' },
          ]}
          triggerClassName="admin-control"
        />

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value as WishCategory | '')
            resetFilters()
          }}
          options={[
            { value: '', label: '全部分類' },
            ...(Object.entries(CATEGORY_LABELS) as [WishCategory, string][]).map(
              ([val, label]) => ({
                value: val,
                label,
              }),
            ),
          ]}
          triggerClassName="admin-control"
        />

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋許願內容"
            className="w-60 pl-8"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              resetFilters()
            }}
          />
        </div>
      </div>

      {isLoading && allWishes.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <span>載入中...</span>
        </div>
      ) : allWishes.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <span>目前沒有許願</span>
        </div>
      ) : (
        <div className="space-y-3">
          {allWishes.map((wish) => (
            <div key={wish.id} className="admin-panel-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                      CATEGORY_CLASS[wish.category],
                    )}
                  >
                    {CATEGORY_LABELS[wish.category]}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                      STATUS_CLASS[wish.status],
                    )}
                  >
                    {STATUS_LABELS[wish.status]}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {wish.submitter_nickname ?? `#${wish.submitter_user_id}`}
                  {' · '}
                  {format(new Date(wish.created_at), 'yyyy/MM/dd HH:mm')}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">情境　</span>
                  <span>{wish.situation}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">期望　</span>
                  <span>{wish.desire}</span>
                </div>
                {wish.contact_email && (
                  <div>
                    <span className="font-medium text-muted-foreground">聯絡　</span>
                    <span className="text-xs text-muted-foreground">{wish.contact_email}</span>
                  </div>
                )}
                {wish.linked_roadmap_item_title && (
                  <div>
                    <span className="font-medium text-muted-foreground">路線圖　</span>
                    <Badge variant="primary">{wish.linked_roadmap_item_title}</Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                {wish.status === 'pending' && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => openLink(wish)}
                    >
                      連結
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => openPromote(wish)}
                    >
                      升級
                    </Button>
                  </>
                )}
                {(wish.status === 'pending' || wish.status === 'linked') && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    disabled={archiveMut.isPending}
                    onClick={() => {
                      if (window.confirm('確定要封存這則許願嗎？')) {
                        archiveMut.mutate(wish.id)
                      }
                    }}
                  >
                    封存
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={() => setCursors((prev) => [...prev, nextCursor])}
          >
            {isLoading ? '載入中...' : '載入更多'}
          </Button>
        </div>
      )}

      {linkTarget && (
        <div className="admin-modal-overlay p-4">
          <div className="admin-modal-panel w-full max-w-md p-6">
            <h3 className="mb-4 font-semibold">連結到路線圖項目</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="link-search" className="mb-1 block text-sm font-medium">
                  搜尋路線圖項目
                </label>
                <Input
                  id="link-search"
                  placeholder="輸入關鍵字篩選..."
                  value={roadmapSearch}
                  onChange={(e) => setRoadmapSearch(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="link-roadmap-select" className="mb-1 block text-sm font-medium">
                  選擇項目
                </label>
                <Select
                  id="link-roadmap-select"
                  value={linkRoadmapId}
                  onValueChange={(value) => setLinkRoadmapId(value)}
                  options={[
                    { value: '', label: '-- 請選擇 --' },
                    ...filteredRoadmapItems.map((item) => ({
                      value: String(item.id),
                      label: item.title,
                    })),
                  ]}
                  triggerClassName="w-full"
                />
              </div>
              <div>
                <label htmlFor="link-module-tag" className="mb-1 block text-sm font-medium">
                  模組標籤
                  {linkTarget.category === 'other' && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </label>
                <Input
                  id="link-module-tag"
                  placeholder="internal_module_tag（選填）"
                  value={linkModuleTag}
                  onChange={(e) => setLinkModuleTag(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setLinkTarget(null)}>
                取消
              </Button>
              <Button
                type="button"
                disabled={
                  !linkRoadmapId ||
                  (linkTarget.category === 'other' && !linkModuleTag) ||
                  linkMut.isPending
                }
                onClick={() => {
                  if (!linkRoadmapId) return
                  linkMut.mutate({
                    id: linkTarget.id,
                    roadmap_item_id: Number(linkRoadmapId),
                    internal_module_tag: linkModuleTag,
                  })
                }}
              >
                {linkMut.isPending ? '連結中...' : '確認連結'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {promoteTarget && (
        <div className="admin-modal-overlay p-4">
          <div className="admin-modal-panel w-full max-w-lg p-6">
            <h3 className="mb-4 font-semibold">升級為路線圖項目</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="promote-title" className="mb-1 block text-sm font-medium">
                  標題 <span className="text-destructive">*</span>
                </label>
                <Input
                  id="promote-title"
                  value={promoteTitle}
                  onChange={(e) => setPromoteTitle(e.target.value)}
                  placeholder="路線圖項目標題"
                />
              </div>
              <div>
                <label htmlFor="promote-desc" className="mb-1 block text-sm font-medium">
                  描述 <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="promote-desc"
                  rows={5}
                  value={promoteDesc}
                  onChange={(e) => setPromoteDesc(e.target.value)}
                  placeholder="詳細描述"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label htmlFor="promote-category" className="mb-1 block text-sm font-medium">
                    分類
                  </label>
                  <Select
                    id="promote-category"
                    value={promoteCategory}
                    onValueChange={(value) => setPromoteCategory(value as WishCategory)}
                    options={(Object.entries(CATEGORY_LABELS) as [WishCategory, string][]).map(
                      ([val, label]) => ({ value: val, label }),
                    )}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="promote-status" className="mb-1 block text-sm font-medium">
                    狀態
                  </label>
                  <Select
                    id="promote-status"
                    value={promoteStatus}
                    onValueChange={(value) => setPromoteStatus(value)}
                    options={(Object.entries(ROADMAP_STATUS_LABELS) as [string, string][]).map(
                      ([val, label]) => ({ value: val, label }),
                    )}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="promote-module-tag" className="mb-1 block text-sm font-medium">
                  模組標籤
                  {promoteCategory === 'other' && <span className="ml-1 text-destructive">*</span>}
                </label>
                <Input
                  id="promote-module-tag"
                  placeholder="internal_module_tag（選填）"
                  value={promoteModuleTag}
                  onChange={(e) => setPromoteModuleTag(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPromoteTarget(null)}>
                取消
              </Button>
              <Button
                type="button"
                disabled={
                  !promoteTitle ||
                  !promoteDesc ||
                  (promoteCategory === 'other' && !promoteModuleTag) ||
                  promoteMut.isPending
                }
                onClick={() => {
                  if (!promoteTitle || !promoteDesc) return
                  promoteMut.mutate({
                    id: promoteTarget.id,
                    payload: {
                      title: promoteTitle,
                      description: promoteDesc,
                      category: promoteCategory,
                      status: promoteStatus as Parameters<typeof promoteWish>[1]['status'],
                      internal_module_tag: promoteModuleTag || undefined,
                    },
                  })
                }}
              >
                {promoteMut.isPending ? '升級中...' : '確認升級'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
