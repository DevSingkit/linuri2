// src/app/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'

interface UserRow {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  created_at: string
}

type RoleFilter = 'All' | 'admin' | 'teacher' | 'student'

const ROLE_META: Record<string, { bg: string; color: string; border: string; icon: string; label: string }> = {
  admin:   { bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.18)',  icon: '🛡️', label: 'Admin'   },
  teacher: { bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.18)', icon: '👩‍🏫', label: 'Teacher' },
  student: { bg: '#eaf6ef', color: '#0d5c28', border: 'rgba(26,122,64,0.18)', icon: '🎒', label: 'Student' },
}

export default function AdminUsersPage() {
  const router = useRouter()

  const [users, setUsers]           = useState<UserRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All')
  const [search, setSearch]         = useState('')
  const [sortBy, setSortBy]         = useState<'name' | 'role' | 'created_at'>('created_at')
  const [sortAsc, setSortAsc]       = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
        if (fetchError) throw fetchError
        setUsers((data as UserRow[]) ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(a => !a)
    else { setSortBy(col); setSortAsc(true) }
  }

  const filtered = users
    .filter(u => {
      const matchRole   = roleFilter === 'All' || u.role === roleFilter
      const matchSearch = search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      return matchRole && matchSearch
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name')       cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'role')  cmp = a.role.localeCompare(b.role)
      else                         cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortAsc ? cmp : -cmp
    })

  const admins   = users.filter(u => u.role === 'admin').length
  const teachers = users.filter(u => u.role === 'teacher').length
  const students = users.filter(u => u.role === 'student').length

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <span style={{ marginLeft: '4px', opacity: sortBy === col ? 1 : 0.35, fontSize: '0.7rem' }}>
      {sortBy === col ? (sortAsc ? '▲' : '▼') : '⇅'}
    </span>
  )

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  if (loading) return (
    <AppLayout title="Users">
      <style>{`@keyframes au-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.center}>
        <div style={s.spinner} />
        <p style={s.muted}>Loading users…</p>
      </div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Users">
      <div style={s.center}>
        <div style={s.errorCard}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <p style={{ color: '#8b1a1a', fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      </div>
    </AppLayout>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');

        @keyframes au-spin { to { transform: rotate(360deg); } }
        @keyframes au-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        :root {
          --green:       #1a7a40;
          --green-dark:  #0d3d20;
          --green-mid:   #0d5c28;
          --green-light: #eaf6ef;
          --gold:        #f0a500;
          --gold-lt:     #ffd166;
          --gold-bg:     #fffbf0;
          --cream:       #fdfaf5;
          --white:       #ffffff;
          --text:        #1a1f16;
          --muted:       #6b7280;
          --border:      rgba(26,122,64,0.13);
          --font:        'Plus Jakarta Sans', sans-serif;
          --serif:       'DM Serif Display', serif;
        }

        .au-page {
          padding: 1.25rem;
          max-width: 1100px;
          margin: 0 auto;
          font-family: var(--font);
          animation: au-fade 0.25s ease both;
        }

        /* Search */
        .au-search-wrap { position: relative; flex: 1; min-width: 0; }
        .au-search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); font-size: 1rem; pointer-events: none; }
        .au-search {
          width: 100%;
          box-sizing: border-box;
          border: 2px solid var(--border);
          border-radius: 10px;
          padding: 0.65rem 0.9rem 0.65rem 2.5rem;
          font-size: 1rem;
          font-family: var(--font);
          outline: none;
          color: var(--text);
          background: var(--white);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .au-search:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(26,122,64,0.10); }
        .au-search::placeholder { color: #9ca3af; }

        /* Role filter pills */
        .au-pill-btn {
          border: 2px solid var(--border);
          border-radius: 8px;
          padding: 0.45rem 0.9rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--muted);
          font-family: var(--font);
          background: var(--white);
          transition: all 0.15s;
          white-space: nowrap;
        }
        .au-pill-btn:hover { border-color: var(--green); color: var(--green-dark); background: var(--green-light); }
        .au-pill-active { background: var(--green-dark) !important; color: #fff !important; border-color: var(--green-dark) !important; }

        /* Stat cards */
        .au-stat { transition: box-shadow 0.18s, transform 0.18s; }
        .au-stat:hover { box-shadow: 0 8px 24px rgba(13,61,32,0.10); transform: translateY(-2px); }

        /* Table rows */
        .au-tr { transition: background 0.12s; }
        .au-tr:hover td { background: #f0f9f4 !important; }

        /* Sort button */
        .au-sort-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gold-lt);
          padding: 0;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .au-sort-btn:hover { color: #fff; }

        /* Print button */
        .au-print-btn {
          background: var(--green-dark);
          color: var(--gold-lt);
          border: none;
          border-radius: 10px;
          padding: 0.65rem 1.3rem;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          font-family: var(--font);
          display: flex;
          align-items: center;
          gap: 0.45rem;
          transition: background 0.15s, transform 0.12s;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(13,61,32,0.18);
        }
        .au-print-btn:hover { background: var(--green); transform: translateY(-1px); }

        /* Responsive table wrapper */
        .au-table-wrap {
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid var(--border);
          box-shadow: 0 2px 12px rgba(13,61,32,0.05);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Card view for small screens */
        @media (max-width: 640px) {
          .au-table-desktop { display: none; }
          .au-cards         { display: flex; flex-direction: column; gap: 0.75rem; }
        }
        @media (min-width: 641px) {
          .au-table-desktop { display: table; }
          .au-cards         { display: none; }
        }

        /* User card (mobile) */
        .au-user-card {
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 1rem 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .au-user-card-top { display: flex; align-items: center; gap: 0.85rem; }
        .au-user-card-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .au-user-card-name { font-weight: 700; font-size: 1rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .au-user-card-email { font-size: 0.82rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .au-user-card-meta { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
        .au-user-card-date { font-size: 0.78rem; color: var(--muted); }
      `}</style>

      <AppLayout title="Users">
        <div className="au-page">

          {/* ── Header ── */}
          <div style={s.topRow}>
            <div>
              <div style={s.breadcrumb}>Admin · User Management</div>
              <h1 style={s.heading}>All Users</h1>
              <p style={s.muted}>Manage everyone registered in the system</p>
            </div>
            <button className="au-print-btn" onClick={() => window.print()}>
              <span>🖨️</span> Print List
            </button>
          </div>

          {/* ── Stat cards ── */}
          <div style={s.statGrid}>
            {[
              { label: 'Total Users',  value: users.length, icon: '👥', bg: '#eaf6ef', color: '#0d3d20', border: 'rgba(26,122,64,0.18)' },
              { label: 'Admins',       value: admins,       icon: '🛡️', bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.18)' },
              { label: 'Teachers',     value: teachers,     icon: '👩‍🏫', bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.18)' },
              { label: 'Students',     value: students,     icon: '🎒', bg: '#eaf6ef', color: '#0d5c28', border: 'rgba(26,122,64,0.22)' },
            ].map(c => (
              <div
                key={c.label}
                className="au-stat"
                style={{ ...s.statCard, background: c.bg, border: `1.5px solid ${c.border}` }}
              >
                <span style={s.statIcon}>{c.icon}</span>
                <span style={{ ...s.statNum, color: c.color }}>{c.value}</span>
                <span style={s.statLabel}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div style={s.filterBar}>
            {/* Search */}
            <div className="au-search-wrap">
              <span className="au-search-icon">🔍</span>
              <input
                className="au-search"
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Role pills */}
            <div style={s.pillRow}>
              {(['All', 'admin', 'teacher', 'student'] as RoleFilter[]).map(r => (
                <button
                  key={r}
                  className={`au-pill-btn${roleFilter === r ? ' au-pill-active' : ''}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r === 'All' ? 'All Roles' : ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>

          <p style={{ ...s.muted, marginBottom: '0.85rem', fontSize: '0.88rem' }}>
            Showing <strong style={{ color: '#0d3d20' }}>{filtered.length}</strong> of {users.length} user{users.length !== 1 ? 's' : ''}
          </p>

          {/* ── Empty state ── */}
          {filtered.length === 0 ? (
            <div style={s.empty}>
              <span style={{ fontSize: '2.5rem' }}>👤</span>
              <p style={{ margin: 0, fontWeight: 600, color: '#0d3d20', fontSize: '1rem' }}>No users found</p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.88rem' }}>Try adjusting your search or filter.</p>
            </div>
          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="au-table-wrap au-table-desktop">
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>
                        <button className="au-sort-btn" onClick={() => handleSort('name')}>
                          Name <SortIcon col="name" />
                        </button>
                      </th>
                      <th style={s.th}>Email</th>
                      <th style={s.th}>
                        <button className="au-sort-btn" onClick={() => handleSort('role')}>
                          Role <SortIcon col="role" />
                        </button>
                      </th>
                      <th style={s.th}>
                        <button className="au-sort-btn" onClick={() => handleSort('created_at')}>
                          Date Joined <SortIcon col="created_at" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => {
                      const rm = ROLE_META[u.role]
                      return (
                        <tr key={u.id} className="au-tr" style={i % 2 === 0 ? s.trEven : s.trOdd}>
                          <td style={{ ...s.td, fontWeight: 600 }}>
                            <div style={s.avatarRow}>
                              <div style={{
                                ...s.avatar,
                                background: rm.bg,
                                color: rm.color,
                                border: `1.5px solid ${rm.border}`,
                              }}>
                                {getInitials(u.name)}
                              </div>
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ ...s.td, color: '#6b7280', fontSize: '0.875rem' }}>{u.email}</td>
                          <td style={s.td}>
                            <span style={{
                              ...s.rolePill,
                              background: rm.bg,
                              color: rm.color,
                              border: `1px solid ${rm.border}`,
                            }}>
                              {rm.icon} {rm.label}
                            </span>
                          </td>
                          <td style={{ ...s.td, color: '#6b7280', fontSize: '0.875rem' }}>
                            {new Date(u.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="au-cards">
                {filtered.map(u => {
                  const rm = ROLE_META[u.role]
                  return (
                    <div key={u.id} className="au-user-card">
                      <div className="au-user-card-top">
                        <div style={{
                          ...s.avatar,
                          width: '44px', height: '44px',
                          fontSize: '1rem',
                          background: rm.bg,
                          color: rm.color,
                          border: `1.5px solid ${rm.border}`,
                          flexShrink: 0,
                        }}>
                          {getInitials(u.name)}
                        </div>
                        <div className="au-user-card-info">
                          <span className="au-user-card-name">{u.name}</span>
                          <span className="au-user-card-email">{u.email}</span>
                        </div>
                      </div>
                      <div className="au-user-card-meta">
                        <span style={{
                          ...s.rolePill,
                          background: rm.bg,
                          color: rm.color,
                          border: `1px solid ${rm.border}`,
                        }}>
                          {rm.icon} {rm.label}
                        </span>
                        <span className="au-user-card-date">
                          Joined {new Date(u.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

        </div>
      </AppLayout>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  topRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' },
  breadcrumb:{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a7a40', marginBottom: '0.35rem' },
  heading:   { fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.6rem, 4vw, 2rem)', color: '#0d3d20', margin: '0 0 0.2rem' },
  muted:     { color: '#6b7280', fontSize: '0.9rem', margin: 0 },

  statGrid:  { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.75rem' },
  statCard:  { borderRadius: '16px', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', cursor: 'default' },
  statIcon:  { fontSize: '1.5rem', lineHeight: 1 },
  statNum:   { fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginTop: '0.1rem' },
  statLabel: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', textAlign: 'center' },

  filterBar: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' },
  pillRow:   { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },

  table:     { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '600px' },
  th:        { textAlign: 'left', padding: '0.8rem 1rem', background: '#0d3d20', color: '#ffd166', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 },
  trEven:    { background: '#fff' },
  trOdd:     { background: '#fdfaf5' },
  td:        { padding: '0.85rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)', color: '#1a1f16', verticalAlign: 'middle' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: '0.65rem' },
  avatar:    { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 },
  rolePill:  { fontSize: '0.75rem', fontWeight: 700, padding: '0.28rem 0.7rem', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' },
  idChip:    { fontFamily: 'monospace', fontSize: '0.72rem', color: '#9ca3af', background: '#f5f5f4', padding: '0.2rem 0.5rem', borderRadius: '5px', letterSpacing: '0.04em', cursor: 'default' },

  empty:     { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#6b7280', textAlign: 'center' },
  errorCard: { background: '#fff0f0', border: '1.5px solid rgba(155,28,28,0.18)', borderRadius: '18px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  center:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:   { width: '40px', height: '40px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'au-spin 0.8s linear infinite' },
}