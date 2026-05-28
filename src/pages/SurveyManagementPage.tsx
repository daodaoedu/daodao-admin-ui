import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'
import {
  deleteAdminSurvey,
  deleteAdminSurveyResponse,
  getAdminSurvey,
  listAdminSurveyResponses,
  listAdminSurveys,
  updateAdminSurveyStatus,
} from '@/api/admin-survey'
import type { AdminSurveyDetail, AdminSurveyListItem, SurveyStatus } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

function statusVariant(status: SurveyStatus): 'success' | 'warning' | 'default' {
  if (status === 'active') return 'success'
  if (status === 'draft') return 'warning'
  return 'default'
}

const LIMIT = 30

type DrawerMode = 'detail' | 'responses' | null

export function SurveyManagementPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | ''>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [offset, setOffset] = useState(0)

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [activeSurveyId, setActiveSurveyId] = useState<number | null>(null)

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
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SurveyStatus }) =>
      updateAdminSurveyStatus(id, status),
    onSuccess: invalidate,
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
      <h1 className="heading-lg">問卷管理</h1>

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
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
                  類型：{q.question_type}
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

function SurveyResponsesPanel({ surveyId, onClose }: { surveyId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const [responsesOffset, setResponsesOffset] = useState(0)
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
  })

  const handleDeleteResponse = (responseId: number) => {
    if (window.confirm('確定刪除此回應？')) {
      deleteResponseMut.mutate(responseId)
    }
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
