import { ChevronDown, Edit, GripVertical, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FAQItem {
  id: number
  question: string
  answer: string
  isPublished: boolean
}

type FAQCategory = '一般問題' | '帳號相關' | '功能使用' | 'AI 服務'

const categories: FAQCategory[] = ['一般問題', '帳號相關', '功能使用', 'AI 服務']

const faqsByCategory: Record<FAQCategory, FAQItem[]> = {
  一般問題: [],
  帳號相關: [],
  功能使用: [],
  'AI 服務': [],
}

export function FAQManagementPage() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('一般問題')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [publishState, setPublishState] = useState<Record<number, boolean>>({})

  const faqs = faqsByCategory[activeCategory]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">FAQ 管理</h1>
        <Button type="button" onClick={() => alert('新增 FAQ 功能開發中')}>
          <Plus className="h-4 w-4" />
          新增 FAQ
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="admin-segmented">
        {categories.map((cat) => (
          <Button
            key={cat}
            type="button"
            className={cn(
              'admin-segmented-item flex-1 justify-center',
              activeCategory === cat
                ? 'admin-segmented-item-active'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => {
              setActiveCategory(cat)
              setExpandedId(null)
            }}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-2">
        {faqs.map((item) => {
          const isExpanded = expandedId === item.id
          const isPublished = publishState[item.id] ?? item.isPublished

          return (
            <div key={item.id} className="admin-panel-card">
              {/* Question row */}
              <div className="flex items-center gap-3 p-4">
                {/* Drag handle */}
                <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground/50" />

                {/* Question text (clickable to expand) */}
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

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  {/* Publish toggle */}
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                      isPublished ? 'bg-primary' : 'bg-muted',
                    )}
                    onClick={() =>
                      setPublishState((prev) => ({ ...prev, [item.id]: !isPublished }))
                    }
                    title={isPublished ? '上架中 — 點擊下架' : '已下架 — 點擊上架'}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow transition-transform',
                        isPublished ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </Button>
                  <span className="w-8 text-xs text-muted-foreground">
                    {isPublished ? '上架' : '下架'}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => alert(`編輯 FAQ #${item.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    onClick={() => alert(`刪除 FAQ #${item.id}`)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Answer (expanded) */}
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
    </div>
  )
}
