import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { listAdminUsers, listRoles, updateUserRole, updateUserStatus } from '@/api/admin'
import type { AdminUserListItem } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function UserManagementPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [assigningUser, setAssigningUser] = useState<AdminUserListItem | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')

  const LIMIT = 20

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-server-users', search, page],
    queryFn: () =>
      listAdminUsers({ search: search || undefined, page, limit: LIMIT }).then((r) => r.data),
  })
  const users = usersData?.data ?? []
  const pagination = usersData?.pagination

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles().then((r) => r.data),
  })
  const roles = rolesData?.data ?? []

  const updateStatusMut = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      updateUserStatus(userId, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-server-users'] })
    },
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
    setSelectedRoleId(user.roles[0] ? String(user.roles[0].id) : '')
  }

  return (
    <div className="space-y-4">
      <h1 className="heading-lg">用戶管理</h1>

      <div className="flex gap-2">
        <Input
          placeholder="搜尋名稱 / Email"
          className="w-72"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-muted-foreground">
              {['ID', '名稱', 'Email', '狀態', '角色', '最後登入', '操作'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  載入中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  無資料
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border hover:bg-accent transition-colors"
                >
                  <td className="px-4 py-2 font-mono text-xs">{user.internalId}</td>
                  <td className="px-4 py-2 font-medium">{user.name ?? '-'}</td>
                  <td className="px-4 py-2 text-muted-foreground">{user.email ?? '-'}</td>
                  <td className="px-4 py-2">
                    <Badge variant={user.isActive ? 'success' : 'error'}>
                      {user.isActive ? '啟用' : '停用'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
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
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="mb-4 font-semibold">
              設定角色 —{' '}
              {assigningUser.name ?? assigningUser.email ?? `#${assigningUser.internalId}`}
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="role-select" className="mb-1 block text-sm font-medium">
                  角色
                </label>
                <select
                  id="role-select"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                  <option value="">選擇角色</option>
                  {roles.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name}
                    </option>
                  ))}
                </select>
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
