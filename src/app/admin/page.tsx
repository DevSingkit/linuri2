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

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
        if (userError) throw userError
        setUsers((userData as UserRow[]) ?? [])

        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*, users(name)')
          .order('created_at', { ascending: false })
        if (classError) throw classError
        setClasses((classData as unknown as ClassRow[]) ?? [])

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
        <style>{`@keyframes adm-spin { to { transform: rotate(360deg); } }`}</style>
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
        <div style={s.center}>
          <div style={s.errorCard}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <p style={{ color: '#8b1a1a', fontWeight: 600, margin: 0 }}>{error}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const teachers   = users.filter(u => u.role === 'teacher')
  const students   = users.filter(u => u.role === 'student')
  const admins     = users.filter(u => u.role === 'admin')
  const mastered   = mastery.filter(m => m.mastery_level === 'Mastered').length
  const developing = mastery.filter(m => m.mastery_level === 'Developing').length
  const needsHelp  = mastery.filter(m => m.mastery_level === 'Needs Help').length
  const flagged    = mastery.filter(m => m.regression_count >= 2).length

  const statCards = [
    { label: 'Students',   value: students.length,  icon: '🎒', accent: '#eaf6ef', text: '#0d3d20', border: 'rgba(26,122,64,0.18)' },
    { label: 'Teachers',   value: teachers.length,  icon: '👩‍🏫', accent: '#eaf6ef', text: '#0d3d20', border: 'rgba(26,122,64,0.18)' },
    { label: 'Classes',    value: classes.length,   icon: '🏫', accent: '#eaf6ef', text: '#0d3d20', border: 'rgba(26,122,64,0.18)' },
    { label: 'Mastered',   value: mastered,         icon: '⭐', accent: '#eaf6ef', text: '#0d5c28', border: 'rgba(26,122,64,0.22)' },
    { label: 'Developing', value: developing,       icon: '📈', accent: '#fffbf0', text: '#7a5500', border: 'rgba(200,130,0,0.2)' },
    { label: 'Needs Help', value: needsHelp,        icon: '🆘', accent: '#fff0f0', text: '#8b1a1a', border: 'rgba(155,28,28,0.18)' },
    { label: 'Flagged',    value: flagged,          icon: '⚠️', accent: '#fff0f0', text: '#8b1a1a', border: 'rgba(155,28,28,0.18)' },
  ]

  const tabs = ['overview', 'users', 'classes', 'report'] as const
  const tabIcons: Record<string, string> = { overview: '📊', users: '👥', classes: '🏫', report: '📄' }

  return (
    <AppLayout title="Admin Dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        @keyframes adm-spin { to { transform: rotate(360deg); } }
        @keyframes adm-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .adm-stat-card { transition: box-shadow 0.18s, transform 0.18s; }
        .adm-stat-card:hover { box-shadow: 0 8px 24px rgba(13,61,32,0.10); transform: translateY(-2px); }

        .adm-tab-btn { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .adm-tab-btn:hover:not(.adm-tab-active) { background: #eaf6ef; color: #0d3d20; }

        .adm-subject-card { transition: box-shadow 0.18s, transform 0.18s; }
        .adm-subject-card:hover { box-shadow: 0 6px 20px rgba(13,61,32,0.10); transform: translateY(-2px); }

        .adm-tr:hover td { background: #f0f9f4 !important; }

        .adm-print-btn { transition: background 0.15s, transform 0.15s; }
        .adm-print-btn:hover { background: #1a7a40; transform: translateY(-1px); }

        .adm-content { animation: adm-fade 0.25s ease both; }
      `}</style>

      <div style={s.page}>

        {/* ── Header ── */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>Admin · School Overview</div>
            <h1 style={s.heading}>Admin Dashboard</h1>
            <p style={s.muted}>United Methodist Cooperative Learning System, Inc. — Caloocan City</p>
          </div>
          <button
            className="adm-print-btn"
            style={s.btnPrint}
            onClick={() => window.print()}
          >
            <span>🖨️</span> Print Report
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div style={s.statGrid}>
          {statCards.map(c => (
            <div
              key={c.label}
              className="adm-stat-card"
              style={{
                ...s.statCard,
                background: c.accent,
                border: `1.5px solid ${c.border}`,
              }}
            >
              <span style={s.statIcon}>{c.icon}</span>
              <span style={{ ...s.statNum, color: c.text }}>{c.value}</span>
              <span style={s.statLabel}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={s.tabRow}>
          {tabs.map(t => (
            <button
              key={t}
              className={`adm-tab-btn${activeTab === t ? ' adm-tab-active' : ''}`}
              style={{ ...s.tabBtn, ...(activeTab === t ? s.tabActive : {}) }}
              onClick={() => setActiveTab(t)}
            >
              <span>{tabIcons[t]}</span>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div className="adm-content" style={s.section}>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>School-wide Mastery Breakdown</h2>
              {mastery.length > 0 && (
                <span style={s.countBadge}>{mastery.length} skill records</span>
              )}
            </div>

            {mastery.length === 0 ? (
              <div style={s.empty}>
                <span style={{ fontSize: '2.5rem' }}>📭</span>
                <p style={{ margin: 0, fontWeight: 600, color: '#0d3d20' }}>No quiz data yet.</p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>Student mastery records will appear here once quizzes are taken.</p>
              </div>
            ) : (
              <>
                {/* Stacked bar */}
                <div style={s.barWrap}>
                  <div style={s.bigBar}>
                    {mastered > 0 && (
                      <div style={{ ...s.bigBarSeg, width: `${Math.round((mastered / mastery.length) * 100)}%`, background: 'linear-gradient(90deg, #1a7a40, #0d5c28)' }}>
                        {Math.round((mastered / mastery.length) * 100)}%
                      </div>
                    )}
                    {developing > 0 && (
                      <div style={{ ...s.bigBarSeg, width: `${Math.round((developing / mastery.length) * 100)}%`, background: 'linear-gradient(90deg, #d4a017, #b07800)' }}>
                        {Math.round((developing / mastery.length) * 100)}%
                      </div>
                    )}
                    {needsHelp > 0 && (
                      <div style={{ ...s.bigBarSeg, width: `${Math.round((needsHelp / mastery.length) * 100)}%`, background: 'linear-gradient(90deg, #c0392b, #8b1a1a)' }}>
                        {Math.round((needsHelp / mastery.length) * 100)}%
                      </div>
                    )}
                  </div>
                  <div style={s.barLegend}>
                    <span style={s.legendDot}><span style={{ ...s.dot, background: '#1a7a40' }} />Mastered ({mastered})</span>
                    <span style={s.legendDot}><span style={{ ...s.dot, background: '#d4a017' }} />Developing ({developing})</span>
                    <span style={s.legendDot}><span style={{ ...s.dot, background: '#c0392b' }} />Needs Help ({needsHelp})</span>
                  </div>
                </div>

                {/* Per-subject */}
                <h3 style={{ ...s.sectionTitle, fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem' }}>By Subject</h3>
                <div style={s.subjectGrid}>
                  {(['English', 'Mathematics', 'Science'] as Subject[]).map(sub => {
                    const rows = mastery.filter(m => m.subject === sub)
                    const m2   = rows.filter(m => m.mastery_level === 'Mastered').length
                    const d2   = rows.filter(m => m.mastery_level === 'Developing').length
                    const n2   = rows.filter(m => m.mastery_level === 'Needs Help').length
                    const subIcon: Record<string, string> = { English: '📖', Mathematics: '🔢', Science: '🔬' }
                    const total = rows.length || 1
                    return (
                      <div key={sub} className="adm-subject-card" style={s.subjectCard}>
                        <div style={s.subjectCardHead}>
                          <span style={s.subjectIcon}>{subIcon[sub]}</span>
                          <span style={s.subjectCardName}>{sub}</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '99px', background: '#e5e7eb', overflow: 'hidden', margin: '0.5rem 0 0.75rem' }}>
                          <div style={{ height: '100%', width: `${Math.round((m2 / total) * 100)}%`, background: '#1a7a40', borderRadius: '99px' }} />
                        </div>
                        <div style={s.subjectRow}>
                          <span style={s.masteredLabel}>⭐ Mastered</span>
                          <span style={{ fontWeight: 700, color: '#0d3d20' }}>{m2}</span>
                        </div>
                        <div style={s.subjectRow}>
                          <span style={s.developingLabel}>📈 Developing</span>
                          <span style={{ fontWeight: 700, color: '#7a5500' }}>{d2}</span>
                        </div>
                        <div style={s.subjectRow}>
                          <span style={s.needsHelpLabel}>🆘 Needs Help</span>
                          <span style={{ fontWeight: 700, color: '#8b1a1a' }}>{n2}</span>
                        </div>
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
          <div className="adm-content" style={s.section}>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>All Users</h2>
              <span style={s.countBadge}>{users.length} total</span>
            </div>
            <div style={s.tableWrap}>
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
                    <tr key={u.id} className="adm-tr" style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td style={{ ...s.td, fontWeight: 600 }}>
                        <div style={s.avatarRow}>
                          <div style={{
                            ...s.avatarDot,
                            background: u.role === 'admin' ? '#fdf0f0'
                              : u.role === 'teacher' ? '#fffbf0' : '#eaf6ef',
                            color: u.role === 'admin' ? '#8b1a1a'
                              : u.role === 'teacher' ? '#7a5500' : '#0d5c28',
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td style={{ ...s.td, color: '#6b7280', fontSize: '0.82rem' }}>{u.email}</td>
                      <td style={s.td}>
                        <span style={{
                          ...s.rolePill,
                          background: u.role === 'admin' ? '#fdf0f0'
                            : u.role === 'teacher' ? '#fffbf0' : '#eaf6ef',
                          color: u.role === 'admin' ? '#8b1a1a'
                            : u.role === 'teacher' ? '#7a5500' : '#0d5c28',
                          border: `1px solid ${u.role === 'admin' ? 'rgba(155,28,28,0.18)'
                            : u.role === 'teacher' ? 'rgba(200,130,0,0.18)' : 'rgba(26,122,64,0.18)'}`,
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontSize: '0.8rem', color: '#6b7280' }}>
                        {new Date(u.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Classes tab ── */}
        {activeTab === 'classes' && (
          <div className="adm-content" style={s.section}>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>All Classes</h2>
              <span style={s.countBadge}>{classes.length} total</span>
            </div>
            <div style={s.tableWrap}>
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
                    <tr key={c.id} className="adm-tr" style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td style={{ ...s.td, fontWeight: 600 }}>
                        <div style={s.avatarRow}>
                          <div style={{ ...s.avatarDot, background: '#eaf6ef', color: '#0d5c28' }}>🏫</div>
                          {c.section_name}
                        </div>
                      </td>
                      <td style={s.td}>{c.users?.name ?? '—'}</td>
                      <td style={s.td}>
                        <span style={s.joinCode}>{c.join_code}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Report tab ── */}
        {activeTab === 'report' && (
          <div className="adm-content" style={s.section}>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>School-wide Mastery Report</h2>
              <span style={s.countBadge}>{mastery.length} records</span>
            </div>
            <p style={{ ...s.muted, marginBottom: '1.25rem' }}>
              Full list of all mastery records across all students and classes. Use the <strong>Print Report</strong> button above to save as PDF.
            </p>
            <div style={s.tableWrap}>
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
                    <tr key={i} className="adm-tr" style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{m.users?.name ?? '—'}</td>
                      <td style={s.td}>{m.skill_name}</td>
                      <td style={s.td}>{m.subject}</td>
                      <td style={s.td}>{m.difficulty_level}</td>
                      <td style={s.td}>
                        <span style={{
                          ...s.rolePill,
                          background: m.mastery_level === 'Mastered' ? '#eaf6ef'
                            : m.mastery_level === 'Developing' ? '#fffbf0' : '#fff0f0',
                          color: m.mastery_level === 'Mastered' ? '#0d5c28'
                            : m.mastery_level === 'Developing' ? '#7a5500' : '#8b1a1a',
                          border: `1px solid ${m.mastery_level === 'Mastered' ? 'rgba(26,122,64,0.18)'
                            : m.mastery_level === 'Developing' ? 'rgba(200,130,0,0.18)' : 'rgba(155,28,28,0.14)'}`,
                        }}>
                          {m.mastery_level}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <span style={{
                          fontWeight: m.regression_count >= 2 ? 700 : 400,
                          color: m.regression_count >= 2 ? '#8b1a1a' : '#6b7280',
                          background: m.regression_count >= 2 ? '#fff0f0' : 'transparent',
                          padding: m.regression_count >= 2 ? '2px 8px' : '0',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                        }}>
                          {m.regression_count}{m.regression_count >= 2 ? ' ⚠️' : ''}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontSize: '0.8rem', color: '#6b7280' }}>
                        {new Date(m.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:            { padding: '2rem', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  topRow:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
  breadcrumb:      { fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a7a40', marginBottom: '0.35rem' },
  heading:         { fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: '#0d3d20', margin: '0 0 0.25rem' },
  muted:           { color: '#6b7280', fontSize: '0.875rem', margin: 0 },
  btnPrint:        { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0d3d20', color: '#ffd166', border: 'none', borderRadius: '9px', padding: '0.65rem 1.35rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(13,61,32,0.18)' },

  statGrid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '2rem' },
  statCard:        { borderRadius: '16px', padding: '1.1rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'default' },
  statIcon:        { fontSize: '1.4rem', lineHeight: 1 },
  statNum:         { fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginTop: '0.15rem' },
  statLabel:       { fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginTop: '0.15rem', textAlign: 'center' as const },

  tabRow:          { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, marginBottom: '1.75rem' },
  tabBtn:          { display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1.5px solid rgba(26,122,64,0.15)', borderRadius: '9px', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit' },
  tabActive:       { background: '#0d3d20', color: '#ffd166', borderColor: '#0d3d20' },

  section:         { marginBottom: '2rem' },
  sectionHeader:   { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' },
  sectionTitle:    { fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: '#0d3d20', margin: 0 },
  countBadge:      { background: '#eaf6ef', color: '#0d5c28', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.03em' },

  barWrap:         { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '1.5rem', marginBottom: '0.5rem' },
  bigBar:          { height: '32px', borderRadius: '10px', background: '#e5e7eb', display: 'flex', overflow: 'hidden', marginBottom: '0.75rem' },
  bigBarSeg:       { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', minWidth: '32px', transition: 'width 0.5s ease' },
  barLegend:       { display: 'flex', gap: '1.25rem', fontSize: '0.8rem', flexWrap: 'wrap' as const, color: '#1a1f16', fontWeight: 500 },
  legendDot:       { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  dot:             { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },

  subjectGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  subjectCard:     { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', cursor: 'default' },
  subjectCardHead: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' },
  subjectIcon:     { fontSize: '1.2rem' },
  subjectCardName: { fontWeight: 700, fontSize: '0.95rem', color: '#0d3d20' },
  subjectRow:      { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', alignItems: 'center' },
  masteredLabel:   { color: '#0d5c28', fontWeight: 500 },
  developingLabel: { color: '#7a5500', fontWeight: 500 },
  needsHelpLabel:  { color: '#8b1a1a', fontWeight: 500 },

  tableWrap:       { borderRadius: '16px', overflow: 'hidden', border: '1.5px solid rgba(26,122,64,0.13)', boxShadow: '0 2px 12px rgba(13,61,32,0.05)' },
  table:           { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.875rem' },
  th:              { textAlign: 'left' as const, padding: '0.75rem 1rem', background: '#0d3d20', color: '#ffd166', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 700 },
  trEven:          { background: '#fff' },
  trOdd:           { background: '#fdfaf5' },
  td:              { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)', color: '#1a1f16', verticalAlign: 'middle' as const },
  avatarRow:       { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  avatarDot:       { width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 },
  rolePill:        { fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '6px', display: 'inline-block' },
  joinCode:        { fontFamily: 'monospace', letterSpacing: '0.12em', color: '#0d3d20', fontWeight: 700, background: '#eaf6ef', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.88rem' },

  empty:           { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' as const },
  center:          { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  errorCard:       { background: '#fff0f0', border: '1.5px solid rgba(155,28,28,0.18)', borderRadius: '18px', padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  spinner:         { width: '40px', height: '40px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'adm-spin 0.8s linear infinite' },
}