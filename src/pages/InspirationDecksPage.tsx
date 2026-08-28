import {
  Check,
  Copy,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type {
  InspirationDeckCard,
  InspirationDeckSummary,
  InspirationImportResult,
} from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAddInspirationCard,
  useAssignInspirationDeck,
  useCreateInspirationDeck,
  useDeleteInspirationCard,
  useDeleteInspirationDeck,
  useDuplicateInspirationDeck,
  useImportInspirationCards,
  useInspirationDeck,
  useInspirationDecks,
  useRenameInspirationDeck,
  useUpdateInspirationCard,
} from '@/hooks/useInspirationDecks'
import { cn } from '@/lib/utils'

const CARD_MAX_LENGTH = 50

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response
    return response?.data?.error?.message ?? fallback
  }
  return fallback
}

// ─── Create deck dialog ───────────────────────────────────────────────────────

function CreateDeckDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (deckId: number) => void
}) {
  const createMutation = useCreateInspirationDeck()
  const [name, setName] = useState('')
  const [cardsText, setCardsText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setCardsText('')
    setError(null)
  }, [open])

  const cards = cardsText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  const tooLong = cards.filter((card) => card.length > CARD_MAX_LENGTH)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (tooLong.length > 0) {
      setError(`有 ${tooLong.length} 張卡片超過 ${CARD_MAX_LENGTH} 字，請修改後再建立。`)
      return
    }
    try {
      const res = await createMutation.mutateAsync({ name: name.trim(), cards })
      onCreated(res.data.data.id)
      onOpenChange(false)
    } catch (err) {
      setError(errorMessage(err, '建立失敗，請稍後再試'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[85vh] max-w-xl overflow-y-auto p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">建立卡組</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              卡片內容僅文字、最多 {CARD_MAX_LENGTH} 字；建立後仍可逐張新增或用 Excel 匯入。
            </p>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="關閉"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>
        <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="deck-name" className="mb-1.5 block text-sm font-medium">
              卡組名稱
            </label>
            <Input
              id="deck-name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="deck-cards" className="mb-1.5 block text-sm font-medium">
              初始卡片（選填，一行一張）
            </label>
            <Textarea
              id="deck-cards"
              rows={6}
              value={cardsText}
              onChange={(event) => setCardsText(event.target.value)}
              placeholder={'今天為自己保留 10 分鐘安靜時間\n寫下一件今天想感謝的事'}
              className="w-full resize-y"
            />
            <p
              className={cn(
                'mt-1 text-xs',
                tooLong.length > 0 ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {cards.length} 張
              {tooLong.length > 0 && `，${tooLong.length} 張超過 ${CARD_MAX_LENGTH} 字`}
            </p>
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              建立卡組
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card row ─────────────────────────────────────────────────────────────────

function CardRow({
  deckId,
  card,
  index,
}: {
  deckId: number
  card: InspirationDeckCard
  index: number
}) {
  const updateMutation = useUpdateInspirationCard()
  const deleteMutation = useDeleteInspirationCard()
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(card.content)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const value = content.trim()
    if (!value || value.length > CARD_MAX_LENGTH) {
      setError(`內容需為 1～${CARD_MAX_LENGTH} 字`)
      return
    }
    setError(null)
    try {
      await updateMutation.mutateAsync({ deckId, cardId: card.id, content: value })
      setEditing(false)
    } catch (err) {
      setError(errorMessage(err, '更新失敗'))
    }
  }

  function remove() {
    if (!window.confirm(`確定刪除卡片「${card.content}」？`)) return
    deleteMutation.mutate({ deckId, cardId: card.id })
  }

  return (
    <li className="flex items-start gap-3 px-5 py-2.5">
      <span className="mt-1.5 w-6 shrink-0 text-right text-xs text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex gap-2">
            <Input
              // biome-ignore lint/a11y/noAutofocus: 就地編輯，使用者剛點了編輯鈕
              autoFocus
              value={content}
              maxLength={CARD_MAX_LENGTH}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  save()
                }
                if (event.key === 'Escape') setEditing(false)
              }}
              className="w-full"
              aria-label={`編輯第 ${index + 1} 張卡片`}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="儲存"
              onClick={save}
              disabled={updateMutation.isPending}
            >
              <Check className="h-4 w-4 text-success" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="取消"
              onClick={() => {
                setContent(card.content)
                setEditing(false)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm">{card.content}</p>
        )}
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      {!editing && (
        <div className="flex shrink-0 gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="編輯卡片"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="刪除卡片"
            onClick={remove}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}
    </li>
  )
}

// ─── Deck detail ──────────────────────────────────────────────────────────────

function DeckDetail({ deckId }: { deckId: number }) {
  const { data: deck, isLoading, isError } = useInspirationDeck(deckId)
  const renameMutation = useRenameInspirationDeck()
  const addMutation = useAddInspirationCard()
  const importMutation = useImportInspirationCards()
  const assignMutation = useAssignInspirationDeck()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newCard, setNewCard] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<InspirationImportResult | null>(null)

  useEffect(() => {
    setNewCard('')
    setRenaming(false)
    setError(null)
    setImportResult(null)
  }, [])

  async function addCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = newCard.trim()
    if (!value) return
    setError(null)
    try {
      await addMutation.mutateAsync({ deckId, content: value })
      setNewCard('')
    } catch (err) {
      setError(errorMessage(err, '新增失敗'))
    }
  }

  async function rename() {
    const value = nameDraft.trim()
    if (!value) return
    setError(null)
    try {
      await renameMutation.mutateAsync({ deckId, name: value })
      setRenaming(false)
    } catch (err) {
      setError(errorMessage(err, '更名失敗'))
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setImportResult(null)
    try {
      setImportResult(await importMutation.mutateAsync({ deckId, file }))
    } catch (err) {
      setError(errorMessage(err, '匯入失敗，請確認是 .xlsx 檔且第一欄為卡片內容'))
    }
  }

  function unassign(cohortId: number, cohortName: string) {
    if (!window.confirm(`確定解除對「${cohortName}」的指派？該挑戰卡片將不再顯示抽卡入口。`)) return
    assignMutation.mutate({ deckId, cohortId, assign: false })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        載入卡組中
      </div>
    )
  }
  if (isError || !deck) {
    return (
      <p className="rounded-xl border border-destructive/30 px-5 py-10 text-center text-sm text-destructive">
        無法載入卡組。
      </p>
    )
  }

  return (
    <section className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {renaming ? (
              <div className="flex gap-2">
                <Input
                  value={nameDraft}
                  maxLength={100}
                  onChange={(event) => setNameDraft(event.target.value)}
                  aria-label="卡組名稱"
                  className="w-full max-w-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={rename}
                  disabled={renameMutation.isPending}
                >
                  儲存
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                  取消
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="truncate font-semibold">{deck.name}</h2>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="更名"
                  onClick={() => {
                    setNameDraft(deck.name)
                    setRenaming(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {deck.cardCount} 張卡片・
              {deck.assignments.length > 0
                ? `已指派 ${deck.assignments.length} 個挑戰`
                : '尚未指派給任何挑戰'}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleImport}
              aria-label="上傳 Excel"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Excel 匯入
            </Button>
          </div>
        </div>

        {deck.assignments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {deck.assignments.map((assignment) => (
              <span
                key={assignment.cohortId}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
              >
                {assignment.cohortName}
                <button
                  type="button"
                  className="rounded-full hover:bg-primary/20"
                  aria-label={`解除指派 ${assignment.cohortName}`}
                  onClick={() => unassign(assignment.cohortId, assignment.cohortName)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <form className="mt-4 flex gap-2" onSubmit={addCard}>
          <div className="min-w-0 flex-1">
            <label htmlFor="new-card" className="sr-only">
              新卡片內容
            </label>
            <Input
              id="new-card"
              value={newCard}
              maxLength={CARD_MAX_LENGTH}
              placeholder={`新增一張卡片（最多 ${CARD_MAX_LENGTH} 字）`}
              onChange={(event) => setNewCard(event.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={addMutation.isPending || !newCard.trim()}>
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            新增
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {importResult && (
          <div className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
            匯入 {importResult.imported} 張
            {importResult.errors.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-xs text-destructive">
                {importResult.errors.map((item) => (
                  <li key={item.row}>
                    第 {item.row} 列：{item.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="max-h-[560px] overflow-auto">
        {deck.cards.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            尚無卡片，手動新增或用 Excel 匯入。
          </p>
        )}
        {deck.cards.length > 0 && (
          <ul className="divide-y divide-border">
            {deck.cards.map((card, index) => (
              <CardRow key={card.id} deckId={deckId} card={card} index={index} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InspirationDecksPage() {
  const { data: decks, isLoading, isError, refetch, isFetching } = useInspirationDecks()
  const deleteMutation = useDeleteInspirationDeck()
  const duplicateMutation = useDuplicateInspirationDeck()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!decks) return
    if (selectedId === null || !decks.some((deck) => deck.id === selectedId)) {
      setSelectedId(decks[0]?.id ?? null)
    }
  }, [decks, selectedId])

  async function remove(deck: InspirationDeckSummary) {
    const warning =
      deck.assignments.length > 0
        ? `此卡組已指派給 ${deck.assignments.length} 個挑戰，刪除後這些挑戰將無法抽卡。`
        : ''
    if (!window.confirm(`確定刪除卡組「${deck.name}」？${warning}`)) return
    setError(null)
    try {
      await deleteMutation.mutateAsync(deck.id)
    } catch (err) {
      setError(errorMessage(err, '刪除失敗'))
    }
  }

  async function duplicate(deck: InspirationDeckSummary) {
    setError(null)
    try {
      const res = await duplicateMutation.mutateAsync(deck.id)
      setSelectedId(res.data.data.id)
    } catch (err) {
      setError(errorMessage(err, '複製失敗'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="靈感卡卡組"
        description="建立可重複使用的靈感卡卡組，指派給共同挑戰後參與者每日可抽 3 張。"
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              重新整理
            </Button>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              建立卡組
            </Button>
          </div>
        }
      />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          載入卡組中
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-12 text-center">
          <p className="text-sm text-destructive">無法載入卡組資料。</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
            再試一次
          </Button>
        </div>
      )}

      {!isLoading && !isError && decks?.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-5 py-16 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h2 className="mt-4 font-semibold">尚未建立卡組</h2>
          <p className="mt-1 text-sm text-muted-foreground">建立第一個卡組，再指派給共同挑戰。</p>
          <Button type="button" className="mt-5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            建立卡組
          </Button>
        </div>
      )}

      {!isLoading && decks && decks.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-[minmax(320px,1fr)_minmax(0,1.6fr)]">
          <section className="overflow-hidden rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>卡組</TableHead>
                  <TableHead className="text-right">卡片</TableHead>
                  <TableHead className="w-24 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decks.map((deck) => (
                  <TableRow
                    key={deck.id}
                    onClick={() => setSelectedId(deck.id)}
                    className={cn('cursor-pointer', selectedId === deck.id && 'bg-primary/5')}
                  >
                    <TableCell className="max-w-[240px]">
                      <p className="truncate font-medium text-foreground">{deck.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {deck.assignments.length > 0
                          ? deck.assignments.map((assignment) => assignment.cohortName).join('、')
                          : '未指派'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="primary">{deck.cardCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="複製卡組"
                          disabled={duplicateMutation.isPending}
                          onClick={(event) => {
                            event.stopPropagation()
                            duplicate(deck)
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="刪除卡組"
                          disabled={deleteMutation.isPending}
                          onClick={(event) => {
                            event.stopPropagation()
                            remove(deck)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {selectedId !== null && <DeckDetail key={selectedId} deckId={selectedId} />}
        </div>
      )}

      <CreateDeckDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={setSelectedId} />
    </div>
  )
}
