'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { classify } from '@/lib/classifier';
import { next as getNextDifficulty } from '@/lib/adaptiveRouter';
import { upsertMastery } from '@/lib/supabase'
import { supabase } from '@/lib/supabase';
import type { MasteryLevel, Difficulty, Subject } from '@/types/linuri';

interface AdaptiveResult {
  mastery: MasteryLevel;
  nextDifficulty: Difficulty;
  incrementRegression: boolean;
  message: string;
}

function QuizResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const lessonId    = searchParams.get('lesson_id') ?? '';
  const correct     = parseInt(searchParams.get('correct') ?? '0', 10);
  const total       = parseInt(searchParams.get('total') ?? '1', 10);
  // quiz page must also pass current difficulty so the router can step up/down
  const currentDiff = (searchParams.get('difficulty') ?? 'Basic') as Difficulty;
  const classId     = searchParams.get('class_id') ?? '';
  const skillName   = searchParams.get('skill') ?? '';
  const subject     = (searchParams.get('subject') ?? 'English') as Subject;

  const [result, setResult] = useState<AdaptiveResult | null>(null);
  const [saving, setSaving] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) { router.replace('/student'); return; }

    async function processResult() {
  try {
    // 1. Classify mastery
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const mastery: MasteryLevel = classify({
      accuracy,
      attempts: 1,
      avgTime: 30,
      trend: 'stable',
    });

    // 2. Get next difficulty
    const { difficulty: nextDifficulty, incrementRegression, message } =
      getNextDifficulty(mastery, currentDiff);

    // 3. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    // 4. Fetch existing record to preserve regression count + recorded_at
    const { data: existing } = await supabase
      .from('mastery_history')
      .select('regression_count, recorded_at')
      .eq('student_id', user.id)
      .eq('skill_name', skillName)
      .eq('class_id', classId)
      .maybeSingle()

    const prevRegression = existing?.regression_count ?? 0

    // 5. Upsert mastery record
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

    setResult({ mastery, nextDifficulty, incrementRegression, message });
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Something went wrong.');
  } finally {
    setSaving(false);
  }
}
    processResult();
  }, [lessonId, correct, total, currentDiff, router]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  const masteryConfig: Record<
    MasteryLevel,
    { color: string; bg: string; border: string; icon: string }
  > = {
    Mastered:     { color: '#1b5e30', bg: '#f0f7f2', border: '#1b5e30', icon: '★' },
    Developing:   { color: '#7a5a00', bg: '#fdf8ee', border: '#c9941a', icon: '◆' },
    'Needs Help': { color: '#8b1a1a', bg: '#fdf0f0', border: '#8b1a1a', icon: '▲' },
  };

  // ── loading ───────────────────────────────────────────────────────────────

  if (saving) {
    return (
      <AppLayout title="Quiz Result">
        <div style={styles.centeredBox}>
          <div style={styles.spinner} />
          <p style={styles.mutedText}>Analysing your results…</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Quiz Result">
        <div style={styles.centeredBox}>
          <p style={{ color: '#8b1a1a', marginBottom: '1rem' }}>{error}</p>
          <button style={styles.btnPrimary} onClick={() => router.push('/student')}>
            Back to Dashboard
          </button>
        </div>
      </AppLayout>
    );
  }

  if (!result) return null;

  const cfg = masteryConfig[result.mastery];
  const nextHref = `/student/quiz?lesson_id=${lessonId}&difficulty=${result.nextDifficulty}`;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Quiz Result">
      <div style={styles.page}>
        <div style={styles.card}>

          {/* Score ring */}
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke={cfg.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill={cfg.color}>
              {score}%
            </text>
            <text x="60" y="74" textAnchor="middle" fontSize="11" fill="#6b6b6b">
              {correct}/{total}
            </text>
          </svg>

          <h1 style={styles.heading}>Quiz Complete</h1>
          <p style={styles.mutedText}>
            You answered <strong>{correct}</strong> out of <strong>{total}</strong> correctly.
          </p>

          {/* Mastery badge */}
          <div style={{ ...styles.masteryBadge, background: cfg.bg, border: `1.5px solid ${cfg.border}`, color: cfg.color }}>
            <span>{cfg.icon}</span>
            <span style={styles.badgeLabel}>Mastery Level</span>
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{result.mastery}</span>
          </div>

          {/* Adaptive message */}
          <div style={styles.messageBox}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1a1a1a', lineHeight: 1.6, textAlign: 'center' }}>
              {result.message}
            </p>
          </div>

          {/* Next difficulty */}
          <div style={styles.nextChip}>
            <span style={styles.chipLabel}>Next difficulty</span>
            <span style={styles.chipValue}>{result.nextDifficulty}</span>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button style={styles.btnPrimary}   onClick={() => router.push(nextHref)}>
              Continue Learning →
            </button>
            <button style={styles.btnSecondary} onClick={() => router.push('/student')}>
              Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#faf6ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid rgba(27,94,48,0.12)',
    padding: '2.5rem 2rem',
    maxWidth: '480px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: '1.9rem',
    color: '#0d3a1b',
    margin: 0,
    textAlign: 'center',
  },
  mutedText: {
    color: '#6b6b6b',
    fontSize: '0.9rem',
    margin: 0,
    textAlign: 'center',
  },
  masteryBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1.5rem',
    borderRadius: '10px',
    width: '100%',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  messageBox: {
    background: '#f0e9d8',
    borderRadius: '8px',
    padding: '1rem 1.25rem',
    width: '100%',
  },
  nextChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  chipLabel: {
    fontSize: '0.65rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6b6b6b',
  },
  chipValue: {
    background: '#0d3a1b',
    color: '#e8b84b',
    padding: '0.2rem 0.65rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    marginTop: '0.5rem',
  },
  btnPrimary: {
    background: '#1b5e30',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    background: 'transparent',
    color: '#6b6b6b',
    border: '1px solid rgba(27,94,48,0.2)',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'inherit',
  },
  centeredBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f0e9d8',
    borderTop: '4px solid #1b5e30',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

// ── Page export ───────────────────────────────────────────────────────────────

export default function QuizResultPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p style={{ color: '#6b6b6b' }}>Loading…</p>
      </div>
    }>
      <QuizResultContent />
    </Suspense>
  );
}