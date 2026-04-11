'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
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
          --danger-bg:   #fff0f0;
          --danger:      #8b1a1a;
          --font:        'Plus Jakarta Sans', sans-serif;
        }

        .login-page {
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font);
          padding: 2rem 1.25rem;
          position: relative;
          overflow: hidden;
        }

        /* Background texture */
        .login-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, rgba(26,122,64,0.045) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          z-index: 0;
        }

        /* Soft glow blobs */
        .login-blob-tl {
          position: fixed;
          top: -120px;
          left: -120px;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(26,122,64,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .login-blob-br {
          position: fixed;
          bottom: -140px;
          right: -140px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(240,165,0,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Card */
        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          padding: 2.5rem 2.25rem 2rem;
          box-shadow: 0 4px 32px rgba(13,61,32,0.07), 0 1px 4px rgba(13,61,32,0.04);
        }

        /* Logo mark */
        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2rem;
        }
        .login-mark {
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
          letter-spacing: -0.01em;
        }
        .login-mark-name {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--green-dark);
          letter-spacing: 0.04em;
        }
        .login-mark-badge {
          margin-left: auto;
          background: var(--green-light);
          color: var(--green-dark);
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          letter-spacing: 0.01em;
          border: 1px solid rgba(26,122,64,0.15);
        }

        /* Heading */
        .login-title {
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--green-dark);
          letter-spacing: -0.025em;
          margin-bottom: 0.3rem;
          line-height: 1.2;
        }
        .login-sub {
          font-size: 0.875rem;
          color: var(--muted);
          margin-bottom: 1.75rem;
          line-height: 1.5;
        }

        /* Error */
        .login-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: var(--danger-bg);
          border: 1px solid rgba(139,26,26,0.16);
          border-radius: 10px;
          padding: 0.7rem 1rem;
          font-size: 0.83rem;
          color: var(--danger);
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }

        /* Fields */
        .login-field {
          margin-bottom: 1rem;
        }
        .login-label {
          display: block;
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.4rem;
          letter-spacing: 0.015em;
          text-transform: uppercase;
        }
        .login-input {
          width: 100%;
          padding: 0.7rem 0.95rem;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-size: 0.9rem;
          font-family: var(--font);
          color: var(--text);
          background: var(--cream);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .login-input::placeholder { color: #b0b8b0; }
        .login-input:focus {
          border-color: var(--green);
          background: var(--white);
          box-shadow: 0 0 0 3px rgba(26,122,64,0.09);
        }

        /* Submit button */
        .login-btn {
          width: 100%;
          padding: 0.78rem;
          background: var(--green-dark);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.93rem;
          font-weight: 700;
          font-family: var(--font);
          cursor: pointer;
          margin-top: 0.25rem;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .login-btn:hover:not(:disabled) {
          background: var(--green-mid);
          transform: translateY(-1px);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Spinner inside button */
        .login-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 1.5rem 0 1.25rem;
        }
        .login-divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .login-divider-text {
          font-size: 0.73rem;
          color: var(--muted);
          white-space: nowrap;
          font-weight: 500;
        }

        /* Footer */
        .login-footer {
          text-align: center;
          font-size: 0.84rem;
          color: var(--muted);
        }
        .login-link {
          color: var(--green);
          font-weight: 700;
          text-decoration: none;
        }
        .login-link:hover { text-decoration: underline; }

        /* School tag */
        .login-school {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
          font-size: 0.7rem;
          color: var(--muted);
          line-height: 1.7;
        }
      `}</style>

      <div className="login-page">
        <div className="login-blob-tl" />
        <div className="login-blob-br" />

        <div className="login-card">

          {/* Logo */}
          <div className="login-logo">
            <div className="login-mark">L</div>
            <span className="login-mark-name">LINURI</span>
            <span className="login-mark-badge">Grade 6</span>
          </div>

          {/* Heading */}
          <h1 className="login-title">Welcome back!</h1>
          <p className="login-sub">Sign in to continue your learning journey.</p>

          {/* Error */}
          {error && (
            <div className="login-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="login-field">
            <label className="login-label">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="login-input"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Password */}
          <div className="login-field" style={{ marginBottom: '1.25rem' }}>
            <label className="login-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="login-input"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              <><div className="login-spinner" /> Signing in…</>
            ) : (
              <>Sign in →</>
            )}
          </button>

          {/* Divider */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">New to LINURI?</span>
            <div className="login-divider-line" />
          </div>

          {/* Register link */}
          <p className="login-footer">
            No account yet?{' '}
            <Link href="/register" className="login-link">Create one free</Link>
          </p>

          {/* School tag */}
          <div className="login-school">
            United Methodist Cooperative Learning System, Inc.<br />
            Caloocan City · Adaptive Learning Platform
          </div>

        </div>
      </div>
    </>
  )
}