// /teacher/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import {
  getClassesByTeacher,
  getFlaggedStudents,
  supabase,
} from '@/lib/supabase'
import type { Class } from '@/types/linuri'

interface FlaggedStudent {
  student_id: string
  skill_name: string
  regression_count: number
  mastery_level: string
  users: { name: string } | null
}

interface ClassSummary {
  classId: string
  sectionName: string
  mastered: number
  developing: number
  needsHelp: number
  total: number
}

export default function TeacherDashboard() {
  const router = useRouter()

  const [teacherId, setTeacherId]         = useState<string | null>(null)
  const [classes, setClasses]             = useState<Class[]>([])
  const [flagged, setFlagged]             = useState<FlaggedStudent[]>([])
  const [summaries, setSummaries]         = useState<ClassSummary[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // 1. Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }
        setTeacherId(user.id)

        // 2. Classes
        const { data: classData, error: classError } = await getClassesByTeacher(user.id)
        if (classError) throw classError
        const classList = classData ?? []
        setClasses(classList)

        // 3. Mastery summaries per class
        const summaryList: ClassSummary[] = []
        for (const cls of classList) {
          const { data: masteryRows } = await supabase
            .from('mastery_history')
            .select('mastery_level, student_id')
            .eq('class_id', cls.id)

          const rows = masteryRows ?? []
          // de-duplicate per student (latest mastery only)
          const byStudent: Record<string, string> = {}
          for (const r of rows) byStudent[r.student_id] = r.mastery_level

          const levels = Object.values(byStudent)
          summaryList.push({
            classId:     cls.id,
            sectionName: `${cls.name} — ${cls.section}`,
            mastered:    levels.filter(l => l === 'Mastered').length,
            developing:  levels.filter(l => l === 'Developing').length,
            needsHelp:   levels.filter(l => l === 'Needs Help').length,
            total:       levels.length,
          })
        }
        setSummaries(summaryList)

        // 4. Flagged students (≥2 regressions) across all teacher's classes
        if (classList.length > 0) {
          const classIds = classList.map(c => c.id)
          const { data: flagData } = await getFlaggedStudents(classIds)
          setFlagged((flagData as unknown as FlaggedStudent[]) ?? [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // ── loading / error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Teacher Dashboard">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading dashboard…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Teacher Dashboard">
        <div style={s.center}>
          <p style={{ color: '#8b1a1a' }}>{error}</p>
        </div>
      </AppLayout>
    )
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Teacher Dashboard">
      <div style={s.page}>

        {/* Header row */}
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>Dashboard</h1>
            <p style={s.muted}>Overview of your classes and student progress</p>
          </div>
          <div style={s.quickLinks}>
            <button style={s.btnGold}   onClick={() => router.push('/teacher/lessons/new')}>
              + New Lesson
            </button>
            <button style={s.btnOutline} onClick={() => router.push('/teacher/questions')}>
              Review Questions
            </button>
          </div>
        </div>

        {/* Stat chips */}
        <div style={s.chips}>
          <div style={s.chip}>
            <span style={s.chipNum}>{classes.length}</span>
            <span style={s.chipLabel}>Classes</span>
          </div>
          <div style={{ ...s.chip, borderColor: '#1b5e30' }}>
            <span style={{ ...s.chipNum, color: '#1b5e30' }}>
              {summaries.reduce((a, b) => a + b.mastered, 0)}
            </span>
            <span style={s.chipLabel}>Mastered</span>
          </div>
          <div style={{ ...s.chip, borderColor: '#c9941a' }}>
            <span style={{ ...s.chipNum, color: '#7a5a00' }}>
              {summaries.reduce((a, b) => a + b.developing, 0)}
            </span>
            <span style={s.chipLabel}>Developing</span>
          </div>
          <div style={{ ...s.chip, borderColor: '#8b1a1a' }}>
            <span style={{ ...s.chipNum, color: '#8b1a1a' }}>
              {summaries.reduce((a, b) => a + b.needsHelp, 0)}
            </span>
            <span style={s.chipLabel}>Needs Help</span>
          </div>
          <div style={{ ...s.chip, borderColor: '#8b1a1a' }}>
            <span style={{ ...s.chipNum, color: '#8b1a1a' }}>{flagged.length}</span>
            <span style={s.chipLabel}>Flagged</span>
          </div>
        </div>

        {/* Class mastery overview */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Class Mastery Overview</h2>

          {summaries.length === 0 ? (
            <div style={s.empty}>
              No classes yet.{' '}
              <span
                style={s.link}
                onClick={() => router.push('/teacher/classes')}
              >
                Create a class
              </span>{' '}
              to get started.
            </div>
          ) : (
            <div style={s.classGrid}>
              {summaries.map(cls => {
                const pct = (n: number) =>
                  cls.total > 0 ? Math.round((n / cls.total) * 100) : 0
                return (
                  <div key={cls.classId} style={s.classCard}>
                    <div style={s.classCardTop}>
                      <span style={s.classCardName}>{cls.sectionName}</span>
                      <span style={s.classCardCount}>{cls.total} students</span>
                    </div>

                    {/* Stacked bar */}
                    {cls.total > 0 ? (
                      <div style={s.bar}>
                        {cls.mastered > 0 && (
                          <div style={{ ...s.barSegment, width: `${pct(cls.mastered)}%`, background: '#1b5e30' }} title={`Mastered: ${cls.mastered}`} />
                        )}
                        {cls.developing > 0 && (
                          <div style={{ ...s.barSegment, width: `${pct(cls.developing)}%`, background: '#c9941a' }} title={`Developing: ${cls.developing}`} />
                        )}
                        {cls.needsHelp > 0 && (
                          <div style={{ ...s.barSegment, width: `${pct(cls.needsHelp)}%`, background: '#8b1a1a' }} title={`Needs Help: ${cls.needsHelp}`} />
                        )}
                      </div>
                    ) : (
                      <div style={{ ...s.bar, background: '#f0e9d8' }} />
                    )}

                    {/* Legend */}
                    <div style={s.barLegend}>
                      <span style={{ color: '#1b5e30' }}>● {cls.mastered} Mastered</span>
                      <span style={{ color: '#7a5a00' }}>● {cls.developing} Developing</span>
                      <span style={{ color: '#8b1a1a' }}>● {cls.needsHelp} Needs Help</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Flagged students */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>
            Flagged Students
            <span style={s.flagBadge}>{flagged.length}</span>
          </h2>

          {flagged.length === 0 ? (
            <div style={s.empty}>No flagged students — great job! 🎉</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Student', 'Skill', 'Mastery', 'Regressions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flagged.map((f, i) => (
                  <tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={s.td}>{f.users?.name ?? '—'}</td>
                    <td style={s.td}>{f.skill_name}</td>
                    <td style={s.td}>
                      <span style={{
                        ...s.masteryPill,
                        background: f.mastery_level === 'Mastered' ? '#f0f7f2'
                          : f.mastery_level === 'Developing' ? '#fdf8ee' : '#fdf0f0',
                        color: f.mastery_level === 'Mastered' ? '#1b5e30'
                          : f.mastery_level === 'Developing' ? '#7a5a00' : '#8b1a1a',
                      }}>
                        {f.mastery_level}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: 600, color: '#8b1a1a' }}>
                      {f.regression_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

      </div>
    </AppLayout>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:         { padding: '2rem', maxWidth: '960px', margin: '0 auto' },
  topRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' },
  heading:      { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:        { color: '#6b6b6b', fontSize: '0.88rem', margin: '0.25rem 0 0' },
  quickLinks:   { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  btnGold:      { background: '#c9941a', color: '#0d3a1b', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnOutline:   { background: 'transparent', color: '#1b5e30', border: '1.5px solid #1b5e30', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },

  chips:        { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' },
  chip:         { background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '10px', padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' },
  chipNum:      { fontSize: '1.6rem', fontWeight: 700, color: '#0d3a1b', lineHeight: 1 },
  chipLabel:    { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b', marginTop: '0.25rem' },

  section:      { marginBottom: '2.5rem' },
  sectionTitle: { fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', color: '#0d3a1b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' },
  flagBadge:    { background: '#8b1a1a', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '10px' },

  classGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  classCard:    { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '10px', padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  classCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  classCardName:{ fontWeight: 600, fontSize: '0.95rem', color: '#0d3a1b' },
  classCardCount:{ fontSize: '0.75rem', color: '#6b6b6b' },
  bar:          { height: '10px', borderRadius: '6px', background: '#e5e7eb', display: 'flex', overflow: 'hidden' },
  barSegment:   { height: '100%', transition: 'width 0.4s ease' },
  barLegend:    { display: 'flex', gap: '0.75rem', fontSize: '0.72rem', flexWrap: 'wrap' },

  table:        { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:           { textAlign: 'left', padding: '0.6rem 1rem', background: '#0d3a1b', color: '#e8b84b', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  trEven:       { background: '#fff' },
  trOdd:        { background: '#faf6ee' },
  td:           { padding: '0.65rem 1rem', borderBottom: '1px solid rgba(27,94,48,0.08)', color: '#1a1a1a', verticalAlign: 'middle' },
  masteryPill:  { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },

  empty:        { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '1.5rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  link:         { color: '#1b5e30', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' },
  center:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:      { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}