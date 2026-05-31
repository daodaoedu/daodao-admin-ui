import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteTag, deleteTagRule } from '@/api/admin-users'
import { Button } from '@/components/ui/button'
import { useTagRules, useUserTags } from '@/hooks/useUserTags'

export function UserTagsPage() {
  const queryClient = useQueryClient()
  const { data: tags = [], isLoading: tagsLoading } = useUserTags()
  const { data: apiRules = [], isLoading: rulesLoading } = useTagRules()

  const [localToggles, setLocalToggles] = useState<Record<number, boolean>>({})

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl leading-none font-semibold tracking-tight text-foreground">
          用戶標籤管理
        </h1>
        <Button type="button" onClick={() => alert('功能開發中')}>
          <Plus className="mr-1.5 h-4 w-4" />
          新增標籤
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manual Tags */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
            手動標籤
          </h2>
          {tagsLoading ? (
            <p className="text-sm text-muted-foreground">載入中…</p>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無標籤</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                    {['標籤名稱', '用戶數', '建立日期', '操作'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr
                      key={tag.id}
                      className="border-b border-border/80 hover:bg-muted/45 transition-colors transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium">{tag.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono">{tag.userCount.toLocaleString()}</td>
                      <td className="px-4 py-2 text-muted-foreground">{tag.createdAt}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="xs"
                            onClick={() => alert('功能開發中')}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auto Tag Rules */}
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <h2 className="text-base leading-none font-semibold tracking-tight text-foreground mb-4">
            自動標籤規則
          </h2>
          {rulesLoading ? (
            <p className="text-sm text-muted-foreground">載入中…</p>
          ) : autoRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無自動標籤規則</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                    {['標籤 ID', '條件類型', '運算子', '條件值', '狀態', '操作'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {autoRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-border/80 hover:bg-muted/45 transition-colors transition-colors"
                    >
                      <td className="px-4 py-2 font-mono text-xs">{rule.tagId}</td>
                      <td className="px-4 py-2 text-xs">{rule.conditionType}</td>
                      <td className="px-4 py-2 text-xs">{rule.conditionOperator}</td>
                      <td className="px-4 py-2 font-mono text-xs">{rule.conditionValue}</td>
                      <td className="px-4 py-2">
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
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="xs"
                            onClick={() => alert('功能開發中')}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
