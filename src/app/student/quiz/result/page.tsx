// src/app/student/quiz/result/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { classify } from '@/lib/classifier'
import { next as getNextDifficulty } from '@/lib/adaptiveRouter'
import { upsertMastery, supabase } from '@/lib/supabase'
import type { MasteryLevel, Difficulty, Subject } from '@/types/linuri'

interface AdaptiveResult {
  mastery: MasteryLevel
  nextDifficulty: Difficulty
  incrementRegression: boolean
  message: string
}

const MASTERY_STYLE: Record<MasteryLevel, { color: string; bg: string; border: string; icon: string; ringColor: string }> = {
  'Mastered':   { color: '#0d3d20', bg: '#eaf6ef', border: 'rgba(26,122,64,0.25)', icon: '★', ringColor: '#1a7a40' },
  'Developing': { color: '#7a5500', bg: '#fffbf0', border: 'rgba(200,130,0,0.25)', icon: '◆', ringColor: '#f0a500' },
  'Needs Help': { color: '#8b1a1a', bg: '#fff0f0', border: 'rgba(155,28,28,0.2)',  icon: '▲', ringColor: '#8b1a1a' },
}

function QuizResultContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const lessonId    = searchParams.get('lesson_id') ?? ''
  const correct     = parseInt(searchParams.get('correct') ?? '0', 10)
  const total       = parseInt(searchParams.get('total') ?? '1', 10)
  const currentDiff = (searchParams.get('difficulty') ?? 'Basic') as Difficulty
  const classId     = searchParams.get('class_id') ?? ''
  const skillName   = searchParams.get('skill') ?? ''
  const subject     = (searchParams.get('subject') ?? 'English') as Subject

  const [result, setResult] = useState<AdaptiveResult | null>(null)
  const [saving, setSaving] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!lessonId) { router.replace('/student'); return }

    async function processResult() {
      try {
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
        const mastery: MasteryLevel = classify({ accuracy, attempts: 1, avgTime: 30, trend: 'stable' })
        const { difficulty: nextDifficulty, incrementRegression, message } = getNextDifficulty(mastery, currentDiff)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Not authenticated')

        const { data: existing } = await supabase
          .from('mastery_history')
          .select('regression_count, recorded_at')
          .eq('student_id', user.id)
          .eq('skill_name', skillName)
          .eq('class_id', classId)
          .maybeSingle()

        const prevRegression = existing?.regression_count ?? 0

        const { error: upsertError } = await upsertMastery({
          student_id:       user.id,
          class_id:         classId,
          lesson_id:        lessonId,
          skill_name:       skillName,
          subject:          subject,
          difficulty_level: currentDiff,
          mastery_level:    mastery,
          correct_count:    correct,
          total_questions:  total,
          regression_count: incrementRegression ? prevRegression + 1 : prevRegression,
          recorded_at:      existing?.recorded_at ?? new Date().toISOString(),
          updated_at:       new Date().toISOString(),
        })
        if (upsertError) throw upsertError

        setResult({ mastery, nextDifficulty, incrementRegression, message })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        setSaving(false)
      }
    }
    processResult()
  }, [lessonId, correct, total, currentDiff, router])

  const score    = total > 0 ? Math.round((correct / total) * 100) : 0
  const nextHref = `/student/quiz?lesson_id=${lessonId}&difficulty=${result?.nextDifficulty}`

  if (saving) return (
    <AppLayout title="Quiz Result">
      <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Analysing your results…</p></div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Quiz Result">
      <div style={s.center}>
        <p style={{ color: '#8b1a1a', marginBottom: '1rem' }}>{error}</p>
        <button style={s.btnPrimary} onClick={() => router.push('/student')}>Back to Dashboard</button>
      </div>
    </AppLayout>
  )

  if (!result) return null

  const cfg = MASTERY_STYLE[result.mastery]
  const circumference = 2 * Math.PI * 50

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        :root {
          --green: #1a7a40; --green-dark: #0d3d20; --green-light: #eaf6ef;
          --gold-lt: #ffd166; --cream: #fdfaf5; --white: #ffffff;
          --text: #1a1f16; --muted: #6b7280; --border: rgba(26,122,64,0.13);
          --font: 'Plus Jakarta Sans', sans-serif;
        }
        .result-card { animation: fadeUp 0.4s ease both; }
        .btn-primary { background: var(--green-dark); color: #fff; border: none; border-radius: 9px; padding: 0.85rem; font-size: 0.95rem; font-weight: 700; font-family: var(--font); cursor: pointer; width: 100%; transition: background 0.15s; }
        .btn-primary:hover { background: var(--green); }
        .btn-secondary { background: transparent; color: var(--muted); border: 1.5px solid var(--border); border-radius: 9px; padding: 0.75rem; font-size: 0.9rem; font-weight: 600; font-family: var(--font); cursor: pointer; width: 100%; transition: border-color 0.15s; }
        .btn-secondary:hover { border-color: var(--green); color: var(--green-dark); }
      `}</style>

      <AppLayout title="Quiz Result">
        <div style={s.page}>
          <div className="result-card" style={s.card}>

            {/* Score ring */}
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={cfg.ringColor} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - score / 100)}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill={cfg.color} fontFamily="'Plus Jakarta Sans', sans-serif">
                {score}%
              </text>
              <text x="60" y="74" textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="'Plus Jakarta Sans', sans-serif">
                {correct}/{total}
              </text>
            </svg>

            <h1 style={s.heading}>Quiz Complete!</h1>
            <p style={s.muted}>
              You answered <strong>{correct}</strong> out of <strong>{total}</strong> correctly.
            </p>

            {/* Mastery badge */}
            <div style={{ ...s.masteryBadge, background: cfg.bg, border: `1.5px solid ${cfg.border}`, color: cfg.color }}>
              <span style={{ fontSize: '1.1rem' }}>{cfg.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>Mastery Level</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{result.mastery}</span>
              </div>
            </div>

            {/* Adaptive message */}
            <div style={s.messageBox}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1a1f16', lineHeight: 1.6, textAlign: 'center' }}>
                {result.message}
              </p>
            </div>

            {/* Next difficulty chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>
                Next difficulty
              </span>
              <span style={{ background: '#0d3d20', color: '#ffd166', padding: '0.22rem 0.7rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>
                {result.nextDifficulty}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <button className="btn-primary" onClick={() => router.push(nextHref)}>Continue Learning →</button>
              <button className="btn-secondary" onClick={() => router.push('/student')}>Back to Dashboard</button>
            </div>

          </div>
        </div>
      </AppLayout>
    </>
  )
}

export default function QuizResultPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p style={{ color: '#6b7280' }}>Loading…</p>
      </div>
    }>
      <QuizResultContent />
    </Suspense>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:         { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '2rem 1rem' },
  card:         { background: '#fff', borderRadius: '22px', border: '1.5px solid rgba(26,122,64,0.13)', padding: '2.5rem 2rem', maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', boxShadow: '0 4px 32px rgba(13,61,32,0.08)' },
  heading:      { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3d20', margin: 0, textAlign: 'center' },
  muted:        { color: '#6b7280', fontSize: '0.9rem', margin: 0, textAlign: 'center' },
  masteryBadge: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.5rem', borderRadius: '14px', width: '100%', justifyContent: 'center' },
  messageBox:   { background: '#fdfaf5', border: '1.5px solid rgba(26,122,64,0.1)', borderRadius: '12px', padding: '1rem 1.25rem', width: '100%' },
  btnPrimary:   { background: '#0d3d20', color: '#fff', border: 'none', borderRadius: '9px', padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  center:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:      { width: '36px', height: '36px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}