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
  const [lessons, setLessons]             = useState<LessonRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('All')
  const [search, setSearch]               = useState('')
  const [deletingId, setDeletingId]       = useState<string | null>(null)
  const [confirmId, setConfirmId]         = useState<string | null>(null)

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

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await supabase.from('questions').delete().eq('lesson_id', id)
      const { error: delError } = await supabase.from('lessons').delete().eq('id', id)
      if (delError) throw delError
      setLessons(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson.')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  const filtered = lessons.filter(l => {
    const matchSubject = subjectFilter === 'All' || l.subject === subjectFilter
    const matchSearch  = search === '' ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.skill_name.toLowerCase().includes(search.toLowerCase())
    return matchSubject && matchSearch
  })

  const subjectMeta: Record<string, { icon: string; bg: string; color: string; border: string }> = {
    English:     { icon: '📖', bg: '#eaf1fb', color: '#1a5276', border: 'rgba(26,82,118,0.18)' },
    Mathematics: { icon: '🔢', bg: '#eaf6ef', color: '#0d5c28', border: 'rgba(26,122,64,0.18)' },
    Science:     { icon: '🔬', bg: '#f5eefa', color: '#6c3483', border: 'rgba(108,52,131,0.18)' },
  }

  const diffMeta: Record<string, { bg: string; color: string }> = {
    Advanced: { bg: '#fff0f0', color: '#8b1a1a' },
    Standard: { bg: '#fffbf0', color: '#7a5500' },
    Basic:    { bg: '#eaf6ef', color: '#0d5c28' },
  }

  if (loading) return (
    <AppLayout title="Lessons">
      <style>{`@keyframes ls-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Loading lessons…</p></div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Lessons">
      <div style={s.center}>
        <div style={s.errorCard}><span style={{ fontSize: '2rem' }}>⚠️</span><p style={{ color: '#8b1a1a', fontWeight: 600, margin: 0 }}>{error}</p></div>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title="Lessons">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        @keyframes ls-spin { to { transform: rotate(360deg); } }
        @keyframes ls-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ls-tr:hover td { background: #f0f9f4 !important; }
        .ls-tab:hover:not(.ls-on) { background: #eaf6ef !important; color: #0d3d20 !important; }
        .ls-gold:hover { background: #e09b00 !important; transform: translateY(-1px); }
        .ls-search:focus { border-color: #1a7a40 !important; box-shadow: 0 0 0 3px rgba(26,122,64,0.12); }
        .ls-content { animation: ls-fade 0.25s ease both; }
        .ls-title-cell:hover { color: #1a7a40 !important; text-decoration: underline; }
      `}</style>

      <div style={s.page}>

        {/* ── Header ── */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>Teacher · Lessons</div>
            <h1 style={s.heading}>Lessons</h1>
            <p style={s.muted}>{lessons.length} lesson{lessons.length !== 1 ? 's' : ''} created</p>
          </div>
          <button className="ls-gold" style={s.btnGold} onClick={() => router.push('/teacher/lessons/new')}>
            ✚ New Lesson
          </button>
        </div>

        {/* ── Filters ── */}
        <div style={s.filterRow}>
          {(['All', 'English', 'Mathematics', 'Science'] as SubjectFilter[]).map(f => {
            const meta = f !== 'All' ? subjectMeta[f] : null
            return (
              <button
                key={f}
                className={`ls-tab${subjectFilter === f ? ' ls-on' : ''}`}
                style={{ ...s.fBtn, ...(subjectFilter === f ? s.fBtnActive : {}) }}
                onClick={() => setSubjectFilter(f)}
              >
                {meta && <span>{meta.icon}</span>} {f}
              </button>
            )
          })}
          <input
            className="ls-search"
            style={s.search}
            type="text"
            placeholder="Search title or skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* ── List ── */}
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <span style={{ fontSize: '2.5rem' }}>📚</span>
            <p style={{ margin: 0, fontWeight: 600, color: '#0d3d20' }}>
              {lessons.length === 0 ? 'No lessons yet.' : 'No lessons match your search.'}
            </p>
            {lessons.length === 0 && (
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
                <span style={s.link} onClick={() => router.push('/teacher/lessons/new')}>Create your first lesson</span> to get started.
              </p>
            )}
          </div>
        ) : (
          <div className="ls-content" style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Title', 'Subject', 'Skill', 'Difficulty', 'Questions', 'Created', ''].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const dm = diffMeta[l.difficulty_level] ?? diffMeta['Basic']
                  const sm = subjectMeta[l.subject]
                  return (
                    <tr key={l.id} className="ls-tr" style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td
                        className="ls-title-cell"
                        style={{ ...s.td, fontWeight: 700, color: '#0d3d20', cursor: 'pointer', transition: 'color 0.15s' }}
                        onClick={() => router.push(`/teacher/questions?lesson_id=${l.id}`)}
                      >
                        {l.title}
                      </td>
                      <td style={{ ...s.td, cursor: 'pointer' }} onClick={() => router.push(`/teacher/questions?lesson_id=${l.id}`)}>
                        {sm && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                            {sm.icon} {l.subject}
                          </span>
                        )}
                      </td>
                      <td style={{ ...s.td, color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer' }} onClick={() => router.push(`/teacher/questions?lesson_id=${l.id}`)}>
                        {l.skill_name}
                      </td>
                      <td style={{ ...s.td, cursor: 'pointer' }} onClick={() => router.push(`/teacher/questions?lesson_id=${l.id}`)}>
                        <span style={{ ...s.pill, background: dm.bg, color: dm.color }}>{l.difficulty_level}</span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' as const, cursor: 'pointer' }} onClick={() => router.push(`/teacher/questions?lesson_id=${l.id}`)}>
                        <span style={{ background: '#eaf6ef', color: '#0d5c28', fontWeight: 700, fontSize: '0.82rem', padding: '3px 10px', borderRadius: '20px' }}>
                          {l.question_count ?? 0}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontSize: '0.8rem', color: '#6b7280', cursor: 'pointer' }} onClick={() => router.push(`/teacher/questions?lesson_id=${l.id}`)}>
                        {new Date(l.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' as const, whiteSpace: 'nowrap' as const }}>
                        {confirmId === l.id ? (
                          <span style={s.confirmRow}>
                            <span style={s.confirmText}>Delete?</span>
                            <button style={s.btnConfirm} disabled={deletingId === l.id} onClick={() => handleDelete(l.id)}>
                              {deletingId === l.id ? '…' : 'Yes'}
                            </button>
                            <button style={s.btnCancel} onClick={() => setConfirmId(null)} disabled={deletingId === l.id}>No</button>
                          </span>
                        ) : (
                          <button style={s.btnDelete} onClick={() => setConfirmId(l.id)}>Delete</button>
                        )}
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
  )
}

const s: Record<string, React.CSSProperties> = {
  page:        { padding: '2rem', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  topRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
  breadcrumb:  { fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a7a40', marginBottom: '0.35rem' },
  heading:     { fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: '#0d3d20', margin: '0 0 0.25rem' },
  muted:       { color: '#6b7280', fontSize: '0.875rem', margin: 0 },
  btnGold:     { background: '#f0a500', color: '#0d3d20', border: 'none', borderRadius: '9px', padding: '0.65rem 1.35rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(240,165,0,0.25)', transition: 'background 0.15s, transform 0.15s' },
  filterRow:   { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, alignItems: 'center', marginBottom: '1.5rem' },
  fBtn:        { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fff', border: '1.5px solid rgba(26,122,64,0.15)', borderRadius: '9px', padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s' },
  fBtnActive:  { background: '#0d3d20', color: '#ffd166', borderColor: '#0d3d20' },
  search:      { marginLeft: 'auto', border: '1.5px solid rgba(26,122,64,0.2)', borderRadius: '9px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', minWidth: '220px', color: '#1a1f16', background: '#fdfaf5', transition: 'border-color 0.15s' },
  tableWrap:   { borderRadius: '16px', overflow: 'hidden', border: '1.5px solid rgba(26,122,64,0.13)', boxShadow: '0 2px 12px rgba(13,61,32,0.05)' },
  table:       { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.875rem' },
  th:          { textAlign: 'left' as const, padding: '0.75rem 1rem', background: '#0d3d20', color: '#ffd166', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 700 },
  trEven:      { background: '#fff' },
  trOdd:       { background: '#fdfaf5' },
  td:          { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)', color: '#1a1f16', verticalAlign: 'middle' as const },
  pill:        { fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '6px', display: 'inline-block' },
  empty:       { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '3rem 2rem', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.75rem', textAlign: 'center' as const },
  link:        { color: '#1a7a40', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' },
  center:      { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  errorCard:   { background: '#fff0f0', border: '1.5px solid rgba(155,28,28,0.18)', borderRadius: '18px', padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.75rem' },
  spinner:     { width: '40px', height: '40px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'ls-spin 0.8s linear infinite' },
  btnDelete:   { background: '#fff0f0', border: '1px solid rgba(139,26,26,0.2)', color: '#8b1a1a', borderRadius: '7px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  confirmRow:  { display: 'inline-flex', alignItems: 'center', gap: '0.35rem' },
  confirmText: { fontSize: '0.75rem', color: '#8b1a1a', fontWeight: 700 },
  btnConfirm:  { background: '#8b1a1a', color: '#fff', border: 'none', borderRadius: '5px', padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnCancel:   { background: '#eaf6ef', border: '1px solid rgba(26,122,64,0.2)', color: '#0d5c28', borderRadius: '5px', padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}