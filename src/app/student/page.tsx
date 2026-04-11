// student/page.tsx
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

export default function StudentDashboardPage() {
  const router = useRouter()

  const [name, setName]           = useState('')
  const [lessons, setLessons] = useState<LessonRow[]>([])
  const [classes, setClasses]     = useState<EnrolledClass[]>([])
  const [mastery, setMastery]     = useState<MasteryRecord[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        // Get user name
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()
        setName(userData?.name ?? '')

        // Get enrolled classes
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('class_id, classes(name, section, join_code)')
          .eq('student_id', user.id)

        setClasses((enrollData as unknown as EnrolledClass[]) ?? [])

        
        // Get lessons for enrolled classes
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
        // Get mastery records
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

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Dashboard">
        <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
      </AppLayout>
    )
  }

  const mastered   = mastery.filter(m => m.mastery_level === 'Mastered').length
  const developing = mastery.filter(m => m.mastery_level === 'Developing').length
  const needsHelp  = mastery.filter(m => m.mastery_level === 'Needs Help').length

  return (
    <AppLayout title="Dashboard">
      <div style={s.page}>

        {/* Greeting */}
        <div style={s.greeting}>
          <h1 style={s.heading}>Hello, {name || 'Student'} 👋</h1>
          <p style={s.muted}>Here's your learning progress at a glance.</p>
        </div>

        {/* Stat chips */}
        <div style={s.chips}>
          <div style={s.chip}>
            <span style={{ ...s.chipNum, color: '#0d3a1b' }}>{mastery.length}</span>
            <span style={s.chipLabel}>Skills Tracked</span>
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

        {/* Quick actions */}
        <div style={s.actions}>
          <button style={s.btnPrimary} onClick={() => router.push('/student/quiz')}>
            Start a Quiz
          </button>
          <button style={s.btnOutline} onClick={() => router.push('/student/progress')}>
            View My Progress
          </button>
        </div>
        {/* Available Lessons */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Available Lessons</h2>
            {lessons.length === 0 ? (
              <div style={s.empty}>No lessons published yet.</div>
            ) : (
              <div style={s.classGrid}>
                {lessons.map(lesson => (
                  <div key={lesson.id} style={s.lessonCard}>
                    <div style={s.lessonCardTop}>
                      <span style={{
                        ...s.subjectPill,
                        background: lesson.subject === 'English' ? '#eef4ff'
                          : lesson.subject === 'Mathematics' ? '#fdf0f0' : '#f0f7f2',
                        color: lesson.subject === 'English' ? '#1a56b0'
                          : lesson.subject === 'Mathematics' ? '#8b1a1a' : '#1b5e30',
                      }}>
                        {lesson.subject}
                      </span>
                      <span style={{
                        ...s.subjectPill,
                        background: lesson.difficulty_level === 'Advanced' ? '#fdf0f0'
                          : lesson.difficulty_level === 'Standard' ? '#fdf8ee' : '#f0f7f2',
                        color: lesson.difficulty_level === 'Advanced' ? '#8b1a1a'
                          : lesson.difficulty_level === 'Standard' ? '#7a5a00' : '#1b5e30',
                      }}>
                        {lesson.difficulty_level}
                      </span>
                    </div>
                    <span style={s.lessonTitle}>{lesson.title}</span>
                    <span style={s.lessonSkill}>Skill: {lesson.skill_name}</span>
                    {lesson.file_url && (
                      <a
                        href={lesson.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={s.fileLink}
                      >
                        📎 Download lesson file
                      </a>
                    )}
                    <button
                      style={s.btnStart}
                      onClick={() => router.push(`/student/quiz?lesson_id=${lesson.id}`)}
                    >
                      Start Quiz →
                    </button>
                  </div>
                ))}
              </div>
            )}
            {lessons.length >= 6 && (
              <button style={s.seeAll} onClick={() => router.push('/student/lessons')}>
                See all lessons →
              </button>
            )}
          </section>

          

        {/* Enrolled classes */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>My Classes</h2>
          {classes.length === 0 ? (
            <div style={s.empty}>You are not enrolled in any class yet.</div>
          ) : (
            <div style={s.classGrid}>
              {classes.map((c, i) => (
                <div key={i} style={s.classCard}>
                  <span style={s.classCardName}>
                    {c.classes?.name ?? '—'} — {c.classes?.section ?? ''}
                  </span>
                  <span style={s.classCardCode}>Code: {c.classes?.join_code ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent mastery */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Recent Skills</h2>
          {mastery.length === 0 ? (
            <div style={s.empty}>No quiz attempts yet. Start a quiz to track your progress!</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Skill', 'Subject', 'Difficulty', 'Mastery'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mastery.slice(0, 5).map((m, i) => (
                  <tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {mastery.length > 5 && (
            <button style={s.seeAll} onClick={() => router.push('/student/progress')}>
              See all {mastery.length} skills →
            </button>
          )}
        </section>

      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  lessonCard:    { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  lessonCardTop: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  lessonTitle:   { fontWeight: 600, fontSize: '0.95rem', color: '#0d3a1b', lineHeight: 1.3 },
  lessonSkill:   { fontSize: '0.75rem', color: '#6b6b6b' },
  subjectPill:   { fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px' },
  fileLink:      { fontSize: '0.75rem', color: '#1b5e30', fontWeight: 600, textDecoration: 'none', background: '#f0f7f2', padding: '0.25rem 0.6rem', borderRadius: '4px', alignSelf: 'flex-start' },
  btnStart:      { marginTop: '0.25rem', background: '#1b5e30', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.55rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' },
  page:          { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  greeting:      { marginBottom: '1.5rem' },
  heading:       { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:         { color: '#6b6b6b', fontSize: '0.88rem', margin: '0.25rem 0 0' },
  chips:         { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  chip:          { background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '10px', padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' },
  chipNum:       { fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 },
  chipLabel:     { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b', marginTop: '0.25rem' },
  actions:       { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' },
  btnPrimary:    { background: '#1b5e30', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnOutline:    { background: 'transparent', color: '#1b5e30', border: '1.5px solid #1b5e30', borderRadius: '8px', padding: '0.7rem 1.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' },
  section:       { marginBottom: '2.5rem' },
  sectionTitle:  { fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', color: '#0d3a1b', marginBottom: '1rem' },
  classGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  classCard:     { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  classCardName: { fontWeight: 600, fontSize: '0.95rem', color: '#0d3a1b' },
  classCardCode: { fontSize: '0.75rem', color: '#6b6b6b', fontFamily: 'monospace' },
  table:         { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:            { textAlign: 'left', padding: '0.6rem 1rem', background: '#0d3a1b', color: '#e8b84b', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  trEven:        { background: '#fff' },
  trOdd:         { background: '#faf6ee' },
  td:            { padding: '0.65rem 1rem', borderBottom: '1px solid rgba(27,94,48,0.08)', color: '#1a1a1a', verticalAlign: 'middle' },
  pill:          { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },
  empty:         { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '1.5rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  seeAll:        { marginTop: '0.75rem', background: 'none', border: 'none', color: '#1b5e30', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },
  center:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:       { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}