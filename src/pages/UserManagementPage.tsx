import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listAdminUsers, listRoles, updateUserRole, updateUserStatus } from '@/api/admin-server'
import type { AdminUserListItem } from '@/api/types'
import { ExportButton } from '@/components/ExportButton'
import { UserLink } from '@/components/UserLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type PersonaType = 'L' | 'C' | 'A' | 'D' | 'O'

const PERSONA_LABELS: Record<PersonaType, string> = {
  D: '探探島',
  A: '動動島',
  O: '構構島',
  L: '跨跨島',
  C: '連連島',
}

const PERSONA_OPTIONS = [
  { value: '', label: '全部學習風格' },
  { value: 'D', label: 'D 探探島' },
  { value: 'A', label: 'A 動動島' },
  { value: 'O', label: 'O 構構島' },
  { value: 'L', label: 'L 跨跨島' },
  { value: 'C', label: 'C 連連島' },
]

const STATUS_OPTIONS = [
  { value: '', label: '全部狀態' },
  { value: 'true', label: '啟用' },
  { value: 'false', label: '停用' },
]

const BADGE_OPTIONS = [
  { value: '', label: '全部 Onboarding' },
  { value: 'true', label: '已完成 Badge' },
  { value: 'false', label: '未完成 Badge' },
]

const SOURCE_OPTIONS = [
  { value: '', label: '全部來源' },
  { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' },
  { value: 'S3', label: 'S3' },
]

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: '最新註冊' },
  { value: 'createdAt_asc', label: '最早註冊' },
  { value: 'lastLoginAt_desc', label: '最近登入' },
  { value: 'name_asc', label: '名稱 A-Z' },
]

const SELECT_CLASS =
  'rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20'

const LIMIT = 20
const TABLE_COLS = 11

function SkeletonRow() {
  return (
    <tr className="border-b border-border/80">
      {Array.from({ length: TABLE_COLS }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 animate-pulse rounded bg-muted"
            style={{ width: `${60 + (i % 3) * 20}%` }}
          />
        </td>
      ))}
    </tr>
  )
}

