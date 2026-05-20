import { useEffect, useState } from 'react'
import { getSummary, generateSummary, getTasks, getFeedback } from '../data/store'

export default function WeeklySummary() {
  const [summary,    setSummary]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)

  const load = () => { setSummary(getSummary()); setLoading(false) }
  useEffect(() => { load() }, [])

  const regenerate = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 600))
    setSummary(generateSummary())
    setGenerating(false)
  }

  if (loading) return <div className="loading-wrap"><div className="spinner"/><span>Loading summary...</span></div>

  const kpis = [
    { label:'Total Feedback',   value:summary?.total_feedback,   icon:'💬', color:'var(--clr-primary)' },
    { label:'Critical Issues',  value:summary?.critical_count,   icon:'🚨', color:'var(--clr-danger)' },
    { label:'Delayed Tasks',    value:summary?.delayed_count,    icon:'⏰', color:'var(--clr-warning)' },
    { label:'Escalated',        value:summary?.escalated_count,  icon:'📈', color:'#f87171' },
    { label:'Resolved Tasks',   value:summary?.resolved_count,   icon:'✅', color:'var(--clr-success)' },
    { label:'Unresolved',       value:summary?.unresolved_count, icon:'🔓', color:'#a78bfa' },
  ]

  return (
    <main className="page fade-in">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="page-title">Weekly Summary</h1>
          <p className="page-subtitle">
            {summary ? `Report period: ${summary.week_start} → ${summary.week_end}` : 'Auto-generated weekly management report'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={regenerate} disabled={generating}>
          {generating ? '⏳ Generating...' : '🔄 Regenerate Report'}
        </button>
      </div>

      {!summary ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p style={{fontWeight:600,color:'var(--clr-text)',marginBottom:12}}>No weekly summary yet</p>
          <button className="btn btn-primary" onClick={regenerate}>Generate Now</button>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="kpi-grid" style={{marginBottom:28}}>
            {kpis.map(k => (
              <div key={k.label} className="kpi-card" style={{'--kpi-color':k.color}}>
                <span className="kpi-icon">{k.icon}</span>
                <span className="kpi-value">{k.value ?? '—'}</span>
                <span className="kpi-label">{k.label}</span>
              </div>
            ))}
          </div>

          {/* Most common issue */}
          {summary.most_common_issue && (
            <div style={{marginBottom:20,padding:'12px 18px',display:'flex',alignItems:'center',gap:16,
              background:'var(--clr-surface)',border:'1px solid var(--clr-border)',borderRadius:12}}>
              <span style={{fontSize:'1.4rem'}}>📊</span>
              <div>
                <div style={{fontSize:'0.7rem',fontWeight:600,color:'var(--clr-text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Most Common Issue Category</div>
                <div style={{fontWeight:700,fontSize:'1.1rem',color:'var(--clr-text)',marginTop:2}}>{summary.most_common_issue}</div>
              </div>
            </div>
          )}

          {/* Focus Recommendation */}
          <div className="rec-card" style={{marginBottom:24}}>
            <div className="rec-label">🎯 Management Focus Recommendation</div>
            <p className="rec-text">{summary.focus_recommendation}</p>
          </div>

          {/* Top 5 Actions */}
          <div className="card" style={{marginBottom:20}}>
            <div className="card-title">🏆 Top 5 Priority Actions This Week</div>
            {!summary.top5_actions?.length ? (
              <p style={{color:'var(--clr-text-muted)',fontSize:'0.85rem'}}>No priority actions. Ensure tasks exist.</p>
            ) : (
              <ol style={{paddingLeft:20,display:'flex',flexDirection:'column',gap:12}}>
                {summary.top5_actions.map((action, i) => (
                  <li key={i} style={{color:'var(--clr-text)',fontSize:'0.9rem',lineHeight:1.6}}>
                    <span style={{
                      display:'inline-flex',alignItems:'center',justifyContent:'center',
                      width:24,height:24,borderRadius:'50%',
                      background: i===0?'rgba(239,68,68,0.15)':i===1?'rgba(245,158,11,0.15)':'rgba(99,102,241,0.15)',
                      color: i===0?'#f87171':i===1?'#fbbf24':'#818cf8',
                      fontWeight:800,fontSize:'0.75rem',marginRight:10,flexShrink:0
                    }}>{i+1}</span>
                    {action}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Effort allocation summary table */}
          <div className="card">
            <div className="card-title">⚖️ Management Responsibility Allocation Reference</div>
            <div className="table-wrap" style={{border:'none'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Priority Level</th>
                    <th style={{color:'#fbbf24'}}>👔 Top Management</th>
                    <th style={{color:'#818cf8'}}>🏢 Middle Management</th>
                    <th style={{color:'#34d399'}}>🔧 Operational Staff</th>
                    <th>Responsibility</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Critical','40%','40%','20%','Top Management'],
                    ['Moderate','20%','50%','30%','Middle Management'],
                    ['Low',     '10%','30%','60%','Operational Staff'],
                  ].map(([level,top,mid,ops,resp]) => (
                    <tr key={level}>
                      <td><span className={`badge badge-${level.toLowerCase()}`}>{level}</span></td>
                      <td style={{fontWeight:600,color:'#fbbf24'}}>{top}</td>
                      <td style={{fontWeight:600,color:'#818cf8'}}>{mid}</td>
                      <td style={{fontWeight:600,color:'#34d399'}}>{ops}</td>
                      <td style={{fontSize:'0.82rem',color:'var(--clr-text-dim)'}}>{resp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {summary.generated_at && (
            <p style={{marginTop:16,fontSize:'0.75rem',color:'var(--clr-text-muted)',textAlign:'right'}}>
              Last generated: {new Date(summary.generated_at).toLocaleString()}
            </p>
          )}
        </>
      )}
    </main>
  )
}
