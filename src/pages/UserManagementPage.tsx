import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
  { value: '', label: '全部人物誌' },
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

export function UserManagementPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [roleIdFilter, setRoleIdFilter] = useState('')
  const [personaFilter, setPersonaFilter] = useState('')
  const [badgeFilter, setBadgeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [sortValue, setSortValue] = useState('createdAt_desc')
  const [assigningUser, setAssigningUser] = useState<AdminUserListItem | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')

  const LIMIT = 20

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

  const hasActiveFilters =
    statusFilter || roleIdFilter || personaFilter || badgeFilter || sourceFilter

  const resetFilters = () => {
    setStatusFilter('')
    setRoleIdFilter('')
    setPersonaFilter('')
    setBadgeFilter('')
    setSourceFilter('')
    setPage(1)
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

  const TABLE_COLS = 9

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl leading-none font-semibold tracking-tight text-foreground">
          用戶管理
        </h1>
        <ExportButton
          data={users as unknown as Record<string, unknown>[]}
          fileName="user-management"
          columns={[
            { key: 'internalId', header: 'ID' },
            { key: 'name', header: '名稱' },
            { key: 'email', header: 'Email' },
            { key: 'isActive', header: '狀態' },
            { key: 'userSource', header: '來源' },
            { key: 'personaType', header: '人物誌' },
            { key: 'badgeGranted', header: 'Badge' },
            { key: 'lastLoginAt', header: '最後登入' },
          ]}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="搜尋名稱 / Email"
          className="w-56"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
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
        {hasActiveFilters && (
          <Button type="button" variant="secondary" size="xs" onClick={resetFilters}>
            清除篩選
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
              {[
                'ID',
                '名稱',
                'Email',
                '狀態',
                '角色',
                '人物誌',
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
              <tr>
                <td colSpan={TABLE_COLS} className="px-4 py-6 text-center text-muted-foreground">
                  載入中...
                </td>
              </tr>
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
                  className="border-b border-border/80 hover:bg-muted/45 transition-colors"
                >
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {user.internalId}
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
                        onClick={() =>
                          updateStatusMut.mutate({
                            userId: user.internalId,
                            isActive: !user.isActive,
                          })
                        }
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
          <span>共 {pagination.total_count} 位用戶</span>
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

      {/* Assign Role Modal */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-6 shadow-lg w-full max-w-sm">
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
                  onValueChange={(value) => setSelectedRoleId(value)}
                  options={roleOptions}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAssigningUser(null)
                  setSelectedRoleId('')
                }}
              >
                取消
              </Button>
              <Button
                type="button"
                disabled={!selectedRoleId || updateRoleMut.isPending}
                onClick={() => {
                  if (!selectedRoleId) return
                  updateRoleMut.mutate({
                    userId: assigningUser.internalId,
                    roleId: Number(selectedRoleId),
                  })
                }}
              >
                {updateRoleMut.isPending ? '儲存中...' : '儲存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
