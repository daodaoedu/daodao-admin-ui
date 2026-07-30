import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listAdminUsers, listRoles, updateUserRole, updateUserStatus } from '@/api/admin-server'
import { bulkTagUsers } from '@/api/admin-users'
import type { AdminUserListItem, CreationMethod, RegistrationFlow } from '@/api/types'
import { ExportButton } from '@/components/ExportButton'
import { UserLink } from '@/components/UserLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUserTags } from '@/hooks/useUserTags'

type PersonaType = 'L' | 'C' | 'A' | 'D' | 'O'

const PERSONA_LABELS: Record<PersonaType, string> = {
  D: '探探島',
  A: '動動島',
  O: '構構島',
  L: '跨跨島',
  C: '連連島',
}

const REGISTRATION_FLOW_LABEL: Record<RegistrationFlow, string> = {
  landing_page: 'Landing Page',
  quiz: '測驗',
  action_maker: 'Action Maker',
}

const CREATION_METHOD_LABEL: Record<CreationMethod, string> = {
  self_created: '自建',
  copied: '複製',
  action_generator: '產生器',
}

const REGISTRATION_FLOW_OPTIONS = [
  { value: '', label: '全部註冊來源' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'quiz', label: '測驗' },
  { value: 'action_maker', label: 'Action Maker' },
]

const CREATION_METHOD_OPTIONS = [
  { value: '', label: '全部實踐建立方式' },
  { value: 'self_created', label: '自建' },
  { value: 'copied', label: '複製' },
  { value: 'action_generator', label: '產生器' },
]

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

const DATE_PRESET_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'today', label: '今天' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: '90d', label: '近 90 天' },
]

const SORT_OPTIONS = [
  { value: 'lastActiveAt_desc', label: '最後操作' },
  { value: 'createdAt_desc', label: '最新註冊' },
  { value: 'createdAt_asc', label: '最早註冊' },
  { value: 'lastLoginAt_desc', label: '最近登入' },
  { value: 'name_asc', label: '名稱 A-Z' },
  { value: 'registrationFlow_asc', label: '註冊來源 A-Z' },
  { value: 'registrationFlow_desc', label: '註冊來源 Z-A' },
  { value: 'creationMethod_asc', label: '實踐建立方式 A-Z' },
  { value: 'creationMethod_desc', label: '實踐建立方式 Z-A' },
  { value: 'daysToComplete_desc', label: '完成天數高到低' },
  { value: 'daysToComplete_asc', label: '完成天數低到高' },
]

const SELECT_CLASS =
  'rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20'

type DatePreset = (typeof DATE_PRESET_OPTIONS)[number]['value']
type RecordPresenceFilter = 'all' | 'with' | 'without'

const LIMIT = 20
const TABLE_COLS = 16
const USER_MANAGEMENT_SORT_FIELDS: UserManagementSortBy[] = [
  'createdAt',
  'lastLoginAt',
  'lastActiveAt',
  'name',
  'email',
  'registrationFlow',
  'creationMethod',
  'daysToComplete',
]

function getRegistrationFlowLabel(flow: RegistrationFlow | null | undefined) {
  if (!flow) return '-'
  return REGISTRATION_FLOW_LABEL[flow] ?? '-'
}

function getCreationMethodLabel(method: CreationMethod | null | undefined) {
  if (!method) return '-'
  return CREATION_METHOD_LABEL[method] ?? '-'
}

function getDaysToCompleteLabel(daysToComplete: number | null) {
  return daysToComplete == null ? '-' : `${daysToComplete} 天`
}

