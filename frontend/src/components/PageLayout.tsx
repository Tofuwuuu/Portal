import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function routeMeta(pathname: string, userName?: string) {
  if (pathname === '/') {
    return {
      title: `${greeting()}, ${userName || 'there'}`,
      subtitle: "Here's what needs your attention today.",
    }
  }
  if (pathname.startsWith('/activities')) {
    return {
      title: 'Activities',
      subtitle: 'School events, fairs, and announcements.',
    }
  }
  if (pathname.startsWith('/assignments')) {
    return {
      title: 'Assignments',
      subtitle: 'Homework, projects, submissions, and due dates.',
    }
  }
  if (pathname.startsWith('/meetings')) {
    return {
      title: 'Meetings',
      subtitle: 'Online class meetings and schedules.',
    }
  }
  return { title: 'School Portal', subtitle: 'Learning dashboard' }
}

export default function PageLayout({ children, title, subtitle }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()
  const meta = routeMeta(location.pathname, user?.full_name)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 lg:pl-72">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col">
        <TopHeader
          title={title || meta.title}
          subtitle={subtitle ?? meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
