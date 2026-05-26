import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createRoadmapItem, listRoadmapItems, updateRoadmapItem } from '@/api/admin'
import type { AdminRoadmapItem, RoadmapStatus, WishCategory } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  ROADMAP_STATUS_LABELS,
  ROADMAP_STATUS_OPTIONS,
} from '@/constants/wishpool'

interface ItemForm {
  title: string
  description: string
  category: WishCategory
  status: RoadmapStatus
  is_public: boolean
  pinned: boolean
  sort_order: number
}

const emptyForm: ItemForm = {
  title: '',
  description: '',
  category: 'operation',
  status: 'collected',
  is_public: true,
  pinned: false,
  sort_order: 0,
}

export function RoadmapItemsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<RoadmapStatus | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-roadmap-items', statusFilter],
    queryFn: () =>
      listRoadmapItems({ status: statusFilter || undefined, limit: 100 }).then((r) => r.data),
  })
  const items = data?.data ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-roadmap-items'] })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminRoadmapItem | null>(null)
  const [form, setForm] = useState<ItemForm>(emptyForm)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (item: AdminRoadmapItem) => {
    setEditing(item)
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      status: item.status,
      is_public: item.is_public,
      pinned: item.pinned,
      sort_order: item.sort_order,
    })
    setOpen(true)
  }

  const createMut = useMutation({
    mutationFn: () => createRoadmapItem(form),
    onSuccess: () => {
      invalidate()
      setOpen(false)
    },
  })

  const updateMut = useMutation({
    mutationFn: () => updateRoadmapItem(editing?.id ?? 0, form),
    onSuccess: () => {
      invalidate()
      setOpen(false)
    },
  })

  const valid = form.title.trim() !== '' && form.description.trim() !== ''
  const saving = createMut.isPending || updateMut.isPending
  const willNotify = editing && editing.status !== 'done' && form.status === 'done'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">路線圖項目管理</h1>
        <Button type="button" size="sm" onClick={openCreate}>
          + 新增項目
        </Button>
      </div>

      <div className="w-48">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as RoadmapStatus | '')}
          options={[{ value: '', label: '全部狀態' }, ...ROADMAP_STATUS_OPTIONS]}
          placeholder="狀態"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-muted-foreground">
              {['標題', '分類', '狀態', '票數', '公開', '置頂', '排序', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  載入中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  無項目
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-accent">
                  <td className="px-4 py-2 font-medium">{item.title}</td>
                  <td className="px-4 py-2">
                    <Badge variant="primary">{CATEGORY_LABELS[item.category]}</Badge>
                  </td>
                  <td className="px-4 py-2">{ROADMAP_STATUS_LABELS[item.status]}</td>
                  <td className="px-4 py-2">{item.support_count}</td>
                  <td className="px-4 py-2">{item.is_public ? '是' : '否'}</td>
                  <td className="px-4 py-2">{item.pinned ? '是' : '否'}</td>
                  <td className="px-4 py-2">{item.sort_order}</td>
                  <td className="px-4 py-2">
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
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

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-auto max-h-[85vh] max-w-lg overflow-y-auto p-6">
          <div className="space-y-4">
            <h2 className="heading-sm">{editing ? '編輯項目' : '新增項目'}</h2>
            <div>
              <label htmlFor="item-title" className="mb-1 block text-sm font-medium">
                對外標題
              </label>
              <Input
                id="item-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="item-desc" className="mb-1 block text-sm font-medium">
                對外描述
              </label>
              <Textarea
                id="item-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-category" className="mb-1 block text-sm font-medium">
                  分類
                </label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v as WishCategory }))}
                  options={CATEGORY_OPTIONS}
                />
              </div>
              <div>
                <label htmlFor="item-status" className="mb-1 block text-sm font-medium">
                  狀態
                </label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as RoadmapStatus }))}
                  options={ROADMAP_STATUS_OPTIONS}
                />
              </div>
            </div>
            {willNotify && (
              <p className="rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-700">
                設為「已完成」將寫入 shipped_at 並通知所有支持者一次。
              </p>
            )}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm" htmlFor="item-public">
                <Checkbox
                  id="item-public"
                  checked={form.is_public}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, is_public: c === true }))}
                />
                公開
              </label>
              <label className="flex items-center gap-2 text-sm" htmlFor="item-pinned">
                <Checkbox
                  id="item-pinned"
                  checked={form.pinned}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, pinned: c === true }))}
                />
                置頂
              </label>
              <div className="flex items-center gap-2">
                <label htmlFor="item-sort" className="text-sm">
                  排序
                </label>
                <Input
                  id="item-sort"
                  type="number"
                  className="w-20"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button
                type="button"
                disabled={!valid || saving}
                onClick={() => (editing ? updateMut.mutate() : createMut.mutate())}
              >
                {saving ? '儲存中…' : '儲存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
