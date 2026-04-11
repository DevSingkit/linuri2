// src/app/admin/reports/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'
import type { MasteryLevel, Subject } from '@/types/linuri'

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

type SubjectFilter = 'All' | Subject
type MasteryFilter = 'All' | MasteryLevel

const MASTERY_STYLE: Record<MasteryLevel, { bg: string; color: string; border: string }> = {
  'Mastered':     { bg: '#eaf6ef', color: '#0d3d20', border: 'rgba(26,122,64,0.18)' },
  'Developing':   { bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.18)' },
  'Needs Help':   { bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.14)' },
}

export default function AdminReportsPage() {
  const router = useRouter()
  const [mastery, setMastery]             = useState<MasteryRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('All')
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('All')
  const [search, setSearch]               = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        const { data, error: fetchError } = await supabase
          .from('mastery_history')
          .select('*, users(name)')
          .order('updated_at', { ascending: false })
        if (fetchError) throw fetchError
        setMastery((data as unknown as MasteryRow[]) ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const filtered = mastery.filter(m => {
    const matchSubject = subjectFilter === 'All' || m.subject === subjectFilter
    const matchMastery = masteryFilter === 'All' || m.mastery_level === masteryFilter
    const matchSearch  = search === '' ||
      (m.users?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      m.skill_name.toLowerCase().includes(search.toLowerCase())
    return matchSubject && matchMastery && matchSearch
  })

  const total      = mastery.length
  const mastered   = mastery.filter(m => m.mastery_level === 'Mastered').length
  const developing = mastery.filter(m => m.mastery_level === 'Developing').length
  const needsHelp  = mastery.filter(m => m.mastery_level === 'Needs Help').length
  const flagged    = mastery.filter(m => m.regression_count >= 2).length

  if (loading) return (
    <AppLayout title="Reports">
      <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Loading report…</p></div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Reports">
      <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
    </AppLayout>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        :root {
          --green: #1a7a40; --green-dark: #0d3d20; --green-light: #eaf6ef;
          --gold: #f0a500; --gold-lt: #ffd166; --gold-bg: #fffbf0;
          --cream: #fdfaf5; --white: #ffffff; --text: #1a1f16;
          --muted: #6b7280; --border: rgba(26,122,64,0.13);
          --font: 'Plus Jakarta Sans', sans-serif;
        }
        .ar-search { border: 1.5px solid var(--border); border-radius: 9px; padding: 0.42rem 0.9rem; font-size: 0.85rem; font-family: var(--font); outline: none; min-width: 220px; color: var(--text); background: var(--white); transition: border-color 0.15s, box-shadow 0.15s; }
        .ar-search:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(26,122,64,0.1); }
        .ar-fbtn { background: var(--white); border: 1.5px solid var(--border); border-radius: 7px; padding: 0.3rem 0.8rem; font-size: 0.82rem; font-weight: 500; cursor: pointer; color: var(--muted); font-family: var(--font); transition: all 0.15s; }
        .ar-fbtn:hover { border-color: var(--green); color: var(--green-dark); }
        .ar-fbtn-active { background: var(--green-dark) !important; color: #fff !important; border-color: var(--green-dark) !important; font-weight: 700 !important; }
        .ar-print-btn { background: var(--green-dark); color: var(--gold-lt); border: none; border-radius: 9px; padding: 0.6rem 1.25rem; font-weight: 700; font-size: 0.85rem; cursor: pointer; font-family: var(--font); transition: background 0.15s; }
        .ar-print-btn:hover { background: var(--green); }
        .ar-tr:hover td { background: #fdfaf5; }
      `}</style>

      <AppLayout title="Reports">
        <div style={s.page}>

          {/* Header */}
          <div style={s.topRow}>
            <div>
              <h1 style={s.heading}>School-wide Report</h1>
              <p style={s.muted}>Mastery records across all students, subjects, and classes</p>
            </div>
            <button className="ar-print-btn" onClick={() => window.print()}>🖨 Print / Save PDF</button>
          </div>

          {/* Summary bar */}
          {total > 0 && (
            <div style={s.summaryCard}>
              <div style={s.summaryBar}>
                {mastered > 0 && (
                  <div style={{ ...s.barSeg, width: `${Math.round((mastered / total) * 100)}%`, background: '#1a7a40' }}>
                    {Math.round((mastered / total) * 100)}%
                  </div>
                )}
                {developing > 0 && (
                  <div style={{ ...s.barSeg, width: `${Math.round((developing / total) * 100)}%`, background: '#f0a500' }}>
                    {Math.round((developing / total) * 100)}%
                  </div>
                )}
                {needsHelp > 0 && (
                  <div style={{ ...s.barSeg, width: `${Math.round((needsHelp / total) * 100)}%`, background: '#8b1a1a' }}>
                    {Math.round((needsHelp / total) * 100)}%
                  </div>
                )}
              </div>
              <div style={s.barLegend}>
                <span style={{ color: '#1a7a40', fontWeight: 600 }}>● Mastered ({mastered})</span>
                <span style={{ color: '#f0a500', fontWeight: 600 }}>● Developing ({developing})</span>
                <span style={{ color: '#8b1a1a', fontWeight: 600 }}>● Needs Help ({needsHelp})</span>
                {flagged > 0 && <span style={{ color: '#8b1a1a', fontWeight: 700 }}>⚠ {flagged} flagged (≥2 regressions)</span>}
              </div>
            </div>
          )}

          {/* Per-subject cards */}
          <div style={s.subjectGrid}>
            {(['English', 'Mathematics', 'Science'] as Subject[]).map(sub => {
              const rows = mastery.filter(m => m.subject === sub)
              const m2 = rows.filter(m => m.mastery_level === 'Mastered').length
              const d2 = rows.filter(m => m.mastery_level === 'Developing').length
              const n2 = rows.filter(m => m.mastery_level === 'Needs Help').length
              return (
                <div key={sub} style={s.subjectCard}>
                  <div style={s.subjectName}>{sub}</div>
                  <div style={s.subjectRow}><span style={{ color: '#1a7a40' }}>Mastered</span><strong>{m2}</strong></div>
                  <div style={s.subjectRow}><span style={{ color: '#7a5500' }}>Developing</span><strong>{d2}</strong></div>
                  <div style={s.subjectRow}><span style={{ color: '#8b1a1a' }}>Needs Help</span><strong>{n2}</strong></div>
                </div>
              )
            })}
          </div>

          {/* Filters */}
          <div style={s.filterRow}>
            <div style={s.filterGroup}>
              <span style={s.filterLabel}>Subject</span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(['All', 'English', 'Mathematics', 'Science'] as SubjectFilter[]).map(f => (
                  <button key={f} className={`ar-fbtn${subjectFilter === f ? ' ar-fbtn-active' : ''}`} onClick={() => setSubjectFilter(f)}>{f}</button>
                ))}
              </div>
            </div>
            <div style={s.filterGroup}>
              <span style={s.filterLabel}>Mastery</span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(['All', 'Mastered', 'Developing', 'Needs Help'] as MasteryFilter[]).map(f => (
                  <button key={f} className={`ar-fbtn${masteryFilter === f ? ' ar-fbtn-active' : ''}`} onClick={() => setMasteryFilter(f)}>{f}</button>
                ))}
              </div>
            </div>
            <input className="ar-search" style={{ marginLeft: 'auto' }} type="text" placeholder="Search student or skill…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <p style={{ ...s.muted, marginBottom: '0.75rem' }}>Showing {filtered.length} of {total} record{total !== 1 ? 's' : ''}</p>

          {filtered.length === 0 ? (
            <div style={s.empty}>No records match your filters.</div>
          ) : (
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
                  {filtered.map((m, i) => {
                    const ms = MASTERY_STYLE[m.mastery_level]
                    return (
                      <tr key={i} className="ar-tr" style={i % 2 === 0 ? s.trEven : s.trOdd}>
                        <td style={{ ...s.td, fontWeight: 600 }}>{m.users?.name ?? '—'}</td>
                        <td style={s.td}>{m.skill_name}</td>
                        <td style={s.td}>{m.subject}</td>
                        <td style={s.td}>{m.difficulty_level}</td>
                        <td style={s.td}>
                          <span style={{ ...s.pill, background: ms.bg, color: ms.color, border: `1px solid ${ms.border}` }}>
                            {m.mastery_level}
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center', color: m.regression_count >= 2 ? '#8b1a1a' : '#6b7280', fontWeight: m.regression_count >= 2 ? 700 : 400 }}>
                          {m.regression_count}{m.regression_count >= 2 ? ' ⚠' : ''}
                        </td>
                        <td style={{ ...s.td, fontSize: '0.8rem', color: '#6b7280' }}>
                          {new Date(m.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </AppLayout>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:        { maxWidth: '1024px', margin: '0 auto' },
  topRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' },
  heading:     { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3d20', margin: 0 },
  muted:       { color: '#6b7280', fontSize: '0.88rem', marginTop: '0.25rem' },
  summaryCard: { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '1.35rem 1.5rem', marginBottom: '1.25rem' },
  summaryBar:  { height: '26px', borderRadius: '8px', background: '#e5e7eb', display: 'flex', overflow: 'hidden', marginBottom: '0.75rem' },
  barSeg:      { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', minWidth: '28px' },
  barLegend:   { display: 'flex', gap: '1.25rem', fontSize: '0.78rem', flexWrap: 'wrap' },
  subjectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  subjectCard: { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  subjectName: { fontWeight: 700, fontSize: '0.95rem', color: '#0d3d20', marginBottom: '0.25rem' },
  subjectRow:  { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' },
  filterRow:   { display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  filterLabel: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b7280' },
  tableWrap:   { borderRadius: '14px', overflow: 'hidden', border: '1.5px solid rgba(26,122,64,0.13)' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:          { textAlign: 'left', padding: '0.7rem 1rem', background: '#0d3d20', color: '#ffd166', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 700 },
  trEven:      { background: '#fff' },
  trOdd:       { background: '#fdfaf5' },
  td:          { padding: '0.72rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.07)', color: '#1a1f16', verticalAlign: 'middle' },
  pill:        { fontSize: '0.72rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: '20px' },
  empty:       { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '2.5rem', color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:     { width: '36px', height: '36px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}