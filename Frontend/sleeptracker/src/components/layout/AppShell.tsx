import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Beaker,
  FileText,
  LayoutDashboard,
  Menu,
  MoonStar,
  NotebookPen,
  Settings,
} from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAppHotkeys } from '@/hooks/useAppHotkeys'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'

export type AppNavItem = {
  label: string
  path: string
  icon: LucideIcon
  end?: boolean
}

export const APP_NAV: AppNavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
  { label: 'Log Entry', path: '/log', icon: NotebookPen },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Experiments', path: '/experiments', icon: Beaker },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Settings', path: '/settings', icon: Settings },
]

function SidebarNav({ onNavigateComplete }: { onNavigateComplete?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="Main">
      {APP_NAV.map(({ label, path, icon: Icon, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          onClick={() => onNavigateComplete?.()}
          className={({ isActive }) =>
            cn(
              'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
              isActive
                ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
            )
          }
        >
          <Icon className="size-4 shrink-0 opacity-80" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2 px-3 py-4">
      <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <MoonStar className="size-3.5" />
      </div>
      <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
        SleepTracker
      </span>
    </Link>
  )
}

/**
 * Linear-style app shell: persistent left sidebar on md+, Sheet drawer below 768px.
 * Route content renders via <Outlet />.
 */
export function AppShell() {
  const location = useLocation()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)

  useAppHotkeys()

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => {
      if (mq.matches) setSidebarOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setSidebarOpen])

  const heading =
    APP_NAV.find((item) =>
      item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
    )?.label ?? 'SleepTracker'

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside
        className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
        data-testid="desktop-sidebar"
      >
        <BrandMark />
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-sm md:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Open navigation"
              data-testid="mobile-nav-trigger"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            <SheetContent
              side="left"
              className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
              showCloseButton
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <BrandMark />
              <SidebarNav onNavigateComplete={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium">{heading}</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
