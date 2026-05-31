import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { BarChart2, Copy, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  createAdminSurvey,
  deleteAdminSurvey,
  deleteAdminSurveyResponse,
  getAdminSurvey,
  getAdminSurveyAnalytics,
  getAdminSurveyResponseDetail,
  listAdminSurveyResponses,
  listAdminSurveys,
  updateAdminSurvey,
  updateAdminSurveyStatus,
} from '@/api/admin-survey'
import type {
  AdminSurveyAnalytics,
  AdminSurveyDetail,
  AdminSurveyListItem,
  AdminSurveyPerQuestion,
  AdminSurveyQuestionForm,
  SurveyStatus,
} from '@/api/types'

const SURVEY_PUBLIC_BASE =
  import.meta.env.VITE_SURVEY_PUBLIC_BASE ?? 'https://app.daodao.so/survey/r'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

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
  { value: 'single_choice', label: '單選' },
  { value: 'multiple_choice', label: '多選' },
  { value: 'text', label: '文字' },
  { value: 'rating', label: '評分' },
  { value: 'yesno', label: '是非' },
  { value: 'scale', label: '量表' },
  { value: 'ranking', label: '排序' },
]

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: '單選',
  multiple_choice: '多選',
  text: '文字',
  rating: '評分',
  yesno: '是非',
  scale: '量表',
  ranking: '排序',
}

const OPTION_TYPES = new Set(['single_choice', 'multiple_choice', 'ranking'])

function statusVariant(status: SurveyStatus): 'success' | 'warning' | 'default' {
  if (status === 'active') return 'success'
  if (status === 'draft') return 'warning'
  return 'default'
}

const LIMIT = 30

type DrawerMode = 'detail' | 'responses' | 'create' | 'edit' | 'analytics' | null

