// Admin/Classes
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'

interface ClassRow {
  id: string
  name: string           
  section: string       
  join_code: string
  teacher_id: string
  created_at: string
  users: { name: string } | null
}

interface EnrollmentCount {
  class_id: string
  count: number
}

export default function AdminClassesPage() {
  const router = useRouter()
  const [classes, setClasses]       = useState<ClassRow[]>([])
  const [counts, setCounts]         = useState<Record<string, number>>({})
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [copied, setCopied]         = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*, users(name)')
          .order('created_at', { ascending: false })
        if (classError) throw classError
        setClasses((classData as unknown as ClassRow[]) ?? [])

        // Student count per class
        const { data: enrollData, error: enrollError } = await supabase
          .from('enrollments')
          .select('class_id')
        if (enrollError) throw enrollError

        const countMap: Record<string, number> = {}
        ;(enrollData ?? []).forEach((e: { class_id: string }) => {
          countMap[e.class_id] = (countMap[e.class_id] ?? 0) + 1
        })
        setCounts(countMap)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load classes.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const filtered = classes.filter(c =>
    search === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.users?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    c.join_code.toLowerCase().includes(search.toLowerCase())
  )

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
  }

  if (loading) {
    return (
      <AppLayout title="Classes">
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading classes…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Classes">
        <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Classes">
      <div style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>All Classes</h1>
            <p style={s.muted}>{classes.length} class{classes.length !== 1 ? 'es' : ''} across all teachers</p>
          </div>
          <input
            style={s.search}
            type="text"
            placeholder="Search section, teacher, or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div style={s.empty}>No classes found.</div>
        ) : (
          <div style={s.grid}>
            {filtered.map(c => {
              const studentCount = counts[c.id] ?? 0
              return (
                <div key={c.id} style={s.card}>
                  <div style={s.cardTop}>
                    <div style={s.sectionName}>{c.name} — {c.section}</div>
                    <div style={s.studentBadge}>{studentCount} student{studentCount !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={s.cardTeacher}>
                    <span style={s.cardLabel}>Teacher</span>
                    <span style={s.cardValue}>{c.users?.name ?? '—'}</span>
                  </div>
                  <div style={s.cardJoin}>
                    <span style={s.cardLabel}>Join Code</span>
                    <div style={s.codeRow}>
                      <span style={s.code}>{c.join_code}</span>
                      <button
                        style={{ ...s.copyBtn, ...(copied === c.join_code ? s.copyBtnDone : {}) }}
                        onClick={() => copyCode(c.join_code)}
                      >
                        {copied === c.join_code ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div style={s.cardDate}>
                    Created {new Date(c.created_at).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:          { padding: '2rem', maxWidth: '1024px', margin: '0 auto' },
  topRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' },
  heading:       { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3a1b', margin: 0 },
  muted:         { color: '#6b6b6b', fontSize: '0.88rem', marginTop: '0.25rem' },
  search:        { border: '1px solid rgba(27,94,48,0.2)', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', minWidth: '260px', color: '#1a1a1a' },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  card:          { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '12px', padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  cardTop:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionName:   { fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', color: '#0d3a1b', lineHeight: 1.2 },
  studentBadge:  { background: '#f0f7f2', color: '#1b5e30', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', whiteSpace: 'nowrap' as const },
  cardTeacher:   { display: 'flex', flexDirection: 'column' as const, gap: '0.1rem' },
  cardJoin:      { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' },
  cardLabel:     { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b6b6b' },
  cardValue:     { fontSize: '0.9rem', color: '#1a1a1a', fontWeight: 500 },
  codeRow:       { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  code:          { fontFamily: 'monospace', letterSpacing: '0.12em', fontSize: '0.9rem', color: '#0d3a1b', fontWeight: 700, background: '#f0f7f2', padding: '0.25rem 0.6rem', borderRadius: '4px' },
  copyBtn:       { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', border: '1px solid rgba(27,94,48,0.25)', borderRadius: '4px', cursor: 'pointer', background: '#fff', color: '#0d3a1b', fontFamily: 'inherit' },
  copyBtnDone:   { background: '#1b5e30', color: '#fff', borderColor: '#1b5e30' },
  cardDate:      { fontSize: '0.75rem', color: '#9b9b9b', borderTop: '1px solid rgba(27,94,48,0.07)', paddingTop: '0.5rem' },
  empty:         { background: '#fff', border: '1px solid rgba(27,94,48,0.12)', borderRadius: '8px', padding: '2.5rem', color: '#6b6b6b', fontSize: '0.9rem', textAlign: 'center' },
  center:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:       { width: '36px', height: '36px', border: '4px solid #f0e9d8', borderTop: '4px solid #1b5e30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}