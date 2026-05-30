import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Heart, Pin } from 'lucide-react'
import { useState } from 'react'
import {
  createRoadmapItem,
  getRoadmapReport,
  listAdminRoadmapItems,
  updateRoadmapItem,
} from '@/api/admin-roadmap'
import type {
  AdminRoadmapItem,
  CreateRoadmapItemPayload,
  RoadmapStatus,
  WishCategory,
} from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

const STATUS_LABELS: Record<RoadmapStatus, string> = {
  collected: '已收集',
  discussing: '討論中',
  planned: '已排程',
  in_progress: '進行中',
  done: '已完成',
  parked: '暫緩',
}

const STATUS_COLORS: Record<RoadmapStatus, string> = {
  collected: 'bg-muted text-muted-foreground',
  discussing: 'bg-warning/15 text-warning',
  planned: 'bg-info/15 text-info',
  in_progress: 'bg-warning/15 text-warning',
  done: 'bg-success/15 text-success',
  parked: 'bg-muted text-muted-foreground',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as WishCategory[]
const STATUSES = Object.keys(STATUS_LABELS) as RoadmapStatus[]

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))

const EMPTY_FORM: CreateRoadmapItemPayload = {
  title: '',
  description: '',
  category: 'other',
  status: 'collected',
  is_public: true,
  pinned: false,
  sort_order: 0,
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-panel-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold truncate">{value}</p>
    </div>
  )
}