export function UserManagementPage() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '')
  const [roleIdFilter, setRoleIdFilter] = useState(searchParams.get('roleId') ?? '')
  const [personaFilter, setPersonaFilter] = useState(searchParams.get('persona') ?? '')
  const [badgeFilter, setBadgeFilter] = useState(searchParams.get('badge') ?? '')
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') ?? '')
  const [sortValue, setSortValue] = useState(searchParams.get('sort') ?? 'createdAt_desc')

  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [assigningUser, setAssigningUser] = useState<AdminUserListItem | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [confirmDisableUser, setConfirmDisableUser] = useState<AdminUserListItem | null>(null)

  // Debounce search input → search state
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Sync filter state → URL params
  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (page > 1) params.page = String(page)
    if (statusFilter) params.status = statusFilter
    if (roleIdFilter) params.roleId = roleIdFilter
    if (personaFilter) params.persona = personaFilter
    if (badgeFilter) params.badge = badgeFilter
    if (sourceFilter) params.source = sourceFilter
    if (sortValue !== 'createdAt_desc') params.sort = sortValue
    setSearchParams(params, { replace: true })
  }, [
    search,
    page,
    statusFilter,
    roleIdFilter,
    personaFilter,
    badgeFilter,
    sourceFilter,
    sortValue,
    setSearchParams,
  ])

  const [sortBy, sortOrder] = sortValue.split('_') as [
    'createdAt' | 'lastLoginAt' | 'name' | 'email',
    'asc' | 'desc',
  ]

  const { data: usersData, isLoading } = useQuery({
    queryKey: [
      'admin-server-users',
      search,
      page,
      statusFilter,
      roleIdFilter,
      personaFilter,
      badgeFilter,
      sourceFilter,
      sortValue,
    ],
    queryFn: () =>
      listAdminUsers({
        search: search || undefined,
        page,
        limit: LIMIT,
        isActive: statusFilter === '' ? undefined : statusFilter === 'true',
        roleId: roleIdFilter ? Number(roleIdFilter) : undefined,
        personaType: (personaFilter as PersonaType) || undefined,
        badgeGranted: badgeFilter === '' ? undefined : badgeFilter === 'true',
        userSource: (sourceFilter as 'S1' | 'S2' | 'S3') || undefined,
        sortBy,
        sortOrder,
      }).then((r) => r.data),
  })

  const users = (Array.isArray(usersData?.data) ? usersData.data : []).map((user) => ({
    ...user,
    roles: Array.isArray(user.roles) ? user.roles : [],
  }))
  const pagination = usersData?.pagination

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles().then((r) => r.data),
  })
  const roles = rolesData?.data ?? []
  const roleFilterOptions = [
    { value: '', label: '全部角色' },
    ...roles.map((role) => ({ value: String(role.id), label: role.name })),
  ]
  const roleOptions = [
    { value: '', label: '選擇角色' },
    ...roles.map((role) => ({ value: String(role.id), label: role.name })),
  ]

  const activeFilterCount = [
    statusFilter,
    roleIdFilter,
    personaFilter,
    badgeFilter,
    sourceFilter,
  ].filter(Boolean).length
  const hasActiveFilters = activeFilterCount > 0

  const resetFilters = () => {
    setStatusFilter('')
    setRoleIdFilter('')
    setPersonaFilter('')
    setBadgeFilter('')
    setSourceFilter('')
    setPage(1)
  }

  const togglePreset = (preset: 'incomplete-onboarding' | 'disabled') => {
    if (preset === 'incomplete-onboarding') {
      setBadgeFilter((v) => (v === 'false' ? '' : 'false'))
      setPage(1)
    } else {
      setStatusFilter((v) => (v === 'false' ? '' : 'false'))
      setPage(1)
    }
  }

  const updateStatusMut = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      updateUserStatus(userId, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-server-users'] }),
  })

  const updateRoleMut = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      updateUserRole(userId, roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-server-users'] })
      setAssigningUser(null)
      setSelectedRoleId('')
    },
  })

  const openAssignRole = (user: AdminUserListItem) => {
    setAssigningUser(user)
    const userRoles = Array.isArray(user.roles) ? user.roles : []
    setSelectedRoleId(userRoles[0] ? String(userRoles[0].id) : '')
  }

  // Build active filter chips
  const activeChips: { label: string; onRemove: () => void }[] = []
  if (statusFilter) {
    const opt = STATUS_OPTIONS.find((o) => o.value === statusFilter)
    activeChips.push({
      label: `狀態: ${opt?.label}`,
      onRemove: () => {
        setStatusFilter('')
        setPage(1)
      },
    })
  }
  if (roleIdFilter) {
    const role = roles.find((r) => String(r.id) === roleIdFilter)
    activeChips.push({
      label: `角色: ${role?.name ?? roleIdFilter}`,
      onRemove: () => {
        setRoleIdFilter('')
        setPage(1)
      },
    })
  }
  if (personaFilter) {
    const opt = PERSONA_OPTIONS.find((o) => o.value === personaFilter)
    activeChips.push({
      label: `學習風格: ${opt?.label}`,
      onRemove: () => {
        setPersonaFilter('')
        setPage(1)
      },
    })
  }
  if (badgeFilter) {
    const opt = BADGE_OPTIONS.find((o) => o.value === badgeFilter)
    activeChips.push({
      label: `Onboarding: ${opt?.label}`,
      onRemove: () => {
        setBadgeFilter('')
        setPage(1)
      },
    })
  }
  if (sourceFilter) {
    activeChips.push({
      label: `來源: ${sourceFilter}`,
      onRemove: () => {
        setSourceFilter('')
        setPage(1)
      },
    })
  }

  const totalPages = pagination?.total_count ? Math.ceil(pagination.total_count / LIMIT) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl leading-none font-semibold tracking-tight text-foreground">
            用戶管理
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-muted-foreground">
              共 {(pagination.total_count ?? 0).toLocaleString()} 位用戶
            </p>
          )}
        </div>
        <ExportButton
          data={users as unknown as Record<string, unknown>[]}
          fileName="user-management"
          columns={[
            { key: 'internalId', header: 'ID' },
            { key: 'customId', header: 'Custom ID' },
            { key: 'name', header: '名稱' },
            { key: 'email', header: 'Email' },
            { key: 'isActive', header: '狀態' },
            { key: 'userSource', header: '來源' },
            { key: 'tags', header: '標籤' },
            { key: 'personaType', header: '學習風格' },
            { key: 'badgeGranted', header: 'Badge' },
            { key: 'lastLoginAt', header: '最後登入' },
          ]}
        />
      </div>

      {/* Toolbar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="搜尋名稱 / Email"
            className="w-56"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          {/* Filter panel toggle */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setFilterPanelOpen((v) => !v)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            篩選
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Quick presets */}
          <Button
            type="button"
            variant={badgeFilter === 'false' ? 'primary' : 'secondary'}
            size="xs"
            onClick={() => togglePreset('incomplete-onboarding')}
          >
            未完成 Onboarding
          </Button>
          <Button
            type="button"
            variant={statusFilter === 'false' ? 'primary' : 'secondary'}
            size="xs"
            onClick={() => togglePreset('disabled')}
          >
            已停用
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={resetFilters}
              className="text-muted-foreground"
            >
              清除篩選
            </Button>
          )}
        </div>

        {/* Collapsible filter panel */}
        {filterPanelOpen && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setPage(1)
              }}
              options={STATUS_OPTIONS}
              triggerClassName={SELECT_CLASS}
            />
            <Select
              value={roleIdFilter}
              onValueChange={(v) => {
                setRoleIdFilter(v)
                setPage(1)
              }}
              options={roleFilterOptions}
              triggerClassName={SELECT_CLASS}
            />
            <Select
              value={personaFilter}
              onValueChange={(v) => {
                setPersonaFilter(v)
                setPage(1)
              }}
              options={PERSONA_OPTIONS}
              triggerClassName={SELECT_CLASS}
            />
            <Select
              value={badgeFilter}
              onValueChange={(v) => {
                setBadgeFilter(v)
                setPage(1)
              }}
              options={BADGE_OPTIONS}
              triggerClassName={SELECT_CLASS}
            />
            <Select
              value={sourceFilter}
              onValueChange={(v) => {
                setSourceFilter(v)
                setPage(1)
              }}
              options={SOURCE_OPTIONS}
              triggerClassName={SELECT_CLASS}
            />
            <Select
              value={sortValue}
              onValueChange={(v) => {
                setSortValue(v)
                setPage(1)
              }}
              options={SORT_OPTIONS}
              triggerClassName={SELECT_CLASS}
            />
          </div>
        )}

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeChips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-foreground"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-muted"
                  aria-label={`移除 ${chip.label} 篩選`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
              {[
                'ID',
                'Custom ID',
                '名稱',
                'Email',
                '狀態',
                '角色',
                '標籤',
                '學習風格',
                'Onboarding',
                '最後登入',
                '操作',
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                <SkeletonRow key={i} />
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLS} className="px-4 py-6 text-center text-muted-foreground">
                  無符合條件的用戶
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/80 transition-colors hover:bg-muted/45"
                >
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {user.internalId}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {user.customId ? `@${user.customId}` : '-'}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    <UserLink userId={user.internalId} name={user.name ?? '-'} showAvatar={false} />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{user.email ?? '-'}</td>
                  <td className="px-4 py-2">
                    <Badge variant={user.isActive ? 'success' : 'error'}>
                      {user.isActive ? '啟用' : '停用'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(user.roles) ? user.roles : []).length > 0 ? (
                        user.roles.map((r) => (
                          <Badge key={r.id} variant="primary">
                            {r.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">無角色</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {user.tags.length > 0 ? (
                        user.tags.map((tag) => (
                          <Badge key={tag.id} variant="default">
                            {tag.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {user.personaType ? (
                      <Badge variant="primary">
                        {user.personaType} {PERSONA_LABELS[user.personaType as PersonaType]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">未測驗</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {user.badgeGranted === null ? (
                      <span className="text-xs text-muted-foreground">-</span>
                    ) : user.badgeGranted ? (
                      <Badge variant="success">已完成</Badge>
                    ) : (
                      <Badge variant="default">未完成</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-TW') : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => openAssignRole(user)}
                      >
                        設定角色
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        disabled={updateStatusMut.isPending}
                        onClick={() => {
                          if (user.isActive) {
                            setConfirmDisableUser(user)
                          } else {
                            updateStatusMut.mutate({ userId: user.internalId, isActive: true })
                          }
                        }}
                      >
                        {user.isActive ? '停用' : '啟用'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            共 {(pagination.total_count ?? 0).toLocaleString()} 位 · 第 {page} / {totalPages} 頁
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 disabled:opacity-40"
            >
              上一頁
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={!pagination.has_next}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 disabled:opacity-40"
            >
              下一頁
            </Button>
          </div>
        </div>
      )}

      {/* Assign Role Modal — auto-saves on select */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-6 shadow-lg">
            <h3 className="mb-4 font-semibold">
              設定角色 —{' '}
              {assigningUser.name ?? assigningUser.email ?? `#${assigningUser.internalId}`}
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="role-select" className="mb-1 block text-sm font-medium">
                  角色
                </label>
                <Select
                  id="role-select"
                  value={selectedRoleId}
                  onValueChange={(value) => {
                    setSelectedRoleId(value)
                    if (value && assigningUser) {
                      updateRoleMut.mutate({
                        userId: assigningUser.internalId,
                        roleId: Number(value),
                      })
                    }
                  }}
                  options={roleOptions}
                />
              </div>
              {updateRoleMut.isPending && (
                <p className="text-xs text-muted-foreground">儲存中...</p>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAssigningUser(null)
                  setSelectedRoleId('')
                }}
              >
                關閉
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm disable dialog */}
      {confirmDisableUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-6 shadow-lg">
            <h3 className="mb-2 font-semibold">確定要停用此用戶？</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              {confirmDisableUser.name ??
                confirmDisableUser.email ??
                `#${confirmDisableUser.internalId}`}{' '}
              將無法登入，此操作可隨時撤回。
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setConfirmDisableUser(null)}>
                取消
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={updateStatusMut.isPending}
                onClick={() => {
                  updateStatusMut.mutate(
                    { userId: confirmDisableUser.internalId, isActive: false },
                    { onSuccess: () => setConfirmDisableUser(null) },
                  )
                }}
              >
                {updateStatusMut.isPending ? '處理中...' : '確定停用'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
