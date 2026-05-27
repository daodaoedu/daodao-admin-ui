import {
  ArrowUpRight,
  Bot,
  Clock,
  FileText,
  MessageSquare,
  Send,
  Settings,
  Trash2,
  Upload,
  User,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { StatCard } from '@/components/StatCard'

// ── Types ────────────────────────────────────────────────
interface KBFile {
  id: number
  name: string
  type: 'text' | 'pdf' | 'md'
  size: string
  uploadedAt: string
}

interface Message {
  id: number
  sender: 'user' | 'ai'
  content: string
  time: string
}

interface Conversation {
  id: number
  user: string
  lastMessage: string
  status: 'ai-resolved' | 'escalated' | 'needs-human'
  time: string
  messages: Message[]
}

// ── Mock data ────────────────────────────────────────────
const MOCK_KB_FILES: KBFile[] = [
  { id: 1, name: 'FAQ常見問題.md', type: 'md', size: '12 KB', uploadedAt: '2024-06-01' },
  { id: 2, name: '課程介紹.pdf', type: 'pdf', size: '2.3 MB', uploadedAt: '2024-05-28' },
  { id: 3, name: '使用指南.txt', type: 'text', size: '8 KB', uploadedAt: '2024-05-20' },
  { id: 4, name: '社群規範.md', type: 'md', size: '5 KB', uploadedAt: '2024-05-15' },
]

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    user: '陳小明',
    lastMessage: '請問如何重設密碼？',
    status: 'ai-resolved',
    time: '5 分鐘前',
    messages: [
      { id: 1, sender: 'user', content: '請問如何重設密碼？', time: '14:20' },
      { id: 2, sender: 'ai', content: '您好！請前往「設定 > 帳號安全」，點擊「重設密碼」按鈕，系統會發送驗證信到您的信箱。', time: '14:20' },
      { id: 3, sender: 'user', content: '收到了，謝謝！', time: '14:21' },
      { id: 4, sender: 'ai', content: '不客氣！如有其他問題歡迎隨時詢問 😊', time: '14:21' },
    ],
  },
  {
    id: 2,
    user: '林美玲',
    lastMessage: '課程影片無法播放',
    status: 'escalated',
    time: '12 分鐘前',
    messages: [
      { id: 1, sender: 'user', content: '課程影片無法播放，一直顯示載入中', time: '14:08' },
      { id: 2, sender: 'ai', content: '很抱歉造成不便。請問您使用的是哪個瀏覽器？可以嘗試清除快取後重新載入。', time: '14:08' },
      { id: 3, sender: 'user', content: '我用 Chrome，清快取還是不行', time: '14:10' },
      { id: 4, sender: 'ai', content: '了解，此問題已升級給人工客服，將會盡快為您處理。', time: '14:10' },
    ],
  },
  {
    id: 3,
    user: '王大偉',
    lastMessage: '我想申請退費',
    status: 'needs-human',
    time: '30 分鐘前',
    messages: [
      { id: 1, sender: 'user', content: '我想申請退費，買了課程但內容不符合預期', time: '13:50' },
      { id: 2, sender: 'ai', content: '關於退費申請，需要由人工客服為您處理。請稍候，我將為您轉接。', time: '13:50' },
      { id: 3, sender: 'user', content: '好的，請問大概多久會有人回覆？', time: '13:52' },
    ],
  },
  {
    id: 4,
    user: '張雅婷',
    lastMessage: '學習路徑推薦',
    status: 'ai-resolved',
    time: '1 小時前',
    messages: [
      { id: 1, sender: 'user', content: '我是初學者，想學 Python，有推薦的學習路徑嗎？', time: '13:10' },
      { id: 2, sender: 'ai', content: '推薦您從「Python 入門基礎」開始，完成後可以接著「Python 資料分析實戰」。我們有完整的學習路徑可以參考！', time: '13:10' },
      { id: 3, sender: 'user', content: '太棒了，我馬上去看！', time: '13:12' },
    ],
  },
  {
    id: 5,
    user: '李志豪',
    lastMessage: '社群活動報名問題',
    status: 'ai-resolved',
    time: '2 小時前',
    messages: [
      { id: 1, sender: 'user', content: '下週的讀書會還可以報名嗎？', time: '12:00' },
      { id: 2, sender: 'ai', content: '可以的！目前還有 12 個名額。您可以到「活動」頁面點擊「報名」按鈕。', time: '12:00' },
      { id: 3, sender: 'user', content: '報名成功了，感謝！', time: '12:03' },
    ],
  },
]

