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

const mockFAQs: Record<FAQCategory, FAQItem[]> = {
  一般問題: [
    {
      id: 1,
      question: '什麼是島島阿學？',
      answer:
        '島島阿學是一個學習資源與實踐社群平台，致力於讓每個人都能找到適合自己的學習資源，並與志同道合的夥伴一起學習、成長。我們匯集了多元的線上課程、書籍、影片、社群活動等資源，幫助學習者打造個人化的學習旅程。',
      isPublished: true,
    },
    {
      id: 2,
      question: '如何開始使用？',
      answer:
        '註冊帳號後，可以瀏覽學習資源、加入學習社群、建立自己的學習計畫。您可以透過搜尋功能尋找感興趣的主題，也可以瀏覽推薦的學習路徑來快速開始。',
      isPublished: true,
    },
    {
      id: 3,
      question: '費用是多少？',
      answer:
        '基本功能完全免費，包含瀏覽學習資源、參與社群討論、建立學習計畫等。部分進階功能如 AI 學習助手、個人化推薦等提供付費方案，詳情請參閱定價頁面。',
      isPublished: true,
    },
    {
      id: 4,
      question: '如何聯繫客服？',
      answer:
        '您可以透過意見回饋功能聯繫我們，我們會在 24 小時內回覆。也可以寄信至 support@daodao.tw 或在 Facebook 粉絲專頁留言。',
      isPublished: false,
    },
  ],
  帳號相關: [
    {
      id: 5,
      question: '如何重設密碼？',
      answer: '在登入頁面點擊「忘記密碼」，輸入註冊時的 Email 即可收到重設密碼的連結。',
      isPublished: true,
    },
    {
      id: 6,
      question: '可以使用社群帳號登入嗎？',
      answer: '目前支援 Google 帳號登入，未來將陸續支援 Facebook、Apple ID 等登入方式。',
      isPublished: true,
    },
    {
      id: 7,
      question: '如何刪除帳號？',
      answer:
        '請至設定頁面的「帳號管理」區塊，點擊「刪除帳號」按鈕。請注意，刪除後資料將無法復原。',
      isPublished: true,
    },
    {
      id: 8,
      question: '如何變更個人資料？',
      answer: '登入後前往「個人設定」頁面，即可修改暱稱、頭像、自我介紹等個人資料。',
      isPublished: false,
    },
  ],
  功能使用: [
    {
      id: 9,
      question: '如何建立學習計畫？',
      answer: '點擊「我的學習」中的「新增計畫」，設定學習目標、時程與內容即可開始。',
      isPublished: true,
    },
    {
      id: 10,
      question: '如何分享學習資源？',
      answer: '在資源頁面點擊「分享」按鈕，可選擇分享至社群平台或複製連結。',
      isPublished: true,
    },
    {
      id: 11,
      question: '如何參與社群討論？',
      answer: '加入感興趣的學習社群後，即可在討論區發文、回覆和互動。',
      isPublished: true,
    },
    {
      id: 12,
      question: '學習紀錄在哪裡查看？',
      answer: '前往「我的學習」頁面，即可查看完整的學習歷程與進度。',
      isPublished: true,
    },
  ],
  'AI 服務': [
    {
      id: 13,
      question: 'AI 學習助手是什麼？',
      answer:
        'AI 學習助手是基於大型語言模型的智慧助理，能根據您的學習目標提供個人化的建議與資源推薦。',
      isPublished: true,
    },
    {
      id: 14,
      question: 'AI 推薦如何運作？',
      answer:
        '系統會根據您的學習歷程、興趣標籤與同類型使用者的行為，利用 AI 演算法推薦最適合的學習資源。',
      isPublished: true,
    },
    {
      id: 15,
      question: 'AI 功能有使用限制嗎？',
      answer: '免費方案每日可使用 AI 助手 10 次，付費方案則無使用次數限制。',
      isPublished: true,
    },
    {
      id: 16,
      question: 'AI 回答的內容可靠嗎？',
      answer:
        'AI 助手的回答僅供參考，建議搭配其他學習資源交叉驗證。我們持續優化模型以提升回答品質。',
      isPublished: false,
    },
  ],
}

export function FAQManagementPage() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('一般問題')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [publishState, setPublishState] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    for (const items of Object.values(mockFAQs)) {
      for (const item of items) {
        init[item.id] = item.isPublished
      }
    }
    return init
  })

  const faqs = mockFAQs[activeCategory]

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
      <div className="flex gap-1 border-b border-border">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              activeCategory === cat
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => {
              setActiveCategory(cat)
              setExpandedId(null)
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-2">
        {faqs.map((item) => {
          const isExpanded = expandedId === item.id
          const isPublished = publishState[item.id] ?? item.isPublished

          return (
            <div key={item.id} className="rounded-xl border border-border bg-card shadow-sm">
              {/* Question row */}
              <div className="flex items-center gap-3 p-4">
                {/* Drag handle */}
                <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground/50" />

                {/* Question text (clickable to expand) */}
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-180',
                    )}
                  />
                  <span className="font-medium">{item.question}</span>
                </button>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  {/* Publish toggle */}
                  <button
                    type="button"
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
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                        isPublished ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
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
