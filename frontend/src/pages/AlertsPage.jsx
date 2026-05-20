import { useEffect, useState } from 'react'
import { fetchAlerts, acknowledgeAlert, runDelayCheck } from '../api'
import { timeAgo } from '../components/utils'

const TYPE_META = {
  'Critical Issue Alert': { icon:'🚨', cls:'escalation',  dot:'var(--clr-danger)' },
  'Escalation Alert':     { icon:'🔴', cls:'escalation',  dot:'var(--clr-danger)' },
  'Delay Alert':          { icon:'🟡', cls:'unacked',     dot:'var(--clr-warning)' },
  'New Feedback Alert':   { icon:'💬', cls:'',            dot:'var(--clr-accent)' },
}

const FILTERS = [
  ['all',       'All'],
  ['unacked',   'Unacknowledged'],
  ['critical',  'Critical'],
  ['delay',     'Delays'],
  ['escalation','Escalations'],
  ['new',       'New Feedback'],
]

export default function AlertsPage() {
  const [alerts,      setAlerts]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [running,     setRunning]     = useState(false)
  const [checkResult, setCheckResult] = useState(null)
  const [filter,      setFilter]      = useState('all')

  const load = () => fetchAlerts().then(r => setAlerts(r.data)).finally(() => setLoading(false))
  useEffect(() => { runDelayCheck().then(() => load()) }, [])

  const ack = async id => { await acknowledgeAlert(id); load() }

  const triggerCheck = async () => {
    setRunning(true); setCheckResult(null)
    const res = await runDelayCheck()
    setCheckResult(res.data)
    setRunning(false)
    load()
  }

  const filtered = alerts.filter(a => {
    if (filter === 'all')        return true
    if (filter === 'unacked')    return !a.acknowledged
    if (filter === 'critical')   return a.alert_type === 'Critical Issue Alert'
    if (filter === 'delay')      return a.alert_type === 'Delay Alert'
    if (filter === 'escalation') return a.alert_type === 'Escalation Alert'
    if (filter === 'new')        return a.alert_type === 'New Feedback Alert'
    return true
  })

  const unacked = alerts.filter(a => !a.acknowledged).length

  if (loading) return <div className="loading-wrap"><div className="spinner"/><span>Loading alerts...</span></div>

  return (
    <main className="page fade-in">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="page-title">Alerts &amp; Escalations</h1>
          <p className="page-subtitle">Delay and escalation notifications across all management levels</p>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          {unacked > 0 && (
            <span style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',
              color:'#f87171',padding:'4px 12px',borderRadius:99,fontSize:'0.8rem',fontWeight:600}}>
              🔔 {unacked} unacknowledged
            </span>
          )}
          <button className="btn btn-outline" onClick={triggerCheck} disabled={running}>
            {running ? '⏳ Checking...' : '🔄 Run SLA Check'}
          </button>
        </div>
      </div>

      {checkResult && (
        <div style={{marginBottom:20,padding:'12px 16px',background:'rgba(16,185,129,0.08)',
          border:'1px solid rgba(16,185,129,0.25)',borderRadius:10,fontSize:'0.85rem',color:'#34d399'}}>
          ✅ SLA check complete — {checkResult.checked} tasks checked · {checkResult.newly_delayed} newly delayed · {checkResult.newly_escalated} escalated
        </div>
      )}

      {/* Summary counts */}
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
        {[
          { label:'Total',     value:alerts.length,                                              color:'var(--clr-text-muted)' },
          { label:'Unacked',   value:unacked,                                                    color:'#fbbf24' },
          { label:'Critical',  value:alerts.filter(a=>a.alert_type==='Critical Issue Alert').length, color:'#f87171' },
          { label:'Delays',    value:alerts.filter(a=>a.alert_type==='Delay Alert').length,       color:'#f59e0b' },
          { label:'Escalated', value:alerts.filter(a=>a.alert_type==='Escalation Alert').length,  color:'#ef4444' },
        ].map(s => (
          <div key={s.label} style={{padding:'8px 16px',background:'var(--clr-surface)',
            border:'1px solid var(--clr-border)',borderRadius:8,textAlign:'center'}}>
            <div style={{fontWeight:700,fontSize:'1.25rem',color:s.color}}>{s.value}</div>
            <div style={{fontSize:'0.7rem',color:'var(--clr-text-muted)'}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tab-bar">
        {FILTERS.map(([v,l]) => (
          <button key={v} className={`tab-btn${filter===v?' active':''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <p style={{fontWeight:600,color:'var(--clr-text)',marginBottom:8}}>No alerts in this category</p>
          <p>All tasks are within their SLA windows</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map(a => {
            const meta = TYPE_META[a.alert_type] || { icon:'💬', cls:'', dot:'var(--clr-accent)' }
            return (
              <div key={a.id} className={`alert-item${!a.acknowledged?' unacked':''} ${meta.cls}`}>
                <div className="alert-dot" style={{background:meta.dot, marginTop:6}} />
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
                    <span style={{fontWeight:700,color:'var(--clr-text)',fontSize:'0.9rem'}}>
                      {meta.icon} {a.alert_type}
                    </span>
                    {a.priority && <span className={`badge badge-${a.priority.toLowerCase()}`}>{a.priority}</span>}
                    {a.issue_category && a.issue_category !== 'N/A' && (
                      <span className="badge badge-neutral">{a.issue_category}</span>
                    )}
                    {!a.acknowledged && (
                      <span style={{fontSize:'0.7rem',fontWeight:600,color:'#fbbf24',
                        background:'rgba(245,158,11,0.1)',padding:'2px 8px',borderRadius:99}}>NEW</span>
                    )}
                  </div>
                  <div style={{fontWeight:500,color:'var(--clr-text-dim)',fontSize:'0.85rem',marginBottom:6}}>
                    {a.task_title}
                  </div>
                  {a.message && (
                    <div style={{fontSize:'0.8rem',color:'var(--clr-text-muted)',marginBottom:6,
                      fontStyle:'italic',borderLeft:'2px solid var(--clr-border)',paddingLeft:10}}>
                      "{a.message.slice(0,160)}{a.message.length>160?'…':''}"
                    </div>
                  )}
                  <div style={{fontSize:'0.78rem',color:'var(--clr-text-muted)',display:'flex',gap:12,flexWrap:'wrap'}}>
                    <span>👤 {a.customer_name}</span>
                    <span>🏢 Notified: <strong style={{color:'var(--clr-text-dim)'}}>{a.notified_level} Management</strong></span>
                    <span>🕐 {timeAgo(a.triggered_at)}</span>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
                  <span className={`badge badge-${a.task_status?.toLowerCase().replace(' ','-')}`}>{a.task_status}</span>
                  {!a.acknowledged && (
                    <button className="btn btn-outline btn-sm" onClick={() => ack(a.id)}>✓ Acknowledge</button>
                  )}
                  {a.acknowledged && (
                    <span style={{fontSize:'0.72rem',color:'var(--clr-text-muted)'}}>✓ Acknowledged</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
