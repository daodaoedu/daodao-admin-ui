import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Plus, Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  createAgentThread,
  deleteAgentThread,
  listAgentThreads,
  respondToApproval,
  sendAgentMessage,
} from '@/api/admin'
import type { AgentItem, AgentThread } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'

// ── Message renderers ─────────────────────────────────────

function UserMessageBubble({ item }: { item: AgentItem }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-lg px-4 py-2 text-sm bg-primary text-primary-foreground">
        {item.content}
      </div>
    </div>
  )
}

function AgentMessageBubble({ item }: { item: AgentItem }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] rounded-lg px-4 py-2 bg-muted text-foreground">
        <pre className="whitespace-pre-wrap font-sans text-sm">{item.content}</pre>
      </div>
    </div>
  )
}

function ToolCallCard({ item }: { item: AgentItem }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg border border-border bg-card px-4 py-2 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium">
            tool
          </span>
          <span className="font-medium text-foreground">{item.tool}</span>
        </div>
        {item.args && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none hover:text-foreground">Args</summary>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
              {JSON.stringify(item.args, null, 2)}
            </pre>
          </details>
        )}
        {item.result !== undefined && (
          <details className="text-xs text-muted-foreground mt-1">
            <summary className="cursor-pointer select-none hover:text-foreground">Result</summary>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
              {typeof item.result === 'string' ? item.result : JSON.stringify(item.result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

function ApprovalRequestCard({
  item,
  onRespond,
  disabled,
}: {
  item: AgentItem
  onRespond: (action: 'allow' | 'deny') => void
  disabled: boolean
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg border border-yellow-400/60 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm">
        <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Approval Request</p>
        {item.description && (
          <p className="text-yellow-700 dark:text-yellow-400 mb-2">{item.description}</p>
        )}
        {item.preview && item.preview.length > 0 && (
          <details className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
            <summary className="cursor-pointer select-none hover:opacity-80">
              Preview ({item.preview.length} items)
            </summary>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
              {JSON.stringify(item.preview.slice(0, 3), null, 2)}
            </pre>
          </details>
        )}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => onRespond('allow')}
            disabled={disabled}
            className="rounded-md bg-green-600 text-white px-3 py-1 text-xs font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Allow
          </button>
          <button
            type="button"
            onClick={() => onRespond('deny')}
            disabled={disabled}
            className="rounded-md bg-red-600 text-white px-3 py-1 text-xs font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  )
}

function ResultCard({ item }: { item: AgentItem }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg border border-green-400/60 bg-green-50 dark:bg-green-900/20 px-4 py-2 text-sm">
        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Result</p>
        <p className="text-green-800 dark:text-green-300 text-sm">{item.summary}</p>
      </div>
    </div>
  )
}

// ── Thread list item ──────────────────────────────────────

function ThreadItem({
  thread,
  selected,
  deleteConfirm,
  onSelect,
  onDelete,
  onDeleteConfirm,
}: {
  thread: AgentThread
  selected: boolean
  deleteConfirm: boolean
  onSelect: () => void
  onDelete: () => void
  onDeleteConfirm: () => void
}) {
  return (
    <button
      type="button"
      className={`group flex w-full items-center gap-1 rounded-md px-2 py-2 text-left text-sm transition-colors ${
        selected
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
      onClick={onSelect}
    >
      <Bot className="h-3.5 w-3.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-xs">{thread.title}</p>
        <p className={`text-xs ${selected ? 'opacity-70' : 'text-muted-foreground/70'}`}>
          {thread.message_count ?? 0} items
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (deleteConfirm) {
            onDeleteConfirm()
          } else {
            onDelete()
          }
        }}
        className={`shrink-0 rounded p-0.5 transition-colors ${
          deleteConfirm
            ? 'text-destructive bg-destructive/10 hover:bg-destructive/20'
            : selected
              ? 'opacity-70 hover:opacity-100'
              : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'
        }`}
        title={deleteConfirm ? 'Confirm delete' : 'Delete thread'}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────

export function AgentPage() {
  const queryClient = useQueryClient()
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [localHistory, setLocalHistory] = useState<AgentItem[]>([])
  const [input, setInput] = useState('')
  const [provider, setProvider] = useState('openrouter')
  const [dryRun, setDryRun] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: threads = [] } = useQuery({
    queryKey: ['agent-threads'],
    queryFn: () => listAgentThreads().then((r) => r.data.data),
  })

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localHistory.length])

  // Reset local history when switching threads
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset history on thread change
  useEffect(() => {
    setLocalHistory([])
  }, [selectedThreadId])

  const createThreadMutation = useMutation({
    mutationFn: () => createAgentThread().then((r) => r.data.data),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['agent-threads'] })
      setSelectedThreadId(thread.id)
      setLocalHistory([])
    },
  })

  const deleteThreadMutation = useMutation({
    mutationFn: (threadId: string) => deleteAgentThread(threadId),
    onSuccess: (_data, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['agent-threads'] })
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null)
        setLocalHistory([])
      }
      setDeleteConfirm(null)
    },
  })

  const approvalMutation = useMutation({
    mutationFn: ({ action }: { action: 'allow' | 'deny' }) =>
      respondToApproval(selectedThreadId as string, { action }).then((r) => r.data.data),
    onSuccess: (data) => {
      setLocalHistory((prev) => [...prev, ...data.items])
      queryClient.invalidateQueries({ queryKey: ['agent-threads'] })
    },
  })

  const handleSend = async () => {
    if (!input.trim() || !selectedThreadId || isSending) return

    const userItem: AgentItem = {
      type: 'user_message',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setLocalHistory((prev) => [...prev, userItem])
    setInput('')
    setIsSending(true)

    try {
      const res = await sendAgentMessage(selectedThreadId, {
        message: userItem.content as string,
        provider,
        dry_run: dryRun,
      })
      setLocalHistory((prev) => [...prev, ...res.data.data.items])
      queryClient.invalidateQueries({ queryKey: ['agent-threads'] })
    } catch {
      // remove optimistic user message on error
      setLocalHistory((prev) => prev.slice(0, -1))
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleApproval = (action: 'allow' | 'deny') => {
    if (!selectedThreadId) return
    approvalMutation.mutate({ action })
  }

  return (
    <div className="flex h-full">
      {/* ── Left panel: thread list ── */}
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-3 border-b border-border">
          <Button
            type="button"
            variant="secondary"
            className="w-full text-sm"
            onClick={() => createThreadMutation.mutate()}
            disabled={createThreadMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            New Thread
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {threads.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No threads yet</p>
          )}
          {threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              selected={selectedThreadId === thread.id}
              deleteConfirm={deleteConfirm === thread.id}
              onSelect={() => {
                setSelectedThreadId(thread.id)
                setDeleteConfirm(null)
              }}
              onDelete={() => setDeleteConfirm(thread.id)}
              onDeleteConfirm={() => deleteThreadMutation.mutate(thread.id)}
            />
          ))}
        </div>
      </aside>

      {/* ── Right panel: chat area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {selectedThread === null ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            選擇或建立一個 Thread 開始對話
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-card">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground flex-1 truncate">
                {selectedThread.title}
              </span>
              {selectedThread.state?.dry_run && (
                <span className="rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 px-2 py-0.5 text-xs font-medium">
                  Dry Run
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {localHistory.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  輸入訊息開始對話
                </div>
              )}
              {localHistory.map((item, idx) => {
                const key = `${item.type}-${idx}-${item.timestamp}`
                if (item.type === 'user_message') {
                  return <UserMessageBubble key={key} item={item} />
                }
                if (item.type === 'agent_message') {
                  return <AgentMessageBubble key={key} item={item} />
                }
                if (item.type === 'tool_call') {
                  return <ToolCallCard key={key} item={item} />
                }
                if (item.type === 'approval_request') {
                  return (
                    <ApprovalRequestCard
                      key={key}
                      item={item}
                      onRespond={handleApproval}
                      disabled={approvalMutation.isPending || isSending}
                    />
                  )
                }
                if (item.type === 'result') {
                  return <ResultCard key={key} item={item} />
                }
                return null
              })}
              {isSending && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                    Agent 處理中…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2 items-end mb-2">
                <Textarea
                  rows={3}
                  className="flex-1 resize-none w-auto"
                  placeholder="輸入訊息… (Enter 送出，Shift+Enter 換行)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                />
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !input.trim()}
                  className="rounded-md"
                >
                  <Send className="h-4 w-4" />
                  送出
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="agent-provider-select" className="text-xs text-muted-foreground">
                    Provider
                  </label>
                  <select
                    id="agent-provider-select"
                    className="rounded border border-input bg-background px-2 py-0.5 text-xs"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    disabled={isSending}
                  >
                    <option value="openrouter">openrouter</option>
                    <option value="gemini">gemini</option>
                    <option value="ollama">ollama</option>
                  </select>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    disabled={isSending}
                    className="rounded"
                  />
                  Dry Run
                </label>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
