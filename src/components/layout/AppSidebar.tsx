// src/components/layout/AppSidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Role = 'admin' | 'teacher' | 'student'

const NAV: Record<Role, { label: string; href: string; icon: string }[]> = {
  teacher: [
    { label: 'Dashboard',  href: '/teacher',           icon: '▦' },
    { label: 'Lessons',    href: '/teacher/lessons',   icon: '📖' },
    { label: 'Questions',  href: '/teacher/questions', icon: '❓' },
    { label: 'Classes',    href: '/teacher/classes',   icon: '🏫' },
    { label: 'Reports',    href: '/teacher/reports',   icon: '📊' },
    { label: 'Alerts',     href: '/teacher/alerts',    icon: '🔔' },
  ],
  student: [
    { label: 'Dashboard',  href: '/student',           icon: '▦' },
    { label: 'Quiz',       href: '/student/quiz',      icon: '✏️' },
    { label: 'Progress',   href: '/student/progress',  icon: '📈' },
  ],
  admin: [
    { label: 'Dashboard',  href: '/admin',             icon: '▦' },
    { label: 'Users',      href: '/admin/users',       icon: '👥' },
    { label: 'Classes',    href: '/admin/classes',     icon: '🏫' },
    { label: 'Reports',    href: '/admin/reports',     icon: '📊' },
  ],
}

const ROLE_META: Record<Role, { label: string; bg: string; color: string }> = {
  teacher: { label: 'Teacher', bg: 'rgba(240,165,0,0.18)',   color: '#ffd166' },
  student: { label: 'Student', bg: 'rgba(26,122,64,0.3)',    color: '#a8f0c6' },
  admin:   { label: 'Admin',   bg: 'rgba(139,26,26,0.28)',   color: '#f9b4b4' },
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
  const meta = ROLE_META[role]
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .sidebar {
          width: 220px;
          min-height: 100vh;
          background: #0d3d20;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
        }
        /* subtle dot texture */
        .sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 22px 22px;
          pointer-events: none;
        }

        .sb-logo-wrap {
          padding: 1.5rem 1.35rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          gap: 9px;
          position: relative;
        }
        .sb-mark {
          width: 34px;
          height: 34px;
          background: #f0a500;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.88rem;
          font-weight: 800;
          color: #0d3d20;
          flex-shrink: 0;
        }
        .sb-logo-text { line-height: 1; }
        .sb-logo-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.02em;
        }
        .sb-logo-sub {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .sb-user {
          padding: 1rem 1.35rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          gap: 9px;
          position: relative;
        }
        .sb-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: 1.5px solid rgba(255,255,255,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .sb-user-info { min-width: 0; }
        .sb-user-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-role-badge {
          display: inline-block;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 20px;
          margin-top: 2px;
        }

        .sb-nav {
          flex: 1;
          padding: 0.6rem 0;
          position: relative;
        }
        .sb-nav-link {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0.58rem 1.35rem;
          font-size: 0.845rem;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          border-left: 3px solid transparent;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
          position: relative;
        }
        .sb-nav-link:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.04);
        }
        .sb-nav-link.active {
          color: #ffd166;
          font-weight: 700;
          background: rgba(255,255,255,0.07);
          border-left-color: #f0a500;
        }
        .sb-nav-icon {
          font-size: 0.9rem;
          width: 18px;
          text-align: center;
          flex-shrink: 0;
          opacity: 0.8;
        }
        .sb-nav-link.active .sb-nav-icon { opacity: 1; }

        .sb-signout-wrap {
          padding: 1rem 1.35rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          position: relative;
        }
        .sb-signout-btn {
          width: 100%;
          padding: 0.52rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.45);
          font-size: 0.78rem;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          letter-spacing: 0.01em;
        }
        .sb-signout-btn:hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.75);
        }
      `}</style>

      <aside className="sidebar">

        {/* Logo */}
        <div className="sb-logo-wrap">
          <div className="sb-mark">L</div>
          <div className="sb-logo-text">
            <div className="sb-logo-name">LINURI</div>
            <div className="sb-logo-sub">Adaptive Learning</div>
          </div>
        </div>

        {/* User */}
        <div className="sb-user">
          <div className="sb-avatar">{initials}</div>
          <div className="sb-user-info">
            <div className="sb-user-name">{name}</div>
            <span
              className="sb-role-badge"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {links.map(({ label, href, icon }) => {
            const rootPaths = ['/admin', '/teacher', '/student']
            const active = pathname === href || (!rootPaths.includes(href) && pathname.startsWith(href + '/'))
            return (
              <Link
                key={href}
                href={href}
                className={`sb-nav-link${active ? ' active' : ''}`}
              >
                <span className="sb-nav-icon">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="sb-signout-wrap">
          <button onClick={handleSignOut} className="sb-signout-btn">
            Sign out
          </button>
        </div>

      </aside>
    </>
  )
}