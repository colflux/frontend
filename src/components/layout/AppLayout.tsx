import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { AppSidebar } from './AppSidebar'
import { ChatWidget } from '@/components/chat/ChatWidget'

const SIDEBAR_ROUTES = ['/mapas', '/dashboard', '/reportar']
const NO_FOOTER_ROUTES = ['/mapas']

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const showSidebar = SIDEBAR_ROUTES.includes(pathname)
  const showFooter = !NO_FOOTER_ROUTES.includes(pathname)

  return (
    <div className="min-h-screen bg-surface text-fg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {showSidebar && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 flex flex-col">{children}</main>
          {showFooter && <Footer />}
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
