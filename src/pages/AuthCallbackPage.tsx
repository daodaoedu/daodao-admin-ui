import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthMe } from '@/api/admin'
import { TOKEN_KEY } from '@/api/client'
import { peekPostLoginPath } from '@/lib/post-login-redirect'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAuthMe()
      .then((res) => {
        const { user, isTemporary } = res.data.data
        const isAdmin = user.roles.some((r) =>
          ['admin', 'superadmin', 'Admin', 'SuperAdmin'].includes(r),
        )
        if (isTemporary || !isAdmin) {
          setError('此帳號沒有管理員權限')
          localStorage.removeItem(TOKEN_KEY)
          return
        }
        navigate(peekPostLoginPath(), { replace: true })
        window.location.reload()
      })
      .catch(() => {
        setError('驗證失敗，請重新登入')
      })
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="mb-4 text-destructive">{error}</p>
          <a
            href={`${import.meta.env.BASE_URL}login`}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            返回登入頁
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        驗證中...
      </div>
    </div>
  )
}
