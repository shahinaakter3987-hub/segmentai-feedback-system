import { useEffect, useState } from 'react'
import { fetchTasks, updateTaskStatus, runDelayCheck } from '../api'
import { timeAgo } from '../components/utils'

const STATUSES = ['New','Assigned','In Progress','Delayed','Escalated','Resolved']
const STATUS_NEXT = {
  'New':'Assigned', 'Assigned':'In Progress', 'In Progress':'Resolved',
  'Delayed':'In Progress', 'Escalated':'In Progress',
}
const LEVEL_META = {
  Top:         { icon:'👔', color:'#fbbf24', label:'Top Management' },
  Middle:      { icon:'🏢', color:'#818cf8', label:'Middle Management' },
  Operational: { icon:'🔧', color:'#34d399', label:'Operational Staff' },
}

export default function TaskTracker() {
  const [tasks,     setTasks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filterSt,  setFilterSt]  = useState('')
  const [filterLvl, setFilterLvl] = useState('')
  const [filterPri, setFilterPri] = useState('')
  const [filterIss, setFilterIss] = useState('')
  const [updating,  setUpdating]  = useState(null)

  const load = () => fetchTasks().then(r => setTasks(r.data)).finally(() => setLoading(false))
  useEffect(() => { runDelayCheck().then(() => load()) }, [])

  const filtered = tasks.filter(t =>
    (!filterSt  || t.status                === filterSt)  &&
    (!filterLvl || t.assignedManagementLevel === filterLvl) &&
    (!filterPri || t.priority              === filterPri)  &&
    (!filterIss || t.issueCategory         === filterIss)
  )

  const advance = async task => {
    const next = STATUS_NEXT[task.status]
    if (!next) return
    setUpdating(task.id)
    await updateTaskStatus(task.id, next)
    setUpdating(null)
    load()
  }

  const statusClass = s => {
    const map = {
      'New':'badge-new','Assigned':'badge-assigned','In Progress':'badge-in-progress',
      'Delayed':'badge-delayed','Resolved':'badge-resolved','Escalated':'badge-escalated',
    }
    return `badge ${map[s]||'badge-neutral'}`
  }

  if (loading) return <div className="loading-wrap"><div className="spinner"/><span>Loading tasks...</span></div>

  const ISSUE_OPTS = ['Delivery','Product','Service','Refund','Availability','Other']

  return (
    <main className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Task Tracker</h1>
        <p className="page-subtitle">Track assigned tasks across management levels — update status and monitor SLA compliance</p>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        {[
          {val:filterSt,  set:setFilterSt,  opts:STATUSES,                    label:'Status'},
          {val:filterLvl, set:setFilterLvl, opts:['Top','Middle','Operational'],label:'Level'},
          {val:filterPri, set:setFilterPri, opts:['Critical','Moderate','Low'],label:'Priority'},
          {val:filterIss, set:setFilterIss, opts:ISSUE_OPTS,                   label:'Issue'},
        ].map((f,i) => (
          <select key={i} className="form-input" style={{width:'auto',minWidth:130}}
            value={f.val} onChange={e => f.set(e.target.value)}>
            <option value="">All {f.label}s</option>
            {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <span style={{color:'var(--clr-text-muted)',fontSize:'0.85rem'}}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Customer</th><th>Issue</th><th>Priority</th>
              <th>Assigned To</th><th>Status</th><th>SLA</th><th>Due</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--clr-text-muted)'}}>No tasks found</td></tr>
            )}
            {filtered.map(t => {
              const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Resolved'
              const nextSt    = STATUS_NEXT[t.status]
              const lvlMeta   = LEVEL_META[t.assignedManagementLevel] || LEVEL_META.Operational
              return (
                <tr key={t.id}>
                  <td style={{color:'var(--clr-text-muted)',fontSize:'0.75rem'}}>#{t.id}</td>
                  <td>
                    <div style={{fontWeight:600,fontSize:'0.83rem',color:'var(--clr-text)'}}>{t.customer_name}</div>
                    <span className={`badge badge-${t.customer_segment?.toLowerCase()}`} style={{fontSize:'0.65rem',marginTop:2}}>
                      {t.customer_segment}
                    </span>
                  </td>
                  <td>
                    <div style={{fontWeight:600,fontSize:'0.82rem',color:'var(--clr-text-dim)'}}>{t.issueCategory || '—'}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--clr-text-muted)',marginTop:2,maxWidth:180,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {t.recommended_action?.slice(0,70)}…
                    </div>
                  </td>
                  <td><span className={`badge badge-${t.priority?.toLowerCase()||'neutral'}`}>{t.priority}</span></td>
                  <td>
                    <span style={{fontSize:'0.8rem',fontWeight:600,color:lvlMeta.color}}>
                      {lvlMeta.icon} {lvlMeta.label}
                    </span>
                  </td>
                  <td><span className={statusClass(t.status)}>{t.status}</span></td>
                  <td style={{fontSize:'0.78rem',color:'var(--clr-text-muted)',whiteSpace:'nowrap'}}>
                    {t.sla_hours}h
                    {t.risk_flag && (
                      <div style={{fontSize:'0.65rem',color:'#fbbf24',marginTop:2}}>{t.risk_flag}</div>
                    )}
                  </td>
                  <td style={{fontSize:'0.75rem',whiteSpace:'nowrap',color:isOverdue?'var(--clr-danger)':'var(--clr-text-muted)'}}>
                    {isOverdue ? '⚠️ ' : ''}{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '—'}
                  </td>
                  <td>
                    {nextSt && t.status !== 'Resolved' && (
                      <button className="btn btn-outline btn-sm" onClick={() => advance(t)} disabled={updating === t.id}>
                        {updating === t.id ? '...' : `→ ${nextSt}`}
                      </button>
                    )}
                    {t.status === 'Resolved' && (
                      <span style={{color:'var(--clr-success)',fontSize:'0.78rem'}}>✅ Done</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}
