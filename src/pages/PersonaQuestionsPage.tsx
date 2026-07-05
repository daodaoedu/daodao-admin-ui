import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  createPersonaQuestion,
  deletePersonaQuestion,
  listPersonaQuestions,
  updatePersonaQuestion,
  upsertPersonaTranslation,
} from '@/api/admin-persona'
import type { AdminPersonaQuestion, PersonaQuestionType } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const QUESTION_TYPE_LABELS: Record<PersonaQuestionType, string> = {
  choice: '選擇題',
  sentence_completion: '填空題',
  scenario: '情境題',
}

const QUESTION_TYPE_OPTIONS: Array<{ value: PersonaQuestionType; label: string }> = [
  { value: 'sentence_completion', label: '填空題' },
  { value: 'choice', label: '選擇題' },
  { value: 'scenario', label: '情境題' },
]

function getTranslation(q: AdminPersonaQuestion, locale: string) {
  return q.translations.find((t) => t.locale === locale)
}

interface FormState {
  questionType: PersonaQuestionType
  isNewUserPriority: boolean
  zhPrompt: string
  zhOptions: string
  enPrompt: string
  enOptions: string
}

function defaultForm(): FormState {
  return {
    questionType: 'sentence_completion',
    isNewUserPriority: false,
    zhPrompt: '',
    zhOptions: '',
    enPrompt: '',
    enOptions: '',
  }
}

function questionToForm(q: AdminPersonaQuestion): FormState {
  const zh = getTranslation(q, 'zh-TW')
  const en = getTranslation(q, 'en')
  return {
    questionType: q.questionType,
    isNewUserPriority: q.isNewUserPriority,
    zhPrompt: zh?.prompt ?? '',
    zhOptions: zh?.options?.join('\n') ?? '',
    enPrompt: en?.prompt ?? '',
    enOptions: en?.options?.join('\n') ?? '',
  }
}

function parseOptions(raw: string): string[] | null {
  const lines = raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  return lines.length > 0 ? lines : null
}

