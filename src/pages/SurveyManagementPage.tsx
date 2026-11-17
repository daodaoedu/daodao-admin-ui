import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart2,
  Check,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Copy,
  CopyPlus,
  Download,
  Eye,
  ImagePlus,
  Images,
  Link,
  ListOrdered,
  Mail,
  Pencil,
  Plus,
  SlidersHorizontal,
  Star,
  Trash2,
  Type,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createAdminSurvey,
  deleteAdminSurvey,
  deleteAdminSurveyImage,
  deleteAdminSurveyResponse,
  getAdminSurvey,
  getAdminSurveyAnalytics,
  getAdminSurveyResponseDetail,
  listAdminSurveyImages,
  listAdminSurveyResponses,
  listAdminSurveys,
  updateAdminSurvey,
  updateAdminSurveyStatus,
  uploadAdminSurveyImage,
} from '@/api/admin-survey'
import type {
  AdminSurveyAnalytics,
  AdminSurveyDetail,
  AdminSurveyListItem,
  AdminSurveyPerQuestion,
  AdminSurveyQuestionForm,
  AdminSurveyResponseDetail,
  SurveyStatus,
} from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { SURVEY_PUBLIC_BASE } from '@/config'
import { LegacySurveyForm } from '@/features/survey/LegacySurveyForm'
import type { SurveyPageHeading } from '@/features/survey/SurveyWorkspace'
import { SurveyWorkspace, useSurveyWorkspace } from '@/features/survey/SurveyWorkspace'
import { formatAdminDateTime } from '@/lib/date-format'
import { copySurveyTitle } from '@/lib/survey-copy'
import { buildSurveyCsv } from '@/lib/survey-csv'
import { getApiErrorMessage } from '@/lib/survey-errors'
import { loadAllSurveyResponses } from '@/lib/survey-pagination'
import { invalidPreviewQuestions } from '@/lib/survey-preview'
import { surveyEditorQuestionType, surveyQuestionInputType } from '@/lib/survey-question'

const STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: '草稿',
  active: '進行中',
  closed: '已關閉',
  archived: '已封存',
}

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '進行中' },
  { value: 'closed', label: '已關閉' },
  { value: 'archived', label: '已封存' },
]

const QUESTION_TYPE_OPTIONS = [
  { value: 'single_choice', label: '單選', detail: '從選項中選擇一個答案', icon: CircleDot },
  { value: 'multiple_choice', label: '複選', detail: '可同時選擇多個答案', icon: CheckSquare },
  { value: 'text', label: '文字', detail: '讓回應者輸入文字回答', icon: Type },
  { value: 'email', label: 'Email', detail: '填寫電子郵件地址', icon: Mail },
  { value: 'link', label: 'Link', detail: '填寫網址或連結', icon: Link },
  { value: 'rating', label: '評分', detail: '以 1–5 分進行評分', icon: Star },
  { value: 'scale', label: '量表', detail: '在數值刻度上選擇位置', icon: SlidersHorizontal },
  { value: 'yesno', label: '是非', detail: '回答是或否', icon: CircleDot },
  { value: 'ranking', label: '排序', detail: '將選項依偏好排列', icon: ListOrdered },
]

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: '單選',
  multiple_choice: '複選',
  text: '文字',
  email: 'Email',
  link: 'Link',
  rating: '評分',
  yesno: '是非',
  scale: '量表',
  ranking: '排序',
}

const OPTION_TYPES = new Set(['single_choice', 'multiple_choice', 'ranking'])
class DuplicateSurveyValidationError extends Error {}
const MAX_SURVEY_LIBRARY_IMAGES = 3

type SurveyImageKind = 'logo' | 'banner'

function SurveyImageField({
  id,
  label,
  imageUrl,
  kind,
  guidance,
  onImageChange,
  onRemove,
  disabled,
  onUploadingChange,
}: {
  id: string
  label: string
  imageUrl: string
  kind: SurveyImageKind
  guidance: string
  onImageChange: (imageUrl: string) => void
  onRemove: () => void
  disabled: boolean
  onUploadingChange: (uploading: boolean) => void
}) {
  const [error, setError] = useState('')
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const qc = useQueryClient()
  const {
    data: imageLibrary = [],
    isLoading: libraryLoading,
    error: libraryError,
  } = useQuery({
    queryKey: ['admin-survey-images'],
    queryFn: () => listAdminSurveyImages().then((r) => r.data.data),
  })
  const [isUploading, setIsUploading] = useState(false)
  const visibleImages = imageLibrary.slice(0, MAX_SURVEY_LIBRARY_IMAGES)

  const handleFile = async (file: File) => {
    if (disabled || isUploading) return
    setError('')
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('請選擇 PNG、JPG 或 WebP 圖片')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('圖片大小請勿超過 8 MB')
      return
    }
    try {
      setIsUploading(true)
      onUploadingChange(true)
      const response = await uploadAdminSurveyImage(file)
      onImageChange(response.data.data.url)
      await qc.invalidateQueries({ queryKey: ['admin-survey-images'] })
    } catch {
      setError('圖片上傳失敗，請確認圖片庫是否已滿並重試')
    } finally {
      setIsUploading(false)
      onUploadingChange(false)
    }
  }

  return (
    <fieldset
      disabled={disabled || isUploading}
      className="min-w-0 space-y-2 rounded-lg border border-border p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsLibraryOpen(true)}
            aria-label={`從圖片庫選擇${label}`}
            title="從圖片庫選擇"
          >
            <Images className="h-4 w-4" />
          </Button>
          {imageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`移除${label}`}
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <label
        htmlFor={id}
        title={imageUrl ? '點擊更換圖片' : '點擊上傳圖片'}
        className={
          kind === 'banner'
            ? 'flex aspect-[10/3] cursor-pointer items-center justify-center overflow-hidden rounded-md bg-muted transition-colors hover:bg-muted/80'
            : 'flex h-20 cursor-pointer items-center justify-center overflow-hidden rounded-md bg-muted px-3 transition-colors hover:bg-muted/80'
        }
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${label}預覽`}
            className={
              kind === 'banner'
                ? 'h-full w-full object-cover'
                : 'max-h-full max-w-full object-contain'
            }
          />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        )}
      </label>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        aria-label={`上傳${label}`}
        disabled={isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
          event.currentTarget.value = ''
        }}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{guidance}</p>
      {isUploading && (
        <p role="status" className="text-xs text-muted-foreground">
          圖片上傳中…
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive dark:text-red-400">
          {error}
        </p>
      )}
      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="survey-workspace h-auto max-h-[85vh] max-w-3xl overflow-y-auto">
          <fieldset disabled={disabled || isUploading} className="min-w-0">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">圖片庫</h2>
            </div>
            {libraryLoading && <p>載入圖片中…</p>}
            {!libraryLoading && libraryError && <p role="alert">無法載入圖片庫，請關閉後重試</p>}
            {!libraryLoading && !libraryError && visibleImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleImages.map((image) => (
                  <div
                    key={image.url}
                    className="min-w-0 overflow-hidden rounded-lg border border-border"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onImageChange(image.url)
                        setIsLibraryOpen(false)
                      }}
                      className="group block w-full text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="flex h-24 items-center justify-center bg-muted p-2">
                        <img
                          src={image.url}
                          alt=""
                          className={
                            kind === 'banner'
                              ? 'h-full w-full rounded object-cover'
                              : 'max-h-full max-w-full object-contain'
                          }
                        />
                      </span>
                      <span className="block truncate px-2 py-1.5 text-xs text-muted-foreground">
                        {`圖片 #${image.id}`}
                      </span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        if (!window.confirm('從圖片庫移除？既有問卷的圖片會保留。')) return
                        try {
                          await deleteAdminSurveyImage(image.id)
                          await qc.invalidateQueries({ queryKey: ['admin-survey-images'] })
                        } catch {
                          setError('移除失敗，請重試')
                        }
                      }}
                    >
                      從圖片庫移除
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {!libraryLoading && !libraryError && !(visibleImages.length > 0) && (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                尚無已上傳圖片
              </div>
            )}
          </fieldset>
        </DialogContent>
      </Dialog>
    </fieldset>
  )
}

function statusVariant(status: SurveyStatus): 'success' | 'warning' | 'default' {
  if (status === 'active') return 'success'
  if (status === 'draft') return 'warning'
  return 'default'
}

const LIMIT = 30

type DrawerMode = 'detail' | 'responses' | 'create' | 'edit' | 'analytics' | null

export function SurveyManagementPage() {
  return (
    <SurveyWorkspace>
      <SurveyManagementContent />
    </SurveyWorkspace>
  )
}

