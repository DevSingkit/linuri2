// Student/progress
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase, getMasteryByStudent } from '@/lib/supabase'
import type { MasteryRecord, Subject } from '@/types/linuri'

const SUBJECTS: Subject[] = ['English', 'Mathematics', 'Science']

export default function StudentProgressPage() {
  const router = useRouter()

  const [mastery, setMastery]         = useState<MasteryRecord[]>([])
  const [filtered, setFiltered]       = useState<MasteryRecord[]>([])
  const [activeSubject, setActiveSubject] = useState<Subject | 'All'>('All')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        const { data, error: fetchError } = await getMasteryByStudent(user.id)
        if (fetchError) throw fetchError
        const records = data ?? []
        setMastery(records)
        setFiltered(records)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // Filter by subject
  function filterSubject(subject: Subject | 'All') {
    setActiveSubject(subject)
    setFiltered(subject === 'All' ? mastery : mastery.filter(m => m.subject === subject))
  }

  if (loading) {
    return (
      <AppLayout title="My Progress">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading your progress…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="My Progress">
        <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
      </AppLayout>
    )
  }

  // Summary counts
  const mastered   = mastery.filter(m => m.mastery_level === 'Mastered').length
  const developing = mastery.filter(m => m.mastery_level === 'Developing').length
  const needsHelp  = mastery.filter(m => m.mastery_level === 'Needs Help').length
  const flagged    = mastery.filter(m => m.regression_count >= 2)

  return (
    <AppLayout title="My Progress">
      <div style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>My Progress</h1>
            <p style={s.muted}>Track your mastery across all skills and subjects</p>
          </div>
          <button style={s.btnOutline} onClick={() => router.push('/student')}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Stat chips */}
        <div style={s.chips}>
          <div style={s.chip}>
            <span style={{ ...s.chipNum, color: '#0d3a1b' }}>{mastery.length}</span>
            <span style={s.chipLabel}>Total Skills</span>
          </div>
          <div style={{ ...s.chip, borderColor: '#1b5e30' }}>
            <span style={{ ...s.chipNum, color: '#1b5e30' }}>{mastered}</span>
            <span style={s.chipLabel}>Mastered</span>
          </div>
          <div style={{ ...s.chip, borderColor: '#c9941a' }}>
            <span style={{ ...s.chipNum, color: '#7a5a00' }}>{developing}</span>
            <span style={s.chipLabel}>Developing</span>
          </div>
          <div style={{ ...s.chip, borderColor: '#8b1a1a' }}>
            <span style={{ ...s.chipNum, color: '#8b1a1a' }}>{needsHelp}</span>
            <span style={s.chipLabel}>Needs Help</span>
          </div>
        </div>

        {/* Weak areas alert */}
        {flagged.length > 0 && (
          <div style={s.alert}>
            <span style={s.alertIcon}>⚠</span>
            <div>
              <strong>Skills needing attention:</strong>{' '}
              {flagged.map(f => f.skill_name).join(', ')}
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#7a5a00' }}>
                These skills have regressed {flagged[0].regression_count}+ times. Keep practising!
              </p>
            </div>
          </div>
        )}

        {/* Subject filter tabs */}
        <div style={s.tabs}>
          {(['All', ...SUBJECTS] as const).map(sub => (
            <button
              key={sub}
              style={{
                ...s.tab,
                ...(activeSubject === sub ? s.tabActive : {}),
              }}
              onClick={() => filterSubject(sub)}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Progress table */}
        {filtered.length === 0 ? (
          <div style={s.empty}>
            {mastery.length === 0
              ? 'No quiz attempts yet. Complete a quiz to see your progress here!'
              : `No skills tracked for ${activeSubject} yet.`}
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Skill', 'Subject', 'Difficulty', 'Mastery', 'Regressions', 'Last Updated'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                  <td style={{ ...s.td, fontWeight: 500 }}>{m.skill_name}</td>
                  <td style={s.td}>{m.subject}</td>
                  <td style={s.td}>
                    <span style={{
                      ...s.diffPill,
                      background: m.difficulty_level === 'Advanced' ? '#f0f7f2'
                        : m.difficulty_level === 'Standard' ? '#fdf8ee' : '#faf6ee',
                      color: m.difficulty_level === 'Advanced' ? '#1b5e30'
                        : m.difficulty_level === 'Standard' ? '#7a5a00' : '#6b6b6b',
                    }}>
                      {m.difficulty_level}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      ...s.masteryPill,
                      background: m.mastery_level === 'Mastered' ? '#f0f7f2'
                        : m.mastery_level === 'Developing' ? '#fdf8ee' : '#fdf0f0',
                      color: m.mastery_level === 'Mastered' ? '#1b5e30'
                        : m.mastery_level === 'Developing' ? '#7a5a00' : '#8b1a1a',
                    }}>
                      {m.mastery_level === 'Mastered'   ? '★ Mastered'
                       : m.mastery_level === 'Developing' ? '◆ Developing'
                       : '▲ Needs Help'}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'center', color: m.regression_count >= 2 ? '#8b1a1a' : '#6b6b6b', fontWeight: m.regression_count >= 2 ? 600 : 400 }}>
                    {m.regression_count}
                    {m.regression_count >= 2 && <span style={{ marginLeft: '4px' }}>⚠</span>}
                  </td>
                  <td style={{ ...s.td, color: '#6b6b6b', fontSize: '0.8rem' }}>
                    {new Date(m.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:         { padding: '2rem', maxWidth: '960px', margin: '0 auto' },
  topRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' },
  heading:      { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:        { color: '#6b6b6b', fontSize: '0.88rem', margin: '0.25rem 0 0' },
  btnOutline:   { background: 'transparent', color: '#1b5e30', border: '1.5px solid #1b5e30', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  chips:        { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  chip:         { background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '10px', padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' },
  chipNum:      { fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 },
  chipLabel:    { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b', marginTop: '0.25rem' },
  alert:        { display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: '#fdf8ee', border: '1.5px solid #c9941a', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },
  alertIcon:    { fontSize: '1.1rem', color: '#c9941a', flexShrink: 0, marginTop: '2px' },
  tabs:         { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' },
  tab:          { background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', color: '#6b6b6b', fontFamily: 'inherit' },
  tabActive:    { background: '#0d3a1b', color: '#e8b84b', borderColor: '#0d3a1b', fontWeight: 600 },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:           { textAlign: 'left', padding: '0.6rem 1rem', background: '#0d3a1b', color: '#e8b84b', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  trEven:       { background: '#fff' },
  trOdd:        { background: '#faf6ee' },
  td:           { padding: '0.65rem 1rem', borderBottom: '1px solid rgba(27,94,48,0.08)', color: '#1a1a1a', verticalAlign: 'middle' },
  masteryPill:  { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },
  diffPill:     { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },
  empty:        { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '2rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  center:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:      { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}