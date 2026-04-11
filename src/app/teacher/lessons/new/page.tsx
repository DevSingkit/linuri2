// /teacher/lessons/new/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'

type Subject = 'English' | 'Mathematics' | 'Science'

interface ClassOption {
  id: string
  name: string
  section: string
}

const SUBJECTS: Subject[] = ['English', 'Mathematics', 'Science']

export default function NewLessonPage() {
  const router = useRouter()

  const [classes, setClasses] = useState<ClassOption[]>([])
  const [classId, setClassId] = useState('')
  const [title, setTitle]       = useState('')
  const [subject, setSubject] = useState<Subject>('English')
  const [skillName, setSkillName] = useState('')
  const [lessonText, setLessonText] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'generating' | 'saving'>('idle')

  // Load teacher's classes for the dropdown
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('teacher_id', user.id)
        .order('name')
      if (data) {
        setClasses(data)
        if (data.length > 0) setClassId(data[0].id)
      }
    })
  }, [])

  const handleSubmit = async () => {
    setError('')

    if (!classId)              { setError('Please select a class.'); return }
    if (!title.trim())         { setError('Lesson title is required.'); return }
    if (!skillName.trim())     { setError('Skill name is required.'); return }
    if (lessonText.trim().length < 80) {
      setError('Lesson text is too short. Add more detail so Gemini can generate good questions.')
      return
    }

    try {
      // Step 1 — get current user
      setStatus('generating')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated.')

      // Step 2 — call Gemini API route to generate 15 questions
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, skillName, lessonText }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Question generation failed.')
      }

      const { questions } = await res.json()

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Gemini returned no questions. Try expanding the lesson text.')
      }

      // Step 3 — save lesson to Supabase
      setStatus('saving')
      const { data: lesson, error: lessonError } = await supabase
  .from('lessons')
  .insert({
    class_id:         classId,
    created_by:       user.id,
    title:            title.trim(),
    subject,
    skill_name:       skillName.trim(),
    lesson_text:      lessonText.trim(),
    difficulty_level: 'Standard',
    is_published:     false,
  })
  .select('id')
  .single()

      if (lessonError || !lesson) throw new Error('Failed to save lesson.')

      // Step 4 — save all 15 questions (draft, not approved)
      const rows = questions.map((q: {
        difficulty: string
        question_text: string
        option_a: string
        option_b: string
        option_c: string
        option_d: string
        correct_answer: string
        hint: string
      }) => ({
        lesson_id:      lesson.id,
        difficulty:     q.difficulty,
        question_text:  q.question_text,
        option_a:       q.option_a,
        option_b:       q.option_b,
        option_c:       q.option_c,
        option_d:       q.option_d,
        correct_answer: q.correct_answer,
        hint:           q.hint,
        is_approved:    false,
      }))

      const { error: qError } = await supabase.from('questions').insert(rows)
      if (qError) throw new Error('Lesson saved but questions failed to save.')

      // Step 5 — redirect to review page
      router.push(`/teacher/questions?lesson_id=${lesson.id}`)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'

  return (
    <AppLayout title="New Lesson">
      <div style={styles.page}>

        {/* Page header */}
        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>Create a new lesson</h2>
          <p style={styles.pageDesc}>
            Fill in the lesson details below. Gemini will generate 15 multiple-choice questions
            (5 Basic, 5 Standard, 5 Advanced) which you can review before publishing.
          </p>
        </div>

        <div style={styles.card}>

          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Class */}
          <div style={styles.field}>
            <label style={styles.label}>Class</label>
            {classes.length === 0 ? (
              <div style={styles.emptyNote}>
                You have no classes yet. Create a class first before adding lessons.
              </div>
            ) : (
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                style={styles.select}
                disabled={busy}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.section}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject */}
          <div style={styles.field}>
            <label style={styles.label}>Subject</label>
            <div style={styles.subjectRow}>
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  disabled={busy}
                  style={{
                    ...styles.subjectBtn,
                    background: subject === s ? '#1b5e30' : '#f0e9d8',
                    color:      subject === s ? '#ffffff' : '#6b6b6b',
                    fontWeight: subject === s ? 600 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={styles.field}>
            <label style={styles.label}>
              Lesson title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Fractions"
              style={styles.input}
              disabled={busy}
            />
          </div>
          {/* Skill name */}
          <div style={styles.field}>
            <label style={styles.label}>
              Skill name
              <span style={styles.labelHint}> — e.g. "Identifying the main idea"</span>
            </label>
            <input
              type="text"
              value={skillName}
              onChange={e => setSkillName(e.target.value)}
              placeholder="Enter the skill being assessed"
              style={styles.input}
              disabled={busy}
            />
          </div>

          {/* Lesson text */}
          <div style={styles.field}>
            <label style={styles.label}>
              Lesson text
              <span style={styles.labelHint}> — at least 80 characters</span>
            </label>
            <textarea
              value={lessonText}
              onChange={e => setLessonText(e.target.value)}
              placeholder={
                `Paste or type the lesson content here.\n\n` +
                `The more detail you provide, the better the generated questions will be. ` +
                `Include definitions, examples, and explanations relevant to the skill.`
              }
              rows={12}
              style={styles.textarea}
              disabled={busy}
            />
            <div style={styles.charCount}>
              {lessonText.length} characters
              {lessonText.length > 0 && lessonText.length < 80 && (
                <span style={{ color: '#8b1a1a' }}> — needs {80 - lessonText.length} more</span>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy || classes.length === 0}
            style={{
              ...styles.btn,
              opacity: busy || classes.length === 0 ? 0.65 : 1,
              cursor:  busy || classes.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'generating' && '⏳ Generating questions with Gemini…'}
            {status === 'saving'     && '💾 Saving to database…'}
            {status === 'idle'       && 'Generate questions & continue →'}
          </button>

          {/* Status hint */}
          {busy && (
            <p style={styles.statusHint}>
              {status === 'generating'
                ? "This usually takes 10–20 seconds. Please don't close the tab."
                : 'Almost done — saving your lesson and questions…'}
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '680px',
  },
  pageHeader: {
    marginBottom: '1.75rem',
  },
  pageTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: '1.5rem',
    fontWeight: 400,
    color: '#0d3a1b',
    marginBottom: '0.4rem',
  },
  pageDesc: {
    fontSize: '0.875rem',
    color: '#6b6b6b',
    lineHeight: 1.6,
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(27,94,48,0.15)',
    borderRadius: '10px',
    padding: '2rem',
  },
  errorBox: {
    background: '#fdf0f0',
    border: '1px solid rgba(139,26,26,0.2)',
    borderRadius: '6px',
    padding: '0.65rem 1rem',
    fontSize: '0.82rem',
    color: '#8b1a1a',
    marginBottom: '1.25rem',
  },
  field: {
    marginBottom: '1.4rem',
  },
  label: {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '0.45rem',
    letterSpacing: '0.02em',
  },
  labelHint: {
    fontWeight: 400,
    color: '#6b6b6b',
  },
  emptyNote: {
    fontSize: '0.82rem',
    color: '#8b1a1a',
    background: '#fdf8ee',
    border: '1px solid rgba(201,148,26,0.25)',
    borderRadius: '6px',
    padding: '0.65rem 1rem',
  },
  select: {
    width: '100%',
    padding: '0.6rem 0.85rem',
    border: '1px solid rgba(27,94,48,0.2)',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: '#1a1a1a',
    background: '#faf6ee',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  subjectRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  subjectBtn: {
    flex: 1,
    padding: '0.55rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.85rem',
    border: '1px solid rgba(27,94,48,0.2)',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: '#1a1a1a',
    background: '#faf6ee',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '0.75rem 0.85rem',
    border: '1px solid rgba(27,94,48,0.2)',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#1a1a1a',
    background: '#faf6ee',
    outline: 'none',
    resize: 'vertical' as const,
    lineHeight: 1.7,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  charCount: {
    fontSize: '0.72rem',
    color: '#6b6b6b',
    marginTop: '0.35rem',
    textAlign: 'right' as const,
  },
  btn: {
    width: '100%',
    padding: '0.75rem',
    background: '#1b5e30',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'opacity 0.15s',
  },
  statusHint: {
    textAlign: 'center' as const,
    fontSize: '0.78rem',
    color: '#6b6b6b',
    marginTop: '0.75rem',
  },
}