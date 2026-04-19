'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase, getClassesByTeacher, createLesson, saveQuestions } from '@/lib/supabase'
import type { Subject, Difficulty } from '@/types/linuri'

const SUBJECTS: Subject[] = ['English', 'Mathematics', 'Science']
const DIFFICULTIES: Difficulty[] = ['Basic', 'Standard', 'Advanced']

interface ClassOption { id: string; name: string; section: string }

type Step = 'form' | 'generating' | 'done'

export default function NewLessonPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const presetClassId = searchParams.get('class_id') ?? ''

  const [classes,    setClasses]    = useState<ClassOption[]>([])
  const [classId,    setClassId]    = useState(presetClassId)
  const [title,      setTitle]      = useState('')
  const [subject,    setSubject]    = useState<Subject>('English')
  const [skillName,  setSkillName]  = useState('')
  const [lessonText, setLessonText] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('Basic')

  const [step,       setStep]       = useState<Step>('form')
  const [error,      setError]      = useState('')
  const [genCount,   setGenCount]   = useState(0)

  // Load teacher's classes
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      const { data } = await getClassesByTeacher(user.id)
      const list = (data ?? []) as ClassOption[]
      setClasses(list)
      if (!presetClassId && list.length > 0) setClassId(list[0].id)
    })
  }, [router, presetClassId])

  const handleSubmit = async () => {
    setError('')

    if (!title.trim())      { setError('Lesson title is required.'); return }
    if (!skillName.trim())  { setError('Target skill is required.'); return }
    if (!lessonText.trim()) { setError('Lesson content is required.'); return }
    if (lessonText.trim().length < 100) { setError('Lesson content is too short. Add more detail (min 100 characters).'); return }
    if (!classId)           { setError('Please select a class.'); return }

    setStep('generating')

    try {
      // 1. Get teacher id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated.')

      // 2. Save lesson to DB
      const { data: lesson, error: lessonError } = await createLesson({
        created_by:      user.id,
        class_id:        classId,
        title:           title.trim(),
        subject,
        skill_name:      skillName.trim(),
        lesson_text:     lessonText.trim(),
        difficulty_level: difficulty,
        is_published:    false,
      })
      if (lessonError || !lesson) throw new Error(lessonError?.message ?? 'Failed to save lesson.')

      // 3. Call Gemini API route
      const res = await fetch('/api/generate-questions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          subject,
          skillName: skillName.trim(),
          lessonText: lessonText.trim(),
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error ?? 'Question generation failed.')
      }

      const { questions } = await res.json()

      // 4. Save questions linked to lesson
      const questionsToSave = questions.map((q: {
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

      const { error: saveError } = await saveQuestions(questionsToSave)
      if (saveError) throw new Error(saveError.message)

      setGenCount(questions.length)
      setStep('done')

      // Redirect to question review after short delay
      setTimeout(() => {
        router.push(`/teacher/questions?lesson_id=${lesson.id}`)
      }, 2200)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStep('form')
    }
  }

  // ── Generating state ──────────────────────────────────────────────
  if (step === 'generating') return (
    <AppLayout title="New Lesson">
      <style>{`@keyframes nl-spin { to { transform: rotate(360deg); } } @keyframes nl-pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
      <div style={s.center}>
        <div style={s.genCard}>
          <div style={s.spinner} />
          <div style={s.genTitle}>Generating questions…</div>
          <p style={s.genDesc}>Gemini AI is creating 15 questions across Basic, Standard, and Advanced difficulty. This takes a few seconds.</p>
          <div style={s.genDots}>
            {[0,1,2].map(i => (
              <div key={i} style={{ ...s.dot, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )

  // ── Done state ────────────────────────────────────────────────────
  if (step === 'done') return (
    <AppLayout title="New Lesson">
      <div style={s.center}>
        <div style={{ ...s.genCard, borderColor: 'rgba(26,122,64,0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
          <div style={s.genTitle}>{genCount} questions generated!</div>
          <p style={s.genDesc}>Redirecting you to review and approve the questions…</p>
        </div>
      </div>
    </AppLayout>
  )

  // ── Form ──────────────────────────────────────────────────────────
  return (
    <AppLayout title="New Lesson">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        @keyframes nl-spin  { to { transform: rotate(360deg); } }
        @keyframes nl-fade  { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        @keyframes nl-pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        .nl-input:focus  { border-color:#1a7a40 !important; box-shadow:0 0 0 3px rgba(26,122,64,0.10) !important; outline:none; }
        .nl-select:focus { border-color:#1a7a40 !important; box-shadow:0 0 0 3px rgba(26,122,64,0.10) !important; outline:none; }
        .nl-submit:hover:not(:disabled) { background:#1a7a40 !important; transform:translateY(-1px); }
        .nl-cancel:hover { background:#eaf6ef !important; }
        .nl-diff-btn:hover:not(.nl-diff-on) { border-color:#1a7a40 !important; color:#0d3d20 !important; background:#f0f9f4 !important; }
        .nl-page { animation: nl-fade 0.25s ease both; }
      `}</style>

      <div className="nl-page" style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>Teacher · New Lesson</div>
            <h1 style={s.heading}>New Lesson</h1>
            <p style={s.muted}>Fill in the lesson details. Gemini AI will generate 15 questions automatically.</p>
          </div>
          <button className="nl-cancel" style={s.btnCancel} onClick={() => router.push('/teacher/lessons')}>
            ← Back to Lessons
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form card */}
        <div style={s.formCard}>

          {/* Lesson Title */}
          <div style={s.field}>
            <label style={s.label}>Lesson Title <span style={s.req}>*</span></label>
            <input
              className="nl-input"
              style={s.input}
              type="text"
              placeholder="e.g. Fractions and Their Operations"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Class + Subject row */}
          <div style={s.fieldRow}>
            <div style={s.field}>
              <label style={s.label}>Class <span style={s.req}>*</span></label>
              <select
                className="nl-select"
                style={s.select}
                value={classId}
                onChange={e => setClassId(e.target.value)}
              >
                {classes.length === 0 && <option value="">No classes yet</option>}
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                ))}
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>Subject <span style={s.req}>*</span></label>
              <select
                className="nl-select"
                style={s.select}
                value={subject}
                onChange={e => setSubject(e.target.value as Subject)}
              >
                {SUBJECTS.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Skill */}
          <div style={s.field}>
            <label style={s.label}>Target Skill <span style={s.req}>*</span></label>
            <input
              className="nl-input"
              style={s.input}
              type="text"
              placeholder="e.g. Adding and subtracting fractions with unlike denominators"
              value={skillName}
              onChange={e => setSkillName(e.target.value)}
            />
          </div>

          {/* Difficulty */}
          <div style={s.field}>
            <label style={s.label}>Starting Difficulty <span style={s.req}>*</span></label>
            <div style={s.diffRow}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  className={`nl-diff-btn${difficulty === d ? ' nl-diff-on' : ''}`}
                  style={{
                    ...s.diffBtn,
                    ...(difficulty === d ? {
                      background: d === 'Basic' ? '#eaf6ef' : d === 'Standard' ? '#fffbf0' : '#fff0f0',
                      color:      d === 'Basic' ? '#0d5c28' : d === 'Standard' ? '#7a5500' : '#8b1a1a',
                      borderColor:d === 'Basic' ? 'rgba(26,122,64,0.4)' : d === 'Standard' ? 'rgba(200,130,0,0.4)' : 'rgba(155,28,28,0.4)',
                      fontWeight: 700,
                    } : {}),
                  }}
                  onClick={() => setDifficulty(d)}
                  type="button"
                >
                  {d === 'Basic' ? '🟢' : d === 'Standard' ? '🟡' : '🔴'} {d}
                </button>
              ))}
            </div>
            <p style={s.hint}>This sets the default difficulty stored with the lesson. Gemini generates all 3 difficulty levels regardless.</p>
          </div>

          {/* Lesson Text */}
          <div style={s.field}>
            <label style={s.label}>
              Lesson Content <span style={s.req}>*</span>
              <span style={{ ...s.hint, display: 'inline', marginLeft: '0.5rem' }}>
                — {lessonText.length} characters {lessonText.length < 100 ? '(min 100)' : '✓'}
              </span>
            </label>
            <textarea
              className="nl-input"
              style={{ ...s.input, ...s.textarea }}
              placeholder="Paste or type the full lesson content here. The more detail you provide, the better the questions will be."
              value={lessonText}
              onChange={e => setLessonText(e.target.value)}
            />
          </div>

          {/* Info strip */}
          <div style={s.infoStrip}>
            <span style={{ fontSize: '1.1rem' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, color: '#0d3d20', fontSize: '0.9rem', marginBottom: '2px' }}>What happens next</div>
              <div style={{ fontSize: '0.83rem', color: '#6b7280', lineHeight: 1.55 }}>
                Gemini AI will generate <strong>15 multiple-choice questions</strong> (5 Basic · 5 Standard · 5 Advanced) based on your lesson content. You will then review and approve each question before students can see them.
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="nl-submit"
              style={s.btnSubmit}
              onClick={handleSubmit}
              disabled={step !== 'form'}
            >
              Generate Questions →
            </button>
            <button
              className="nl-cancel"
              style={s.btnCancel}
              onClick={() => router.push('/teacher/lessons')}
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:       { padding: '2.5rem', maxWidth: '760px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
  topRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
  breadcrumb: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a7a40', marginBottom: '0.35rem' },
  heading:    { fontFamily: "'DM Serif Display', serif", fontSize: '2.1rem', color: '#0d3d20', margin: '0 0 0.25rem' },
  muted:      { color: '#6b7280', fontSize: '0.95rem', margin: 0 },

  errorBox:   { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: '#fff0f0', border: '1px solid rgba(139,26,26,0.18)', borderRadius: '10px', padding: '0.85rem 1.1rem', fontSize: '0.9rem', color: '#8b1a1a', marginBottom: '1.5rem', lineHeight: 1.5 },

  formCard:   { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '20px', padding: '2rem', boxShadow: '0 2px 12px rgba(13,61,32,0.05)', display: 'flex', flexDirection: 'column', gap: '1.35rem' },

  field:      { display: 'flex', flexDirection: 'column', gap: '0.45rem' },
  fieldRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label:      { fontSize: '0.73rem', fontWeight: 700, color: '#0d3d20', letterSpacing: '0.07em', textTransform: 'uppercase' },
  req:        { color: '#8b1a1a' },
  hint:       { fontSize: '0.78rem', color: '#9ca3af', margin: '0.2rem 0 0', lineHeight: 1.5 },

  input:      { border: '1.5px solid rgba(26,122,64,0.2)', borderRadius: '10px', padding: '0.8rem 1rem', fontSize: '0.95rem', fontFamily: 'inherit', color: '#1a1f16', background: '#fdfaf5', transition: 'border-color 0.15s, box-shadow 0.15s', width: '100%', boxSizing: 'border-box' },
  textarea:   { minHeight: '220px', resize: 'vertical', lineHeight: 1.65 },
  select:     { border: '1.5px solid rgba(26,122,64,0.2)', borderRadius: '10px', padding: '0.8rem 1rem', fontSize: '0.95rem', fontFamily: 'inherit', color: '#1a1f16', background: '#fdfaf5', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', width: '100%' },

  diffRow:    { display: 'flex', gap: '0.6rem', flexWrap: 'wrap' },
  diffBtn:    { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1.5px solid rgba(26,122,64,0.15)', borderRadius: '9px', padding: '0.55rem 1.1rem', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit', transition: 'all 0.13s' },

  infoStrip:  { display: 'flex', alignItems: 'flex-start', gap: '0.85rem', background: '#f0f9f4', border: '1px solid rgba(26,122,64,0.18)', borderRadius: '12px', padding: '1rem 1.25rem' },

  btnSubmit:  { background: '#0d3d20', color: '#ffd166', border: 'none', borderRadius: '10px', padding: '0.85rem 2rem', fontWeight: 700, fontSize: '0.97rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s, transform 0.1s', letterSpacing: '-0.01em' },
  btnCancel:  { background: '#fff', color: '#0d3d20', border: '1.5px solid rgba(26,122,64,0.25)', borderRadius: '10px', padding: '0.85rem 1.5rem', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' },

  center:     { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  genCard:    { background: '#fff', border: '1.5px solid rgba(26,122,64,0.15)', borderRadius: '20px', padding: '3rem 2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(13,61,32,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  genTitle:   { fontFamily: "'DM Serif Display', serif", fontSize: '1.5rem', color: '#0d3d20' },
  genDesc:    { fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.6, margin: 0 },
  genDots:    { display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' },
  dot:        { width: '8px', height: '8px', borderRadius: '50%', background: '#1a7a40', animation: 'nl-pulse 1.2s ease-in-out infinite' },
  spinner:    { width: '48px', height: '48px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'nl-spin 0.85s linear infinite' },
}