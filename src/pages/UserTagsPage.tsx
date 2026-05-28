import { Edit2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTagRules, useUserTags } from '@/hooks/useUserTags'

interface ManualTag {
  id: number
  name: string
  color: string
  colorClass: string
  userCount: number
  createdAt: string
}

interface AutoTagRule {
  id: number
  name: string
  condition: string
  matchedUsers: number
  enabled: boolean
}

const MANUAL_TAGS: ManualTag[] = [
  {
    id: 1,
    name: 'VIP',
    color: 'bg-info',
    colorClass: 'text-info',
    userCount: 128,
    createdAt: '2025-01-15',
  },
  {
    id: 2,
    name: '合作學校',
    color: 'bg-info',
    colorClass: 'text-info',
    userCount: 456,
    createdAt: '2025-02-20',
  },
  {
    id: 3,
    name: '早期用戶',
    color: 'bg-success',
    colorClass: 'text-success',
    userCount: 1024,
    createdAt: '2024-11-01',
  },
  {
    id: 4,
    name: '測試帳號',
    color: 'bg-warning',
    colorClass: 'text-warning',
    userCount: 23,
    createdAt: '2025-03-10',
  },
  {
    id: 5,
    name: '志工',
    color: 'bg-info',
    colorClass: 'text-info',
    userCount: 67,
    createdAt: '2025-04-05',
  },
]

const AUTO_TAG_RULES: AutoTagRule[] = [
  { id: 1, name: '活躍', condition: '7 天內有登入', matchedUsers: 8234, enabled: true },
  { id: 2, name: '沉睡', condition: '30 天未登入', matchedUsers: 1456, enabled: true },
  { id: 3, name: '高 AI 用量', condition: '月 token > 10,000', matchedUsers: 234, enabled: true },
  { id: 4, name: '新用戶', condition: '註冊 < 7 天', matchedUsers: 89, enabled: false },
]

export function UserTagsPage() {
  const { data: apiTags } = useUserTags()
  const { data: apiRules } = useTagRules()

  const tags: ManualTag[] = (apiTags as unknown as ManualTag[] | undefined) ?? MANUAL_TAGS
  const rulesFromApi: AutoTagRule[] =
    (apiRules as unknown as AutoTagRule[] | undefined) ?? AUTO_TAG_RULES

  const [localToggles, setLocalToggles] = useState<Record<number, boolean>>({})

  const autoRules = rulesFromApi.map((r) => ({
    ...r,
    enabled: localToggles[r.id] ?? r.enabled,
  }))

  const toggleRule = (id: number) => {
    setLocalToggles((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? rulesFromApi.find((r) => r.id === id)?.enabled ?? false),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">用戶標籤管理</h1>
        <Button type="button" onClick={() => alert('功能開發中')}>
          <Plus className="mr-1.5 h-4 w-4" />
          新增標籤
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manual Tags */}
        <div className="admin-panel-card p-5">
          <h2 className="heading-sm mb-4">手動標籤</h2>
          <div className="overflow-x-auto">
            <table className="admin-table-shell text-sm">
              <thead>
                <tr className="admin-table-head">
                  {['標籤名稱', '用戶數', '建立日期', '操作'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id} className="admin-table-row transition-colors">
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${tag.color}`} />
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
                          onClick={() => alert('功能開發中')}
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
        </div>

        {/* Auto Tag Rules */}
        <div className="admin-panel-card p-5">
          <h2 className="heading-sm mb-4">自動標籤規則</h2>
          <div className="overflow-x-auto">
            <table className="admin-table-shell text-sm">
              <thead>
                <tr className="admin-table-head">
                  {['標籤名稱', '條件描述', '符合用戶數', '狀態', '操作'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {autoRules.map((rule) => (
                  <tr key={rule.id} className="admin-table-row transition-colors">
                    <td className="px-4 py-2 font-medium">{rule.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{rule.condition}</td>
                    <td className="px-4 py-2 font-mono">{rule.matchedUsers.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <Button
                        type="button"
                        role="switch"
                        aria-checked={rule.enabled}
                        onClick={() => toggleRule(rule.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          rule.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                            rule.enabled ? 'translate-x-4' : 'translate-x-0'
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
                          onClick={() => alert('功能開發中')}
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
        </div>
      </div>
    </div>
  )
}
