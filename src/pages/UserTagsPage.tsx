import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { TagItem } from '@/api/admin-users'
import {
  createTag,
  createTagRule,
  deleteTag,
  deleteTagRule,
  patchTagRule,
  updateTag,
} from '@/api/admin-users'
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

const CONDITION_TYPES = [
  { value: 'days_since_login', label: '登入間隔天數' },
  { value: 'practice_count', label: '練習次數' },
  { value: 'connection_count', label: '連結數' },
  { value: 'role_level', label: '角色等級' },
]

const OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
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

function TagRuleDialog({ tags, onClose }: { tags: TagItem[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [tagId, setTagId] = useState<number>(tags[0]?.id ?? 0)
  const [conditionType, setConditionType] = useState(CONDITION_TYPES[0].value)
  const [conditionOperator, setConditionOperator] = useState('gt')
  const [conditionValue, setConditionValue] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      createTagRule({
        tagId,
        conditionType,
        conditionOperator,
        conditionValue,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tag-rules'] })
      onClose()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tagId || !conditionValue.trim()) return
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">新增自動標籤規則</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rule-tag" className="mb-1 block text-sm font-medium">
              綁定標籤
            </label>
            <select
              id="rule-tag"
              value={tagId}
              onChange={(e) => setTagId(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rule-condition" className="mb-1 block text-sm font-medium">
              條件類型
            </label>
            <select
              id="rule-condition"
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CONDITION_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rule-operator" className="mb-1 block text-sm font-medium">
                運算子
              </label>
              <select
                id="rule-operator"
                value={conditionOperator}
                onChange={(e) => setConditionOperator(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label} ({op.value})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rule-value" className="mb-1 block text-sm font-medium">
                條件值
              </label>
              <input
                id="rule-value"
                type="text"
                required
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                placeholder="例如 30"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          {mutation.isError && <p className="text-sm text-destructive">建立失敗，請重試</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={mutation.isPending || !conditionValue.trim() || !tagId}>
              {mutation.isPending ? '建立中...' : '建立'}
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
  const { data: rules = [], isLoading: rulesLoading } = useTagRules()

  const [editingTag, setEditingTag] = useState<TagItem | null | 'new'>(null)
  const [showRuleDialog, setShowRuleDialog] = useState(false)

  const tagNameMap = new Map(tags.map((t) => [t.id, t.name]))

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      patchTagRule(id, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tag-rules'] })
    },
  })

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

  const handleToggleRule = (id: number, currentEnabled: boolean) => {
    toggleMutation.mutate({ id, isEnabled: !currentEnabled })
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              自動標籤規則
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowRuleDialog(true)}
              disabled={tags.length === 0}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              新增規則
            </Button>
          </div>
          {rulesLoading ? (
            <p className="text-sm text-muted-foreground">載入中…</p>
          ) : rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無自動標籤規則</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {['標籤', '條件', '狀態', '操作'].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => {
                  const opLabel =
                    OPERATORS.find((o) => o.value === rule.conditionOperator)?.label ??
                    rule.conditionOperator
                  const ctLabel =
                    CONDITION_TYPES.find((c) => c.value === rule.conditionType)?.label ??
                    rule.conditionType
                  return (
                    <TableRow key={rule.id}>
                      <TableCell className="text-sm font-medium">
                        {tagNameMap.get(rule.tagId) ?? `#${rule.tagId}`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ctLabel} {opLabel} {rule.conditionValue}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          role="switch"
                          aria-checked={rule.isEnabled}
                          onClick={() => handleToggleRule(rule.id, rule.isEnabled)}
                          disabled={toggleMutation.isPending}
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
                  )
                })}
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

      {showRuleDialog && <TagRuleDialog tags={tags} onClose={() => setShowRuleDialog(false)} />}
    </div>
  )
}
