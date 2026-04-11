// Student/Quiz
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

type AnswerMap = Record<string, string>   // question_id → selected option letter
type ResultMap = Record<string, boolean>  // question_id → is_correct

const TIMER_SECONDS = 60
const OPTIONS = ['A', 'B', 'C', 'D'] as const
const DIFF_ORDER: Difficulty[] = ['Basic', 'Standard', 'Advanced']

const DIFF_COLOR: Record<Difficulty, string> = {
  Basic:    '#1b5e30',
  Standard: '#c9941a',
  Advanced: '#8b1a1a',
}

function QuizInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonId = searchParams.get('lesson_id') ?? ''

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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userId   = useRef<string>('')
  const lessonRef = useRef<{ skill_name: string; subject: string; difficulty_level: string; class_id: string } | null>(null)
  

  // ── Load questions + user ────────────────────────────────
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

      // Sort by difficulty order
      const sorted = (data ?? []).sort((a, b) =>
        DIFF_ORDER.indexOf(a.difficulty) - DIFF_ORDER.indexOf(b.difficulty)
      )
      setQuestions(sorted)
      setLoading(false)
    }

    init()
  }, [lessonId])

  // ── Timer per question ───────────────────────────────────
  useEffect(() => {
    if (loading || quizDone || questions.length === 0) return

    setTimeLeft(TIMER_SECONDS)
    setShowHint(false)

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleTimeUp()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current!)
  }, [current, loading, quizDone])

  const handleTimeUp = () => {
    const q = questions[current]
    if (!q) return
    // Auto-submit as wrong if no answer selected
    if (!answers[q.id]) {
      setAnswers(prev => ({ ...prev, [q.id]: '' }))
      setResults(prev => ({ ...prev, [q.id]: false }))
      setShowHint(true)
    }
  }

  // ── Select an answer ─────────────────────────────────────
  const handleSelect = (option: string) => {
    const q = questions[current]
    if (!q) return
    if (answers[q.id] !== undefined) return // already answered

    clearInterval(timerRef.current!)

    const correct = q.correct_answer === option
    setAnswers(prev => ({ ...prev, [q.id]: option }))
    setResults(prev => ({ ...prev, [q.id]: correct }))

    if (!correct) setShowHint(true)
  }

  // ── Next question ────────────────────────────────────────
  const handleNext = async () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
    } else {
      await submitQuiz()
    }
  }

  // ── Submit quiz to Supabase + redirect ───────────────────
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

    // Pass data to result page via query string
    const correctCount = Object.values(results).filter(Boolean).length
    router.push(
      `/student/quiz/result?lesson_id=${lessonId}` +
      `&correct=${correctCount}` +
      `&total=${questions.length}` +
      `&difficulty=${lessonRef.current?.difficulty_level ?? 'Basic'}` +
      `&skill=${encodeURIComponent(lessonRef.current?.skill_name ?? '')}` +
      `&subject=${encodeURIComponent(lessonRef.current?.subject ?? '')}` +
      `&class_id=${lessonRef.current?.class_id ?? ''}`
    )
  }

  // ── Helpers ──────────────────────────────────────────────
  const q             = questions[current]
  const answered      = q ? answers[q.id] !== undefined : false
  const isLast        = current === questions.length - 1
  const timerPct      = (timeLeft / TIMER_SECONDS) * 100
  const timerColor    = timeLeft <= 10 ? '#8b1a1a' : timeLeft <= 20 ? '#c9941a' : '#1b5e30'
  const diffColor     = q ? DIFF_COLOR[q.difficulty] : '#1b5e30'

  if (loading) {
    return (
      <AppLayout title="Quiz">
        <div style={styles.centered}>Loading questions…</div>
      </AppLayout>
    )
  }

  if (!lessonId || questions.length === 0) {
    return (
      <AppLayout title="Quiz">
        <div style={styles.emptyState}>
          No approved questions found for this lesson.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Quiz">
      <div style={styles.page}>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Progress bar */}
        <div style={styles.progressRow}>
          <span style={styles.progressLabel}>
            Question {current + 1} of {questions.length}
          </span>
          <span style={{
            ...styles.diffBadge,
            background: diffColor + '18',
            color: diffColor,
            border: `1px solid ${diffColor}40`,
          }}>
            {q?.difficulty}
          </span>
        </div>

        <div style={styles.progressBarBg}>
          <div style={{
            ...styles.progressBarFill,
            width: `${((current + 1) / questions.length) * 100}%`,
          }} />
        </div>

        <div style={styles.card}>
          {/* Timer */}
          <div style={styles.timerRow}>
            <div style={styles.timerBarBg}>
              <div style={{
                ...styles.timerBarFill,
                width: `${timerPct}%`,
                background: timerColor,
                transition: 'width 1s linear, background 0.3s',
              }} />
            </div>
            <span style={{ ...styles.timerText, color: timerColor }}>
              {timeLeft}s
            </span>
          </div>

          {/* Question */}
          <p style={styles.questionText}>{q?.question_text}</p>

          {/* Options */}
          <div style={styles.optionsList}>
            {OPTIONS.map(opt => {
              const val      = q?.[`option_${opt.toLowerCase()}` as keyof Question] as string
              const selected = answers[q?.id ?? ''] === opt
              const correct  = q?.correct_answer === opt
              const revealed = answered

              let bg      = '#faf6ee'
              let border  = 'rgba(27,94,48,0.15)'
              let color   = '#1a1a1a'
              let weight  = 400

              if (revealed) {
                if (correct) {
                  bg = '#f0f7f2'; border = '#1b5e30'; color = '#0d3a1b'; weight = 600
                } else if (selected && !correct) {
                  bg = '#fdf0f0'; border = '#8b1a1a'; color = '#8b1a1a'
                }
              } else if (selected) {
                bg = '#f0f7f2'; border = '#1b5e30'
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={answered}
                  style={{
                    ...styles.optionBtn,
                    background: bg,
                    border: `1.5px solid ${border}`,
                    color,
                    fontWeight: weight,
                    cursor: answered ? 'default' : 'pointer',
                  }}
                >
                  <span style={styles.optLetter}>{opt}</span>
                  {val}
                  {revealed && correct && <span style={styles.mark}>✓</span>}
                  {revealed && selected && !correct && <span style={{ ...styles.mark, color: '#8b1a1a' }}>✗</span>}
                </button>
              )
            })}
          </div>

          {/* Hint */}
          {showHint && q?.hint && (
            <div style={styles.hintBox}>
              <span style={styles.hintLabel}>Hint</span>
              <span style={styles.hintText}>{q.hint}</span>
            </div>
          )}

          {/* Next / Submit */}
          {answered && (
            <button
              onClick={handleNext}
              disabled={submitting}
              style={styles.nextBtn}
            >
              {submitting
                ? 'Saving…'
                : isLast
                ? 'Submit quiz →'
                : 'Next question →'}
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <AppLayout title="Quiz">
        <div style={{ color: '#6b6b6b', fontSize: '0.9rem', padding: '2rem' }}>Loading…</div>
      </AppLayout>
    }>
      <QuizInner />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page:          { maxWidth: '640px' },
  centered:      { color: '#6b6b6b', fontSize: '0.9rem', padding: '2rem 0' },
  emptyState:    {
    background: '#fff',
    border: '1px solid rgba(27,94,48,0.12)',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#6b6b6b',
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
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  progressLabel: {
    fontSize: '0.78rem',
    color: '#6b6b6b',
    fontWeight: 500,
  },
  diffBadge: {
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '0.2rem 0.6rem',
    borderRadius: '4px',
  },
  progressBarBg: {
    height: '4px',
    background: 'rgba(27,94,48,0.1)',
    borderRadius: '2px',
    marginBottom: '1.25rem',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: '#1b5e30',
    borderRadius: '2px',
    transition: 'width 0.3s',
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(27,94,48,0.12)',
    borderRadius: '10px',
    padding: '1.75rem',
  },
  timerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  timerBarBg: {
    flex: 1,
    height: '6px',
    background: 'rgba(27,94,48,0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: '3px',
  },
  timerText: {
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    fontWeight: 700,
    minWidth: '28px',
    textAlign: 'right',
  },
  questionText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1a1a1a',
    lineHeight: 1.6,
    marginBottom: '1.25rem',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1.1rem',
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.65rem',
    padding: '0.7rem 1rem',
    borderRadius: '7px',
    fontSize: '0.9rem',
    lineHeight: 1.45,
    textAlign: 'left',
    transition: 'all 0.12s',
    width: '100%',
  },
  optLetter: {
    fontWeight: 700,
    flexShrink: 0,
    minWidth: '18px',
  },
  mark: {
    marginLeft: 'auto',
    fontWeight: 700,
    color: '#1b5e30',
    flexShrink: 0,
  },
  hintBox: {
    background: '#fdf8ee',
    border: '1px solid rgba(201,148,26,0.25)',
    borderRadius: '7px',
    padding: '0.7rem 1rem',
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'flex-start',
    marginBottom: '1.1rem',
    fontSize: '0.85rem',
  },
  hintLabel: {
    fontWeight: 700,
    color: '#c9941a',
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    flexShrink: 0,
    paddingTop: '2px',
  },
  hintText: {
    color: '#6b6b6b',
    lineHeight: 1.55,
  },
  nextBtn: {
    width: '100%',
    padding: '0.75rem',
    background: '#1b5e30',
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
}