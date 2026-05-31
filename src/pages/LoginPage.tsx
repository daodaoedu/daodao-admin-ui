import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const ok = await login(token.trim())
      if (!ok) {
        setError('驗證失敗：請確認 token 有效且具有 admin 權限')
      }
    } catch {
      setError('登入發生錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="mb-2 text-center text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Admin Console
        </p>
        <h1 className="mb-8 text-center text-2xl leading-none font-semibold tracking-tight text-foreground text-foreground">
          島島 Admin
        </h1>

        <Button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-md"
          onClick={loginWithGoogle}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          使用 Google 帳號登入
        </Button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">或</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {!showTokenInput ? (
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => setShowTokenInput(true)}
          >
            使用 JWT Token 登入
          </button>
        ) : (
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div>
              <label htmlFor="jwt-token" className="mb-1 block text-sm font-medium text-foreground">
                JWT Token
              </label>
              <Textarea
                id="jwt-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                rows={4}
                placeholder="貼上您的 JWT token..."
                className="font-mono text-sm text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              variant="secondary"
              disabled={loading}
              className="w-full rounded-md"
            >
              {loading ? '驗證中...' : '驗證 Token'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
