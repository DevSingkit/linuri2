// src/components/layout/AppHeader.tsx
'use client'

import { useEffect, useState } from 'react'
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

    // Subscribe to real-time regression alerts on mastery_history
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

  const unseen = notifications.filter(n => !n.seen).length

  const markAllSeen = () => {
    setNotifications(prev => prev.map(n => ({ ...n, seen: true })))
    setOpen(false)
  }

  return (
    <header style={{
      height: '56px',
      background: '#ffffff',
      borderBottom: '1px solid rgba(27,94,48,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Page title */}
      <h1 style={{
        fontFamily: 'Georgia, serif',
        fontSize: '1.1rem',
        color: '#0d3a1b',
        fontWeight: 400,
        margin: 0,
      }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notification bell — teachers only */}
        {role === 'teacher' && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '4px',
                fontSize: '1.1rem',
                color: unseen > 0 ? '#c9941a' : '#6b6b6b',
                position: 'relative',
              }}
              aria-label="Notifications"
            >
              🔔
              {unseen > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: '#8b1a1a',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {unseen}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {open && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                width: '280px',
                background: '#fff',
                border: '1px solid rgba(27,94,48,0.15)',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                zIndex: 100,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid rgba(27,94,48,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0d3a1b' }}>
                    Alerts
                  </span>
                  {unseen > 0 && (
                    <button onClick={markAllSeen} style={{
                      fontSize: '0.7rem',
                      color: '#c9941a',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}>
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem', fontSize: '0.8rem', color: '#6b6b6b', textAlign: 'center' }}>
                    No alerts yet
                  </div>
                ) : (
                  notifications.slice(0, 8).map(n => (
                    <div key={n.id} style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.8rem',
                      color: n.seen ? '#6b6b6b' : '#1a1a1a',
                      borderBottom: '1px solid rgba(27,94,48,0.06)',
                      background: n.seen ? 'transparent' : '#fdf8ee',
                    }}>
                      {n.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* User pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.82rem',
          color: '#1a1a1a',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#1b5e30',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: '#6b6b6b' }}>{name}</span>
        </div>
      </div>
    </header>
  )
}