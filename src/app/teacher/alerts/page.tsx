// /teacher/alerts/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase, getClassesByTeacher, getFlaggedStudents } from '@/lib/supabase'
import type { MasteryLevel } from '@/types/linuri'

interface AlertRow {
  student_id: string
  skill_name: string
  subject: string
  mastery_level: MasteryLevel
  difficulty_level: string
  regression_count: number
  updated_at: string
  users: { name: string } | null
}

type SeverityFilter = 'All' | 'Critical' | 'Warning'

export default function TeacherAlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts]             = useState<AlertRow[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('All')
  const [search, setSearch]             = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        const { data: classData, error: classError } = await getClassesByTeacher(user.id)
        if (classError) throw classError
        const classList = classData ?? []

        if (classList.length === 0) { setLoading(false); return }

        const classIds = classList.map((c: { id: string }) => c.id)
        const { data, error: alertError } = await getFlaggedStudents(classIds)
        if (alertError) throw alertError
        setAlerts((data as unknown as AlertRow[]) ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // Critical = regression ≥ 3, Warning = regression === 2
  const filtered = alerts.filter(a => {
    const matchSeverity =
      severityFilter === 'All' ? true
      : severityFilter === 'Critical' ? a.regression_count >= 3
      : a.regression_count === 2
    const matchSearch =
      search === '' ||
      (a.users?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      a.skill_name.toLowerCase().includes(search.toLowerCase())
    return matchSeverity && matchSearch
  })

  const criticalCount = alerts.filter(a => a.regression_count >= 3).length
  const warningCount  = alerts.filter(a => a.regression_count === 2).length

  if (loading) return (
    <AppLayout title="Alerts">
      <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Loading alerts…</p></div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Alerts">
      <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
    </AppLayout>
  )

  return (
    <AppLayout title="Alerts">
      <div style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>Alerts</h1>
            <p style={s.muted}>Students flagged for repeated regression (≥2 times)</p>
          </div>
        </div>

        {/* Summary chips */}
        <div style={s.chips}>
          <div style={{ ...s.chip, borderColor: '#8b1a1a' }}>
            <span style={{ ...s.chipNum, color: '#8b1a1a' }}>{criticalCount}</span>
            <span style={s.chipLabel}>Critical (≥3)</span>
          </div>
          <div style={{ ...s.chip, borderColor: '#c9941a' }}>
            <span style={{ ...s.chipNum, color: '#7a5a00' }}>{warningCount}</span>
            <span style={s.chipLabel}>Warning (2)</span>
          </div>
          <div style={s.chip}>
            <span style={s.chipNum}>{alerts.length}</span>
            <span style={s.chipLabel}>Total Flagged</span>
          </div>
        </div>

        {/* If no alerts at all — success state */}
        {alerts.length === 0 ? (
          <div style={s.successBox}>
            <div style={s.successIcon}>🎉</div>
            <div style={s.successTitle}>No alerts right now!</div>
            <p style={s.successDesc}>None of your students have regressed twice or more on any skill. Keep it up!</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div style={s.filterRow}>
              {(['All', 'Critical', 'Warning'] as SeverityFilter[]).map(f => (
                <button
                  key={f}
                  style={{
                    ...s.fBtn,
                    ...(severityFilter === f ? (f === 'Critical' ? s.fBtnCritical : f === 'Warning' ? s.fBtnWarning : s.fBtnActive) : {}),
                  }}
                  onClick={() => setSeverityFilter(f)}
                >
                  {f}
                  {f === 'Critical' && criticalCount > 0 && <span style={s.badgeRed}>{criticalCount}</span>}
                  {f === 'Warning'  && warningCount  > 0 && <span style={s.badgeGold}>{warningCount}</span>}
                </button>
              ))}
              <input
                style={s.search}
                type="text"
                placeholder="Search student or skill…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <p style={{ ...s.muted, marginBottom: '0.75rem' }}>
              Showing {filtered.length} of {alerts.length} flagged record{alerts.length !== 1 ? 's' : ''}
            </p>

            {filtered.length === 0 ? (
              <div style={s.empty}>No records match your filters.</div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Severity', 'Student', 'Skill', 'Subject', 'Mastery', 'Difficulty', 'Regressions', 'Last Updated'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => {
                      const isCritical = a.regression_count >= 3
                      return (
                        <tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                          <td style={s.td}>
                            <span style={isCritical ? s.pillCritical : s.pillWarning}>
                              {isCritical ? '🔴 Critical' : '🟡 Warning'}
                            </span>
                          </td>
                          <td style={{ ...s.td, fontWeight: 600 }}>{a.users?.name ?? '—'}</td>
                          <td style={s.td}>{a.skill_name}</td>
                          <td style={s.td}>{a.subject}</td>
                          <td style={s.td}>
                            <span style={{
                              ...s.pill,
                              background: a.mastery_level === 'Mastered' ? '#f0f7f2' : a.mastery_level === 'Developing' ? '#fdf8ee' : '#fdf0f0',
                              color:      a.mastery_level === 'Mastered' ? '#1b5e30' : a.mastery_level === 'Developing' ? '#7a5a00' : '#8b1a1a',
                            }}>
                              {a.mastery_level}
                            </span>
                          </td>
                          <td style={s.td}>{a.difficulty_level}</td>
                          <td style={{ ...s.td, textAlign: 'center', fontWeight: 700, color: isCritical ? '#8b1a1a' : '#7a5a00' }}>
                            {a.regression_count}
                          </td>
                          <td style={{ ...s.td, fontSize: '0.8rem', color: '#6b6b6b' }}>
                            {new Date(a.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:         { padding: '2rem', maxWidth: '1024px', margin: '0 auto' },
  topRow:       { marginBottom: '1.5rem' },
  heading:      { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:        { color: '#6b6b6b', fontSize: '0.88rem', marginTop: '0.25rem' },
  chips:        { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.75rem' },
  chip:         { background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '10px', padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' },
  chipNum:      { fontSize: '1.6rem', fontWeight: 700, color: '#0d3a1b', lineHeight: 1 },
  chipLabel:    { fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b', marginTop: '0.25rem' },
  successBox:   { background: '#f0f7f2', border: '1.5px solid #1b5e30', borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center' },
  successIcon:  { fontSize: '2.5rem', marginBottom: '0.75rem' },
  successTitle: { fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', color: '#0d3a1b', marginBottom: '0.5rem' },
  successDesc:  { color: '#6b6b6b', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' },
  filterRow:    { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' },
  fBtn:         { display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', color: '#6b6b6b', fontFamily: 'inherit' },
  fBtnActive:   { background: '#0d3a1b', color: '#fff', borderColor: '#0d3a1b', fontWeight: 600 },
  fBtnCritical: { background: '#fdf0f0', color: '#8b1a1a', borderColor: '#8b1a1a', fontWeight: 600 },
  fBtnWarning:  { background: '#fdf8ee', color: '#7a5a00', borderColor: '#c9941a', fontWeight: 600 },
  badgeRed:     { background: '#8b1a1a', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '8px' },
  badgeGold:    { background: '#c9941a', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '8px' },
  search:       { marginLeft: 'auto', border: '1px solid rgba(27,94,48,0.2)', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', minWidth: '220px', color: '#1a1a1a' },
  tableWrap:    { borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(27,94,48,0.12)' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:           { textAlign: 'left', padding: '0.65rem 1rem', background: '#0d3a1b', color: '#e8b84b', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  trEven:       { background: '#fff' },
  trOdd:        { background: '#faf6ee' },
  td:           { padding: '0.7rem 1rem', borderBottom: '1px solid rgba(27,94,48,0.07)', color: '#1a1a1a', verticalAlign: 'middle' },
  pill:         { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },
  pillCritical: { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#fdf0f0', color: '#8b1a1a' },
  pillWarning:  { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#fdf8ee', color: '#7a5a00' },
  empty:        { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '2.5rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  center:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:      { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}