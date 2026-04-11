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

type RoleFilter = 'all' | 'admin' | 'teacher' | 'student'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers]         = useState<UserRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

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

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const counts = {
    all:     users.length,
    admin:   users.filter(u => u.role === 'admin').length,
    teacher: users.filter(u => u.role === 'teacher').length,
    student: users.filter(u => u.role === 'student').length,
  }

  if (loading) {
    return (
      <AppLayout title="Users">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading users…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Users">
        <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Users">
      <div style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>User Directory</h1>
            <p style={s.muted}>{users.length} registered accounts across all roles</p>
          </div>
        </div>

        {/* Role filter tabs */}
        <div style={s.filterRow}>
          {(['all', 'student', 'teacher', 'admin'] as RoleFilter[]).map(r => (
            <button
              key={r}
              style={{ ...s.filterTab, ...(roleFilter === r ? s.filterTabActive : {}) }}
              onClick={() => setRoleFilter(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
              <span style={{
                ...s.filterCount,
                background: roleFilter === r ? 'rgba(255,255,255,0.2)' : 'rgba(27,94,48,0.08)',
                color:      roleFilter === r ? '#fff' : '#6b6b6b',
              }}>
                {counts[r]}
              </span>
            </button>
          ))}

          {/* Search */}
          <input
            style={s.search}
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={s.empty}>No users found.</div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Date Joined'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={{ ...s.td, fontWeight: 600 }}>{u.name}</td>
                    <td style={{ ...s.td, color: '#6b6b6b', fontSize: '0.83rem' }}>{u.email}</td>
                    <td style={s.td}>
                      <span style={{
                        ...s.pill,
                        background: u.role === 'admin'   ? '#fdf0f0'
                          : u.role === 'teacher' ? '#fdf8ee' : '#f0f7f2',
                        color: u.role === 'admin'   ? '#8b1a1a'
                          : u.role === 'teacher' ? '#7a5a00' : '#1b5e30',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ ...s.td, color: '#6b6b6b', fontSize: '0.82rem' }}>
                      {new Date(u.created_at).toLocaleDateString('en-PH', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:            { padding: '2rem', maxWidth: '1024px', margin: '0 auto' },
  topRow:          { marginBottom: '1.5rem' },
  heading:         { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:           { color: '#6b6b6b', fontSize: '0.88rem', marginTop: '0.25rem' },
  filterRow:       { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' },
  filterTab:       { display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', color: '#6b6b6b', fontFamily: 'inherit' },
  filterTabActive: { background: '#0d3a1b', color: '#fff', borderColor: '#0d3a1b', fontWeight: 600 },
  filterCount:     { fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '10px' },
  search:          { marginLeft: 'auto', border: '1px solid rgba(27,94,48,0.2)', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', minWidth: '220px', color: '#1a1a1a' },
  tableWrap:       { borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(27,94,48,0.12)' },
  table:           { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:              { textAlign: 'left', padding: '0.65rem 1rem', background: '#0d3a1b', color: '#e8b84b', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  trEven:          { background: '#fff' },
  trOdd:           { background: '#faf6ee' },
  td:              { padding: '0.7rem 1rem', borderBottom: '1px solid rgba(27,94,48,0.07)', color: '#1a1a1a', verticalAlign: 'middle' },
  pill:            { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },
  empty:           { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '2.5rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  center:          { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:         { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}