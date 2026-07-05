import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Brain,
  CheckCircle2,
  Eye,
  PieChart,
  Search,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getPersonaQuestionAnswers,
  getUserPersonaProfile,
  listPersonaUsers,
} from '@/api/admin-community'
import type { PersonaUser } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { UserLink } from '@/components/UserLink'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useContentPerformance } from '@/hooks/useContentPerformance'
import { usePersonaStats } from '@/hooks/useOnboardingAnalytics'

const PERSONA_TYPE_LABEL: Record<string, string> = {
  D: '探探島',
  A: '動動島',
  O: '構構島',
  L: '跨跨島',
  C: '連連島',
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  choice: '選擇題',
  sentence_completion: '句子完成',
  scenario: '情境題',
}

type PersonaQuestionRow = { id: number; prompt: string; answerCount: number }

type DatePreset = '1' | '7' | '30'

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: '今天', value: '1' },
  { label: '7 天', value: '7' },
  { label: '30 天', value: '30' },
]

export function PersonaStatusPage() {
  const [preset, setPreset] = useState<DatePreset>('7')
  const { data: performanceData, isLoading: isLoadingPerformance } = useContentPerformance(
    Number(preset),
  )
  const { data: personaAnalytics, isLoading: isLoadingPersonaStats } = usePersonaStats(
    Number(preset),
  )

  const isLoading = isLoadingPerformance || isLoadingPersonaStats
  const distribution = personaAnalytics?.answerCountDistribution ?? []
  const topQuestions = personaAnalytics?.topQuestions ?? []
  const personaQuestionRows = performanceData?.personaSummary?.questions ?? []
  const persona = performanceData?.personaSummary

  const totalUsersByDistribution = useMemo(
    () => distribution.reduce((acc, item) => acc + item.userCount, 0),
    [distribution],
  )
  const maxTopQuestionCount = useMemo(
    () => Math.max(...topQuestions.map((q) => q.answerCount), 1),
    [topQuestions],
  )
  const anyAnswerRate = personaAnalytics?.anyAnswerRate ?? 0
  const avgAnswerCountText = Number((personaAnalytics?.avgAnswerCount ?? 0).toFixed(1))
  const totalQuestions = persona?.totalQuestions ?? 0
  const totalAnsweredUsers = persona?.usersAnswered ?? 0
  const totalAnswers = persona?.totalAnswers ?? 0
  const unlockedUsers = personaAnalytics?.unlockedCount ?? 0
  const unansweredQuestions = useMemo(
    () => personaQuestionRows.filter((q) => q.answerCount === 0).length,
    [personaQuestionRows],
  )
  const unansweredRate =
    totalQuestions > 0 ? Math.round((unansweredQuestions / totalQuestions) * 100) : 0
  const topQuestionCoverage = useMemo(
    () => personaQuestionRows.filter((q) => q.answerCount > 0).length,
    [personaQuestionRows],
  )
  const topQuestionCoverageRate =
    totalQuestions > 0 ? Math.round((topQuestionCoverage / totalQuestions) * 100) : 0
  const nonRespondedUsers = Math.max(unlockedUsers - totalAnsweredUsers, 0)
  const nonRespondedRate =
    unlockedUsers > 0 ? Math.round((nonRespondedUsers / unlockedUsers) * 100) : 0
  const lowProgressUsers = useMemo(
    () =>
      distribution
        .filter((item) => item.answerCount >= 1 && item.answerCount <= 2)
        .reduce((acc, item) => acc + item.userCount, 0),
    [distribution],
  )
  const midProgressUsers = useMemo(
    () =>
      distribution
        .filter((item) => item.answerCount >= 3 && item.answerCount <= 5)
        .reduce((acc, item) => acc + item.userCount, 0),
    [distribution],
  )
  const highProgressUsers = useMemo(
    () =>
      distribution
        .filter((item) => item.answerCount >= 6)
        .reduce((acc, item) => acc + item.userCount, 0),
    [distribution],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="人物誌填寫統計"
        description="運營診斷儀表板：先看題目是否被完整設計與覆蓋，再看用戶填寫是否有斷流。可直接用於題目優化會議與填寫率改善。"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--admin-card-border)] bg-muted/40 p-0.5">
              {DATE_PRESETS.map(({ label, value }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setPreset(value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    preset === value
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link
              to="/persona-questions"
              className="inline-flex h-9 items-center rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
            >
              前往人物誌題目管理
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 py-16 text-center text-sm text-muted-foreground">
          載入中...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">指標口訣（先讀）</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              不把題目管理與填寫統計混在一起，才不會把「題目好不好」和「流程有沒有流失」判斷成一件事。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  題目管理：題目設計與題庫質量
                </div>
                包含題目總數、未回覆題目、熱門題、逐題回答人次。
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-foreground">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  填寫統計：用戶進度與答題率
                </div>
                包含有回答用戶、平均回答題數、回答題數分布、未作答與高作答人群。
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">本頁區分指標</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              題目管理與填寫統計採用不同邏輯，請先確認是「題目品質」問題還是「流程漏斗」問題。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="mr-1 font-medium text-foreground">題目管理：</span>
                以題目數量、每題回答人次與熱門題目熱度檢查題庫完整性與品質。
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="mr-1 font-medium text-foreground">填寫統計：</span>
                以答題用戶、總回答、回答題數分佈、平均每人回答題數與有回答率檢視落版效率。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatCard title="題目總數" value={persona?.totalQuestions ?? 0} icon={Brain} />
            <StatCard title="有回答用戶" value={totalAnsweredUsers} icon={Users} />
            <StatCard title="總回答數" value={totalAnswers} icon={Eye} />
            <StatCard title="有回答率" value={`${anyAnswerRate}%`} icon={PieChart} />
            <StatCard title="平均回答題數" value={avgAnswerCountText} icon={BarChart3} />
            <StatCard title="已解鎖" value={`${unlockedUsers} 人`} icon={Users} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-4 shadow-sm">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                題目管理健康檢查
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  未回覆題目：
                  <span className="font-medium text-foreground">{unansweredQuestions}</span> 題（
                  {unansweredRate}%）
                </li>
                <li>
                  有回覆題目：
                  <span className="font-medium text-foreground">{topQuestionCoverage}</span> 題（
                  {topQuestionCoverageRate}%）
                </li>
                <li className="text-[11px] text-muted-foreground/80">
                  判讀方式：未回覆題目比例高時，優先檢查題幹、選項可理解度、排序與曝光位置。
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-4 shadow-sm">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <ArrowUpDown className="h-4 w-4 text-primary" />
                填寫流程風險
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  未作答用戶：
                  <span className="font-medium text-foreground">{nonRespondedUsers}</span> 人 （
                  {nonRespondedRate}%）
                </li>
                <li>低進度（1-2題）：{lowProgressUsers} 人</li>
                <li>中進度（3-5題）：{midProgressUsers} 人</li>
                <li>高進度（6+題）：{highProgressUsers} 人</li>
                <li className="text-[11px] text-muted-foreground/80">
                  判讀方式：低進度比例高通常代表導引文案、題目難度或頁面體驗需要修正。
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">回答題數分佈</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              查看每位使用者實際有回答的題目數分布
            </p>
            {distribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無填寫分佈資料</p>
            ) : (
              <div className="space-y-3">
                {[...distribution]
                  .sort((a, b) => a.answerCount - b.answerCount)
                  .map(({ answerCount, userCount }) => {
                    const pct =
                      totalUsersByDistribution > 0
                        ? Math.round((userCount / totalUsersByDistribution) * 100)
                        : 0
                    return (
                      <div key={answerCount} className="flex items-center gap-3">
                        <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                          {answerCount} 題
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                          {userCount} 人 ({pct}%)
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">熱門題目</h3>
            <p className="mb-4 text-xs text-muted-foreground">按回答數排序的題目關注程度</p>
            {topQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無題目回覆資料</p>
            ) : (
              <div className="space-y-3">
                {topQuestions.map(({ questionId, prompt, answerCount }) => {
                  const pct = Math.round((answerCount / maxTopQuestionCount) * 100)
                  return (
                    <div key={questionId} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        Q{questionId}
                      </span>
                      <span className="flex-1 text-xs text-foreground truncate" title={prompt}>
                        {prompt}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[240px]">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                        {answerCount} 人
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <PersonaDrillDown personaQuestionRows={personaQuestionRows} />
        </div>
      )}
    </div>
  )
}

function PersonaDrillDown({ personaQuestionRows }: { personaQuestionRows: PersonaQuestionRow[] }) {
  const [selectedQuestion, setSelectedQuestion] = useState<PersonaQuestionRow | null>(null)
  const [selectedUser, setSelectedUser] = useState<PersonaUser | null>(null)
  const [tab, setTab] = useState<'questions' | 'users'>('questions')

  const handleTabChange = (v: string) => {
    setTab(v as 'questions' | 'users')
    setSelectedQuestion(null)
    setSelectedUser(null)
  }

  const hasDetail = tab === 'questions' ? !!selectedQuestion : !!selectedUser

  return (
    <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-foreground">明細下鑽</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        依題目查看每題回答者，或依用戶查看個別填寫內容。點擊列表項目查看明細。
      </p>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="questions">按題目查看</TabsTrigger>
          <TabsTrigger value="users">按用戶查看</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="min-h-[500px]">
          <div className="flex gap-4">
            <div className={hasDetail ? 'w-1/2 shrink-0' : 'w-full'}>
              <QuestionsTable
                rows={personaQuestionRows}
                selectedId={selectedQuestion?.id ?? null}
                onSelect={(q) => setSelectedQuestion(q)}
              />
            </div>
            {selectedQuestion && (
              <div className="w-1/2 shrink-0">
                <QuestionDetailPanel
                  question={selectedQuestion}
                  onClose={() => setSelectedQuestion(null)}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="min-h-[500px]">
          <div className="flex gap-4">
            <div className={hasDetail ? 'w-1/2 shrink-0' : 'w-full'}>
              <UsersTable
                selectedId={selectedUser?.userId ?? null}
                onSelect={(u) => setSelectedUser(u)}
              />
            </div>
            {selectedUser && (
              <div className="w-1/2 shrink-0">
                <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function QuestionsTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: PersonaQuestionRow[]
  selectedId: number | null
  onSelect: (q: PersonaQuestionRow) => void
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">尚無題目資料</p>
  }

  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="py-1.5 px-2">Q#</TableHead>
          <TableHead className="py-1.5 px-2">題目</TableHead>
          <TableHead className="py-1.5 px-2 text-right">回答人次</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((q) => (
          <TableRow
            key={q.id}
            className={`cursor-pointer ${selectedId === q.id ? 'bg-muted' : ''}`}
            onClick={() => onSelect(q)}
          >
            <TableCell className="py-1.5 px-2 font-mono text-muted-foreground">Q{q.id}</TableCell>
            <TableCell className="max-w-0 py-1.5 px-2">
              <span className="block truncate text-foreground" title={q.prompt}>
                {q.prompt}
              </span>
            </TableCell>
            <TableCell className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
              {q.answerCount} 人
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const SORT_FIELD_MAP = {
  answerCount: 'answer_count',
  lastAnsweredAt: 'last_answered',
} as const
type UserSortField = keyof typeof SORT_FIELD_MAP

function UsersTable({
  selectedId,
  onSelect,
}: {
  selectedId: number | null
  onSelect: (u: PersonaUser) => void
}) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<UserSortField>('answerCount')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setOffset(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin', 'persona', 'users', search, sort, order, offset],
    queryFn: () =>
      listPersonaUsers({
        search: search || undefined,
        sort: SORT_FIELD_MAP[sort],
        order,
        limit,
        offset,
      }).then((r) => r.data),
  })

  const users = data?.data ?? []
  const hasNext = data?.pagination?.has_next ?? users.length === limit
  const hasPrev = offset > 0

  const toggleSort = (field: UserSortField) => {
    if (sort === field) {
      setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))
    } else {
      setSort(field)
      setOrder('desc')
    }
    setOffset(0)
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="搜尋用戶名稱"
          className="w-full pl-8"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          載入用戶資料失敗，請稍後再試
        </p>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">沒有符合條件的用戶</p>
      ) : (
        <>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="py-1.5 px-2">用戶</TableHead>
                <TableHead className="w-20 py-1.5 px-2">類型</TableHead>
                <TableHead className="w-20 py-1.5 px-2 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('answerCount')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    回答數
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="w-24 py-1.5 px-2 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('lastAnsweredAt')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    最後回答
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.userId}
                  className={`cursor-pointer ${selectedId === u.userId ? 'bg-muted' : ''}`}
                  onClick={() => onSelect(u)}
                >
                  <TableCell className="py-1.5 px-2">
                    <UserLink
                      userId={u.externalId}
                      name={u.name || '未命名'}
                      photoURL={u.photoUrl}
                    />
                  </TableCell>
                  <TableCell className="py-1.5 px-2">
                    {u.personaType ? (
                      <Badge variant="primary">{PERSONA_TYPE_LABEL[u.personaType]}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
                    {u.answerCount}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right text-muted-foreground">
                    {u.lastAnsweredAt ? u.lastAnsweredAt.slice(0, 10) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end gap-2 pt-1">
            {isFetching && <Spinner className="mr-1 h-4 w-4" />}
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40 enabled:hover:bg-muted"
            >
              上一頁
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => setOffset((o) => o + limit)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40 enabled:hover:bg-muted"
            >
              下一頁
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function QuestionDetailPanel({
  question,
  onClose,
}: {
  question: PersonaQuestionRow
  onClose: () => void
}) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['admin', 'persona', 'question-answers', question.id],
      queryFn: ({ pageParam }) =>
        getPersonaQuestionAnswers(question.id, {
          limit: 20,
          cursor: pageParam ?? undefined,
        }).then((r) => r.data.data),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    })

  const answers = data?.pages.flatMap((p) => p.answers) ?? []
  const totalCount = data?.pages[0]?.question.totalAnswerCount ?? 0

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div className="pr-3">
          <h4 className="text-sm font-semibold text-foreground">Q{question.id} 回答者</h4>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{question.prompt}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-[480px] overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-xs text-muted-foreground">無法載入回答資料</p>
        ) : answers.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">此題目尚無回答</p>
        ) : (
          <>
            <p className="mb-2 text-[11px] text-muted-foreground">共 {totalCount} 則回答</p>
            <div className="space-y-2">
              {answers.map((a) => (
                <div key={a.answerId} className="rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <UserLink userId={a.userId} name={a.name || '未命名'} photoURL={a.photoURL} />
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {a.answeredAt?.slice(0, 10) ?? '—'}
                    </span>
                  </div>
                  <p className="mt-1.5 rounded bg-primary/8 px-2.5 py-1.5 text-xs text-foreground">
                    {a.selectedValue ?? a.textAnswer ?? '-'}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">共鳴 {a.resonanceCount}</p>
                </div>
              ))}
            </div>
            {hasNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-3 w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50 enabled:hover:bg-muted"
              >
                {isFetchingNextPage ? '載入中...' : '載入更多'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function UserDetailPanel({ user, onClose }: { user: PersonaUser; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'persona', 'user-profile', user.externalId],
    queryFn: () => getUserPersonaProfile(user.externalId).then((r) => r.data.data),
  })

  const answered = data?.questions.filter((q) => !q.isPlaceholder) ?? []

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div className="pr-3">
          <h4 className="text-sm font-semibold text-foreground">{user.name || '用戶'} 的填寫</h4>
          {user.personaType && (
            <Badge variant="primary" className="mt-1">
              {PERSONA_TYPE_LABEL[user.personaType]}
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-[480px] overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : answered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            此用戶尚未填寫任何人物誌問題
          </p>
        ) : (
          <>
            <p className="mb-2 text-[11px] text-muted-foreground">已填寫 {answered.length} 題</p>
            <div className="space-y-2">
              {answered.map((q) => (
                <div key={q.id} className="rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">{q.prompt}</p>
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {QUESTION_TYPE_LABEL[q.questionType] ?? q.questionType}
                    </span>
                  </div>
                  {q.answer && (
                    <>
                      <p className="mt-1.5 rounded bg-primary/8 px-2.5 py-1.5 text-xs text-foreground">
                        {q.answer.selectedValue ?? q.answer.textAnswer ?? '-'}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>共鳴 {q.answer.resonanceCount}</span>
                        <span>{q.answer.createdAt?.slice(0, 10) ?? '—'}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
