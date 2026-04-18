'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase'
import type { MasteryLevel, Subject } from '@/types/linuri'

interface UserRow    { id:string; name:string; email:string; role:string; created_at:string }
interface ClassRow   { id:string; section_name:string; join_code:string; teacher_id:string; users:{name:string}|null }
interface MasteryRow { student_id:string; skill_name:string; subject:Subject; mastery_level:MasteryLevel; difficulty_level:string; regression_count:number; updated_at:string; users:{name:string}|null }

export default function AdminDashboardPage() {
  const router = useRouter()
  const [users, setUsers]         = useState<UserRow[]>([])
  const [classes, setClasses]     = useState<ClassRow[]>([])
  const [mastery, setMastery]     = useState<MasteryRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview'|'users'|'classes'|'report'>('overview')

  useEffect(() => {
    async function load() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) { router.replace('/login'); return }
        const { data: ud, error: ue } = await supabase.from('users').select('*').order('created_at',{ascending:false})
        if (ue) throw ue
        setUsers((ud as UserRow[]) ?? [])
        const { data: cd, error: ce } = await supabase.from('classes').select('*, users(name)').order('created_at',{ascending:false})
        if (ce) throw ce
        setClasses((cd as unknown as ClassRow[]) ?? [])
        const { data: md, error: me } = await supabase.from('mastery_history').select('*, users(name)').order('updated_at',{ascending:false})
        if (me) throw me
        setMastery((md as unknown as MasteryRow[]) ?? [])
      } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load.') }
      finally { setLoading(false) }
    }
    load()
  }, [router])

  if (loading) return <AppLayout title="Admin Dashboard"><div style={S.center}><div style={S.spin}/><p style={S.muted}>Loading…</p></div></AppLayout>
  if (error)   return <AppLayout title="Admin Dashboard"><div style={S.center}><div style={S.errCard}><span style={{fontSize:'2rem'}}>⚠️</span><p style={{color:'#8b1a1a',fontWeight:600,margin:0}}>{error}</p></div></div></AppLayout>

  const teachers = users.filter(u => u.role==='teacher')
  const students = users.filter(u => u.role==='student')
  const mastered = mastery.filter(m => m.mastery_level==='Mastered').length
  const develop  = mastery.filter(m => m.mastery_level==='Developing').length
  const needs    = mastery.filter(m => m.mastery_level==='Needs Help').length
  const flagged  = mastery.filter(m => m.regression_count>=2).length

  const statCards = [
    { label:'Students',   value:students.length, icon:'🎒', bg:'#eaf6ef', color:'#0d3d20', border:'rgba(26,122,64,0.18)' },
    { label:'Teachers',   value:teachers.length, icon:'👩‍🏫', bg:'#eaf6ef', color:'#0d3d20', border:'rgba(26,122,64,0.18)' },
    { label:'Classes',    value:classes.length,  icon:'🏫', bg:'#eaf6ef', color:'#0d3d20', border:'rgba(26,122,64,0.18)' },
    { label:'Mastered',   value:mastered,        icon:'⭐', bg:'#eaf6ef', color:'#0d5c28', border:'rgba(26,122,64,0.22)' },
    { label:'Developing', value:develop,         icon:'📈', bg:'#fffbf0', color:'#7a5500', border:'rgba(200,130,0,0.2)' },
    { label:'Needs Help', value:needs,           icon:'🆘', bg:'#fff0f0', color:'#8b1a1a', border:'rgba(155,28,28,0.18)' },
    { label:'Flagged',    value:flagged,         icon:'⚠️', bg:'#fff0f0', color:'#8b1a1a', border:'rgba(155,28,28,0.18)' },
  ]

  const tabs = ['overview','users','classes','report'] as const
  const tabIcons: Record<string,string> = { overview:'📊', users:'👥', classes:'🏫', report:'📄' }

  return (
    <AppLayout title="Admin Dashboard">
      <style>{`
        @keyframes pg-fade { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin    { to{transform:rotate(360deg);} }
        .pg { animation: pg-fade 0.22s ease both; }
        .tab-btn { display:flex; align-items:center; gap:0.4rem; background:#fff; border:1.5px solid rgba(26,122,64,0.15); border-radius:9px; padding:0.55rem 1.1rem; font-size:0.9rem; font-weight:600; cursor:pointer; color:#6b7280; font-family:inherit; transition:all 0.14s; }
        .tab-btn:hover:not(.tab-on) { background:#eaf6ef; color:#0d3d20; }
        .tab-btn.tab-on { background:#0d3d20; color:#ffd166; border-color:#0d3d20; }
        .adm-tr:hover td { background:#f0f9f4 !important; }
        .adm-content { animation: pg-fade 0.22s ease both; }
        .stat-c { transition:box-shadow 0.18s,transform 0.18s; }
        .stat-c:hover { box-shadow:0 8px 24px rgba(13,61,32,0.10); transform:translateY(-2px); }
      `}</style>

      <div className="pg">
        {/* Header */}
        <div style={S.topRow}>
          <div>
            <div style={S.crumb}>Admin · School Overview</div>
            <h1 style={S.h1}>Admin Dashboard</h1>
            <p style={S.muted}>United Methodist Cooperative Learning System, Inc. — Caloocan City</p>
          </div>
          <button style={S.printBtn} onClick={() => window.print()}>🖨️ Print Report</button>
        </div>

        {/* Stats */}
        <div style={S.statGrid}>
          {statCards.map(c => (
            <div key={c.label} className="stat-c" style={{ ...S.statCard, background:c.bg, border:`1.5px solid ${c.border}` }}>
              <span style={{ fontSize:'1.4rem' }}>{c.icon}</span>
              <span style={{ fontSize:'1.75rem', fontWeight:800, color:c.color, lineHeight:1 }}>{c.value}</span>
              <span style={S.statLabel}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={S.tabRow}>
          {tabs.map(t => (
            <button key={t} className={`tab-btn${activeTab===t?' tab-on':''}`} onClick={() => setActiveTab(t)}>
              <span>{tabIcons[t]}</span>{t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="adm-content" style={S.section}>
            <div style={S.secHead}>
              <h2 style={S.h2}>School-wide Mastery</h2>
              {mastery.length > 0 && <span style={S.badge}>{mastery.length} records</span>}
            </div>
            {mastery.length === 0 ? (
              <div style={S.empty}><span style={{fontSize:'2.5rem'}}>📭</span><p style={{fontWeight:600,color:'#0d3d20'}}>No quiz data yet.</p></div>
            ) : (
              <>
                <div style={S.barWrap}>
                  <div style={S.bar}>
                    {mastered>0 && <div style={{...S.barSeg,width:`${Math.round(mastered/mastery.length*100)}%`,background:'linear-gradient(90deg,#1a7a40,#0d5c28)'}}>{Math.round(mastered/mastery.length*100)}%</div>}
                    {develop>0  && <div style={{...S.barSeg,width:`${Math.round(develop/mastery.length*100)}%`, background:'linear-gradient(90deg,#d4a017,#b07800)'}}>{Math.round(develop/mastery.length*100)}%</div>}
                    {needs>0    && <div style={{...S.barSeg,width:`${Math.round(needs/mastery.length*100)}%`,   background:'linear-gradient(90deg,#c0392b,#8b1a1a)'}}>{Math.round(needs/mastery.length*100)}%</div>}
                  </div>
                  <div style={S.barLegend}>
                    {[['#1a7a40','Mastered',mastered],['#d4a017','Developing',develop],['#c0392b','Needs Help',needs]].map(([clr,lbl,val]) => (
                      <span key={lbl as string} style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.82rem',fontWeight:500}}>
                        <span style={{width:'10px',height:'10px',borderRadius:'50%',background:clr as string,flexShrink:0}}/>
                        {lbl as string} ({val as number})
                      </span>
                    ))}
                  </div>
                </div>
                <h3 style={{...S.h2,fontSize:'1rem',margin:'1.75rem 0 1rem'}}>By Subject</h3>
                <div style={S.subGrid}>
                  {(['English','Mathematics','Science'] as Subject[]).map(sub => {
                    const rows = mastery.filter(m => m.subject===sub)
                    const m2=rows.filter(m=>m.mastery_level==='Mastered').length
                    const d2=rows.filter(m=>m.mastery_level==='Developing').length
                    const n2=rows.filter(m=>m.mastery_level==='Needs Help').length
                    const t2=rows.length||1
                    const icons: Record<string,string>={English:'📖',Mathematics:'🔢',Science:'🔬'}
                    return (
                      <div key={sub} style={S.subCard}>
                        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
                          <span style={{fontSize:'1.15rem'}}>{icons[sub]}</span>
                          <span style={{fontFamily:"'Lora',serif",fontWeight:700,color:'#0d3d20',fontSize:'0.95rem'}}>{sub}</span>
                        </div>
                        <div style={{height:'5px',borderRadius:'99px',background:'#e5e7eb',overflow:'hidden',marginBottom:'0.75rem'}}>
                          <div style={{height:'100%',width:`${Math.round(m2/t2*100)}%`,background:'#1a7a40',borderRadius:'99px'}}/>
                        </div>
                        {[['⭐ Mastered',m2,'#0d5c28'],['📈 Developing',d2,'#7a5500'],['🆘 Needs Help',n2,'#8b1a1a']].map(([lbl,val,clr])=>(
                          <div key={lbl as string} style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',marginBottom:'0.2rem'}}>
                            <span style={{color:clr as string,fontWeight:500}}>{lbl as string}</span>
                            <strong style={{color:clr as string}}>{val as number}</strong>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className="adm-content" style={S.section}>
            <div style={S.secHead}><h2 style={S.h2}>All Users</h2><span style={S.badge}>{users.length} total</span></div>
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead><tr>{['Name','Email','Role','Joined'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.map((u,i)=>(
                    <tr key={u.id} className="adm-tr" style={i%2===0?S.trEven:S.trOdd}>
                      <td style={{...S.td,fontWeight:600}}>
                        <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                          <div style={{...S.av,background:u.role==='admin'?'#fff0f0':u.role==='teacher'?'#fffbf0':'#eaf6ef',color:u.role==='admin'?'#8b1a1a':u.role==='teacher'?'#7a5500':'#0d5c28'}}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>{u.name}
                        </div>
                      </td>
                      <td style={{...S.td,color:'#6b7280',fontSize:'0.85rem'}}>{u.email}</td>
                      <td style={S.td}>
                        <span style={{...S.pill,background:u.role==='admin'?'#fff0f0':u.role==='teacher'?'#fffbf0':'#eaf6ef',color:u.role==='admin'?'#8b1a1a':u.role==='teacher'?'#7a5500':'#0d5c28',border:`1px solid ${u.role==='admin'?'rgba(155,28,28,0.18)':u.role==='teacher'?'rgba(200,130,0,0.18)':'rgba(26,122,64,0.18)'}`}}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{...S.td,fontSize:'0.85rem',color:'#6b7280'}}>{new Date(u.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classes tab */}
        {activeTab === 'classes' && (
          <div className="adm-content" style={S.section}>
            <div style={S.secHead}><h2 style={S.h2}>All Classes</h2><span style={S.badge}>{classes.length} total</span></div>
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead><tr>{['Section','Teacher','Join Code'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {classes.map((c,i)=>(
                    <tr key={c.id} className="adm-tr" style={i%2===0?S.trEven:S.trOdd}>
                      <td style={{...S.td,fontWeight:600}}>{c.section_name}</td>
                      <td style={S.td}>{c.users?.name??'—'}</td>
                      <td style={S.td}><span style={{fontFamily:'monospace',letterSpacing:'0.12em',color:'#0d3d20',fontWeight:700,background:'#eaf6ef',padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.875rem'}}>{c.join_code}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report tab */}
        {activeTab === 'report' && (
          <div className="adm-content" style={S.section}>
            <div style={S.secHead}><h2 style={S.h2}>School-wide Mastery Report</h2><span style={S.badge}>{mastery.length} records</span></div>
            <p style={{...S.muted,marginBottom:'1.25rem'}}>Full mastery records. Use <strong>Print Report</strong> above to export as PDF.</p>
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead><tr>{['Student','Skill','Subject','Difficulty','Mastery','Regressions','Updated'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {mastery.map((m,i)=>(
                    <tr key={i} className="adm-tr" style={i%2===0?S.trEven:S.trOdd}>
                      <td style={{...S.td,fontWeight:600}}>{m.users?.name??'—'}</td>
                      <td style={S.td}>{m.skill_name}</td>
                      <td style={S.td}>{m.subject}</td>
                      <td style={S.td}>{m.difficulty_level}</td>
                      <td style={S.td}>
                        <span style={{...S.pill,background:m.mastery_level==='Mastered'?'#eaf6ef':m.mastery_level==='Developing'?'#fffbf0':'#fff0f0',color:m.mastery_level==='Mastered'?'#0d5c28':m.mastery_level==='Developing'?'#7a5500':'#8b1a1a',border:`1px solid ${m.mastery_level==='Mastered'?'rgba(26,122,64,0.18)':m.mastery_level==='Developing'?'rgba(200,130,0,0.18)':'rgba(155,28,28,0.14)'}`}}>
                          {m.mastery_level}
                        </span>
                      </td>
                      <td style={{...S.td,textAlign:'center',color:m.regression_count>=2?'#8b1a1a':'#6b7280',fontWeight:m.regression_count>=2?700:400}}>
                        {m.regression_count}{m.regression_count>=2?' ⚠️':''}
                      </td>
                      <td style={{...S.td,fontSize:'0.82rem',color:'#6b7280'}}>{new Date(m.updated_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

const S: Record<string, React.CSSProperties> = {
  topRow:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'2rem' },
  crumb:    { fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'#1a7a40', marginBottom:'0.3rem' },
  h1:       { fontFamily:"'Lora', serif", fontSize:'clamp(1.6rem, 4vw, 2rem)', fontWeight:700, color:'#0d3d20', margin:'0 0 0.2rem' },
  h2:       { fontFamily:"'Lora', serif", fontSize:'1.25rem', fontWeight:700, color:'#0d3d20', margin:0 },
  muted:    { color:'#6b7280', fontSize:'0.9rem' },
  printBtn: { display:'flex', alignItems:'center', gap:'0.4rem', background:'#0d3d20', color:'#ffd166', border:'none', borderRadius:'10px', padding:'0.65rem 1.35rem', fontWeight:700, fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(13,61,32,0.18)', whiteSpace:'nowrap', flexShrink:0 },
  statGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(105px,1fr))', gap:'0.75rem', marginBottom:'2rem' },
  statCard: { borderRadius:'14px', padding:'1.1rem 0.75rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem', cursor:'default' },
  statLabel:{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#6b7280', textAlign:'center' },
  tabRow:   { display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.75rem' },
  section:  { marginBottom:'2rem' },
  secHead:  { display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' },
  badge:    { background:'#eaf6ef', color:'#0d5c28', fontSize:'0.72rem', fontWeight:700, padding:'3px 10px', borderRadius:'20px' },
  barWrap:  { background:'#fff', border:'1.5px solid rgba(26,122,64,0.13)', borderRadius:'14px', padding:'1.35rem 1.5rem', marginBottom:'0.5rem' },
  bar:      { height:'30px', borderRadius:'8px', background:'#e5e7eb', display:'flex', overflow:'hidden', marginBottom:'0.75rem' },
  barSeg:   { height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700, color:'#fff', minWidth:'30px' },
  barLegend:{ display:'flex', gap:'1.25rem', flexWrap:'wrap' },
  subGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))', gap:'1rem' },
  subCard:  { background:'#fff', border:'1.5px solid rgba(26,122,64,0.13)', borderRadius:'14px', padding:'1.2rem' },
  tableWrap:{ borderRadius:'14px', overflow:'hidden', border:'1.5px solid rgba(26,122,64,0.13)', boxShadow:'0 2px 12px rgba(13,61,32,0.05)', overflowX:'auto' },
  table:    { width:'100%', borderCollapse:'collapse', fontSize:'0.9rem', minWidth:'560px' },
  th:       { textAlign:'left', padding:'0.75rem 1rem', background:'#0d3d20', color:'#ffd166', fontSize:'0.65rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700 },
  trEven:   { background:'#fff' },
  trOdd:    { background:'#fdfaf5' },
  td:       { padding:'0.82rem 1rem', borderBottom:'1px solid rgba(26,122,64,0.07)', color:'#1a1f16', verticalAlign:'middle' },
  av:       { width:'30px', height:'30px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.75rem', flexShrink:0 },
  pill:     { fontSize:'0.73rem', fontWeight:700, padding:'0.25rem 0.65rem', borderRadius:'6px', display:'inline-block' },
  empty:    { background:'#fff', border:'1.5px solid rgba(26,122,64,0.13)', borderRadius:'14px', padding:'3rem 2rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem', color:'#6b7280', textAlign:'center' },
  center:   { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem' },
  errCard:  { background:'#fff0f0', border:'1.5px solid rgba(155,28,28,0.18)', borderRadius:'14px', padding:'2.5rem 3rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' },
  spin:     { width:'38px', height:'38px', border:'4px solid #eaf6ef', borderTop:'4px solid #1a7a40', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
}