export function SurveyManagementPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | ''>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [offset, setOffset] = useState(0)

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [activeSurveyId, setActiveSurveyId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
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
  const total = pagination?.total_count ?? 0

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-surveys'] })
  }

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAdminSurvey(id),
    onSuccess: invalidate,
    onError: () => alert('刪除問卷失敗，請重試'),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SurveyStatus }) =>
      updateAdminSurveyStatus(id, status),
    onSuccess: invalidate,
    onError: () => alert('更新狀態失敗，請重試'),
  })

  const handleDelete = (survey: AdminSurveyListItem) => {
    if (
      window.confirm(`確定刪除問卷《${survey.title}》？\n此操作無法復原，所有回應也將一併刪除。`)
    ) {
      deleteMut.mutate(survey.id)
    }
  }

  const handleStatusChange = (id: number, status: SurveyStatus) => {
    statusMut.mutate({ id, status })
  }

  const openDetail = (id: number) => {
    setActiveSurveyId(id)
    setDrawerMode('detail')
  }

  const openResponses = (id: number) => {
    setActiveSurveyId(id)
    setDrawerMode('responses')
  }

  const openEdit = (id: number) => {
    setActiveSurveyId(id)
    setDrawerMode('edit')
  }

  const openAnalytics = (id: number) => {
    setActiveSurveyId(id)
    setDrawerMode('analytics')
  }

  const handleCopyLink = (survey: AdminSurveyListItem) => {
    const url = `${SURVEY_PUBLIC_BASE}/${survey.external_id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(survey.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const closeDrawer = () => {
    setDrawerMode(null)
    setActiveSurveyId(null)
  }

  const applySearch = () => {
    setSearch(searchInput)
    setOffset(0)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="問卷管理"
        description="建立與發布問卷調查，收集用戶回饋並統計分析作答結果。"
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setActiveSurveyId(null)
              setDrawerMode('create')
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            新增問卷
          </Button>
        }
      />

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
        <span className="ml-auto text-sm text-muted-foreground">共 {total} 筆</span>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : surveys.length === 0 ? (
          <p className="text-sm text-muted-foreground">無符合的問卷</p>
        ) : (
          surveys.map((survey) => (
            <div key={survey.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(survey.status)}>{STATUS_LABELS[survey.status]}</Badge>
                {survey.is_anonymous && <Badge variant="default">匿名</Badge>}
                {survey.tags.map((tag) => (
                  <Badge key={tag} variant="default" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                <span className="ml-auto text-xs text-muted-foreground">
                  {format(new Date(survey.created_at), 'yyyy-MM-dd HH:mm')}
                </span>
              </div>

              <div className="mt-2">
                <p className="font-medium">{survey.title}</p>
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>
                  建立者：
                  {survey.creator.nickname ?? survey.creator.email ?? `#${survey.creator.id}`}
                </span>
                <span>回應：{survey.response_count} 筆</span>
                <span>瀏覽：{survey.view_count} 次</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => openDetail(survey.id)}
                >
                  查看詳情
                </Button>
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
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => openEdit(survey.id)}
                >
                  編輯
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={survey.status !== 'active' ? 'ghost' : 'secondary'}
                  onClick={() => handleCopyLink(survey)}
                  title={
                    survey.status !== 'active' ? '問卷需設為「進行中」才能公開訪問' : undefined
                  }
                >
                  <Copy className="mr-1 h-3 w-3" />
                  {copiedId === survey.id ? '已複製！' : '複製連結'}
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={survey.status !== 'active' ? 'ghost' : 'secondary'}
                  onClick={() =>
                    window.open(`${SURVEY_PUBLIC_BASE}/${survey.external_id}`, '_blank')
                  }
                  title={
                    survey.status !== 'active' ? '問卷需設為「進行中」才能公開訪問' : undefined
                  }
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  預覽
                </Button>
                <div className="w-28">
                  <Select
                    value={survey.status}
                    onValueChange={(v) => handleStatusChange(survey.id, v as SurveyStatus)}
                    options={STATUS_OPTIONS}
                    placeholder="更改狀態"
                  />
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  onClick={() => handleDelete(survey)}
                  disabled={deleteMut.isPending}
                >
                  刪除
                </Button>
              </div>
            </div>
          ))
        )}
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
        <DialogContent className="h-auto max-h-[85vh] max-w-2xl overflow-y-auto p-6">
          {drawerMode === 'detail' && activeSurveyId && (
            <SurveyDetailPanel surveyId={activeSurveyId} onClose={closeDrawer} />
          )}
          {drawerMode === 'responses' && activeSurveyId && (
            <SurveyResponsesPanel surveyId={activeSurveyId} onClose={closeDrawer} />
          )}
          {drawerMode === 'create' && (
            <SurveyFormPanel
              mode="create"
              onClose={closeDrawer}
              onSuccess={() => {
                invalidate()
                closeDrawer()
              }}
            />
          )}
          {drawerMode === 'edit' && activeSurveyId && (
            <SurveyFormPanel
              mode="edit"
              surveyId={activeSurveyId}
              onClose={closeDrawer}
              onSuccess={() => {
                invalidate()
                closeDrawer()
              }}
            />
          )}
          {drawerMode === 'analytics' && activeSurveyId && (
            <SurveyAnalyticsPanel surveyId={activeSurveyId} onClose={closeDrawer} />
          )}
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
          <Badge variant={statusVariant(survey.status)}>{STATUS_LABELS[survey.status]}</Badge>
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
          {format(new Date(survey.created_at), 'yyyy-MM-dd HH:mm')}
        </div>
        <div>
          <span className="text-muted-foreground">更新時間：</span>
          {format(new Date(survey.updated_at), 'yyyy-MM-dd HH:mm')}
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

// ── SurveyResponsesPanel ───────────────────────────────────────────────────

function SurveyResponsesPanel({ surveyId, onClose }: { surveyId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const [responsesOffset, setResponsesOffset] = useState(0)
  const [detailResponseId, setDetailResponseId] = useState<number | null>(null)
  const RESP_LIMIT = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin-survey-responses', surveyId, responsesOffset],
    queryFn: () =>
      listAdminSurveyResponses(surveyId, { limit: RESP_LIMIT, offset: responsesOffset }).then(
        (r) => r.data,
      ),
  })

  const responses = data?.data ?? []
  const total = data?.pagination?.total_count ?? 0

  const deleteResponseMut = useMutation({
    mutationFn: (responseId: number) => deleteAdminSurveyResponse(surveyId, responseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-survey-responses', surveyId] })
      qc.invalidateQueries({ queryKey: ['admin-surveys'] })
    },
    onError: () => alert('刪除回應失敗，請重試'),
  })

  const handleDeleteResponse = (responseId: number) => {
    if (window.confirm('確定刪除此回應？')) {
      deleteResponseMut.mutate(responseId)
    }
  }

  if (detailResponseId !== null) {
    return (
      <ResponseDetailPanel
        surveyId={surveyId}
        responseId={detailResponseId}
        onBack={() => setDetailResponseId(null)}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="heading-sm">問卷回應列表（共 {total} 筆）</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          關閉
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : responses.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無回應</p>
      ) : (
        <div className="space-y-2">
          {responses.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
            >
              <div className="space-y-0.5">
                <p className="text-muted-foreground">
                  回應 #{r.id}
                  {r.user_id ? ` · 用戶 #${r.user_id}` : ' · 匿名'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(r.completed_at), 'yyyy-MM-dd HH:mm')} · {r.answer_count} 個回答
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => setDetailResponseId(r.id)}
                >
                  查看內容
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  onClick={() => handleDeleteResponse(r.id)}
                  disabled={deleteResponseMut.isPending}
                >
                  刪除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > RESP_LIMIT && (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={responsesOffset === 0}
            onClick={() => setResponsesOffset((o) => Math.max(0, o - RESP_LIMIT))}
          >
            上一頁
          </Button>
          <span className="text-sm text-muted-foreground">
            {Math.floor(responsesOffset / RESP_LIMIT) + 1} / {Math.ceil(total / RESP_LIMIT)}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={responsesOffset + RESP_LIMIT >= total}
            onClick={() => setResponsesOffset((o) => o + RESP_LIMIT)}
          >
            下一頁
          </Button>
        </div>
      )}
    </div>
  )
}

