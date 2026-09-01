import {
  Archive,
  CalendarDays,
  Copy,
  Flag,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type {
  ChallengeCohort,
  ChallengeCohortCreate,
  ChallengeProgram,
  ChallengeTemplate,
  ChallengeTemplateCreate,
  PracticeTimePeriod,
} from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPracticePublicUrl } from '@/config'
import {
  useArchiveChallengeCohort,
  useArchiveChallengeProgram,
  useChallengeCohorts,
  useChallengeParticipants,
  useChallengePrograms,
  useChallengeTemplates,
  useCreateChallengeCohort,
  useCreateChallengeProgram,
  useCreateChallengeTemplate,
  useDeleteChallengeTemplate,
  useDuplicateChallengeCohort,
  useDuplicateChallengeProgram,
  useSetChallengeCohortStatus,
  useUpdateChallengeCohort,
  useUpdateChallengeProgram,
  useUpdateChallengeTemplate,
} from '@/hooks/useGroupChallenges'
import { useAssignInspirationDeck, useInspirationDecks } from '@/hooks/useInspirationDecks'
import { useOrganizations } from '@/hooks/useOrganizations'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ChallengeCohort['status'],
  { label: string; variant: 'default' | 'success' | 'warning' }
> = {
  draft: { label: '草稿', variant: 'warning' },
  published: { label: '已發佈', variant: 'success' },
  archived: { label: '已封存', variant: 'default' },
}

const RUN_STATUS_CONFIG: Record<
  ChallengeCohort['runStatus'],
  { label: string; className: string }
> = {
  upcoming: { label: '即將開始', className: 'bg-info/15 text-info' },
  ongoing: { label: '進行中', className: 'bg-success/15 text-success' },
  ended: { label: '已結束', className: 'bg-muted text-muted-foreground' },
}

const DURATION_OPTIONS = [
  { value: '', label: '不指定（手動填結束日）' },
  { value: '7', label: '7 天' },
  { value: '14', label: '14 天' },
  { value: '21', label: '21 天' },
  { value: '30', label: '30 天' },
]

const SESSION_OPTIONS = [
  { value: '', label: '不指定' },
  { value: '15', label: '15 分鐘' },
  { value: '30', label: '30 分鐘' },
  { value: '45', label: '45 分鐘' },
  { value: '60', label: '60 分鐘' },
]

const TIME_PERIODS: Array<{ value: PracticeTimePeriod; label: string }> = [
  { value: 'morning', label: '早晨' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '傍晚' },
  { value: 'night', label: '夜晚' },
  { value: 'commute', label: '通勤' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateInput(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return value.slice(0, 10)
}

/** 含頭尾共 durationDays 天，與後端 computeEndDate 一致 */
function computeEndDate(startDate: string, durationDays: number): string {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  start.setUTCDate(start.getUTCDate() + durationDays - 1)
  return start.toISOString().slice(0, 10)
}

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response
    return response?.data?.error?.message ?? fallback
  }
  return fallback
}

function DialogHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
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
  )
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
  )
}

// ─── Program dialog ───────────────────────────────────────────────────────────

