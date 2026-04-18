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

const DIFF_STYLE: Record<Difficulty, { bg: string; color: string; border: string; emoji: string; label: string }> = {
  Basic:    { bg: '#eaf6ef', color: '#0d3d20', border: 'rgba(26,122,64,0.25)',   emoji: '🌱', label: 'Basic'    },
  Standard: { bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.25)',   emoji: '⚡', label: 'Standard' },
  Advanced: { bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.2)',    emoji: '🔥', label: 'Advanced' },
}

const OPTION_COLORS = ['#eef4ff', '#fff0f5', '#f0faf5', '#fffbf0']
const OPTION_BORDERS = ['rgba(26,82,118,0.2)', 'rgba(155,28,90,0.2)', 'rgba(13,92,40,0.2)', 'rgba(200,130,0,0.2)']
const OPTION_TEXT = ['#1a3a6b', '#6b0d3a', '#0d3d20', '#6b4400']

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
  const [justAnswered, setJustAnswered] = useState(false)

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
    setJustAnswered(false)
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
    setJustAnswered(true)
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
  const timerColor = timeLeft <= 10 ? '#c0392b' : timeLeft <= 20 ? '#f0a500' : '#1a7a40'
  const diffStyle  = q ? DIFF_STYLE[q.difficulty] : DIFF_STYLE.Basic
  const progress   = ((current + 1) / questions.length) * 100

  if (loading) return (
    <AppLayout title="Quiz">
      <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Loading your questions…</p></div>
    </AppLayout>
  )

  if (!lessonId || questions.length === 0) return (
    <AppLayout title="Quiz">
      <div style={s.empty}>📭 No approved questions found for this lesson.</div>
    </AppLayout>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@700;800;900&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn   { 0% { transform: scale(0.92); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes correct { 0%,100% { transform: scale(1); } 40% { transform: scale(1.04); } }
        @keyframes shake   { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-5px); } 40%,80% { transform: translateX(5px); } }

        :root {
          --green: #1a7a40; --green-dark: #0d3d20; --green-light: #eaf6ef;
          --gold: #f0a500; --gold-lt: #ffd166; --gold-bg: #fffbf0;
          --white: #ffffff; --text: #1a1f16; --muted: #6b7280;
          --border: rgba(26,122,64,0.13);
          --font: 'Plus Jakarta Sans', sans-serif;
          --fun: 'Nunito', sans-serif;
        }

        .quiz-wrap { max-width: 580px; margin: 0 auto; padding: 1rem 1rem 3rem; }

        /* Top bar */
        .quiz-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1rem; gap: 0.75rem;
        }
        .quiz-q-counter {
          font-family: var(--fun); font-size: 0.85rem; font-weight: 800;
          color: #6b7280; white-space: nowrap;
        }
        .quiz-diff-badge {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; padding: 0.28rem 0.75rem;
          border-radius: 20px; white-space: nowrap;
        }

        /* Progress bar */
        .quiz-prog-bg {
          height: 10px; background: rgba(26,122,64,0.1); border-radius: 6px;
          margin-bottom: 1.25rem; overflow: hidden;
        }
        .quiz-prog-fill {
          height: 100%; border-radius: 6px;
          background: linear-gradient(90deg, #1a7a40, #2ea86b);
          transition: width 0.35s ease;
        }

        /* Card */
        .quiz-card {
          background: #fff;
          border: 2px solid rgba(26,122,64,0.13);
          border-radius: 24px;
          padding: 1.75rem 1.5rem;
          box-shadow: 0 4px 24px rgba(13,61,32,0.07);
          animation: popIn 0.3s ease both;
        }

        /* Timer */
        .quiz-timer-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.35rem; }
        .quiz-timer-bar-bg {
          flex: 1; height: 10px; background: rgba(26,122,64,0.1);
          border-radius: 6px; overflow: hidden;
        }
        .quiz-timer-fill { height: 100%; border-radius: 6px; transition: width 1s linear, background 0.3s; }
        .quiz-timer-num {
          font-family: 'Courier New', monospace; font-size: 1rem; font-weight: 900;
          min-width: 36px; text-align: right;
        }

        /* Question text */
        .quiz-q-text {
          font-family: var(--fun); font-size: clamp(1rem, 3vw, 1.15rem);
          font-weight: 800; color: #1a1f16; line-height: 1.55;
          margin-bottom: 1.35rem;
        }

        /* Options */
        .quiz-options { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }
        .quiz-opt {
          display: flex; align-items: flex-start; gap: 0.85rem;
          padding: 0.9rem 1rem; border-radius: 14px;
          font-family: var(--fun); font-size: 0.95rem; font-weight: 700;
          text-align: left; width: 100%; cursor: pointer;
          border: 2px solid transparent;
          transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
          line-height: 1.4;
        }
        .quiz-opt:not(:disabled):hover {
          transform: translateX(4px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        }
        .quiz-opt:disabled { cursor: default; }
        .quiz-opt-letter {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.82rem; font-weight: 900;
          flex-shrink: 0; margin-top: 1px;
        }
        .quiz-opt-correct { animation: correct 0.4s ease; }
        .quiz-opt-wrong   { animation: shake 0.4s ease; }

        /* Hint box */
        .quiz-hint {
          background: #fffbf0; border: 2px solid rgba(240,165,0,0.3);
          border-radius: 14px; padding: 0.9rem 1rem;
          display: flex; gap: 0.75rem; align-items: flex-start;
          margin-bottom: 1.25rem; animation: fadeUp 0.25s ease;
        }
        .quiz-hint-icon { font-size: 1.3rem; flex-shrink: 0; }
        .quiz-hint-text { font-size: 0.88rem; color: #6b4400; line-height: 1.55; font-weight: 600; }

        /* Next button */
        .quiz-next {
          width: 100%; padding: 0.95rem;
          background: linear-gradient(135deg, #0d3d20, #1a7a40);
          color: #fff; border: none; border-radius: 14px;
          font-family: var(--fun); font-size: 1rem; font-weight: 900;
          cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
          animation: fadeUp 0.25s ease;
          box-shadow: 0 4px 14px rgba(13,61,32,0.25);
        }
        .quiz-next:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(13,61,32,0.3); }
        .quiz-next:active { transform: translateY(0); }
        .quiz-next:disabled { opacity: 0.65; cursor: not-allowed; box-shadow: none; }
      `}</style>

      <AppLayout title="Quiz">
        <div className="quiz-wrap">

          {error && (
            <div style={{ background: '#fff0f0', border: '1.5px solid rgba(139,26,26,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#8b1a1a', marginBottom: '1.25rem', fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Top bar */}
          <div className="quiz-topbar">
            <span className="quiz-q-counter">Question {current + 1} / {questions.length}</span>
            <span
              className="quiz-diff-badge"
              style={{ background: diffStyle.bg, color: diffStyle.color, border: `1.5px solid ${diffStyle.border}` }}
            >
              {diffStyle.emoji} {diffStyle.label}
            </span>
          </div>

          {/* Progress bar */}
          <div className="quiz-prog-bg">
            <div className="quiz-prog-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Card */}
          <div className="quiz-card" key={current}>

            {/* Timer */}
            <div className="quiz-timer-row">
              <div className="quiz-timer-bar-bg">
                <div className="quiz-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
              </div>
              <span className="quiz-timer-num" style={{ color: timerColor }}>
                {timeLeft <= 10 ? '⏰' : ''}{timeLeft}s
              </span>
            </div>

            {/* Question */}
            <p className="quiz-q-text">{q?.question_text}</p>

            {/* Options */}
            <div className="quiz-options">
              {OPTIONS.map((opt, idx) => {
                const val      = q?.[`option_${opt.toLowerCase()}` as keyof Question] as string
                const selected = answers[q?.id ?? ''] === opt
                const correct  = q?.correct_answer === opt
                const revealed = answered

                let bg       = OPTION_COLORS[idx]
                let border   = OPTION_BORDERS[idx]
                let color    = OPTION_TEXT[idx]
                let letterBg = 'rgba(0,0,0,0.07)'
                let extraClass = ''

                if (revealed) {
                  if (correct) {
                    bg = '#eaf6ef'; border = '#1a7a40'; color = '#0d3d20'
                    letterBg = '#1a7a40'
                    extraClass = 'quiz-opt-correct'
                  } else if (selected && !correct) {
                    bg = '#fff0f0'; border = '#c0392b'; color = '#7a0d0d'
                    letterBg = '#c0392b'
                    extraClass = 'quiz-opt-wrong'
                  } else {
                    bg = '#f5f5f5'; border = 'rgba(0,0,0,0.08)'; color = '#9ca3af'
                    letterBg = 'rgba(0,0,0,0.05)'
                  }
                }

                return (
                  <button
                    key={opt}
                    className={`quiz-opt ${extraClass}`}
                    onClick={() => handleSelect(opt)}
                    disabled={answered}
                    style={{ background: bg, borderColor: border, color }}
                  >
                    <span className="quiz-opt-letter" style={{ background: letterBg, color: revealed && correct ? '#fff' : revealed && selected && !correct ? '#fff' : 'inherit' }}>
                      {revealed && correct ? '✓' : revealed && selected && !correct ? '✗' : opt}
                    </span>
                    {val}
                  </button>
                )
              })}
            </div>

            {/* Hint */}
            {showHint && q?.hint && (
              <div className="quiz-hint">
                <span className="quiz-hint-icon">💡</span>
                <span className="quiz-hint-text">{q.hint}</span>
              </div>
            )}

            {/* Next */}
            {answered && (
              <button className="quiz-next" onClick={handleNext} disabled={submitting}>
                {submitting ? '⏳ Saving…' : isLast ? '🎉 Submit Quiz' : 'Next Question →'}
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
        <div style={{ color: '#6b7280', fontSize: '0.9rem', padding: '2rem', textAlign: 'center' }}>Loading…</div>
      </AppLayout>
    }>
      <QuizInner />
    </Suspense>
  )
}

const s: Record<string, React.CSSProperties> = {
  muted:   { color: '#6b7280', fontSize: '0.9rem', fontFamily: "'Nunito', sans-serif", fontWeight: 700 },
  empty:   { background: '#fff', border: '2px dashed rgba(26,122,64,0.2)', borderRadius: '18px', padding: '2.5rem', textAlign: 'center', fontSize: '1rem', color: '#6b7280', fontFamily: "'Nunito', sans-serif", fontWeight: 700 },
  center:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner: { width: '40px', height: '40px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}