import { useEffect, useState } from 'react'
import { getTaskStats, getSummary, generateSummary, getTasks } from '../data/store'

const LEVELS = [
  { key:'Top',         label:'Top Management',    icon:'👔', color:'#fbbf24', desc:'Strategic decisions, Premium customer escalations, Critical issue oversight' },
  { key:'Middle',      label:'Middle Management', icon:'🏢', color:'#818cf8', desc:'Department coordination, Moderate issue resolution, SLA monitoring' },
  { key:'Operational', label:'Operational Staff', icon:'🔧', color:'#34d399', desc:'Day-to-day task execution, routine issue handling, customer contact' },
]

export default function ManagementFocus() {
  const [taskStats, setTaskStats] = useState(null)
  const [summary,   setSummary]   = useState(null)
  const [loading,   setLoading]   = useState(true)

  const load = () => {
    setTaskStats(getTaskStats())
    let s = getSummary()
    if (!s) s = generateSummary()
    setSummary(s)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <div className="loading-wrap"><div className="spinner"/><span>Loading focus data...</span></div>

  const byLevel  = taskStats?.by_level  || {}
  const total    = taskStats?.total     || 1
  const tasks    = getTasks()

  // Build AI recommendation from live task data
  const buildRec = () => {
    const critical   = tasks.filter(t => t.priority === 'Critical').length
    const escalated  = tasks.filter(t => t.status   === 'Escalated').length
    const delayed    = tasks.filter(t => t.status   === 'Delayed').length
    const topTasks   = byLevel.Top || 0
    const midTasks   = byLevel.Middle || 0
    const opsTasks   = byLevel.Operational || 0

    if (critical > 0 || escalated > 0) {
      return `🔴 Top Management requires immediate focus. ${critical} critical issue(s) and ${escalated} escalation(s) are unresolved. Top Management must lead resolution efforts and communicate with affected Premium customers directly.`
    }
    if (delayed > 0) {
      return `🟡 Middle Management requires immediate focus. ${delayed} task(s) have breached SLA deadlines. Middle Management must review overdue assignments, reallocate resources, and prevent further escalation.`
    }
    if (opsTasks > topTasks + midTasks) {
      return `🟢 Operational Staff workload is high (${opsTasks} tasks). Middle Management should support and review Operational capacity. Consider redistributing tasks to prevent bottlenecks.`
    }
    return `✅ Workload is well distributed across all management levels. Continue monitoring SLA compliance. Recommend weekly sync between Middle Management and Operational Staff.`
  }

  return (
    <main className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Management Focus</h1>
        <p className="page-subtitle">Workload distribution and AI-driven recommendation on where attention is most needed</p>
      </div>

      {/* AI Recommendation */}
      <div className="rec-card" style={{marginBottom:28}}>
        <div className="rec-label">🎯 AI Focus Recommendation</div>
        <p className="rec-text">{buildRec()}</p>
      </div>

      {/* Level Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:28}}>
        {LEVELS.map(lvl => {
          const taskCount = byLevel[lvl.key] || 0
          const pct       = total > 0 ? Math.round((taskCount / total) * 100) : 0
          const detail    = taskStats?.by_level_detail?.[lvl.key] || {}
          return (
            <div key={lvl.key} style={{
              background:'var(--clr-surface)', border:`1px solid ${lvl.color}33`,
              borderRadius:16, padding:24, borderTop:`3px solid ${lvl.color}`
            }}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <span style={{fontSize:'1.8rem'}}>{lvl.icon}</span>
                <div>
                  <div style={{fontWeight:700,color:'var(--clr-text)',fontSize:'0.95rem'}}>{lvl.label}</div>
                  <div style={{fontSize:'0.72rem',color:'var(--clr-text-muted)',marginTop:2}}>{lvl.desc}</div>
                </div>
              </div>

              {/* Workload bar */}
              <div style={{marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:'0.78rem',color:'var(--clr-text-muted)'}}>Assigned Tasks</span>
                  <span style={{fontWeight:700,color:lvl.color,fontSize:'1.2rem'}}>{taskCount}</span>
                </div>
                <div style={{height:6,background:'var(--clr-surface-2)',borderRadius:99,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:lvl.color,borderRadius:99,transition:'width 0.6s ease'}}/>
                </div>
                <div style={{fontSize:'0.72rem',color:'var(--clr-text-muted)',marginTop:4}}>{pct}% of total workload</div>
              </div>

              {/* Detail stats */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  {label:'Critical',  value:detail.Critical  || 0, color:'var(--clr-danger)'},
                  {label:'Delayed',   value:detail.Delayed   || 0, color:'var(--clr-warning)'},
                  {label:'Escalated', value:detail.Escalated || 0, color:'#f87171'},
                  {label:'Resolved',  value:detail.Resolved  || 0, color:'var(--clr-success)'},
                ].map(m => (
                  <div key={m.label} style={{background:'var(--clr-surface-2)',borderRadius:8,padding:'8px 10px'}}>
                    <div style={{fontSize:'0.65rem',color:'var(--clr-text-muted)',marginBottom:2}}>{m.label}</div>
                    <div style={{fontWeight:700,color:m.color,fontSize:'1.1rem'}}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Effort Allocation Reference */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-title">⚖️ Standard Effort Allocation Rules</div>
        <div className="table-wrap" style={{border:'none'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th style={{color:'#fbbf24'}}>👔 Top Management</th>
                <th style={{color:'#818cf8'}}>🏢 Middle Management</th>
                <th style={{color:'#34d399'}}>🔧 Operational Staff</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Critical','40%','40%','20%'],
                ['Moderate','20%','50%','30%'],
                ['Low',     '10%','30%','60%'],
              ].map(([level,...pcts]) => (
                <tr key={level}>
                  <td><span className={`badge badge-${level.toLowerCase()}`}>{level}</span></td>
                  {pcts.map((p,i) => (
                    <td key={i} style={{fontWeight:600,color:['#fbbf24','#818cf8','#34d399'][i]}}>{p}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalation Path */}
      <div className="card">
        <div className="card-title">🔁 Escalation Path</div>
        <div style={{display:'flex',alignItems:'center',gap:16,padding:'12px 0',flexWrap:'wrap'}}>
          {[
            {label:'Operational Staff', icon:'🔧', color:'#34d399'},
            {label:'→', icon:'', color:'var(--clr-text-muted)'},
            {label:'Middle Management', icon:'🏢', color:'#818cf8'},
            {label:'→', icon:'', color:'var(--clr-text-muted)'},
            {label:'Top Management',    icon:'👔', color:'#fbbf24'},
          ].map((step, i) => (
            step.icon ? (
              <div key={i} style={{padding:'10px 16px',background:'var(--clr-surface-2)',
                border:`1px solid ${step.color}44`,borderRadius:10,display:'flex',gap:8,alignItems:'center'}}>
                <span>{step.icon}</span>
                <span style={{fontWeight:600,color:step.color,fontSize:'0.85rem'}}>{step.label}</span>
              </div>
            ) : (
              <span key={i} style={{color:'var(--clr-text-muted)',fontSize:'1.2rem',fontWeight:600}}>{step.label}</span>
            )
          ))}
        </div>
        <p style={{fontSize:'0.82rem',color:'var(--clr-text-muted)',marginTop:8}}>
          Tasks are escalated automatically when SLA is breached twice. Each escalation notifies the next management level and creates an Escalation Alert.
        </p>
      </div>
    </main>
  )
}
