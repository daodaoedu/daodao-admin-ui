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
import type {
  ConversationDetail,
  ConversationListItem,
  KnowledgeEntry,
} from '@/api/admin-ai-assistant'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAIAssistantStats,
  useConversation,
  useConversations,
  useKnowledgeEntries,
} from '@/hooks/useAIAssistant'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<ConversationListItem['status'], string> = {
  'ai-resolved': 'bg-success/15 text-success',
  escalated: 'bg-warning/15 text-warning',
  'needs-human': 'bg-destructive/15 text-destructive',
}

const STATUS_LABELS: Record<ConversationListItem['status'], string> = {
  'ai-resolved': 'AI 解決',
  escalated: '已升級',
  'needs-human': '需人工',
}

const FILE_TYPE_STYLES: Record<KnowledgeEntry['type'], string> = {
  text: 'bg-muted text-muted-foreground',
  pdf: 'bg-destructive/15 text-destructive',
  md: 'bg-primary/15 text-primary',
}

const AI_TONE_OPTIONS = [
  { value: '友善', label: '友善' },
  { value: '專業', label: '專業' },
  { value: '輕鬆', label: '輕鬆' },
]

// ── Component ────────────────────────────────────────────
export function AIAssistantPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [aiPersona, setAiPersona] = useState(
    '你是島島阿學的AI助手，專門協助社群成員解答學習相關問題。請用繁體中文、友善的語氣回答。',
  )
  const [aiTone, setAiTone] = useState('友善')
  const [aiFallback, setAiFallback] = useState('抱歉，我無法回答這個問題，將為您轉接人工客服。')
  const [replyMessage, setReplyMessage] = useState('')

  const { data: kbFiles } = useKnowledgeEntries()
  const { data: conversations } = useConversations()
  const { data: stats } = useAIAssistantStats()
  const { data: selectedConversationData } = useConversation(selectedConversationId)

  const displayKbFiles = kbFiles ?? []
  const displayConversations = (conversations ?? []) as ConversationListItem[]
  const selectedConversationListItem = displayConversations.find(
    (c) => c.id === selectedConversationId,
  )
  const selectedConversation =
    selectedConversationData ??
    (selectedConversationListItem
      ? { ...selectedConversationListItem, messages: [] as ConversationDetail['messages'] }
      : null) ??
    null

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <PageHeader
        title="AI 社群助手"
        description="透過 AI 即時回應社群問題，設定知識庫範圍、查看對話記錄與使用統計。"
      />

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="總對話" value={stats?.totalConversations ?? 0} icon={MessageSquare} />
        <StatCard title="AI 解決率" value={stats ? `${stats.aiResolvedRate}%` : '0%'} icon={Bot} />
        <StatCard
          title="平均回應"
          value={stats ? `${stats.avgResponseSeconds} 秒` : '0 秒'}
          icon={Clock}
        />
        <StatCard
          title="升級率"
          value={stats ? `${stats.escalationRate}%` : '0%'}
          icon={ArrowUpRight}
        />
      </div>

      {/* ── Two-column layout ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left column ──────────────────────────────── */}
        <div className="space-y-6">
          {/* 知識庫 */}
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
                知識庫
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>檔案名稱</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>上傳日期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayKbFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium text-foreground">{file.name}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          FILE_TYPE_STYLES[file.type],
                        )}
                      >
                        {file.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{file.size}</TableCell>
                    <TableCell className="text-muted-foreground">{file.uploadedAt}</TableCell>
                    <TableCell>
                      <Button type="button" variant="destructive" size="xs" className="h-6 w-6 p-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Button type="button" variant="outline" size="sm">
                <Upload className="h-4 w-4" />
                上傳文件
              </Button>
            </div>
          </div>

          {/* AI 設定 */}
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
                AI 設定
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="ai-persona"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  人格
                </label>
                <Textarea
                  id="ai-persona"
                  className="w-full"
                  rows={3}
                  value={aiPersona}
                  onChange={(e) => setAiPersona(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="ai-tone"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  語氣
                </label>
                <Select
                  value={aiTone}
                  onValueChange={setAiTone}
                  options={AI_TONE_OPTIONS}
                  triggerClassName="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
              <div>
                <label
                  htmlFor="ai-fallback"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Fallback 訊息
                </label>
                <Input
                  id="ai-fallback"
                  type="text"
                  className="w-full"
                  value={aiFallback}
                  onChange={(e) => setAiFallback(e.target.value)}
                />
              </div>
              <Button type="button">儲存設定</Button>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────── */}
        <div className="space-y-6">
          {/* 共享收件匣 */}
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
                共享收件匣
              </h2>
            </div>

            <div className="space-y-1">
              {displayConversations.map((conv) => (
                <div key={conv.id}>
                  {/* Conversation list item */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setSelectedConversationId(selectedConversationId === conv.id ? null : conv.id)
                    }
                    className={cn(
                      'w-full items-start gap-3 rounded-lg p-3 text-left transition-colors',
                      selectedConversationId === conv.id ? 'bg-primary/5' : 'hover:bg-muted/50',
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
                  </Button>

                  {/* Expanded conversation thread */}
                  {selectedConversationId === conv.id && selectedConversation && (
                    <div className="ml-11 mt-1 rounded-lg border border-[var(--admin-panel-border)] bg-card/90 p-4 shadow-sm">
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
                                msg.sender === 'ai' ? 'bg-primary/15' : 'bg-muted',
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
                        <Textarea
                          className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          rows={2}
                          placeholder="輸入回覆..."
                        />
                        <div className="flex items-center gap-2">
                          <Button type="button" size="sm">
                            <Zap className="h-3 w-3" />
                            接管對話
                          </Button>
                          <Button type="button" variant="outline" size="sm">
                            <Send className="h-3 w-3" />
                            發送
                          </Button>
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