// ── ResponseDetailPanel ────────────────────────────────────────────────────

function ResponseDetailPanel({
  surveyId,
  responseId,
  onBack,
  onClose,
}: {
  surveyId: number
  responseId: number
  onBack: () => void
  onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-survey-response-detail', surveyId, responseId],
    queryFn: () => getAdminSurveyResponseDetail(surveyId, responseId).then((r) => r.data.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            ← 返回
          </Button>
          <h2 className="heading-sm">回應 #{responseId} 內容</h2>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          關閉
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">無法載入回應資料</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {data.user_id ? `用戶 #${data.user_id}` : '匿名'} ·{' '}
            {format(new Date(data.completed_at), 'yyyy-MM-dd HH:mm')}
          </p>
          <div className="space-y-3">
            {data.answers.map((a, i) => (
              <div key={a.question_id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">
                  Q{i + 1}. {a.question_text}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {QUESTION_TYPE_LABELS[a.question_type] ?? a.question_type}
                </p>
                <div className="mt-2">
                  {a.answer_text && <p>{a.answer_text}</p>}
                  {a.selected_options.length > 0 && (
                    <ul className="space-y-0.5">
                      {a.selected_options.map((opt) => (
                        <li key={opt} className="flex items-center gap-1">
                          <span className="text-primary">✓</span> {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                  {a.rating_value !== null && <p>評分：{a.rating_value}</p>}
                  {a.boolean_value !== null && <p>{a.boolean_value ? '是' : '否'}</p>}
                  {a.answer_text === null &&
                    a.selected_options.length === 0 &&
                    a.rating_value === null &&
                    a.boolean_value === null && (
                      <p className="text-muted-foreground italic">（未作答）</p>
                    )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── SurveyAnalyticsPanel ──────────────────────────────────────────────────

function QuestionStatBlock({ q }: { q: AdminSurveyPerQuestion }) {
  const { question_type, stats, answer_count } = q

  if (question_type === 'rating' || question_type === 'scale') {
    return (
      <div className="flex gap-4 text-sm">
        <span>
          平均：<strong>{stats.avg != null ? stats.avg.toFixed(1) : '—'}</strong>
        </span>
        <span>
          最低：<strong>{stats.min ?? '—'}</strong>
        </span>
        <span>
          最高：<strong>{stats.max ?? '—'}</strong>
        </span>
        <span className="ml-auto text-muted-foreground">{answer_count} 人作答</span>
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
    const max = Math.max(...stats.option_counts.map((o) => o.count), 1)
    return (
      <div className="space-y-1.5 text-sm">
        {stats.option_counts.map((o) => (
          <div key={o.option_id} className="flex items-center gap-2">
            <span className="w-32 truncate text-xs text-muted-foreground">{o.option_text}</span>
            <div className="flex-1 rounded-full bg-muted h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(o.count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs">{o.count}</span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">共 {answer_count} 人作答</p>
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
        <p className="text-xs text-muted-foreground">共 {answer_count} 人作答（顯示前 5 筆）</p>
      </div>
    )
  }

  return <p className="text-xs text-muted-foreground">尚無回應資料</p>
}

function SurveyAnalyticsPanel({ surveyId, onClose }: { surveyId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-survey-analytics', surveyId],
    queryFn: () =>
      getAdminSurveyAnalytics(surveyId).then((r) => r.data.data as AdminSurveyAnalytics),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="heading-sm">問卷分析</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          關閉
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">無法載入分析資料</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold">{data.response_count}</p>
              <p className="text-xs text-muted-foreground">回應數</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold">{data.view_count}</p>
              <p className="text-xs text-muted-foreground">瀏覽數</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold">
                {data.avg_duration_seconds != null
                  ? `${Math.round(data.avg_duration_seconds)}s`
                  : '—'}
              </p>
              <p className="text-xs text-muted-foreground">平均填寫時長</p>
            </div>
          </div>

          {data.per_question.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">各題統計</h3>
              {data.per_question.map((q, i) => (
                <div key={q.question_id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 text-muted-foreground">Q{i + 1}.</span>
                    <p className="font-medium">{q.question_text}</p>
                  </div>
                  <QuestionStatBlock q={q} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── SurveyFormPanel ────────────────────────────────────────────────────────

interface QuestionDraft extends AdminSurveyQuestionForm {
  _key: string
}

function generateKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).substring(2, 11)
}

function makeEmptyQuestion(position: number): QuestionDraft {
  return {
    _key: generateKey(),
    question_text: '',
    question_type: 'text',
    is_required: false,
    position,
    options: [],
  }
}

function SurveyFormPanel({
  mode,
  surveyId,
  onClose,
  onSuccess,
}: {
  mode: 'create' | 'edit'
  surveyId?: number
  onClose: () => void
  onSuccess: () => void
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
    return <p className="text-sm text-muted-foreground">載入中...</p>
  }

  return (
    <SurveyFormInner
      key={mode === 'edit' ? surveyId : 'create'}
      mode={mode}
      surveyId={surveyId}
      existingData={mode === 'edit' ? (existingData as AdminSurveyDetail | undefined) : undefined}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

function SurveyFormInner({
  mode,
  surveyId,
  existingData,
  onClose,
  onSuccess,
}: {
  mode: 'create' | 'edit'
  surveyId?: number
  existingData?: AdminSurveyDetail
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState(existingData?.title ?? '')
  const [description, setDescription] = useState(existingData?.description ?? '')
  const [isAnonymous, setIsAnonymous] = useState(existingData?.is_anonymous ?? false)
  const [tagsInput, setTagsInput] = useState(existingData?.tags.join(', ') ?? '')
  const [maxResponses, setMaxResponses] = useState(
    existingData?.max_responses ? String(existingData.max_responses) : '',
  )
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => {
    if (existingData && existingData.questions.length > 0) {
      return existingData.questions.map((q) => ({
        _key: String(q.id),
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        position: q.position,
        options: q.options.map((o) => ({ option_text: o.option_text, position: o.position })),
      }))
    }
    return [makeEmptyQuestion(1)]
  })
  const [error, setError] = useState('')

  const createMut = useMutation({
    mutationFn: createAdminSurvey,
    onSuccess,
    onError: () => setError('建立失敗，請重試'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAdminSurvey>[1] }) =>
      updateAdminSurvey(id, data),
    onSuccess,
    onError: () => setError('更新失敗，請重試'),
  })

  const isPending = createMut.isPending || updateMut.isPending

  const addQuestion = () => {
    setQuestions((prev) => [...prev, makeEmptyQuestion(prev.length + 1)])
  }

  const removeQuestion = (key: string) => {
    setQuestions((prev) =>
      prev.filter((q) => q._key !== key).map((q, i) => ({ ...q, position: i + 1 })),
    )
  }

  const updateQuestion = (key: string, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q._key === key ? { ...q, ...patch } : q)))
  }

  const addOption = (key: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._key === key
          ? { ...q, options: [...q.options, { option_text: '', position: q.options.length }] }
          : q,
      ),
    )
  }

  const removeOption = (key: string, idx: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._key === key
          ? {
              ...q,
              options: q.options.filter((_, i) => i !== idx).map((o, i) => ({ ...o, position: i })),
            }
          : q,
      ),
    )
  }

  const updateOption = (key: string, idx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._key === key
          ? {
              ...q,
              options: q.options.map((o, i) => (i === idx ? { ...o, option_text: text } : o)),
            }
          : q,
      ),
    )
  }

  const handleSubmit = () => {
    setError('')
    if (!title.trim()) {
      setError('標題為必填')
      return
    }
    if (maxResponses) {
      const parsed = parseInt(maxResponses, 10)
      if (Number.isNaN(parsed) || parsed <= 0) {
        setError('最大回應數必須為正整數')
        return
      }
    }
    const hasEmptyOptions = questions.some(
      (q) =>
        OPTION_TYPES.has(q.question_type) &&
        q.question_text.trim() &&
        q.options.filter((o) => o.option_text.trim()).length === 0,
    )
    if (hasEmptyOptions) {
      setError('選擇題 / 排序題至少需要一個選項')
      return
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const questionsPayload = questions
      .filter((q) => q.question_text.trim())
      .map((q, i) => ({
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        is_required: q.is_required,
        position: i + 1,
        options: OPTION_TYPES.has(q.question_type)
          ? q.options
              .filter((o) => o.option_text.trim())
              .map((o, j) => ({ option_text: o.option_text.trim(), position: j }))
          : [],
      }))

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      is_anonymous: isAnonymous,
      tags,
      max_responses: maxResponses ? parseInt(maxResponses, 10) : null,
      questions: questionsPayload,
    }

    if (mode === 'create') {
      createMut.mutate(payload)
    } else if (surveyId !== undefined) {
      updateMut.mutate({ id: surveyId, data: payload })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="heading-sm">{mode === 'create' ? '新增問卷' : '編輯問卷'}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          關閉
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Basic info */}
      <div className="space-y-3">
        <div>
          <label htmlFor="survey-title" className="mb-1 block text-sm font-medium">
            標題 <span className="text-destructive">*</span>
          </label>
          <Input
            id="survey-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="問卷標題"
          />
        </div>
        <div>
          <label htmlFor="survey-description" className="mb-1 block text-sm font-medium">
            描述
          </label>
          <textarea
            id="survey-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="問卷描述（選填）"
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="is-anonymous"
            checked={isAnonymous}
            onCheckedChange={(v) => setIsAnonymous(!!v)}
          />
          <label htmlFor="is-anonymous" className="text-sm">
            匿名問卷
          </label>
        </div>
        <div>
          <label htmlFor="survey-tags" className="mb-1 block text-sm font-medium">
            標籤（逗號分隔）
          </label>
          <Input
            id="survey-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="例：回饋, 滿意度"
          />
        </div>
        <div>
          <label htmlFor="survey-max-responses" className="mb-1 block text-sm font-medium">
            最大回應數（選填）
          </label>
          <Input
            id="survey-max-responses"
            type="number"
            value={maxResponses}
            onChange={(e) => setMaxResponses(e.target.value)}
            placeholder="不限制則留空"
            min={1}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">題目（{questions.length} 題）</h3>
          <Button type="button" size="xs" variant="secondary" onClick={addQuestion}>
            <Plus className="mr-1 h-3 w-3" />
            新增題目
          </Button>
        </div>

        {questions.map((q, qi) => (
          <div key={q._key} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">Q{qi + 1}</span>
              <Input
                value={q.question_text}
                onChange={(e) => updateQuestion(q._key, { question_text: e.target.value })}
                placeholder="題目內容"
                className="flex-1"
              />
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => removeQuestion(q._key)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-36">
                <Select
                  value={q.question_type}
                  onValueChange={(v) => {
                    const keepOptions = OPTION_TYPES.has(v) && OPTION_TYPES.has(q.question_type)
                    updateQuestion(q._key, {
                      question_type: v,
                      options: keepOptions ? q.options : [],
                    })
                  }}
                  options={QUESTION_TYPE_OPTIONS}
                  placeholder="題型"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id={`req-${q._key}`}
                  checked={q.is_required}
                  onCheckedChange={(v) => updateQuestion(q._key, { is_required: !!v })}
                />
                <label htmlFor={`req-${q._key}`} className="text-xs text-muted-foreground">
                  必填
                </label>
              </div>
            </div>

            {OPTION_TYPES.has(q.question_type) && (
              <div className="space-y-1.5 pl-2">
                {q.options.map((o, oi) => (
                  <div
                    key={o.option_text || `option-${o.position}`}
                    className="flex items-center gap-1.5"
                  >
                    <span className="shrink-0 text-xs text-muted-foreground">{oi + 1}.</span>
                    <Input
                      value={o.option_text}
                      onChange={(e) => updateOption(q._key, oi, e.target.value)}
                      placeholder={`選項 ${oi + 1}`}
                      className="h-7 flex-1 text-sm"
                    />
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => removeOption(q._key, oi)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => addOption(q._key)}
                  className="text-xs text-muted-foreground"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  新增選項
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          取消
        </Button>
        <Button type="button" size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? '儲存中...' : mode === 'create' ? '建立問卷' : '儲存變更'}
        </Button>
      </div>
    </div>
  )
}
