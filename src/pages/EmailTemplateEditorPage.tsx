import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import CodeMirror from '@uiw/react-codemirror'
import { ArrowLeft, Loader2, Monitor, Save, Search, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listAdminUsers } from '@/api/admin'
import type { AdminUserListItem, EmailTemplateUpdate } from '@/api/types'
import { useEmailTemplate, useUpdateEmailTemplate } from '@/hooks/useEmailTemplates'
import { detectVariables, renderEmailPreview } from '@/lib/email-preview'

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
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [dataSource, setDataSource] = useState<'user' | 'practice' | 'event' | 'none'>('none')
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<AdminUserListItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Initialise from fetched template
  useEffect(() => {
    if (!template) return
    setContent(template.body)
    setSubject(template.subject)
    setPreheader(template.preheader ?? '')
    setDataSource(template.dataSource)
  }, [template])

  // Auto-detect variables when content changes
  const detectedVars = detectVariables(content)

  const isFullHtml =
    content.trimStart().startsWith('<!DOCTYPE') || content.trimStart().startsWith('<html')
  const previewHtml = isFullHtml
    ? content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`)
    : renderEmailPreview({ title: subject, preheader, content, variables })

  const handleSave = useCallback(() => {
    if (!templateId) return
    const data: EmailTemplateUpdate = {
      body: content,
      subject,
      preheader: preheader || undefined,
      variables: detectedVars,
      dataSource,
    }
    updateMutation.mutate(
      { id: templateId, data },
      {
        onSuccess: () => {
          setSavedOk(true)
          setTimeout(() => setSavedOk(false), 2000)
        },
      },
    )
  }, [templateId, content, subject, preheader, detectedVars, dataSource, updateMutation])

  async function handleUserSearch() {
    if (!userSearch.trim()) return
    setIsSearching(true)
    try {
      const res = await listAdminUsers({ search: userSearch, limit: 5 })
      setUserResults(res.data.data ?? [])
    } finally {
      setIsSearching(false)
    }
  }

  function applyUser(user: AdminUserListItem) {
    const displayName = user.name ?? user.email ?? ''
    const emailVal = user.email ?? ''
    setVariables((prev) => ({
      ...prev,
      name: displayName,
      userName: displayName,
      email: emailVal,
      recipientName: displayName,
    }))
    setUserResults([])
    setUserSearch('')
  }

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
          {savedOk && <span className="text-sm text-green-600">已儲存</span>}
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

      {/* Main split pane */}
      <div className="flex min-h-0 flex-1">
        {/* Left: editor */}
        <div className="flex w-1/2 flex-col border-r border-border">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">HTML 內容</span>
            <span className="text-xs text-muted-foreground">
              偵測到 {detectedVars.length} 個變數
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <CodeMirror
              value={content}
              height="100%"
              theme={oneDark}
              extensions={[html()]}
              onChange={setContent}
              style={{ fontSize: '13px', height: '100%' }}
            />
          </div>
          {/* Variables panel */}
          {detectedVars.length > 0 && (
            <div className="shrink-0 border-t border-border bg-muted/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">預覽變數</span>
                <div className="flex items-center gap-2">
                  <select
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value as typeof dataSource)}
                    className="rounded border border-border bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="none">手動輸入</option>
                    <option value="user">從用戶選取</option>
                    <option value="practice">從練習選取</option>
                    <option value="event">從活動選取</option>
                  </select>
                </div>
              </div>

              {dataSource === 'user' && (
                <div className="mb-2 flex gap-2">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                    placeholder="搜尋用戶（email 或暱稱）"
                    className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleUserSearch}
                    disabled={isSearching}
                    className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                  >
                    {isSearching ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Search className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}

              {userResults.length > 0 && (
                <div className="mb-2 rounded border border-border bg-background shadow-sm">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => applyUser(u)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                    >
                      <span className="font-medium">{u.name ?? '—'}</span>
                      <span className="text-muted-foreground">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                {detectedVars.map((v) => (
                  <div key={v} className="flex items-center gap-1.5">
                    <span
                      className="w-24 shrink-0 truncate text-xs text-muted-foreground"
                      title={v}
                    >
                      {v}
                    </span>
                    <input
                      type="text"
                      value={variables[v] ?? ''}
                      onChange={(e) => setVariables((prev) => ({ ...prev, [v]: e.target.value }))}
                      placeholder={`{{${v}}}`}
                      className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: preview */}
        <div className="flex w-1/2 flex-col">
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
