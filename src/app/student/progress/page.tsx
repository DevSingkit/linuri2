// src/app/student/progress/page.tsx
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

  const mastered   = mastery.filter(m => m.mastery_level === 'Mastered').length
  const developing = mastery.filter(m => m.mastery_level === 'Developing').length
  const needsHelp  = mastery.filter(m => m.mastery_level === 'Needs Help').length
  const flagged    = mastery.filter(m => m.regression_count >= 2)

  const subjectMeta: Record<string, { icon: string; color: string; bg: string; border: string }> = {
    English:     { icon: '📖', color: '#1a3a6b', bg: '#eef4ff', border: 'rgba(26,58,107,0.18)' },
    Mathematics: { icon: '🔢', color: '#0d5c28', bg: '#eaf6ef', border: 'rgba(26,122,64,0.18)' },
    Science:     { icon: '🔬', color: '#6c3483', bg: '#f5eefa', border: 'rgba(108,52,131,0.18)' },
  }
  const masteryMeta: Record<string, { bg: string; color: string; border: string; icon: string }> = {
    'Mastered':   { bg: '#eaf6ef', color: '#0d5c28', border: 'rgba(26,122,64,0.18)', icon: '⭐' },
    'Developing': { bg: '#fffbf0', color: '#7a5500', border: 'rgba(200,130,0,0.18)', icon: '📈' },
    'Needs Help': { bg: '#fff0f0', color: '#8b1a1a', border: 'rgba(155,28,28,0.14)', icon: '💪' },
  }
  const diffMeta: Record<string, { bg: string; color: string }> = {
    'Advanced': { bg: '#fff0f0', color: '#8b1a1a' },
    'Standard': { bg: '#fffbf0', color: '#7a5500' },
    'Basic':    { bg: '#eaf6ef', color: '#0d5c28' },
  }

  if (loading) return (
    <AppLayout title="My Progress">
      <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.center}>
        <div style={s.spinner} />
        <p style={{ color: '#6b7280', fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>Loading your progress…</p>
      </div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="My Progress">
      <div style={s.center}>
        <div style={{ background: '#fff0f0', border: '2px solid rgba(155,28,28,0.18)', borderRadius: '20px', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '2.5rem' }}>😟</span>
          <p style={{ color: '#8b1a1a', fontWeight: 700, margin: 0 }}>{error}</p>
        </div>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title="My Progress">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@700;800;900&display=swap');
        @keyframes sp-spin  { to { transform: rotate(360deg); } }
        @keyframes sp-fade  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        :root { --fun: 'Nunito', sans-serif; --font: 'Plus Jakarta Sans', sans-serif; }

        /* Stat cards */
        .sp-stat { transition: transform 0.18s, box-shadow 0.18s; cursor: default; }
        .sp-stat:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }

        /* Tabs */
        .sp-tab { display: flex; align-items: center; gap: 0.4rem; border-radius: 12px; padding: 0.55rem 1.1rem; font-size: 0.88rem; font-weight: 800; cursor: pointer; font-family: var(--fun); transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s; }
        .sp-tab:hover:not(.sp-tab-on) { background: #eaf6ef !important; color: #0d3d20 !important; border-color: rgba(26,122,64,0.3) !important; transform: translateY(-1px); }

        /* Back button */
        .sp-back { transition: background 0.15s, transform 0.15s; }
        .sp-back:hover { background: #eaf6ef !important; transform: translateY(-1px); }

        /* Table rows */
        .sp-tr:hover td { background: #f0f9f4 !important; }

        /* Content animation */
        .sp-content { animation: sp-fade 0.25s ease both; }
        .sp-alert   { animation: sp-fade 0.3s ease both; }
      `}</style>

      <div style={s.page}>

        {/* Header */}
        <div style={s.topRow}>
          <div>
            <div style={s.breadcrumb}>My Learning Journey</div>
            <h1 style={s.heading}>My Progress 📊</h1>
            <p style={s.muted}>See how you're doing across all your skills!</p>
          </div>
          <button className="sp-back" style={s.btnOutline} onClick={() => router.push('/student')}>
            ← Dashboard
          </button>
        </div>

        {/* Stat cards */}
        <div style={s.statGrid}>
          {[
            { label: 'Skills Tracked', value: mastery.length, icon: '🧠', bg: '#fdfaf5', color: '#0d3d20', border: '2px solid rgba(26,122,64,0.13)' },
            { label: 'Mastered',       value: mastered,       icon: '⭐', bg: '#eaf6ef', color: '#0d5c28', border: '2px solid rgba(26,122,64,0.22)' },
            { label: 'Developing',     value: developing,     icon: '📈', bg: '#fffbf0', color: '#7a5500', border: '2px solid rgba(200,130,0,0.20)' },
            { label: 'Needs Help',     value: needsHelp,      icon: '💪', bg: '#fff0f0', color: '#8b1a1a', border: '2px solid rgba(155,28,28,0.18)' },
          ].map(c => (
            <div key={c.label} className="sp-stat" style={{ ...s.statCard, background: c.bg, border: c.border }}>
              <span style={{ fontSize: '1.7rem', lineHeight: 1, marginBottom: '0.2rem' }}>{c.icon}</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '2rem', fontWeight: 900, lineHeight: 1, color: c.color }}>{c.value}</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6b7280', textAlign: 'center', marginTop: '0.15rem' }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {mastery.length > 0 && (
          <div style={s.barCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#0d3d20', fontSize: '0.95rem' }}>Overall Mastery</span>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>{mastery.length} skills tracked</span>
            </div>
            <div style={{ height: '22px', borderRadius: '12px', background: '#e5e7eb', display: 'flex', overflow: 'hidden', marginBottom: '0.75rem' }}>
              {mastered > 0 && (
                <div style={{ width: `${Math.round((mastered / mastery.length) * 100)}%`, background: 'linear-gradient(90deg,#1a7a40,#0d5c28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', minWidth: '28px', transition: 'width 0.5s ease', fontFamily: "'Nunito',sans-serif" }}>
                  {Math.round((mastered / mastery.length) * 100)}%
                </div>
              )}
              {developing > 0 && (
                <div style={{ width: `${Math.round((developing / mastery.length) * 100)}%`, background: 'linear-gradient(90deg,#d4a017,#b07800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', minWidth: '28px', transition: 'width 0.5s ease', fontFamily: "'Nunito',sans-serif" }}>
                  {Math.round((developing / mastery.length) * 100)}%
                </div>
              )}
              {needsHelp > 0 && (
                <div style={{ width: `${Math.round((needsHelp / mastery.length) * 100)}%`, background: 'linear-gradient(90deg,#c0392b,#8b1a1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', minWidth: '28px', transition: 'width 0.5s ease', fontFamily: "'Nunito',sans-serif" }}>
                  {Math.round((needsHelp / mastery.length) * 100)}%
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', flexWrap: 'wrap', fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1a7a40', display: 'inline-block' }} />Mastered ({mastered})</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d4a017', display: 'inline-block' }} />Developing ({developing})</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c0392b', display: 'inline-block' }} />Needs Help ({needsHelp})</span>
            </div>
          </div>
        )}

        {/* Flagged alert */}
        {flagged.length > 0 && (
          <div className="sp-alert" style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', background: '#fffbf0', border: '2px solid rgba(200,130,0,0.30)', borderRadius: '18px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#7a5500', fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                Skills needing extra practice ({flagged.length})
              </div>
              <div style={{ fontSize: '0.82rem', color: '#92610a', fontWeight: 600 }}>
                {flagged.map(f => f.skill_name).join(' · ')}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#a07020', marginTop: '0.3rem', fontWeight: 600 }}>
                These have regressed 2+ times. Keep going — you've got this! 💪
              </div>
            </div>
          </div>
        )}

        {/* Subject filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {(['All', ...SUBJECTS] as const).map(sub => {
            const isOn = activeSubject === sub
            const meta = sub !== 'All' ? subjectMeta[sub] : null
            return (
              <button
                key={sub}
                className={`sp-tab${isOn ? ' sp-tab-on' : ''}`}
                style={{
                  background: isOn ? '#0d3d20' : '#fff',
                  color:      isOn ? '#ffd166'  : '#6b7280',
                  border:     isOn ? '2px solid #0d3d20' : '2px solid rgba(26,122,64,0.15)',
                }}
                onClick={() => filterSubject(sub)}
              >
                {meta && <span>{meta.icon}</span>}
                {sub}
              </button>
            )
          })}
        </div>

        {/* Table or empty */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '2px dashed rgba(26,122,64,0.2)', borderRadius: '20px', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem' }}>{mastery.length === 0 ? '📝' : '🔍'}</span>
            <p style={{ margin: 0, fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#0d3d20', fontSize: '1.1rem' }}>
              {mastery.length === 0 ? 'No quiz attempts yet!' : `No skills for ${activeSubject} yet.`}
            </p>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.88rem', fontWeight: 600 }}>
              {mastery.length === 0 ? 'Complete a quiz to see your progress here.' : 'Try a quiz in this subject to start tracking!'}
            </p>
          </div>
        ) : (
          <div className="sp-content" style={{ borderRadius: '20px', overflow: 'hidden', border: '2px solid rgba(26,122,64,0.13)', boxShadow: '0 2px 16px rgba(13,61,32,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {['Skill', 'Subject', 'Difficulty', 'Mastery', 'Regressions', 'Last Updated'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', background: '#0d3d20', color: '#ffd166', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 800, fontFamily: "'Nunito', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const mm = masteryMeta[m.mastery_level] ?? masteryMeta['Needs Help']
                  const dm = diffMeta[m.difficulty_level]  ?? diffMeta['Basic']
                  const sm = subjectMeta[m.subject]
                  return (
                    <tr key={i} className="sp-tr" style={{ background: i % 2 === 0 ? '#fff' : '#fdfaf5' }}>
                      <td style={{ padding: '0.78rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)', fontWeight: 700, color: '#0d3d20', fontFamily: "'Nunito', sans-serif" }}>{m.skill_name}</td>
                      <td style={{ padding: '0.78rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)' }}>
                        {sm && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontSize: '0.72rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: '8px' }}>
                            {sm.icon} {m.subject}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.78rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: '8px', background: dm.bg, color: dm.color, display: 'inline-block' }}>
                          {m.difficulty_level}
                        </span>
                      </td>
                      <td style={{ padding: '0.78rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: '8px', background: mm.bg, color: mm.color, border: `1px solid ${mm.border}`, display: 'inline-block' }}>
                          {mm.icon} {m.mastery_level}
                        </span>
                      </td>
                      <td style={{ padding: '0.78rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)', textAlign: 'center' }}>
                        <span style={{ fontWeight: m.regression_count >= 2 ? 800 : 500, color: m.regression_count >= 2 ? '#8b1a1a' : '#6b7280', background: m.regression_count >= 2 ? '#fff0f0' : 'transparent', padding: m.regression_count >= 2 ? '2px 10px' : '0', borderRadius: '8px', fontSize: '0.85rem', fontFamily: m.regression_count >= 2 ? "'Nunito', sans-serif" : 'inherit' }}>
                          {m.regression_count}{m.regression_count >= 2 ? ' ⚠️' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '0.78rem 1rem', borderBottom: '1px solid rgba(26,122,64,0.08)', color: '#6b7280', fontSize: '0.8rem', fontWeight: 600 }}>
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
  page:      { padding: '1.25rem 1rem 3rem', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  topRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' },
  breadcrumb:{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a7a40', marginBottom: '0.3rem', fontFamily: "'Nunito', sans-serif" },
  heading:   { fontFamily: "'Nunito', sans-serif", fontSize: 'clamp(1.75rem, 5vw, 2.2rem)', fontWeight: 900, color: '#0d3d20', margin: '0 0 0.25rem' },
  muted:     { color: '#6b7280', fontSize: '0.875rem', margin: 0, fontWeight: 600 },
  btnOutline:{ background: '#fff', color: '#0d3d20', border: '2px solid rgba(26,122,64,0.25)', borderRadius: '12px', padding: '0.65rem 1.25rem', fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' },
  statGrid:  { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' },
  statCard:  { borderRadius: '20px', padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  barCard:   { background: '#fff', border: '2px solid rgba(26,122,64,0.13)', borderRadius: '20px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' },
  center:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner:   { width: '40px', height: '40px', border: '4px solid #eaf6ef', borderTop: '4px solid #1a7a40', borderRadius: '50%', animation: 'sp-spin 0.8s linear infinite' },
}