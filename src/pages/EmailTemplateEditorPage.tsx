import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import CodeMirror from '@uiw/react-codemirror'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Monitor,
  Power,
  Save,
  Smartphone,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AVAILABLE_EMAIL_VARIABLES,
  useEmailTemplate,
  useUpdateEmailTemplate,
} from '@/hooks/useEmailTemplates'
import { detectVariables, renderEmailPreview } from '@/lib/email-preview'
import {
  buildEmailTemplateUpdate,
  mergeTemplateVariables,
  templateSaveErrorMessage,
} from '@/lib/email-template-save'

type PreviewMode = 'desktop' | 'mobile'

export default function EmailTemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const templateId = id ? Number(id) : null

  const { data: template, isLoading } = useEmailTemplate(templateId)
  const updateMutation = useUpdateEmailTemplate()

  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [dataSource, setDataSource] = useState<'user' | 'practice' | 'event' | 'none'>('none')
  const [variableSearch, setVariableSearch] = useState('')
  const [savedOk, setSavedOk] = useState(false)
  const [isActive, setIsActive] = useState(true)
  // 模板登記的變數清單；存檔只增不減（daodao#292 AC-01）
  const [registeredVariables, setRegisteredVariables] = useState<string[]>([])

  // Initialise from fetched template
  useEffect(() => {
    if (!template) return
    setContent(template.body)
    setSubject(template.subject)
    setPreheader(template.preheader ?? '')
    setDataSource(template.dataSource)
    setIsActive(template.isActive)
    setRegisteredVariables(template.variables ?? [])
  }, [template])

  // 「已儲存」一直留到下一次編輯，不自動消失（daodao#236：2 秒就收掉，PM 看不到）
  // biome-ignore lint/correctness/useExhaustiveDependencies: 只在編輯內容變動時收起提示
  useEffect(() => {
    setSavedOk(false)
  }, [content, subject, preheader, dataSource])

  // Auto-detect variables when content changes
  const detectedVars = detectVariables(content)
  const templateVariables = mergeTemplateVariables(registeredVariables, [
    subject,
    preheader,
    content,
  ])
  const variableQuery = variableSearch.trim().toLowerCase()
  const variableSearchResults = variableQuery
    ? AVAILABLE_EMAIL_VARIABLES.filter((variable) => variable.toLowerCase().includes(variableQuery))
    : []

  const isFullHtml =
    content.trimStart().startsWith('<!DOCTYPE') || content.trimStart().startsWith('<html')
  const previewHtml = isFullHtml
    ? content
    : renderEmailPreview({ title: subject, preheader, content })

  const handleSave = useCallback(() => {
    if (!templateId) return
    setSavedOk(false)
    const data = buildEmailTemplateUpdate({
      registeredVariables,
      body: content,
      subject,
      preheader,
      dataSource,
      isActive,
    })
    updateMutation.mutate(
      { id: templateId, data },
      {
        onSuccess: () => {
          setRegisteredVariables(data.variables ?? [])
          setSavedOk(true)
        },
      },
    )
  }, [
    templateId,
    registeredVariables,
    content,
    subject,
    preheader,
    dataSource,
    isActive,
    updateMutation,
  ])

  const handleToggleSending = useCallback(() => {
    if (!templateId) return
    setSavedOk(false)
    const nextIsActive = !isActive
    updateMutation.mutate(
      { id: templateId, data: { isActive: nextIsActive } },
      {
        onSuccess: () => {
          setIsActive(nextIsActive)
          setSavedOk(true)
        },
      },
    )
  }, [templateId, isActive, updateMutation])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>找不到模板</p>
        <button
          type="button"
          onClick={() => navigate('/email-templates')}
          className="text-sm underline"
        >
          返回
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => navigate('/email-templates')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
        <div className="h-4 w-px bg-border" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{template.name}</span>
          {template.slug && (
            <span className="text-xs text-muted-foreground">slug: {template.slug}</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSending}
            disabled={updateMutation.isPending}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
              isActive
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
            title={isActive ? '停用後將不再發送此模板' : '重新啟用此模板的發送'}
          >
            <Power className="h-4 w-4" />
            {isActive ? '停用寄送' : '啟用寄送'}
          </button>
          {savedOk && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {template.slug ? '已儲存，最多 5 分鐘後生效' : '已儲存'}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            儲存
          </button>
        </div>
      </div>

      {updateMutation.isError && (
        <p
          role="alert"
          className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
        >
          {templateSaveErrorMessage(updateMutation.error)}
        </p>
      )}

      {/* 寄信端依 slug 讀模板且有 5 分鐘快取（server template-resolver TEMPLATE_CACHE_TTL_MS，daodao#236 AC-06）；沒有 slug 的模板不會被寄信流程使用 */}
      <p
        role="note"
        className="flex shrink-0 items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"
      >
        <Clock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          {template.slug
            ? '儲存或切換啟用／停用寄送後，最多 5 分鐘才會套用到實際寄出的信件。'
            : '這個模板沒有 slug，尚未接上任何寄信流程：修改或停用不會影響實際寄出的信件。'}
        </span>
      </p>

      {/* Subject / Preheader bar */}
      <div className="flex shrink-0 gap-3 border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex flex-1 items-center gap-2">
          <span className="shrink-0 text-xs text-muted-foreground">主旨</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-1 items-center gap-2">
          <span className="shrink-0 text-xs text-muted-foreground">預覽文字</span>
          <input
            type="text"
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            placeholder="郵件列表摘要（可選）"
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Full-width editor followed by the live preview */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <div className="flex shrink-0 flex-col border-b border-border">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">HTML 內容</span>
            <span className="text-xs text-muted-foreground">
              偵測到 {detectedVars.length} 個變數
            </span>
          </div>
          {/* Variables panel */}
          {templateVariables.length > 0 && (
            <div className="shrink-0 border-t border-border bg-muted/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">預覽變數</span>
                <input
                  type="search"
                  value={variableSearch}
                  onChange={(event) => setVariableSearch(event.target.value)}
                  placeholder="搜尋全站變數"
                  aria-label="搜尋全站變數"
                  className="w-36 rounded border border-border bg-background px-2 py-1 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <p className="mb-2 text-xs text-muted-foreground">本模板使用的變數</p>
              <div className="flex flex-wrap gap-2">
                {templateVariables.map((variable) => (
                  <code
                    key={variable}
                    className="rounded bg-primary/10 px-2 py-1 font-mono text-xs font-medium text-primary"
                  >
                    {`{{${variable}}}`}
                  </code>
                ))}
              </div>
              {variableQuery && (
                <div className="mt-3 rounded-md border border-border bg-background p-2">
                  <p className="mb-2 text-xs text-muted-foreground">全站可用變數</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variableSearchResults.map((variable) => (
                      <code
                        key={variable}
                        className="rounded bg-primary/10 px-2 py-1 font-mono text-xs font-medium text-primary"
                      >
                        {`{{${variable}}}`}
                      </code>
                    ))}
                    {variableSearchResults.length === 0 && (
                      <span className="text-xs text-muted-foreground">找不到符合的變數</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* 全寬、可垂直拖曳調整高度的編輯區；CodeMirror 撐滿外層容器 */}
          <div className="h-[22rem] min-h-[12rem] w-full resize-y overflow-auto">
            <CodeMirror
              value={content}
              aria-label="HTML 內容"
              height="100%"
              theme={oneDark}
              extensions={[html()]}
              onChange={setContent}
              style={{ fontSize: '13px', height: '100%' }}
            />
          </div>
        </div>

        <div className="flex min-h-[52rem] shrink-0 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">預覽</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`rounded p-1.5 ${previewMode === 'desktop' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                title="桌機"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`rounded p-1.5 ${previewMode === 'mobile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                title="手機"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-muted/20 p-4">
            <div
              className={`overflow-hidden rounded shadow-md transition-all ${
                previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[600px]'
              }`}
            >
              {/* 用 srcDoc 而非 data: URL：正式環境 CSP default-src 'self' https: 會擋 data: iframe */}
              <iframe
                srcDoc={previewHtml}
                title="email-preview"
                className="h-[800px] w-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
