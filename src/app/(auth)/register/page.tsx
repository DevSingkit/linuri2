// (auth) Register
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Role = 'student' | 'teacher'

export default function RegisterPage() {
  const router = useRouter()
  const [Name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setError('')

    if (!Name.trim()) { setError('Full name is required.'); return }
    if (!email.trim())    { setError('Email is required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (role === 'student' && !joinCode.trim()) {
      setError('Students must enter a Section Join Code.')
      return
    }

    setLoading(true)

    // 1. Sign up with Supabase Auth — trigger will create public.users row
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: Name, role },
      },
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Sign up failed. Please try again.')
      setLoading(false)
      return
    }

    // 2. Students: look up the class by join_code and enroll
    if (role === 'student') {
      const { data: classRow, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('join_code', joinCode.trim().toUpperCase())
        .single()

      if (classError || !classRow) {
        setError('Invalid Section Join Code. Ask your teacher for the correct code.')
        setLoading(false)
        return
      }

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({ student_id: authData.user.id, class_id: classRow.id })

      if (enrollError) {
        setError('Account created but enrollment failed. Contact your teacher.')
        setLoading(false)
        return
      }
    }

    router.replace('/dashboard')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
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
          --white:       #ffffff;
          --text:        #1a1f16;
          --muted:       #6b7280;
          --border:      rgba(26,122,64,0.13);
          --font:        'Plus Jakarta Sans', sans-serif;
        }

        .reg-page {
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: var(--font);
          padding: 2rem 1.25rem;
          position: relative;
          overflow: hidden;
        }

        /* dot-grid background */
        .reg-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(26,122,64,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* gold glow blob */
        .reg-page::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(240,165,0,0.07) 0%, transparent 65%);
          bottom: -140px;
          right: -120px;
          pointer-events: none;
        }

        /* ── Card ── */
        .reg-card {
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          box-shadow: 0 4px 32px rgba(13,61,32,0.08), 0 1px 4px rgba(13,61,32,0.04);
          padding: 2.5rem 2.25rem 2.25rem;
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
        }

        /* ── Logo ── */
        .reg-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.75rem;
        }
        .reg-mark {
          width: 40px;
          height: 40px;
          background: var(--green-dark);
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 800;
          color: var(--gold-lt);
          flex-shrink: 0;
        }
        .reg-mark-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--green-dark);
          letter-spacing: 0.01em;
        }
        .reg-mark-badge {
          margin-left: auto;
          background: var(--green-light);
          color: var(--green-dark);
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          border: 1px solid rgba(26,122,64,0.18);
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        /* ── Heading ── */
        .reg-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--green-dark);
          letter-spacing: -0.02em;
          margin-bottom: 0.3rem;
        }
        .reg-sub {
          font-size: 0.87rem;
          color: var(--muted);
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        /* ── Role toggle ── */
        .role-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 1.5rem;
          background: var(--cream);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 5px;
        }
        .role-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0.6rem 0.75rem;
          border: none;
          border-radius: 9px;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: var(--font);
          cursor: pointer;
          transition: background 0.15s, color 0.15s, box-shadow 0.15s;
          background: transparent;
          color: var(--muted);
        }
        .role-btn-active {
          background: var(--white);
          color: var(--green-dark);
          box-shadow: 0 1px 6px rgba(13,61,32,0.1);
        }
        .role-btn-active.role-btn-teacher {
          color: #7a5500;
        }
        .role-emoji { font-size: 1rem; line-height: 1; }

        /* ── Error ── */
        .reg-error {
          background: #fff0f0;
          border: 1px solid rgba(139,26,26,0.18);
          border-radius: 9px;
          padding: 0.65rem 0.9rem;
          font-size: 0.83rem;
          color: #8b1a1a;
          margin-bottom: 1.15rem;
          display: flex;
          align-items: flex-start;
          gap: 7px;
          line-height: 1.5;
        }

        /* ── Fields ── */
        .reg-field { margin-bottom: 1rem; }
        .reg-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.38rem;
          letter-spacing: 0.01em;
        }
        .reg-label-hint { font-weight: 400; color: var(--muted); }
        .reg-input {
          width: 100%;
          padding: 0.68rem 0.95rem;
          border: 1.5px solid var(--border);
          border-radius: 9px;
          font-size: 0.92rem;
          font-family: var(--font);
          color: var(--text);
          background: var(--white);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .reg-input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(26,122,64,0.1);
        }
        .reg-input::placeholder { color: #b0b8ac; }
        .reg-input-mono {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        /* join code hint box */
        .join-hint {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: var(--gold-bg);
          border: 1px solid rgba(240,165,0,0.25);
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          font-size: 0.79rem;
          color: #7a5500;
          margin-top: 0.5rem;
          line-height: 1.55;
        }

        /* ── Button ── */
        .reg-btn {
          width: 100%;
          padding: 0.78rem;
          background: var(--green-dark);
          color: #fff;
          border: none;
          border-radius: 9px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: var(--font);
          cursor: pointer;
          margin-top: 0.35rem;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .reg-btn:hover:not(:disabled) { background: var(--green); transform: translateY(-1px); }
        .reg-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* spinner */
        .spin {
          width: 16px;
          height: 16px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Divider ── */
        .reg-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 1.5rem 0 1.1rem;
        }
        .reg-divider-line { flex: 1; height: 1px; background: var(--border); }
        .reg-divider-text { font-size: 0.74rem; color: var(--muted); white-space: nowrap; }

        /* ── Footer ── */
        .reg-footer {
          text-align: center;
          font-size: 0.84rem;
          color: var(--muted);
        }
        .reg-link { color: var(--green); font-weight: 700; text-decoration: none; }
        .reg-link:hover { text-decoration: underline; }

        /* ── School tag ── */
        .reg-school {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.72rem;
          color: var(--muted);
          opacity: 0.7;
          line-height: 1.8;
          position: relative;
          z-index: 1;
        }

        /* ── Student info strip (shows when student selected) ── */
        .student-strip {
          display: flex;
          align-items: center;
          gap: 9px;
          background: var(--green-light);
          border: 1px solid rgba(26,122,64,0.18);
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
          font-size: 0.79rem;
          color: var(--green-dark);
          margin-bottom: 1rem;
          line-height: 1.5;
          font-weight: 500;
        }
        .teacher-strip {
          display: flex;
          align-items: center;
          gap: 9px;
          background: var(--gold-bg);
          border: 1px solid rgba(240,165,0,0.22);
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
          font-size: 0.79rem;
          color: #7a5500;
          margin-bottom: 1rem;
          line-height: 1.5;
          font-weight: 500;
        }
      `}</style>

      <div className="reg-page">
        <div className="reg-card">

          {/* Logo */}
          <div className="reg-logo">
            <div className="reg-mark">L</div>
            <span className="reg-mark-name">LINURI</span>
            <span className="reg-mark-badge">Grade 6</span>
          </div>

          {/* Heading */}
          <h1 className="reg-title">Create your account</h1>
          <p className="reg-sub">It&apos;s free — choose your role and fill in the details below.</p>

          {/* Role toggle */}
          <div className="role-toggle">
            {(['student', 'teacher'] as Role[]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`role-btn ${role === r ? `role-btn-active role-btn-${r}` : ''}`}
              >
                <span className="role-emoji">{r === 'student' ? '👦' : '👩‍🏫'}</span>
                {r === 'student' ? 'Student' : 'Teacher'}
              </button>
            ))}
          </div>

          {/* Role context strip */}
          {role === 'student' && (
            <div className="student-strip">
              📚 You&apos;ll need a &nbsp;Section Join Code from your teacher to complete registration.
            </div>
          )}
          {role === 'teacher' && (
            <div className="teacher-strip">
              🏫 Create a teacher account.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="reg-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Full name */}
          <div className="reg-field">
            <label className="reg-label">Full name</label>
            <input
              type="text"
              value={Name}
              onChange={e => setName(e.target.value)}
              placeholder="Maria Santos"
              className="reg-input"
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div className="reg-field">
            <label className="reg-label">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="reg-input"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="reg-field">
            <label className="reg-label">
              Password
              <span className="reg-label-hint"> — at least 6 characters</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              className="reg-input"
              autoComplete="new-password"
            />
          </div>

          {/* Join code — students only */}
          {role === 'student' && (
            <div className="reg-field">
              <label className="reg-label">
                Section Join Code
                <span className="reg-label-hint"> — given by your teacher</span>
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={10}
                className="reg-input reg-input-mono"
              />
              <div className="join-hint">
                💬 Ask your teacher for the 6-letter code for your class section.
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="reg-btn"
          >
            {loading ? (
              <>
                <span className="spin" />
                Creating account…
              </>
            ) : (
              'Create account →'
            )}
          </button>

          {/* Divider */}
          <div className="reg-divider">
            <div className="reg-divider-line" />
            <span className="reg-divider-text">Already registered?</span>
            <div className="reg-divider-line" />
          </div>

          <p className="reg-footer">
            Have an account?{' '}
            <Link href="/login" className="reg-link">Sign in here</Link>
          </p>

        </div>

        {/* School tag below card */}
        <p className="reg-school">
          United Methodist Cooperative Learning System, Inc.<br />
          Caloocan City · Adaptive Learning Platform
        </p>
      </div>
    </>
  )
}