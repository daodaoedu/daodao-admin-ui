import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  addRolePermission,
  createPermission,
  createRole,
  deletePermission,
  deleteRole,
  getRoleWithPermissions,
  listPermissions,
  listRoles,
  removeRolePermission,
  updatePermission,
  updateRole,
} from '@/api/admin-server'
import type { Permission, Role } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Tab = 'roles' | 'permissions'

interface RoleFormState {
  name: string
  description: string
}

interface PermissionFormState {
  name: string
  description: string
}

export function RolesPermissionsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('roles')

  // Roles tab state
  const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [roleForm, setRoleForm] = useState<RoleFormState>({ name: '', description: '' })
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editRoleForm, setEditRoleForm] = useState<RoleFormState>({ name: '', description: '' })

  // Permissions tab state
  const [showPermForm, setShowPermForm] = useState(false)
  const [permForm, setPermForm] = useState<PermissionFormState>({ name: '', description: '' })
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null)
  const [editPermForm, setEditPermForm] = useState<PermissionFormState>({
    name: '',
    description: '',
  })

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles().then((r) => r.data),
  })
  const roles = rolesData?.data ?? []

  const { data: permsData, isLoading: permsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => listPermissions().then((r) => r.data),
  })
  const permissions = permsData?.data ?? []

  const { data: expandedRoleData } = useQuery({
    queryKey: ['role-detail', expandedRoleId],
    queryFn: () =>
      expandedRoleId !== null
        ? getRoleWithPermissions(expandedRoleId).then((r) => r.data.data)
        : null,
    enabled: expandedRoleId !== null,
  })

  const createRoleMut = useMutation({
    mutationFn: (data: { name: string; description?: string }) => createRole(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setShowRoleForm(false)
      setRoleForm({ name: '', description: '' })
    },
  })

  const updateRoleMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
      updateRole(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setEditingRole(null)
    },
  })

  const deleteRoleMut = useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      if (expandedRoleId !== null) setExpandedRoleId(null)
    },
  })

  const addPermMut = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: number; permissionId: number }) =>
      addRolePermission(roleId, permissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role-detail', expandedRoleId] })
    },
  })

  const removePermMut = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: number; permissionId: number }) =>
      removeRolePermission(roleId, permissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role-detail', expandedRoleId] })
    },
  })

  const createPermMut = useMutation({
    mutationFn: (data: { name: string; description?: string }) => createPermission(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permissions'] })
      setShowPermForm(false)
      setPermForm({ name: '', description: '' })
    },
  })

  const updatePermMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
      updatePermission(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permissions'] })
      setEditingPerm(null)
    },
  })

  const deletePermMut = useMutation({
    mutationFn: (id: number) => deletePermission(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permissions'] })
    },
  })

  const openEditRole = (role: Role) => {
    setEditingRole(role)
    setEditRoleForm({ name: role.name, description: role.description ?? '' })
  }

  const openEditPerm = (perm: Permission) => {
    setEditingPerm(perm)
    setEditPermForm({ name: perm.name, description: perm.description ?? '' })
  }

  const assignedPermIds = new Set(expandedRoleData?.permissions.map((p) => p.id) ?? [])

  return (
    <div className="space-y-4">
      <PageHeader
        title="角色權限"
        description="定義管理員角色與存取權限，確保不同職能人員只能操作授權範圍。"
      />

      <div className="inline-flex rounded-lg border border-[var(--admin-panel-border)] bg-background/65 p-1">
        {(['roles', 'permissions'] as Tab[]).map((t) => (
          <Button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-transparent bg-transparent shadow-none hover:bg-muted hover:text-foreground flex-1 justify-center',
              tab === t
                ? 'bg-background/70 text-foreground shadow-sm hover:bg-background/70'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'roles' ? '角色' : '權限'}
          </Button>
        ))}
      </div>

      {tab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowRoleForm(true)
                setRoleForm({ name: '', description: '' })
              }}
            >
              建立角色
            </Button>
          </div>

          {showRoleForm && (
            <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-4 space-y-3">
              <h3 className="font-medium text-sm">建立角色</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label htmlFor="role-name" className="mb-1 block text-xs font-medium">
                    名稱 *
                  </label>
                  <Input
                    id="role-name"
                    placeholder="角色名稱"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="role-desc" className="mb-1 block text-xs font-medium">
                    說明
                  </label>
                  <Input
                    id="role-desc"
                    placeholder="選填"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!roleForm.name || createRoleMut.isPending}
                  onClick={() =>
                    createRoleMut.mutate({
                      name: roleForm.name,
                      description: roleForm.description || undefined,
                    })
                  }
                >
                  {createRoleMut.isPending ? '建立中...' : '建立'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRoleForm(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                  {['ID', '名稱', '說明', '建立時間', '操作'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rolesLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      載入中...
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      無資料
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <>
                      <tr
                        key={role.id}
                        className="border-b border-border hover:bg-accent transition-colors cursor-pointer"
                        onClick={() =>
                          setExpandedRoleId(expandedRoleId === role.id ? null : role.id)
                        }
                      >
                        <td className="px-4 py-2 font-mono text-xs">{role.id}</td>
                        <td className="px-4 py-2 font-medium">
                          <Badge variant="primary">{role.name}</Badge>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {role.description ?? '-'}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {role.created_at ? new Date(role.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td
                          className="px-4 py-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              onClick={() => openEditRole(role)}
                            >
                              編輯
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              onClick={() => {
                                if (confirm(`刪除角色「${role.name}」？`))
                                  deleteRoleMut.mutate(role.id)
                              }}
                            >
                              刪除
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedRoleId === role.id && (
                        <tr key={`${role.id}-expanded`} className="bg-muted/40">
                          <td colSpan={5} className="px-6 py-3">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                已指派權限
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(expandedRoleData?.permissions ?? []).map((p) => (
                                  <span
                                    key={p.id}
                                    className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                                  >
                                    {p.name}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="xs"
                                      className="h-4 w-4 p-0 text-primary/60 hover:text-primary"
                                      onClick={() =>
                                        removePermMut.mutate({
                                          roleId: role.id,
                                          permissionId: p.id,
                                        })
                                      }
                                    >
                                      ×
                                    </Button>
                                  </span>
                                ))}
                                {(expandedRoleData?.permissions ?? []).length === 0 && (
                                  <span className="text-xs text-muted-foreground">尚無權限</span>
                                )}
                              </div>
                              <div className="pt-1">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  新增權限
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {permissions
                                    .filter((p) => !assignedPermIds.has(p.id))
                                    .map((p) => (
                                      <Button
                                        key={p.id}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          addPermMut.mutate({
                                            roleId: role.id,
                                            permissionId: p.id,
                                          })
                                        }
                                      >
                                        + {p.name}
                                      </Button>
                                    ))}
                                  {permissions.filter((p) => !assignedPermIds.has(p.id)).length ===
                                    0 && (
                                    <span className="text-xs text-muted-foreground">
                                      所有權限已指派
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowPermForm(true)
                setPermForm({ name: '', description: '' })
              }}
            >
              建立權限
            </Button>
          </div>

          {showPermForm && (
            <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-4 space-y-3">
              <h3 className="font-medium text-sm">建立權限</h3>
              <p className="text-xs text-muted-foreground">
                名稱格式：resource:action（例如 user:read）
              </p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label htmlFor="perm-name" className="mb-1 block text-xs font-medium">
                    名稱 *
                  </label>
                  <Input
                    id="perm-name"
                    placeholder="resource:action"
                    value={permForm.name}
                    onChange={(e) => setPermForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="perm-desc" className="mb-1 block text-xs font-medium">
                    說明
                  </label>
                  <Input
                    id="perm-desc"
                    placeholder="選填"
                    value={permForm.description}
                    onChange={(e) => setPermForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!permForm.name || createPermMut.isPending}
                  onClick={() =>
                    createPermMut.mutate({
                      name: permForm.name,
                      description: permForm.description || undefined,
                    })
                  }
                >
                  {createPermMut.isPending ? '建立中...' : '建立'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowPermForm(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                  {['ID', '名稱', '說明', '建立時間', '操作'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      載入中...
                    </td>
                  </tr>
                ) : permissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      無資料
                    </td>
                  </tr>
                ) : (
                  permissions.map((perm) => (
                    <tr
                      key={perm.id}
                      className="border-b border-border/80 hover:bg-muted/45 transition-colors transition-colors"
                    >
                      <td className="px-4 py-2 font-mono text-xs">{perm.id}</td>
                      <td className="px-4 py-2">
                        <Badge variant="primary">{perm.name}</Badge>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{perm.description ?? '-'}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {perm.created_at ? new Date(perm.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="xs"
                            onClick={() => openEditPerm(perm)}
                          >
                            編輯
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="xs"
                            onClick={() => {
                              if (confirm(`刪除權限「${perm.name}」？`))
                                deletePermMut.mutate(perm.id)
                            }}
                          >
                            刪除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-lg w-full max-w-md p-6">
            <h3 className="mb-4 font-semibold">編輯角色</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-role-name" className="mb-1 block text-sm font-medium">
                  名稱
                </label>
                <Input
                  id="edit-role-name"
                  value={editRoleForm.name}
                  onChange={(e) => setEditRoleForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="edit-role-desc" className="mb-1 block text-sm font-medium">
                  說明
                </label>
                <Input
                  id="edit-role-desc"
                  value={editRoleForm.description}
                  onChange={(e) => setEditRoleForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingRole(null)}>
                取消
              </Button>
              <Button
                type="button"
                disabled={!editRoleForm.name || updateRoleMut.isPending}
                onClick={() =>
                  updateRoleMut.mutate({
                    id: editingRole.id,
                    data: {
                      name: editRoleForm.name,
                      description: editRoleForm.description || undefined,
                    },
                  })
                }
              >
                {updateRoleMut.isPending ? '儲存中...' : '儲存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permission Modal */}
      {editingPerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-lg w-full max-w-md p-6">
            <h3 className="mb-4 font-semibold">編輯權限</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-perm-name" className="mb-1 block text-sm font-medium">
                  名稱
                </label>
                <Input
                  id="edit-perm-name"
                  value={editPermForm.name}
                  onChange={(e) => setEditPermForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="edit-perm-desc" className="mb-1 block text-sm font-medium">
                  說明
                </label>
                <Input
                  id="edit-perm-desc"
                  value={editPermForm.description}
                  onChange={(e) => setEditPermForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingPerm(null)}>
                取消
              </Button>
              <Button
                type="button"
                disabled={!editPermForm.name || updatePermMut.isPending}
                onClick={() =>
                  updatePermMut.mutate({
                    id: editingPerm.id,
                    data: {
                      name: editPermForm.name,
                      description: editPermForm.description || undefined,
                    },
                  })
                }
              >
                {updatePermMut.isPending ? '儲存中...' : '儲存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
