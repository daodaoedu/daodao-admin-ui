import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileHeader, Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--admin-shell-bg)] lg:grid lg:grid-cols-[19rem_1fr]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader />
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-card)] p-5 shadow-sm backdrop-blur min-h-[calc(100vh-5rem)]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