export function PersonaQuestionsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminPersonaQuestion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminPersonaQuestion | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [saving, setSaving] = useState(false)

  const queryClient = useQueryClient()

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['persona-questions'],
    queryFn: () => listPersonaQuestions().then((r) => r.data.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deletePersonaQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona-questions'] })
      setDeleteTarget(null)
    },
  })

  function openCreate() {
    setForm(defaultForm())
    setCreateOpen(true)
  }

  function openEdit(q: AdminPersonaQuestion) {
    setForm(questionToForm(q))
    setEditTarget(q)
  }

  function handleFormChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const hasOptions = form.questionType === 'choice'
      const zhOptions = hasOptions ? parseOptions(form.zhOptions) : null
      const enOptions = hasOptions ? parseOptions(form.enOptions) : null

      if (createOpen) {
        const translations: AdminPersonaQuestion['translations'] = []
        if (form.zhPrompt)
          translations.push({ locale: 'zh-TW', prompt: form.zhPrompt, options: zhOptions })
        if (form.enPrompt)
          translations.push({ locale: 'en', prompt: form.enPrompt, options: enOptions })
        await createPersonaQuestion({
          questionType: form.questionType,
          isNewUserPriority: form.isNewUserPriority,
          translations,
        })
        setCreateOpen(false)
      } else if (editTarget) {
        await updatePersonaQuestion(editTarget.id, {
          questionType: form.questionType,
          isNewUserPriority: form.isNewUserPriority,
        })
        if (form.zhPrompt) {
          await upsertPersonaTranslation(editTarget.id, 'zh-TW', {
            prompt: form.zhPrompt,
            options: zhOptions,
          })
        }
        if (form.enPrompt) {
          await upsertPersonaTranslation(editTarget.id, 'en', {
            prompt: form.enPrompt,
            options: enOptions,
          })
        }
        setEditTarget(null)
      }
      queryClient.invalidateQueries({ queryKey: ['persona-questions'] })
    } finally {
      setSaving(false)
    }
  }

  function closeFormDialog() {
    setCreateOpen(false)
    setEditTarget(null)
  }

  const isFormOpen = createOpen || editTarget !== null

  return (
    <div className="space-y-6">
      <PageHeader
        title="人物誌題目"
        description="管理人物誌問卷的題目與多語系翻譯"
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增題目
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-left">
                <TableHead className="w-12">ID</TableHead>
                <TableHead>中文題目</TableHead>
                <TableHead>英文題目</TableHead>
                <TableHead className="w-28">類型</TableHead>
                <TableHead className="w-24">新用戶優先</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => {
                const zh = getTranslation(q, 'zh-TW')
                const en = getTranslation(q, 'en')
                return (
                  <TableRow key={q.id} className="last:border-0">
                    <TableCell className="text-muted-foreground">{q.id}</TableCell>
                    <TableCell className="max-w-xs">
                      <span className="line-clamp-2">{zh?.prompt ?? '—'}</span>
                    </TableCell>
                    <TableCell className="max-w-xs text-muted-foreground">
                      <span className="line-clamp-2">{en?.prompt ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {QUESTION_TYPE_LABELS[q.questionType] ?? q.questionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {q.isNewUserPriority && <Badge variant="success">優先</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(q)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(q)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    尚無題目
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeFormDialog()
        }}
      >
        <DialogContent className="max-w-2xl">
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">{createOpen ? '新增題目' : '編輯題目'}</h2>

            <div className="flex items-end gap-6">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium" htmlFor="q-type">
                  題目類型
                </label>
                <select
                  id="q-type"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.questionType}
                  onChange={(e) =>
                    handleFormChange('questionType', e.target.value as PersonaQuestionType)
                  }
                >
                  {QUESTION_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pb-0.5">
                <Checkbox
                  id="q-priority"
                  checked={form.isNewUserPriority}
                  onCheckedChange={(v) => handleFormChange('isNewUserPriority', v === true)}
                />
                <label htmlFor="q-priority" className="cursor-pointer text-sm font-medium">
                  新用戶優先顯示
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="q-zh-prompt">
                  中文題目（zh-TW）
                </label>
                <textarea
                  id="q-zh-prompt"
                  rows={3}
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.zhPrompt}
                  onChange={(e) => handleFormChange('zhPrompt', e.target.value)}
                  placeholder="例：最想瞬間「下載」的技能？"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="q-en-prompt">
                  英文題目（en）
                </label>
                <textarea
                  id="q-en-prompt"
                  rows={3}
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.enPrompt}
                  onChange={(e) => handleFormChange('enPrompt', e.target.value)}
                  placeholder='e.g. Skill you&apos;d "download" instantly?'
                />
              </div>
            </div>

            {form.questionType === 'choice' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="q-zh-opts">
                    中文選項（每行一個）
                  </label>
                  <textarea
                    id="q-zh-opts"
                    rows={4}
                    className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.zhOptions}
                    onChange={(e) => handleFormChange('zhOptions', e.target.value)}
                    placeholder={'選項 A\n選項 B\n選項 C'}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="q-en-opts">
                    英文選項（每行一個）
                  </label>
                  <textarea
                    id="q-en-opts"
                    rows={4}
                    className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.enOptions}
                    onChange={(e) => handleFormChange('enOptions', e.target.value)}
                    placeholder={'Option A\nOption B\nOption C'}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeFormDialog}>
                取消
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? '儲存中…' : '儲存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="max-w-sm">
          {deleteTarget && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">確認刪除</h2>
              <p className="text-sm text-muted-foreground">
                確定要刪除「
                {getTranslation(deleteTarget, 'zh-TW')?.prompt ?? `#${deleteTarget.id}`}
                」嗎？此操作無法復原，連同所有翻譯和用戶回答將一併刪除。
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                  取消
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteMut.isPending}
                  onClick={() => deleteMut.mutate(deleteTarget.id)}
                >
                  {deleteMut.isPending ? '刪除中…' : '確認刪除'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
