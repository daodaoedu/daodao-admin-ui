import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ping } from '@/api/admin'
import { TOKEN_KEY } from '@/api/client'

interface AdminInfo {
  adminId: number
  adminNickname: string | null
}

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  adminInfo: AdminInfo | null
  login: (token: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasToken = !!localStorage.getItem(TOKEN_KEY)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(hasToken)
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)

  // 頁面重整後重新取得 admin 資訊（token 仍存在但 adminInfo 為 null）
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    setIsLoading(true)
    ping()
      .then((res) => {
        const d = res.data.data
        setAdminInfo({ adminId: d.admin_id, adminNickname: d.nickname })
        setIsAuthenticated(true)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setIsAuthenticated(false)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = useCallback(async (token: string): Promise<boolean> => {
    localStorage.setItem(TOKEN_KEY, token)
    try {
      const res = await ping()
      const d = res.data.data
      setAdminInfo({ adminId: d.admin_id, adminNickname: d.nickname })
      setIsAuthenticated(true)
      return true
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setIsAuthenticated(false)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setIsAuthenticated(false)
    setAdminInfo(null)
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, adminInfo, login, logout }),
    [isAuthenticated, isLoading, adminInfo, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
