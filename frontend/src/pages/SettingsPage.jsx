import { useState } from 'react'
import { loadDemoData, resetAllData, runDelayCheck, generateWeeklySummary } from '../api'

export default function SettingsPage() {
  const [seeding,  setSeeding]  = useState(false)
  const [seedMsg,  setSeedMsg]  = useState(null)
  const [resetting,setResetting]= useState(false)
  const [resetMsg, setResetMsg] = useState(null)
  const [checking, setChecking] = useState(false)
  const [checkMsg, setCheckMsg] = useState(null)
  const [genMsg,   setGenMsg]   = useState(null)

  const handleLoadDemo = async () => {
    setSeeding(true); setSeedMsg(null)
    try {
      const res = await loadDemoData()
      setSeedMsg(`✅ Demo data loaded — ${res.data.imported} feedback records imported and analysed`)
    } catch { setSeedMsg('❌ Failed to load demo data.') }
    setSeeding(false)
  }

  const handleReset = async () => {
    if (!window.confirm('Reset ALL data? This clears localStorage and cannot be undone.')) return
    setResetting(true); setResetMsg(null)
    await resetAllData()
    setResetMsg('✅ All data cleared. Reload the page to start fresh.')
    setResetting(false)
  }

  const handleSLACheck = async () => {
    setChecking(true); setCheckMsg(null)
    try {
      const res = await runDelayCheck()
      const d = res.data
      setCheckMsg(`✅ SLA check — ${d.checked} tasks checked · ${d.newly_delayed} newly delayed · ${d.newly_escalated} escalated`)
    } catch { setCheckMsg('❌ SLA check failed') }
    setChecking(false)
  }

  const handleWeekly = async () => {
    setGenMsg(null)
    try {
      await generateWeeklySummary()
      setGenMsg('✅ Weekly summary regenerated successfully')
    } catch { setGenMsg('❌ Failed to generate summary') }
  }

  const msg = (m, ok = true) => m && (
    <div style={{
      padding:'10px 14px', borderRadius:8, marginTop:8,
      background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
      color: ok ? '#34d399' : '#f87171', fontSize:'0.85rem'
    }}>{m}</div>
  )

  const row = (title, desc, btn) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
      <div>
        <div style={{fontWeight:600,color:'var(--clr-text)',marginBottom:3}}>{title}</div>
        <div style={{fontSize:'0.82rem',color:'var(--clr-text-muted)'}}>{desc}</div>
      </div>
      {btn}
    </div>
  )

  return (
    <main className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings &amp; Demo Controls</h1>
        <p className="page-subtitle">System information, demo data management, and engine controls for course demonstration</p>
      </div>

      {/* System Info */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-title">System Information</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
          {[
            ['System Name',   'SegmentAI Feedback Decision System'],
            ['Version',       '1.0.0 — Functional Prototype (V1)'],
            ['AI Engine',     'Rule-based NLP Classifier (localStorage)'],
            ['Data Layer',    'Browser LocalStorage — No backend dependency'],
            ['Frontend',      'React 18 + Vite + Recharts + Vanilla CSS'],
            ['Deployment',    'Vercel (Static Frontend Hosting)'],
            ['Academic Use',  'AI Applied Engineering · Master\'s Thesis Prototype'],
            ['Currency',      'EUR (€) — Segment thresholds: Premium ≥ €2000, Medium €500–1999'],
          ].map(([k,v]) => (
            <div key={k} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid var(--clr-border)'}}>
              <span style={{fontWeight:600,color:'var(--clr-text-muted)',fontSize:'0.78rem',minWidth:130,flexShrink:0}}>{k}</span>
              <span style={{color:'var(--clr-text)',fontSize:'0.85rem'}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Controls */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-title">Demo Data &amp; Engine Controls</div>
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {row(
            '🌱 Load Demo Data',
            'Clear existing data and load 20 realistic feedback records through the full AI pipeline. Generates tasks, alerts, and weekly summary.',
            <button className="btn btn-primary" onClick={handleLoadDemo} disabled={seeding}>
              {seeding ? '⏳ Loading...' : 'Load Demo Data'}
            </button>
          )}
          {msg(seedMsg)}

          <div style={{height:1,background:'var(--clr-border)'}}/>

          {row(
            '🗑️ Reset All Data',
            'Permanently clear all localStorage data — feedback, tasks, alerts, and summaries. Page reload required after reset.',
            <button className="btn btn-danger" onClick={handleReset} disabled={resetting}>
              {resetting ? '⏳ Resetting...' : 'Reset All Data'}
            </button>
          )}
          {msg(resetMsg)}

          <div style={{height:1,background:'var(--clr-border)'}}/>

          {row(
            '⏰ Run SLA Delay Check',
            'Scan all active tasks. Mark overdue tasks as Delayed. Escalate Delayed tasks to the next management level and create alerts.',
            <button className="btn btn-outline" onClick={handleSLACheck} disabled={checking}>
              {checking ? '⏳ Running...' : 'Run SLA Check'}
            </button>
          )}
          {msg(checkMsg)}

          <div style={{height:1,background:'var(--clr-border)'}}/>

          {row(
            '📋 Generate Weekly Summary',
            'Recompute the weekly management report — KPIs, focus recommendation, and top 5 priority actions.',
            <button className="btn btn-outline" onClick={handleWeekly}>
              Generate Summary
            </button>
          )}
          {msg(genMsg)}
        </div>
      </div>

      {/* Workflow explanation */}
      <div className="card">
        <div className="card-title">Core AI Workflow</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[
            ['1','Customer Feedback','Submitted manually or via CSV import'],
            ['2','AI/Rule-based Analysis','Sentiment + issue category + customer segment classification'],
            ['3','Priority Assignment','Critical / Moderate / Low based on segment and sentiment'],
            ['4','Responsibility Allocation','Top / Middle / Operational management assignment'],
            ['5','Task Creation','Automatic task with SLA deadline per priority level'],
            ['6','Delay &amp; Escalation','SLA check escalates overdue tasks up the management chain'],
            ['7','Weekly Summary','Aggregated report with focus recommendation'],
            ['8','Dashboard','Real-time KPIs and charts across all pipeline stages'],
          ].map(([n,title,desc]) => (
            <div key={n} style={{display:'flex',gap:16,alignItems:'flex-start',padding:'10px 0',borderBottom:'1px solid var(--clr-border)'}}>
              <span style={{width:28,height:28,borderRadius:'50%',background:'rgba(99,102,241,0.15)',
                border:'1px solid rgba(99,102,241,0.3)',color:'#818cf8',fontWeight:700,
                fontSize:'0.78rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {n}
              </span>
              <div>
                <div style={{fontWeight:600,color:'var(--clr-text)',fontSize:'0.875rem'}} dangerouslySetInnerHTML={{__html:title}}/>
                <div style={{fontSize:'0.8rem',color:'var(--clr-text-muted)',marginTop:2}} dangerouslySetInnerHTML={{__html:desc}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
