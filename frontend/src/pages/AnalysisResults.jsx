import { useEffect, useState } from 'react'
import { getFeedback, isSeeded, seedDemoData } from '../data/store'
import { timeAgo } from '../components/utils'

export default function AnalysisResults() {
  const [data,    setData]    = useState([])
  const [filter,  setFilter]  = useState({ sentiment: '', priority: '', issue: '' })

  useEffect(() => {
    if (!isSeeded()) seedDemoData()
    setData(getFeedback())
  }, [])

  const filtered = data.filter(d =>
    (!filter.sentiment || d.sentiment === filter.sentiment) &&
    (!filter.priority  || d.priority  === filter.priority) &&
    (!filter.issue     || d.issueCategory === filter.issue)
  )

  const sentimentBadge = s => {
    const cls = { Positive:'badge-positive', Neutral:'badge-neutral', Negative:'badge-negative' }
    return <span className={`badge ${cls[s]||'badge-neutral'}`}>{s}</span>
  }
  const priorityBadge = p => {
    const cls = { Critical:'badge-critical', Moderate:'badge-moderate', Low:'badge-low' }
    return <span className={`badge ${cls[p]||'badge-neutral'}`}>{p}</span>
  }
  const segmentBadge = s => {
    const cls = { Premium:'badge-premium', Medium:'badge-medium', Budget:'badge-budget' }
    return <span className={`badge ${cls[s]||'badge-neutral'}`}>{s}</span>
  }

  return (
    <main className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Analysis Results</h1>
        <p className="page-subtitle">AI-processed sentiment, issue classification, and priority per feedback record</p>
      </div>
      <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
        {[
          { label:'Sentiment', key:'sentiment', opts:['Positive','Neutral','Negative'] },
          { label:'Priority',  key:'priority',  opts:['Critical','Moderate','Low'] },
          { label:'Issue',     key:'issue',     opts:['Service','Product','Delivery','Refund','Availability','Other'] },
        ].map(f => (
          <select key={f.key} className="form-input" style={{width:'auto',minWidth:150}}
            value={filter[f.key]}
            onChange={e => setFilter(prev => ({...prev, [f.key]: e.target.value}))}>
            <option value="">All {f.label}s</option>
            {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <span style={{alignSelf:'center',color:'var(--clr-text-muted)',fontSize:'0.85rem'}}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Customer</th><th>Segment</th><th>Feedback</th>
              <th>Sentiment</th><th>Issue</th><th>Priority</th><th>Risk Flag</th><th>When</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--clr-text-muted)'}}>No records</td></tr>
            )}
            {filtered.map(d => (
              <tr key={d.id}>
                <td style={{color:'var(--clr-text-muted)',fontSize:'0.75rem'}}>#{d.id}</td>
                <td><div style={{fontWeight:600,color:'var(--clr-text)',fontSize:'0.85rem'}}>{d.customer_name}</div></td>
                <td>{segmentBadge(d.customer_segment)}</td>
                <td style={{maxWidth:260}}>
                  <span title={d.text} style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:'0.8rem',color:'var(--clr-text-muted)'}}>
                    {d.text}
                  </span>
                  {d.rating && <span style={{fontSize:'0.72rem',color:'var(--clr-warning)'}}>{'⭐'.repeat(d.rating)} ({d.rating}/5)</span>}
                </td>
                <td>{d.sentiment ? sentimentBadge(d.sentiment) : '—'}</td>
                <td style={{fontSize:'0.82rem',color:'var(--clr-text-dim)'}}>{d.issueCategory||'—'}</td>
                <td>{d.priority ? priorityBadge(d.priority) : '—'}</td>
                <td>
                  {d.risk_flag
                    ? <span style={{fontSize:'0.72rem',color:'#fbbf24',background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.25)',padding:'2px 8px',borderRadius:99,fontWeight:600}}>{d.risk_flag}</span>
                    : <span style={{color:'var(--clr-text-muted)'}}>—</span>}
                </td>
                <td style={{fontSize:'0.75rem',color:'var(--clr-text-muted)',whiteSpace:'nowrap'}}>{timeAgo(d.submitted_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
