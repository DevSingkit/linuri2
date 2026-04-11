// src/app/student/quiz/page.tsx
'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'

type Difficulty = 'Basic' | 'Standard' | 'Advanced'

interface Question {
  id: string
  lesson_id: string
  difficulty: Difficulty
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  hint: string
}

type AnswerMap = Record<string, string>
type ResultMap = Record<string, boolean>

const TIMER_SECONDS = 60
const OPTIONS = ['A', 'B', 'C', 'D'] as const
const DIFF_ORDER: Difficulty[] = ['Basic', 'Standard', 'Advanced']

const DIFF_STYLE: Record<Difficulty, { bg: string; color: string; border: string }> = {
  Basic:    { bg: '#eaf6ef', color: '#0d3d20', border: 'rgba(26,122,64,0.25)' },
  Standard: { bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.25)' },
  Advanced: { bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.2)' },
}

function QuizInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const lessonId     = searchParams.get('lesson_id') ?? ''

  const [questions, setQuestions]   = useState<Question[]>([])
  const [current, setCurrent]       = useState(0)
  const [answers, setAnswers]       = useState<AnswerMap>({})
  const [results, setResults]       = useState<ResultMap>({})
  const [showHint, setShowHint]     = useState(false)
  const [timeLeft, setTimeLeft]     = useState(TIMER_SECONDS)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [quizDone, setQuizDone]     = useState(false)

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const userId    = useRef<string>('')
  const lessonRef = useRef<{ skill_name: string; subject: string; difficulty_level: string; class_id: string } | null>(null)

  useEffect(() => {
    if (!lessonId) { setLoading(false); return }
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      userId.current = user.id

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('is_approved', true)
        .order('difficulty')
        .order('created_at')

      if (error) { setError(error.message); setLoading(false); return }

      const { data: lessonData } = await supabase
        .from('lessons')
        .select('skill_name, subject, difficulty_level, class_id')
        .eq('id', lessonId)
        .single()
      lessonRef.current = lessonData

      const sorted = (data ?? []).sort((a, b) =>
        DIFF_ORDER.indexOf(a.difficulty) - DIFF_ORDER.indexOf(b.difficulty)
      )
      setQuestions(sorted)
      setLoading(false)
    }
    init()
  }, [lessonId])

  useEffect(() => {
    if (loading || quizDone || questions.length === 0) return
    setTimeLeft(TIMER_SECONDS)
    setShowHint(false)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); handleTimeUp(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [current, loading, quizDone])

  const handleTimeUp = () => {
    const q = questions[current]
    if (!q) return
    if (!answers[q.id]) {
      setAnswers(prev => ({ ...prev, [q.id]: '' }))
      setResults(prev => ({ ...prev, [q.id]: false }))
      setShowHint(true)
    }
  }

  const handleSelect = (option: string) => {
    const q = questions[current]
    if (!q || answers[q.id] !== undefined) return
    clearInterval(timerRef.current!)
    const correct = q.correct_answer === option
    setAnswers(prev => ({ ...prev, [q.id]: option }))
    setResults(prev => ({ ...prev, [q.id]: correct }))
    if (!correct) setShowHint(true)
  }

  const handleNext = async () => {
    if (current < questions.length - 1) { setCurrent(c => c + 1) }
    else { await submitQuiz() }
  }

  const submitQuiz = async () => {
    setSubmitting(true)
    const rows = questions.map(q => ({
      student_id:           userId.current,
      lesson_id:            q.lesson_id,
      question_id:          q.id,
      selected_answer:      answers[q.id] || 'A',
      is_correct:           results[q.id] ?? false,
      difficulty_attempted: q.difficulty,
    }))
    const { error } = await supabase.from('quiz_attempts').insert(rows)
    if (error) { setError(error.message); setSubmitting(false); return }
    const correctCount = Object.values(results).filter(Boolean).length
    router.push(
      `/student/quiz/result?lesson_id=${lessonId}` +
      `&correct=${correctCount}&total=${questions.length}` +
      `&difficulty=${lessonRef.current?.difficulty_level ?? 'Basic'}` +
      `&skill=${encodeURIComponent(lessonRef.current?.skill_name ?? '')}` +
      `&subject=${encodeURIComponent(lessonRef.current?.subject ?? '')}` +
      `&class_id=${lessonRef.current?.class_id ?? ''}`
    )
  }

  const q          = questions[current]
  const answered   = q ? answers[q.id] !== undefined : false
  const isLast     = current === questions.length - 1
  const timerPct   = (timeLeft / TIMER_SECONDS) * 100
  const timerColor = timeLeft <= 10 ? '#8b1a1a' : timeLeft <= 20 ? '#f0a500' : '#1a7a40'
  const diffStyle  = q ? DIFF_STYLE[q.difficulty] : DIFF_STYLE.Basic

  if (loading) return (
    <AppLayout title="Quiz">
      <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Loading questions…</p></div>
    </AppLayout>
  )

  if (!lessonId || questions.length === 0) return (
    <AppLayout title="Quiz">
      <div style={s.empty}>No approved questions found for this lesson.</div>
    </AppLayout>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        :root {
          --green: #1a7a40; --green-dark: #0d3d20; --green-light: #eaf6ef;
          --gold: #f0a500; --gold-bg: #fffbf0; --white: #ffffff;
          --text: #1a1f16; --muted: #6b7280; --border: rgba(26,122,64,0.13);
          --font: 'Plus Jakarta Sans', sans-serif;
        }
        .opt-btn { display: flex; align-items: flex-start; gap: 0.7rem; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.9rem; line-height: 1.45; text-align: left; width: 100%; transition: all 0.12s; font-family: var(--font); cursor: pointer; }
        .opt-btn:not(:disabled):hover { filter: brightness(0.97); transform: translateX(2px); }
        .next-btn { width: 100%; padding: 0.78rem; background: var(--green-dark); color: #fff; border: none; border-radius: 9px; font-size: 0.93rem; font-weight: 700; font-family: var(--font); cursor: pointer; margin-top: 0.25rem; transition: background 0.15s; }
        .next-btn:hover:not(:disabled) { background: var(--green); }
        .next-btn:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>

      <AppLayout title="Quiz">
        <div style={s.page}>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '9px', padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#8b1a1a', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          {/* Progress row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>
              Question {current + 1} of {questions.length}
            </span>
            <span style={{ ...s.diffBadge, background: diffStyle.bg, color: diffStyle.color, border: `1px solid ${diffStyle.border}` }}>
              {q?.difficulty}
            </span>
          </div>

          {/* Progress bar */}
          <div style={s.progressBarBg}>
            <div style={{ ...s.progressBarFill, width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>

          {/* Card */}
          <div style={s.card}>

            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={s.timerBarBg}>
                <div style={{ ...s.timerBarFill, width: `${timerPct}%`, background: timerColor, transition: 'width 1s linear, background 0.3s' }} />
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: timerColor, minWidth: '28px', textAlign: 'right' }}>
                {timeLeft}s
              </span>
            </div>

            {/* Question */}
            <p style={s.questionText}>{q?.question_text}</p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.1rem' }}>
              {OPTIONS.map(opt => {
                const val      = q?.[`option_${opt.toLowerCase()}` as keyof Question] as string
                const selected = answers[q?.id ?? ''] === opt
                const correct  = q?.correct_answer === opt
                const revealed = answered

                let bg     = '#fdfaf5'
                let border = 'rgba(26,122,64,0.13)'
                let color  = '#1a1f16'
                let weight = 400

                if (revealed) {
                  if (correct) { bg = '#eaf6ef'; border = '#1a7a40'; color = '#0d3d20'; weight = 700 }
                  else if (selected && !correct) { bg = '#fff0f0'; border = '#8b1a1a'; color = '#8b1a1a' }
                } else if (selected) { bg = '#eaf6ef'; border = '#1a7a40' }

                return (
                  <button
                    key={opt}
                    className="opt-btn"
                    onClick={() => handleSelect(opt)}
                    disabled={answered}
                    style={{ background: bg, border: `1.5px solid ${border}`, color, fontWeight: weight, cursor: answered ? 'default' : 'pointer' }}
                  >
                    <span style={{ fontWeight: 800, flexShrink: 0, minWidth: '18px', color: revealed && correct ? '#1a7a40' : 'inherit' }}>{opt}</span>
                    {val}
                    {revealed && correct && <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#1a7a40', flexShrink: 0 }}>✓</span>}
                    {revealed && selected && !correct && <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#8b1a1a', flexShrink: 0 }}>✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Hint */}
            {showHint && q?.hint && (
              <div style={s.hintBox}>
                <span style={s.hintLabel}>Hint</span>
                <span style={{ color: '#6b7280', lineHeight: 1.55, fontSize: '0.85rem' }}>{q.hint}</span>
              </div>
            )}

            {/* Next */}
            {answered && (
              <button className="next-btn" onClick={handleNext} disabled={submitting}>
                {submitting ? 'Saving…' : isLast ? 'Submit quiz →' : 'Next question →'}
              </button>
            )}

          </div>
        </div>
      </AppLayout>
    </>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <AppLayout title="Quiz">
        <div style={{ color: '#6b7280', fontSize: '0.9rem', padding: '2rem' }}>Loading…</div>
      </AppLayout>
    }>
      <QuizInner />
    </Suspense>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:          { maxWidth: '640px' },
  muted:         { color: '#6b7280', fontSize: '0.9rem' },
  diffBadge:     { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.22rem 0.65rem', borderRadius: '20px' },
  progressBarBg: { height: '5px', background: 'rgba(26,122,64,0.1)', borderRadius: '3px', marginBottom: '1.35rem', overflow: 'hidden' },
  progressBarFill:{ height: '100%', background: '#1a7a40', borderRadius: '3px', transition: 'width 0.3s' },
  card:          { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '1.75rem' },
  timerBarBg:    { flex: 1, height: '6px', background: 'rgba(26,122,64,0.1)', borderRadius: '3px', overflow: 'hidden' },
  timerBarFill:  { height: '100%', borderRadius: '3px' },
  questionText:  { fontSize: '1rem', fontWeight: 600, color: '#1a1f16', lineHeight: 1.6, marginBottom: '1.25rem' },
  hintBox:       { background: '#fffbf0', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '9px', padding: '0.75rem 1rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start', marginBottom: '1.1rem' },
  hintLabel:     { fontWeight: 700, color: '#f0a500', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, paddingTop: '2px' },
  empty:         { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '14px', padding: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' },
  center:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:       { width: '36px', height: '36px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}