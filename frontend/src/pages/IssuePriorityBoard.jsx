import { useEffect, useState } from 'react'
import { getTasks, isSeeded, seedDemoData } from '../data/store'
import { timeAgo } from '../components/utils'

const COLS = ['Critical','Moderate','Low']
const COL_META = {
  Critical: { color:'var(--clr-danger)',  icon:'🔴', border:'rgba(239,68,68,0.25)' },
  Moderate: { color:'var(--clr-warning)', icon:'🟡', border:'rgba(245,158,11,0.25)' },
  Low:      { color:'var(--clr-success)', icon:'🟢', border:'rgba(16,185,129,0.25)' },
}
const LEVEL_COLOR = { Top:'#fbbf24', Middle:'#818cf8', Operational:'#34d399' }

export default function IssuePriorityBoard() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')

  useEffect(() => {
    if (!isSeeded()) seedDemoData()
    setTasks(getTasks())
    setLoading(false)
  }, [])

  const filtered = filter ? tasks.filter(t => t.issueCategory === filter) : tasks

  const grouped = COLS.reduce((acc, p) => {
    acc[p] = filtered.filter(t => t.priority === p)
    return acc
  }, {})

  const ISSUE_CATS = ['Delivery','Product','Service','Refund','Availability','Other']

  if (loading) return <div className="loading-wrap"><div className="spinner"/><span>Loading issues...</span></div>

  return (
    <main className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Issue Priority Board</h1>
        <p className="page-subtitle">All issues grouped by severity — Critical requires immediate management attention</p>
      </div>

      {/* Filter by issue category */}
      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:'0.8rem',color:'var(--clr-text-muted)',fontWeight:600}}>Filter:</span>
        {['', ...ISSUE_CATS].map(cat => (
          <button key={cat||'all'} onClick={() => setFilter(cat)}
            className={`tab-btn${filter===cat?' active':''}`}
            style={{padding:'4px 14px',borderBottom:filter===cat?'2px solid var(--clr-primary)':'2px solid transparent'}}>
            {cat || 'All Issues'}
          </button>
        ))}
      </div>

      {/* Summary counts */}
      <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
        {COLS.map(p => (
          <div key={p} style={{padding:'8px 20px',background:'var(--clr-surface)',
            border:`1px solid ${COL_META[p].border}`,borderRadius:10,textAlign:'center'}}>
            <div style={{fontWeight:700,fontSize:'1.4rem',color:COL_META[p].color}}>{grouped[p]?.length||0}</div>
            <div style={{fontSize:'0.72rem',color:'var(--clr-text-muted)'}}>{p}</div>
          </div>
        ))}
        <div style={{padding:'8px 20px',background:'var(--clr-surface)',
          border:'1px solid var(--clr-border)',borderRadius:10,textAlign:'center'}}>
          <div style={{fontWeight:700,fontSize:'1.4rem',color:'var(--clr-text)'}}>{filtered.length}</div>
          <div style={{fontSize:'0.72rem',color:'var(--clr-text-muted)'}}>Total</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,alignItems:'start'}}>
        {COLS.map(priority => {
          const meta = COL_META[priority]
          const col  = grouped[priority] || []
          return (
            <div key={priority}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,
                paddingBottom:10,borderBottom:`1px solid ${meta.border}`}}>
                <span>{meta.icon}</span>
                <span style={{fontWeight:700,color:meta.color}}>{priority}</span>
                <span style={{marginLeft:'auto',background:meta.border,
                  color:meta.color,fontSize:'0.72rem',fontWeight:700,padding:'2px 10px',borderRadius:99}}>
                  {col.length}
                </span>
              </div>

              {col.length === 0 && (
                <div style={{textAlign:'center',padding:'32px 0',color:'var(--clr-text-muted)',fontSize:'0.85rem'}}>
                  No {priority.toLowerCase()} issues
                </div>
              )}

              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {col.map(t => (
                  <div key={t.id} style={{
                    background:'var(--clr-surface)',border:`1px solid ${meta.border}`,
                    borderRadius:10,padding:14,transition:'transform 0.2s',cursor:'default'
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
                  >
                    {/* Badges row */}
                    <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:'0.68rem',fontWeight:700,padding:'2px 8px',borderRadius:99,
                        background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)',color:'#818cf8'}}>
                        {t.issueCategory || 'Other'}
                      </span>
                      <span className={`badge badge-${t.customer_segment?.toLowerCase()}`}>{t.customer_segment}</span>
                      <span className={`badge badge-${t.status?.toLowerCase().replace(' ','-')}`}>{t.status}</span>
                      {t.risk_flag && (
                        <span style={{fontSize:'0.65rem',color:'#fbbf24',background:'rgba(245,158,11,0.1)',
                          padding:'2px 8px',borderRadius:99,fontWeight:600}}>{t.risk_flag}</span>
                      )}
                    </div>

                    {/* Customer */}
                    <div style={{fontWeight:600,fontSize:'0.85rem',color:'var(--clr-text)',marginBottom:4}}>
                      {t.customer_name}
                    </div>

                    {/* Action */}
                    <div style={{fontSize:'0.76rem',color:'var(--clr-text-muted)',marginBottom:10,lineHeight:1.5}}>
                      {t.recommended_action?.slice(0,100)}…
                    </div>

                    {/* Footer */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:4}}>
                      <span style={{fontSize:'0.7rem',color:LEVEL_COLOR[t.assignedManagementLevel],fontWeight:600}}>
                        {t.assignedManagementLevel === 'Top' ? '👔' : t.assignedManagementLevel === 'Middle' ? '🏢' : '🔧'} {t.assignedManagementLevel} Mgmt
                      </span>
                      <span style={{fontSize:'0.7rem',color:'var(--clr-text-muted)'}}>
                        {timeAgo(t.created_at)}
                      </span>
                    </div>

                    {/* Effort bar */}
                    <div style={{marginTop:10}}>
                      <div style={{fontSize:'0.65rem',color:'var(--clr-text-muted)',marginBottom:4}}>Effort allocation</div>
                      <div className="effort-bar">
                        <div className="effort-segment" style={{flex:t.effort_pct_top,background:'#fbbf24'}} title={`Top: ${t.effort_pct_top}%`}/>
                        <div className="effort-segment" style={{flex:t.effort_pct_mid,background:'#818cf8'}} title={`Mid: ${t.effort_pct_mid}%`}/>
                        <div className="effort-segment" style={{flex:t.effort_pct_ops,background:'#34d399'}} title={`Ops: ${t.effort_pct_ops}%`}/>
                      </div>
                      <div style={{display:'flex',gap:10,fontSize:'0.63rem',color:'var(--clr-text-muted)',marginTop:4}}>
                        <span>🟡 Top {t.effort_pct_top}%</span>
                        <span>🟣 Mid {t.effort_pct_mid}%</span>
                        <span>🟢 Ops {t.effort_pct_ops}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
