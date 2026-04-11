// Student/progress
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase, getMasteryByStudent } from '@/lib/supabase'
import type { MasteryRecord, Subject } from '@/types/linuri'

const SUBJECTS: Subject[] = ['English', 'Mathematics', 'Science']

export default function StudentProgressPage() {
  const router = useRouter()

  const [mastery, setMastery]             = useState<MasteryRecord[]>([])
  const [filtered, setFiltered]           = useState<MasteryRecord[]>([])
  const [activeSubject, setActiveSubject] = useState<Subject | 'All'>('All')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/login'); return }

        const { data, error: fetchError } = await getMasteryByStudent(user.id)
        if (fetchError) throw fetchError
        const records = data ?? []
        setMastery(records)
        setFiltered(records)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  function filterSubject(subject: Subject | 'All') {
    setActiveSubject(subject)
    setFiltered(subject === 'All' ? mastery : mastery.filter(m => m.subject === subject))
  }

  if (loading) {
    return (
      <AppLayout title="My Progress">
        <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading your progress…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="My Progress">
        <div style={s.center}>
          <div style={s.errorCard}>
            <span style={{ fontSize: '2rem' }}>😟</span>
            <p style={{ color: '#8b1a1a', fontWeight: 600, margin: 0 }}>{error}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const mastered   = mastery.filter(m => m.mastery_level === 'Mastered').length
  const developing = mastery.filter(m => m.mastery_level === 'Developing').length
  const needsHelp  = mastery.filter(m => m.mastery_level === 'Needs Help').length
  const flagged    = mastery.filter(m => m.regression_count >= 2)

  const subjectMeta: Record<string, { icon: string; color: string; bg: string; border: string }> = {
    English:     { icon: '📖', color: '#1a5276', bg: '#eaf1fb', border: 'rgba(26,82,118,0.18)' },
    Mathematics: { icon: '🔢', color: '#0d5c28', bg: '#eaf6ef', border: 'rgba(26,122,64,0.18)' },
    Science:     { icon: '🔬', color: '#6c3483', bg: '#f5eefa', border: 'rgba(108,52,131,0.18)' },
  }

  const masteryMeta: Record<string, { bg: string; color: string; border: string; icon: string }> = {
    'Mastered':   { bg: '#eaf6ef', color: '#0d5c28', border: 'rgba(26,122,64,0.18)', icon: '⭐' },
    'Developing': { bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.18)', icon: '📈' },
    'Needs Help': { bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.14)', icon: '🆘' },
  }

  const diffMeta: Record<string, { bg: string; color: string }> = {
    'Advanced': { bg: '#eaf6ef', color: '#0d5c28' },
    'Standard': { bg: '#fffbf0', color: '#7a5500' },
    'Basic':    { bg: '#f5f5f5', color: '#4b5563' },
  }

  return (
    <AppLayout title="My Progress">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
        @keyframes sp-spin  { to { transform: rotate(360deg); } }
        @keyframes sp-fade  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sp-slide { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }

        .sp-stat:hover  { box-shadow: 0 6px 20px rgba(13,61,32,0.10); transform: translateY(-2px); }
        .sp-stat        { transition: box-shadow 0.18s, transform 0.18s; }
        .sp-tab:hover:not(.sp-tab-on) { background: #eaf6ef !important; color: #0d3d20 !important; }
        .sp-back:hover  { background: #eaf6ef !important; }
        .sp-tr:hover td { background: #f0f9f4 !important; }
        .sp-content     { animation: sp-fade 0.25s ease both; }
        .sp-alert       { animation: sp-slide 0.3s ease both; }
      `}</style>

      <div style={s.page}>

        {/* ── Header ── */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>Student · Skills Tracker</div>
            <h1 style={s.heading}>My Progress</h1>
            <p style={s.muted}>Track your mastery across all skills and subjects</p>
          </div>
          <button
            className="sp-back"
            style={s.btnOutline}
            onClick={() => router.push('/student')}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div style={s.statGrid}>
          {[
            { label: 'Total Skills', value: mastery.length, icon: '🧠', bg: '#fdfaf5', color: '#0d3d20', border: 'rgba(26,122,64,0.13)' },
            { label: 'Mastered',     value: mastered,       icon: '⭐', bg: '#eaf6ef', color: '#0d5c28', border: 'rgba(26,122,64,0.22)' },
            { label: 'Developing',   value: developing,     icon: '📈', bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.20)' },
            { label: 'Needs Help',   value: needsHelp,      icon: '🆘', bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.18)' },
          ].map(c => (
            <div key={c.label} className="sp-stat" style={{ ...s.statCard, background: c.bg, border: `1.5px solid ${c.border}` }}>
              <span style={s.statIcon}>{c.icon}</span>
              <span style={{ ...s.statNum, color: c.color }}>{c.value}</span>
              <span style={s.statLabel}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* ── Progress bar ── */}
        {mastery.length > 0 && (
          <div style={s.barCard}>
            <div style={s.barLabel}>
              <span style={{ fontWeight: 600, color: '#0d3d20', fontSize: '0.85rem' }}>Overall Mastery</span>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{mastery.length} skills tracked</span>
            </div>
            <div style={s.bigBar}>
              {mastered > 0 && (
                <div style={{ ...s.barSeg, width: `${Math.round((mastered / mastery.length) * 100)}%`, background: 'linear-gradient(90deg,#1a7a40,#0d5c28)' }}>
                  {Math.round((mastered / mastery.length) * 100)}%
                </div>
              )}
              {developing > 0 && (
                <div style={{ ...s.barSeg, width: `${Math.round((developing / mastery.length) * 100)}%`, background: 'linear-gradient(90deg,#d4a017,#b07800)' }}>
                  {Math.round((developing / mastery.length) * 100)}%
                </div>
              )}
              {needsHelp > 0 && (
                <div style={{ ...s.barSeg, width: `${Math.round((needsHelp / mastery.length) * 100)}%`, background: 'linear-gradient(90deg,#c0392b,#8b1a1a)' }}>
                  {Math.round((needsHelp / mastery.length) * 100)}%
                </div>
              )}
            </div>
            <div style={s.barLegend}>
              <span style={s.legendItem}><span style={{ ...s.dot, background: '#1a7a40' }} />Mastered ({mastered})</span>
              <span style={s.legendItem}><span style={{ ...s.dot, background: '#d4a017' }} />Developing ({developing})</span>
              <span style={s.legendItem}><span style={{ ...s.dot, background: '#c0392b' }} />Needs Help ({needsHelp})</span>
            </div>
          </div>
        )}

        {/* ── Flagged alert ── */}
        {flagged.length > 0 && (
          <div className="sp-alert" style={s.alert}>
            <div style={s.alertIconWrap}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#7a5500', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                Skills needing extra practice ({flagged.length})
              </div>
              <div style={{ fontSize: '0.82rem', color: '#92610a' }}>
                {flagged.map(f => f.skill_name).join(' · ')}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#a07020', marginTop: '0.3rem' }}>
                These skills have regressed 2+ times. Keep going — you've got this! 💪
              </div>
            </div>
          </div>
        )}

        {/* ── Subject filter tabs ── */}
        <div style={s.tabRow}>
          {(['All', ...SUBJECTS] as const).map(sub => {
            const isActive = activeSubject === sub
            const meta = sub !== 'All' ? subjectMeta[sub] : null
            return (
              <button
                key={sub}
                className={`sp-tab${isActive ? ' sp-tab-on' : ''}`}
                style={{
                  ...s.tabBtn,
                  ...(isActive
                    ? { background: '#0d3d20', color: '#ffd166', borderColor: '#0d3d20' }
                    : {}),
                }}
                onClick={() => filterSubject(sub)}
              >
                {meta && <span>{meta.icon}</span>}
                {sub}
              </button>
            )
          })}
        </div>

        {/* ── Table / empty ── */}
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <span style={{ fontSize: '2.5rem' }}>
              {mastery.length === 0 ? '📝' : '🔍'}
            </span>
            <p style={{ margin: 0, fontWeight: 600, color: '#0d3d20' }}>
              {mastery.length === 0 ? 'No quiz attempts yet!' : `No skills for ${activeSubject} yet.`}
            </p>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
              {mastery.length === 0
                ? 'Complete a quiz to see your progress here.'
                : 'Try a quiz in this subject to start tracking your mastery.'}
            </p>
          </div>
        ) : (
          <div className="sp-content" style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Skill', 'Subject', 'Difficulty', 'Mastery', 'Regressions', 'Last Updated'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const mm = masteryMeta[m.mastery_level] ?? masteryMeta['Needs Help']
                  const dm = diffMeta[m.difficulty_level] ?? diffMeta['Basic']
                  const sm = subjectMeta[m.subject]
                  return (
                    <tr key={i} className="sp-tr" style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td style={{ ...s.td, fontWeight: 600, color: '#0d3d20' }}>
                        {m.skill_name}
                      </td>
                      <td style={s.td}>
                        {sm && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: sm.bg, color: sm.color,
                            border: `1px solid ${sm.border}`,
                            fontSize: '0.72rem', fontWeight: 700,
                            padding: '0.2rem 0.6rem', borderRadius: '6px',
                          }}>
                            {sm.icon} {m.subject}
                          </span>
                        )}
                      </td>
                      <td style={s.td}>
                        <span style={{
                          ...s.pill,
                          background: dm.bg,
                          color: dm.color,
                        }}>
                          {m.difficulty_level}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{
                          ...s.pill,
                          background: mm.bg,
                          color: mm.color,
                          border: `1px solid ${mm.border}`,
                          fontWeight: 700,
                        }}>
                          {mm.icon} {m.mastery_level}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' as const }}>
                        <span style={{
                          fontWeight: m.regression_count >= 2 ? 700 : 400,
                          color: m.regression_count >= 2 ? '#8b1a1a' : '#6b7280',
                          background: m.regression_count >= 2 ? '#fff0f0' : 'transparent',
                          padding: m.regression_count >= 2 ? '2px 8px' : '0',
                          borderRadius: '5px',
                          fontSize: '0.85rem',
                        }}>
                          {m.regression_count}{m.regression_count >= 2 ? ' ⚠️' : ''}
                        </span>
                      </td>
                      <td style={{ ...s.td, color: '#6b7280', fontSize: '0.8rem' }}>
                        {new Date(m.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </AppLayout>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:        { padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  topRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
  breadcrumb:  { fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a7a40', marginBottom: '0.35rem' },
  heading:     { fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: '#0d3d20', margin: '0 0 0.25rem' },
  muted:       { color: '#6b7280', fontSize: '0.875rem', margin: 0 },
  btnOutline:  { background: '#fff', color: '#0d3d20', border: '1.5px solid rgba(26,122,64,0.35)', borderRadius: '9px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' },

  statGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' },
  statCard:    { borderRadius: '18px', padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', cursor: 'default' },
  statIcon:    { fontSize: '1.5rem', lineHeight: 1 },
  statNum:     { fontSize: '1.9rem', fontWeight: 800, lineHeight: 1, marginTop: '0.2rem' },
  statLabel:   { fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginTop: '0.2rem', textAlign: 'center' as const },

  barCard:     { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '1.35rem 1.5rem', marginBottom: '1.25rem', boxShadow: '0 2px 10px rgba(13,61,32,0.04)' },
  barLabel:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  bigBar:      { height: '30px', borderRadius: '10px', background: '#e5e7eb', display: 'flex', overflow: 'hidden', marginBottom: '0.75rem' },
  barSeg:      { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', minWidth: '32px', transition: 'width 0.5s ease' },
  barLegend:   { display: 'flex', gap: '1.25rem', fontSize: '0.8rem', flexWrap: 'wrap' as const, fontWeight: 500, color: '#1a1f16' },
  legendItem:  { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  dot:         { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, display: 'inline-block' },

  alert:       { display: 'flex', gap: '0.9rem', alignItems: 'flex-start', background: '#fffbf0', border: '1.5px solid rgba(200,130,0,0.30)', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(200,130,0,0.08)' },
  alertIconWrap: { fontSize: '1.3rem', flexShrink: 0, marginTop: '1px' },

  tabRow:      { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, marginBottom: '1.5rem' },
  tabBtn:      { display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1.5px solid rgba(26,122,64,0.15)', borderRadius: '9px', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s, border-color 0.15s' },

  tableWrap:   { borderRadius: '18px', overflow: 'hidden', border: '1.5px solid rgba(26,122,64,0.13)', boxShadow: '0 2px 12px rgba(13,61,32,0.05)' },
  table:       { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.875rem' },
  th:          { textAlign: 'left' as const, padding: '0.75rem 1rem', background: '#0d3d20', color: '#ffd166', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 700 },
  trEven:      { background: '#fff' },
  trOdd:       { background: '#fdfaf5' },
  td:          { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)', color: '#1a1f16', verticalAlign: 'middle' as const },
  pill:        { fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '6px', display: 'inline-block' },

  empty:       { background: '#fff', border: '1.5px solid rgba(26,122,64,0.13)', borderRadius: '18px', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' as const },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  errorCard:   { background: '#fff0f0', border: '1.5px solid rgba(155,28,28,0.18)', borderRadius: '18px', padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  spinner:     { width: '40px', height: '40px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'sp-spin 0.8s linear infinite' },
}