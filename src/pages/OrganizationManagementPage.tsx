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
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useEffect, useState } from 'react'
import type { Organization } from '@/api/types'
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
  useApproveOrganizationInvitation,
  useCreateOrganization,
  useInviteOrganizationOwner,
  useOrganizationInvitations,
  useOrganizationMembers,
  useOrganizations,
  useRemoveOrganizationMember,
  useResendOrganizationInvitation,
  useRevokeOrganizationInvitation,
  useUpdateOrganization,
} from '@/hooks/useOrganizations'
import {
  canApproveOrganizationInvitation,
  organizationOperationError,
} from '@/lib/organization-invitation'
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
  onCreated,
}: {
  organization: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (organizationId: number) => void
}) {
  const createMutation = useCreateOrganization()
  const updateMutation = useUpdateOrganization()
  const [form, setForm] = useState<OrganizationFormState>(EMPTY_FORM)
  const [submitError, setSubmitError] = useState('')
  const isEditing = organization !== null
  const isSaving = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    if (organization) {
      setForm({
        name: organization.name,
        bio: organization.bio ?? '',
        externalLink: organization.externalLink ?? '',
        ownerEmail: '',
      })
      setSubmitError('')
      return
    }
    setForm(EMPTY_FORM)
    setSubmitError('')
  }, [open, organization])

  function setField(field: keyof OrganizationFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'ownerEmail') setSubmitError('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const shared = {
      name: form.name.trim(),
      bio: form.bio.trim() || null,
      externalLink: form.externalLink.trim() || null,
    }

    setSubmitError('')
    try {
      if (organization) {
        await updateMutation.mutateAsync({ organizationId: organization.id, data: shared })
      } else {
        const response = await createMutation.mutateAsync({
          ...shared,
          ownerEmail: form.ownerEmail.trim().toLowerCase(),
        })
        onCreated(response.data.data.id)
      }
    } catch (error) {
      setSubmitError(organizationOperationError(error, '儲存失敗，請確認組織資料後再試一次。'))
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[85vh] max-w-xl overflow-y-auto p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <DialogPrimitive.Title className="text-base font-semibold">
              {isEditing ? '編輯組織' : '建立組織'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">
              {isEditing
                ? '更新公開資訊與組織設定。'
                : '已註冊帳號會直接加入；尚未註冊的 Email 會收到 7 天有效的邀請。'}
            </DialogPrimitive.Description>
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

        <form
          className="space-y-4 px-6 py-5"
          onSubmit={handleSubmit}
          aria-describedby={submitError ? 'organization-submit-error' : undefined}
        >
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
            </div>
          )}

          {submitError && (
            <p
              id="organization-submit-error"
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
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
  const addMutation = useInviteOrganizationOwner()
  const removeMutation = useRemoveOrganizationMember()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [addMessage, setAddMessage] = useState('')
  const isAdding = addMutation.isPending

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEmailError('')
    setAddMessage('')
    try {
      const response = await addMutation.mutateAsync({
        organizationId: organization.id,
        email: email.trim().toLowerCase(),
      })
      setEmail('')
      setAddMessage(
        response.data.data.status === 'accepted'
          ? '已加入 owner。'
          : '已建立邀請，請在下方確認寄送狀態。',
      )
    } catch (error) {
      setEmailError(organizationOperationError(error, '邀請失敗，請稍後再試。'))
    }
  }

  function handleRemove(memberUserId: number, nickname: string | null) {
    const memberLabel = nickname ? `${nickname}（ID ${memberUserId}）` : `使用者 ID ${memberUserId}`
    if (!window.confirm(`確定要從「${organization.name}」移除 ${memberLabel}？`)) return
    setEmailError('')
    setAddMessage('')
    removeMutation.mutate(
      { organizationId: organization.id, userId: memberUserId },
      {
        onError: (error) =>
          setEmailError(organizationOperationError(error, '移除失敗，請稍後再試。')),
      },
    )
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

        <p className="mt-3 text-xs text-muted-foreground">
          尚未註冊也可邀請；新 owner 加入後，才能移除最後一位舊 owner。
        </p>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={handleAdd}
          aria-describedby={emailError ? 'organization-member-error' : undefined}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="member-email" className="sr-only">
              成員 Email
            </label>
            <Input
              id="member-email"
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailError('')
                setAddMessage('')
              }}
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={isAdding || organization.status !== 'active'}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            新增 owner
          </Button>
        </form>
        {emailError && (
          <p id="organization-member-error" role="alert" className="mt-2 text-sm text-destructive">
            {emailError}
          </p>
        )}
        {organization.status !== 'active' && (
          <p className="mt-2 text-xs text-warning">停權中的組織不可新增成員。</p>
        )}
        {addMessage && (
          <p role="status" className="mt-2 text-sm text-success">
            {addMessage}
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
                    <p className="text-xs text-muted-foreground">
                      {member.email ?? '未設定 Email'}
                    </p>
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
      <InvitationPanel organization={organization} />
    </section>
  )
}

const INVITATION_STATUS_LABEL = {
  pending: '待加入',
  accepted: '已加入',
  expired: '已過期',
  revoked: '已撤銷',
} as const

const DELIVERY_STATUS_LABEL = {
  pending: '待寄送',
  sent: '已寄出',
  failed: '寄送失敗，請重寄',
} as const

