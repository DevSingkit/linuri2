'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'

const SUBJECTS = ['English', 'Mathematics', 'Science'] as const
type Subject = typeof SUBJECTS[number]

export default function NewTeacherPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [section, setSection] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleSubject = (s: Subject) =>
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleCreate = async () => {
    setError('')
    setSuccess('')

    if (!fullName.trim()) { setError('Full name is required.'); return }
    if (!email.trim() || !email.includes('@')) { setError('A valid email is required.'); return }
    if (tempPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (!section.trim()) { setError('Section is required.'); return }
    if (subjects.length === 0) { setError('Select at least one subject.'); return }

    setLoading(true)

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existing) {
      setError('A user with this email already exists.')
      setLoading(false)
      return
    }

    // Create Supabase Auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      options: {
        data: { name: fullName.trim(), role: 'teacher' },
      },
    })

    if (signUpError || !authData.user) {
      setError(signUpError?.message ?? 'Failed to create account.')
      setLoading(false)
      return
    }

    // Update the users row created by the trigger
    const { error: updateError } = await supabase
      .from('users')
      .update({ name: fullName.trim(), role: 'teacher' })
      .eq('id', authData.user.id)

    if (updateError) {
      setError('Auth account created but profile update failed.')
      setLoading(false)
      return
    }

    // Create the class/section for this teacher
    const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { error: classError } = await supabase
      .from('classes')
      .insert({
        teacher_id: authData.user.id,
        name: `${subjects.join(', ')} — ${section}`,
        section: section.trim(),
        join_code: joinCode,
      })

    if (classError) {
      setError('Teacher created but class setup failed. Check the Classes page.')
      setLoading(false)
      return
    }

    setSuccess(`Teacher account created. Join code for ${section}: ${joinCode}`)
    setLoading(false)

    setTimeout(() => router.push('/admin'), 2000)
  }

  return (
    <AppLayout title="Add Teacher">
      <style>{`
        @keyframes fade-in { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        .nt-page { max-width: 580px; margin: 0 auto; animation: fade-in 0.22s ease both; }
        .nt-field { margin-bottom: 1.1rem; }
        .nt-label {
          display: block; font-size: 0.775rem; font-weight: 700;
          color: #1a1f16; margin-bottom: 0.4rem;
          letter-spacing: 0.015em; text-transform: uppercase;
        }
        .nt-label-hint { font-weight: 400; color: #6b7280; text-transform: none; }
        .nt-input {
          width: 100%; padding: 0.7rem 0.95rem;
          border: 1.5px solid rgba(26,122,64,0.18); border-radius: 10px;
          font-size: 0.9rem; font-family: inherit; color: #1a1f16;
          background: #fdfaf5; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .nt-input:focus {
          border-color: #1a7a40; background: #fff;
          box-shadow: 0 0 0 3px rgba(26,122,64,0.09);
        }
        .nt-input::placeholder { color: #b0b8b0; }
        .nt-checkbox-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .nt-checkbox-label {
          display: flex; align-items: center; gap: 0.6rem;
          font-size: 0.9rem; color: #1a1f16; cursor: pointer;
          padding: 0.55rem 0.85rem; border-radius: 9px;
          border: 1.5px solid rgba(26,122,64,0.15); background: #fdfaf5;
          transition: background 0.13s, border-color 0.13s;
          user-select: none;
        }
        .nt-checkbox-label:hover { background: #eaf6ef; border-color: rgba(26,122,64,0.3); }
        .nt-checkbox-label.checked { background: #eaf6ef; border-color: #1a7a40; font-weight: 600; color: #0d3d20; }
        .nt-checkbox-label input { accent-color: #1a7a40; width: 16px; height: 16px; cursor: pointer; }
        .nt-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: #fff0f0; border: 1px solid rgba(139,26,26,0.16);
          border-radius: 10px; padding: 0.7rem 1rem;
          font-size: 0.85rem; color: #8b1a1a; margin-bottom: 1.25rem; line-height: 1.5;
        }
        .nt-success {
          display: flex; align-items: flex-start; gap: 8px;
          background: #eaf6ef; border: 1px solid rgba(26,122,64,0.22);
          border-radius: 10px; padding: 0.7rem 1rem;
          font-size: 0.85rem; color: #0d3d20; margin-bottom: 1.25rem; line-height: 1.5;
          font-weight: 600;
        }
        .nt-btn-row { display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap; }
        .nt-btn-primary {
          background: #0d3d20; color: #ffd166; border: none;
          border-radius: 10px; padding: 0.75rem 1.75rem;
          font-size: 0.93rem; font-weight: 700; font-family: inherit;
          cursor: pointer; transition: background 0.15s, transform 0.1s;
          display: flex; align-items: center; gap: 6px;
        }
        .nt-btn-primary:hover:not(:disabled) { background: #1f6b38; transform: translateY(-1px); }
        .nt-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .nt-btn-cancel {
          background: #fff; color: #0d3d20;
          border: 1.5px solid rgba(26,122,64,0.2); border-radius: 10px;
          padding: 0.75rem 1.5rem; font-size: 0.93rem; font-weight: 600;
          font-family: inherit; cursor: pointer;
          transition: background 0.15s;
        }
        .nt-btn-cancel:hover { background: #eaf6ef; }
        .nt-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #ffd166;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="nt-page">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a7a40', marginBottom: '0.35rem' }}>
            Admin · Account Management
          </div>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: 'clamp(1.5rem,4vw,1.9rem)', fontWeight: 700, color: '#0d3d20', margin: '0 0 0.2rem' }}>
            Add New Teacher
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            Create a teacher account. A class section and join link will be generated automatically.
          </p>
        </div>

        {error && <div className="nt-error"><span>⚠</span><span>{error}</span></div>}
        {success && <div className="nt-success"><span>✓</span><span>{success}</span></div>}

        <div className="nt-field">
          <label className="nt-label">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Juan dela Cruz"
            className="nt-input"
          />
        </div>

        <div className="nt-field">
          <label className="nt-label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="teacher@school.edu"
            className="nt-input"
            autoComplete="off"
          />
        </div>

        <div className="nt-field">
          <label className="nt-label">Password</label>
          <input
            type="text"
            value={tempPassword}
            onChange={e => setTempPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className="nt-input"
            autoComplete="new-password"
          />
        </div>

        <div className="nt-field">
          <label className="nt-label">Section <span className="nt-label-hint">— e.g. Grade 6 — Mabini</span></label>
          <input
            type="text"
            value={section}
            onChange={e => setSection(e.target.value)}
            placeholder="Grade 6 — Mabini"
            className="nt-input"
          />
        </div>

        <div className="nt-field">
          <label className="nt-label" style={{ marginBottom: '0.6rem' }}>
            Subjects <span className="nt-label-hint">— select at least one</span>
          </label>
          <div className="nt-checkbox-group">
            {SUBJECTS.map(s => (
              <label key={s} className={`nt-checkbox-label${subjects.includes(s) ? ' checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={subjects.includes(s)}
                  onChange={() => toggleSubject(s)}
                />
                {s === 'English' ? '📖' : s === 'Mathematics' ? '🔢' : '🔬'} {s}
              </label>
            ))}
          </div>
        </div>

        <div className="nt-btn-row">
          <button onClick={handleCreate} disabled={loading} className="nt-btn-primary">
            {loading
              ? <><div className="nt-spinner" /> Creating…</>
              : <>Create Account →</>
            }
          </button>
          <button onClick={() => router.push('/admin')} className="nt-btn-cancel">
            Cancel
          </button>
        </div>
      </div>
    </AppLayout>
  )
}