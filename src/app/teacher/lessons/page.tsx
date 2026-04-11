// /teacher/lessons/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'
import type { Subject } from '@/types/linuri'

interface LessonRow {
  id: string
  title: string
  subject: Subject
  skill_name: string
  difficulty_level: string
  created_at: string
  question_count?: number
}

type SubjectFilter = 'All' | Subject

export default function TeacherLessonsPage() {
  const router = useRouter()
  const [lessons, setLessons]           = useState<LessonRow[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('All')
  const [search, setSearch]             = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        const { data, error: fetchError } = await supabase
        .from('lessons')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        if (fetchError) throw fetchError

        const lessonList = (data ?? []) as LessonRow[]

        // Count questions per lesson
        if (lessonList.length > 0) {
          const { data: qData } = await supabase
            .from('questions')
            .select('lesson_id')
            .in('lesson_id', lessonList.map(l => l.id))

          const countMap: Record<string, number> = {}
          ;(qData ?? []).forEach((q: { lesson_id: string }) => {
            countMap[q.lesson_id] = (countMap[q.lesson_id] ?? 0) + 1
          })
          lessonList.forEach(l => { l.question_count = countMap[l.id] ?? 0 })
        }

        setLessons(lessonList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lessons.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const filtered = lessons.filter(l => {
    const matchSubject = subjectFilter === 'All' || l.subject === subjectFilter
    const matchSearch  = search === '' ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.skill_name.toLowerCase().includes(search.toLowerCase())
    return matchSubject && matchSearch
  })

  const diffColor = (d: string) =>
    d === 'Advanced' ? { background: '#fdf0f0', color: '#8b1a1a' }
    : d === 'Standard' ? { background: '#fdf8ee', color: '#7a5a00' }
    : { background: '#f0f7f2', color: '#1b5e30' }

  if (loading) return (
    <AppLayout title="Lessons">
      <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Loading lessons…</p></div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Lessons">
      <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
    </AppLayout>
  )

  return (
    <AppLayout title="Lessons">
      <div style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>Lessons</h1>
            <p style={s.muted}>{lessons.length} lesson{lessons.length !== 1 ? 's' : ''} created</p>
          </div>
          <button style={s.btnGold} onClick={() => router.push('/teacher/lessons/new')}>
            + New Lesson
          </button>
        </div>

        {/* Filters */}
        <div style={s.filterRow}>
          {(['All', 'English', 'Mathematics', 'Science'] as SubjectFilter[]).map(f => (
            <button
              key={f}
              style={{ ...s.fBtn, ...(subjectFilter === f ? s.fBtnActive : {}) }}
              onClick={() => setSubjectFilter(f)}
            >
              {f}
            </button>
          ))}
          <input
            style={s.search}
            type="text"
            placeholder="Search title or skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={s.empty}>
            No lessons found.{' '}
            <span style={s.link} onClick={() => router.push('/teacher/lessons/new')}>
              Create your first lesson.
            </span>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Title', 'Subject', 'Skill', 'Difficulty', 'Questions', 'Created'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr
                    key={l.id}
                    style={{ ...(i % 2 === 0 ? s.trEven : s.trOdd), cursor: 'pointer' }}
                    onClick={() => router.push(`/teacher/questions?lesson_id=${l.id}`)}
                  >
                    <td style={{ ...s.td, fontWeight: 600, color: '#0d3a1b' }}>{l.title}</td>
                    <td style={s.td}>{l.subject}</td>
                    <td style={{ ...s.td, color: '#6b6b6b', fontSize: '0.82rem' }}>{l.skill_name}</td>
                    <td style={s.td}>
                      <span style={{ ...s.pill, ...diffColor(l.difficulty_level) }}>
                        {l.difficulty_level}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: 600, color: '#1b5e30' }}>
                      {l.question_count ?? 0}
                    </td>
                    <td style={{ ...s.td, fontSize: '0.8rem', color: '#6b6b6b' }}>
                      {new Date(l.created_at).toLocaleDateString('en-PH', {
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
  page:      { padding: '2rem', maxWidth: '1024px', margin: '0 auto' },
  topRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' },
  heading:   { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:     { color: '#6b6b6b', fontSize: '0.88rem', marginTop: '0.25rem' },
  btnGold:   { background: '#c9941a', color: '#0d3a1b', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  filterRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' },
  fBtn:      { background: '#fff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', color: '#6b6b6b', fontFamily: 'inherit' },
  fBtnActive:{ background: '#0d3a1b', color: '#fff', borderColor: '#0d3a1b', fontWeight: 600 },
  search:    { marginLeft: 'auto', border: '1px solid rgba(27,94,48,0.2)', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', minWidth: '220px', color: '#1a1a1a' },
  tableWrap: { borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(27,94,48,0.12)' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:        { textAlign: 'left', padding: '0.65rem 1rem', background: '#0d3a1b', color: '#e8b84b', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  trEven:    { background: '#fff' },
  trOdd:     { background: '#faf6ee' },
  td:        { padding: '0.7rem 1rem', borderBottom: '1px solid rgba(27,94,48,0.07)', color: '#1a1a1a', verticalAlign: 'middle' },
  pill:      { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },
  empty:     { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '2.5rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  link:      { color: '#1b5e30', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' },
  center:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:   { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}