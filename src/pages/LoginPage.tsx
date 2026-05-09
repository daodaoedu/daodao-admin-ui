import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const cookieToken = getCookieValue('auth_token')
    if (!cookieToken) return
    setLoading(true)
    login(cookieToken)
      .then((ok) => {
        if (ok) {
          navigate('/')
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [login, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const ok = await login(token.trim())
      if (ok) {
        navigate('/')
      } else {
        setError('驗證失敗：請確認 JWT token 有效且具有 admin 權限')
      }
    } catch {
      setError('登入發生錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-center heading-lg text-foreground">DaoDao Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="jwt-token" className="mb-1 block text-sm font-medium text-foreground">
              JWT Token
            </label>
            <Textarea
              id="jwt-token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={5}
              placeholder="貼上您的 JWT token..."
              className="font-mono text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full rounded-md">
            {loading ? '驗證中...' : '登入'}
          </Button>
        </form>
      </div>
    </div>
  )
}
