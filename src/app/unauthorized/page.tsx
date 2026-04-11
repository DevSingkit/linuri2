// /unauthorized/page.tsx
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf6ee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: '2rem',
          color: '#0d3a1b',
          marginBottom: '0.5rem',
        }}>
          LINURI
        </div>
        <p style={{ color: '#8b1a1a', fontWeight: 600, marginBottom: '0.5rem' }}>
          Access denied
        </p>
        <p style={{ color: '#6b6b6b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          You don't have permission to view that page.
        </p>
        <Link href="/login" style={{
          background: '#1b5e30',
          color: '#fff',
          padding: '0.6rem 1.5rem',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}>
          Back to login
        </Link>
      </div>
    </div>
  )
}