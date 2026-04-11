// /teacher/lessons/new/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'

type Subject = 'English' | 'Mathematics' | 'Science'
type Difficulty = 'Basic' | 'Standard' | 'Advanced'

interface ClassOption {
  id: string
  name: string
  section: string
}

interface GeneratedQuestion {
  difficulty: Difficulty
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  hint: string
}

const SUBJECTS: Subject[] = ['English', 'Mathematics', 'Science']
const ACCEPTED = '.pdf,.docx,.txt,.png,.jpg,.jpeg,.pptx,.xlsx'

const SUBJECT_ICONS: Record<Subject, string> = {
  English: '📖',
  Mathematics: '🔢',
  Science: '🔬',
}

export default function NewLessonPage() {
  const router = useRouter()

  const [classes, setClasses]         = useState<ClassOption[]>([])
  const [classId, setClassId]         = useState('')
  const [title, setTitle]             = useState('')
  const [subject, setSubject]         = useState<Subject>('English')
  const [skillName, setSkillName]     = useState('')
  const [lessonText, setLessonText]   = useState('')
  const [file, setFile]               = useState<File | null>(null)
  const [activeTab, setActiveTab]     = useState<'text' | 'file'>('text')
  const [error, setError]             = useState('')
  const [status, setStatus]           = useState<'idle' | 'uploading' | 'generating' | 'saving'>('idle')
  const [isPublished, setIsPublished] = useState(false)
  const fileInputRef                  = useRef<HTMLInputElement>(null)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const switchTab = (tab: 'text' | 'file') => {
    setActiveTab(tab)
    if (tab === 'file') fileInputRef.current?.click()
    else removeFile()
  }

  const handleSubmit = async () => {
    setError('')
    if (!classId)          { setError('Please select a class.'); return }
    if (!title.trim())     { setError('Lesson title is required.'); return }
    if (!skillName.trim()) { setError('Skill name is required.'); return }
    if (!file && lessonText.trim().length < 80) {
      setError('Lesson text must be at least 80 characters, or upload a file instead.')
      return
    }

    const geminiText = lessonText.trim().length >= 80
      ? lessonText.trim()
      : `This is a ${subject} lesson about "${skillName}". ` +
        `The teacher has uploaded a file with the full lesson content. ` +
        `Please generate grade-appropriate questions based on the skill: ${skillName}.`

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated.')

      let fileUrl: string | null = null
      if (file) {
        setStatus('uploading')
        const ext      = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('lesson-files')
          .upload(fileName, file, { upsert: false })
        if (uploadError) throw new Error('File upload failed: ' + uploadError.message)
        const { data: urlData } = supabase.storage.from('lesson-files').getPublicUrl(fileName)
        fileUrl = urlData.publicUrl
      }

      setStatus('generating')
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, skillName, lessonText: geminiText }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Question generation failed.')
      }
      const { questions } = await res.json()
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Gemini returned no questions. Try adding lesson text for better results.')
      }

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
          is_published:     isPublished,
          ...(fileUrl ? { file_url: fileUrl } : {}),
        })
        .select('id')
        .single()
      if (lessonError || !lesson) throw new Error('Failed to save lesson.')

      const rows = questions.map((q: GeneratedQuestion) => ({
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

      router.push(`/teacher/questions?lesson_id=${lesson.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'

  return (
    <AppLayout title="New Lesson">
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
        .nl-select:focus, .nl-input:focus, .nl-textarea:focus {
          outline: none;
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(26,122,64,0.1);
        }
        .nl-subject-btn:hover { filter: brightness(0.95); }
        .nl-tab:hover { background: var(--cream2) !important; }
        .nl-dropzone:hover { border-color: var(--green) !important; background: var(--green-light) !important; }
        .nl-submit-btn:hover:not(:disabled) { background: var(--green-mid) !important; }
        .nl-remove-btn:hover { background: #fde8e8 !important; }
      `}</style>

      <div style={s.page}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <h1 style={s.pageTitle}>Create a new lesson</h1>
          <p style={s.pageDesc}>
            Fill in the details below. Gemini will generate 15 multiple-choice questions
            (5 Basic · 5 Standard · 5 Advanced) for you to review before publishing.
          </p>
        </div>

        {/* Card */}
        <div style={s.card}>

          {error && (
            <div style={s.errorBox}>
              <span style={s.errorIcon}>⚠</span>
              {error}
            </div>
          )}

          {/* Class */}
          <div style={s.field}>
            <label style={s.label}>Class</label>
            {classes.length === 0 ? (
              <div style={s.emptyNote}>
                You have no classes yet. Create a class first before adding a lesson.
              </div>
            ) : (
              <select
                className="nl-select"
                value={classId}
                onChange={e => setClassId(e.target.value)}
                style={s.select}
                disabled={busy}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                ))}
              </select>
            )}
          </div>

          {/* Subject */}
          <div style={s.field}>
            <label style={s.label}>Subject</label>
            <div style={s.subjectRow}>
              {SUBJECTS.map(sub => {
                const active = subject === sub
                return (
                  <button
                    key={sub}
                    className="nl-subject-btn"
                    onClick={() => setSubject(sub)}
                    disabled={busy}
                    style={{
                      ...s.subjectBtn,
                      background:  active ? 'var(--green-dark)' : 'var(--cream2)',
                      color:       active ? '#fff' : 'var(--muted)',
                      border:      active ? '1.5px solid var(--green-dark)' : '1.5px solid var(--border)',
                      fontWeight:  active ? 700 : 500,
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{SUBJECT_ICONS[sub]}</span>
                    {sub}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={s.divider} />

          {/* Lesson title */}
          <div style={s.field}>
            <label style={s.label}>Lesson title</label>
            <input
              className="nl-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Fractions"
              style={s.input}
              disabled={busy}
            />
          </div>

          {/* Skill name */}
          <div style={s.field}>
            <label style={s.label}>
              Skill name
              <span style={s.labelHint}> — e.g. "Identifying the main idea"</span>
            </label>
            <input
              className="nl-input"
              type="text"
              value={skillName}
              onChange={e => setSkillName(e.target.value)}
              placeholder="Enter the skill being assessed"
              style={s.input}
              disabled={busy}
            />
          </div>

          {/* Divider */}
          <div style={s.divider} />

          {/* Lesson content */}
          <div style={s.field}>
            <label style={s.label}>Lesson content</label>

            <div style={s.infoBox}>
              <span style={s.infoIcon}>ℹ</span>
              <span>
                Type the lesson text <strong>or</strong> upload a file for students to download.
                If you upload without text, Gemini will base questions on the skill name.
                For best results, provide both.
              </span>
            </div>

            {/* Tabs */}
            <div style={s.tabRow}>
              {(['text', 'file'] as const).map(tab => {
                const active  = activeTab === tab
                const checked = tab === 'text'
                  ? lessonText.trim().length >= 80
                  : !!file
                return (
                  <button
                    key={tab}
                    className="nl-tab"
                    type="button"
                    onClick={() => switchTab(tab)}
                    disabled={busy}
                    style={{
                      ...s.tab,
                      background:   active ? 'var(--green-dark)' : '#fff',
                      color:        active ? 'var(--gold-lt)' : 'var(--muted)',
                      borderColor:  active ? 'var(--green-dark)' : 'var(--border)',
                      fontWeight:   active ? 700 : 500,
                    }}
                  >
                    {tab === 'text' ? '✏️ Type lesson text' : '📎 Upload file'}
                    {checked && (
                      <span style={s.tabBadge}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Text tab */}
            {activeTab === 'text' && (
              <>
                <textarea
                  className="nl-textarea"
                  value={lessonText}
                  onChange={e => setLessonText(e.target.value)}
                  placeholder={
                    'Paste or type the lesson content here.\n\n' +
                    'The more detail you provide, the better the generated questions will be. ' +
                    'Include definitions, examples, and explanations relevant to the skill.'
                  }
                  rows={12}
                  style={s.textarea}
                  disabled={busy}
                />
                <div style={s.charRow}>
                  <span style={{ color: 'var(--muted)' }}>{lessonText.length} characters</span>
                  {lessonText.length > 0 && lessonText.length < 80 && (
                    <span style={{ color: '#8b1a1a', fontWeight: 600 }}>
                      {80 - lessonText.length} more needed
                    </span>
                  )}
                  {lessonText.length >= 80 && (
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Good to go</span>
                  )}
                </div>
              </>
            )}

            {/* File tab */}
            {activeTab === 'file' && (
              <>
                {file ? (
                  <div style={s.filePreview}>
                    <div style={s.fileIconWrap}>📄</div>
                    <div style={s.fileInfo}>
                      <span style={s.fileName}>{file.name}</span>
                      <span style={s.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      className="nl-remove-btn"
                      style={s.removeBtn}
                      onClick={removeFile}
                      disabled={busy}
                      type="button"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="nl-dropzone"
                    style={s.dropZone}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📁</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--green-dark)', margin: '0 0 0.25rem' }}>
                      Click to choose a file
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                      PDF, Word, PowerPoint, Excel, images, or plain text
                    </p>
                  </div>
                )}

                {/* Optional text below file */}
                <div style={{ marginTop: '1.25rem' }}>
                  <label style={{ ...s.label, color: 'var(--muted)' }}>
                    Lesson text
                    <span style={s.labelHint}> — optional when a file is uploaded</span>
                  </label>
                  <textarea
                    className="nl-textarea"
                    value={lessonText}
                    onChange={e => setLessonText(e.target.value)}
                    placeholder="Optionally add text here to improve question quality…"
                    rows={5}
                    style={{ ...s.textarea, opacity: 0.85 }}
                    disabled={busy}
                  />
                  {lessonText.length > 0 && (
                    <div style={s.charRow}>
                      <span style={{ color: 'var(--muted)' }}>{lessonText.length} characters</span>
                      {lessonText.length >= 80 && (
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Will be used for question generation</span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={busy}
            />
          </div>

          {/* Divider */}
          <div style={s.divider} />

          {/* Publish toggle */}
          <div style={s.publishRow}>
            <div style={s.publishToggleWrap}>
              <input
                type="checkbox"
                id="publish"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                disabled={busy}
                style={s.checkbox}
              />
              <div
                style={{
                  ...s.toggleTrack,
                  background: isPublished ? 'var(--green)' : 'rgba(26,122,64,0.15)',
                }}
                onClick={() => !busy && setIsPublished(v => !v)}
              >
                <div style={{
                  ...s.toggleThumb,
                  transform: isPublished ? 'translateX(18px)' : 'translateX(2px)',
                }} />
              </div>
            </div>
            <div>
              <label htmlFor="publish" style={s.publishLabel}>
                Publish immediately
              </label>
              <p style={s.publishHint}>Students can see and take quizzes as soon as the lesson is saved.</p>
            </div>
          </div>

          {/* Submit */}
          <button
            className="nl-submit-btn"
            onClick={handleSubmit}
            disabled={busy || classes.length === 0}
            style={{
              ...s.submitBtn,
              opacity: busy || classes.length === 0 ? 0.6 : 1,
              cursor:  busy || classes.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'uploading'  && '⬆️  Uploading file…'}
            {status === 'generating' && '⏳  Generating questions with Gemini…'}
            {status === 'saving'     && '💾  Saving to database…'}
            {status === 'idle'       && 'Generate questions & continue →'}
          </button>

          {busy && (
            <p style={s.statusHint}>
              {status === 'uploading'
                ? 'Uploading your file to storage…'
                : status === 'generating'
                ? "This usually takes 10–20 seconds. Please don't close the tab."
                : 'Almost done — saving your lesson and questions…'}
            </p>
          )}

        </div>
      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:        { maxWidth: '680px', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  pageHeader:  { marginBottom: '1.75rem' },
  pageTitle:   { fontFamily: "'DM Serif Display', serif", fontSize: '1.65rem', fontWeight: 400, color: '#0d3d20', marginBottom: '0.4rem' },
  pageDesc:    { fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 },

  card:        { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' },

  errorBox:    { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#fff5f5', border: '1.5px solid rgba(139,26,26,0.18)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.83rem', color: '#8b1a1a', lineHeight: 1.5 },
  errorIcon:   { flexShrink: 0, fontWeight: 700 },

  field:       { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label:       { fontSize: '0.72rem', fontWeight: 700, color: '#0d3d20', letterSpacing: '0.07em', textTransform: 'uppercase' as const },
  labelHint:   { fontWeight: 400, color: '#6b7280', textTransform: 'none' as const, letterSpacing: 0 },

  emptyNote:   { fontSize: '0.83rem', color: '#7a5500', background: '#fffbf0', border: '1.5px solid rgba(200,130,0,0.2)', borderRadius: '10px', padding: '0.7rem 1rem' },

  select:      { width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '10px', fontSize: '0.9rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1a1f16', background: '#fdfaf5', boxSizing: 'border-box' as const, transition: 'border-color 0.15s, box-shadow 0.15s' },

  subjectRow:  { display: 'flex', gap: '0.6rem' },
  subjectBtn:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.6rem 0.5rem', borderRadius: '10px', fontSize: '0.85rem', fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', transition: 'all 0.15s' },

  divider:     { borderTop: '1px solid rgba(26,122,64,0.1)', margin: '0.1rem 0' },

  input:       { width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '10px', fontSize: '0.9rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1a1f16', background: '#fdfaf5', boxSizing: 'border-box' as const, transition: 'border-color 0.15s, box-shadow 0.15s' },

  infoBox:     { display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: '#eaf6ef', border: '1.5px solid rgba(26,122,64,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#0d3d20', lineHeight: 1.6 },
  infoIcon:    { flexShrink: 0, fontWeight: 700, fontSize: '0.9rem', marginTop: '1px' },

  tabRow:      { display: 'flex', gap: '0.5rem' },
  tab:         { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem 0.75rem', border: '1.5px solid', borderRadius: '10px', fontSize: '0.83rem', fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', transition: 'all 0.15s' },
  tabBadge:    { background: '#1a7a40', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '8px' },

  textarea:    { width: '100%', padding: '0.75rem 0.9rem', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '10px', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1a1f16', background: '#fdfaf5', resize: 'vertical' as const, lineHeight: 1.7, boxSizing: 'border-box' as const, transition: 'border-color 0.15s, box-shadow 0.15s' },
  charRow:     { display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '0.3rem' },

  dropZone:    { border: '2px dashed rgba(26,122,64,0.25)', borderRadius: '12px', padding: '2.5rem 1rem', textAlign: 'center' as const, cursor: 'pointer', background: '#fdfaf5', transition: 'all 0.15s' },

  filePreview: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#eaf6ef', border: '1.5px solid rgba(26,122,64,0.2)', borderRadius: '12px', padding: '0.9rem 1rem' },
  fileIconWrap:{ fontSize: '1.5rem', flexShrink: 0 },
  fileInfo:    { display: 'flex', flexDirection: 'column' as const, gap: '0.1rem', flex: 1, minWidth: 0 },
  fileName:    { fontSize: '0.88rem', fontWeight: 700, color: '#0d3d20', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  fileSize:    { fontSize: '0.72rem', color: '#6b7280' },
  removeBtn:   { flexShrink: 0, background: '#fff5f5', border: '1.5px solid rgba(139,26,26,0.18)', color: '#8b1a1a', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, padding: '0.3rem 0.65rem', borderRadius: '7px', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'background 0.15s' },

  publishRow:       { display: 'flex', alignItems: 'flex-start', gap: '0.9rem', background: '#fdfaf5', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '12px', padding: '1rem 1.1rem' },
  publishToggleWrap:{ paddingTop: '2px', flexShrink: 0 },
  checkbox:         { display: 'none' },
  toggleTrack:      { width: '38px', height: '22px', borderRadius: '11px', cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb:      { position: 'absolute' as const, top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'transform 0.2s' },
  publishLabel:     { fontSize: '0.88rem', fontWeight: 700, color: '#1a1f16', cursor: 'pointer', display: 'block', marginBottom: '0.2rem' },
  publishHint:      { fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 },

  submitBtn:   { width: '100%', padding: '0.85rem', background: '#0d3d20', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'background 0.15s', letterSpacing: '0.01em' },
  statusHint:  { textAlign: 'center' as const, fontSize: '0.78rem', color: '#6b7280', marginTop: '0.5rem' },
}