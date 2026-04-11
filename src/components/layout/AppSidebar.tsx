// src/components/layout/AppSidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Role = 'admin' | 'teacher' | 'student'

const NAV: Record<Role, { label: string; href: string }[]> = {
  teacher: [
    { label: 'Dashboard',  href: '/teacher' },
    { label: 'Lessons',    href: '/teacher/lessons' },
    { label: 'Questions',  href: '/teacher/questions' },
    { label: 'Classes',    href: '/teacher/classes' },
    { label: 'Reports',    href: '/teacher/reports' },
    { label: 'Alerts',     href: '/teacher/alerts' },
  ],
  student: [
    { label: 'Dashboard',  href: '/student' },
    { label: 'Quiz',       href: '/student/quiz' },
    { label: 'Progress',   href: '/student/progress' },
  ],
  admin: [
    { label: 'Dashboard',  href: '/admin' },
    { label: 'Users',      href: '/admin/users' },
    { label: 'Classes',    href: '/admin/classes' },
    { label: 'Reports',    href: '/admin/reports' },
  ],
}

const ROLE_COLOR: Record<Role, string> = {
  teacher: '#c9941a',
  student: '#1b5e30',
  admin:   '#8b1a1a',
}

export default function AppSidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState<Role | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
      .from('users')
     .select('role, name')
      .eq('id', user.id)
     .single()
      if (data) {
     setRole(data.role as Role)
      setName(data.name)
    }
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!role) return null

  const links = NAV[role]

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: '#0d3a1b',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.75rem 1.5rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: '1.6rem',
          color: '#ffffff',
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}>
          LINURI
        </div>
        <div style={{
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.4)',
          marginTop: '0.3rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Adaptive Learning
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '1rem 1.5rem 0.5rem' }}>
        <span style={{
          display: 'inline-block',
          background: ROLE_COLOR[role],
          color: '#fff',
          fontSize: '0.6rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0.2rem 0.6rem',
          borderRadius: '2px',
        }}>
          {role}
        </span>
        <div style={{
          marginTop: '0.4rem',
          fontSize: '0.82rem',
          color: 'rgba(255,255,255,0.75)',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {name}
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0.75rem 0' }}>
        {links.map(({ label, href }) => {
          const rootPaths = ['/admin', '/teacher', '/student']
          const active = pathname === href || (!rootPaths.includes(href) && pathname.startsWith(href + '/'))
          return (
            <Link key={href} href={href} style={{
              display: 'block',
              padding: '0.6rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: active ? 600 : 400,
              color: active ? '#e8b84b' : 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderLeft: active ? '3px solid #c9941a' : '3px solid transparent',
              transition: 'all 0.15s',
            }}>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button onClick={handleSignOut} style={{
          width: '100%',
          padding: '0.5rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '4px',
          color: 'rgba(255,255,255,0.55)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}>
          Sign out
        </button>
      </div>
    </aside>
  )
}