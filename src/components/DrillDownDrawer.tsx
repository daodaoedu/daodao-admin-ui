import { format } from 'date-fns'
import { X } from 'lucide-react'
import type { ActiveUserListItem } from '@/api/types'
import { UserLink } from '@/components/UserLink'
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'

interface DrillDownDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  users: ActiveUserListItem[]
  isLoading: boolean
  isError: boolean
}

export function DrillDownDrawer({
  open,
  onOpenChange,
  title,
  description,
  users,
  isLoading,
  isError,
}: DrillDownDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          <SheetClose className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </SheetClose>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6" />
            </div>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              後端尚未提供此 API，請聯繫開發者實作
              <br />
              <code className="mt-1 inline-block text-xs text-muted-foreground/70">
                GET /api/v1/admin/user-stats/active-users/list
              </code>
            </p>
          ) : users.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">沒有符合條件的用戶</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">共 {users.length} 位用戶</p>
              <div className="space-y-1">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <UserLink
                      userId={user.id}
                      name={user.name || '未命名'}
                      photoURL={user.photoURL}
                    />
                    <div className="flex flex-col items-end gap-0.5">
                      {user.email && (
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      )}
                      {user.lastActiveAt && (
                        <span className="text-[10px] text-muted-foreground/70">
                          最後活動：{format(new Date(user.lastActiveAt), 'MM/dd HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
