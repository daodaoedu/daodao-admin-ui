import { ChevronDown, Edit, GripVertical, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import {
  useCreateFaqItem,
  useDeleteFaqItem,
  useFaqCategories,
  useFaqItems,
  useUpdateFaqItem,
} from '@/hooks/useFAQ'
import { cn } from '@/lib/utils'

export function FAQManagementPage() {
  const { data: categories = [], isLoading: catLoading } = useFaqCategories()
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ question: '', answer: '' })

  const activeCategory = activeCategoryId ?? categories[0]?.id ?? null
  const { data: faqs = [], isLoading: faqLoading } = useFaqItems(activeCategory ?? undefined)

  const updateMut = useUpdateFaqItem()
  const deleteMut = useDeleteFaqItem()
  const createMut = useCreateFaqItem()

  function togglePublish(id: number, current: boolean) {
    updateMut.mutate({ id, data: { isPublished: !current } })
  }

  function handleDelete(id: number) {
    if (!confirm('確定刪除此 FAQ？')) return
    deleteMut.mutate(id)
  }

  function handleCreate() {
    if (!form.question.trim() || !form.answer.trim()) {
      alert('問題和回答不可為空')
      return
    }
    if (!activeCategory) return
    createMut.mutate(
      {
        categoryId: activeCategory,
        question: form.question,
        answer: form.answer,
        isPublished: false,
      },
      {
        onSuccess: () => {
          setForm({ question: '', answer: '' })
          setShowForm(false)
        },
      },
    )
  }

  if (catLoading) {
    return <div className="p-6 text-sm text-muted-foreground">載入中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">FAQ 管理</h1>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          新增 FAQ
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="admin-segmented">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              className={cn(
                'admin-segmented-item flex-1 justify-center',
                (activeCategoryId ?? categories[0]?.id) === cat.id
                  ? 'admin-segmented-item-active'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => {
                setActiveCategoryId(cat.id)
                setExpandedId(null)
                setShowForm(false)
              }}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="admin-panel-card p-4 space-y-3">
          <h2 className="heading-sm">新增 FAQ</h2>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="faq-question">
              問題
            </label>
            <Input
              id="faq-question"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="請輸入問題"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="faq-answer">
              回答
            </label>
            <Textarea
              id="faq-answer"
              rows={4}
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              placeholder="請輸入回答"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? '建立中...' : '建立'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      {faqLoading ? (
        <div className="text-sm text-muted-foreground">載入中...</div>
      ) : faqs.length === 0 ? (
        <div className="admin-panel-card p-6 text-center text-sm text-muted-foreground">
          此分類尚無 FAQ 項目
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((item) => {
            const isExpanded = expandedId === item.id
            return (
              <div key={item.id} className="admin-panel-card">
                <div className="flex items-center gap-3 p-4">
                  <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground/50" />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto min-w-0 flex-1 items-center gap-2 text-left px-0 justify-start"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-180',
                      )}
                    />
                    <span className="font-medium">{item.question}</span>
                  </Button>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                        item.isPublished ? 'bg-primary' : 'bg-muted',
                      )}
                      onClick={() => togglePublish(item.id, item.isPublished)}
                      disabled={updateMut.isPending}
                      title={item.isPublished ? '上架中 — 點擊下架' : '已下架 — 點擊上架'}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow transition-transform',
                          item.isPublished ? 'translate-x-5' : 'translate-x-0',
                        )}
                      />
                    </Button>
                    <span className="w-8 text-xs text-muted-foreground">
                      {item.isPublished ? '上架' : '下架'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => alert(`編輯功能開發中 #${item.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <p className="pl-9 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
