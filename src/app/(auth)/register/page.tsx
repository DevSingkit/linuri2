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
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>LINURI</div>
        <div style={styles.logoSub}>Literacy & Numeracy Readiness Indicator</div>

        <h2 style={styles.heading}>Create your account</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Role toggle */}
        <div style={styles.roleRow}>
          {(['student', 'teacher'] as Role[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                ...styles.roleBtn,
                background: role === r ? '#1b5e30' : '#f0e9d8',
                color: role === r ? '#ffffff' : '#6b6b6b',
                fontWeight: role === r ? 600 : 400,
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Full name</label>
          <input
            type="text"
            value={Name}
            onChange={e => setName(e.target.value)}
            placeholder="Maria Santos"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@school.edu"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={styles.input}
          />
        </div>

        {/* Join code — students only */}
        {role === 'student' && (
          <div style={styles.field}>
            <label style={styles.label}>
              Section Join Code
              <span style={styles.labelHint}> — given by your teacher</span>
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={10}
              style={{ ...styles.input, fontFamily: 'monospace', letterSpacing: '0.12em' }}
            />
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>Sign in</Link>
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
    marginBottom: '1.25rem',
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
  roleRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.25rem',
  },
  roleBtn: {
    flex: 1,
    padding: '0.55rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
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
  labelHint: {
    fontWeight: 400,
    color: '#6b6b6b',
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