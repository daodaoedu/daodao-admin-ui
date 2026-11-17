import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { updateAdminSurvey } from '@/api/admin-survey'
import type { AdminSurveyDetail, SurveyStatus } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/lib/survey-errors'
import { useSurveyWorkspace } from './SurveyWorkspace'

/** Preserve the legacy metadata contract without upgrading its response or privacy policy. */
export function LegacySurveyForm({
  survey,
  onSuccess,
  onDirtyChange,
  onHeaderDirtyChange,
}: {
  survey: AdminSurveyDetail
  onSuccess: () => void
  onDirtyChange: (dirty: boolean) => void
  onHeaderDirtyChange: (dirty: boolean) => void
}) {
  const {
    setSurveyLegacyEditing,
    setSurveyStatus,
    setSurveySubmitPending,
    setSurveyCanPublish,
    registerSurveySubmitHandler,
    registerSurveyPublishHandler,
  } = useSurveyWorkspace<{
    setSurveyLegacyEditing: (legacy: boolean) => void
    setSurveyStatus: (status: SurveyStatus) => void
    setSurveySubmitPending: (pending: boolean) => void
    setSurveyCanPublish: (canPublish: boolean) => void
    registerSurveySubmitHandler: (handler: (() => void) | null) => void
    registerSurveyPublishHandler: (handler: (() => void) | null) => void
  }>()
  const [title, setTitle] = useState(survey.title)
  const [description, setDescription] = useState(survey.description ?? '')
  const [tagsInput, setTagsInput] = useState(survey.tags.join(', '))
  const [coverUrl, setCoverUrl] = useState(survey.cover_url ?? '')
  const [isAnonymous, setIsAnonymous] = useState(survey.is_anonymous)
  const [maxResponses, setMaxResponses] = useState(
    survey.max_responses == null ? '' : String(survey.max_responses),
  )
  const [error, setError] = useState('')
  const snapshot = JSON.stringify({
    title,
    description,
    tagsInput,
    coverUrl,
    isAnonymous,
    maxResponses,
  })
  const savedSnapshot = useRef(snapshot)
  const dirty = snapshot !== savedSnapshot.current
  const submit = useRef<() => void>(() => {})
  const save = useMutation({
    mutationFn: (payload: Parameters<typeof updateAdminSurvey>[1]) =>
      updateAdminSurvey(survey.id, payload),
    onSuccess: () => {
      savedSnapshot.current = snapshot
      onDirtyChange(false)
      onHeaderDirtyChange(false)
      onSuccess()
    },
    onError: (failure) => setError(getApiErrorMessage(failure, '更新失敗，請重試')),
  })
  useEffect(() => {
    setSurveyLegacyEditing(true)
    setSurveyStatus(survey.status)
    setSurveyCanPublish(false)
    registerSurveyPublishHandler(null)
    registerSurveySubmitHandler(() => submit.current())
    return () => {
      setSurveyLegacyEditing(false)
      setSurveySubmitPending(false)
      registerSurveySubmitHandler(null)
    }
  }, [
    registerSurveyPublishHandler,
    registerSurveySubmitHandler,
    setSurveyCanPublish,
    setSurveyLegacyEditing,
    setSurveyStatus,
    setSurveySubmitPending,
    survey.status,
  ])
  useEffect(() => {
    setSurveySubmitPending(save.isPending)
  }, [save.isPending, setSurveySubmitPending])
  useEffect(() => {
    onDirtyChange(dirty)
    onHeaderDirtyChange(dirty)
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty, onDirtyChange, onHeaderDirtyChange])
  const handleSave = () => {
    if (!dirty || save.isPending) return
    setError('')
    if (!title.trim()) {
      setError('標題為必填')
      return
    }
    const maximum = maxResponses.trim() === '' ? null : Number(maxResponses)
    if (maximum !== null && (!Number.isInteger(maximum) || maximum <= 0)) {
      setError('最大回應數必須為正整數')
      return
    }
    save.mutate({
      title: title.trim(),
      description: description.trim(),
      tags: tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      cover_url: coverUrl.trim() || null,
      is_anonymous: isAnonymous,
      max_responses: maximum,
    })
  }
  submit.current = handleSave
  return (
    <form
      className="space-y-5 p-5"
      onSubmit={(event) => {
        event.preventDefault()
        handleSave()
      }}
    >
      <div className="space-y-2 rounded-lg border border-border bg-muted p-4">
        <h2 className="font-semibold">舊版問卷基本設定</h2>
        <p className="text-sm text-muted-foreground">
          可儲存既有基本設定，原問卷與回應方式會保留。題目、新版 Logo
          與感謝訊息需返回管理列表，使用「複製問卷」建立新版後再編輯。
        </p>
        <p className="text-sm text-muted-foreground">狀態可從管理列表的「更改狀態」調整。</p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive dark:text-red-400">
          {error}
        </p>
      )}
      <fieldset className="min-w-0 space-y-4" disabled={save.isPending}>
        <div>
          <label htmlFor="legacy-survey-title" className="mb-1 block text-sm font-medium">
            標題
          </label>
          <Input
            id="legacy-survey-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
          />
        </div>
        <div>
          <label htmlFor="legacy-survey-description" className="mb-1 block text-sm font-medium">
            描述
          </label>
          <textarea
            id="legacy-survey-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="legacy-survey-tags" className="mb-1 block text-sm font-medium">
            標籤（逗號分隔）
          </label>
          <Input
            id="legacy-survey-tags"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="legacy-survey-cover" className="mb-1 block text-sm font-medium">
            封面圖片網址
          </label>
          <Input
            id="legacy-survey-cover"
            type="url"
            value={coverUrl}
            onChange={(event) => setCoverUrl(event.target.value)}
            placeholder="https://example.com/image.png"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="legacy-survey-anonymous"
            checked={isAnonymous}
            onCheckedChange={(checked) => setIsAnonymous(!!checked)}
          />
          <label htmlFor="legacy-survey-anonymous" className="text-sm">
            匿名問卷
          </label>
        </div>
        <div>
          <label htmlFor="legacy-survey-max" className="mb-1 block text-sm font-medium">
            最大回應數（選填）
          </label>
          <Input
            id="legacy-survey-max"
            type="number"
            min={1}
            step={1}
            value={maxResponses}
            onChange={(event) => setMaxResponses(event.target.value)}
            placeholder="不限制則留空"
          />
        </div>
        <Button type="submit" disabled={!dirty || save.isPending}>
          {save.isPending ? '儲存中…' : '儲存舊版問卷'}
        </Button>
      </fieldset>
    </form>
  )
}
