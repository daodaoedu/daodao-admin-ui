import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileHeader, Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="h-screen overflow-hidden bg-[var(--admin-shell-bg)] lg:grid lg:grid-cols-[19rem_1fr]">
      <Sidebar />
      <div className="flex h-full flex-col overflow-hidden">
        <MobileHeader />
        <Header />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-card)] p-5 shadow-sm backdrop-blur min-h-[calc(100vh-10rem)]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