function toInputDateValue(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function normalizePresenceFilter(value: string | null) {
  if (value === 'with' || value === 'without') return value
  return 'all'
}

function getPresetDateRange(preset: DatePreset) {
  if (!preset) return { from: '', to: '' }

  if (preset === 'today') {
    const today = toInputDateValue(new Date())
    return { from: today, to: today }
  }

  const days = preset === '7d' ? 6 : preset === '30d' ? 29 : 89
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  return { from: toInputDateValue(fromDate), to: toInputDateValue(new Date()) }
}

function getBadgeLabel(user: AdminUserListItem) {
  return user.badgeGranted == null ? '-' : user.badgeGranted ? '已完成' : '未完成'
}

type UserManagementSortBy =
  | 'createdAt'
  | 'lastLoginAt'
  | 'lastActiveAt'
  | 'name'
  | 'email'
  | 'registrationFlow'
  | 'creationMethod'
  | 'daysToComplete'

const TABLE_HEADERS = [
  '名稱',
  'Email',
  '狀態',
  '最後登入',
  '最後操作',
  '角色',
  '標籤',
  '學習風格',
  'Onboarding',
  '註冊來源',
  '實踐建立方式',
  '完成天數',
  'ID',
  'Custom ID',
  '操作',
]

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: TABLE_COLS }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <TableCell key={i}>
          <div
            className="h-4 animate-pulse rounded bg-muted"
            style={{ width: `${60 + (i % 3) * 20}%` }}
          />
        </TableCell>
      ))}
    </TableRow>
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
  const [registrationFlowFilter, setRegistrationFlowFilter] = useState(
    searchParams.get('registrationFlow') ?? '',
  )
  const [creationMethodFilter, setCreationMethodFilter] = useState(
    searchParams.get('creationMethod') ?? '',
  )
  const [lastLoginFrom, setLastLoginFrom] = useState(searchParams.get('lastLoginFrom') ?? '')
  const [lastLoginTo, setLastLoginTo] = useState(searchParams.get('lastLoginTo') ?? '')
  const [lastLoginPresenceFilter, setLastLoginPresenceFilter] = useState<RecordPresenceFilter>(
    normalizePresenceFilter(searchParams.get('lastLoginPresence')),
  )
  const [lastActivityFrom, setLastActivityFrom] = useState(
    searchParams.get('lastActivityFrom') ?? '',
  )
  const [lastActivityTo, setLastActivityTo] = useState(searchParams.get('lastActivityTo') ?? '')
  const [lastActivityPresenceFilter, setLastActivityPresenceFilter] =
    useState<RecordPresenceFilter>(
      normalizePresenceFilter(searchParams.get('lastActivityPresence')),
    )
  const initCreatedRange = (() => {
    const preset = searchParams.get('datePreset')
    if (preset) return getPresetDateRange(preset as DatePreset)
    return {
      from: searchParams.get('createdFrom') ?? '',
      to: searchParams.get('createdTo') ?? '',
    }
  })()
  const [createdFrom, setCreatedFrom] = useState(initCreatedRange.from)
  const [createdTo, setCreatedTo] = useState(initCreatedRange.to)

  const [sortValue, setSortValue] = useState(searchParams.get('sort') ?? 'lastActiveAt_desc')

  const [filterPanelOpen, setFilterPanelOpen] = useState(
    !!(searchParams.get('datePreset') || searchParams.get('createdFrom')),
  )
  const [assigningUser, setAssigningUser] = useState<AdminUserListItem | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [confirmDisableUser, setConfirmDisableUser] = useState<AdminUserListItem | null>(null)
  const [taggingUser, setTaggingUser] = useState<AdminUserListItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchTagModalOpen, setBatchTagModalOpen] = useState(false)
  const checkAllRef = useRef<HTMLInputElement>(null)

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
    if (registrationFlowFilter) params.registrationFlow = registrationFlowFilter
    if (creationMethodFilter) params.creationMethod = creationMethodFilter
    if (lastLoginFrom) params.lastLoginFrom = lastLoginFrom
    if (lastLoginTo) params.lastLoginTo = lastLoginTo
    if (lastLoginPresenceFilter !== 'all') params.lastLoginPresence = lastLoginPresenceFilter
    if (lastActivityFrom) params.lastActivityFrom = lastActivityFrom
    if (lastActivityTo) params.lastActivityTo = lastActivityTo
    if (lastActivityPresenceFilter !== 'all')
      params.lastActivityPresence = lastActivityPresenceFilter
    if (createdFrom) params.createdFrom = createdFrom
    if (createdTo) params.createdTo = createdTo
    if (sortValue !== 'lastActiveAt_desc') params.sort = sortValue
    setSearchParams(params, { replace: true })
  }, [
    search,
    page,
    statusFilter,
    roleIdFilter,
    personaFilter,
    badgeFilter,
    sourceFilter,
    registrationFlowFilter,
    creationMethodFilter,
    lastLoginFrom,
    lastLoginTo,
    lastLoginPresenceFilter,
    lastActivityFrom,
    lastActivityTo,
    lastActivityPresenceFilter,
    createdFrom,
    createdTo,
    sortValue,
    setSearchParams,
  ])

  const setLastLoginDatePreset = (preset: DatePreset) => {
    const { from, to } = getPresetDateRange(preset)
    setLastLoginFrom(from)
    setLastLoginTo(to)
    setPage(1)
  }

  const setLastActivityDatePreset = (preset: DatePreset) => {
    const { from, to } = getPresetDateRange(preset)
    setLastActivityFrom(from)
    setLastActivityTo(to)
    setPage(1)
  }

  const isLastLoginPresetActive = (preset: DatePreset) => {
    const { from, to } = getPresetDateRange(preset)
    return lastLoginFrom === from && lastLoginTo === to
  }

  const isLastActivityPresetActive = (preset: DatePreset) => {
    const { from, to } = getPresetDateRange(preset)
    return lastActivityFrom === from && lastActivityTo === to
  }

  const setCreatedDatePreset = (preset: DatePreset) => {
    const { from, to } = getPresetDateRange(preset)
    setCreatedFrom(from)
    setCreatedTo(to)
    setPage(1)
  }

  const isCreatedPresetActive = (preset: DatePreset) => {
    const { from, to } = getPresetDateRange(preset)
    return createdFrom === from && createdTo === to
  }

  const [sortField, sortOrder] = useMemo(() => {
    const match = sortValue.match(/^(?<field>[^_]+)_(?<order>asc|desc)$/)

    if (!match?.groups) {
      return ['lastActiveAt', 'desc'] as const
    }

    const fieldValue = match.groups.field
    const orderValue = match.groups.order

    const field = USER_MANAGEMENT_SORT_FIELDS.includes(fieldValue as UserManagementSortBy)
      ? (fieldValue as UserManagementSortBy)
      : 'lastActiveAt'

    const order = orderValue === 'asc' ? 'asc' : 'desc'
    return [field, order] as [UserManagementSortBy, 'asc' | 'desc']
  }, [sortValue])

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
      registrationFlowFilter,
      creationMethodFilter,
      lastLoginFrom,
      lastLoginTo,
      lastLoginPresenceFilter,
      lastActivityFrom,
      lastActivityTo,
      lastActivityPresenceFilter,
      createdFrom,
      createdTo,
      sortField,
      sortOrder,
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
        registrationFlow:
          (registrationFlowFilter as 'landing_page' | 'quiz' | 'action_maker') || undefined,
        creationMethod:
          (creationMethodFilter as 'self_created' | 'copied' | 'action_generator') || undefined,
        lastLoginFrom: lastLoginFrom || undefined,
        lastLoginTo: lastLoginTo || undefined,
        lastLoginPresence: lastLoginPresenceFilter === 'all' ? undefined : lastLoginPresenceFilter,
        lastActivityFrom: lastActivityFrom || undefined,
        lastActivityTo: lastActivityTo || undefined,
        lastActivityPresence:
          lastActivityPresenceFilter === 'all' ? undefined : lastActivityPresenceFilter,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        sortBy: sortField,
        sortOrder,
      }).then((r) => r.data),
  })

  const users = (Array.isArray(usersData?.data) ? usersData.data : []).map((user) => ({
    ...user,
    roles: Array.isArray(user.roles) ? user.roles : [],
  }))

  const exportData = useMemo(
    () =>
      users.map((user) => ({
        internalId: user.internalId,
        name: user.name,
        email: user.email,
        isActive: user.isActive ? '啟用' : '停用',
        userSource: user.userSource,
        tags: Array.isArray(user.tags) ? user.tags.map((t) => t.name).join(', ') : '',
        registrationFlow: getRegistrationFlowLabel(user.registrationFlow ?? null),
        creationMethod: getCreationMethodLabel(user.creationMethod ?? null),
        personaType: user.personaType
          ? `${user.personaType} ${PERSONA_LABELS[user.personaType as PersonaType]}`
          : '未測驗',
        badgeGranted: getBadgeLabel(user),
        daysToComplete: getDaysToCompleteLabel(user.daysToComplete ?? null),
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-TW') : '-',
        lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('zh-TW') : '-',
        customId: user.customId ?? '',
      })),
    [users],
  )
  const pagination = usersData?.pagination

  const fetchAllUsers = useCallback(async () => {
    const allItems: typeof users = []
    let currentPage = 1
    const perPage = 100
    let hasMore = true

    while (hasMore) {
      const response = await listAdminUsers({
        search: search || undefined,
        page: currentPage,
        limit: perPage,
        isActive: statusFilter === '' ? undefined : statusFilter === 'true',
        roleId: roleIdFilter ? Number(roleIdFilter) : undefined,
        personaType: (personaFilter as PersonaType) || undefined,
        badgeGranted: badgeFilter === '' ? undefined : badgeFilter === 'true',
        userSource: (sourceFilter as 'S1' | 'S2' | 'S3') || undefined,
        registrationFlow:
          (registrationFlowFilter as 'landing_page' | 'quiz' | 'action_maker') || undefined,
        creationMethod:
          (creationMethodFilter as 'self_created' | 'copied' | 'action_generator') || undefined,
        lastLoginFrom: lastLoginFrom || undefined,
        lastLoginTo: lastLoginTo || undefined,
        lastLoginPresence: lastLoginPresenceFilter === 'all' ? undefined : lastLoginPresenceFilter,
        lastActivityFrom: lastActivityFrom || undefined,
        lastActivityTo: lastActivityTo || undefined,
        lastActivityPresence:
          lastActivityPresenceFilter === 'all' ? undefined : lastActivityPresenceFilter,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        sortBy: sortField,
        sortOrder,
      }).then((r) => r.data)

      const items = (Array.isArray(response?.data) ? response.data : []).map((user) => ({
        ...user,
        roles: Array.isArray(user.roles) ? user.roles : [],
      }))
      allItems.push(...items)

      hasMore = response?.pagination?.hasNext ?? false
      currentPage++
    }

    return allItems.map((user) => ({
      internalId: user.internalId,
      name: user.name,
      email: user.email,
      isActive: user.isActive ? '啟用' : '停用',
      userSource: user.userSource,
      tags: Array.isArray(user.tags) ? user.tags.map((t) => t.name).join(', ') : '',
      registrationFlow: getRegistrationFlowLabel(user.registrationFlow ?? null),
      creationMethod: getCreationMethodLabel(user.creationMethod ?? null),
      personaType: user.personaType
        ? `${user.personaType} ${PERSONA_LABELS[user.personaType as PersonaType]}`
        : '未測驗',
      badgeGranted: getBadgeLabel(user),
      daysToComplete: getDaysToCompleteLabel(user.daysToComplete ?? null),
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-TW') : '-',
      lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('zh-TW') : '-',
      customId: user.customId ?? '',
    })) as unknown as Record<string, unknown>[]
  }, [
    search,
    statusFilter,
    roleIdFilter,
    personaFilter,
    badgeFilter,
    sourceFilter,
    registrationFlowFilter,
    creationMethodFilter,
    lastLoginFrom,
    lastLoginTo,
    lastLoginPresenceFilter,
    lastActivityFrom,
    lastActivityTo,
    lastActivityPresenceFilter,
    createdFrom,
    createdTo,
    sortField,
    sortOrder,
  ])

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
    registrationFlowFilter,
    creationMethodFilter,
    lastLoginFrom,
    lastLoginTo,
    lastLoginPresenceFilter !== 'all',
    lastActivityPresenceFilter !== 'all',
    lastActivityFrom,
    lastActivityTo,
  ].filter(Boolean).length
  const hasActiveFilters = activeFilterCount > 0

  const resetFilters = () => {
    setStatusFilter('')
    setRoleIdFilter('')
    setPersonaFilter('')
    setBadgeFilter('')
    setSourceFilter('')
    setRegistrationFlowFilter('')
    setCreationMethodFilter('')
    setLastLoginFrom('')
    setLastLoginTo('')
    setLastLoginPresenceFilter('all')
    setLastActivityFrom('')
    setLastActivityTo('')
    setLastActivityPresenceFilter('all')
    setCreatedFrom('')
    setCreatedTo('')
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

  const { data: allTags = [] } = useUserTags()

  const tagMut = useMutation({
    mutationFn: (data: { userIds: number[]; tagId: number; action: 'add' | 'remove' }) =>
      bulkTagUsers(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-server-users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'tags'] })
    },
  })

  const allPageSelected = users.length > 0 && users.every((u) => selectedIds.has(u.internalId))
  const somePageSelected = users.some((u) => selectedIds.has(u.internalId)) && !allPageSelected

  if (checkAllRef.current) {
    checkAllRef.current.indeterminate = somePageSelected
  }

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        for (const u of users) next.delete(u.internalId)
      } else {
        for (const u of users) next.add(u.internalId)
      }
      return next
    })
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

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
  if (registrationFlowFilter) {
    const opt = REGISTRATION_FLOW_OPTIONS.find((o) => o.value === registrationFlowFilter)
    const label = opt?.label ?? `未識別來源：${registrationFlowFilter}`
    activeChips.push({
      label: `註冊來源: ${label}`,
      onRemove: () => {
        setRegistrationFlowFilter('')
        setPage(1)
      },
    })
  }
  if (creationMethodFilter) {
    const opt = CREATION_METHOD_OPTIONS.find((o) => o.value === creationMethodFilter)
    const label = opt?.label ?? `未識別建立方式：${creationMethodFilter}`
    activeChips.push({
      label: `實踐建立方式: ${label}`,
      onRemove: () => {
        setCreationMethodFilter('')
        setPage(1)
      },
    })
  }
  if (createdFrom || createdTo) {
    const parts = [createdFrom || '...', createdTo || '...']
    activeChips.push({
      label: `註冊日期: ${parts[0]} ~ ${parts[1]}`,
      onRemove: () => {
        setCreatedFrom('')
        setCreatedTo('')
        setPage(1)
      },
    })
  }
  if (lastLoginFrom || lastLoginTo) {
    const parts = [lastLoginFrom || '...', lastLoginTo || '...']
    activeChips.push({
      label: `最後登入: ${parts[0]} ~ ${parts[1]}`,
      onRemove: () => {
        setLastLoginFrom('')
        setLastLoginTo('')
        setPage(1)
      },
    })
  }
  if (lastLoginPresenceFilter !== 'all') {
    activeChips.push({
      label: `登入紀錄: ${lastLoginPresenceFilter === 'with' ? '有紀錄' : '無紀錄'}`,
      onRemove: () => {
        setLastLoginPresenceFilter('all')
        setPage(1)
      },
    })
  }
  if (lastActivityFrom || lastActivityTo) {
    const parts = [lastActivityFrom || '...', lastActivityTo || '...']
    activeChips.push({
      label: `最後操作: ${parts[0]} ~ ${parts[1]}`,
      onRemove: () => {
        setLastActivityFrom('')
        setLastActivityTo('')
        setPage(1)
      },
    })
  }
  if (lastActivityPresenceFilter !== 'all') {
    activeChips.push({
      label: `操作紀錄: ${lastActivityPresenceFilter === 'with' ? '有紀錄' : '無紀錄'}`,
      onRemove: () => {
        setLastActivityPresenceFilter('all')
        setPage(1)
      },
    })
  }

  const totalPages = pagination?.totalItems ? Math.ceil(pagination.totalItems / LIMIT) : 0

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
              共 {(pagination.totalItems ?? 0).toLocaleString()} 位用戶
            </p>
          )}
        </div>
        <ExportButton
          data={exportData as unknown as Record<string, unknown>[]}
          fileName="user-management"
          fetchAll={fetchAllUsers}
          columns={[
            { key: 'name', header: '名稱' },
            { key: 'email', header: 'Email' },
            { key: 'isActive', header: '狀態' },
            { key: 'lastLoginAt', header: '最後登入' },
            { key: 'lastActiveAt', header: '最後操作' },
            { key: 'userSource', header: '來源' },
            { key: 'tags', header: '標籤' },
            { key: 'registrationFlow', header: '註冊來源' },
            { key: 'creationMethod', header: '實踐建立方式' },
            { key: 'personaType', header: '學習風格' },
            { key: 'badgeGranted', header: 'Badge' },
            { key: 'daysToComplete', header: '完成天數' },
            { key: 'internalId', header: 'ID' },
            { key: 'customId', header: 'Custom ID' },
          ]}
        />
      </div>

      {/* Toolbar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={sortValue}
            onValueChange={(v) => {
              setSortValue(v)
              setPage(1)
            }}
            options={SORT_OPTIONS}
            triggerClassName={`${SELECT_CLASS} w-44`}
          />
        </div>

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
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">快速時間區間</span>
              <div className="space-y-2 rounded-md border border-border/80 bg-background/60 p-2">
                <span className="text-xs text-muted-foreground">註冊日期</span>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESET_OPTIONS.map((preset) => (
                    <Button
                      key={`created-${preset.value}`}
                      type="button"
                      size="xs"
                      variant={isCreatedPresetActive(preset.value) ? 'secondary' : 'outline'}
                      onClick={() => setCreatedDatePreset(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    aria-label="註冊起始日期"
                    value={createdFrom}
                    onChange={(e) => {
                      setCreatedFrom(e.target.value)
                      setPage(1)
                    }}
                  />
                  <Input
                    type="date"
                    aria-label="註冊結束日期"
                    value={createdTo}
                    onChange={(e) => {
                      setCreatedTo(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-2 rounded-md border border-border/80 bg-background/60 p-2">
                  <span className="text-xs text-muted-foreground">最後登入</span>
                  <div className="flex flex-wrap gap-2">
                    {DATE_PRESET_OPTIONS.map((preset) => (
                      <Button
                        key={`login-${preset.value}`}
                        type="button"
                        size="xs"
                        variant={isLastLoginPresetActive(preset.value) ? 'secondary' : 'outline'}
                        onClick={() => setLastLoginDatePreset(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      aria-label="最後登入起始日期"
                      value={lastLoginFrom}
                      onChange={(e) => {
                        setLastLoginFrom(e.target.value)
                        setPage(1)
                      }}
                    />
                    <Input
                      type="date"
                      aria-label="最後登入結束日期"
                      value={lastLoginTo}
                      onChange={(e) => {
                        setLastLoginTo(e.target.value)
                        setPage(1)
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="xs"
                      variant={lastLoginPresenceFilter === 'all' ? 'secondary' : 'outline'}
                      onClick={() => {
                        setLastLoginPresenceFilter('all')
                        setPage(1)
                      }}
                    >
                      全部
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant={lastLoginPresenceFilter === 'with' ? 'secondary' : 'outline'}
                      onClick={() => {
                        setLastLoginPresenceFilter('with')
                        setPage(1)
                      }}
                    >
                      有紀錄
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant={lastLoginPresenceFilter === 'without' ? 'secondary' : 'outline'}
                      onClick={() => {
                        setLastLoginPresenceFilter('without')
                        setPage(1)
                      }}
                    >
                      無紀錄
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 rounded-md border border-border/80 bg-background/60 p-2">
                  <span className="text-xs text-muted-foreground">最後操作</span>
                  <div className="flex flex-wrap gap-2">
                    {DATE_PRESET_OPTIONS.map((preset) => (
                      <Button
                        key={`activity-${preset.value}`}
                        type="button"
                        size="xs"
                        variant={isLastActivityPresetActive(preset.value) ? 'secondary' : 'outline'}
                        onClick={() => setLastActivityDatePreset(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      aria-label="最後操作起始日期"
                      value={lastActivityFrom}
                      onChange={(e) => {
                        setLastActivityFrom(e.target.value)
                        setPage(1)
                      }}
                    />
                    <Input
                      type="date"
                      aria-label="最後操作結束日期"
                      value={lastActivityTo}
                      onChange={(e) => {
                        setLastActivityTo(e.target.value)
                        setPage(1)
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="xs"
                      variant={lastActivityPresenceFilter === 'all' ? 'secondary' : 'outline'}
                      onClick={() => {
                        setLastActivityPresenceFilter('all')
                        setPage(1)
                      }}
                    >
                      全部
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant={lastActivityPresenceFilter === 'with' ? 'secondary' : 'outline'}
                      onClick={() => {
                        setLastActivityPresenceFilter('with')
                        setPage(1)
                      }}
                    >
                      有紀錄
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant={lastActivityPresenceFilter === 'without' ? 'secondary' : 'outline'}
                      onClick={() => {
                        setLastActivityPresenceFilter('without')
                        setPage(1)
                      }}
                    >
                      無紀錄
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
                options={STATUS_OPTIONS}
                triggerClassName={`${SELECT_CLASS} w-full`}
              />
              <Select
                value={roleIdFilter}
                onValueChange={(v) => {
                  setRoleIdFilter(v)
                  setPage(1)
                }}
                options={roleFilterOptions}
                triggerClassName={`${SELECT_CLASS} w-full`}
              />
              <Select
                value={personaFilter}
                onValueChange={(v) => {
                  setPersonaFilter(v)
                  setPage(1)
                }}
                options={PERSONA_OPTIONS}
                triggerClassName={`${SELECT_CLASS} w-full`}
              />
              <Select
                value={badgeFilter}
                onValueChange={(v) => {
                  setBadgeFilter(v)
                  setPage(1)
                }}
                options={BADGE_OPTIONS}
                triggerClassName={`${SELECT_CLASS} w-full`}
              />
              <Select
                value={sourceFilter}
                onValueChange={(v) => {
                  setSourceFilter(v)
                  setPage(1)
                }}
                options={SOURCE_OPTIONS}
                triggerClassName={`${SELECT_CLASS} w-full`}
              />
              <Select
                value={registrationFlowFilter}
                onValueChange={(v) => {
                  setRegistrationFlowFilter(v)
                  setPage(1)
                }}
                options={REGISTRATION_FLOW_OPTIONS}
                triggerClassName={`${SELECT_CLASS} w-full`}
              />
              <Select
                value={creationMethodFilter}
                onValueChange={(v) => {
                  setCreationMethodFilter(v)
                  setPage(1)
                }}
                options={CREATION_METHOD_OPTIONS}
                triggerClassName={`${SELECT_CLASS} w-full`}
              />
            </div>
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

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-primary shrink-0">
            已選 {selectedIds.size} 位用戶
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => setBatchTagModalOpen(true)}>
              批次上標籤
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <Table className="min-w-[1400px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  ref={checkAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleAll}
                  className="rounded border-input accent-primary"
                />
              </TableHead>
              {TABLE_HEADERS.map((h) => (
                <TableHead key={h} className="whitespace-nowrap">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                <SkeletonRow key={i} />
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_COLS} className="text-center text-muted-foreground">
                  無符合條件的用戶
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const badgeLabel = getBadgeLabel(user)
                const isSelected = selectedIds.has(user.internalId)
                return (
                  <TableRow key={user.id} className={isSelected ? 'bg-primary/5' : undefined}>
                    {/* 勾選 */}
                    <TableCell className="w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(user.internalId)}
                        className="rounded border-input accent-primary"
                      />
                    </TableCell>
                    {/* 名稱 */}
                    <TableCell className="font-medium whitespace-nowrap">
                      <UserLink
                        userId={user.internalId}
                        name={user.name ?? '-'}
                        showAvatar={false}
                      />
                    </TableCell>
                    {/* Email */}
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {user.email ?? '-'}
                    </TableCell>
                    {/* 狀態 */}
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'error'}>
                        {user.isActive ? '啟用' : '停用'}
                      </Badge>
                    </TableCell>
                    {/* 最後登入 */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-TW') : '-'}
                    </TableCell>
                    {/* 最後操作 */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {user.lastActiveAt
                        ? new Date(user.lastActiveAt).toLocaleString('zh-TW')
                        : '-'}
                    </TableCell>
                    {/* 角色 */}
                    <TableCell>
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
                    </TableCell>
                    {/* 標籤 */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {(user.tags ?? []).length > 0 || (user.entityTags ?? []).length > 0 ? (
                          <>
                            {(user.tags ?? []).slice(0, 2).map((tag) => (
                              <span
                                key={`admin-${tag.id}`}
                                className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {(user.entityTags ?? []).slice(0, 2).map((tag) => (
                              <Badge key={`entity-${tag.id}`} variant="default">
                                {tag.name}
                              </Badge>
                            ))}
                            {Math.max(0, (user.tags ?? []).length - 2) +
                              Math.max(0, (user.entityTags ?? []).length - 2) >
                              0 && (
                              <span className="text-xs text-muted-foreground">
                                +
                                {Math.max(0, (user.tags ?? []).length - 2) +
                                  Math.max(0, (user.entityTags ?? []).length - 2)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    {/* 學習風格 */}
                    <TableCell className="whitespace-nowrap">
                      {user.personaType ? (
                        <Badge variant="primary">
                          {user.personaType} {PERSONA_LABELS[user.personaType as PersonaType]}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">未測驗</span>
                      )}
                    </TableCell>
                    {/* Onboarding */}
                    <TableCell>
                      {badgeLabel === '-' ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : badgeLabel === '已完成' ? (
                        <Badge variant="success">已完成</Badge>
                      ) : (
                        <Badge variant="default">未完成</Badge>
                      )}
                    </TableCell>
                    {/* 註冊來源 */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {getRegistrationFlowLabel(user.registrationFlow ?? null)}
                    </TableCell>
                    {/* 實踐建立方式 */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {getCreationMethodLabel(user.creationMethod ?? null)}
                    </TableCell>
                    {/* 完成天數 */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {getDaysToCompleteLabel(user.daysToComplete ?? null)}
                    </TableCell>
                    {/* ID */}
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.internalId}
                    </TableCell>
                    {/* Custom ID */}
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {user.customId ? `@${user.customId}` : '-'}
                    </TableCell>
                    {/* 操作 */}
                    <TableCell>
                      <div className="flex gap-1 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => setTaggingUser(user)}
                        >
                          標籤
                        </Button>
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
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            共 {(pagination.totalItems ?? 0).toLocaleString()} 位 · 第 {page} / {totalPages} 頁
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
              disabled={!pagination.hasNext}
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

      {/* Assign Tags Modal — toggles on click */}
      {taggingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-6 shadow-lg">
            <h3 className="mb-4 font-semibold">
              指派標籤 — {taggingUser.name ?? taggingUser.email ?? `#${taggingUser.internalId}`}
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const hasTag = (taggingUser.tags ?? []).some((t) => t.id === tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={tagMut.isPending}
                    onClick={() =>
                      tagMut.mutate(
                        {
                          userIds: [taggingUser.internalId],
                          tagId: tag.id,
                          action: hasTag ? 'remove' : 'add',
                        },
                        {
                          onSuccess: () => {
                            setTaggingUser((prev) => {
                              if (!prev) return null
                              const currentTags = prev.tags ?? []
                              const newTags = hasTag
                                ? currentTags.filter((t) => t.id !== tag.id)
                                : [...currentTags, { id: tag.id, name: tag.name, color: tag.color }]
                              return { ...prev, tags: newTags }
                            })
                          },
                        },
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      hasTag
                        ? 'border-transparent text-white'
                        : 'border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                    style={hasTag ? { backgroundColor: tag.color } : undefined}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                )
              })}
              {allTags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  尚無標籤，請先到「用戶標籤」頁面建立
                </p>
              )}
            </div>
            {tagMut.isPending && <p className="mt-3 text-xs text-muted-foreground">儲存中...</p>}
            <div className="mt-5 flex justify-end">
              <Button type="button" variant="secondary" onClick={() => setTaggingUser(null)}>
                關閉
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Tag Modal */}
      {batchTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-6 shadow-lg">
            <h3 className="mb-2 font-semibold">批次上標籤</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              已選 {selectedIds.size} 位用戶，點擊標籤即可批次新增
            </p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  disabled={tagMut.isPending}
                  onClick={() =>
                    tagMut.mutate(
                      {
                        userIds: Array.from(selectedIds),
                        tagId: tag.id,
                        action: 'add',
                      },
                      {
                        onSuccess: () => {
                          setBatchTagModalOpen(false)
                          setSelectedIds(new Set())
                        },
                      },
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-foreground/30"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
              {allTags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  尚無標籤，請先到「用戶標籤」頁面建立
                </p>
              )}
            </div>
            {tagMut.isPending && <p className="mt-3 text-xs text-muted-foreground">套用中...</p>}
            <div className="mt-5 flex justify-end">
              <Button type="button" variant="secondary" onClick={() => setBatchTagModalOpen(false)}>
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
