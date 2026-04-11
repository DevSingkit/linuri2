// /teacher/questions/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
  is_approved: boolean
}

interface EditState {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  hint: string
}

const DIFFICULTY_ORDER: Difficulty[] = ['Basic', 'Standard', 'Advanced']

const DIFF_COLOR: Record<Difficulty, { bg: string; text: string; border: string }> = {
  Basic:    { bg: '#f0f7f2', text: '#1b5e30', border: '#1b5e30' },
  Standard: { bg: '#fdf8ee', text: '#7a5a00', border: '#c9941a' },
  Advanced: { bg: '#fdf0f0', text: '#8b1a1a', border: '#8b1a1a' },
}

function QuestionsInner() {
  const searchParams = useSearchParams()
  const lessonId = searchParams.get('lesson_id') ?? ''

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!lessonId) { setLoading(false); return }
    fetchQuestions()
  }, [lessonId])

  const fetchQuestions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('difficulty')
      .order('created_at')
    if (error) setError(error.message)
    else setQuestions(data ?? [])
    setLoading(false)
  }

  // ── Approve ──────────────────────────────────────────────
  const handleApprove = async (q: Question) => {
    setSavingId(q.id)
    const { error } = await supabase
      .from('questions')
      .update({ is_approved: true })
      .eq('id', q.id)
    if (!error) {
      setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, is_approved: true } : x))
    }
    setSavingId(null)
  }

  // ── Unapprove ────────────────────────────────────────────
  const handleUnapprove = async (q: Question) => {
    setSavingId(q.id)
    const { error } = await supabase
      .from('questions')
      .update({ is_approved: false })
      .eq('id', q.id)
    if (!error) {
      setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, is_approved: false } : x))
    }
    setSavingId(null)
  }

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) setQuestions(prev => prev.filter(x => x.id !== id))
  }

  // ── Edit ─────────────────────────────────────────────────
  const startEdit = (q: Question) => {
    setEditingId(q.id)
    setEditState({
      question_text:  q.question_text,
      option_a:       q.option_a,
      option_b:       q.option_b,
      option_c:       q.option_c,
      option_d:       q.option_d,
      correct_answer: q.correct_answer,
      hint:           q.hint,
    })
  }

  const saveEdit = async (id: string) => {
    if (!editState) return
    setSavingId(id)
    const { error } = await supabase
      .from('questions')
      .update({ ...editState, is_approved: false })
      .eq('id', id)
    if (!error) {
      setQuestions(prev => prev.map(x =>
        x.id === id ? { ...x, ...editState, is_approved: false } : x
      ))
      setEditingId(null)
      setEditState(null)
    }
    setSavingId(null)
  }

  // ── Regenerate hint ──────────────────────────────────────
  const handleRegenerateHint = async (q: Question) => {
    setRegeneratingId(q.id)
    try {
      const res = await fetch('/api/generate-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text:  q.question_text,
          correct_answer: q.correct_answer,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
        }),
      })
      const { hint } = await res.json()
      if (hint) {
        await supabase.from('questions').update({ hint }).eq('id', q.id)
        setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, hint } : x))
      }
    } catch {
      setError('Failed to regenerate hint.')
    }
    setRegeneratingId(null)
  }

  // ── Approve all ──────────────────────────────────────────
  const handleApproveAll = async () => {
    const ids = questions.filter(q => !q.is_approved).map(q => q.id)
    if (ids.length === 0) return
    const { error } = await supabase
      .from('questions')
      .update({ is_approved: true })
      .in('id', ids)
    if (!error) {
      setQuestions(prev => prev.map(x => ({ ...x, is_approved: true })))
    }
  }

  const grouped = DIFFICULTY_ORDER.reduce<Record<Difficulty, Question[]>>(
    (acc, d) => ({ ...acc, [d]: questions.filter(q => q.difficulty === d) }),
    { Basic: [], Standard: [], Advanced: [] }
  )

  const approvedCount = questions.filter(q => q.is_approved).length
  const totalCount = questions.length

  return (
    <AppLayout title="Question Review">
      <div style={styles.page}>

        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <h2 style={styles.pageTitle}>Review generated questions</h2>
            <p style={styles.pageDesc}>
              Edit, regenerate hints, then approve questions before publishing the lesson.
              Editing a question resets its approval status.
            </p>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.progressPill}>
              {approvedCount} / {totalCount} approved
            </div>
            {approvedCount < totalCount && (
              <button onClick={handleApproveAll} style={styles.approveAllBtn}>
                Approve all
              </button>
            )}
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {!lessonId && (
          <div style={styles.emptyState}>
            No lesson selected. Go to{' '}
            <a href="/teacher/lessons/new" style={{ color: '#1b5e30', fontWeight: 600 }}>
              New Lesson
            </a>{' '}
            to generate questions.
          </div>
        )}

        {loading && <div style={styles.loadingText}>Loading questions…</div>}

        {!loading && lessonId && DIFFICULTY_ORDER.map(diff => (
          <div key={diff} style={styles.group}>
            {/* Difficulty heading */}
            <div style={styles.groupHeader}>
              <span style={{
                ...styles.diffBadge,
                background: DIFF_COLOR[diff].bg,
                color:      DIFF_COLOR[diff].text,
                border:     `1px solid ${DIFF_COLOR[diff].border}`,
              }}>
                {diff}
              </span>
              <span style={styles.groupCount}>
                {grouped[diff].filter(q => q.is_approved).length} / {grouped[diff].length} approved
              </span>
            </div>

            {grouped[diff].length === 0 && (
              <div style={styles.emptyGroup}>No {diff} questions found.</div>
            )}

            {grouped[diff].map((q, idx) => {
              const isEditing = editingId === q.id
              const isSaving  = savingId === q.id
              const isRegen   = regeneratingId === q.id

              return (
                <div key={q.id} style={{
                  ...styles.card,
                  borderLeft: `3px solid ${q.is_approved ? '#1b5e30' : DIFF_COLOR[diff].border}`,
                  opacity: isSaving ? 0.7 : 1,
                }}>
                  {/* Card header */}
                  <div style={styles.cardTop}>
                    <span style={styles.qNum}>Q{idx + 1}</span>
                    {q.is_approved && (
                      <span style={styles.approvedBadge}>✓ Approved</span>
                    )}
                  </div>

                  {isEditing && editState ? (
                    /* ── EDIT MODE ── */
                    <div>
                      <div style={styles.field}>
                        <label style={styles.label}>Question</label>
                        <textarea
                          rows={3}
                          value={editState.question_text}
                          onChange={e => setEditState(s => s ? { ...s, question_text: e.target.value } : s)}
                          style={styles.textarea}
                        />
                      </div>
                      {(['a', 'b', 'c', 'd'] as const).map(opt => (
                        <div key={opt} style={styles.field}>
                          <label style={styles.label}>Option {opt.toUpperCase()}</label>
                          <input
                            type="text"
                            value={editState[`option_${opt}`]}
                            onChange={e => setEditState(s => s ? { ...s, [`option_${opt}`]: e.target.value } : s)}
                            style={styles.input}
                          />
                        </div>
                      ))}
                      <div style={styles.field}>
                        <label style={styles.label}>Correct answer</label>
                        <select
                          value={editState.correct_answer}
                          onChange={e => setEditState(s => s ? { ...s, correct_answer: e.target.value } : s)}
                          style={styles.select}
                        >
                          {['A', 'B', 'C', 'D'].map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Hint (shown on wrong answer)</label>
                        <textarea
                          rows={2}
                          value={editState.hint}
                          onChange={e => setEditState(s => s ? { ...s, hint: e.target.value } : s)}
                          style={styles.textarea}
                        />
                      </div>
                      <div style={styles.editActions}>
                        <button onClick={() => saveEdit(q.id)} disabled={isSaving} style={styles.saveBtn}>
                          {isSaving ? 'Saving…' : 'Save changes'}
                        </button>
                        <button onClick={() => { setEditingId(null); setEditState(null) }} style={styles.cancelBtn}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── VIEW MODE ── */
                    <div>
                      <p style={styles.questionText}>{q.question_text}</p>
                      <div style={styles.optionsGrid}>
                        {(['a', 'b', 'c', 'd'] as const).map(opt => {
                          const isCorrect = q.correct_answer === opt.toUpperCase()
                          return (
                            <div key={opt} style={{
                              ...styles.option,
                              background: isCorrect ? '#f0f7f2' : '#faf6ee',
                              border: `1px solid ${isCorrect ? '#1b5e30' : 'rgba(27,94,48,0.12)'}`,
                              color: isCorrect ? '#0d3a1b' : '#1a1a1a',
                              fontWeight: isCorrect ? 600 : 400,
                            }}>
                              <span style={styles.optLabel}>{opt.toUpperCase()}</span>
                              {q[`option_${opt}`]}
                              {isCorrect && <span style={styles.correctMark}> ✓</span>}
                            </div>
                          )
                        })}
                      </div>
                      <div style={styles.hintBox}>
                        <span style={styles.hintLabel}>Hint</span>
                        <span style={styles.hintText}>{q.hint}</span>
                      </div>

                      {/* Actions */}
                      <div style={styles.actions}>
                        <button
                          onClick={() => startEdit(q)}
                          disabled={isSaving}
                          style={styles.actionBtn}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRegenerateHint(q)}
                          disabled={isRegen}
                          style={styles.actionBtn}
                        >
                          {isRegen ? 'Regenerating…' : 'Regenerate hint'}
                        </button>
                        {q.is_approved ? (
                          <button
                            onClick={() => handleUnapprove(q)}
                            disabled={isSaving}
                            style={styles.unapproveBtn}
                          >
                            Unapprove
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(q)}
                            disabled={isSaving}
                            style={styles.approveBtn}
                          >
                            {isSaving ? 'Saving…' : 'Approve'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(q.id)}
                          style={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </AppLayout>
  )
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={
      <AppLayout title="Question Review">
        <div style={{ color: '#6b6b6b', fontSize: '0.9rem' }}>Loading…</div>
      </AppLayout>
    }>
      <QuestionsInner />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '780px' },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.75rem',
    gap: '1rem',
    flexWrap: 'wrap',
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
  progressPill: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#1b5e30',
    background: '#f0f7f2',
    border: '1px solid rgba(27,94,48,0.2)',
    borderRadius: '20px',
    padding: '0.3rem 0.85rem',
  },
  approveAllBtn: {
    background: '#1b5e30',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.45rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
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
  emptyState: {
    fontSize: '0.875rem',
    color: '#6b6b6b',
    padding: '2rem',
    textAlign: 'center',
    background: '#fff',
    border: '1px solid rgba(27,94,48,0.12)',
    borderRadius: '8px',
  },
  loadingText: {
    fontSize: '0.875rem',
    color: '#6b6b6b',
    padding: '1rem 0',
  },
  group: { marginBottom: '2.25rem' },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.85rem',
  },
  diffBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '0.25rem 0.7rem',
    borderRadius: '4px',
  },
  groupCount: {
    fontSize: '0.78rem',
    color: '#6b6b6b',
  },
  emptyGroup: {
    fontSize: '0.82rem',
    color: '#6b6b6b',
    padding: '0.75rem 1rem',
    background: '#fff',
    border: '1px solid rgba(27,94,48,0.1)',
    borderRadius: '6px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(27,94,48,0.12)',
    borderRadius: '8px',
    padding: '1.25rem 1.5rem',
    marginBottom: '0.85rem',
    transition: 'opacity 0.15s',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.75rem',
  },
  qNum: {
    fontFamily: 'monospace',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#6b6b6b',
    background: '#f0e9d8',
    padding: '0.15rem 0.45rem',
    borderRadius: '3px',
  },
  approvedBadge: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#1b5e30',
    background: '#f0f7f2',
    border: '1px solid rgba(27,94,48,0.2)',
    padding: '0.15rem 0.5rem',
    borderRadius: '3px',
  },
  questionText: {
    fontSize: '0.9rem',
    color: '#1a1a1a',
    lineHeight: 1.6,
    marginBottom: '0.85rem',
    fontWeight: 500,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.45rem',
    marginBottom: '0.85rem',
  },
  option: {
    fontSize: '0.82rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    lineHeight: 1.4,
    display: 'flex',
    gap: '0.4rem',
    alignItems: 'flex-start',
  },
  optLabel: {
    fontWeight: 700,
    flexShrink: 0,
  },
  correctMark: {
    color: '#1b5e30',
    fontWeight: 700,
  },
  hintBox: {
    background: '#fdf8ee',
    border: '1px solid rgba(201,148,26,0.2)',
    borderRadius: '6px',
    padding: '0.55rem 0.85rem',
    fontSize: '0.8rem',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
    marginBottom: '0.85rem',
  },
  hintLabel: {
    fontWeight: 700,
    color: '#c9941a',
    flexShrink: 0,
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    paddingTop: '1px',
  },
  hintText: {
    color: '#6b6b6b',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  actionBtn: {
    background: '#f0e9d8',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: '5px',
    padding: '0.4rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  approveBtn: {
    background: '#1b5e30',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '0.4rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  unapproveBtn: {
    background: '#f0e9d8',
    color: '#8b1a1a',
    border: '1px solid rgba(139,26,26,0.2)',
    borderRadius: '5px',
    padding: '0.4rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    background: 'none',
    color: '#8b1a1a',
    border: 'none',
    borderRadius: '5px',
    padding: '0.4rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  field: { marginBottom: '0.85rem' },
  label: {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '0.35rem',
    letterSpacing: '0.02em',
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid rgba(27,94,48,0.2)',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#1a1a1a',
    background: '#faf6ee',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid rgba(27,94,48,0.2)',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#1a1a1a',
    background: '#faf6ee',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    lineHeight: 1.6,
    boxSizing: 'border-box' as const,
  },
  select: {
    padding: '0.5rem 0.75rem',
    border: '1px solid rgba(27,94,48,0.2)',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#1a1a1a',
    background: '#faf6ee',
    outline: 'none',
  },
  editActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  saveBtn: {
    background: '#1b5e30',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '0.45rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    background: '#f0e9d8',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: '5px',
    padding: '0.45rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
}