function ProgramFormDialog({
  program,
  organizationId,
  open,
  onOpenChange,
}: {
  program: ChallengeProgram | null
  organizationId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createMutation = useCreateChallengeProgram()
  const updateMutation = useUpdateChallengeProgram()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const isEditing = program !== null
  const isSaving = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    setName(program?.name ?? '')
    setDescription(program?.description ?? '')
    setError(null)
  }, [open, program])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const data = { name: name.trim(), description: description.trim() || null }
    try {
      if (program) {
        await updateMutation.mutateAsync({ programId: program.id, data })
      } else {
        if (organizationId === null) {
          setError('請先選擇所屬組織')
          return
        }
        await createMutation.mutateAsync({ ...data, organizationId })
      }
      onOpenChange(false)
    } catch (err) {
      setError(errorMessage(err, '儲存失敗，請稍後再試'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[85vh] max-w-xl overflow-y-auto p-0">
        <DialogHeader
          title={isEditing ? '編輯挑戰主題' : '建立挑戰主題'}
          description="主題是共同挑戰的系列名稱；實際開放加入的是主題底下的各期挑戰。"
        />
        <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="program-name" className="mb-1.5 block text-sm font-medium">
              主題名稱
            </label>
            <Input
              id="program-name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="program-description" className="mb-1.5 block text-sm font-medium">
              主題介紹（顯示於探索共同挑戰頁）
            </label>
            <Textarea
              id="program-description"
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full resize-y"
            />
          </div>
          <FormError message={error} />
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? '儲存變更' : '建立主題'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Template dialog ──────────────────────────────────────────────────────────

interface TemplateFormState {
  title: string
  practiceAction: string
  durationDays: string
  sessionDurationMinutes: string
  frequencyMinDays: string
  frequencyMaxDays: string
  practiceTimePeriods: PracticeTimePeriod[]
}

const EMPTY_TEMPLATE: TemplateFormState = {
  title: '',
  practiceAction: '',
  durationDays: '',
  sessionDurationMinutes: '',
  frequencyMinDays: '',
  frequencyMaxDays: '',
  practiceTimePeriods: [],
}

function TemplateFormDialog({
  template,
  organizationId,
  open,
  onOpenChange,
  onCreated,
}: {
  template: ChallengeTemplate | null
  organizationId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (template: ChallengeTemplate) => void
}) {
  const createMutation = useCreateChallengeTemplate()
  const updateMutation = useUpdateChallengeTemplate()
  const [form, setForm] = useState<TemplateFormState>(EMPTY_TEMPLATE)
  const [error, setError] = useState<string | null>(null)
  const isSaving = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    setError(null)
    if (!template) {
      setForm(EMPTY_TEMPLATE)
      return
    }
    setForm({
      title: template.title,
      practiceAction: template.practiceAction ?? '',
      durationDays: template.durationDays ? String(template.durationDays) : '',
      sessionDurationMinutes: template.sessionDurationMinutes
        ? String(template.sessionDurationMinutes)
        : '',
      frequencyMinDays: template.frequencyMinDays ? String(template.frequencyMinDays) : '',
      frequencyMaxDays: template.frequencyMaxDays ? String(template.frequencyMaxDays) : '',
      practiceTimePeriods: template.practiceTimePeriods,
    })
  }, [open, template])

  function setField<K extends keyof TemplateFormState>(field: K, value: TemplateFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function togglePeriod(period: PracticeTimePeriod, checked: boolean) {
    setField(
      'practiceTimePeriods',
      checked
        ? [...form.practiceTimePeriods, period]
        : form.practiceTimePeriods.filter((item) => item !== period),
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const freqMin = form.frequencyMinDays ? Number(form.frequencyMinDays) : null
    const freqMax = form.frequencyMaxDays ? Number(form.frequencyMaxDays) : null
    if (freqMin !== null && freqMax !== null && freqMin > freqMax) {
      setError('每週最少天數不可大於每週最多天數')
      return
    }
    const payload: Omit<ChallengeTemplateCreate, 'organizationId'> = {
      title: form.title.trim(),
      practiceAction: form.practiceAction.trim() || null,
      durationDays: form.durationDays
        ? (Number(form.durationDays) as ChallengeTemplateCreate['durationDays'])
        : null,
      sessionDurationMinutes: form.sessionDurationMinutes
        ? (Number(form.sessionDurationMinutes) as ChallengeTemplateCreate['sessionDurationMinutes'])
        : null,
      frequencyMinDays: freqMin,
      frequencyMaxDays: freqMax,
      practiceTimePeriods: form.practiceTimePeriods,
    }
    try {
      if (template) {
        await updateMutation.mutateAsync({ templateId: template.id, data: payload })
      } else {
        const res = await createMutation.mutateAsync({ ...payload, organizationId })
        onCreated?.(res.data.data)
      }
      onOpenChange(false)
    } catch (err) {
      setError(errorMessage(err, '儲存失敗，請確認欄位後再試'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[85vh] max-w-xl overflow-y-auto p-0">
        <DialogHeader
          title={template ? '編輯實踐模板' : '建立實踐模板'}
          description="使用者加入挑戰時，會依模板自動複製一份個人實踐。持續天數決定挑戰結束日。"
        />
        <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="template-title" className="mb-1.5 block text-sm font-medium">
              實踐名稱
            </label>
            <Input
              id="template-title"
              required
              maxLength={100}
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="template-action" className="mb-1.5 block text-sm font-medium">
              具體行動
            </label>
            <Textarea
              id="template-action"
              rows={3}
              maxLength={2000}
              value={form.practiceAction}
              onChange={(event) => setField('practiceAction', event.target.value)}
              className="w-full resize-y"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="template-duration" className="mb-1.5 block text-sm font-medium">
                持續天數
              </label>
              <Select
                id="template-duration"
                value={form.durationDays}
                onValueChange={(value) => setField('durationDays', value)}
                options={DURATION_OPTIONS}
              />
            </div>
            <div>
              <label htmlFor="template-session" className="mb-1.5 block text-sm font-medium">
                每次時長
              </label>
              <Select
                id="template-session"
                value={form.sessionDurationMinutes}
                onValueChange={(value) => setField('sessionDurationMinutes', value)}
                options={SESSION_OPTIONS}
              />
            </div>
            <div>
              <label htmlFor="template-freq-min" className="mb-1.5 block text-sm font-medium">
                每週最少天數
              </label>
              <Input
                id="template-freq-min"
                type="number"
                min={1}
                max={7}
                value={form.frequencyMinDays}
                onChange={(event) => setField('frequencyMinDays', event.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="template-freq-max" className="mb-1.5 block text-sm font-medium">
                每週最多天數
              </label>
              <Input
                id="template-freq-max"
                type="number"
                min={1}
                max={7}
                value={form.frequencyMaxDays}
                onChange={(event) => setField('frequencyMaxDays', event.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium">實踐時段</legend>
            <div className="flex flex-wrap gap-4">
              {TIME_PERIODS.map((period) => (
                <label
                  key={period.value}
                  htmlFor={`template-period-${period.value}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={`template-period-${period.value}`}
                    checked={form.practiceTimePeriods.includes(period.value)}
                    onCheckedChange={(checked) => togglePeriod(period.value, checked === true)}
                  />
                  {period.label}
                </label>
              ))}
            </div>
          </fieldset>
          <FormError message={error} />
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {template ? '儲存變更' : '建立模板'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cohort dialog ────────────────────────────────────────────────────────────

interface CohortFormState {
  displayName: string
  startDate: string
  endDate: string
  joinDeadline: string
  capacity: string
  templateId: string
}

function CohortFormDialog({
  program,
  cohort,
  templates,
  open,
  onOpenChange,
  onCreateTemplate,
}: {
  program: ChallengeProgram
  cohort: ChallengeCohort | null
  templates: ChallengeTemplate[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTemplate: () => void
}) {
  const createMutation = useCreateChallengeCohort()
  const updateMutation = useUpdateChallengeCohort()
  const [form, setForm] = useState<CohortFormState>({
    displayName: '',
    startDate: '',
    endDate: '',
    joinDeadline: '',
    capacity: '',
    templateId: '',
  })
  const [error, setError] = useState<string | null>(null)
  const isSaving = createMutation.isPending || updateMutation.isPending
  const periodLocked = cohort !== null && cohort.participantCount > 0
  const selectedTemplate = templates.find((template) => String(template.id) === form.templateId)
  // 既有綁定可能是平台共用模板（不在組織模板清單中），沿用其持續天數
  const durationDays = selectedTemplate?.durationDays ?? cohort?.template?.durationDays ?? null
  const computedEndDate =
    durationDays && form.startDate ? computeEndDate(form.startDate, durationDays) : null

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm({
      displayName: cohort?.displayName ?? '',
      startDate: toDateInput(cohort?.startDate),
      endDate: toDateInput(cohort?.endDate),
      joinDeadline: toDateInput(cohort?.joinDeadline),
      capacity: cohort?.capacity ? String(cohort.capacity) : '',
      templateId: cohort?.template ? String(cohort.template.id) : '',
    })
  }, [open, cohort])

  function setField(field: keyof CohortFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const base: ChallengeCohortCreate = {
      displayName: form.displayName.trim(),
      startDate: form.startDate,
      joinDeadline: form.joinDeadline || null,
      capacity: form.capacity ? Number(form.capacity) : null,
    }
    if (!computedEndDate) base.endDate = form.endDate || undefined
    try {
      if (cohort) {
        const data = periodLocked
          ? {
              displayName: base.displayName,
              joinDeadline: base.joinDeadline,
              capacity: base.capacity,
            }
          : { ...base, templateId: form.templateId ? Number(form.templateId) : null }
        await updateMutation.mutateAsync({ programId: program.id, cohortId: cohort.id, data })
      } else {
        await createMutation.mutateAsync({
          programId: program.id,
          data: { ...base, templateId: form.templateId ? Number(form.templateId) : null },
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError(errorMessage(err, '儲存失敗，請確認欄位後再試'))
    }
  }

  const templateOptions = [
    { value: '', label: '尚未指定（發佈前必須指定）' },
    ...templates.map((template) => ({
      value: String(template.id),
      label: template.durationDays
        ? `${template.title}（${template.durationDays} 天）`
        : template.title,
    })),
  ]
  if (cohort?.template && !templates.some((template) => template.id === cohort.template?.id)) {
    templateOptions.push({
      value: String(cohort.template.id),
      label: `${cohort.template.title}（平台共用模板）`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[85vh] max-w-xl overflow-y-auto p-0">
        <DialogHeader
          title={cohort ? '編輯挑戰' : `在「${program.name}」新增一期挑戰`}
          description="所有參與者共用同一段起訖日；指定模板與開始日後即可發佈至探索共同挑戰頁。"
        />
        <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="cohort-name" className="mb-1.5 block text-sm font-medium">
              挑戰名稱（顯示於卡片）
            </label>
            <Input
              id="cohort-name"
              required
              maxLength={100}
              value={form.displayName}
              onChange={(event) => setField('displayName', event.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="cohort-template" className="mb-1.5 block text-sm font-medium">
              使用模板
            </label>
            <div className="flex gap-2">
              <Select
                id="cohort-template"
                value={form.templateId}
                onValueChange={(value) => setField('templateId', value)}
                options={templateOptions}
                disabled={periodLocked}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={onCreateTemplate}
                disabled={periodLocked}
              >
                <Plus className="h-4 w-4" />
                新模板
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cohort-start" className="mb-1.5 block text-sm font-medium">
                開始日
              </label>
              <Input
                id="cohort-start"
                type="date"
                required
                value={form.startDate}
                onChange={(event) => setField('startDate', event.target.value)}
                disabled={periodLocked}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="cohort-end" className="mb-1.5 block text-sm font-medium">
                結束日
              </label>
              <Input
                id="cohort-end"
                type="date"
                required={!computedEndDate}
                value={computedEndDate ?? form.endDate}
                onChange={(event) => setField('endDate', event.target.value)}
                disabled={periodLocked || computedEndDate !== null}
                className="w-full"
              />
              {computedEndDate && (
                <p className="mt-1 text-xs text-muted-foreground">
                  由模板持續天數（{durationDays} 天）自動推算
                </p>
              )}
            </div>
            <div>
              <label htmlFor="cohort-deadline" className="mb-1.5 block text-sm font-medium">
                加入截止日（選填）
              </label>
              <Input
                id="cohort-deadline"
                type="date"
                value={form.joinDeadline}
                onChange={(event) => setField('joinDeadline', event.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="cohort-capacity" className="mb-1.5 block text-sm font-medium">
                名額上限（選填）
              </label>
              <Input
                id="cohort-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(event) => setField('capacity', event.target.value)}
                className="w-full"
              />
            </div>
          </div>
          {periodLocked && (
            <p className="text-xs text-warning">
              已有 {cohort?.participantCount} 人加入，期間與模板已鎖定，僅能修改名稱、截止日與名額。
            </p>
          )}
          <FormError message={error} />
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {cohort ? '儲存變更' : '建立草稿'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Deck assign dialog ───────────────────────────────────────────────────────

function DeckAssignDialog({
  cohort,
  open,
  onOpenChange,
}: {
  cohort: ChallengeCohort | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: decks, isLoading } = useInspirationDecks()
  const assignMutation = useAssignInspirationDeck()
  const [error, setError] = useState<string | null>(null)
  const assignedIds = new Set(cohort?.decks.map((deck) => deck.id) ?? [])

  async function toggle(deckId: number, assign: boolean) {
    if (!cohort) return
    setError(null)
    try {
      await assignMutation.mutateAsync({ deckId, cohortId: cohort.id, assign })
    } catch (err) {
      setError(errorMessage(err, '指派失敗，請稍後再試'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[85vh] max-w-md overflow-y-auto p-0">
        <DialogHeader
          title="指派靈感卡卡組"
          description={`指派後「${cohort?.displayName ?? ''}」的卡片會出現抽卡入口。`}
        />
        <div className="space-y-2 px-6 py-5">
          {isLoading && (
            <p className="text-sm text-muted-foreground">
              <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
              載入卡組中
            </p>
          )}
          {decks?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              尚未建立任何卡組，請先到「靈感卡卡組」建立。
            </p>
          )}
          {decks?.map((deck) => {
            const assigned = assignedIds.has(deck.id)
            return (
              <label
                key={deck.id}
                htmlFor={`assign-deck-${deck.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Checkbox
                    id={`assign-deck-${deck.id}`}
                    checked={assigned}
                    disabled={assignMutation.isPending}
                    onCheckedChange={(checked) => toggle(deck.id, checked === true)}
                  />
                  {deck.name}
                </span>
                <span className="text-xs text-muted-foreground">{deck.cardCount} 張</span>
              </label>
            )
          })}
          <FormError message={error} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Participants sheet ───────────────────────────────────────────────────────

function ParticipantsSheet({
  programId,
  cohort,
  onOpenChange,
}: {
  programId: number
  cohort: ChallengeCohort | null
  onOpenChange: (open: boolean) => void
}) {
  const { data: participants, isLoading } = useChallengeParticipants(programId, cohort?.id ?? null)
  return (
    <Sheet open={cohort !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <SheetTitle className="text-base font-semibold">參與者</SheetTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {cohort?.displayName}・依加入時間排序
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="關閉"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              載入中
            </div>
          )}
          {participants?.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">尚無人加入。</p>
          )}
          {participants && participants.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>使用者</TableHead>
                  <TableHead>加入時間</TableHead>
                  <TableHead className="text-right">打卡</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => (
                  <TableRow key={participant.enrollmentId}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <p className="font-medium">{participant.nickname ?? '未設定暱稱'}</p>
                      <p className="text-xs text-muted-foreground">User ID {participant.userId}</p>
                      {participant.practiceId && (
                        <a
                          href={getPracticePublicUrl(participant.practiceId)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          查看實踐
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {participant.joinedAt
                        ? participant.joinedAt.slice(0, 16).replace('T', ' ')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">{participant.checkinCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Cohort panel ─────────────────────────────────────────────────────────────

function CohortPanel({
  program,
  templates,
  onCreateTemplate,
}: {
  program: ChallengeProgram
  templates: ChallengeTemplate[]
  onCreateTemplate: () => void
}) {
  const { data: cohorts, isLoading, isError } = useChallengeCohorts(program.id)
  const statusMutation = useSetChallengeCohortStatus()
  const archiveMutation = useArchiveChallengeCohort()
  const duplicateMutation = useDuplicateChallengeCohort()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ChallengeCohort | null>(null)
  const [deckTarget, setDeckTarget] = useState<ChallengeCohort | null>(null)
  const [participantsTarget, setParticipantsTarget] = useState<ChallengeCohort | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const visibleCohorts = (cohorts ?? []).filter(
    (cohort) => showArchived || cohort.status !== 'archived',
  )
  const archivedCount = (cohorts ?? []).filter((cohort) => cohort.status === 'archived').length
  // 卡組指派後 cohorts 會重新抓取，讓指派彈窗拿最新狀態
  const liveDeckTarget = deckTarget
    ? (cohorts?.find((cohort) => cohort.id === deckTarget.id) ?? deckTarget)
    : null

  async function runAction(action: Promise<unknown>, fallback: string) {
    setActionError(null)
    try {
      await action
    } catch (err) {
      setActionError(errorMessage(err, fallback))
    }
  }

  function togglePublish(cohort: ChallengeCohort) {
    const next = cohort.status === 'published' ? 'draft' : 'published'
    const verb = next === 'published' ? '發佈' : '下架'
    if (next === 'draft' && cohort.participantCount > 0) {
      if (
        !window.confirm(
          `已有 ${cohort.participantCount} 人加入，下架後探索頁不再顯示但參與者的實踐保留。確定要下架「${cohort.displayName}」？`,
        )
      )
        return
    } else if (!window.confirm(`確定要${verb}「${cohort.displayName}」？`)) {
      return
    }
    runAction(
      statusMutation.mutateAsync({ programId: program.id, cohortId: cohort.id, status: next }),
      `${verb}失敗`,
    )
  }

  function archive(cohort: ChallengeCohort) {
    if (
      !window.confirm(
        `封存後「${cohort.displayName}」不再顯示於探索頁，參與者的實踐保留。確定封存？`,
      )
    )
      return
    runAction(
      archiveMutation.mutateAsync({ programId: program.id, cohortId: cohort.id }),
      '封存失敗',
    )
  }

  function duplicate(cohort: ChallengeCohort) {
    runAction(
      duplicateMutation.mutateAsync({ programId: program.id, cohortId: cohort.id }),
      '複製失敗',
    )
  }

  return (
    <section className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">挑戰（期）</h2>
            <Badge variant="primary">{visibleCohorts.length}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{program.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {archivedCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived((v) => !v)}
            >
              {showArchived ? '隱藏已封存' : `顯示已封存（${archivedCount}）`}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            新增一期
          </Button>
        </div>
      </div>
      {actionError && (
        <p className="border-b border-border bg-destructive/5 px-5 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}
      <div className="overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            載入挑戰中
          </div>
        )}
        {isError && (
          <p className="px-5 py-10 text-center text-sm text-destructive">無法載入挑戰。</p>
        )}
        {!isLoading && !isError && visibleCohorts.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            尚未建立任何一期，點「新增一期」開始。
          </p>
        )}
        {visibleCohorts.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>挑戰</TableHead>
                <TableHead>期間</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>模板 / 卡組</TableHead>
                <TableHead className="text-right">參與</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCohorts.map((cohort) => {
                const status = STATUS_CONFIG[cohort.status]
                const run = RUN_STATUS_CONFIG[cohort.runStatus]
                const isArchived = cohort.status === 'archived'
                return (
                  <TableRow key={cohort.id} className={cn(isArchived && 'opacity-60')}>
                    <TableCell className="max-w-xs">
                      <p className="font-medium">{cohort.displayName}</p>
                      <p className="text-xs text-muted-foreground">ID {cohort.id}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(cohort.startDate)} ～ {formatDate(cohort.endDate)}
                      {cohort.joinDeadline && (
                        <p className="text-xs text-muted-foreground">
                          截止 {formatDate(cohort.joinDeadline)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <span
                          className={cn(
                            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                            run.className,
                          )}
                        >
                          {run.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p>
                        {cohort.template ? (
                          cohort.template.title
                        ) : (
                          <span className="text-warning">未指定模板</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cohort.decks.length > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {cohort.decks.map((deck) => deck.name).join('、')}
                          </span>
                        ) : (
                          '無卡組'
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm hover:text-primary hover:underline"
                        onClick={() => setParticipantsTarget(cohort)}
                      >
                        <Users className="h-3.5 w-3.5" />
                        {cohort.participantCount}
                        {cohort.capacity ? ` / ${cohort.capacity}` : ''}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <Button
                          type="button"
                          size="xs"
                          className="whitespace-nowrap"
                          variant={cohort.status === 'published' ? 'outline' : 'primary'}
                          disabled={isArchived || statusMutation.isPending}
                          onClick={() => togglePublish(cohort)}
                        >
                          <Rocket className="h-3.5 w-3.5" />
                          {cohort.status === 'published' ? '下架' : '發佈'}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="編輯"
                          title="編輯"
                          disabled={isArchived}
                          onClick={() => {
                            setEditing(cohort)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="指派卡組"
                          title="指派卡組"
                          disabled={isArchived}
                          onClick={() => setDeckTarget(cohort)}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="複製"
                          title="複製為草稿"
                          disabled={duplicateMutation.isPending}
                          onClick={() => duplicate(cohort)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="封存"
                          title="封存"
                          disabled={isArchived || archiveMutation.isPending}
                          onClick={() => archive(cohort)}
                        >
                          <Archive className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <CohortFormDialog
        program={program}
        cohort={editing}
        templates={templates}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateTemplate={onCreateTemplate}
      />
      <DeckAssignDialog
        cohort={liveDeckTarget}
        open={deckTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeckTarget(null)
        }}
      />
      <ParticipantsSheet
        programId={program.id}
        cohort={participantsTarget}
        onOpenChange={(open) => {
          if (!open) setParticipantsTarget(null)
        }}
      />
    </section>
  )
}

// ─── Template panel ───────────────────────────────────────────────────────────

function TemplatePanel({
  organizationId,
  templates,
  isLoading,
  onCreate,
  onEdit,
}: {
  organizationId: number
  templates: ChallengeTemplate[]
  isLoading: boolean
  onCreate: () => void
  onEdit: (template: ChallengeTemplate) => void
}) {
  const deleteMutation = useDeleteChallengeTemplate()
  const [error, setError] = useState<string | null>(null)

  async function remove(template: ChallengeTemplate) {
    if (!window.confirm(`確定刪除模板「${template.title}」？已綁定過挑戰的模板無法刪除。`)) return
    setError(null)
    try {
      await deleteMutation.mutateAsync(template.id)
    } catch (err) {
      setError(errorMessage(err, '刪除失敗'))
    }
  }

  return (
    <section className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">實踐模板</h2>
            <Badge variant="primary">{templates.length}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            組織 ID {organizationId} 的模板，可重複用於不同期
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          新模板
        </Button>
      </div>
      {error && (
        <p className="border-b border-border bg-destructive/5 px-5 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="max-h-[480px] overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            載入模板中
          </div>
        )}
        {!isLoading && templates.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">尚無模板。</p>
        )}
        {templates.length > 0 && (
          <ul className="divide-y divide-border">
            {templates.map((template) => (
              <li key={template.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{template.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {template.durationDays ? `${template.durationDays} 天` : '未設持續天數'}
                    {template.boundCohortIds.length > 0 &&
                      `・已用於 ${template.boundCohortIds.length} 期`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="編輯模板"
                    onClick={() => onEdit(template)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="刪除模板"
                    disabled={template.boundCohortIds.length > 0 || deleteMutation.isPending}
                    onClick={() => remove(template)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GroupChallengesPage() {
  const { data: organizations } = useOrganizations()
  const [organizationFilter, setOrganizationFilter] = useState('')
  const organizationId = organizationFilter ? Number(organizationFilter) : undefined
  const {
    data: programs,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useChallengePrograms(organizationId)
  const archiveMutation = useArchiveChallengeProgram()
  const duplicateMutation = useDuplicateChallengeProgram()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [programDialogOpen, setProgramDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<ChallengeProgram | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ChallengeTemplate | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!programs) return
    if (selectedId === null || !programs.some((program) => program.id === selectedId)) {
      setSelectedId(programs[0]?.id ?? null)
    }
  }, [programs, selectedId])

  const selectedProgram = programs?.find((program) => program.id === selectedId) ?? null
  const templateOrganizationId = selectedProgram?.organizationId ?? organizationId ?? null
  const { data: templates, isLoading: templatesLoading } =
    useChallengeTemplates(templateOrganizationId)

  const organizationOptions = [
    { value: '', label: '全部組織' },
    ...(organizations ?? []).map((organization) => ({
      value: String(organization.id),
      label: organization.name,
    })),
  ]
  // 建立主題時：有篩選就用篩選的組織；否則沿用目前選取主題的組織；再不然用第一個啟用組織
  const createOrganizationId =
    organizationId ??
    selectedProgram?.organizationId ??
    organizations?.find((organization) => organization.status === 'active')?.id ??
    null

  async function archiveProgram(program: ChallengeProgram) {
    if (!window.confirm(`確定封存主題「${program.name}」？底下需先封存所有挑戰。`)) return
    setActionError(null)
    try {
      await archiveMutation.mutateAsync(program.id)
    } catch (err) {
      setActionError(errorMessage(err, '封存失敗'))
    }
  }

  async function duplicateProgram(program: ChallengeProgram) {
    setActionError(null)
    try {
      await duplicateMutation.mutateAsync(program.id)
    } catch (err) {
      setActionError(errorMessage(err, '複製失敗'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="共同挑戰"
        description="以 lighthouse 模式管理共同挑戰：建立主題、在主題底下開期、指定模板與開始日後發佈至探索共同挑戰頁。"
        actions={
          <div className="flex gap-2">
            <Select
              id="challenge-organization-filter"
              aria-label="篩選組織"
              value={organizationFilter}
              onValueChange={setOrganizationFilter}
              options={organizationOptions}
              className="w-44"
            />
            <Button
              type="button"
              variant="outline"
              className="whitespace-nowrap"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              重新整理
            </Button>
            <Button
              type="button"
              className="whitespace-nowrap"
              onClick={() => {
                setEditingProgram(null)
                setProgramDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              建立主題
            </Button>
          </div>
        }
      />

      {actionError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          載入主題中
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-12 text-center">
          <p className="text-sm text-destructive">無法載入共同挑戰資料。</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
            再試一次
          </Button>
        </div>
      )}

      {!isLoading && !isError && programs?.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-5 py-16 text-center">
          <Flag className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h2 className="mt-4 font-semibold">尚未建立共同挑戰主題</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            先建立主題，再在主題底下新增一期挑戰。
          </p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => {
              setEditingProgram(null)
              setProgramDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            建立主題
          </Button>
        </div>
      )}

      {!isLoading && programs && programs.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>主題</TableHead>
                    <TableHead className="text-right">期數</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow
                      key={program.id}
                      onClick={() => setSelectedId(program.id)}
                      className={cn('cursor-pointer', selectedId === program.id && 'bg-primary/5')}
                    >
                      <TableCell className="max-w-[240px]">
                        <p className="truncate font-medium text-foreground">{program.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {program.organizationName}
                        </p>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {program.cohortCount}
                        <span className="text-xs text-muted-foreground">
                          （{program.publishedCohortCount} 發佈）
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-0.5">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="編輯主題"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditingProgram(program)
                              setProgramDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="複製主題"
                            disabled={duplicateMutation.isPending}
                            onClick={(event) => {
                              event.stopPropagation()
                              duplicateProgram(program)
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="封存主題"
                            disabled={archiveMutation.isPending}
                            onClick={(event) => {
                              event.stopPropagation()
                              archiveProgram(program)
                            }}
                          >
                            <Archive className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            {templateOrganizationId !== null && (
              <TemplatePanel
                organizationId={templateOrganizationId}
                templates={templates ?? []}
                isLoading={templatesLoading}
                onCreate={() => {
                  setEditingTemplate(null)
                  setTemplateDialogOpen(true)
                }}
                onEdit={(template) => {
                  setEditingTemplate(template)
                  setTemplateDialogOpen(true)
                }}
              />
            )}
          </div>

          {selectedProgram && (
            <CohortPanel
              program={selectedProgram}
              templates={templates ?? []}
              onCreateTemplate={() => {
                setEditingTemplate(null)
                setTemplateDialogOpen(true)
              }}
            />
          )}
        </div>
      )}

      <ProgramFormDialog
        program={editingProgram}
        organizationId={createOrganizationId}
        open={programDialogOpen}
        onOpenChange={setProgramDialogOpen}
      />
      {templateOrganizationId !== null && (
        <TemplateFormDialog
          template={editingTemplate}
          organizationId={templateOrganizationId}
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
        />
      )}
    </div>
  )
}
