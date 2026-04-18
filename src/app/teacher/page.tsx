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

  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [classes, setClasses]     = useState<Class[]>([])
  const [flagged, setFlagged]     = useState<FlaggedStudent[]>([])
  const [summaries, setSummaries] = useState<ClassSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }
        setTeacherId(user.id)

        const { data: classData, error: classError } = await getClassesByTeacher(user.id)
        if (classError) throw classError
        const classList = classData ?? []
        setClasses(classList)

        const summaryList: ClassSummary[] = []
        for (const cls of classList) {
          const { data: masteryRows } = await supabase
            .from('mastery_history')
            .select('mastery_level, student_id')
            .eq('class_id', cls.id)

          const rows = masteryRows ?? []
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

  if (loading) {
    return (
      <AppLayout title="Teacher Dashboard">
        <style>{`@keyframes td-spin { to { transform: rotate(360deg); } }`}</style>
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
          <div style={s.errorCard}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <p style={{ color: '#8b1a1a', fontWeight: 600, margin: 0 }}>{error}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const totalMastered   = summaries.reduce((a, b) => a + b.mastered, 0)
  const totalDeveloping = summaries.reduce((a, b) => a + b.developing, 0)
  const totalNeedsHelp  = summaries.reduce((a, b) => a + b.needsHelp, 0)

  const masteryMeta: Record<string, { bg: string; color: string; border: string; icon: string }> = {
    'Mastered':   { bg: '#eaf6ef', color: '#0d5c28', border: 'rgba(26,122,64,0.18)', icon: '⭐' },
    'Developing': { bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.18)', icon: '📈' },
    'Needs Help': { bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.14)', icon: '🆘' },
  }

  return (
    <AppLayout title="Teacher Dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        @keyframes td-spin  { to { transform: rotate(360deg); } }
        @keyframes td-fade  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .td-stat        { transition: box-shadow 0.18s, transform 0.18s; }
        .td-stat:hover  { box-shadow: 0 6px 20px rgba(13,61,32,0.10); transform: translateY(-2px); }
        .td-card        { transition: box-shadow 0.18s, transform 0.18s; }
        .td-card:hover  { box-shadow: 0 8px 24px rgba(13,61,32,0.11); transform: translateY(-2px); }
        .td-btn-gold:hover    { background: #e09b00 !important; transform: translateY(-1px); }
        .td-btn-outline:hover { background: #eaf6ef !important; }
        .td-tr:hover td { background: #f0f9f4 !important; }
        .td-link:hover  { opacity: 0.75; }
        .td-content     { animation: td-fade 0.25s ease both; }
      `}</style>

      <div style={s.page}>

        {/* ── Header ── */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>Teacher · Home</div>
            <h1 style={s.heading}>Dashboard</h1>
            <p style={s.muted}>Overview of your classes and student progress</p>
          </div>
          <div style={s.quickLinks}>
            <button
              className="td-btn-gold"
              style={s.btnGold}
              onClick={() => router.push('/teacher/lessons/new')}
            >
              ✚ New Lesson
            </button>
            <button
              className="td-btn-outline"
              style={s.btnOutline}
              onClick={() => router.push('/teacher/questions')}
            >
              🔍 Review Questions
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={s.statGrid}>
          {[
            { label: 'Classes',    value: classes.length,  icon: '🏫', bg: '#fdfaf5', color: '#0d3d20', border: 'rgba(26,122,64,0.13)' },
            { label: 'Mastered',   value: totalMastered,   icon: '⭐', bg: '#eaf6ef', color: '#0d5c28', border: 'rgba(26,122,64,0.22)' },
            { label: 'Developing', value: totalDeveloping, icon: '📈', bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.20)' },
            { label: 'Needs Help', value: totalNeedsHelp,  icon: '🆘', bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.18)' },
            { label: 'Flagged',    value: flagged.length,  icon: '⚠️', bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.18)' },
          ].map(c => (
            <div key={c.label} className="td-stat" style={{ ...s.statCard, background: c.bg, border: `1.5px solid ${c.border}` }}>
              <span style={s.statIcon}>{c.icon}</span>
              <span style={{ ...s.statNum, color: c.color }}>{c.value}</span>
              <span style={s.statLabel}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* ── Class Mastery Overview ── */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Class Mastery Overview</h2>
            {summaries.length > 0 && (
              <span style={s.countBadge}>{summaries.length} class{summaries.length !== 1 ? 'es' : ''}</span>
            )}
          </div>

          {summaries.length === 0 ? (
            <div style={s.empty}>
              <span style={{ fontSize: '2.5rem' }}>🏫</span>
              <p style={{ margin: 0, fontWeight: 600, color: '#0d3d20' }}>No classes yet.</p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                <span
                  className="td-link"
                  style={s.link}
                  onClick={() => router.push('/teacher/classes')}
                >
                  Create a class
                </span>{' '}
                to start tracking student progress.
              </p>
            </div>
          ) : (
            <div className="td-content" style={s.classGrid}>
              {summaries.map(cls => {
                const pct = (n: number) =>
                  cls.total > 0 ? Math.round((n / cls.total) * 100) : 0
                const mastPct = pct(cls.mastered)
                return (
                  <div key={cls.classId} className="td-card" style={s.classCard}>
                    <div style={s.classCardTop}>
                      <div style={s.classIconWrap}>🏫</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.classCardName}>{cls.sectionName}</div>
                        <div style={s.classCardSub}>{cls.total} student{cls.total !== 1 ? 's' : ''} tracked</div>
                      </div>
                      <div style={{
                        ...s.mastPctBadge,
                        background: mastPct >= 70 ? '#eaf6ef' : mastPct >= 40 ? '#fffbf0' : '#fff0f0',
                        color: mastPct >= 70 ? '#0d5c28' : mastPct >= 40 ? '#7a5500' : '#8b1a1a',
                      }}>
                        {mastPct}%
                      </div>
                    </div>

                    <div style={s.bar}>
                      {cls.total === 0 ? (
                        <div style={{ ...s.barSeg, width: '100%', background: '#e5e7eb' }} />
                      ) : (
                        <>
                          {cls.mastered > 0 && (
                            <div style={{ ...s.barSeg, width: `${pct(cls.mastered)}%`, background: 'linear-gradient(90deg,#1a7a40,#0d5c28)' }} title={`Mastered: ${cls.mastered}`} />
                          )}
                          {cls.developing > 0 && (
                            <div style={{ ...s.barSeg, width: `${pct(cls.developing)}%`, background: 'linear-gradient(90deg,#d4a017,#b07800)' }} title={`Developing: ${cls.developing}`} />
                          )}
                          {cls.needsHelp > 0 && (
                            <div style={{ ...s.barSeg, width: `${pct(cls.needsHelp)}%`, background: 'linear-gradient(90deg,#c0392b,#8b1a1a)' }} title={`Needs Help: ${cls.needsHelp}`} />
                          )}
                        </>
                      )}
                    </div>

                    <div style={s.barLegend}>
                      <span style={s.legendItem}><span style={{ ...s.dot, background: '#1a7a40' }} />{cls.mastered} Mastered</span>
                      <span style={s.legendItem}><span style={{ ...s.dot, background: '#d4a017' }} />{cls.developing} Developing</span>
                      <span style={s.legendItem}><span style={{ ...s.dot, background: '#c0392b' }} />{cls.needsHelp} Needs Help</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Flagged Students ── */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Flagged Students</h2>
            <span style={{
              ...s.countBadge,
              background: flagged.length > 0 ? '#fff0f0' : '#eaf6ef',
              color: flagged.length > 0 ? '#8b1a1a' : '#0d5c28',
            }}>
              {flagged.length}
            </span>
          </div>

          {flagged.length === 0 ? (
            <div style={s.empty}>
              <span style={{ fontSize: '2.5rem' }}>🎉</span>
              <p style={{ margin: 0, fontWeight: 600, color: '#0d3d20' }}>No flagged students!</p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>All students are progressing well.</p>
            </div>
          ) : (
            <div className="td-content" style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Student', 'Skill', 'Mastery', 'Regressions'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flagged.map((f, i) => {
                    const mm = masteryMeta[f.mastery_level] ?? masteryMeta['Needs Help']
                    return (
                      <tr key={i} className="td-tr" style={i % 2 === 0 ? s.trEven : s.trOdd}>
                        <td style={{ ...s.td, fontWeight: 600 }}>
                          <div style={s.avatarRow}>
                            <div style={s.avatarDot}>
                              {(f.users?.name ?? '?').charAt(0).toUpperCase()}
                            </div>
                            {f.users?.name ?? '—'}
                          </div>
                        </td>
                        <td style={s.td}>{f.skill_name}</td>
                        <td style={s.td}>
                          <span style={{
                            ...s.pill,
                            background: mm.bg,
                            color: mm.color,
                            border: `1px solid ${mm.border}`,
                          }}>
                            {mm.icon} {f.mastery_level}
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center' as const }}>
                          <span style={s.regBadge}>{f.regression_count} ⚠️</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:          { padding: '2.5rem', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
  topRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
  breadcrumb:    { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a7a40', marginBottom: '0.35rem' },
  heading:       { fontFamily: "'DM Serif Display', serif", fontSize: '2.1rem', color: '#0d3d20', margin: '0 0 0.25rem' },
  muted:         { color: '#6b7280', fontSize: '0.95rem', margin: 0 },
  quickLinks:    { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, alignItems: 'center' },
  btnGold:       { background: '#f0a500', color: '#0d3d20', border: 'none', borderRadius: '9px', padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(240,165,0,0.25)', transition: 'background 0.15s, transform 0.15s' },
  btnOutline:    { background: '#fff', color: '#0d3d20', border: '1.5px solid rgba(26,122,64,0.35)', borderRadius: '9px', padding: '0.7rem 1.4rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' },

  statGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '2rem' },
  statCard:      { borderRadius: '18px', padding: '1.35rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', cursor: 'default' },
  statIcon:      { fontSize: '1.6rem', lineHeight: 1 },
  statNum:       { fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginTop: '0.2rem' },
  statLabel:     { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginTop: '0.2rem', textAlign: 'center' as const },

  section:       { marginBottom: '2.5rem' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' },
  sectionTitle:  { fontFamily: "'DM Serif Display', serif", fontSize: '1.35rem', color: '#0d3d20', margin: 0 },
  countBadge:    { background: '#eaf6ef', color: '#0d5c28', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.03em' },

  classGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  classCard:     { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'default' },
  classCardTop:  { display: 'flex', alignItems: 'flex-start', gap: '0.75rem' },
  classIconWrap: { fontSize: '1.4rem', flexShrink: 0, marginTop: '1px' },
  classCardName: { fontWeight: 700, fontSize: '0.97rem', color: '#0d3d20', lineHeight: 1.3 },
  classCardSub:  { fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' },
  mastPctBadge:  { fontSize: '0.8rem', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', flexShrink: 0, whiteSpace: 'nowrap' as const },
  bar:           { height: '13px', borderRadius: '99px', background: '#e5e7eb', display: 'flex', overflow: 'hidden' },
  barSeg:        { height: '100%', transition: 'width 0.4s ease' },
  barLegend:     { display: 'flex', gap: '0.75rem', fontSize: '0.78rem', flexWrap: 'wrap' as const, color: '#4b5563', fontWeight: 500 },
  legendItem:    { display: 'flex', alignItems: 'center', gap: '0.35rem' },
  dot:           { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0, display: 'inline-block' },

  tableWrap:     { borderRadius: '16px', overflow: 'hidden', border: '1.5px solid rgba(26,122,64,0.13)', boxShadow: '0 2px 12px rgba(13,61,32,0.05)' },
  table:         { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.95rem' },
  th:            { textAlign: 'left' as const, padding: '0.85rem 1.1rem', background: '#0d3d20', color: '#ffd166', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 700 },
  trEven:        { background: '#fff' },
  trOdd:         { background: '#fdfaf5' },
  td:            { padding: '0.85rem 1.1rem', borderBottom: '1px solid rgba(26,122,64,0.08)', color: '#1a1f16', verticalAlign: 'middle' as const },
  avatarRow:     { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  avatarDot:     { width: '34px', height: '34px', borderRadius: '50%', background: '#eaf6ef', color: '#0d5c28', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 },
  pill:          { fontSize: '0.78rem', fontWeight: 700, padding: '0.28rem 0.7rem', borderRadius: '6px', display: 'inline-block' },
  regBadge:      { background: '#fff0f0', color: '#8b1a1a', fontWeight: 700, padding: '3px 12px', borderRadius: '6px', fontSize: '0.88rem', display: 'inline-block' },

  empty:         { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' as const },
  link:          { color: '#1a7a40', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', transition: 'opacity 0.15s' },
  center:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  errorCard:     { background: '#fff0f0', border: '1.5px solid rgba(155,28,28,0.18)', borderRadius: '18px', padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  spinner:       { width: '42px', height: '42px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'td-spin 0.8s linear infinite' },
}