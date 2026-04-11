// Dashboard
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardGate() {
  const router = useRouter()

  useEffect(() => {
    async function redirect() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          await supabase.auth.signOut()
          router.replace('/login')
          return
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          await supabase.auth.signOut()
          router.replace('/login')
          return
        }

        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!data) {
          router.replace('/login')
          return
        }

        const dest: Record<string, string> = {
          teacher: '/teacher',
          student: '/student',
          admin:   '/admin',
        }
        router.replace(dest[data.role] ?? '/login')
      } catch {
        await supabase.auth.signOut()
        router.replace('/login')
      }
    }

    redirect()
  }, [router])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --green: #1a7a40;
          --green-dark: #0d3d20;
          --green-mid: #1f6b38;
          --green-light: #eaf6ef;
          --gold: #f0a500;
          --gold-lt: #ffd166;
          --gold-bg: #fffbf0;
          --cream: #fdfaf5;
          --cream2: #f5efe3;
          --white: #ffffff;
          --text: #1a1f16;
          --muted: #6b7280;
          --border: rgba(26,122,64,0.13);
        }

        @keyframes linuri-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes linuri-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.92); }
        }

        @keyframes linuri-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .linuri-gate-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cream);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* subtle dot-grid background */
        .linuri-gate-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(26,122,64,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .linuri-gate-card {
          position: relative;
          z-index: 1;
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: 24px;
          padding: 48px 56px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          box-shadow: 0 8px 32px rgba(13,61,32,0.08), 0 2px 8px rgba(13,61,32,0.04);
          animation: linuri-fade-in 0.5s ease both;
          min-width: 280px;
        }

        .linuri-gate-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .linuri-gate-logo-mark {
          width: 52px;
          height: 52px;
          background: var(--green-dark);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: linuri-pulse 2.4s ease-in-out infinite;
        }

        .linuri-gate-logo-mark svg {
          width: 28px;
          height: 28px;
        }

        .linuri-gate-wordmark {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--green-dark);
          letter-spacing: -0.02em;
        }

        .linuri-gate-wordmark span {
          color: var(--gold);
        }

        .linuri-gate-spinner-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .linuri-gate-spinner {
          width: 36px;
          height: 36px;
          border: 3.5px solid var(--green-light);
          border-top: 3.5px solid var(--green);
          border-radius: 50%;
          animation: linuri-spin 0.8s linear infinite;
        }

        .linuri-gate-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--muted);
          letter-spacing: 0.01em;
        }

        .linuri-gate-badge {
          background: var(--green-light);
          color: var(--green-dark);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
      `}</style>

      <div className="linuri-gate-root">
        <div className="linuri-gate-card">
          <div className="linuri-gate-logo">
            <div className="linuri-gate-logo-mark">
              {/* Book + spark icon */}
              <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="14" height="18" rx="2.5" fill="#ffd166" opacity="0.25"/>
                <rect x="6" y="5" width="14" height="18" rx="2.5" fill="none" stroke="#ffd166" strokeWidth="1.6"/>
                <path d="M9 10h8M9 13.5h6" stroke="#ffd166" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="21" cy="8" r="2.5" fill="#f0a500"/>
                <path d="M21 5.5V4M21 12V10.5M23.5 8H25M17 8H18.5M23.27 5.73l1.06-1.06M18.67 10.33l-1.06 1.06M23.27 10.33l1.06 1.06M18.67 5.73l-1.06-1.06" stroke="#ffd166" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="linuri-gate-wordmark">LIN<span>URI</span></div>
          </div>

          <div className="linuri-gate-spinner-wrap">
            <div className="linuri-gate-spinner" />
            <span className="linuri-gate-label">Signing you in…</span>
          </div>

          <div className="linuri-gate-badge">Grade 6 · UMCLS Caloocan</div>
        </div>
      </div>
    </>
  )
}