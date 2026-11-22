import './survey-workspace.css'
import { ArrowLeft, Eye, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { SurveyStatus } from '@/api/types'
import { Button } from '@/components/ui/button'

export interface SurveyPageHeading {
  title: string
  description?: string
  actions?: ReactNode
}
interface WorkspaceContext {
  surveyLegacyEditing: boolean
  setSurveyLegacyEditing: (legacy: boolean) => void
  surveyPreviewing: boolean
  surveySettingsOpen: boolean
  setSurveyEditorOpen: (v: boolean) => void
  setSurveyResultsOpen: (v: boolean) => void
  setSurveyPreviewing: (v: boolean) => void
  setSurveySettingsOpen: (v: boolean) => void
  setSurveyStatus: (v: SurveyStatus) => void
  setSurveyAudience: (v: 'public' | 'members') => void
  setSurveyCanPublish: (v: boolean) => void
  setSurveySubmitPending: (v: boolean) => void
  setSurveyHasChanges: (v: boolean) => void
  setSurveyPageHeading: (v: SurveyPageHeading | null) => void
  registerSurveySubmitHandler: (v: (() => void) | null) => void
  registerSurveyPublishHandler: (v: (() => void) | null) => void
  registerSurveyReturnHandler: (v: (() => void) | null) => void
}
const Context = createContext<WorkspaceContext | null>(null)
export function useSurveyWorkspace<T>(): T {
  const context = useContext(Context)
  if (!context) throw new Error('Survey workspace is missing')
  return context as T
}
export function SurveyWorkspace({ children }: { children: ReactNode }) {
  const [surveyLegacyEditing, setSurveyLegacyEditing] = useState(false)
  const [editor, setSurveyEditorOpen] = useState(false)
  const [results, setSurveyResultsOpen] = useState(false)
  const [surveyPreviewing, setSurveyPreviewing] = useState(false)
  const [surveySettingsOpen, setSurveySettingsOpen] = useState(false)
  const [status, setSurveyStatus] = useState<SurveyStatus>('draft')
  const [audience, setSurveyAudience] = useState<'public' | 'members'>('public')
  const [canPublish, setSurveyCanPublish] = useState(false)
  const [pending, setSurveySubmitPending] = useState(false)
  const [dirty, setSurveyHasChanges] = useState(false)
  const [heading, setSurveyPageHeading] = useState<SurveyPageHeading | null>(null)
  const submit = useRef<(() => void) | null>(null)
  const publish = useRef<(() => void) | null>(null)
  const back = useRef<(() => void) | null>(null)
  const registerSurveySubmitHandler = useCallback((v: (() => void) | null) => {
    submit.current = v
  }, [])
  const registerSurveyPublishHandler = useCallback((v: (() => void) | null) => {
    publish.current = v
  }, [])
  const registerSurveyReturnHandler = useCallback((v: (() => void) | null) => {
    back.current = v
  }, [])
  const value = useMemo(
    () => ({
      surveyLegacyEditing,
      setSurveyLegacyEditing,
      surveyPreviewing,
      surveySettingsOpen,
      setSurveyEditorOpen,
      setSurveyResultsOpen,
      setSurveyPreviewing,
      setSurveySettingsOpen,
      setSurveyStatus,
      setSurveyAudience,
      setSurveyCanPublish,
      setSurveySubmitPending,
      setSurveyHasChanges,
      setSurveyPageHeading,
      registerSurveySubmitHandler,
      registerSurveyPublishHandler,
      registerSurveyReturnHandler,
    }),
    [
      surveyLegacyEditing,
      surveyPreviewing,
      surveySettingsOpen,
      registerSurveySubmitHandler,
      registerSurveyPublishHandler,
      registerSurveyReturnHandler,
    ],
  )
  const audienceLabel = { public: '對外問卷', members: '參與者限定' }[audience]
  return (
    <Context.Provider value={value}>
      <div className="survey-workspace flex min-h-0 flex-col gap-5">
        <div className="sticky -top-5 z-20 -mx-5 -mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-5">
          <div className="flex min-w-0 basis-full items-start gap-2 sm:flex-1 sm:basis-auto">
            {(editor || results) && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 whitespace-nowrap"
                disabled={pending}
                aria-label="返回問卷管理"
                onClick={() => back.current?.()}
              >
                <ArrowLeft className="size-4" />
                <span>返回管理</span>
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="whitespace-nowrap text-lg font-semibold">
                {editor ? '編輯問卷' : (heading?.title ?? '問卷管理')}
              </h1>
              {editor ? (
                <p className="text-xs text-muted-foreground">
                  {
                    { draft: '草稿', active: '進行中', closed: '已關閉', archived: '已封存' }[
                      status
                    ]
                  }{' '}
                  · {surveyLegacyEditing ? '舊版問卷' : audienceLabel}
                  {dirty ? ' · 尚未儲存' : ''}
                </p>
              ) : (
                <p className="break-words text-sm text-muted-foreground">{heading?.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {editor ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={surveyLegacyEditing || pending}
                  aria-pressed={surveyPreviewing}
                  onClick={() => setSurveyPreviewing(!surveyPreviewing)}
                >
                  <Eye className="size-4" />
                  預覽
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={surveyLegacyEditing || pending}
                  onClick={() => setSurveySettingsOpen(!surveySettingsOpen)}
                >
                  <Settings className="size-4" />
                  設定
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!dirty || pending}
                  onClick={() => submit.current?.()}
                >
                  {pending ? '儲存中…' : '儲存'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={surveyLegacyEditing || !canPublish || pending}
                  onClick={() => publish.current?.()}
                >
                  {status === 'closed' ? '重新開啟' : '發布'}
                </Button>
              </>
            ) : (
              heading?.actions
            )}
          </div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </Context.Provider>
  )
}
