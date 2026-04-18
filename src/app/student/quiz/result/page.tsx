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

const MASTERY_CFG: Record<MasteryLevel, {
  color: string; bg: string; border: string; ringColor: string;
  emoji: string; headline: string; sub: string; headerBg: string; headerText: string;
}> = {
  'Mastered':   {
    color: '#0d3d20', bg: '#eaf6ef', border: 'rgba(26,122,64,0.25)', ringColor: '#1a7a40',
    emoji: '🏆', headline: 'Amazing work!', sub: "You've mastered this skill!",
    headerBg: 'linear-gradient(135deg,#0d3d20,#1a7a40)', headerText: '#ffd166',
  },
  'Developing': {
    color: '#7a5500', bg: '#fffbf0', border: 'rgba(200,130,0,0.25)', ringColor: '#f0a500',
    emoji: '📈', headline: "You're getting there!", sub: 'Keep practising to reach mastery.',
    headerBg: 'linear-gradient(135deg,#7a5500,#c48a00)', headerText: '#fff8e1',
  },
  'Needs Help': {
    color: '#8b1a1a', bg: '#fff0f0', border: 'rgba(155,28,28,0.2)', ringColor: '#c0392b',
    emoji: '💪', headline: "Don't give up!", sub: "Every attempt makes you stronger.",
    headerBg: 'linear-gradient(135deg,#7a0d0d,#c0392b)', headerText: '#ffe5e5',
  },
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
      <div style={s.center}>
        <div style={s.spinner} />
        <p style={{ color: '#6b7280', fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1rem' }}>
          🔍 Analysing your results…
        </p>
      </div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Quiz Result">
      <div style={s.center}>
        <p style={{ color: '#8b1a1a', marginBottom: '1rem', fontWeight: 700 }}>{error}</p>
        <button style={s.btnBack} onClick={() => router.push('/student')}>← Back to Dashboard</button>
      </div>
    </AppLayout>
  )

  if (!result) return null

  const cfg = MASTERY_CFG[result.mastery]
  const circumference = 2 * Math.PI * 52

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@700;800;900&display=swap');
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn    { 0% { transform: scale(0.88); opacity: 0; } 60% { transform: scale(1.03); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes bounce   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes ringDraw { from { stroke-dashoffset: ${circumference}; } to { stroke-dashoffset: ${circumference * (1 - score / 100)}; } }
        @keyframes confetti {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(720deg); opacity: 0; }
        }

        :root {
          --fun: 'Nunito', sans-serif;
          --font: 'Plus Jakarta Sans', sans-serif;
        }

        .res-page {
          display: flex; align-items: flex-start; justify-content: center;
          min-height: 80vh; padding: 1.5rem 1rem 4rem;
        }
        .res-card {
          background: #fff;
          border-radius: 28px;
          border: 2px solid rgba(26,122,64,0.12);
          max-width: 460px; width: 100%;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(13,61,32,0.1);
          animation: popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
        }

        /* Header band */
        .res-header {
          padding: 1.75rem 1.5rem 1.5rem;
          display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
          position: relative; overflow: hidden;
        }
        .res-header-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 22px 22px;
          pointer-events: none;
        }
        .res-big-emoji {
          font-size: 3.5rem; line-height: 1;
          animation: bounce 2s ease-in-out infinite;
          position: relative;
        }
        .res-headline {
          font-family: var(--fun); font-size: 1.6rem; font-weight: 900;
          text-align: center; margin: 0; position: relative;
        }
        .res-header-sub {
          font-size: 0.88rem; font-weight: 700; opacity: 0.75;
          text-align: center; margin: 0; position: relative;
        }

        /* Body */
        .res-body {
          padding: 1.5rem;
          display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
        }

        /* Score row */
        .res-score-row {
          display: flex; align-items: center; gap: 1.25rem;
          background: #fdfaf5; border: 2px solid rgba(26,122,64,0.1);
          border-radius: 18px; padding: 1.1rem 1.35rem; width: 100%;
        }

        /* Mastery badge */
        .res-mastery {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.9rem 1.25rem; border-radius: 16px; width: 100%;
          justify-content: center;
          animation: fadeUp 0.35s ease 0.2s both;
        }

        /* Message box */
        .res-message {
          background: #fdfaf5; border: 2px solid rgba(26,122,64,0.1);
          border-radius: 16px; padding: 1rem 1.25rem; width: 100%;
          font-size: 0.9rem; color: #1a1f16; line-height: 1.6;
          text-align: center; font-weight: 600; font-family: var(--font);
          animation: fadeUp 0.35s ease 0.3s both;
        }

        /* Next diff chip */
        .res-next-chip {
          display: flex; align-items: center; gap: 0.6rem;
          animation: fadeUp 0.35s ease 0.35s both;
        }

        /* Action buttons */
        .res-actions { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; animation: fadeUp 0.35s ease 0.4s both; }
        .res-btn-primary {
          background: linear-gradient(135deg, #0d3d20, #1a7a40);
          color: #fff; border: none; border-radius: 14px;
          padding: 1rem; font-family: var(--fun); font-size: 1rem; font-weight: 900;
          cursor: pointer; width: 100%;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(13,61,32,0.25);
        }
        .res-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(13,61,32,0.3); }
        .res-btn-secondary {
          background: transparent; color: #6b7280;
          border: 2px solid rgba(26,122,64,0.15); border-radius: 14px;
          padding: 0.9rem; font-family: var(--fun); font-size: 0.95rem; font-weight: 800;
          cursor: pointer; width: 100%;
          transition: border-color 0.15s, color 0.15s;
        }
        .res-btn-secondary:hover { border-color: rgba(26,122,64,0.4); color: #0d3d20; }
      `}</style>

      <AppLayout title="Quiz Result">
        <div className="res-page">
          <div className="res-card">

            {/* Coloured header */}
            <div className="res-header" style={{ background: cfg.headerBg }}>
              <div className="res-header-dots" />
              <span className="res-big-emoji">{cfg.emoji}</span>
              <h1 className="res-headline" style={{ color: cfg.headerText }}>{cfg.headline}</h1>
              <p className="res-header-sub" style={{ color: cfg.headerText }}>{cfg.sub}</p>
            </div>

            <div className="res-body">

              {/* Score ring + stats */}
              <div className="res-score-row">
                <svg width="110" height="110" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={cfg.ringColor} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - score / 100)}
                    transform="rotate(-90 60 60)"
                    style={{ animation: 'ringDraw 1s ease forwards' }}
                  />
                  <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="900"
                    fill={cfg.color} fontFamily="'Nunito', sans-serif">{score}%</text>
                  <text x="60" y="73" textAnchor="middle" fontSize="11" fill="#6b7280"
                    fontFamily="'Plus Jakarta Sans', sans-serif">{correct}/{total}</text>
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Score</p>
                  <p style={{ margin: '0 0 0.5rem', fontFamily: "'Nunito', sans-serif", fontSize: '1.5rem', fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
                    {correct} <span style={{ fontSize: '1rem', color: '#9ca3af' }}>/ {total}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>questions correct</p>
                </div>
              </div>

              {/* Mastery badge */}
              <div className="res-mastery" style={{ background: cfg.bg, border: `2px solid ${cfg.border}` }}>
                <span style={{ fontSize: '1.4rem' }}>{cfg.emoji}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, opacity: 0.7 }}>Mastery Level</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.2rem', color: cfg.color }}>{result.mastery}</span>
                </div>
              </div>

              {/* Message */}
              <div className="res-message">{result.message}</div>

              {/* Next difficulty */}
              <div className="res-next-chip">
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280' }}>Next difficulty</span>
                <span style={{ background: '#0d3d20', color: '#ffd166', padding: '0.28rem 0.85rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700 }}>
                  {result.nextDifficulty}
                </span>
              </div>

              {/* Actions */}
              <div className="res-actions">
                <button className="res-btn-primary" onClick={() => router.push(nextHref)}>
                  🚀 Continue Learning
                </button>
                <button className="res-btn-secondary" onClick={() => router.push('/student')}>
                  ← Back to Dashboard
                </button>
              </div>

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
        <p style={{ color: '#6b7280', fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>Loading…</p>
      </div>
    }>
      <QuizResultContent />
    </Suspense>
  )
}

const s: Record<string, React.CSSProperties> = {
  center:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner: { width: '40px', height: '40px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  btnBack: { background: '#0d3d20', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" },
}