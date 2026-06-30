import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { listUsers, upsertUserQuota } from '@/api/admin-ai'
import type { UserWithQuota } from '@/api/types'
import { ExportButton } from '@/components/ExportButton'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const LIMIT = 50

interface QuotaForm {
  monthly_token_limit: string
  daily_token_limit: string
}

export function UserQuotasPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [editing, setEditing] = useState<UserWithQuota | null>(null)
  const [quotaForm, setQuotaForm] = useState<QuotaForm>({
    monthly_token_limit: '1000000',
    daily_token_limit: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, offset],
    queryFn: () =>
      listUsers({ limit: LIMIT, offset, search: search || undefined }).then((r) => r.data),
  })

  const users = data?.data ?? []
  const pagination = data?.pagination

  const upsertMut = useMutation({
    mutationFn: ({ userId, form }: { userId: number; form: QuotaForm }) =>
      upsertUserQuota(userId, {
        monthly_token_limit: parseInt(form.monthly_token_limit, 10),
        daily_token_limit: form.daily_token_limit ? parseInt(form.daily_token_limit, 10) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setEditing(null)
    },
  })

  const openEdit = (u: UserWithQuota) => {
    setQuotaForm({
      monthly_token_limit: u.quota ? String(u.quota.monthly_token_limit) : '100000',
      daily_token_limit: u.quota?.daily_token_limit ? String(u.quota.daily_token_limit) : '',
    })
    setEditing(u)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Token Quotas"
        description="設定各用戶的 AI Token 使用額度，管理資源分配避免過度消耗。"
        actions={
          <ExportButton
            data={users as unknown as Record<string, unknown>[]}
            fileName="user-quotas"
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'nickname', header: 'Nickname' },
              { key: 'mongo_id', header: 'Mongo ID' },
              { key: 'role_id', header: 'Role' },
              { key: 'current_month_tokens_used', header: '本月使用 Tokens' },
            ]}
          />
        }
      />

      <div className="flex gap-2">
        <Input
          placeholder="搜尋 nickname / mongo_id"
          className="w-72"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOffset(0)
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
              {[
                'ID',
                'Nickname',
                'Mongo ID',
                'Role',
                '本月使用 Tokens',
                'Monthly Limit',
                'Daily Limit',
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
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  載入中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  無資料
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border/80 hover:bg-muted/45 transition-colors transition-colors"
                >
                  <td className="px-4 py-2 font-mono text-xs">{u.id}</td>
                  <td className="px-4 py-2 font-medium">{u.nickname ?? '-'}</td>
                  <td className="px-4 py-2 font-mono text-xs truncate max-w-[120px]">
                    {u.mongo_id ?? '-'}
                  </td>
                  <td className="px-4 py-2">{u.role_id ?? '-'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`font-mono ${u.current_month_tokens_used > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {u.current_month_tokens_used.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {u.quota ? (
                      <span className="font-mono">
                        {u.quota.monthly_token_limit.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">未設定</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {u.quota?.daily_token_limit ? (
                      <span className="font-mono">
                        {u.quota.daily_token_limit.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">不限</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Button type="button" variant="secondary" size="xs" onClick={() => openEdit(u)}>
                      設定 Quota
                    </Button>
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
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className="px-3 disabled:opacity-40"
            >
              上一頁
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={!pagination.has_next}
              onClick={() => setOffset(offset + LIMIT)}
              className="px-3 disabled:opacity-40"
            >
              下一頁
            </Button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-lg w-full max-w-md p-6">
            <h3 className="mb-4 font-semibold">
              設定 Quota — {editing.nickname ?? editing.mongo_id ?? `User #${editing.id}`}
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="monthly-token-limit" className="mb-1 block text-sm font-medium">
                  Monthly Token Limit
                </label>
                <Input
                  id="monthly-token-limit"
                  type="number"
                  min="0"
                  className="font-mono"
                  value={quotaForm.monthly_token_limit}
                  onChange={(e) =>
                    setQuotaForm((f) => ({ ...f, monthly_token_limit: e.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="daily-token-limit" className="mb-1 block text-sm font-medium">
                  Daily Token Limit（留空 = 不限）
                </label>
                <Input
                  id="daily-token-limit"
                  type="number"
                  min="0"
                  placeholder="不設每日上限"
                  className="font-mono"
                  value={quotaForm.daily_token_limit}
                  onChange={(e) =>
                    setQuotaForm((f) => ({ ...f, daily_token_limit: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                取消
              </Button>
              <Button
                type="button"
                disabled={upsertMut.isPending}
                onClick={() => {
                  const monthly = parseInt(quotaForm.monthly_token_limit, 10)
                  const daily = quotaForm.daily_token_limit
                    ? parseInt(quotaForm.daily_token_limit, 10)
                    : null
                  if (Number.isNaN(monthly) || (daily !== null && Number.isNaN(daily))) {
                    alert('請輸入有效的數字')
                    return
                  }
                  upsertMut.mutate({ userId: editing.id, form: quotaForm })
                }}
              >
                {upsertMut.isPending ? '儲存中...' : '儲存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
