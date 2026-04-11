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

export default function NewLessonPage() {
  const router = useRouter()

  const [classes, setClasses]       = useState<ClassOption[]>([])
  const [classId, setClassId]       = useState('')
  const [title, setTitle]           = useState('')
  const [subject, setSubject]       = useState<Subject>('English')
  const [skillName, setSkillName]   = useState('')
  const [lessonText, setLessonText] = useState('')
  const [file, setFile]             = useState<File | null>(null)
  const [activeTab, setActiveTab]   = useState<'text' | 'file'>('text')
  const [error, setError]           = useState('')
  const [status, setStatus]         = useState<'idle' | 'uploading' | 'generating' | 'saving'>('idle')
  const fileInputRef                = useRef<HTMLInputElement>(null)

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
    const f = e.target.files?.[0] ?? null
    setFile(f)
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const switchTab = (tab: 'text' | 'file') => {
    setActiveTab(tab)
    if (tab === 'file') {
      fileInputRef.current?.click()
    } else {
      removeFile()
    }
  }

  const handleSubmit = async () => {
    setError('')

    if (!classId)          { setError('Please select a class.'); return }
    if (!title.trim())     { setError('Lesson title is required.'); return }
    if (!skillName.trim()) { setError('Skill name is required.'); return }

    // Lesson text is only required if no file is uploaded
    if (!file && lessonText.trim().length < 80) {
      setError('Lesson text must be at least 80 characters, or upload a file instead.')
      return
    }

    // If file uploaded but no lesson text, we need some text for Gemini
    // Use skill name + subject as a minimal fallback prompt
    const geminiText = lessonText.trim().length >= 80
      ? lessonText.trim()
      : `This is a ${subject} lesson about "${skillName}". ` +
        `The teacher has uploaded a file with the full lesson content. ` +
        `Please generate grade-appropriate questions based on the skill: ${skillName}.`

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated.')

      // Step 1 — Upload file if provided
      let fileUrl: string | null = null
      if (file) {
        setStatus('uploading')
        const ext      = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('lesson-files')
          .upload(fileName, file, { upsert: false })
        if (uploadError) throw new Error('File upload failed: ' + uploadError.message)

        const { data: urlData } = supabase.storage
          .from('lesson-files')
          .getPublicUrl(fileName)
        fileUrl = urlData.publicUrl
      }

      // Step 2 — Generate questions with Gemini
      setStatus('generating')
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          skillName,
          lessonText: geminiText,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Question generation failed.')
      }

      const { questions } = await res.json()
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Gemini returned no questions. Try adding lesson text for better results.')
      }

      // Step 3 — Save lesson
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
          is_published:     false,
          ...(fileUrl ? { file_url: fileUrl } : {}),
        })
        .select('id')
        .single()

      if (lessonError || !lesson) throw new Error('Failed to save lesson.')

      // Step 4 — Save questions
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
      <div style={styles.page}>

        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>Create a new lesson</h2>
          <p style={styles.pageDesc}>
            Fill in the lesson details below. Gemini will generate 15 multiple-choice questions
            (5 Basic, 5 Standard, 5 Advanced) which you can review before publishing.
          </p>
        </div>

        <div style={styles.card}>

          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Class */}
          <div style={styles.field}>
            <label style={styles.label}>Class</label>
            {classes.length === 0 ? (
              <div style={styles.emptyNote}>
                You have no classes yet. Create a class first before adding lessons.
              </div>
            ) : (
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                style={styles.select}
                disabled={busy}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.section}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject */}
          <div style={styles.field}>
            <label style={styles.label}>Subject</label>
            <div style={styles.subjectRow}>
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  disabled={busy}
                  style={{
                    ...styles.subjectBtn,
                    background: subject === s ? '#1b5e30' : '#f0e9d8',
                    color:      subject === s ? '#ffffff' : '#6b6b6b',
                    fontWeight: subject === s ? 600 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={styles.field}>
            <label style={styles.label}>Lesson title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Fractions"
              style={styles.input}
              disabled={busy}
            />
          </div>

          {/* Skill name */}
          <div style={styles.field}>
            <label style={styles.label}>
              Skill name
              <span style={styles.labelHint}> — e.g. "Identifying the main idea"</span>
            </label>
            <input
              type="text"
              value={skillName}
              onChange={e => setSkillName(e.target.value)}
              placeholder="Enter the skill being assessed"
              style={styles.input}
              disabled={busy}
            />
          </div>

          {/* Lesson content */}
          <div style={styles.field}>
            <label style={styles.label}>Lesson content</label>

            {/* Info box */}
            <div style={styles.infoBox}>
              <span style={styles.infoIcon}>ℹ</span>
              <span style={styles.infoText}>
                You can type the lesson text <strong>or</strong> upload a file for students to download.
                If you upload a file without typing text, Gemini will generate questions based on the skill name.
                For best results, provide both.
              </span>
            </div>

            {/* Tab toggle */}
            <div style={styles.tabRow}>
              <button
                type="button"
                style={{ ...styles.tab, ...(activeTab === 'text' ? styles.tabActive : {}) }}
                onClick={() => switchTab('text')}
                disabled={busy}
              >
                ✏️ Type lesson text
                {lessonText.trim().length >= 80 && activeTab === 'text' && (
                  <span style={styles.tabCheck}>✓</span>
                )}
              </button>
              <button
                type="button"
                style={{ ...styles.tab, ...(activeTab === 'file' ? styles.tabActive : {}) }}
                onClick={() => switchTab('file')}
                disabled={busy}
              >
                📎 Upload file
                {file && <span style={styles.tabCheck}>✓</span>}
              </button>
            </div>

            {/* Text tab */}
            {activeTab === 'text' && (
              <>
                <textarea
                  value={lessonText}
                  onChange={e => setLessonText(e.target.value)}
                  placeholder={
                    `Paste or type the lesson content here.\n\n` +
                    `The more detail you provide, the better the generated questions will be. ` +
                    `Include definitions, examples, and explanations relevant to the skill.`
                  }
                  rows={12}
                  style={styles.textarea}
                  disabled={busy}
                />
                <div style={styles.charCount}>
                  {lessonText.length} characters
                  {lessonText.length > 0 && lessonText.length < 80 && (
                    <span style={{ color: '#8b1a1a' }}> — needs {80 - lessonText.length} more</span>
                  )}
                  {lessonText.length >= 80 && (
                    <span style={{ color: '#1b5e30' }}> ✓ good to go</span>
                  )}
                </div>
              </>
            )}

            {/* File tab */}
            {activeTab === 'file' && (
              <>
                {file ? (
                  <div style={styles.filePreview}>
                    <span style={styles.fileIcon}>📄</span>
                    <div style={styles.fileInfo}>
                      <span style={styles.fileName}>{file.name}</span>
                      <span style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      style={styles.removeBtn}
                      onClick={removeFile}
                      disabled={busy}
                      type="button"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div
                    style={styles.dropZone}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span style={styles.dropIcon}>📁</span>
                    <p style={styles.dropText}>Click to choose a file</p>
                    <p style={styles.dropHint}>PDF, Word, PowerPoint, Excel, images, or plain text</p>
                  </div>
                )}

                {/* Also show textarea below when in file mode so teacher can optionally add text */}
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ ...styles.label, color: '#6b6b6b' }}>
                    Lesson text
                    <span style={styles.labelHint}> — optional when a file is uploaded</span>
                  </label>
                  <textarea
                    value={lessonText}
                    onChange={e => setLessonText(e.target.value)}
                    placeholder="Optionally add text here to improve question quality…"
                    rows={5}
                    style={{ ...styles.textarea, opacity: 0.85 }}
                    disabled={busy}
                  />
                  {lessonText.length > 0 && (
                    <div style={styles.charCount}>
                      {lessonText.length} characters
                      {lessonText.length >= 80 && (
                        <span style={{ color: '#1b5e30' }}> ✓ will be used for question generation</span>
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

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy || classes.length === 0}
            style={{
              ...styles.btn,
              opacity: busy || classes.length === 0 ? 0.65 : 1,
              cursor:  busy || classes.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'uploading'  && '⬆️ Uploading file…'}
            {status === 'generating' && '⏳ Generating questions with Gemini…'}
            {status === 'saving'     && '💾 Saving to database…'}
            {status === 'idle'       && 'Generate questions & continue →'}
          </button>

          {busy && (
            <p style={styles.statusHint}>
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

const styles: Record<string, React.CSSProperties> = {
  page:        { maxWidth: '680px' },
  pageHeader:  { marginBottom: '1.75rem' },
  pageTitle:   { fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: '#0d3a1b', marginBottom: '0.4rem' },
  pageDesc:    { fontSize: '0.875rem', color: '#6b6b6b', lineHeight: 1.6 },
  card:        { background: '#ffffff', border: '1px solid rgba(27,94,48,0.15)', borderRadius: '10px', padding: '2rem' },
  errorBox:    { background: '#fdf0f0', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '6px', padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#8b1a1a', marginBottom: '1.25rem' },
  field:       { marginBottom: '1.4rem' },
  label:       { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.45rem', letterSpacing: '0.02em' },
  labelHint:   { fontWeight: 400, color: '#6b6b6b' },
  emptyNote:   { fontSize: '0.82rem', color: '#8b1a1a', background: '#fdf8ee', border: '1px solid rgba(201,148,26,0.25)', borderRadius: '6px', padding: '0.65rem 1rem' },
  select:      { width: '100%', padding: '0.6rem 0.85rem', border: '1px solid rgba(27,94,48,0.2)', borderRadius: '6px', fontSize: '0.9rem', color: '#1a1a1a', background: '#faf6ee', outline: 'none', boxSizing: 'border-box' as const },
  subjectRow:  { display: 'flex', gap: '0.5rem' },
  subjectBtn:  { flex: 1, padding: '0.55rem', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s' },
  input:       { width: '100%', padding: '0.6rem 0.85rem', border: '1px solid rgba(27,94,48,0.2)', borderRadius: '6px', fontSize: '0.9rem', color: '#1a1a1a', background: '#faf6ee', outline: 'none', boxSizing: 'border-box' as const },
  infoBox:     { display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: '#f0f7f2', border: '1px solid rgba(27,94,48,0.2)', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '0.85rem', fontSize: '0.82rem', color: '#1a1a1a', lineHeight: 1.5 },
  infoIcon:    { flexShrink: 0, fontWeight: 700, color: '#1b5e30', fontSize: '0.9rem' },
  infoText:    { color: '#1a1a1a' },
  tabRow:      { display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' },
  tab:         { flex: 1, padding: '0.5rem', border: '1.5px solid rgba(27,94,48,0.2)', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#6b6b6b', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' },
  tabActive:   { background: '#0d3a1b', color: '#e8b84b', borderColor: '#0d3a1b', fontWeight: 600 },
  tabCheck:    { background: '#1b5e30', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '8px' },
  textarea:    { width: '100%', padding: '0.75rem 0.85rem', border: '1px solid rgba(27,94,48,0.2)', borderRadius: '6px', fontSize: '0.875rem', color: '#1a1a1a', background: '#faf6ee', outline: 'none', resize: 'vertical' as const, lineHeight: 1.7, fontFamily: 'inherit', boxSizing: 'border-box' as const },
  charCount:   { fontSize: '0.72rem', color: '#6b6b6b', marginTop: '0.35rem', textAlign: 'right' as const },
  dropZone:    { border: '2px dashed rgba(27,94,48,0.3)', borderRadius: '8px', padding: '2.5rem 1rem', textAlign: 'center' as const, cursor: 'pointer', background: '#faf6ee', transition: 'all 0.15s' },
  dropIcon:    { fontSize: '2rem', display: 'block', marginBottom: '0.5rem' },
  dropText:    { fontSize: '0.9rem', fontWeight: 600, color: '#0d3a1b', margin: '0 0 0.25rem' },
  dropHint:    { fontSize: '0.78rem', color: '#6b6b6b', margin: 0 },
  filePreview: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f0f7f2', border: '1.5px solid #1b5e30', borderRadius: '8px', padding: '0.85rem 1rem' },
  fileIcon:    { fontSize: '1.5rem', flexShrink: 0 },
  fileInfo:    { display: 'flex', flexDirection: 'column' as const, gap: '0.1rem', flex: 1 },
  fileName:    { fontSize: '0.88rem', fontWeight: 600, color: '#0d3a1b' },
  fileSize:    { fontSize: '0.72rem', color: '#6b6b6b' },
  removeBtn:   { background: '#fdf0f0', border: '1px solid rgba(139,26,26,0.2)', color: '#8b1a1a', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: '4px', flexShrink: 0, fontFamily: 'inherit' },
  btn:         { width: '100%', padding: '0.75rem', background: '#1b5e30', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, transition: 'opacity 0.15s' },
  statusHint:  { textAlign: 'center' as const, fontSize: '0.78rem', color: '#6b6b6b', marginTop: '0.75rem' },
}