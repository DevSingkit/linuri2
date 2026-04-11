// Admin/Reports
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

export default function AdminReportsPage() {
  const router = useRouter()
  const [mastery, setMastery]           = useState<MasteryRow[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('All')
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('All')
  const [search, setSearch]             = useState('')

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

  // Derived stats from full data (not filtered)
  const total      = mastery.length
  const mastered   = mastery.filter(m => m.mastery_level === 'Mastered').length
  const developing = mastery.filter(m => m.mastery_level === 'Developing').length
  const needsHelp  = mastery.filter(m => m.mastery_level === 'Needs Help').length
  const flagged    = mastery.filter(m => m.regression_count >= 2).length

  if (loading) {
    return (
      <AppLayout title="Reports">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading report…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Reports">
        <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Reports">
      <div style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>School-wide Report</h1>
            <p style={s.muted}>Mastery records across all students, subjects, and classes</p>
          </div>
          <button style={s.btnPrint} onClick={() => window.print()}>🖨 Print / Save PDF</button>
        </div>

        {/* Summary bar */}
        {total > 0 && (
          <div style={s.summaryCard}>
            <div style={s.summaryBar}>
              {mastered > 0 && (
                <div style={{ ...s.barSeg, width: `${Math.round((mastered / total) * 100)}%`, background: '#1b5e30' }}>
                  {Math.round((mastered / total) * 100)}%
                </div>
              )}
              {developing > 0 && (
                <div style={{ ...s.barSeg, width: `${Math.round((developing / total) * 100)}%`, background: '#c9941a' }}>
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
              <span style={{ color: '#1b5e30' }}>● Mastered ({mastered})</span>
              <span style={{ color: '#c9941a' }}>● Developing ({developing})</span>
              <span style={{ color: '#8b1a1a' }}>● Needs Help ({needsHelp})</span>
              {flagged > 0 && <span style={{ color: '#8b1a1a', fontWeight: 600 }}>⚠ {flagged} flagged (≥2 regressions)</span>}
            </div>
          </div>
        )}

        {/* Per-subject mini stats */}
        <div style={s.subjectGrid}>
          {(['English', 'Mathematics', 'Science'] as Subject[]).map(sub => {
            const rows = mastery.filter(m => m.subject === sub)
            const m2 = rows.filter(m => m.mastery_level === 'Mastered').length
            const d2 = rows.filter(m => m.mastery_level === 'Developing').length
            const n2 = rows.filter(m => m.mastery_level === 'Needs Help').length
            return (
              <div key={sub} style={s.subjectCard}>
                <div style={s.subjectName}>{sub}</div>
                <div style={s.subjectRow}><span style={{ color: '#1b5e30' }}>Mastered</span><strong>{m2}</strong></div>
                <div style={s.subjectRow}><span style={{ color: '#7a5a00' }}>Developing</span><strong>{d2}</strong></div>
                <div style={s.subjectRow}><span style={{ color: '#8b1a1a' }}>Needs Help</span><strong>{n2}</strong></div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={s.filterRow}>
          {/* Subject filter */}
          <div style={s.filterGroup}>
            <span style={s.filterLabel}>Subject</span>
            <div style={s.filterBtns}>
              {(['All', 'English', 'Mathematics', 'Science'] as SubjectFilter[]).map(f => (
                <button
                  key={f}
                  style={{ ...s.fBtn, ...(subjectFilter === f ? s.fBtnActive : {}) }}
                  onClick={() => setSubjectFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Mastery filter */}
          <div style={s.filterGroup}>
            <span style={s.filterLabel}>Mastery</span>
            <div style={s.filterBtns}>
              {(['All', 'Mastered', 'Developing', 'Needs Help'] as MasteryFilter[]).map(f => (
                <button
                  key={f}
                  style={{ ...s.fBtn, ...(masteryFilter === f ? s.fBtnActive : {}) }}
                  onClick={() => setMasteryFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <input
            style={{ ...s.search, marginLeft: 'auto' }}
            type="text"
            placeholder="Search student or skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <p style={{ ...s.muted, marginBottom: '0.75rem' }}>
          Showing {filtered.length} of {total} record{total !== 1 ? 's' : ''}
        </p>

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
                {filtered.map((m, i) => (
                  <tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={{ ...s.td, fontWeight: 600 }}>{m.users?.name ?? '—'}</td>
                    <td style={s.td}>{m.skill_name}</td>
                    <td style={s.td}>{m.subject}</td>
                    <td style={s.td}>{m.difficulty_level}</td>
                    <td style={s.td}>
                      <span style={{
                        ...s.pill,
                        background: m.mastery_level === 'Mastered' ? '#f0f7f2'
                          : m.mastery_level === 'Developing' ? '#fdf8ee' : '#fdf0f0',
                        color: m.mastery_level === 'Mastered' ? '#1b5e30'
                          : m.mastery_level === 'Developing' ? '#7a5a00' : '#8b1a1a',
                      }}>
                        {m.mastery_level}
                      </span>
                    </td>
                    <td style={{
                      ...s.td, textAlign: 'center',
                      color:      m.regression_count >= 2 ? '#8b1a1a' : '#6b6b6b',
                      fontWeight: m.regression_count >= 2 ? 700 : 400,
                    }}>
                      {m.regression_count}{m.regression_count >= 2 ? ' ⚠' : ''}
                    </td>
                    <td style={{ ...s.td, fontSize: '0.8rem', color: '#6b6b6b' }}>
                      {new Date(m.updated_at).toLocaleDateString('en-PH', {
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
  page:          { padding: '2rem', maxWidth: '1024px', margin: '0 auto' },
  topRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' },
  heading:       { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:         { color: '#6b6b6b', fontSize: '0.88rem', marginTop: '0.25rem' },
  btnPrint:      { background: '#0d3a1b', color: '#e8b84b', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  summaryCard:   { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' },
  summaryBar:    { height: '24px', borderRadius: '6px', background: '#e5e7eb', display: 'flex', overflow: 'hidden', marginBottom: '0.6rem' },
  barSeg:        { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', minWidth: '28px' },
  barLegend:     { display: 'flex', gap: '1.25rem', fontSize: '0.78rem', flexWrap: 'wrap' },
  subjectGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  subjectCard:   { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  subjectName:   { fontWeight: 600, fontSize: '0.95rem', color: '#0d3a1b', marginBottom: '0.25rem' },
  subjectRow:    { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' },
  filterRow:     { display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' },
  filterGroup:   { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  filterLabel:   { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' },
  filterBtns:    { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  fBtn:          { background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '5px', padding: '0.3rem 0.75rem', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', color: '#6b6b6b', fontFamily: 'inherit' },
  fBtnActive:    { background: '#0d3a1b', color: '#fff', borderColor: '#0d3a1b', fontWeight: 600 },
  search:        { border: '1px solid rgba(27,94,48,0.2)', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', minWidth: '220px', color: '#1a1a1a' },
  tableWrap:     { borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(27,94,48,0.12)' },
  table:         { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:            { textAlign: 'left', padding: '0.65rem 1rem', background: '#0d3a1b', color: '#e8b84b', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  trEven:        { background: '#fff' },
  trOdd:         { background: '#faf6ee' },
  td:            { padding: '0.7rem 1rem', borderBottom: '1px solid rgba(27,94,48,0.07)', color: '#1a1a1a', verticalAlign: 'middle' },
  pill:          { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },
  empty:         { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '2.5rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  center:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:       { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}