// src/app/student/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase, getMasteryByStudent } from '@/lib/supabase'
import type { MasteryRecord } from '@/types/linuri'

interface EnrolledClass {
  class_id: string
  classes: { name: string; section: string; join_code: string } | null
}

interface LessonRow {
  id: string
  title: string
  subject: string
  skill_name: string
  difficulty_level: string
  file_url?: string
  classes: { name: string; section: string } | null
}

const SUBJECT_STYLE: Record<string, { bg: string; color: string }> = {
  English:     { bg: '#eef4ff', color: '#1a56b0' },
  Mathematics: { bg: '#fff0f0', color: '#8b1a1a' },
  Science:     { bg: '#eaf6ef', color: '#0d3d20' },
}
const DIFF_STYLE: Record<string, { bg: string; color: string }> = {
  Advanced: { bg: '#fff0f0', color: '#8b1a1a' },
  Standard: { bg: '#fffbf0', color: '#7a5500' },
  Basic:    { bg: '#eaf6ef', color: '#0d3d20' },
}
const MASTERY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  'Mastered':   { bg: '#eaf6ef', color: '#0d3d20', border: 'rgba(26,122,64,0.18)' },
  'Developing': { bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.18)' },
  'Needs Help': { bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.14)' },
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const [name, setName]       = useState('')
  const [lessons, setLessons] = useState<LessonRow[]>([])
  const [classes, setClasses] = useState<EnrolledClass[]>([])
  const [mastery, setMastery] = useState<MasteryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        const { data: userData } = await supabase.from('users').select('name').eq('id', user.id).single()
        setName(userData?.name ?? '')

        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('class_id, classes(name, section, join_code)')
          .eq('student_id', user.id)
        setClasses((enrollData as unknown as EnrolledClass[]) ?? [])

        const classIds = ((enrollData as unknown as EnrolledClass[]) ?? []).map(e => e.class_id)
        let lessonRows: LessonRow[] = []
        if (classIds.length > 0) {
          const { data: lessonData } = await supabase
            .from('lessons')
            .select('id, title, subject, skill_name, difficulty_level, file_url, classes(name, section)')
            .in('class_id', classIds)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(6)
          lessonRows = (lessonData as unknown as LessonRow[]) ?? []
        }
        setLessons(lessonRows)

        const { data: masteryData } = await getMasteryByStudent(user.id)
        setMastery(masteryData ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) return (
    <AppLayout title="Dashboard">
      <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Loading…</p></div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Dashboard">
      <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
    </AppLayout>
  )

  const mastered   = mastery.filter(m => m.mastery_level === 'Mastered').length
  const developing = mastery.filter(m => m.mastery_level === 'Developing').length
  const needsHelp  = mastery.filter(m => m.mastery_level === 'Needs Help').length

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
        .sd-stat-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 16px; padding: 1rem 1.25rem; display: flex; flex-direction: column; align-items: center; min-width: 100px; transition: transform 0.15s, box-shadow 0.15s; }
        .sd-stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(13,61,32,0.08); }
        .sd-lesson-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 18px; padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.45rem; transition: transform 0.15s, box-shadow 0.15s; }
        .sd-lesson-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(13,61,32,0.09); }
        .sd-class-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 14px; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.3rem; }
        .sd-btn-primary { background: var(--green-dark); color: #fff; border: none; border-radius: 9px; padding: 0.72rem 1.5rem; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: var(--font); transition: background 0.15s, transform 0.1s; }
        .sd-btn-primary:hover { background: var(--green); transform: translateY(-1px); }
        .sd-btn-outline { background: transparent; color: var(--green-dark); border: 1.5px solid var(--green-dark); border-radius: 9px; padding: 0.72rem 1.5rem; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: var(--font); transition: background 0.15s; }
        .sd-btn-outline:hover { background: var(--green-light); }
        .sd-btn-start { background: var(--green-dark); color: #fff; border: none; border-radius: 8px; padding: 0.55rem; font-weight: 700; font-size: 0.82rem; cursor: pointer; font-family: var(--font); transition: background 0.15s; }
        .sd-btn-start:hover { background: var(--green); }
        .sd-see-all { background: none; border: none; color: var(--green); font-weight: 700; font-size: 0.85rem; cursor: pointer; padding: 0; font-family: var(--font); margin-top: 0.75rem; }
        .sd-see-all:hover { text-decoration: underline; }
        .sd-tr:hover td { background: #fdfaf5; }
      `}</style>

      <AppLayout title="Dashboard">
        <div style={s.page}>

          {/* Greeting */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={s.heading}>Hello, {name || 'Student'} 👋</h1>
            <p style={s.muted}>Here's your learning progress at a glance.</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {[
              { num: mastery.length, label: 'Skills Tracked', color: '#0d3d20' },
              { num: mastered,       label: 'Mastered',       color: '#1a7a40' },
              { num: developing,     label: 'Developing',     color: '#7a5500' },
              { num: needsHelp,      label: 'Needs Help',     color: '#8b1a1a' },
            ].map(({ num, label, color }) => (
              <div key={label} className="sd-stat-card">
                <span style={{ fontSize: '1.7rem', fontWeight: 800, color, lineHeight: 1 }}>{num}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginTop: '0.3rem' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <button className="sd-btn-primary" onClick={() => router.push('/student/quiz')}>Start a Quiz →</button>
            <button className="sd-btn-outline" onClick={() => router.push('/student/progress')}>View My Progress</button>
          </div>

          {/* Available Lessons */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Available Lessons</h2>
            {lessons.length === 0 ? (
              <div style={s.empty}>No lessons published yet.</div>
            ) : (
              <div style={s.lessonGrid}>
                {lessons.map(lesson => {
                  const subStyle  = SUBJECT_STYLE[lesson.subject]  ?? { bg: '#f5f5f5', color: '#333' }
                  const diffStyle = DIFF_STYLE[lesson.difficulty_level] ?? { bg: '#f5f5f5', color: '#333' }
                  return (
                    <div key={lesson.id} className="sd-lesson-card">
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ ...s.pill, background: subStyle.bg, color: subStyle.color }}>{lesson.subject}</span>
                        <span style={{ ...s.pill, background: diffStyle.bg, color: diffStyle.color }}>{lesson.difficulty_level}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d3d20', lineHeight: 1.3 }}>{lesson.title}</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Skill: {lesson.skill_name}</span>
                      {lesson.file_url && (
                        <a href={lesson.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#1a7a40', fontWeight: 700, textDecoration: 'none', background: '#eaf6ef', padding: '0.25rem 0.6rem', borderRadius: '6px', alignSelf: 'flex-start' }}>
                          📎 Download lesson file
                        </a>
                      )}
                      <button className="sd-btn-start" onClick={() => router.push(`/student/quiz?lesson_id=${lesson.id}`)}>
                        Start Quiz →
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            {lessons.length >= 6 && (
              <button className="sd-see-all" onClick={() => router.push('/student/lessons')}>See all lessons →</button>
            )}
          </section>

          {/* My Classes */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>My Classes</h2>
            {classes.length === 0 ? (
              <div style={s.empty}>You are not enrolled in any class yet.</div>
            ) : (
              <div style={s.classGrid}>
                {classes.map((c, i) => (
                  <div key={i} className="sd-class-card">
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d3d20' }}>
                      {c.classes?.name ?? '—'} — {c.classes?.section ?? ''}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                      Code: {c.classes?.join_code ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Skills */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Recent Skills</h2>
            {mastery.length === 0 ? (
              <div style={s.empty}>No quiz attempts yet. Start a quiz to track your progress!</div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Skill', 'Subject', 'Difficulty', 'Mastery'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mastery.slice(0, 5).map((m, i) => {
                      const ms = MASTERY_STYLE[m.mastery_level] ?? { bg: '#f5f5f5', color: '#333', border: '#ccc' }
                      return (
                        <tr key={i} className="sd-tr" style={i % 2 === 0 ? s.trEven : s.trOdd}>
                          <td style={s.td}>{m.skill_name}</td>
                          <td style={s.td}>{m.subject}</td>
                          <td style={s.td}>{m.difficulty_level}</td>
                          <td style={s.td}>
                            <span style={{ ...s.pill, background: ms.bg, color: ms.color, border: `1px solid ${ms.border}` }}>
                              {m.mastery_level}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {mastery.length > 5 && (
              <button className="sd-see-all" onClick={() => router.push('/student/progress')}>
                See all {mastery.length} skills →
              </button>
            )}
          </section>

        </div>
      </AppLayout>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:        { maxWidth: '900px', margin: '0 auto' },
  heading:     { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3d20', margin: 0 },
  muted:       { color: '#6b7280', fontSize: '0.88rem', margin: '0.25rem 0 0' },
  section:     { marginBottom: '2.5rem' },
  sectionTitle:{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: '#0d3d20', marginBottom: '1rem' },
  lessonGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },
  classGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  tableWrap:   { borderRadius: '14px', overflow: 'hidden', border: '1.5px solid rgba(26,122,64,0.13)' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:          { textAlign: 'left', padding: '0.65rem 1rem', background: '#0d3d20', color: '#ffd166', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 700 },
  trEven:      { background: '#fff' },
  trOdd:       { background: '#fdfaf5' },
  td:          { padding: '0.68rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.07)', color: '#1a1f16', verticalAlign: 'middle' },
  pill:        { fontSize: '0.68rem', fontWeight: 700, padding: '0.22rem 0.6rem', borderRadius: '20px' },
  empty:       { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '14px', padding: '1.5rem', color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:     { width: '36px', height: '36px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}