function InvitationPanel({ organization }: { organization: Organization }) {
  const {
    data: invitations,
    isLoading,
    isError,
    refetch,
  } = useOrganizationInvitations(organization.id)
  const resendMutation = useResendOrganizationInvitation()
  const revokeMutation = useRevokeOrganizationInvitation()
  const approveMutation = useApproveOrganizationInvitation()
  const [actionError, setActionError] = useState('')
  const isWorking =
    resendMutation.isPending || revokeMutation.isPending || approveMutation.isPending

  function handleResend(invitationId: number) {
    if (!window.confirm('重寄後，舊邀請連結會立即失效，新連結有效 7 天。確定重寄？')) return
    setActionError('')
    resendMutation.mutate(
      { organizationId: organization.id, invitationId },
      {
        onError: (error) =>
          setActionError(organizationOperationError(error, '重寄失敗，請稍後再試。')),
      },
    )
  }

  function handleRevoke(invitationId: number) {
    if (!window.confirm('確定撤銷邀請？對方將無法再使用這個連結加入組織。')) return
    setActionError('')
    revokeMutation.mutate(
      { organizationId: organization.id, invitationId },
      {
        onError: (error) =>
          setActionError(organizationOperationError(error, '撤銷失敗，請稍後再試。')),
      },
    )
  }

  function handleApprove(
    invitationId: number,
    requestId: number,
    invitedEmail: string,
    applicant: string,
  ) {
    if (
      !window.confirm(
        `受邀 Email：${invitedEmail}\n申請帳號：${applicant}\n\n請先確認為同一位受邀者。核准後，這個申請帳號會成為「${organization.name}」的 owner。確定核准？`,
      )
    )
      return
    setActionError('')
    approveMutation.mutate(
      { organizationId: organization.id, invitationId, requestId },
      {
        onError: (error) =>
          setActionError(organizationOperationError(error, '核准失敗，請重新整理邀請狀態後再試。')),
      },
    )
  }

  return (
    <div className="border-t border-border px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Owner 邀請</h3>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => void refetch()}
          aria-label="重新整理邀請"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        邀請有效 7 天。Email 不符時，請確認申請帳號後再核准。
      </p>
      {isLoading && <p className="mt-4 text-sm text-muted-foreground">載入邀請中…</p>}
      {isError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          無法載入邀請，請重新整理。
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {actionError}
        </p>
      )}
      {!isLoading && !isError && invitations?.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">目前沒有邀請紀錄。</p>
      )}
      <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto">
        {invitations?.map((invitation) => {
          const canApprove = canApproveOrganizationInvitation(invitation)
          const status =
            invitation.status === 'pending' && !canApprove ? 'expired' : invitation.status
          const isActive = organization.status === 'active'
          return (
            <div key={invitation.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 break-all text-sm font-medium">{invitation.email}</p>
                <Badge variant={status === 'accepted' ? 'success' : 'warning'}>
                  {INVITATION_STATUS_LABEL[status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                有效至 {formatDate(invitation.expiresAt)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                寄送狀態：{DELIVERY_STATUS_LABEL[invitation.deliveryStatus]}
              </p>
              {status !== 'accepted' && (
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isWorking || !isActive}
                    onClick={() => handleResend(invitation.id)}
                  >
                    重寄邀請
                  </Button>
                  {canApprove && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isWorking}
                      onClick={() => handleRevoke(invitation.id)}
                    >
                      撤銷邀請
                    </Button>
                  )}
                </div>
              )}
              {invitation.requests.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-medium">
                    {status === 'accepted' ? '申請紀錄（已處理）' : 'Email 不符，需由島島確認'}
                  </p>
                  {invitation.requests.map((request) => (
                    <div key={request.id} className="rounded-md bg-muted/50 p-2">
                      <p className="break-all text-sm">
                        {request.nickname ?? '未設定暱稱'} · {request.email ?? '未提供 Email'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        帳號 ID {request.userId} · {formatDate(request.createdAt)}
                      </p>
                      {canApprove && (
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2"
                          disabled={isWorking || !isActive}
                          onClick={() =>
                            handleApprove(
                              invitation.id,
                              request.id,
                              invitation.email,
                              `${request.nickname ?? '未設定暱稱'}（${request.email ?? '未提供 Email'}，ID ${request.userId}）`,
                            )
                          }
                        >
                          確認此帳號並加入 owner
                        </Button>
                      )}
                    </div>
                  ))}
                  {!canApprove && (
                    <p className="text-xs text-muted-foreground">
                      此邀請已失效或已使用，無法核准申請。
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
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
    <div className="space-y-6 [&>div:first-child]:flex-col sm:[&>div:first-child]:flex-row">
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
          <section className="max-h-[60vh] overflow-y-auto rounded-xl border border-[var(--admin-card-border)] bg-card/95 shadow-sm xl:max-h-none">
            <Table className="min-w-[600px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[32%]">組織</TableHead>
                  <TableHead className="w-[16%]">狀態</TableHead>
                  <TableHead className="w-[24%]">核准資訊</TableHead>
                  <TableHead className="w-[28%] text-right">操作</TableHead>
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
                          <button
                            type="button"
                            aria-pressed={selectedId === organization.id}
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedId(organization.id)
                            }}
                            className="break-words rounded-sm text-left font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                          >
                            {organization.name}
                          </button>
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
                      <Badge
                        className="whitespace-nowrap"
                        variant={organization.status === 'active' ? 'success' : 'warning'}
                      >
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
                      <div className="flex justify-end gap-1 whitespace-nowrap">
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

          {selectedOrganization && (
            <MemberPanel key={selectedOrganization.id} organization={selectedOrganization} />
          )}
        </div>
      )}

      <OrganizationFormDialog
        organization={editingOrganization}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={setSelectedId}
      />
    </div>
  )
}
