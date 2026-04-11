// src/components/layout/AppHeader.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  message: string
  seen: boolean
}

export default function AppHeader({ title }: { title: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', user.id)
        .single()
      if (data) {
        setRole(data.role)
        setName(data.name)
      }
    })

    const channel = supabase
      .channel(`regression-alerts-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mastery_history' },
        (payload) => {
          const row = payload.new as { mastery_level: string; student_id: string }
          if (row.mastery_level === 'Needs Help') {
            setNotifications(prev => [{
              id: crypto.randomUUID(),
              message: `A student dropped to Needs Help`,
              seen: false,
            }, ...prev.slice(0, 9)])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unseen = notifications.filter(n => !n.seen).length

  const markAllSeen = () => {
    setNotifications(prev => prev.map(n => ({ ...n, seen: true })))
    setOpen(false)
  }

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        .app-header {
          height: 56px;
          background: #ffffff;
          border-bottom: 1.5px solid rgba(26,122,64,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.75rem;
          position: sticky;
          top: 0;
          z-index: 20;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .header-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.1rem;
          color: #0d3d20;
          font-weight: 400;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        /* Bell */
        .bell-wrap { position: relative; }
        .bell-btn {
          background: none;
          border: none;
          cursor: pointer;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: #6b7280;
          transition: background 0.15s;
          position: relative;
        }
        .bell-btn:hover { background: #eaf6ef; }
        .bell-btn.has-unseen { color: #f0a500; }
        .bell-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #8b1a1a;
          color: #fff;
          font-size: 0.55rem;
          font-weight: 700;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* Dropdown */
        .notif-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 290px;
          background: #fff;
          border: 1.5px solid rgba(26,122,64,0.13);
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(13,61,32,0.12);
          z-index: 100;
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .notif-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(26,122,64,0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .notif-header-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0d3d20;
          letter-spacing: 0.02em;
        }
        .notif-mark-btn {
          font-size: 0.7rem;
          color: #f0a500;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .notif-mark-btn:hover { text-decoration: underline; }
        .notif-empty {
          padding: 1.25rem 1rem;
          font-size: 0.8rem;
          color: #6b7280;
          text-align: center;
        }
        .notif-item {
          padding: 0.65rem 1rem;
          font-size: 0.8rem;
          line-height: 1.5;
          border-bottom: 1px solid rgba(26,122,64,0.06);
          transition: background 0.1s;
        }
        .notif-item.unseen {
          background: #fffbf0;
          color: #1a1f16;
          font-weight: 500;
        }
        .notif-item.seen { color: #6b7280; }

        /* User pill */
        .user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fdfaf5;
          border: 1.5px solid rgba(26,122,64,0.13);
          border-radius: 20px;
          padding: 3px 12px 3px 4px;
        }
        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0d3d20;
          color: #ffd166;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.68rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .user-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1a1f16;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      <header className="app-header">
        <h1 className="header-title">{title}</h1>

        <div className="header-right">

          {/* Notification bell — teachers only */}
          {role === 'teacher' && (
            <div className="bell-wrap" ref={dropdownRef}>
              <button
                onClick={() => setOpen(o => !o)}
                className={`bell-btn${unseen > 0 ? ' has-unseen' : ''}`}
                aria-label="Notifications"
              >
                🔔
                {unseen > 0 && (
                  <span className="bell-badge">{unseen}</span>
                )}
              </button>

              {open && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span className="notif-header-title">Alerts</span>
                    {unseen > 0 && (
                      <button onClick={markAllSeen} className="notif-mark-btn">
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No alerts yet</div>
                  ) : (
                    notifications.slice(0, 8).map(n => (
                      <div key={n.id} className={`notif-item${n.seen ? ' seen' : ' unseen'}`}>
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* User pill */}
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <span className="user-name">{name}</span>
          </div>

        </div>
      </header>
    </>
  )
}