const STATUS_STYLES: Record<Conversation['status'], string> = {
  'ai-resolved': 'bg-success/15 text-success',
  escalated: 'bg-warning/15 text-warning',
  'needs-human': 'bg-destructive/15 text-destructive',
}

const STATUS_LABELS: Record<Conversation['status'], string> = {
  'ai-resolved': 'AI 解決',
  escalated: '已升級',
  'needs-human': '需人工',
}

const FILE_TYPE_STYLES: Record<KBFile['type'], string> = {
  text: 'bg-muted text-muted-foreground',
  pdf: 'bg-destructive/15 text-destructive',
  md: 'bg-primary/15 text-primary',
}

// ── Component ────────────────────────────────────────────
export function AIAssistantPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)

  const selectedConversation = MOCK_CONVERSATIONS.find((c) => c.id === selectedConversationId)

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <h1 className="heading-lg">AI 社群助手</h1>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="總對話" value={1234} icon={MessageSquare} />
        <StatCard title="AI 解決率" value="78%" icon={Bot} />
        <StatCard title="平均回應" value="2.3 秒" icon={Clock} />
        <StatCard title="升級率" value="22%" icon={ArrowUpRight} />
      </div>

      {/* ── Two-column layout ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left column ──────────────────────────────── */}
        <div className="space-y-6">
          {/* 知識庫 */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="heading-sm">知識庫</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">檔案名稱</th>
                    <th className="pb-3 font-medium text-muted-foreground">類型</th>
                    <th className="pb-3 font-medium text-muted-foreground">大小</th>
                    <th className="pb-3 font-medium text-muted-foreground">上傳日期</th>
                    <th className="pb-3 font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_KB_FILES.map((file) => (
                    <tr key={file.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium text-foreground">{file.name}</td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            FILE_TYPE_STYLES[file.type],
                          )}
                        >
                          {file.type}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{file.size}</td>
                      <td className="py-3 text-muted-foreground">{file.uploadedAt}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Upload className="h-4 w-4" />
                上傳文件
              </button>
            </div>
          </div>

          {/* AI 設定 */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h2 className="heading-sm">AI 設定</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  人格
                </label>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                  defaultValue="你是島島阿學的AI助手，專門協助社群成員解答學習相關問題。請用繁體中文、友善的語氣回答。"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  語氣
                </label>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>友善</option>
                  <option>專業</option>
                  <option>輕鬆</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Fallback 訊息
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  defaultValue="抱歉，我無法回答這個問題，將為您轉接人工客服。"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────── */}
        <div className="space-y-6">
          {/* 共享收件匣 */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="heading-sm">共享收件匣</h2>
            </div>

            <div className="space-y-1">
              {MOCK_CONVERSATIONS.map((conv) => (
                <div key={conv.id}>
                  {/* Conversation list item */}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedConversationId(
                        selectedConversationId === conv.id ? null : conv.id,
                      )
                    }
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors',
                      selectedConversationId === conv.id
                        ? 'bg-primary/5'
                        : 'hover:bg-muted/50',
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{conv.user}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{conv.time}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {conv.lastMessage}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_STYLES[conv.status],
                      )}
                    >
                      {STATUS_LABELS[conv.status]}
                    </span>
                  </button>

                  {/* Expanded conversation thread */}
                  {selectedConversationId === conv.id && selectedConversation && (
                    <div className="ml-11 mt-1 rounded-lg border border-border bg-background p-4">
                      <div className="space-y-3">
                        {selectedConversation.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex gap-2',
                              msg.sender === 'ai' ? 'flex-row' : 'flex-row-reverse',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                                msg.sender === 'ai'
                                  ? 'bg-primary/15'
                                  : 'bg-muted',
                              )}
                            >
                              {msg.sender === 'ai' ? (
                                <Bot className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <div
                              className={cn(
                                'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                                msg.sender === 'ai'
                                  ? 'bg-muted text-foreground'
                                  : 'bg-primary text-primary-foreground',
                              )}
                            >
                              <p>{msg.content}</p>
                              <p
                                className={cn(
                                  'mt-1 text-xs',
                                  msg.sender === 'ai'
                                    ? 'text-muted-foreground'
                                    : 'text-primary-foreground/70',
                                )}
                              >
                                {msg.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply area */}
                      <div className="mt-4 space-y-2">
                        <textarea
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={2}
                          placeholder="輸入回覆..."
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <Zap className="h-3 w-3" />
                            接管對話
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            <Send className="h-3 w-3" />
                            發送
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
