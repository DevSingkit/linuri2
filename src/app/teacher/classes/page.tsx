// /teacher/classes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase, getClassesByTeacher, createClass, getStudentsByClass } from '@/lib/supabase'
import type { Class } from '@/types/linuri'

interface ClassWithCount extends Class {
  studentCount: number
}

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function TeacherClassesPage() {
  const router = useRouter()

  const [teacherId, setTeacherId]       = useState<string | null>(null)
  const [classes, setClasses]           = useState<ClassWithCount[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  // Form state
  const [name, setName]       = useState('')
  const [section, setSection] = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)
  const [successMsg, setSuccessMsg]     = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }
        setTeacherId(user.id)
        await fetchClasses(user.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load classes.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function fetchClasses(tid: string) {
    const { data, error: fetchError } = await getClassesByTeacher(tid)
    if (fetchError) throw fetchError
    const classList = data ?? []

    // Get student count per class
    const withCounts: ClassWithCount[] = await Promise.all(
      classList.map(async (cls) => {
        const { data: enrollData } = await getStudentsByClass(cls.id)
        return { ...cls, studentCount: enrollData?.length ?? 0 }
      })
    )
    setClasses(withCounts)
  }

  async function handleCreate() {
  if (!name.trim() || !section.trim()) {
    setFormError('Class name and section are required.')
    return
  }
    if (!teacherId) return

     setSubmitting(true)
  setFormError(null)
  setSuccessMsg(null)

    try {
    const joinCode = generateJoinCode()
    const { error: createError } = await createClass({
      teacher_id: teacherId,
      name:       name.trim(),
      section:    section.trim(),
      join_code:  joinCode,
    })
    if (createError) throw createError

      setSuccessMsg(`Class "${name.trim()} — ${section.trim()}" created! Join code: ${joinCode}`)
    setName('')
    setSection('')
    await fetchClasses(teacherId)
  } catch (err) {
    setFormError(err instanceof Error ? err.message : 'Failed to create class.')
  } finally {
    setSubmitting(false)
  }
}
  // ── loading / error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="My Classes">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading classes…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="My Classes">
        <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
      </AppLayout>
    )
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="My Classes">
      <div style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>My Classes</h1>
            <p style={s.muted}>Create and manage your class sections</p>
          </div>
          <button style={s.btnOutline} onClick={() => router.push('/teacher')}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Create class form */}
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Create a New Class</h2>
          <p style={s.muted}>A unique join code will be generated automatically for students to enrol.</p>

          <div style={s.formRow}>
            <div style={s.fieldGroup}>
  <label style={s.label}>Class Name</label>
  <input
    style={s.input}
    type="text"
    placeholder="e.g. Grade 6"
    value={name}
    onChange={e => setName(e.target.value)}
    onKeyDown={e => e.key === 'Enter' && handleCreate()}
    disabled={submitting}
  />
</div>
<div style={s.fieldGroup}>
  <label style={s.label}>Section</label>
  <input
    style={s.input}
    type="text"
    placeholder="e.g. Sampaguita"
    value={section}
    onChange={e => setSection(e.target.value)}
    onKeyDown={e => e.key === 'Enter' && handleCreate()}
    disabled={submitting}
  />
</div>
            <button
              style={{ ...s.btnPrimary, alignSelf: 'flex-end', opacity: submitting ? 0.7 : 1 }}
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? 'Creating…' : '+ Create Class'}
            </button>
          </div>

          {formError && <p style={s.errorMsg}>{formError}</p>}
          {successMsg && (
            <div style={s.successBox}>
              <span style={s.successIcon}>✓</span>
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Class list */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>
            Existing Classes
            <span style={s.countBadge}>{classes.length}</span>
          </h2>

          {classes.length === 0 ? (
            <div style={s.empty}>
              No classes yet. Create one above to get started.
            </div>
          ) : (
            <div style={s.classGrid}>
              {classes.map(cls => (
                <div key={cls.id} style={s.classCard}>
                  <div style={s.classCardTop}>
                    <span style={s.classCardName}>{cls.name} — {cls.section}</span>
                    <span style={s.studentCount}>
                      {cls.studentCount} {cls.studentCount === 1 ? 'student' : 'students'}
                    </span>
                  </div>

                  <div style={s.codeRow}>
                    <span style={s.codeLabel}>Join Code</span>
                    <span style={s.codeValue}>{cls.join_code}</span>
                  </div>

                  <div style={s.classCardFooter}>
                    <span style={s.classDate}>
                      Created {new Date(cls.created_at).toLocaleDateString('en-PH', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                    <button
                      style={s.btnSmall}
                      onClick={() => router.push(`/teacher/lessons/new?class_id=${cls.id}`)}
                    >
                      + New Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </AppLayout>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:          { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  topRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' },
  heading:       { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:         { color: '#6b6b6b', fontSize: '0.88rem', margin: '0.25rem 0 0' },
  btnOutline:    { background: 'transparent', color: '#1b5e30', border: '1.5px solid #1b5e30', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },

  formCard:      { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '12px', padding: '1.5rem 1.75rem', marginBottom: '2rem' },
  formTitle:     { fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', color: '#0d3a1b', margin: '0 0 0.25rem' },
  formRow:       { display: 'flex', gap: '1rem', alignItems: 'flex-start', marginTop: '1.25rem', flexWrap: 'wrap' },
  fieldGroup:    { display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '220px' },
  label:         { fontSize: '0.75rem', fontWeight: 600, color: '#0d3a1b', letterSpacing: '0.05em', textTransform: 'uppercase' },
  input:         { border: '1.5px solid rgba(27,94,48,0.2)', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.9rem', fontFamily: 'inherit', color: '#1a1a1a', background: '#faf6ee', outline: 'none' },
  btnPrimary:    { background: '#1b5e30', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  errorMsg:      { color: '#8b1a1a', fontSize: '0.85rem', marginTop: '0.75rem' },
  successBox:    { display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f0f7f2', border: '1px solid #1b5e30', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '0.75rem', fontSize: '0.88rem', color: '#1b5e30', fontWeight: 500 },
  successIcon:   { fontWeight: 700, fontSize: '1rem' },

  section:       { marginBottom: '2rem' },
  sectionTitle:  { fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', color: '#0d3a1b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' },
  countBadge:    { background: '#0d3a1b', color: '#e8b84b', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '10px' },

  classGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  classCard:     { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '10px', padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  classCardTop:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  classCardName: { fontWeight: 600, fontSize: '1rem', color: '#0d3a1b' },
  studentCount:  { fontSize: '0.75rem', color: '#6b6b6b', background: '#f0e9d8', padding: '0.15rem 0.5rem', borderRadius: '4px' },
  codeRow:       { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  codeLabel:     { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6b6b' },
  codeValue:     { background: '#0d3a1b', color: '#e8b84b', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, padding: '0.2rem 0.75rem', borderRadius: '4px', letterSpacing: '0.12em' },
  classCardFooter:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  classDate:     { fontSize: '0.75rem', color: '#6b6b6b' },
  btnSmall:      { background: '#c9941a', color: '#0d3a1b', border: 'none', borderRadius: '6px', padding: '0.35rem 0.85rem', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' },

  empty:         { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '2rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  center:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:       { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}