import { FileText, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { EmailTemplate } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
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
  useCreateEmailTemplate,
  useDeleteEmailTemplate,
  useEmailTemplates,
} from '@/hooks/useEmailTemplates'
import { detectVariables } from '@/lib/email-preview'

interface TemplateFormData {
  name: string
  subject: string
  body: string
}

const emptyForm: TemplateFormData = { name: '', subject: '', body: '' }

function TemplateDialog({
  trigger,
  initial,
  onSave,
  isSaving,
}: {
  trigger: React.ReactNode
  initial?: EmailTemplate
  onSave: (data: TemplateFormData) => Promise<void> | void
  isSaving: boolean
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<TemplateFormData>(
    initial
      ? {
          name: initial.name,
          subject: initial.subject,
          body: initial.body,
        }
      : emptyForm,
  )
  const [copySearch, setCopySearch] = useState('')
  const [showCopyDropdown, setShowCopyDropdown] = useState(false)
  const { data: allTemplates } = useEmailTemplates()

  const copyOptions = !initial
    ? (allTemplates ?? []).filter(
        (t) =>
          t.name.toLowerCase().includes(copySearch.toLowerCase()) ||
          t.subject.toLowerCase().includes(copySearch.toLowerCase()),
      )
    : []

  function applyTemplate(tpl: EmailTemplate) {
    setForm((prev) => ({
      ...prev,
      subject: tpl.subject,
      body: tpl.body,
    }))
    setCopySearch(tpl.name)
    setShowCopyDropdown(false)
  }

  function clearCopy() {
    setCopySearch('')
    setForm(emptyForm)
  }

  function handleOpen(v: boolean) {
    setOpen(v)
    if (v) {
      setForm(
        initial
          ? {
              name: initial.name,
              subject: initial.subject,
              body: initial.body,
            }
          : emptyForm,
      )
      setCopySearch('')
      setShowCopyDropdown(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await onSave(form)
      setOpen(false)
    } catch {
      // keep dialog open on error
    }
  }

  function field(id: keyof TemplateFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [id]: e.target.value }))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 h-auto max-h-[85vh] max-w-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{initial ? '編輯模板' : '新增模板'}</h2>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {!initial && (
            <div>
              <label
                htmlFor="tpl-copy"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                從現有模板帶入（可選）
              </label>
              <div className="relative">
                <input
                  id="tpl-copy"
                  type="text"
                  value={copySearch}
                  onChange={(e) => {
                    setCopySearch(e.target.value)
                    setShowCopyDropdown(true)
                  }}
                  onFocus={() => setShowCopyDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCopyDropdown(false), 150)}
                  placeholder="搜尋模板名稱或主旨…"
                  className="w-full rounded border border-border bg-background px-3 py-1.5 pr-8 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {copySearch && (
                  <button
                    type="button"
                    onClick={clearCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="清除"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {showCopyDropdown && copyOptions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-background shadow-md">
                    {copyOptions.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onMouseDown={() => applyTemplate(tpl)}
                        className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted"
                      >
                        <span className="text-sm font-medium text-foreground">{tpl.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {tpl.subject}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {showCopyDropdown && copySearch && copyOptions.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-md">
                    找不到符合的模板
                  </div>
                )}
              </div>
              {copySearch && (
                <p className="mt-1 text-xs text-muted-foreground">
                  已帶入「{copySearch}」的內容，可自由修改下方欄位。
                </p>
              )}
              <div className="mt-4 border-t border-border" />
            </div>
          )}

          <div>
            <label htmlFor="tpl-name" className="mb-1 block text-sm font-medium">
              模板名稱 <span className="text-red-500">*</span>
            </label>
            <Input
              id="tpl-name"
              type="text"
              required
              maxLength={200}
              placeholder="例：歡迎信"
              value={form.name}
              onChange={field('name')}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="tpl-subject" className="mb-1 block text-sm font-medium">
              主旨 <span className="text-red-500">*</span>
            </label>
            <Input
              id="tpl-subject"
              type="text"
              required
              maxLength={500}
              placeholder="例：歡迎加入島島！"
              value={form.subject}
              onChange={field('subject')}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="tpl-body" className="mb-1 block text-sm font-medium">
              內容 <span className="text-red-500">*</span>
            </label>
            <p className="mb-1 text-xs text-muted-foreground">
              支援 HTML，變數請以 <code className="rounded bg-muted px-1">{'{{variable}}'}</code>{' '}
              格式書寫
            </p>
            <Textarea
              id="tpl-body"
              required
              rows={10}
              placeholder={'<p>Hi {{nickname}}，</p>\n<p>...</p>'}
              value={form.body}
              onChange={field('body')}
              className="w-full resize-y font-mono"
            />
          </div>

          {detectVariables(form.body).length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">偵測到的變數</p>
              <div className="flex flex-wrap gap-1.5">
                {detectVariables(form.body).map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                取消
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? '儲存變更' : '建立模板'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({
  template,
  onConfirm,
  isDeleting,
}: {
  template: EmailTemplate
  onConfirm: () => void
  isDeleting: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          title="刪除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="h-auto max-w-sm p-0">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">確認刪除模板？</p>
              <p className="mt-1 text-sm text-muted-foreground">
                「{template.name}」刪除後無法復原，使用此模板的觸發規則可能受影響。
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                取消
              </button>
            </DialogClose>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                onConfirm()
                setOpen(false)
              }}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              刪除
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function EmailTemplatesPage() {
  const { data: templates, isLoading, isError } = useEmailTemplates()
  const createMutation = useCreateEmailTemplate()
  const deleteMutation = useDeleteEmailTemplate()

  async function handleCreate(form: TemplateFormData) {
    await createMutation.mutateAsync({
      name: form.name,
      subject: form.subject,
      body: form.body,
      variables: detectVariables(form.body),
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="信件模板"
        description="建立與編輯系統郵件模板，支援動態變數替換，統一信件風格。"
        actions={
          <TemplateDialog
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                新增模板
              </button>
            }
            onSave={handleCreate}
            isSaving={createMutation.isPending}
          />
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-5">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              載入模板失敗，請重新整理頁面。
            </div>
          )}

          {!isLoading && !isError && templates && templates.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <FileText className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">尚無模板，點擊「新增模板」開始建立。</p>
            </div>
          )}

          {!isLoading && templates && templates.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-left text-xs">
                    <TableHead>模板名稱</TableHead>
                    <TableHead>主旨</TableHead>
                    <TableHead>變數</TableHead>
                    <TableHead>建立時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {templates.map((tpl) => (
                    <TableRow key={tpl.id} className="bg-card">
                      <TableCell className="font-medium text-foreground">{tpl.name}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">
                        {tpl.subject}
                      </TableCell>
                      <TableCell>
                        {tpl.variables.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {tpl.variables.map((v) => (
                              <span
                                key={v}
                                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(tpl.createdAt).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/email-templates/${tpl.id}/edit`}
                            className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="編輯"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <DeleteConfirmDialog
                            template={tpl}
                            onConfirm={() => deleteMutation.mutate(tpl.id)}
                            isDeleting={deleteMutation.isPending}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
