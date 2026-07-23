import {
  Building2,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { listAdminUsers } from '@/api/admin'
import type { Organization, OrganizationCreate, OrganizationUpdate } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAddOrganizationMember,
  useCreateOrganization,
  useOrganizationMembers,
  useOrganizations,
  useRemoveOrganizationMember,
  useUpdateOrganization,
} from '@/hooks/useOrganizations'
import { cn } from '@/lib/utils'

interface OrganizationFormState {
  name: string
  bio: string
  externalLink: string
  ownerEmail: string
}

const EMPTY_FORM: OrganizationFormState = {
  name: '',
  bio: '',
  externalLink: '',
  ownerEmail: '',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function OrganizationFormDialog({
  organization,
  open,
  onOpenChange,
}: {
  organization: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createMutation = useCreateOrganization()
  const updateMutation = useUpdateOrganization()
  const [form, setForm] = useState<OrganizationFormState>(EMPTY_FORM)
  const [emailError, setEmailError] = useState('')
  const [isResolvingEmail, setIsResolvingEmail] = useState(false)
  const isEditing = organization !== null
  const mutationError = createMutation.isError || updateMutation.isError
  const isSaving = createMutation.isPending || updateMutation.isPending || isResolvingEmail

  useEffect(() => {
    if (!open) return
    if (organization) {
      setForm({
        name: organization.name,
        bio: organization.bio ?? '',
        externalLink: organization.externalLink ?? '',
        ownerEmail: '',
      })
      setEmailError('')
      return
    }
    setForm(EMPTY_FORM)
    setEmailError('')
  }, [open, organization])

  function setField(field: keyof OrganizationFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'ownerEmail') setEmailError('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const shared = {
      name: form.name.trim(),
      bio: form.bio.trim() || null,
      externalLink: form.externalLink.trim() || null,
    }

    if (organization) {
      const data: OrganizationUpdate = shared
      await updateMutation.mutateAsync({ organizationId: organization.id, data })
    } else {
      const email = form.ownerEmail.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError('請輸入有效的 Email 格式。')
        return
      }
      setIsResolvingEmail(true)
      setEmailError('')
      try {
        const res = await listAdminUsers({ search: email, limit: 10 })
        const match = res.data.data?.find((u) => u.email?.toLowerCase() === email)
        if (!match) {
          setEmailError('找不到此 Email 對應的使用者。')
          return
        }
        const data: OrganizationCreate = {
          ...shared,
          ownerUserId: match.internalId,
        }
        await createMutation.mutateAsync(data)
      } finally {
        setIsResolvingEmail(false)
      }
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[85vh] max-w-xl overflow-y-auto p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">{isEditing ? '編輯組織' : '建立組織'}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isEditing ? '更新公開資訊與組織設定。' : '建立後會立即啟用，並加入首位 owner。'}
            </p>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="關閉"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>

        <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="organization-name" className="mb-1.5 block text-sm font-medium">
              組織名稱
            </label>
            <Input
              id="organization-name"
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="organization-bio" className="mb-1.5 block text-sm font-medium">
              組織介紹
            </label>
            <Textarea
              id="organization-bio"
              rows={5}
              maxLength={2000}
              value={form.bio}
              onChange={(event) => setField('bio', event.target.value)}
              className="w-full resize-y"
            />
          </div>

          <div>
            <label htmlFor="organization-link" className="mb-1.5 block text-sm font-medium">
              外部連結
            </label>
            <Input
              id="organization-link"
              type="url"
              placeholder="https://example.com"
              value={form.externalLink}
              onChange={(event) => setField('externalLink', event.target.value)}
              className="w-full"
            />
          </div>

          {!isEditing && (
            <div>
              <label htmlFor="organization-owner" className="mb-1.5 block text-sm font-medium">
                首位 owner 的 Email
              </label>
              <Input
                id="organization-owner"
                type="email"
                required
                placeholder="user@example.com"
                value={form.ownerEmail}
                onChange={(event) => setField('ownerEmail', event.target.value)}
                className="w-full"
              />
              {emailError && <p className="mt-1.5 text-sm text-destructive">{emailError}</p>}
            </div>
          )}

          {mutationError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              儲存失敗，請確認組織資料後再試一次。
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? '儲存變更' : '建立組織'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MemberPanel({ organization }: { organization: Organization }) {
  const { data: members, isLoading, isError } = useOrganizationMembers(organization.id)
  const addMutation = useAddOrganizationMember()
  const removeMutation = useRemoveOrganizationMember()
  const [userId, setUserId] = useState('')
  const mutationError = addMutation.isError || removeMutation.isError

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await addMutation.mutateAsync({ organizationId: organization.id, userId: Number(userId) })
    setUserId('')
  }

  function handleRemove(memberUserId: number, nickname: string | null) {
    const memberLabel = nickname ? `${nickname}（ID ${memberUserId}）` : `使用者 ID ${memberUserId}`
    if (!window.confirm(`確定要從「${organization.name}」移除 ${memberLabel}？`)) return
    removeMutation.mutate({ organizationId: organization.id, userId: memberUserId })
  }

  return (
    <section className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">組織成員</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{organization.name}</p>
          </div>
          <Badge variant="primary">{members?.length ?? 0} 位</Badge>
        </div>

        <form className="mt-4 flex gap-2" onSubmit={handleAdd}>
          <div className="min-w-0 flex-1">
            <label htmlFor="member-user-id" className="sr-only">
              使用者 ID
            </label>
            <Input
              id="member-user-id"
              type="number"
              min={1}
              required
              placeholder="輸入使用者 ID"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            disabled={addMutation.isPending || organization.status !== 'active'}
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            新增 owner
          </Button>
        </form>
        {organization.status !== 'active' && (
          <p className="mt-2 text-xs text-warning">停權中的組織不可新增成員。</p>
        )}
        {mutationError && (
          <p className="mt-2 text-sm text-destructive">
            成員操作失敗；請確認使用者存在、尚未加入，且不會移除最後一位 owner。
          </p>
        )}
      </div>

      <div className="max-h-[520px] overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            載入成員中
          </div>
        )}
        {isError && (
          <p className="px-5 py-10 text-center text-sm text-destructive">無法載入成員。</p>
        )}
        {!isLoading && !isError && members?.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">目前沒有成員。</p>
        )}
        {!isLoading && members && members.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>成員</TableHead>
                <TableHead>角色</TableHead>
                <TableHead className="w-12">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <p className="font-medium">{member.nickname ?? '未設定暱稱'}</p>
                    <p className="text-xs text-muted-foreground">User ID {member.userId}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{member.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`移除 ${member.nickname ?? member.userId}`}
                      disabled={removeMutation.isPending}
                      onClick={() => handleRemove(member.userId, member.nickname)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  )
}

export function OrganizationManagementPage() {
  const { data: organizations, isLoading, isError, refetch, isFetching } = useOrganizations()
  const updateMutation = useUpdateOrganization()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)

  useEffect(() => {
    if (selectedId === null && organizations && organizations.length > 0) {
      setSelectedId(organizations[0].id)
    }
  }, [organizations, selectedId])

  const selectedOrganization =
    organizations?.find((organization) => organization.id === selectedId) ?? null

  function openCreateDialog() {
    setEditingOrganization(null)
    setDialogOpen(true)
  }

  function openEditDialog(organization: Organization) {
    setEditingOrganization(organization)
    setDialogOpen(true)
  }

  function toggleStatus(organization: Organization) {
    const nextStatus = organization.status === 'active' ? 'suspended' : 'active'
    const actionLabel = nextStatus === 'active' ? '重新啟用' : '停權'
    if (!window.confirm(`確定要${actionLabel}「${organization.name}」？`)) return
    updateMutation.mutate({ organizationId: organization.id, data: { status: nextStatus } })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="組織設定"
        description="建立、編輯、啟用或停權 Lighthouse 組織，並管理組織 owner。"
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              重新整理
            </Button>
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              建立組織
            </Button>
          </div>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          載入組織中
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-12 text-center">
          <p className="text-sm text-destructive">無法載入組織資料。</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
            再試一次
          </Button>
        </div>
      )}

      {!isLoading && !isError && organizations?.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-5 py-16 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h2 className="mt-4 font-semibold">尚未建立組織</h2>
          <p className="mt-1 text-sm text-muted-foreground">建立第一個組織並指定首位 owner。</p>
          <Button type="button" className="mt-5" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            建立組織
          </Button>
        </div>
      )}

      {!isLoading && organizations && organizations.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
          <section className="overflow-hidden rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>組織</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>核准資訊</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((organization) => (
                  <TableRow
                    key={organization.id}
                    onClick={() => setSelectedId(organization.id)}
                    className={cn(
                      'cursor-pointer',
                      selectedId === organization.id && 'bg-primary/5',
                    )}
                  >
                    <TableCell className="max-w-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{organization.name}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {organization.bio || '尚未填寫組織介紹'}
                          </p>
                          {organization.externalLink && (
                            <a
                              href={organization.externalLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              查看連結
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={organization.status === 'active' ? 'success' : 'warning'}>
                        {organization.status === 'active' ? '啟用中' : '已停權'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5" />
                        <div>
                          <p>Admin ID {organization.approvedBy ?? '—'}</p>
                          <p>{formatDate(organization.approvedAt)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation()
                            openEditDialog(organization)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          編輯
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={updateMutation.isPending}
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleStatus(organization)
                          }}
                        >
                          {organization.status === 'active' ? '停權' : '啟用'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {updateMutation.isError && (
              <p className="border-t border-border px-5 py-3 text-sm text-destructive">
                狀態更新失敗，請稍後再試。
              </p>
            )}
          </section>

          {selectedOrganization && <MemberPanel organization={selectedOrganization} />}
        </div>
      )}

      <OrganizationFormDialog
        organization={editingOrganization}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
