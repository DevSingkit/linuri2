// src/app/admin/classes/page.tsx
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

export default function AdminClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [counts, setCounts]   = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [copied, setCopied]   = useState<string | null>(null)

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

  if (loading) return (
    <AppLayout title="Classes">
      <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Loading classes…</p></div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Classes">
      <div style={s.center}><p style={{ color: '#8b1a1a' }}>{error}</p></div>
    </AppLayout>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        :root {
          --green: #1a7a40; --green-dark: #0d3d20; --green-light: #eaf6ef;
          --gold: #f0a500; --gold-lt: #ffd166; --gold-bg: #fffbf0;
          --cream: #fdfaf5; --white: #ffffff; --text: #1a1f16;
          --muted: #6b7280; --border: rgba(26,122,64,0.13);
          --font: 'Plus Jakarta Sans', sans-serif;
        }
        .ac-search { border: 1.5px solid var(--border); border-radius: 9px; padding: 0.45rem 0.9rem; font-size: 0.85rem; font-family: var(--font); outline: none; min-width: 260px; color: var(--text); background: var(--white); transition: border-color 0.15s, box-shadow 0.15s; }
        .ac-search:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(26,122,64,0.1); }
        .ac-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 18px; padding: 1.35rem 1.5rem; display: flex; flex-direction: column; gap: 0.8rem; transition: transform 0.15s, box-shadow 0.15s; }
        .ac-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(13,61,32,0.09); }
        .copy-btn { font-size: 0.72rem; font-weight: 700; padding: 0.22rem 0.65rem; border: 1.5px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--white); color: var(--green-dark); font-family: var(--font); transition: all 0.15s; }
        .copy-btn:hover { background: var(--green-light); }
        .copy-btn-done { background: var(--green-dark) !important; color: #fff !important; border-color: var(--green-dark) !important; }
      `}</style>

      <AppLayout title="Classes">
        <div style={s.page}>

          <div style={s.topRow}>
            <div>
              <h1 style={s.heading}>All Classes</h1>
              <p style={s.muted}>{classes.length} class{classes.length !== 1 ? 'es' : ''} across all teachers</p>
            </div>
            <input
              className="ac-search"
              type="text"
              placeholder="Search section, teacher, or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={s.empty}>No classes found.</div>
          ) : (
            <div style={s.grid}>
              {filtered.map(c => {
                const studentCount = counts[c.id] ?? 0
                return (
                  <div key={c.id} className="ac-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={s.sectionName}>{c.name} — {c.section}</div>
                      <span style={s.studentBadge}>{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                      <span style={s.cardLabel}>Teacher</span>
                      <span style={s.cardValue}>{c.users?.name ?? '—'}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={s.cardLabel}>Join Code</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={s.code}>{c.join_code}</span>
                        <button
                          className={`copy-btn${copied === c.join_code ? ' copy-btn-done' : ''}`}
                          onClick={() => copyCode(c.join_code)}
                        >
                          {copied === c.join_code ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div style={s.cardDate}>
                      Created {new Date(c.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </AppLayout>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:         { maxWidth: '1024px', margin: '0 auto' },
  topRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' },
  heading:      { fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem', color: '#0d3d20', margin: 0 },
  muted:        { color: '#6b7280', fontSize: '0.88rem', marginTop: '0.25rem' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' },
  sectionName:  { fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', color: '#0d3d20', lineHeight: 1.2 },
  studentBadge: { background: '#eaf6ef', color: '#0d3d20', fontSize: '0.72rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: '20px', border: '1px solid rgba(26,122,64,0.18)', whiteSpace: 'nowrap' as const },
  cardLabel:    { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b7280' },
  cardValue:    { fontSize: '0.9rem', color: '#1a1f16', fontWeight: 500 },
  code:         { fontFamily: 'monospace', letterSpacing: '0.14em', fontSize: '0.9rem', color: '#0d3d20', fontWeight: 700, background: '#eaf6ef', padding: '0.25rem 0.65rem', borderRadius: '6px' },
  cardDate:     { fontSize: '0.74rem', color: '#9b9b9b', borderTop: '1px solid rgba(26,122,64,0.08)', paddingTop: '0.6rem' },
  empty:        { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '2.5rem', color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' },
  center:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:      { width: '36px', height: '36px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}