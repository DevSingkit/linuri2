// Admin Dashboard
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'
import type { MasteryLevel, Subject } from '@/types/linuri'

interface UserRow {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

interface ClassRow {
  id: string
  section_name: string
  join_code: string
  teacher_id: string
  users: { name: string } | null
}

interface MasteryRow {
  student_id: string
  skill_name: string
  subject: Subject
  mastery_level: MasteryLevel
  difficulty_level: string
  regression_count: number
  updated_at: string
  users: { name: string } | null
}

export default function AdminDashboardPage() {
  const router = useRouter()

  const [users, setUsers]     = useState<UserRow[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [mastery, setMastery] = useState<MasteryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'classes' | 'report'>('overview')

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        // All users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
        if (userError) throw userError
        setUsers((userData as UserRow[]) ?? [])

        // All classes with teacher name
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*, users(name)')
          .order('created_at', { ascending: false })
        if (classError) throw classError
        setClasses((classData as unknown as ClassRow[]) ?? [])

        // School-wide mastery with student name
        const { data: masteryData, error: masteryError } = await supabase
          .from('mastery_history')
          .select('*, users(name)')
          .order('updated_at', { ascending: false })
        if (masteryError) throw masteryError
        setMastery((masteryData as unknown as MasteryRow[]) ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) {
    return (
      <AppLayout title="Admin Dashboard">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading admin dashboard…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Admin Dashboard">
        <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
      </AppLayout>
    )
  }

  // Derived counts
  const teachers  = users.filter(u => u.role === 'teacher')
  const students  = users.filter(u => u.role === 'student')
  const admins    = users.filter(u => u.role === 'admin')
  const mastered  = mastery.filter(m => m.mastery_level === 'Mastered').length
  const developing= mastery.filter(m => m.mastery_level === 'Developing').length
  const needsHelp = mastery.filter(m => m.mastery_level === 'Needs Help').length
  const flagged   = mastery.filter(m => m.regression_count >= 2).length

  return (
    <AppLayout title="Admin Dashboard">
      <div style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>Admin Dashboard</h1>
            <p style={s.muted}>School-wide overview — United Methodist Cooperative, Caloocan</p>
          </div>
          <button style={s.btnPrint} onClick={() => window.print()}>
            🖨 Print Report
          </button>
        </div>

        {/* Stat chips */}
        <div style={s.chips}>
          {[
            { label: 'Students',   value: students.length,  color: '#0d3a1b' },
            { label: 'Teachers',   value: teachers.length,  color: '#0d3a1b' },
            { label: 'Classes',    value: classes.length,   color: '#0d3a1b' },
            { label: 'Mastered',   value: mastered,         color: '#1b5e30' },
            { label: 'Developing', value: developing,       color: '#7a5a00' },
            { label: 'Needs Help', value: needsHelp,        color: '#8b1a1a' },
            { label: 'Flagged',    value: flagged,          color: '#8b1a1a' },
          ].map(c => (
            <div key={c.label} style={s.chip}>
              <span style={{ ...s.chipNum, color: c.color }}>{c.value}</span>
              <span style={s.chipLabel}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {(['overview', 'users', 'classes', 'report'] as const).map(t => (
            <button
              key={t}
              style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}
              onClick={() => setActiveTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>School-wide Mastery Breakdown</h2>

            {mastery.length === 0 ? (
              <div style={s.empty}>No quiz data yet.</div>
            ) : (
              <>
                {/* Bar */}
                <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: '#6b6b6b' }}>
                  Total skill records: {mastery.length}
                </div>
                <div style={s.bigBar}>
                  {mastered > 0 && (
                    <div style={{ ...s.bigBarSeg, width: `${Math.round((mastered / mastery.length) * 100)}%`, background: '#1b5e30' }}>
                      {Math.round((mastered / mastery.length) * 100)}%
                    </div>
                  )}
                  {developing > 0 && (
                    <div style={{ ...s.bigBarSeg, width: `${Math.round((developing / mastery.length) * 100)}%`, background: '#c9941a' }}>
                      {Math.round((developing / mastery.length) * 100)}%
                    </div>
                  )}
                  {needsHelp > 0 && (
                    <div style={{ ...s.bigBarSeg, width: `${Math.round((needsHelp / mastery.length) * 100)}%`, background: '#8b1a1a' }}>
                      {Math.round((needsHelp / mastery.length) * 100)}%
                    </div>
                  )}
                </div>
                <div style={s.barLegend}>
                  <span style={{ color: '#1b5e30' }}>● Mastered ({mastered})</span>
                  <span style={{ color: '#7a5a00' }}>● Developing ({developing})</span>
                  <span style={{ color: '#8b1a1a' }}>● Needs Help ({needsHelp})</span>
                </div>

                {/* Per-subject breakdown */}
                <h3 style={{ ...s.sectionTitle, fontSize: '1rem', marginTop: '1.5rem' }}>By Subject</h3>
                <div style={s.subjectGrid}>
                  {(['English', 'Mathematics', 'Science'] as Subject[]).map(sub => {
                    const rows = mastery.filter(m => m.subject === sub)
                    const m2   = rows.filter(m => m.mastery_level === 'Mastered').length
                    const d2   = rows.filter(m => m.mastery_level === 'Developing').length
                    const n2   = rows.filter(m => m.mastery_level === 'Needs Help').length
                    return (
                      <div key={sub} style={s.subjectCard}>
                        <div style={s.subjectCardName}>{sub}</div>
                        <div style={s.subjectRow}><span style={{ color: '#1b5e30' }}>★ Mastered</span><span>{m2}</span></div>
                        <div style={s.subjectRow}><span style={{ color: '#7a5a00' }}>◆ Developing</span><span>{d2}</span></div>
                        <div style={s.subjectRow}><span style={{ color: '#8b1a1a' }}>▲ Needs Help</span><span>{n2}</span></div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Users tab ── */}
        {activeTab === 'users' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>All Users ({users.length})</h2>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Joined'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={{ ...s.td, fontWeight: 500 }}>{u.name}</td>
                    <td style={{ ...s.td, fontSize: '0.82rem', color: '#6b6b6b' }}>{u.email}</td>
                    <td style={s.td}>
                      <span style={{
                        ...s.rolePill,
                        background: u.role === 'admin' ? '#fdf0f0'
                          : u.role === 'teacher' ? '#fdf8ee' : '#f0f7f2',
                        color: u.role === 'admin' ? '#8b1a1a'
                          : u.role === 'teacher' ? '#7a5a00' : '#1b5e30',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontSize: '0.8rem', color: '#6b6b6b' }}>
                      {new Date(u.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Classes tab ── */}
        {activeTab === 'classes' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>All Classes ({classes.length})</h2>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Section', 'Teacher', 'Join Code'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map((c, i) => (
                  <tr key={c.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={{ ...s.td, fontWeight: 500 }}>{c.section_name}</td>
                    <td style={s.td}>{c.users?.name ?? '—'}</td>
                    <td style={{ ...s.td, fontFamily: 'monospace', letterSpacing: '0.1em', color: '#0d3a1b', fontWeight: 600 }}>
                      {c.join_code}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Report tab ── */}
        {activeTab === 'report' && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>School-wide Mastery Report</h2>
            <p style={{ ...s.muted, marginBottom: '1rem' }}>
              Full list of all mastery records across all students and classes.
              Use the print button above to save as PDF.
            </p>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Student', 'Skill', 'Subject', 'Difficulty', 'Mastery', 'Regressions', 'Updated'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mastery.map((m, i) => (
                  <tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={{ ...s.td, fontWeight: 500 }}>{m.users?.name ?? '—'}</td>
                    <td style={s.td}>{m.skill_name}</td>
                    <td style={s.td}>{m.subject}</td>
                    <td style={s.td}>{m.difficulty_level}</td>
                    <td style={s.td}>
                      <span style={{
                        ...s.rolePill,
                        background: m.mastery_level === 'Mastered' ? '#f0f7f2'
                          : m.mastery_level === 'Developing' ? '#fdf8ee' : '#fdf0f0',
                        color: m.mastery_level === 'Mastered' ? '#1b5e30'
                          : m.mastery_level === 'Developing' ? '#7a5a00' : '#8b1a1a',
                      }}>
                        {m.mastery_level}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center', color: m.regression_count >= 2 ? '#8b1a1a' : '#6b6b6b', fontWeight: m.regression_count >= 2 ? 600 : 400 }}>
                      {m.regression_count}{m.regression_count >= 2 ? ' ⚠' : ''}
                    </td>
                    <td style={{ ...s.td, fontSize: '0.8rem', color: '#6b6b6b' }}>
                      {new Date(m.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
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

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:         { padding: '2rem', maxWidth: '1024px', margin: '0 auto' },
  topRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' },
  heading:      { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:        { color: '#6b6b6b', fontSize: '0.88rem', margin: '0.25rem 0 0' },
  btnPrint:     { background: '#0d3a1b', color: '#e8b84b', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  chips:        { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  chip:         { background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' },
  chipNum:      { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 },
  chipLabel:    { fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b', marginTop: '0.25rem' },
  tabs:         { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  tab:          { background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '6px', padding: '0.45rem 1.1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', color: '#6b6b6b', fontFamily: 'inherit' },
  tabActive:    { background: '#0d3a1b', color: '#e8b84b', borderColor: '#0d3a1b', fontWeight: 600 },
  section:      { marginBottom: '2rem' },
  sectionTitle: { fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', color: '#0d3a1b', marginBottom: '1rem' },
  bigBar:       { height: '28px', borderRadius: '8px', background: '#e5e7eb', display: 'flex', overflow: 'hidden', marginBottom: '0.6rem' },
  bigBarSeg:    { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 600, color: '#fff', minWidth: '30px' },
  barLegend:    { display: 'flex', gap: '1rem', fontSize: '0.78rem', flexWrap: 'wrap', marginBottom: '1rem' },
  subjectGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' },
  subjectCard:  { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  subjectCardName: { fontWeight: 600, fontSize: '0.95rem', color: '#0d3a1b', marginBottom: '0.25rem' },
  subjectRow:   { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:           { textAlign: 'left', padding: '0.6rem 1rem', background: '#0d3a1b', color: '#e8b84b', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  trEven:       { background: '#fff' },
  trOdd:        { background: '#faf6ee' },
  td:           { padding: '0.65rem 1rem', borderBottom: '1px solid rgba(27,94,48,0.08)', color: '#1a1a1a', verticalAlign: 'middle' },
  rolePill:     { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },
  empty:        { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '2rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  center:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:      { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}