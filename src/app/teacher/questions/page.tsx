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

const DIFF_STYLE: Record<Difficulty, { bg: string; text: string; border: string; accent: string }> = {
  Basic:    { bg: '#eaf6ef', text: '#0d3d20', border: 'rgba(26,122,64,0.25)',   accent: '#1a7a40' },
  Standard: { bg: '#fffbf0', text: '#7a5500', border: 'rgba(200,130,0,0.25)',   accent: '#f0a500' },
  Advanced: { bg: '#fff5f5', text: '#8b1a1a', border: 'rgba(139,26,26,0.22)',   accent: '#c0392b' },
}

function QuestionsInner() {
  const searchParams = useSearchParams()
  const lessonId = searchParams.get('lesson_id') ?? ''

  const [questions, setQuestions]         = useState<Question[]>([])
  const [loading, setLoading]             = useState(true)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [editState, setEditState]         = useState<EditState | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [savingId, setSavingId]           = useState<string | null>(null)
  const [error, setError]                 = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [publishing, setPublishing]   = useState(false)

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

    const { data: lesson } = await supabase
      .from('lessons')
      .select('is_published')
      .eq('id', lessonId)
      .single()
    if (lesson) setIsPublished(lesson.is_published)

  }

  const handleApprove = async (q: Question) => {
    setSavingId(q.id)
    const { error } = await supabase.from('questions').update({ is_approved: true }).eq('id', q.id)
    if (!error) setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, is_approved: true } : x))
    setSavingId(null)
  }

  const handleUnapprove = async (q: Question) => {
    setSavingId(q.id)
    const { error } = await supabase.from('questions').update({ is_approved: false }).eq('id', q.id)
    if (!error) setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, is_approved: false } : x))
    setSavingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) setQuestions(prev => prev.filter(x => x.id !== id))
  }

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
      setQuestions(prev => prev.map(x => x.id === id ? { ...x, ...editState, is_approved: false } : x))
      setEditingId(null)
      setEditState(null)
    }
    setSavingId(null)
  }

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

  const handleApproveAll = async () => {
    const ids = questions.filter(q => !q.is_approved).map(q => q.id)
    if (ids.length === 0) return
    const { error } = await supabase.from('questions').update({ is_approved: true }).in('id', ids)
    if (!error) setQuestions(prev => prev.map(x => ({ ...x, is_approved: true })))
  }
    const handlePublishToggle = async () => {
      setPublishing(true)

      if (!isPublished) {
        await supabase
          .from('questions')
          .update({ is_approved: true })
          .eq('lesson_id', lessonId)
        setQuestions(prev => prev.map(q => ({ ...q, is_approved: true })))
      }

      const { error } = await supabase
        .from('lessons')
        .update({ is_published: !isPublished })
        .eq('id', lessonId)
      if (!error) setIsPublished(v => !v)
      else setError('Failed to update publish status.')
      setPublishing(false)
    }
  const grouped = DIFFICULTY_ORDER.reduce<Record<Difficulty, Question[]>>(
    (acc, d) => ({ ...acc, [d]: questions.filter(q => q.difficulty === d) }),
    { Basic: [], Standard: [], Advanced: [] }
  )

  const approvedCount = questions.filter(q => q.is_approved).length
  const totalCount    = questions.length

  return (
    <AppLayout title="Question Review">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        :root {
          --green:       #1a7a40;
          --green-dark:  #0d3d20;
          --green-mid:   #1f6b38;
          --green-light: #eaf6ef;
          --gold:        #f0a500;
          --gold-lt:     #ffd166;
          --gold-bg:     #fffbf0;
          --cream:       #fdfaf5;
          --cream2:      #f5efe3;
          --text:        #1a1f16;
          --muted:       #6b7280;
          --border:      rgba(26,122,64,0.13);
        }
        .qr-input:focus, .qr-textarea:focus, .qr-select:focus {
          outline: none;
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(26,122,64,0.1);
        }
        .qr-action-btn:hover:not(:disabled)   { background: var(--cream2) !important; }
        .qr-approve-btn:hover:not(:disabled)  { background: var(--green-mid) !important; }
        .qr-delete-btn:hover:not(:disabled)   { background: #fff5f5 !important; color: #8b1a1a !important; }
        .qr-save-btn:hover:not(:disabled)     { background: var(--green-mid) !important; }
        .qr-approve-all:hover:not(:disabled)  { background: var(--green-mid) !important; }
        .qr-card { transition: box-shadow 0.15s; }
        .qr-card:hover { box-shadow: 0 2px 12px rgba(26,122,64,0.08); }
      `}</style>

      <div style={s.page}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Review generated questions</h1>
            <p style={s.pageDesc}>
              Edit or regenerate hints, then approve questions before publishing the lesson.
              Editing a question resets its approval status.
            </p>
          </div>
          <div style={s.headerActions}>
            <div style={{
              ...s.progressPill,
              background: approvedCount === totalCount && totalCount > 0 ? 'var(--green-light)' : 'var(--cream2)',
              color:      approvedCount === totalCount && totalCount > 0 ? 'var(--green-dark)' : 'var(--muted)',
              border:     `1.5px solid ${approvedCount === totalCount && totalCount > 0 ? 'rgba(26,122,64,0.25)' : 'var(--border)'}`,
            }}>
              {approvedCount === totalCount && totalCount > 0 ? '✓ ' : ''}{approvedCount} / {totalCount} approved
            </div>
            {approvedCount < totalCount && totalCount > 0 && (
              <button
              onClick={handlePublishToggle}
              disabled={publishing}
              style={{
                background:   isPublished ? '#fff0f0' : '#f0a500',
                color:        isPublished ? '#8b1a1a' : '#0d3d20',
                border:       isPublished ? '1.5px solid rgba(139,26,26,0.2)' : 'none',
                borderRadius: '9px',
                padding:      '0.5rem 1.1rem',
                fontSize:     '0.82rem',
                fontWeight:   700,
                fontFamily:   "'Plus Jakarta Sans', sans-serif",
                cursor:       publishing ? 'not-allowed' : 'pointer',
                opacity:      publishing ? 0.6 : 1,
                transition:   'background 0.15s',
              }}
            >
              {publishing ? '…' : isPublished ? 'Unpublish' : '🚀 Publish lesson'}
            </button>
            )}
          </div>
        </div>

        {error && (
          <div style={s.errorBox}>
            <span style={{ fontWeight: 700 }}>⚠</span> {error}
          </div>
        )}

        {!lessonId && (
          <div style={s.emptyState}>
            <p style={{ fontWeight: 700, color: 'var(--green-dark)', marginBottom: '0.35rem' }}>No lesson selected</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Go to{' '}
              <a href="/teacher/lessons/new" style={{ color: 'var(--green)', fontWeight: 600 }}>
                New Lesson
              </a>{' '}
              to generate questions.
            </p>
          </div>
        )}

        {loading && (
          <div style={s.loadingWrap}>
            <div style={s.spinner} />
            <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Loading questions…</span>
          </div>
        )}

        {!loading && lessonId && DIFFICULTY_ORDER.map(diff => {
          const dc = DIFF_STYLE[diff]
          const groupApproved = grouped[diff].filter(q => q.is_approved).length
          return (
            <div key={diff} style={s.group}>

              {/* Group header */}
              <div style={s.groupHeader}>
                <span style={{ ...s.diffBadge, background: dc.bg, color: dc.text, border: `1.5px solid ${dc.border}` }}>
                  {diff}
                </span>
                <div style={s.groupMeta}>
                  <span style={s.groupCount}>{groupApproved} / {grouped[diff].length} approved</span>
                  {grouped[diff].length > 0 && (
                    <div style={{ ...s.groupBar, background: 'rgba(26,122,64,0.1)' }}>
                      <div style={{
                        ...s.groupBarFill,
                        width: `${(groupApproved / grouped[diff].length) * 100}%`,
                        background: dc.accent,
                      }} />
                    </div>
                  )}
                </div>
              </div>

              {grouped[diff].length === 0 && (
                <div style={s.emptyGroup}>No {diff} questions found.</div>
              )}

              {grouped[diff].map((q, idx) => {
                const isEditing = editingId === q.id
                const isSaving  = savingId === q.id
                const isRegen   = regeneratingId === q.id

                return (
                  <div
                    key={q.id}
                    className="qr-card"
                    style={{
                      ...s.card,
                      borderLeft: `3px solid ${q.is_approved ? 'var(--green)' : dc.accent}`,
                      opacity: isSaving ? 0.65 : 1,
                    }}
                  >
                    {/* Card top bar */}
                    <div style={s.cardTop}>
                      <span style={s.qNum}>Q{idx + 1}</span>
                      <span style={{ ...s.diffPip, background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}>
                        {diff}
                      </span>
                      {q.is_approved && (
                        <span style={s.approvedBadge}>✓ Approved</span>
                      )}
                      {isSaving && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginLeft: 'auto' }}>Saving…</span>
                      )}
                    </div>

                    {isEditing && editState ? (
                      /* ── EDIT MODE ── */
                      <div>
                        <div style={s.editNote}>
                          Editing will reset approval status for this question.
                        </div>

                        <div style={s.field}>
                          <label style={s.label}>Question</label>
                          <textarea
                            className="qr-textarea"
                            rows={3}
                            value={editState.question_text}
                            onChange={e => setEditState(st => st ? { ...st, question_text: e.target.value } : st)}
                            style={s.textarea}
                          />
                        </div>

                        <div style={s.optionsEditGrid}>
                          {(['a', 'b', 'c', 'd'] as const).map(opt => (
                            <div key={opt} style={s.field}>
                              <label style={s.label}>Option {opt.toUpperCase()}</label>
                              <input
                                className="qr-input"
                                type="text"
                                value={editState[`option_${opt}`]}
                                onChange={e => setEditState(st => st ? { ...st, [`option_${opt}`]: e.target.value } : st)}
                                style={s.input}
                              />
                            </div>
                          ))}
                        </div>

                        <div style={{ ...s.field, maxWidth: '180px' }}>
                          <label style={s.label}>Correct answer</label>
                          <select
                            className="qr-select"
                            value={editState.correct_answer}
                            onChange={e => setEditState(st => st ? { ...st, correct_answer: e.target.value } : st)}
                            style={s.select}
                          >
                            {['A', 'B', 'C', 'D'].map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>

                        <div style={s.field}>
                          <label style={s.label}>Hint <span style={{ fontWeight: 400, color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>— shown when student answers wrong</span></label>
                          <textarea
                            className="qr-textarea"
                            rows={2}
                            value={editState.hint}
                            onChange={e => setEditState(st => st ? { ...st, hint: e.target.value } : st)}
                            style={s.textarea}
                          />
                        </div>

                        <div style={s.editActions}>
                          <button
                            className="qr-save-btn"
                            onClick={() => saveEdit(q.id)}
                            disabled={isSaving}
                            style={s.saveBtn}
                          >
                            {isSaving ? 'Saving…' : 'Save changes'}
                          </button>
                          <button
                            className="qr-action-btn"
                            onClick={() => { setEditingId(null); setEditState(null) }}
                            style={s.cancelBtn}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── VIEW MODE ── */
                      <div>
                        <p style={s.questionText}>{q.question_text}</p>

                        <div style={s.optionsGrid}>
                          {(['a', 'b', 'c', 'd'] as const).map(opt => {
                            const isCorrect = q.correct_answer === opt.toUpperCase()
                            return (
                              <div
                                key={opt}
                                style={{
                                  ...s.option,
                                  background: isCorrect ? 'var(--green-light)' : 'var(--cream)',
                                  border:     `1.5px solid ${isCorrect ? 'rgba(26,122,64,0.3)' : 'var(--border)'}`,
                                  color:      isCorrect ? 'var(--green-dark)' : 'var(--text)',
                                  fontWeight: isCorrect ? 600 : 400,
                                }}
                              >
                                <span style={{
                                  ...s.optLabel,
                                  background: isCorrect ? 'var(--green)' : 'var(--cream2)',
                                  color:      isCorrect ? '#fff' : 'var(--muted)',
                                }}>
                                  {opt.toUpperCase()}
                                </span>
                                <span>{q[`option_${opt}`]}</span>
                              </div>
                            )
                          })}
                        </div>

                        <div style={s.hintBox}>
                          <span style={s.hintLabel}>Hint</span>
                          <span style={s.hintText}>{q.hint}</span>
                        </div>

                        <div style={s.actions}>
                          <button
                            className="qr-action-btn"
                            onClick={() => startEdit(q)}
                            disabled={isSaving}
                            style={s.actionBtn}
                          >
                            Edit
                          </button>
                          <button
                            className="qr-action-btn"
                            onClick={() => handleRegenerateHint(q)}
                            disabled={isRegen || isSaving}
                            style={{ ...s.actionBtn, opacity: isRegen ? 0.6 : 1 }}
                          >
                            {isRegen ? 'Regenerating…' : 'Regenerate hint'}
                          </button>

                          {q.is_approved ? (
                            <button
                              className="qr-action-btn"
                              onClick={() => handleUnapprove(q)}
                              disabled={isSaving}
                              style={s.unapproveBtn}
                            >
                              Unapprove
                            </button>
                          ) : (
                            <button
                              className="qr-approve-btn"
                              onClick={() => handleApprove(q)}
                              disabled={isSaving}
                              style={s.approveBtn}
                            >
                              {isSaving ? 'Saving…' : '✓ Approve'}
                            </button>
                          )}

                          <button
                            className="qr-delete-btn"
                            onClick={() => handleDelete(q.id)}
                            style={s.deleteBtn}
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
          )
        })}
      </div>
    </AppLayout>
  )
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={
      <AppLayout title="Question Review">
        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading…</div>
      </AppLayout>
    }>
      <QuestionsInner />
    </Suspense>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: '800px', fontFamily: "'Plus Jakarta Sans', sans-serif" },

  pageHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' },
  pageTitle:     { fontFamily: "'DM Serif Display', serif", fontSize: '1.65rem', fontWeight: 400, color: '#0d3d20', marginBottom: '0.4rem' },
  pageDesc:      { fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 },
  headerActions: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 },

  progressPill:  { fontSize: '0.78rem', fontWeight: 700, borderRadius: '20px', padding: '0.35rem 0.9rem', transition: 'all 0.2s' },
  approveAllBtn: { background: '#0d3d20', color: '#fff', border: 'none', borderRadius: '9px', padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', transition: 'background 0.15s' },

  errorBox: { display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: '#fff5f5', border: '1.5px solid rgba(139,26,26,0.18)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.83rem', color: '#8b1a1a', marginBottom: '1.25rem', lineHeight: 1.5 },

  emptyState: { textAlign: 'center' as const, padding: '2.5rem 2rem', background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px' },

  loadingWrap: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 0' },
  spinner:     { width: '20px', height: '20px', borderRadius: '50%', border: '3px solid rgba(26,122,64,0.15)', borderTop: '3px solid #1a7a40', animation: 'spin 0.8s linear infinite' },

  group:       { marginBottom: '2.5rem' },
  groupHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' },
  diffBadge:   { fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0.3rem 0.8rem', borderRadius: '6px' },
  groupMeta:   { display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 },
  groupCount:  { fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' as const },
  groupBar:    { flex: 1, height: '4px', borderRadius: '2px', maxWidth: '120px', overflow: 'hidden' },
  groupBarFill:{ height: '100%', borderRadius: '2px', transition: 'width 0.3s' },
  emptyGroup:  { fontSize: '0.83rem', color: '#6b7280', padding: '0.85rem 1rem', background: '#fff', border: '1.5px solid rgba(26,122,64,0.1)', borderRadius: '12px' },

  card:    { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '0.85rem' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' },
  qNum:    { fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', background: '#f5efe3', padding: '0.15rem 0.5rem', borderRadius: '5px', fontFamily: 'monospace' },
  diffPip: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '0.15rem 0.5rem', borderRadius: '5px' },
  approvedBadge: { fontSize: '0.68rem', fontWeight: 700, color: '#0d3d20', background: '#eaf6ef', border: '1.5px solid rgba(26,122,64,0.2)', padding: '0.15rem 0.55rem', borderRadius: '5px' },

  questionText: { fontSize: '0.92rem', color: '#1a1f16', lineHeight: 1.65, marginBottom: '0.9rem', fontWeight: 600 },

  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.9rem' },
  option:      { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.83rem', padding: '0.55rem 0.75rem', borderRadius: '9px', lineHeight: 1.45 },
  optLabel:    { flexShrink: 0, fontWeight: 800, fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '5px', marginTop: '1px' },

  hintBox:  { display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: '#fffbf0', border: '1.5px solid rgba(200,130,0,0.2)', borderRadius: '9px', padding: '0.6rem 0.85rem', fontSize: '0.81rem', marginBottom: '1rem' },
  hintLabel:{ fontWeight: 800, color: '#f0a500', flexShrink: 0, fontSize: '0.65rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em', paddingTop: '2px' },
  hintText: { color: '#6b7280', lineHeight: 1.55 },

  actions:      { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' as const, alignItems: 'center' },
  actionBtn:    { background: '#f5efe3', color: '#1a1f16', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '7px', padding: '0.38rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', transition: 'background 0.15s' },
  approveBtn:   { background: '#0d3d20', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.38rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', transition: 'background 0.15s' },
  unapproveBtn: { background: '#fff5f5', color: '#8b1a1a', border: '1.5px solid rgba(139,26,26,0.2)', borderRadius: '7px', padding: '0.38rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', transition: 'background 0.15s' },
  deleteBtn:    { background: 'none', color: '#6b7280', border: 'none', borderRadius: '7px', padding: '0.38rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', marginLeft: 'auto', transition: 'all 0.15s' },

  editNote:      { fontSize: '0.78rem', color: '#7a5500', background: '#fffbf0', border: '1.5px solid rgba(200,130,0,0.2)', borderRadius: '8px', padding: '0.55rem 0.85rem', marginBottom: '1rem' },
  field:         { marginBottom: '0.9rem' },
  label:         { display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#0d3d20', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: '0.4rem' },
  input:         { width: '100%', padding: '0.6rem 0.85rem', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '9px', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1a1f16', background: '#fdfaf5', boxSizing: 'border-box' as const, transition: 'border-color 0.15s, box-shadow 0.15s' },
  textarea:      { width: '100%', padding: '0.6rem 0.85rem', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '9px', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1a1f16', background: '#fdfaf5', resize: 'vertical' as const, lineHeight: 1.65, boxSizing: 'border-box' as const, transition: 'border-color 0.15s, box-shadow 0.15s' },
  select:        { width: '100%', padding: '0.6rem 0.85rem', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '9px', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1a1f16', background: '#fdfaf5', boxSizing: 'border-box' as const, transition: 'border-color 0.15s, box-shadow 0.15s' },
  optionsEditGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' },
  editActions:   { display: 'flex', gap: '0.5rem', marginTop: '0.25rem' },
  saveBtn:       { background: '#0d3d20', color: '#fff', border: 'none', borderRadius: '9px', padding: '0.5rem 1.1rem', fontSize: '0.83rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', transition: 'background 0.15s' },
  cancelBtn:     { background: '#f5efe3', color: '#1a1f16', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '9px', padding: '0.5rem 1.1rem', fontSize: '0.83rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', transition: 'background 0.15s' },
}