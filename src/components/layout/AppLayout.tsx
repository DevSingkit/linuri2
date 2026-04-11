// src/components/layout/AppLayout.tsx
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'

interface Props {
  title: string
  children: React.ReactNode
}

export default function AppLayout({ title, children }: Props) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#fdfaf5',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <AppSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppHeader title={title} />
        <main style={{
          flex: 1,
          padding: '2rem',
          maxWidth: '1100px',
          width: '100%',
          margin: '0 auto',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}