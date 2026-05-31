import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  createSystemPrompt,
  deleteSystemPrompt,
  listSystemPrompts,
  updateSystemPrompt,
} from '@/api/admin-ai'
import type { SystemPrompt } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input, Textarea } from '@/components/ui/input'

export function SystemPromptsPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<SystemPrompt | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({ name: '', content: '', is_active: false })

  const { data, isLoading } = useQuery({
    queryKey: ['system-prompts'],
    queryFn: () => listSystemPrompts({ limit: 100 }).then((r) => r.data.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['system-prompts'] })

  const createMut = useMutation({
    mutationFn: createSystemPrompt,
    onSuccess: () => {
      invalidate()
      setIsNew(false)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateSystemPrompt>[1] }) =>
      updateSystemPrompt(id, data),
    onSuccess: () => {
      invalidate()
      setSelected(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteSystemPrompt,
    onSuccess: () => {
      invalidate()
      setSelected(null)
    },
  })

  const openNew = () => {
    setForm({ name: '', content: '', is_active: false })
    setSelected(null)
    setIsNew(true)
  }

  const openEdit = (p: SystemPrompt) => {
    setForm({ name: p.name, content: p.content, is_active: p.is_active })
    setSelected(p)
    setIsNew(false)
  }

  return (
    <>
      <PageHeader
        title="System Prompts"
        description="管理 AI 功能的系統提示詞，調整 AI 回應風格與知識邊界。"
        actions={
          <Button type="button" size="xs" onClick={openNew} className="px-3">
            + 新增
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* List */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">載入中...</p>
          ) : (
            <div className="space-y-1.5">
              {(data ?? []).map((p) => (
                <Button
                  type="button"
                  variant="ghost"
                  key={p.id}
                  onClick={() => openEdit(p)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors
                  ${selected?.id === p.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{p.name}</span>
                    {p.is_active && (
                      <Badge variant="success" className="ml-1 shrink-0 px-1.5">
                        active
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex gap-2 text-xs text-muted-foreground">
                    <span>v{p.version}</span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        {(isNew || selected) && (
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5 space-y-4">
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              {isNew ? '新增 Prompt' : `編輯：${selected?.name}`}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {['name'].map((field) => (
                <div key={field}>
                  <label htmlFor={`field-${field}`} className="mb-1 block text-sm font-medium">
                    {field}
                  </label>
                  <Input
                    id={`field-${field}`}
                    value={(form as unknown as Record<string, string>)[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 pt-5">
                <Checkbox
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: !!checked }))}
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  is_active
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="prompt-content" className="mb-1 block text-sm font-medium">
                content
              </label>
              <Textarea
                id="prompt-content"
                rows={16}
                className="font-mono"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  if (form.name.trim() === '' || form.content.trim() === '') {
                    alert('名稱和內容不可為空')
                    return
                  }
                  const payload = {
                    name: form.name,
                    content: form.content,
                    is_active: form.is_active,
                  }
                  if (isNew) createMut.mutate(payload)
                  else {
                    if (!selected) return
                    updateMut.mutate({ id: selected.id, data: payload })
                  }
                }}
              >
                {isNew ? '建立' : '儲存'}
              </Button>
              {selected && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('確定刪除？')) deleteMut.mutate(selected.id)
                  }}
                >
                  刪除
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelected(null)
                  setIsNew(false)
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {!isNew && !selected && (
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5 text-sm text-muted-foreground">
            請從左側選擇一筆提示詞，或點擊「新增」建立新項目。
          </div>
        )}
      </div>
    </>
  )
}
