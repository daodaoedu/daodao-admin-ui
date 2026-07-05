import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { TagItem } from '@/api/admin-users'
import { createTag, deleteTag, deleteTagRule, updateTag } from '@/api/admin-users'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTagRules, useUserTags } from '@/hooks/useUserTags'

const DEFAULT_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

function TagFormModal({ tag, onClose }: { tag: TagItem | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEdit = tag !== null
  const [name, setName] = useState(tag?.name ?? '')
  const [color, setColor] = useState(tag?.color ?? DEFAULT_COLORS[0])

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    // biome-ignore lint/style/noNonNullAssertion: tag is non-null when isEdit is true
    mutationFn: (data: { name?: string; color?: string }) => updateTag(tag!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] })
      onClose()
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (isEdit) {
      updateMutation.mutate({ name: name.trim(), color })
    } else {
      createMutation.mutate({ name: name.trim(), color })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{isEdit ? '編輯標籤' : '新增標籤'}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tag-name" className="mb-1 block text-sm font-medium">
              標籤名稱
            </label>
            <input
              id="tag-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入標籤名稱"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium">顏色</span>
            <div className="flex gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? '儲存中...' : isEdit ? '更新' : '建立'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UserTagsPage() {
  const queryClient = useQueryClient()
  const { data: tags = [], isLoading: tagsLoading } = useUserTags()
  const { data: apiRules = [], isLoading: rulesLoading } = useTagRules()

  const [localToggles, setLocalToggles] = useState<Record<number, boolean>>({})
  const [editingTag, setEditingTag] = useState<TagItem | null | 'new'>(null)

  const autoRules = apiRules.map((r) => ({
    ...r,
    isEnabled: localToggles[r.id] ?? r.isEnabled,
  }))

  const toggleRule = (id: number) => {
    setLocalToggles((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? apiRules.find((r) => r.id === id)?.isEnabled ?? false),
    }))
  }

  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] })
    },
  })

  const deleteTagRuleMutation = useMutation({
    mutationFn: (id: number) => deleteTagRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tag-rules'] })
    },
  })

  const handleDeleteTag = (id: number) => {
    if (confirm('確定要刪除此標籤嗎？')) {
      deleteTagMutation.mutate(id)
    }
  }

  const handleDeleteTagRule = (id: number) => {
    if (confirm('確定要刪除此規則嗎？')) {
      deleteTagRuleMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="用戶標籤管理"
        description="建立與管理用戶分群標籤，作為精準通知與內容推播的依據。"
        actions={
          <Button type="button" onClick={() => setEditingTag('new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            新增標籤
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* All Tags */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
            全部標籤
          </h2>
          {tagsLoading ? (
            <p className="text-sm text-muted-foreground">載入中…</p>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無標籤</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {['標籤名稱', '用戶數', '建立日期', '操作'].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium">{tag.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">{tag.userCount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{tag.createdAt}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => setEditingTag(tag)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => handleDeleteTag(tag.id)}
                          disabled={deleteTagMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Auto Tag Rules */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
            自動標籤規則
          </h2>
          {rulesLoading ? (
            <p className="text-sm text-muted-foreground">載入中…</p>
          ) : autoRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無自動標籤規則</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {['標籤 ID', '條件類型', '運算子', '條件值', '狀態', '操作'].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {autoRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-mono text-xs">{rule.tagId}</TableCell>
                    <TableCell className="text-xs">{rule.conditionType}</TableCell>
                    <TableCell className="text-xs">{rule.conditionOperator}</TableCell>
                    <TableCell className="font-mono text-xs">{rule.conditionValue}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        role="switch"
                        aria-checked={rule.isEnabled}
                        onClick={() => toggleRule(rule.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          rule.isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                            rule.isEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => handleDeleteTagRule(rule.id)}
                          disabled={deleteTagRuleMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {editingTag !== null && (
        <TagFormModal
          tag={editingTag === 'new' ? null : editingTag}
          onClose={() => setEditingTag(null)}
        />
      )}
    </div>
  )
}