export function RoadmapItemsPage() {
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<RoadmapStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<WishCategory | ''>('')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [allItems, setAllItems] = useState<AdminRoadmapItem[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminRoadmapItem | null>(null)
  const [form, setForm] = useState<CreateRoadmapItemPayload>(EMPTY_FORM)

  const { data: reportData } = useQuery({
    queryKey: ['admin-roadmap-report'],
    queryFn: () => getRoadmapReport({ range: 'month' }).then((r) => r.data.data),
  })

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['admin-roadmap-items', statusFilter, categoryFilter, cursor],
    queryFn: () =>
      listAdminRoadmapItems({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        cursor,
        limit: 20,
      }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const items = itemsData?.data ?? []
  const nextCursor = itemsData?.pagination?.nextCursor

  const mergedItems = cursor ? allItems : items

  const createMut = useMutation({
    mutationFn: (data: CreateRoadmapItemPayload) => createRoadmapItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-roadmap-items'] })
      closeDialog()
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateRoadmapItemPayload }) =>
      updateRoadmapItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-roadmap-items'] })
      closeDialog()
    },
  })

  function openCreate() {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(item: AdminRoadmapItem) {
    setEditingItem(item)
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      status: item.status,
      is_public: item.is_public,
      pinned: item.pinned,
      sort_order: item.sort_order,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingItem(null)
    setForm(EMPTY_FORM)
  }

  function handleSave() {
    if (!form.title.trim() || !form.description.trim()) return
    if (editingItem) {
      updateMut.mutate({ id: editingItem.id, data: form })
    } else {
      createMut.mutate(form)
    }
  }

  function handleLoadMore() {
    if (nextCursor) {
      setAllItems((prev) => [...prev, ...items])
      setCursor(nextCursor)
    }
  }

  function handleFilterChange(newStatus: RoadmapStatus | '', newCategory: WishCategory | '') {
    setStatusFilter(newStatus)
    setCategoryFilter(newCategory)
    setCursor(undefined)
    setAllItems([])
  }

  const topCategory = reportData?.popularCategories?.[0]
  const topItem = reportData?.popularItems?.[0]
  const pendingCount = reportData?.backlog?.pendingCount ?? 0
  const waitingHours = reportData?.backlog?.oldestPendingWaitingHours

  const displayItems = cursor ? [...mergedItems, ...items] : items

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="待處理許願" value={pendingCount} />
        <StatCard label="最久等待" value={waitingHours != null ? `${waitingHours} 小時` : '—'} />
        <StatCard
          label="熱門分類"
          value={
            topCategory
              ? (CATEGORY_LABELS[topCategory.category as WishCategory] ?? topCategory.category)
              : '—'
          }
        />
        <StatCard
          label="熱門項目"
          value={
            topItem
              ? topItem.title.length > 20
                ? `${topItem.title.slice(0, 20)}…`
                : topItem.title
              : '—'
          }
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="heading-lg">路線圖項目</h1>
          <Button type="button" onClick={openCreate}>
            + 新增項目
          </Button>
        </div>

        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              handleFilterChange(value as RoadmapStatus | '', categoryFilter)
            }
            options={[{ value: '', label: '全部狀態' }, ...STATUS_OPTIONS]}
            triggerClassName="admin-control"
          />
          <Select
            value={categoryFilter}
            onValueChange={(value) => handleFilterChange(statusFilter, value as WishCategory | '')}
            options={[{ value: '', label: '全部分類' }, ...CATEGORY_OPTIONS]}
            triggerClassName="admin-control"
          />
        </div>

        <div className="overflow-x-auto admin-panel-card">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                {['標題', '分類', '狀態', '支持數', '公開', '建立時間', '操作'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      載入中...
                    </div>
                  </td>
                </tr>
              ) : displayItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    目前沒有路線圖項目
                  </td>
                </tr>
              ) : (
                displayItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border transition-colors hover:bg-accent"
                  >
                    <td className="px-4 py-2 font-medium">
                      <div className="flex items-center gap-1">
                        {item.pinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />}
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="default">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          STATUS_COLORS[item.status],
                        )}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-3 w-3" />
                        <span>{item.support_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {item.is_public ? (
                        <span className="text-success font-medium">✓</span>
                      ) : (
                        <span className="text-destructive font-medium">✕</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'yyyy/MM/dd')}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => openEdit(item)}
                      >
                        編輯
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {nextCursor && (
          <div className="flex justify-center">
            <Button type="button" variant="secondary" onClick={handleLoadMore}>
              載入更多
            </Button>
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-panel w-full max-w-md p-6">
            <h3 className="mb-4 font-semibold">{editingItem ? '編輯項目' : '新增項目'}</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="ri-title" className="mb-1 block text-sm font-medium">
                  標題
                </label>
                <Input
                  id="ri-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="請輸入標題"
                />
              </div>
              <div>
                <label htmlFor="ri-description" className="mb-1 block text-sm font-medium">
                  描述
                </label>
                <Textarea
                  id="ri-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="請輸入描述"
                  rows={3}
                  className="w-full admin-control resize-none"
                />
              </div>
              <div>
                <label htmlFor="ri-category" className="mb-1 block text-sm font-medium">
                  分類
                </label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, category: value as WishCategory }))
                  }
                  options={CATEGORY_OPTIONS}
                />
              </div>
              <div>
                <label htmlFor="ri-status" className="mb-1 block text-sm font-medium">
                  狀態
                </label>
                <Select
                  id="ri-status"
                  value={form.status ?? ''}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, status: value as RoadmapStatus }))
                  }
                  options={STATUS_OPTIONS}
                />
              </div>
              <div className="flex items-center gap-6">
                <label htmlFor="ri-is-public" className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="ri-is-public"
                    checked={form.is_public ?? true}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, is_public: !!v }))}
                  />
                  公開
                </label>
                <label htmlFor="ri-pinned" className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="ri-pinned"
                    checked={form.pinned ?? false}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, pinned: !!v }))}
                  />
                  置頂
                </label>
              </div>
              <div>
                <label htmlFor="ri-sort-order" className="mb-1 block text-sm font-medium">
                  排序
                </label>
                <Input
                  id="ri-sort-order"
                  type="number"
                  value={form.sort_order ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeDialog}>
                取消
              </Button>
              <Button
                type="button"
                disabled={
                  !form.title.trim() ||
                  !form.description.trim() ||
                  createMut.isPending ||
                  updateMut.isPending
                }
                onClick={handleSave}
              >
                {createMut.isPending || updateMut.isPending ? '儲存中...' : '儲存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