function SurveyManagementContent() {
  const {
    setSurveyEditorOpen,
    setSurveyResultsOpen,
    setSurveyPreviewing,
    setSurveySettingsOpen,
    setSurveyStatus,
    setSurveyCanPublish,
    setSurveySubmitPending,
    setSurveyHasChanges,
    setSurveyPageHeading,
    registerSurveySubmitHandler,
    registerSurveyPublishHandler,
    registerSurveyReturnHandler,
  } = useSurveyWorkspace<{
    setSurveyEditorOpen: (open: boolean) => void
    setSurveyResultsOpen: (open: boolean) => void
    setSurveyPreviewing: (previewing: boolean) => void
    setSurveySettingsOpen: (open: boolean) => void
    setSurveyStatus: (status: SurveyStatus) => void
    setSurveyCanPublish: (canPublish: boolean) => void
    setSurveySubmitPending: (pending: boolean) => void
    setSurveyHasChanges: (hasChanges: boolean) => void
    setSurveyPageHeading: (heading: SurveyPageHeading | null) => void
    registerSurveySubmitHandler: (handler: (() => void) | null) => void
    registerSurveyPublishHandler: (handler: (() => void) | null) => void
    registerSurveyReturnHandler: (handler: (() => void) | null) => void
  }>()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | ''>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [offset, setOffset] = useState(0)

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [activeSurveyId, setActiveSurveyId] = useState<number | null>(null)
  const [requestedPreviewId, setRequestedPreviewId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copyErrorId, setCopyErrorId] = useState<number | null>(null)
  const [hasUnsavedFormChanges, setHasUnsavedFormChanges] = useState(false)
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false)

  useEffect(() => {
    const isSurveyResultsPage = drawerMode === 'responses' || drawerMode === 'analytics'
    setSurveyResultsOpen(isSurveyResultsPage)
    if (drawerMode === null) {
      setSurveyPageHeading({
        title: '問卷管理',
        description: '建立與發布問卷調查，收集用戶回饋並統計分析作答結果。',
      })
    } else if (drawerMode === 'create' || drawerMode === 'edit') {
      setSurveyPageHeading(null)
    }
    return () => setSurveyResultsOpen(false)
  }, [drawerMode, setSurveyResultsOpen, setSurveyPageHeading])

  useEffect(() => () => setSurveyPageHeading(null), [setSurveyPageHeading])

  useEffect(() => {
    const isFormOpen = drawerMode === 'create' || drawerMode === 'edit'
    setSurveyEditorOpen(isFormOpen)
    if (!isFormOpen) {
      setSurveyPreviewing(false)
      setSurveySettingsOpen(false)
      setSurveyStatus('draft')
      setSurveyCanPublish(false)
      setSurveySubmitPending(false)
      setSurveyHasChanges(false)
      registerSurveySubmitHandler(null)
      registerSurveyPublishHandler(null)
    }
    return () => setSurveyEditorOpen(false)
  }, [
    drawerMode,
    setSurveyEditorOpen,
    setSurveyPreviewing,
    setSurveySettingsOpen,
    setSurveyStatus,
    setSurveyCanPublish,
    setSurveySubmitPending,
    setSurveyHasChanges,
    registerSurveySubmitHandler,
    registerSurveyPublishHandler,
  ])

  useEffect(() => {
    if (
      requestedPreviewId === null ||
      drawerMode !== 'edit' ||
      activeSurveyId !== requestedPreviewId
    )
      return
    setSurveyPreviewing(true)
    setRequestedPreviewId(null)
  }, [requestedPreviewId, drawerMode, activeSurveyId, setSurveyPreviewing])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-surveys', statusFilter, search, offset],
    queryFn: () =>
      listAdminSurveys({
        status: statusFilter || undefined,
        q: search || undefined,
        limit: LIMIT,
        offset,
      }).then((r) => r.data),
  })

  const surveys = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total ?? 0

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-surveys'] })
  }

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAdminSurvey(id),
    onSuccess: invalidate,
    onError: () => alert('刪除問卷失敗，請重試'),
  })

  const legacyStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SurveyStatus }) =>
      updateAdminSurveyStatus(id, status),
    onSuccess: invalidate,
    onError: (error) => window.alert(getApiErrorMessage(error, '更新狀態失敗，請重試')),
  })

  const duplicateMut = useMutation({
    mutationFn: async (survey: AdminSurveyListItem) => {
      const response = await getAdminSurvey(survey.id)
      const detail = response.data.data as AdminSurveyDetail
      const invalidChoice = detail.questions.findIndex(
        (question) => OPTION_TYPES.has(question.question_type) && question.options.length < 2,
      )
      if (invalidChoice >= 0) {
        throw new DuplicateSurveyValidationError(
          `舊問卷第 ${invalidChoice + 1} 題的選項不足兩個，無法直接複製。請建立新問卷，補齊選項後再發布；原問卷與回應會保留。`,
        )
      }
      return createAdminSurvey({
        title: copySurveyTitle(detail.title),
        description: detail.description ?? undefined,
        thank_you_message: detail.thank_you_message ?? undefined,
        is_public: detail.is_public,
        logo_url: detail.logo_url,
        cover_url: detail.cover_url,
        managed_version: 1,
        is_anonymous: detail.is_public ? true : detail.is_anonymous,
        tags: detail.tags,
        max_responses: detail.max_responses,
        questions: detail.questions.map((question) => ({
          question_text: question.question_text,
          question_type: question.question_type,
          input_type: question.input_type,
          is_required: question.is_required,
          position: question.position,

          ...(question.question_type === 'scale' ? { scale_min: question.scale_min ?? 1 } : {}),
          ...(question.question_type === 'scale' ? { scale_max: question.scale_max ?? 10 } : {}),
          ...(question.scale_min_label ? { scale_min_label: question.scale_min_label } : {}),
          ...(question.scale_max_label ? { scale_max_label: question.scale_max_label } : {}),
          options: question.options.map((option) => ({
            option_text: option.option_text,
            position: option.position,
          })),
        })),
      })
    },
    onSuccess: invalidate,
    onError: (error) =>
      window.alert(
        error instanceof DuplicateSurveyValidationError
          ? error.message
          : getApiErrorMessage(error, '複製問卷失敗，請重試'),
      ),
  })

  const handleDelete = (survey: AdminSurveyListItem) => {
    if (
      window.confirm(`確定刪除問卷《${survey.title}》？\n此操作無法復原，所有回應也將一併刪除。`)
    ) {
      deleteMut.mutate(survey.id)
    }
  }

  const openResponses = (id: number) => {
    setActiveSurveyId(id)
    setDrawerMode('responses')
  }

  const openingDetail = useRef(false)
  const openEdit = async (id: number, preview = false) => {
    if (openingDetail.current) return
    openingDetail.current = true
    try {
      await qc.fetchQuery({
        queryKey: ['admin-survey-detail', id],
        queryFn: () => getAdminSurvey(id).then((r) => r.data.data),
        staleTime: 0,
      })
      setActiveSurveyId(id)
      if (preview) setRequestedPreviewId(id)
      setDrawerMode('edit')
    } catch (error) {
      window.alert(getApiErrorMessage(error, '無法載入最新問卷，請重試'))
    } finally {
      openingDetail.current = false
    }
  }

  const openSurveyPreview = (survey: AdminSurveyListItem) => {
    if (survey.managed_version === 1) {
      void openEdit(survey.id, true)
      return
    }
    window.open(`${SURVEY_PUBLIC_BASE}/${survey.external_id}`, '_blank')
  }

  const openAnalytics = (id: number) => {
    setActiveSurveyId(id)
    setDrawerMode('analytics')
  }

  const copyLinkLabel = (id: number) => {
    if (copiedId === id) return '已複製問卷連結'
    if (copyErrorId === id) return '複製失敗，請重試'
    return '複製問卷連結'
  }
  const handleCopyLink = async (survey: AdminSurveyListItem) => {
    const url = `${SURVEY_PUBLIC_BASE}/${survey.external_id}`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.setAttribute('readonly', '')
        textarea.setAttribute('aria-hidden', 'true')
        textarea.style.position = 'fixed'
        textarea.style.top = '0'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        const copiedWithFallback = document.execCommand('copy')
        textarea.remove()
        if (!copiedWithFallback) throw new Error('Clipboard is unavailable')
      }
      setCopiedId(survey.id)
      setCopyErrorId(null)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.setAttribute('readonly', '')
      textarea.setAttribute('aria-hidden', 'true')
      textarea.style.position = 'fixed'
      textarea.style.top = '0'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      const copiedWithFallback = document.execCommand('copy')
      textarea.remove()
      if (copiedWithFallback) {
        setCopiedId(survey.id)
        setCopyErrorId(null)
        setTimeout(() => setCopiedId(null), 2000)
      } else {
        setCopyErrorId(survey.id)
        setTimeout(() => setCopyErrorId(null), 3000)
      }
    }
  }

  const finishClosingDrawer = useCallback(() => {
    setShowDiscardConfirmation(false)
    setHasUnsavedFormChanges(false)
    setSurveyHasChanges(false)
    setDrawerMode(null)
    setActiveSurveyId(null)
  }, [setSurveyHasChanges])

  const closeDrawer = useCallback(() => {
    if (hasUnsavedFormChanges) {
      setShowDiscardConfirmation(true)
      return
    }

    finishClosingDrawer()
  }, [finishClosingDrawer, hasUnsavedFormChanges])

  useEffect(() => {
    const isFormOpen = drawerMode === 'create' || drawerMode === 'edit'
    const isSurveyResultsPage = drawerMode === 'responses' || drawerMode === 'analytics'
    registerSurveyReturnHandler(isFormOpen || isSurveyResultsPage ? closeDrawer : null)
    return () => registerSurveyReturnHandler(null)
  }, [drawerMode, registerSurveyReturnHandler, closeDrawer])

  const applySearch = () => {
    setSearch(searchInput)
    setOffset(0)
  }

  if (drawerMode === 'create' || drawerMode === 'edit') {
    const mode = drawerMode
    const onFormSuccess = (createdSurveyId?: number) => {
      invalidate()
      setHasUnsavedFormChanges(false)
      setSurveyHasChanges(false)
      if (createdSurveyId !== undefined) {
        setActiveSurveyId(createdSurveyId)
        setDrawerMode('edit')
      }
    }

    return (
      <>
        <div className="-m-5 flex min-h-0 flex-col">
          <div className="min-h-0">
            <SurveyFormPanel
              mode={mode}
              surveyId={mode === 'edit' ? (activeSurveyId ?? undefined) : undefined}
              onDirtyChange={setHasUnsavedFormChanges}
              onHeaderDirtyChange={setSurveyHasChanges}
              onPublishAvailabilityChange={setSurveyCanPublish}
              onSuccess={onFormSuccess}
            />
          </div>
        </div>

        <Dialog
          open={showDiscardConfirmation}
          onOpenChange={(open) => !open && setShowDiscardConfirmation(false)}
        >
          <DialogContent className="survey-workspace h-auto max-h-[85vh] max-w-md p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="heading-sm">捨棄未儲存的問卷？</h2>
                <p className="text-sm text-muted-foreground">
                  離開後，這次編輯的問卷資訊和題目都會被捨棄。
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDiscardConfirmation(false)}
                >
                  繼續編輯
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={finishClosingDrawer}>
                  捨棄變更
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (drawerMode === 'responses' && activeSurveyId) {
    return <SurveyResponsesPage surveyId={activeSurveyId} />
  }

  if (drawerMode === 'analytics' && activeSurveyId) {
    return <SurveyAnalyticsPage surveyId={activeSurveyId} />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-36">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as SurveyStatus | '')
              setOffset(0)
            }}
            options={[{ value: '', label: '全部狀態' }, ...STATUS_OPTIONS]}
            placeholder="狀態"
          />
        </div>
        <Input
          placeholder="搜尋問卷標題 / 描述"
          aria-label="搜尋關鍵字"
          className="w-64"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applySearch()
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={applySearch}>
          搜尋
        </Button>
        {(statusFilter || search) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('')
              setSearch('')
              setSearchInput('')
              setOffset(0)
            }}
          >
            清除篩選
          </Button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="whitespace-nowrap text-sm text-muted-foreground">共 {total} 筆</span>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setActiveSurveyId(null)
              setHasUnsavedFormChanges(false)
              setDrawerMode('create')
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            新增問卷
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">載入中...</p>}
        {isError && (
          <p role="alert" className="text-destructive dark:text-red-400">
            無法載入問卷，請重新整理後重試。
          </p>
        )}
        {!isError && !isLoading && surveys.length === 0 && (
          <p className="text-sm text-muted-foreground">無符合的問卷</p>
        )}
        {!isLoading &&
          !(surveys.length === 0) &&
          surveys.map((survey) => (
            <div key={survey.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(survey.status)}>
                  {survey.status === 'active' &&
                  survey.max_responses != null &&
                  survey.response_count >= survey.max_responses
                    ? '已達回應上限'
                    : STATUS_LABELS[survey.status]}
                </Badge>
                <Badge variant="default">
                  {survey.is_public === false ? '參與者限定' : '對外問卷'}
                </Badge>
                {survey.is_public === false && survey.is_anonymous && (
                  <Badge variant="default">匿名</Badge>
                )}
                {survey.tags.map((tag) => (
                  <Badge key={tag} variant="default" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatAdminDateTime(survey.created_at)}
                </span>
              </div>

              <div className="mt-2">
                <p className="break-words font-medium">{survey.title}</p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>
                  建立者：
                  {survey.creator.nickname ?? survey.creator.email ?? `#${survey.creator.id}`}
                </span>
                <span>瀏覽：{survey.view_count} 次</span>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(survey.id)}
                    aria-label="編輯問卷"
                    title="編輯問卷"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyLink(survey)}
                    aria-label={copyLinkLabel(survey.id)}
                    title={copyLinkLabel(survey.id)}
                  >
                    {copiedId === survey.id ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Link className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => openSurveyPreview(survey)}
                    aria-label="預覽問卷"
                    title="預覽問卷"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => duplicateMut.mutate(survey)}
                    disabled={duplicateMut.isPending}
                    aria-label="複製問卷"
                    title="複製問卷"
                  >
                    <CopyPlus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive dark:text-red-400"
                    onClick={() => handleDelete(survey)}
                    disabled={deleteMut.isPending}
                    aria-label="刪除問卷"
                    title="刪除問卷"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => openResponses(survey.id)}
                  disabled={survey.response_count === 0}
                >
                  查看回應 ({survey.response_count})
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => openAnalytics(survey.id)}
                >
                  <BarChart2 className="mr-1 h-3 w-3" />
                  分析
                </Button>
                {survey.managed_version !== 1 && (
                  <div className="w-28">
                    <label className="sr-only" htmlFor={`legacy-survey-status-${survey.id}`}>
                      更改狀態
                    </label>
                    <Select
                      id={`legacy-survey-status-${survey.id}`}
                      value={survey.status}
                      onValueChange={(value) => {
                        if (
                          value === 'draft' ||
                          value === 'active' ||
                          value === 'closed' ||
                          value === 'archived'
                        )
                          legacyStatusMut.mutate({ id: survey.id, status: value })
                      }}
                      options={STATUS_OPTIONS}
                      placeholder="更改狀態"
                      disabled={legacyStatusMut.isPending}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
          >
            上一頁
          </Button>
          <span className="text-sm text-muted-foreground">
            {Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={offset + LIMIT >= total}
            onClick={() => setOffset((o) => o + LIMIT)}
          >
            下一頁
          </Button>
        </div>
      )}

      <Dialog open={drawerMode !== null} onOpenChange={(o) => !o && closeDrawer()}>
        <DialogContent className="survey-workspace h-auto max-h-[85vh] max-w-3xl overflow-y-auto p-6">
          {drawerMode === 'detail' && activeSurveyId && (
            <SurveyDetailPanel surveyId={activeSurveyId} onClose={closeDrawer} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDiscardConfirmation}
        onOpenChange={(open) => !open && setShowDiscardConfirmation(false)}
      >
        <DialogContent className="survey-workspace h-auto max-h-[85vh] max-w-md p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="heading-sm">捨棄未儲存的問卷？</h2>
              <p className="text-sm text-muted-foreground">
                離開後，這次編輯的問卷資訊和題目都會被捨棄。
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowDiscardConfirmation(false)}
              >
                繼續編輯
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={finishClosingDrawer}>
                捨棄變更
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── SurveyDetailPanel ──────────────────────────────────────────────────────

function SurveyDetailPanel({ surveyId, onClose }: { surveyId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-survey-detail', surveyId],
    queryFn: () => getAdminSurvey(surveyId).then((r) => r.data.data),
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">載入中...</p>
  if (!data) return <p className="text-sm text-muted-foreground">無法載入問卷資料</p>

  const survey = data as AdminSurveyDetail

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="heading-sm">{survey.title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          關閉
        </Button>
      </div>

      {survey.description && <p className="text-sm text-muted-foreground">{survey.description}</p>}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">狀態：</span>
          <Badge variant={statusVariant(survey.status)}>
            {survey.status === 'active' &&
            survey.max_responses != null &&
            survey.response_count >= survey.max_responses
              ? '已達回應上限'
              : STATUS_LABELS[survey.status]}
          </Badge>
        </div>
        <div>
          <span className="text-muted-foreground">回應數：</span>
          {survey.response_count}
        </div>
        <div>
          <span className="text-muted-foreground">瀏覽數：</span>
          {survey.view_count}
        </div>
        <div>
          <span className="text-muted-foreground">匿名：</span>
          {survey.is_anonymous ? '是' : '否'}
        </div>
        {survey.max_responses && (
          <div>
            <span className="text-muted-foreground">最大回應數：</span>
            {survey.max_responses}
          </div>
        )}
        <div>
          <span className="text-muted-foreground">建立者：</span>
          {survey.creator.nickname ?? survey.creator.email ?? `#${survey.creator.id}`}
        </div>
        <div>
          <span className="text-muted-foreground">建立時間：</span>
          {formatAdminDateTime(survey.created_at)}
        </div>
        <div>
          <span className="text-muted-foreground">更新時間：</span>
          {formatAdminDateTime(survey.updated_at)}
        </div>
      </div>

      {survey.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {survey.tags.map((tag) => (
            <Badge key={tag} variant="default" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">題目列表（{survey.questions.length} 題）</h3>
        {survey.questions.map((q) => (
          <div key={q.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-muted-foreground">Q{q.position}.</span>
              <div className="flex-1">
                <p className="font-medium">{q.question_text}</p>
                <p className="text-xs text-muted-foreground">
                  類型：{QUESTION_TYPE_LABELS[q.question_type] ?? q.question_type}
                  {q.is_required && ' · 必填'}
                </p>
                {q.options.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {q.options.map((o) => (
                      <li key={o.id}>• {o.option_text}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SurveyResponsesPage ────────────────────────────────────────────────────

function SurveyResponsesPage({ surveyId }: { surveyId: number }) {
  const { setSurveyPageHeading } = useSurveyWorkspace<{
    setSurveyPageHeading: (heading: SurveyPageHeading | null) => void
  }>()
  const qc = useQueryClient()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const { data: survey } = useQuery({
    queryKey: ['admin-survey', surveyId],
    queryFn: () => getAdminSurvey(surveyId).then((r) => r.data.data),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-survey-responses', surveyId],
    queryFn: () =>
      loadAllSurveyResponses((offset) =>
        listAdminSurveyResponses(surveyId, { limit: 100, offset }).then(
          (response) => response.data,
        ),
      ),
  })

  const responses = data ?? []
  const total = responses.length
  const activeResponse = activeIndex === null ? undefined : responses[activeIndex]

  const { data: responseDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin-survey-response-detail', surveyId, activeResponse?.id],
    queryFn: () => {
      if (!activeResponse) throw new Error('請先選擇回應')
      return getAdminSurveyResponseDetail(surveyId, activeResponse.id).then((r) => r.data.data)
    },
    enabled: activeResponse !== undefined,
  })

  const deleteResponseMut = useMutation({
    mutationFn: (responseId: number) => deleteAdminSurveyResponse(surveyId, responseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-survey-responses', surveyId] })
      qc.invalidateQueries({ queryKey: ['admin-surveys'] })
    },
    onError: () => alert('刪除回應失敗，請重試'),
  })

  const exportResponsesToCsv = useCallback(async () => {
    if (!survey || total === 0) return

    setIsExporting(true)
    setExportProgress(0)
    try {
      const responseSummaries = await loadAllSurveyResponses((offset) =>
        listAdminSurveyResponses(surveyId, { limit: 100, offset }).then(
          (response) => response.data,
        ),
      )

      const responseDetails: AdminSurveyResponseDetail[] = []
      for (let index = 0; index < responseSummaries.length; index += 5) {
        const batch = responseSummaries.slice(index, index + 5)
        const batchDetails = await Promise.all(
          batch.map((response) =>
            getAdminSurveyResponseDetail(surveyId, response.id).then((result) => result.data.data),
          ),
        )
        responseDetails.push(...batchDetails)
        setExportProgress(responseDetails.length)
      }

      const csv = buildSurveyCsv(survey, responseDetails)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `問卷回應_${survey.title.replace(/[<>:"/\\|?*]/g, '_')}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
    } catch {
      alert('匯出 CSV 失敗，請稍後再試')
    } finally {
      setIsExporting(false)
    }
  }, [survey, surveyId, total])

  useEffect(() => {
    setSurveyPageHeading({
      title: '問卷回應列表',
      description: survey?.title ? `${survey.title} · 共 ${total} 筆回應` : `共 ${total} 筆回應`,
      actions: (
        <>
          {activeIndex !== null && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setActiveIndex(null)}
              aria-label="返回列表"
              title="返回列表"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={exportResponsesToCsv}
            disabled={!survey || total === 0 || isExporting}
            aria-label="匯出 CSV"
            title="匯出全部回應為 CSV"
          >
            <Download className="mr-1 h-4 w-4" />
            {isExporting ? `匯出中 ${exportProgress}/${total}` : 'CSV'}
          </Button>
        </>
      ),
    })
    return () => setSurveyPageHeading(null)
  }, [
    activeIndex,
    exportResponsesToCsv,
    exportProgress,
    isExporting,
    setSurveyPageHeading,
    survey,
    survey?.title,
    total,
  ])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        {isError && (
          <p role="alert" className="text-destructive dark:text-red-400">
            無法載入回應，請返回管理後重試。
          </p>
        )}
        {isLoading && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            載入回應中...
          </div>
        )}
        {!isError &&
          !isLoading &&
          activeIndex === null &&
          (responses.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              尚無回應
            </div>
          ) : (
            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground sm:grid-cols-[minmax(0,1fr)_180px_110px_24px]">
                <span>回應者</span>
                <span className="hidden sm:block">完成時間</span>
                <span className="hidden sm:block">回答數</span>
                <span className="sr-only">開啟</span>
              </div>
              <div className="divide-y divide-border">
                {responses.map((response, index) => {
                  const respondentName =
                    response.respondent_name?.trim() ||
                    (response.user_id ? `用戶 #${response.user_id}` : `匿名回應 ${index + 1}`)
                  return (
                    <button
                      key={response.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_180px_110px_24px]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {respondentName}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground sm:hidden">
                          {formatAdminDateTime(
                            response.completed_at,
                            !(survey?.managed_version === 1 && survey.is_anonymous),
                          )}{' '}
                          · {response.answer_count} 個回答
                        </span>
                      </span>
                      <span className="hidden text-sm text-muted-foreground sm:block">
                        {formatAdminDateTime(
                          response.completed_at,
                          !(survey?.managed_version === 1 && survey.is_anonymous),
                        )}
                      </span>
                      <span className="hidden text-sm text-muted-foreground sm:block">
                        {response.answer_count}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        {!isLoading && !(activeIndex === null) && !activeResponse && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            找不到這筆回應
          </div>
        )}
        {!isLoading && !(activeIndex === null) && !!activeResponse && (
          <>
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h2 className="heading-sm">
                    {survey?.managed_version === 1 && survey.is_anonymous
                      ? `匿名回應 ${activeIndex === null ? 1 : activeIndex + 1}/${total}`
                      : `回應 #${activeResponse.id}`}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeResponse.respondent_name?.trim() ||
                      (activeResponse.respondent_name ??
                        (activeResponse.user_id ? `用戶 #${activeResponse.user_id}` : '匿名'))}
                    {' · '}
                    {formatAdminDateTime(
                      activeResponse.completed_at,
                      !(survey?.managed_version === 1 && survey.is_anonymous),
                    )}
                    {' · '}
                    {activeResponse.answer_count} 個回答
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label="刪除回應"
                  title="刪除回應"
                  onClick={() => {
                    if (window.confirm('確定刪除此回應？')) {
                      deleteResponseMut.mutate(activeResponse.id, {
                        onSuccess: () => setActiveIndex(null),
                      })
                    }
                  }}
                  disabled={deleteResponseMut.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {isDetailLoading && (
                <p className="text-sm text-muted-foreground">載入回答內容中...</p>
              )}
              {!isDetailLoading && !responseDetail && (
                <p className="text-sm text-muted-foreground">無法載入回應資料</p>
              )}
              {!isDetailLoading && !!responseDetail && responseDetail.answers.length === 0 && (
                <p className="text-sm text-muted-foreground">此回應沒有回答內容</p>
              )}
              {!isDetailLoading && !!responseDetail && !(responseDetail.answers.length === 0) && (
                <div className="space-y-3">
                  {responseDetail.answers.map((answer, index) => (
                    <div key={answer.question_id} className="rounded-lg bg-muted/40 p-4">
                      <p className="font-medium">
                        {index + 1}. {answer.question_text}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {QUESTION_TYPE_LABELS[answer.question_type] ?? answer.question_type}
                      </p>
                      <div className="mt-3">
                        {answer.question_type === 'ranking' &&
                        (answer.selected_options?.length || answer.answer_text) ? (
                          <ol className="space-y-1">
                            {(answer.selected_options?.length
                              ? answer.selected_options
                              : (answer.answer_text ?? '').split(' → ').filter(Boolean)
                            )
                              .map((label, index) => ({
                                label,
                                rank: index + 1,
                                id: answer.selected_option_ids[index] ?? label,
                              }))
                              .map((item) => (
                                <li key={item.id} className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {item.rank}
                                  </span>
                                  {item.label}
                                </li>
                              ))}
                          </ol>
                        ) : (
                          answer.answer_text && (
                            <p className="whitespace-pre-wrap break-words">{answer.answer_text}</p>
                          )
                        )}
                        {answer.question_type !== 'ranking' &&
                          answer.selected_options.length > 0 && (
                            <ul className="space-y-1">
                              {answer.selected_options.map((option) => (
                                <li key={option} className="flex items-center gap-2">
                                  <span className="text-primary">✓</span>
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        {answer.rating_value !== null && answer.question_type === 'rating' && (
                          <p className="text-amber-500">
                            {'★'.repeat(answer.rating_value)}
                            {'☆'.repeat(Math.max(0, 5 - answer.rating_value))}
                          </p>
                        )}
                        {answer.rating_value !== null && answer.question_type === 'scale' && (
                          <p>{answer.rating_value}</p>
                        )}
                        {answer.boolean_value !== null && (
                          <p>{answer.boolean_value ? '是' : '否'}</p>
                        )}
                        {answer.answer_text === null &&
                          !answer.selected_options?.length &&
                          answer.selected_options.length === 0 &&
                          answer.rating_value === null &&
                          answer.boolean_value === null && (
                            <p className="italic text-muted-foreground">（未作答）</p>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={isLoading || activeIndex <= 0}
                onClick={() =>
                  setActiveIndex((index) => (index === null ? null : Math.max(0, index - 1)))
                }
                aria-label="上一筆回應"
                title="上一筆回應"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
                {total === 0 || activeIndex === null
                  ? `0/${total}`
                  : `${Math.min(activeIndex + 1, total)}/${total}`}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={isLoading || activeIndex === null || activeIndex >= total - 1}
                onClick={() =>
                  setActiveIndex((index) =>
                    index === null ? null : Math.min(total - 1, index + 1),
                  )
                }
                aria-label="下一筆回應"
                title="下一筆回應"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── SurveyAnalyticsPanel ──────────────────────────────────────────────────

function QuestionStatBlock({ q }: { q: AdminSurveyPerQuestion }) {
  const { question_type, stats, answer_count } = q

  if (question_type === 'rating' || question_type === 'scale') {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-4">
          <span>
            平均：<strong>{stats.avg == null ? '—' : stats.avg.toFixed(1)}</strong>
          </span>
          <span>
            最低：<strong>{stats.min ?? '—'}</strong>
          </span>
          <span>
            最高：<strong>{stats.max ?? '—'}</strong>
          </span>
        </div>
        {stats.distribution?.map((item) => (
          <div key={item.value} className="flex flex-wrap items-center gap-2">
            <span className="min-w-20">
              {question_type === 'rating' ? '★'.repeat(item.value) : item.value}
            </span>
            <span>{item.count} 份</span>
          </div>
        ))}
      </div>
    )
  }

  if (question_type === 'ranking' && stats.rank_counts?.length) {
    const rankCount = Math.max(...stats.rank_counts.map((option) => option.counts.length), 1)
    const ranks = Array.from({ length: rankCount }, (_, index) => index + 1)
    return (
      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          style={{ minWidth: 232 + rankCount * 36 }}
          aria-label="排序各名次票數與平均名次"
        >
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="p-2 text-left">選項</th>
              {ranks.map((rank) => (
                <th key={rank} className="p-2 text-center">
                  {rank}
                </th>
              ))}
              <th className="p-2 text-right">平均名次</th>
            </tr>
          </thead>
          <tbody>
            {stats.rank_counts.map((option) => (
              <tr key={option.option_id}>
                <th className="max-w-48 break-words p-2 text-left font-normal">
                  {option.option_text}
                </th>
                {ranks.map((rank) => (
                  <td key={rank} className="p-2 text-center tabular-nums">
                    {option.counts[rank - 1] ?? 0}
                  </td>
                ))}
                <td className="p-2 text-right tabular-nums">
                  {option.average_rank == null ? '—' : option.average_rank.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (question_type === 'yesno') {
    const t = stats.true ?? 0
    const f = stats.false ?? 0
    const total = t + f || 1
    return (
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-6 text-right text-muted-foreground">是</span>
          <div className="flex-1 rounded-full bg-muted h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-success"
              style={{ width: `${(t / total) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right">{t}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 text-right text-muted-foreground">否</span>
          <div className="flex-1 rounded-full bg-muted h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-destructive"
              style={{ width: `${(f / total) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right">{f}</span>
        </div>
      </div>
    )
  }

  if (stats.option_counts && stats.option_counts.length > 0) {
    const denominator = Math.max(answer_count, 1)
    return (
      <div className="space-y-1.5 text-sm">
        {stats.option_counts.map((o) => (
          <div key={o.option_id} className="flex items-center gap-2">
            <span className="w-32 truncate text-xs text-muted-foreground">{o.option_text}</span>
            <div className="flex-1 rounded-full bg-muted h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(o.count / denominator) * 100}%` }}
              />
            </div>
            <span className="w-20 text-right text-xs">
              {o.count} ({Math.round((o.count / denominator) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (stats.sample_answers && stats.sample_answers.length > 0) {
    return (
      <div className="space-y-1 text-sm">
        {stats.sample_answers.filter(Boolean).map((a) => (
          <p key={a} className="rounded bg-muted px-2 py-1 text-xs">
            「{a}」
          </p>
        ))}
      </div>
    )
  }

  return <p className="text-xs text-muted-foreground">尚無回應資料</p>
}

function SurveyAnalyticsPage({ surveyId }: { surveyId: number }) {
  const { setSurveyPageHeading } = useSurveyWorkspace<{
    setSurveyPageHeading: (heading: SurveyPageHeading | null) => void
  }>()
  const { data: survey } = useQuery({
    queryKey: ['admin-survey', surveyId],
    queryFn: () => getAdminSurvey(surveyId).then((r) => r.data.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-survey-analytics', surveyId],
    queryFn: () =>
      getAdminSurveyAnalytics(surveyId).then((r) => r.data.data as AdminSurveyAnalytics),
  })

  useEffect(() => {
    setSurveyPageHeading({ title: '問卷分析', description: survey?.title ?? '' })
    return () => setSurveyPageHeading(null)
  }, [setSurveyPageHeading, survey?.title])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pt-5">
        {isLoading && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            載入分析資料中...
          </div>
        )}
        {!isLoading && !data && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            無法載入分析資料
          </div>
        )}
        {!isLoading && !!data && data.per_question.length > 0 && (
          <div className="space-y-3">
            {data.per_question.map((q) => (
              <div
                key={q.question_id}
                className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-2 text-sm">
                  <p className="font-medium">
                    {q.question_text} ({q.answer_count})
                  </p>
                </div>
                <QuestionStatBlock q={q} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── SurveyFormPanel ────────────────────────────────────────────────────────

interface OptionDraft {
  _key: string
  option_text: string
  position: number
}

interface QuestionDraft extends Omit<AdminSurveyQuestionForm, 'options'> {
  _key: string
  options: OptionDraft[]
  text_response_length: 'short' | 'long'
  scale_min: number
  scale_max: number
  scale_min_label: string
  scale_max_label: string
}

function SettingSwitch({
  label,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className="flex w-full items-center justify-between rounded-md py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 rounded-full border transition-colors ${checked ? 'border-primary bg-primary' : 'border-slate-400 bg-slate-300'}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full border border-slate-300 bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </span>
    </button>
  )
}

function generateKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).substring(2, 11)
}

function makeEmptyQuestion(position: number, questionType = 'text'): QuestionDraft {
  return {
    _key: generateKey(),
    question_text: '',
    question_type: questionType,
    is_required: false,
    position,
    text_response_length: 'short',
    scale_min: 1,
    scale_max: 5,
    scale_min_label: '',
    scale_max_label: '',
    options: OPTION_TYPES.has(questionType)
      ? [{ _key: generateKey(), option_text: '', position: 0 }]
      : [],
  }
}

function SurveyFormPanel({
  mode,
  surveyId,
  onSuccess,
  onDirtyChange,
  onHeaderDirtyChange,
  onPublishAvailabilityChange,
}: {
  mode: 'create' | 'edit'
  surveyId?: number
  onSuccess: (createdSurveyId?: number) => void
  onDirtyChange: (dirty: boolean) => void
  onHeaderDirtyChange: (dirty: boolean) => void
  onPublishAvailabilityChange: (canPublish: boolean) => void
}) {
  const { data: existingData, isLoading: loadingExisting } = useQuery({
    queryKey: ['admin-survey-detail', surveyId],
    queryFn: () => {
      if (surveyId === undefined) throw new Error('Survey id is required')
      return getAdminSurvey(surveyId).then((r) => r.data.data)
    },
    enabled: mode === 'edit' && surveyId !== undefined,
  })

  if (mode === 'edit' && loadingExisting) {
    return <p className="p-6 text-sm text-muted-foreground">載入中...</p>
  }

  if (mode === 'edit' && !existingData)
    return (
      <p role="alert" className="p-6 text-destructive dark:text-red-400">
        無法載入問卷，請返回管理後重試。
      </p>
    )
  if (mode === 'edit' && existingData && existingData.managed_version !== 1)
    return (
      <LegacySurveyForm
        key={existingData.id}
        survey={existingData}
        onSuccess={() => onSuccess()}
        onDirtyChange={onDirtyChange}
        onHeaderDirtyChange={onHeaderDirtyChange}
      />
    )
  return (
    <SurveyFormInner
      key={mode === 'edit' ? surveyId : 'create'}
      mode={mode}
      surveyId={surveyId}
      existingData={mode === 'edit' ? existingData : undefined}
      onSuccess={onSuccess}
      onDirtyChange={onDirtyChange}
      onHeaderDirtyChange={onHeaderDirtyChange}
      onPublishAvailabilityChange={onPublishAvailabilityChange}
    />
  )
}

function SurveyFormInner({
  mode,
  surveyId,
  existingData,
  onSuccess,
  onDirtyChange,
  onHeaderDirtyChange,
  onPublishAvailabilityChange,
}: {
  mode: 'create' | 'edit'
  surveyId?: number
  existingData?: AdminSurveyDetail
  onSuccess: (createdSurveyId?: number) => void
  onDirtyChange: (dirty: boolean) => void
  onHeaderDirtyChange: (dirty: boolean) => void
  onPublishAvailabilityChange: (canPublish: boolean) => void
}) {
  const {
    surveyPreviewing: isPreviewing,
    setSurveyPreviewing,
    setSurveyAudience: setHeaderSurveyAudience,
    setSurveyStatus: setHeaderSurveyStatus,
    setSurveyCanPublish,
    surveySettingsOpen: isSettingsOpen,
    setSurveySettingsOpen: setIsSettingsOpen,
    setSurveySubmitPending,
    setSurveyHasChanges,
    registerSurveySubmitHandler,
    registerSurveyPublishHandler,
  } = useSurveyWorkspace<{
    surveyPreviewing: boolean
    setSurveyPreviewing: (previewing: boolean) => void
    setSurveyAudience: (audience: 'public' | 'members') => void
    setSurveyStatus: (status: SurveyStatus) => void
    setSurveyCanPublish: (canPublish: boolean) => void
    surveySettingsOpen: boolean
    setSurveySettingsOpen: (open: boolean) => void
    setSurveySubmitPending: (pending: boolean) => void
    setSurveyHasChanges: (hasChanges: boolean) => void
    registerSurveySubmitHandler: (handler: (() => void) | null) => void
    registerSurveyPublishHandler: (handler: (() => void) | null) => void
  }>()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(existingData?.title ?? '')
  const [description, setDescription] = useState(existingData?.description ?? '')
  const [logoUrl, setLogoUrl] = useState(existingData?.logo_url ?? '')
  const [bannerUrl, setBannerUrl] = useState(existingData?.cover_url ?? '')
  const [uploadingImages, setUploadingImages] = useState({ logo: false, banner: false })
  const [isArchiving, setIsArchiving] = useState(false)
  const [isBrandAssetsExpanded, setIsBrandAssetsExpanded] = useState(false)
  const [thankYouMessage, setThankYouMessage] = useState(existingData?.thank_you_message ?? '')
  const [surveyAudience, setSurveyAudience] = useState<'public' | 'members'>(
    existingData?.is_public === false ? 'members' : 'public',
  )
  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus>(existingData?.status ?? 'draft')
  useEffect(() => {
    setHeaderSurveyAudience(surveyAudience)
  }, [surveyAudience, setHeaderSurveyAudience])
  useEffect(() => {
    setHeaderSurveyStatus(surveyStatus)
  }, [surveyStatus, setHeaderSurveyStatus])
  const [isAnonymous, setIsAnonymous] = useState(existingData?.is_anonymous ?? true)
  const [maxResponses, setMaxResponses] = useState(
    existingData?.max_responses ? String(existingData.max_responses) : '',
  )
  const [hasMaxResponses, setHasMaxResponses] = useState(!!existingData?.max_responses)
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => {
    if (existingData && existingData.questions.length > 0) {
      return existingData.questions.map((q) => ({
        _key: String(q.id),
        question_text: q.question_text,
        question_type: surveyEditorQuestionType(q),
        is_required: q.is_required,
        position: q.position,
        text_response_length: q.input_type === 'textarea' ? 'long' : 'short',
        scale_min: q.scale_min ?? 1,
        scale_max: q.scale_max ?? 5,
        scale_min_label: q.scale_min_label ?? '',
        scale_max_label: q.scale_max_label ?? '',
        options: q.options.map((o) => ({
          _key: String(o.id),
          option_text: o.option_text,
          position: o.position,
        })),
      }))
    }
    return []
  })
  const currentSnapshot = JSON.stringify({
    title,
    description,
    logoUrl,
    bannerUrl,
    thankYouMessage,
    surveyAudience,
    isAnonymous,
    maxResponses,
    hasMaxResponses,
    questions,
  })
  const initialSnapshot = useRef<string | null>(null)
  if (initialSnapshot.current === null) initialSnapshot.current = currentSnapshot

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (currentSnapshot !== initialSnapshot.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [currentSnapshot])
  const [error, setError] = useState('')
  const [isQuestionTypeOpen, setIsQuestionTypeOpen] = useState(false)
  const [questionSetup, setQuestionSetup] = useState<QuestionDraft | null>(null)
  const [questionSetupMode, setQuestionSetupMode] = useState<'create' | 'edit'>('create')
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string | string[]>>({})
  const [previewErrors, setPreviewErrors] = useState<string[]>([])
  const [previewSubmitted, setPreviewSubmitted] = useState(false)
  const [_focusRequest, setFocusRequest] = useState(0)
  const questionCardRefs = useRef(new Map<string, HTMLDivElement>())
  const pendingFocusKey = useRef<string | null>(null)
  const submitHandlerRef = useRef<() => void>(() => {})
  const publishHandlerRef = useRef<() => void>(() => {})
  const [isSubmitFlowPending, setIsSubmitFlowPending] = useState(false)

  useEffect(() => {
    const isDirty = currentSnapshot !== initialSnapshot.current
    onDirtyChange(isDirty)
    onHeaderDirtyChange(isDirty)
    const canPublish =
      mode === 'create' ? isDirty : surveyStatus === 'draft' || surveyStatus === 'closed'
    onPublishAvailabilityChange(canPublish)
  }, [
    currentSnapshot,
    mode,
    onDirtyChange,
    onHeaderDirtyChange,
    onPublishAvailabilityChange,
    surveyStatus,
  ])

  useEffect(() => {
    if (!isPreviewing) {
      setPreviewAnswers({})
      setPreviewErrors([])
      setPreviewSubmitted(false)
    }
  }, [isPreviewing])

  useEffect(() => {
    const key = pendingFocusKey.current
    if (isPreviewing || !key) return

    const frame = window.requestAnimationFrame(() => {
      if (pendingFocusKey.current !== key) return

      const card = questionCardRefs.current.get(key)
      if (!card) return

      pendingFocusKey.current = null
      card.scrollIntoView({ behavior: 'smooth', block: 'center' })
      card.querySelector<HTMLButtonElement>('[data-question-edit]')?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isPreviewing])

  const createMut = useMutation({
    mutationFn: createAdminSurvey,
    onSuccess: () => {
      initialSnapshot.current = currentSnapshot
      onDirtyChange(false)
      onHeaderDirtyChange(false)
      setSurveyHasChanges(false)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAdminSurvey>[1] }) =>
      updateAdminSurvey(id, data),
    onSuccess: () => {
      initialSnapshot.current = currentSnapshot
      onDirtyChange(false)
      onHeaderDirtyChange(false)
      setSurveyHasChanges(false)
    },
  })

  const publishMut = useMutation({
    mutationFn: (id: number) => updateAdminSurveyStatus(id, 'active'),
    onSuccess: () => {
      setSurveyStatus('active')
      setHeaderSurveyStatus('active')
      setSurveyCanPublish(false)
      onPublishAvailabilityChange(false)
    },
  })

  const surveyAvailabilityMut = useMutation({
    mutationFn: (status: 'active' | 'closed') => {
      if (surveyId === undefined) throw new Error('Survey id is required')
      return updateAdminSurveyStatus(surveyId, status)
    },
    onSuccess: (_response, status) => {
      setSurveyStatus(status)
      setHeaderSurveyStatus(status)
      setSurveyCanPublish(status === 'closed')
      onPublishAvailabilityChange(status === 'closed')
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
    },
    onError: (_error, status) =>
      window.alert(status === 'closed' ? '關閉問卷失敗，請重試' : '重新開啟問卷失敗，請重試'),
  })

  const isPending =
    isSubmitFlowPending ||
    createMut.isPending ||
    updateMut.isPending ||
    publishMut.isPending ||
    surveyAvailabilityMut.isPending ||
    isArchiving ||
    uploadingImages.logo ||
    uploadingImages.banner

  useEffect(() => {
    setSurveySubmitPending(isPending)
  }, [isPending, setSurveySubmitPending])

  const beginQuestionSetup = (questionType: string) => {
    const question = makeEmptyQuestion(questions.length + 1, questionType)
    if (OPTION_TYPES.has(questionType)) {
      question.options = [
        { _key: generateKey(), option_text: '', position: 0 },
        { _key: generateKey(), option_text: '', position: 1 },
      ]
    }
    setQuestionSetupMode('create')
    setQuestionSetup(question)
  }

  const editQuestion = (question: QuestionDraft) => {
    setQuestionSetupMode('edit')
    setQuestionSetup({
      ...question,
      options: question.options.map((option) => ({ ...option })),
    })
    setIsQuestionTypeOpen(true)
  }

  const closeQuestionDialog = () => {
    setIsQuestionTypeOpen(false)
    setQuestionSetup(null)
  }

  const updateSetupOption = (index: number, text: string) => {
    setQuestionSetup((current) =>
      current
        ? {
            ...current,
            options: current.options.map((option, optionIndex) =>
              optionIndex === index ? { ...option, option_text: text } : option,
            ),
          }
        : current,
    )
  }

  const addSetupOption = () => {
    setQuestionSetup((current) =>
      current
        ? {
            ...current,
            options: [
              ...current.options,
              { _key: generateKey(), option_text: '', position: current.options.length },
            ],
          }
        : current,
    )
  }

  const removeSetupOption = (index: number) => {
    setQuestionSetup((current) =>
      current
        ? {
            ...current,
            options: current.options
              .filter((_, optionIndex) => optionIndex !== index)
              .map((option, optionIndex) => ({ ...option, position: optionIndex })),
          }
        : current,
    )
  }

  const saveQuestionSetup = () => {
    if (!questionSetup?.question_text.trim()) return

    const savedQuestion = {
      ...questionSetup,
      question_text: questionSetup.question_text.trim(),
      options: OPTION_TYPES.has(questionSetup.question_type)
        ? questionSetup.options
            .filter((option) => option.option_text.trim())
            .map((option, index) => ({
              ...option,
              option_text: option.option_text.trim(),
              position: index,
            }))
        : [],
    }

    if (questionSetupMode === 'create') {
      const newQuestion = { ...savedQuestion, position: questions.length + 1 }
      pendingFocusKey.current = newQuestion._key
      setFocusRequest((request) => request + 1)
      setQuestions((previous) => [...previous, newQuestion])
    } else {
      setQuestions((previous) =>
        previous.map((question) =>
          question._key === savedQuestion._key
            ? { ...savedQuestion, position: question.position }
            : question,
        ),
      )
    }

    closeQuestionDialog()
  }

  const setPreviewAnswer = (questionKey: string, answer: string | string[]) => {
    setPreviewAnswers((current) => ({ ...current, [questionKey]: answer }))
    setPreviewErrors((current) => current.filter((key) => key !== questionKey))
  }

  const submitPreview = () => {
    const unansweredRequired = invalidPreviewQuestions(questions, previewAnswers)
    setPreviewErrors(unansweredRequired)
    if (unansweredRequired.length === 0) setPreviewSubmitted(true)
  }

  const moveQuestion = (key: string, direction: -1 | 1) => {
    setQuestions((prev) => {
      const from = prev.findIndex((question) => question._key === key)
      const to = from + direction
      if (from < 0 || to < 0 || to >= prev.length) return prev

      const next = [...prev]
      const moved = next[from]
      next[from] = next[to]
      next[to] = moved
      return next.map((question, index) => ({ ...question, position: index + 1 }))
    })
  }

  const duplicateQuestion = (key: string) => {
    const duplicateKey = generateKey()
    pendingFocusKey.current = duplicateKey
    setFocusRequest((request) => request + 1)
    setQuestions((prev) => {
      const index = prev.findIndex((question) => question._key === key)
      if (index < 0) return prev

      const original = prev[index]
      const duplicate = {
        ...original,
        _key: duplicateKey,
        question_text: original.question_text ? `${original.question_text}（副本）` : '',
        options: original.options.map((option) => ({ ...option })),
      }
      const next = [...prev]
      next.splice(index + 1, 0, duplicate)
      return next.map((question, position) => ({ ...question, position: position + 1 }))
    })
  }

  const removeQuestion = (key: string) => {
    setQuestions((prev) =>
      prev.filter((q) => q._key !== key).map((q, i) => ({ ...q, position: i + 1 })),
    )
  }

  const handleSubmit = (publish = false) => {
    if (isPending) return
    setError('')
    if (!title.trim()) {
      setError('標題為必填')
      return
    }
    if (publish && questions.length === 0) {
      setError('至少新增一題才能發布問卷')
      return
    }
    const incompleteQuestion = questions.find((question) => !question.question_text.trim())
    if (incompleteQuestion) {
      setError('請完成所有題目，或刪除尚未填寫的題目')
      pendingFocusKey.current = incompleteQuestion._key
      setFocusRequest((request) => request + 1)
      setSurveyPreviewing(false)
      return
    }
    if (hasMaxResponses) {
      const parsed = Number(maxResponses)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        setError('最大回應數必須為正整數')
        return
      }
    }
    const hasEmptyOptions = questions.some(
      (q) =>
        OPTION_TYPES.has(q.question_type) &&
        q.question_text.trim() &&
        q.options.filter((o) => o.option_text.trim()).length < 2,
    )
    if (hasEmptyOptions) {
      setError('選擇題 / 排序題至少需要兩個選項')
      return
    }
    const questionsPayload: AdminSurveyQuestionForm[] = questions.map((q, i) => ({
      question_text: q.question_text.trim(),
      question_type:
        q.question_type === 'email' || q.question_type === 'link' ? 'text' : q.question_type,
      input_type: surveyQuestionInputType(q),
      is_required: q.is_required,
      position: i + 1,

      ...(q.question_type === 'scale'
        ? {
            scale_min: q.scale_min,
            scale_max: q.scale_max,
            scale_min_label: q.scale_min_label.trim(),
            scale_max_label: q.scale_max_label.trim(),
          }
        : {}),
      options: OPTION_TYPES.has(q.question_type)
        ? q.options
            .filter((o) => o.option_text.trim())
            .map((o, j) => ({ option_text: o.option_text.trim(), position: j }))
        : [],
    }))

    const payload = {
      title: title.trim(),
      description: description.trim(),
      // Store image URLs on the survey; removing a library entry must not change them.
      logo_url: logoUrl || null,
      cover_url: bannerUrl || null,
      ...(mode === 'create' ? { managed_version: 1 as const } : {}),
      thank_you_message: thankYouMessage.trim(),
      is_anonymous:
        surveyAudience === 'public'
          ? mode === 'edit' && existingData?.is_public
            ? existingData.is_anonymous
            : true
          : isAnonymous,
      is_public: surveyAudience === 'public',
      tags: mode === 'edit' ? (existingData?.tags ?? []) : [],
      max_responses: hasMaxResponses ? Number(maxResponses) : null,
      ...(existingData?.structure_locked || existingData?.response_count
        ? {}
        : { questions: questionsPayload }),
    }

    const hasChanges = currentSnapshot !== initialSnapshot.current
    setIsSubmitFlowPending(true)
    const save = async () => {
      let createdSurveyId: number | undefined
      try {
        if (mode === 'create') {
          const response = await createMut.mutateAsync(payload)
          createdSurveyId = response.data.data.id
          if (publish) await publishMut.mutateAsync(createdSurveyId)
          else setSurveyStatus('draft')
          onSuccess(createdSurveyId)
          return
        }

        if (surveyId === undefined) return
        if (hasChanges) {
          await updateMut.mutateAsync({ id: surveyId, data: payload })
        }
        if (publish) await publishMut.mutateAsync(surveyId)
        onSuccess()
      } catch (error) {
        if (createdSurveyId !== undefined) {
          setSurveyStatus('draft')
          setHeaderSurveyStatus('draft')
          onSuccess(createdSurveyId)
          window.alert('問卷已儲存為草稿，但發布失敗，請重試。')
        } else {
          setError(getApiErrorMessage(error, '儲存或發布失敗，請檢查欄位並重試'))
        }
      } finally {
        setIsSubmitFlowPending(false)
      }
    }
    void save()
  }

  submitHandlerRef.current = handleSubmit
  publishHandlerRef.current = () => handleSubmit(true)

  useEffect(() => {
    registerSurveySubmitHandler(() => submitHandlerRef.current())
    registerSurveyPublishHandler(() => publishHandlerRef.current())
    return () => {
      registerSurveySubmitHandler(null)
      registerSurveyPublishHandler(null)
      setSurveySubmitPending(false)
    }
  }, [registerSurveyPublishHandler, registerSurveySubmitHandler, setSurveySubmitPending])

  return (
    <fieldset disabled={isPending} className="flex min-h-0 min-w-0 flex-col">
      {existingData?.status === 'active' &&
        existingData.max_responses != null &&
        existingData.response_count >= existingData.max_responses && (
          <p role="status" className="border-b border-border bg-muted px-5 py-3 text-sm">
            已達回應上限，問卷目前不接受新回應。可調整回應上限或關閉問卷。
          </p>
        )}
      {!isPreviewing && (
        <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-3 sm:px-5">
          <section className="rounded-lg border border-border" aria-label="問卷圖片">
            <button
              type="button"
              aria-expanded={isBrandAssetsExpanded}
              onClick={() => setIsBrandAssetsExpanded((expanded) => !expanded)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
            >
              <span className="text-sm font-semibold">問卷圖片</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isBrandAssetsExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            {isBrandAssetsExpanded && (
              <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
                <SurveyImageField
                  id={`survey-logo-${surveyId ?? 'new'}`}
                  label="Logo"
                  kind="logo"
                  disabled={isPending}
                  onUploadingChange={(uploading) =>
                    setUploadingImages((current) => ({ ...current, logo: uploading }))
                  }
                  imageUrl={logoUrl}
                  onImageChange={(image) => {
                    setLogoUrl(image)
                  }}
                  onRemove={() => {
                    setLogoUrl('')
                  }}
                  guidance="建議 600 × 150 px（約 4:1），保留圖片比例；PNG 可保留透明背景。最多 8 MB。"
                />
                <SurveyImageField
                  id={`survey-banner-${surveyId ?? 'new'}`}
                  label="問卷橫幅"
                  kind="banner"
                  disabled={isPending}
                  onUploadingChange={(uploading) =>
                    setUploadingImages((current) => ({ ...current, banner: uploading }))
                  }
                  imageUrl={bannerUrl}
                  onImageChange={(image) => {
                    setBannerUrl(image)
                  }}
                  onRemove={() => {
                    setBannerUrl('')
                  }}
                  guidance="建議 1600 × 480 px（10:3），顯示時置中裁切。最多 8 MB。"
                />
              </div>
            )}
          </section>
          <Input
            id="survey-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="問卷標題"
            aria-label="問卷標題"
            aria-invalid={error === '標題為必填'}
            required
            className="h-9 min-w-0 flex-1 font-semibold"
          />
          <textarea
            id="survey-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="問卷描述（選填）"
            aria-label="問卷描述（選填）"
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
      {isPreviewing && (
        <div className="flex shrink-0 justify-end px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="關閉預覽並返回編輯"
            title="返回編輯"
            onClick={() => setSurveyPreviewing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className={isPreviewing ? 'min-h-0 flex-1 overflow-y-auto p-0' : 'space-y-3 p-4 sm:p-5'}>
        <div
          className={isPreviewing ? 'mx-auto w-full max-w-2xl py-4 sm:py-8' : 'hidden'}
          aria-hidden={!isPreviewing}
        >
          <article className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
            {bannerUrl && (
              <div className="-mx-5 -mt-5 mb-5 aspect-[10/3] overflow-hidden rounded-t-xl sm:-mx-8 sm:-mt-8">
                <img src={bannerUrl} alt="問卷橫幅" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="space-y-3 border-b border-border pb-6">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="問卷 Logo"
                  className="mb-7 max-h-10 max-w-40 object-contain object-left"
                />
              )}
              <h3 className="text-2xl font-semibold tracking-tight">
                {title.trim() || '未命名問卷'}
              </h3>
              {description.trim() && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{description}</p>
              )}
              {surveyAudience === 'members' && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="default">參與者限定</Badge>
                  <Badge variant="default">{isAnonymous ? '匿名回覆' : '記名回覆'}</Badge>
                </div>
              )}
            </div>

            {previewSubmitted && (
              <div role="status" aria-label="預覽提交成功" className="flex justify-center py-5">
                <Check className="survey-success-check size-12 text-primary" />
              </div>
            )}
            {previewSubmitted && thankYouMessage.trim() && (
              <div className="pt-6">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {thankYouMessage}
                </p>
              </div>
            )}
            {previewSubmitted && !thankYouMessage.trim() && null}
            {!previewSubmitted && (
              <>
                <div className="space-y-5">
                  {questions.map((question) => {
                    const options = question.options.filter((option) => option.option_text.trim())
                    const answer = previewAnswers[question._key]
                    const selectedOptions = Array.isArray(answer) ? answer : []
                    const hasError = previewErrors.includes(question._key)
                    return (
                      <section key={question._key} className="space-y-2.5">
                        <h4 className="text-sm font-medium">
                          {question.question_text.trim()}
                          {question.is_required && (
                            <span className="ml-1 text-destructive dark:text-red-400">*</span>
                          )}
                        </h4>

                        {question.question_type === 'text' &&
                          (question.text_response_length !== 'short' ? (
                            <textarea
                              value={typeof answer === 'string' ? answer : ''}
                              onChange={(event) =>
                                setPreviewAnswer(question._key, event.target.value)
                              }
                              maxLength={10000}
                              placeholder="你的回答"
                              aria-label={question.question_text || '你的回答'}
                              aria-invalid={hasError}
                              rows={8}
                              className="min-h-48 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          ) : (
                            <Input
                              value={typeof answer === 'string' ? answer : ''}
                              onChange={(event) =>
                                setPreviewAnswer(question._key, event.target.value)
                              }
                              maxLength={10000}
                              placeholder="你的回答"
                              aria-label={question.question_text || '你的回答'}
                              aria-invalid={hasError}
                              className="w-full"
                            />
                          ))}

                        {(question.question_type === 'email' ||
                          question.question_type === 'link') && (
                          <Input
                            maxLength={10000}
                            type={question.question_type === 'email' ? 'email' : 'url'}
                            value={typeof answer === 'string' ? answer : ''}
                            onChange={(event) =>
                              setPreviewAnswer(question._key, event.target.value)
                            }
                            placeholder={
                              question.question_type === 'email'
                                ? 'name@example.com'
                                : 'https://example.com'
                            }
                            aria-label={question.question_text || '你的回答'}
                            aria-invalid={hasError}
                            className="w-full"
                          />
                        )}

                        {(question.question_type === 'single_choice' ||
                          question.question_type === 'yesno') && (
                          <div
                            className="space-y-2"
                            role="radiogroup"
                            aria-label={question.question_text}
                          >
                            {(question.question_type === 'yesno'
                              ? [
                                  { key: 'yes', text: '是' },
                                  { key: 'no', text: '否' },
                                ]
                              : options.map((option) => ({
                                  key: option._key,
                                  text: option.option_text,
                                }))
                            ).map((choice) => (
                              <label
                                htmlFor={`preview-${question._key}-${choice.key}`}
                                key={choice.key}
                                className="flex cursor-pointer items-center gap-2 text-sm"
                              >
                                <input
                                  type="radio"
                                  id={`preview-${question._key}-${choice.key}`}
                                  name={`preview-${question._key}`}
                                  value={choice.key}
                                  checked={answer === choice.key}
                                  onChange={() => setPreviewAnswer(question._key, choice.key)}
                                  className="h-4 w-4 accent-primary"
                                />
                                <span>{choice.text}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {question.question_type === 'multiple_choice' && (
                          <div className="space-y-2">
                            {options.map((option) => {
                              const checked = selectedOptions.includes(option._key)
                              return (
                                <div key={option._key} className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    aria-label={option.option_text}
                                    checked={checked}
                                    onCheckedChange={(value) => {
                                      const next = value
                                        ? [...selectedOptions, option._key]
                                        : selectedOptions.filter((item) => item !== option._key)
                                      setPreviewAnswer(question._key, next)
                                    }}
                                  />
                                  <span>{option.option_text}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {question.question_type === 'ranking' && (
                          <div className="space-y-2">
                            {options.map((option) => {
                              const choice = option._key
                              const rank = selectedOptions.indexOf(choice)
                              const selected = rank !== -1
                              return (
                                <Button
                                  key={`${question._key}-ranking-${option.position}`}
                                  type="button"
                                  variant="outline"
                                  aria-pressed={selected}
                                  aria-label={
                                    selected
                                      ? `取消「${option.option_text}」第 ${rank + 1} 順位`
                                      : `選擇「${option.option_text}」作為排序`
                                  }
                                  onClick={() => {
                                    const next = selected
                                      ? selectedOptions.filter((item) => item !== choice)
                                      : [...selectedOptions, choice]
                                    setPreviewAnswer(question._key, next)
                                  }}
                                  className={`h-auto w-full justify-start gap-3 whitespace-normal px-3 py-3 text-left font-normal ${selected ? 'border-primary bg-primary/5' : ''}`}
                                >
                                  <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${selected ? 'bg-primary text-primary-foreground' : 'border border-input text-transparent'}`}
                                  >
                                    {selected ? rank + 1 : ''}
                                  </span>
                                  <span className="min-w-0 flex-1">{option.option_text}</span>
                                </Button>
                              )
                            })}
                          </div>
                        )}

                        {question.question_type === 'rating' && (
                          <div
                            className="flex items-center gap-1"
                            role="radiogroup"
                            aria-label={`${question.question_text}評分`}
                          >
                            {[1, 2, 3, 4, 5].map((value) => {
                              const selectedValue = Number(answer || 0)
                              const isFilled = value <= selectedValue
                              return (
                                <Button
                                  key={value}
                                  type="button"
                                  variant="ghost"
                                  role="radio"
                                  aria-checked={answer === String(value)}
                                  tabIndex={
                                    answer === String(value) || (!answer && value === 1) ? 0 : -1
                                  }
                                  aria-label={`${value} 分`}
                                  onClick={() => setPreviewAnswer(question._key, String(value))}
                                  onKeyDown={(event) => {
                                    let direction = 0
                                    if (event.key === 'ArrowRight' || event.key === 'ArrowUp')
                                      direction = 1
                                    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
                                      direction = -1
                                    if (direction === 0) return
                                    event.preventDefault()
                                    const nextValue = Math.min(5, Math.max(1, value + direction))
                                    setPreviewAnswer(question._key, String(nextValue))
                                    event.currentTarget.parentElement
                                      ?.querySelector<HTMLButtonElement>(
                                        `[aria-label="${nextValue} 分"]`,
                                      )
                                      ?.focus()
                                  }}
                                  className="h-10 w-10 p-1 hover:bg-amber-50"
                                >
                                  <Star
                                    className={`h-7 w-7 ${isFilled ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`}
                                  />
                                </Button>
                              )
                            })}
                          </div>
                        )}

                        {question.question_type === 'scale' && (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {Array.from(
                                {
                                  length: Math.max(0, question.scale_max - question.scale_min + 1),
                                },
                                (_, index) => question.scale_min + index,
                              ).map((value) => (
                                <Button
                                  key={value}
                                  type="button"
                                  variant={answer === String(value) ? 'primary' : 'outline'}
                                  aria-pressed={answer === String(value)}
                                  aria-label={`${value} 分`}
                                  onClick={() => setPreviewAnswer(question._key, String(value))}
                                  className="h-9 w-9 p-0"
                                >
                                  {value}
                                </Button>
                              ))}
                            </div>
                            {(question.scale_min_label || question.scale_max_label) && (
                              <div className="flex justify-between gap-4 text-xs text-muted-foreground">
                                <span>{question.scale_min_label}</span>
                                <span className="text-right">{question.scale_max_label}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {hasError && (
                          <p className="text-xs text-destructive dark:text-red-400">
                            請完成此題並確認格式正確
                          </p>
                        )}
                      </section>
                    )
                  })}
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={submitPreview}
                  className="w-full sm:w-auto"
                >
                  送出回覆
                </Button>
              </>
            )}
          </article>
        </div>

        {/* Questions */}
        <fieldset
          disabled={!!(existingData?.structure_locked || existingData?.response_count)}
          className={isPreviewing ? 'hidden' : 'min-w-0 space-y-3'}
          aria-hidden={isPreviewing}
        >
          {existingData?.structure_locked || existingData?.response_count ? (
            <p className="text-sm text-muted-foreground">
              此問卷已有提交紀錄，題目、回應對象與匿名設定已鎖定。可複製問卷後調整。
            </p>
          ) : null}
          <h3 className="text-sm font-semibold">題目</h3>

          {questions.map((q, qi) => (
            <div
              key={q._key}
              ref={(element) => {
                if (element) questionCardRefs.current.set(q._key, element)
                else questionCardRefs.current.delete(q._key)
              }}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="truncate text-sm font-medium">
                  {q.question_text.trim() || '未命名問題'}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <Badge>{QUESTION_TYPE_LABELS[q.question_type] ?? q.question_type}</Badge>
                  <span>{q.is_required ? '必填' : '選填'}</span>
                  {q.question_type === 'text' && (
                    <span>{q.text_response_length === 'long' ? '長答' : '短答'}</span>
                  )}
                  {q.question_type === 'scale' && (
                    <span>
                      {q.scale_min}–{q.scale_max}
                    </span>
                  )}
                  {OPTION_TYPES.has(q.question_type) && (
                    <span className="min-w-0 truncate">
                      {q.options.filter((option) => option.option_text.trim()).length} 個選項
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => editQuestion(q)}
                  aria-label={`編輯第 ${qi + 1} 題`}
                  title="編輯題目"
                  data-question-edit
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => moveQuestion(q._key, -1)}
                  disabled={qi === 0}
                  aria-label={`第 ${qi + 1} 題上移`}
                  title="上移"
                  className="shrink-0"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => moveQuestion(q._key, 1)}
                  disabled={qi === questions.length - 1}
                  aria-label={`第 ${qi + 1} 題下移`}
                  title="下移"
                  className="shrink-0"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => duplicateQuestion(q._key)}
                  aria-label={`複製第 ${qi + 1} 題`}
                  title="複製題目"
                  className="shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => removeQuestion(q._key)}
                  aria-label={`刪除第 ${qi + 1} 題`}
                  title="刪除題目"
                  className="shrink-0 text-muted-foreground hover:text-destructive dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex justify-start pt-2">
            <Button
              type="button"
              onClick={() => {
                setQuestionSetupMode('create')
                setQuestionSetup(null)
                setIsQuestionTypeOpen(true)
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              新增題目
            </Button>
          </div>
        </fieldset>

        {/* Thank-you message follows the question section. */}
        <div className={isPreviewing ? 'hidden' : ''} aria-hidden={isPreviewing}>
          <textarea
            id="survey-thank-you-message"
            value={thankYouMessage}
            onChange={(event) => setThankYouMessage(event.target.value)}
            placeholder="感謝你的回應。"
            aria-label="回應送出後顯示的感謝訊息"
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent
          aria-label="問卷設定"
          className="survey-workspace h-auto max-h-[85vh] max-w-md p-6"
        >
          <fieldset disabled={isPending} className="min-w-0 space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">回應對象</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'public', title: '公開回應', detail: '任何人皆可回應' },
                    { value: 'members', title: '參與者限定', detail: '回應前需登入' },
                  ] as const
                ).map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    aria-pressed={surveyAudience === option.value}
                    disabled={!!(existingData?.structure_locked || existingData?.response_count)}
                    onClick={() => setSurveyAudience(option.value)}
                    className={`h-auto min-h-[4.25rem] justify-start px-3 py-2 text-left ${surveyAudience === option.value ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : ''}`}
                  >
                    <span>
                      <span className="block text-sm font-medium">{option.title}</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {option.detail}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            {surveyAudience === 'members' && (
              <div className="border-t border-border pt-4">
                <SettingSwitch
                  label="匿名問卷"
                  checked={isAnonymous}
                  disabled={!!(existingData?.structure_locked || existingData?.response_count)}
                  onCheckedChange={setIsAnonymous}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAnonymous
                    ? '回應者需登入，回覆不顯示參與者身份。'
                    : '回覆會保留回應者的參與者身份。'}
                </p>
              </div>
            )}
            <div className="space-y-3 border-t border-border pt-4">
              <SettingSwitch
                label="最大回應數"
                checked={hasMaxResponses}
                onCheckedChange={setHasMaxResponses}
              />
              {hasMaxResponses && (
                <Input
                  id="survey-max-responses"
                  type="number"
                  value={maxResponses}
                  onChange={(event) => setMaxResponses(event.target.value)}
                  placeholder="輸入人數上限"
                  aria-label="最大回應數"
                  min={1}
                />
              )}
            </div>
            {mode === 'edit' && (surveyStatus === 'active' || surveyStatus === 'closed') && (
              <div className="border-t border-border pt-4">
                <SettingSwitch
                  label="關閉問卷"
                  checked={surveyStatus === 'closed'}
                  onCheckedChange={(closed) =>
                    surveyAvailabilityMut.mutate(closed ? 'closed' : 'active')
                  }
                  disabled={surveyAvailabilityMut.isPending}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {surveyStatus === 'closed'
                    ? '目前已停止接收回應；關閉此開關可重新開放。'
                    : '開啟此開關後將停止接收回應。'}
                </p>
              </div>
            )}
            {mode === 'edit' && surveyId !== undefined && (
              <div className="border-t border-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={surveyStatus === 'archived' || isPending}
                  onClick={async () => {
                    if (isPending || !window.confirm('封存後無法重新開啟問卷，確定封存？')) return
                    setIsArchiving(true)
                    try {
                      await updateAdminSurveyStatus(surveyId, 'archived')
                      setSurveyStatus('archived')
                      setHeaderSurveyStatus('archived')
                      setSurveyCanPublish(false)
                      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
                    } catch (error) {
                      setError(getApiErrorMessage(error, '封存失敗，請重試'))
                    } finally {
                      setIsArchiving(false)
                    }
                  }}
                >
                  封存問卷
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  封存後停止接受回應，無法重新開啟。已有回應仍可查看與匯出。
                </p>
              </div>
            )}
          </fieldset>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isQuestionTypeOpen}
        onOpenChange={(open) => {
          setIsQuestionTypeOpen(open)
          if (!open) setQuestionSetup(null)
        }}
      >
        <DialogContent
          aria-label={questionSetup ? '題目設定' : '選擇題型'}
          className="survey-workspace h-auto max-h-[85vh] max-w-xl overflow-y-auto p-5 sm:p-6"
        >
          <fieldset disabled={isPending} className="min-w-0">
            {!questionSetup ? (
              <>
                <div className="mb-4 space-y-1">
                  <h2 className="text-lg font-semibold">新增題目</h2>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {QUESTION_TYPE_OPTIONS.map((option) => {
                    const TypeIcon = option.icon
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        className="h-auto min-h-16 justify-start gap-3 whitespace-normal p-3 text-left"
                        onClick={() => beginQuestionSetup(option.value)}
                      >
                        <TypeIcon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{option.label}</span>
                          <span className="block text-xs font-normal text-muted-foreground">
                            {option.detail}
                          </span>
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                {questionSetupMode === 'create' && (
                  <div className="-ml-2 -mt-2 mb-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="返回題型選擇"
                      title="返回題型選擇"
                      onClick={() => setQuestionSetup(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <Type className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {QUESTION_TYPE_LABELS[questionSetup.question_type] ??
                        questionSetup.question_type}
                    </span>
                  </div>

                  <div>
                    <Input
                      id="question-setup-text"
                      value={questionSetup.question_text}
                      onChange={(event) =>
                        setQuestionSetup((current) =>
                          current ? { ...current, question_text: event.target.value } : current,
                        )
                      }
                      placeholder="輸入問題"
                      aria-label="問題"
                      autoFocus
                    />
                  </div>

                  {surveyAudience === 'members' && questionSetup.question_type === 'email' && (
                    <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">
                      此問卷需登入才能回應。請確認是否仍需要額外蒐集電子郵件。
                    </p>
                  )}

                  {questionSetup.question_type === 'text' && (
                    <div>
                      <fieldset className="grid grid-cols-2 gap-2">
                        <legend className="sr-only">回答長度</legend>
                        <Button
                          type="button"
                          variant="outline"
                          aria-pressed={questionSetup.text_response_length === 'short'}
                          onClick={() =>
                            setQuestionSetup((current) =>
                              current ? { ...current, text_response_length: 'short' } : current,
                            )
                          }
                          className={`h-auto justify-start py-2.5 text-left ${questionSetup.text_response_length === 'short' ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30' : 'bg-background'}`}
                        >
                          <span>
                            <span className="block text-sm font-medium">短答</span>
                            <span className="block text-xs font-normal text-muted-foreground">
                              單行文字
                            </span>
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          aria-pressed={questionSetup.text_response_length === 'long'}
                          onClick={() =>
                            setQuestionSetup((current) =>
                              current ? { ...current, text_response_length: 'long' } : current,
                            )
                          }
                          className={`h-auto justify-start py-2.5 text-left ${questionSetup.text_response_length === 'long' ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30' : 'bg-background'}`}
                        >
                          <span>
                            <span className="block text-sm font-medium">長答</span>
                            <span className="block text-xs font-normal text-muted-foreground">
                              多行文字
                            </span>
                          </span>
                        </Button>
                      </fieldset>
                    </div>
                  )}

                  {questionSetup.question_type === 'scale' && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">量表範圍</p>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <Input
                          type="number"
                          step={1}
                          value={questionSetup.scale_min}
                          onChange={(event) =>
                            setQuestionSetup((current) =>
                              current
                                ? { ...current, scale_min: Number(event.target.value) }
                                : current,
                            )
                          }
                          aria-label="量表起始值"
                        />
                        <span className="text-sm text-muted-foreground">至</span>
                        <Input
                          type="number"
                          step={1}
                          value={questionSetup.scale_max}
                          onChange={(event) =>
                            setQuestionSetup((current) =>
                              current
                                ? { ...current, scale_max: Number(event.target.value) }
                                : current,
                            )
                          }
                          aria-label="量表結束值"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={questionSetup.scale_min_label}
                          onChange={(event) =>
                            setQuestionSetup((current) =>
                              current
                                ? { ...current, scale_min_label: event.target.value }
                                : current,
                            )
                          }
                          placeholder="左端文字"
                          aria-label="量表左端文字"
                        />
                        <Input
                          value={questionSetup.scale_max_label}
                          onChange={(event) =>
                            setQuestionSetup((current) =>
                              current
                                ? { ...current, scale_max_label: event.target.value }
                                : current,
                            )
                          }
                          placeholder="右端文字"
                          aria-label="量表右端文字"
                        />
                      </div>
                      {questionSetup.scale_min >= questionSetup.scale_max && (
                        <p className="text-xs text-destructive dark:text-red-400">
                          結束值必須大於起始值
                        </p>
                      )}
                    </div>
                  )}

                  {OPTION_TYPES.has(questionSetup.question_type) && (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">選項</p>
                        <p className="text-xs text-muted-foreground">
                          新增至少兩個選項，回應者才能作答。
                        </p>
                      </div>
                      <div className="space-y-2">
                        {questionSetup.options.map((option, index) => (
                          <div key={option._key} className="flex items-center gap-2">
                            <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                              {index + 1}.
                            </span>
                            <Input
                              value={option.option_text}
                              onChange={(event) => updateSetupOption(index, event.target.value)}
                              placeholder={`選項 ${index + 1}`}
                              aria-label={`選項 ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`刪除選項 ${index + 1}`}
                              title="刪除選項"
                              disabled={questionSetup.options.length <= 1}
                              onClick={() => removeSetupOption(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="ghost" size="sm" onClick={addSetupOption}>
                          <Plus className="mr-1 h-4 w-4" />
                          新增選項
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <SettingSwitch
                      label="必填"
                      checked={questionSetup.is_required}
                      onCheckedChange={(checked) =>
                        setQuestionSetup((current) =>
                          current ? { ...current, is_required: checked } : current,
                        )
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border pt-4">
                    <Button
                      type="button"
                      onClick={saveQuestionSetup}
                      disabled={
                        !questionSetup.question_text.trim() ||
                        (questionSetup.question_type === 'scale' &&
                          (questionSetup.scale_min >= questionSetup.scale_max ||
                            questionSetup.scale_max - questionSetup.scale_min > 100 ||
                            questionSetup.scale_min < -100 ||
                            questionSetup.scale_max > 100 ||
                            !Number.isInteger(questionSetup.scale_min) ||
                            !Number.isInteger(questionSetup.scale_max))) ||
                        (OPTION_TYPES.has(questionSetup.question_type) &&
                          questionSetup.options.filter((option) => option.option_text.trim())
                            .length < 2)
                      }
                    >
                      {questionSetupMode === 'create' ? '加入題目' : '儲存'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </fieldset>
        </DialogContent>
      </Dialog>
    </fieldset>
  )
}
