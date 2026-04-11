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
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>LINURI</div>
        <div style={styles.logoSub}>Literacy & Numeracy Readiness Indicator</div>

        <h2 style={styles.heading}>Sign in to your account</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@school.edu"
            style={styles.input}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={styles.footer}>
          No account yet?{' '}
          <Link href="/register" style={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#faf6ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(27,94,48,0.15)',
    borderRadius: '12px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '420px',
  },
  logo: {
    fontFamily: 'Georgia, serif',
    fontSize: '2rem',
    color: '#0d3a1b',
    letterSpacing: '0.05em',
    marginBottom: '0.2rem',
  },
  logoSub: {
    fontSize: '0.7rem',
    color: '#6b6b6b',
    letterSpacing: '0.05em',
    marginBottom: '2rem',
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '1.5rem',
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
  field: {
    marginBottom: '1.1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '0.4rem',
    letterSpacing: '0.02em',
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.85rem',
    border: '1px solid rgba(27,94,48,0.2)',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: '#1a1a1a',
    background: '#faf6ee',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '0.7rem',
    background: '#1b5e30',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'opacity 0.15s',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.82rem',
    color: '#6b6b6b',
    marginTop: '1.25rem',
  },
  link: {
    color: '#1b5e30',
    fontWeight: 600,
    textDecoration: 'none',
  },
}