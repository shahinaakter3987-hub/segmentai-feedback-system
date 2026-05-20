import { useEffect, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  getKPIs, getSentimentDist, getSegmentDist, getFeedbackTrend,
  getPriorityByIssue, getTaskStatusDist, getEffortAlloc, getAlerts,
  seedDemoData, isSeeded, runSLACheck, generateSummary, getTasks
} from '../data/store'
import { loadDemoData, resetAllData, runDelayCheck } from '../api'
import { CHART_COLORS, timeAgo } from '../components/utils'

const KPI_CONFIG = [
  { key:'total_feedback',  label:'Total Feedback',  icon:'💬', color:'var(--clr-primary)' },
  { key:'critical_count',  label:'Critical Issues', icon:'🚨', color:'var(--clr-danger)' },
  { key:'delayed_count',   label:'Delayed Tasks',   icon:'⏰', color:'var(--clr-warning)' },
  { key:'escalated_count', label:'Escalated',       icon:'📈', color:'#f87171' },
  { key:'resolved_count',  label:'Resolved',        icon:'✅', color:'var(--clr-success)' },
  { key:'active_alerts',   label:'Active Alerts',   icon:'🔔', color:'var(--clr-accent)' },
  { key:'total_tasks',     label:'Total Tasks',     icon:'📋', color:'var(--clr-purple)' },
]

const STATUS_COLORS   = { New:'#22d3ee', Assigned:'#818cf8', 'In Progress':'#60a5fa', Delayed:'#fbbf24', Resolved:'#34d399', Escalated:'#f87171' }
const SENTIMENT_COLORS= { Positive:'#34d399', Neutral:'#94a3b8', Negative:'#f87171' }
const SEGMENT_COLORS  = { Premium:'#fbbf24', Medium:'#818cf8', Budget:'#64748b' }

export default function Dashboard() {
  const [kpis,          setKpis]          = useState(null)
  const [sentiment,     setSentiment]     = useState([])
  const [segments,      setSegments]      = useState([])
  const [trend,         setTrend]         = useState([])
  const [priorityIssue, setPriorityIssue] = useState([])
  const [taskStatus,    setTaskStatus]    = useState([])
  const [effort,        setEffort]        = useState([])
  const [recentAlerts,  setRecentAlerts]  = useState([])
  const [topTasks,      setTopTasks]      = useState([])
  const [demoMsg,       setDemoMsg]       = useState(null)
  const [loading,       setLoading]       = useState(false)

  const refresh = () => {
    setKpis(getKPIs())
    setSentiment(getSentimentDist())
    setSegments(getSegmentDist())
    setTrend(getFeedbackTrend())
    setPriorityIssue(getPriorityByIssue())
    setTaskStatus(getTaskStatusDist())
    setEffort(getEffortAlloc())
    setRecentAlerts(getAlerts().filter(a => !a.acknowledged).slice(0, 6))
    setTopTasks(getTasks().filter(t => t.priority === 'Critical' && t.status !== 'Resolved').slice(0, 5))
  }

  useEffect(() => {
    if (!isSeeded()) seedDemoData()
    runSLACheck()
    refresh()
  }, [])

  const handleLoadDemo = async () => {
    setLoading(true); setDemoMsg(null)
    await loadDemoData()
    refresh()
    setDemoMsg('✅ Demo data loaded')
    setLoading(false)
  }

  const handleReset = async () => {
    if (!window.confirm('Reset ALL data? This cannot be undone.')) return
    await resetAllData()
    refresh()
    setDemoMsg('🗑️ All data cleared')
  }

  const handleSLACheck = async () => {
    const res = await runDelayCheck()
    refresh()
    const d = res.data
    setDemoMsg(`⏰ SLA check — ${d.newly_delayed} newly delayed · ${d.newly_escalated} escalated`)
  }

  const handleSummary = async () => {
    generateSummary()
    setDemoMsg('📋 Weekly summary regenerated')
  }

  const tooltipStyle = { background:'#1a2236', border:'1px solid #1e2d45', borderRadius:8, color:'#e2e8f0' }

  return (
    <main className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time overview — customer feedback · AI analysis · task health · management workload</p>
      </div>

      {/* Demo Quick Controls */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:24,padding:'14px 18px',
        background:'var(--clr-surface)',border:'1px solid var(--clr-border)',borderRadius:12}}>
        <span style={{fontSize:'0.78rem',fontWeight:600,color:'var(--clr-text-muted)',alignSelf:'center',marginRight:4}}>
          Demo Controls:
        </span>
        <button className="btn btn-primary btn-sm" onClick={handleLoadDemo} disabled={loading}>
          {loading ? '⏳' : '🌱'} Load Demo Data
        </button>
        <button className="btn btn-outline btn-sm" onClick={handleSLACheck}>⏰ Run SLA Check</button>
        <button className="btn btn-outline btn-sm" onClick={handleSummary}>📋 Gen. Summary</button>
        <button className="btn btn-danger btn-sm" onClick={handleReset}>🗑️ Reset All</button>
        {demoMsg && (
          <span style={{fontSize:'0.82rem',color:'var(--clr-success)',alignSelf:'center',marginLeft:8}}>{demoMsg}</span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {KPI_CONFIG.map(cfg => (
          <div key={cfg.key} className="kpi-card" style={{'--kpi-color': cfg.color}}>
            <span className="kpi-icon">{cfg.icon}</span>
            <span className="kpi-value">{kpis?.[cfg.key] ?? '—'}</span>
            <span className="kpi-label">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Row 1: Sentiment + Segment + Trend */}
      <div className="charts-grid" style={{gridTemplateColumns:'1fr 1fr 2fr',marginBottom:24}}>
        <div className="chart-card">
          <div className="chart-title"><span>📣</span> Sentiment Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sentiment} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="sentiment" tick={{fill:'#94a3b8',fontSize:12}} />
              <YAxis tick={{fill:'#94a3b8',fontSize:11}} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {sentiment.map((s,i) => <Cell key={i} fill={SENTIMENT_COLORS[s.sentiment]||CHART_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title"><span>👥</span> Customer Segments</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={segments} dataKey="count" nameKey="segment" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {segments.map((s,i) => <Cell key={i} fill={SEGMENT_COLORS[s.segment]||CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" formatter={v => <span style={{color:'#94a3b8',fontSize:12}}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title"><span>📈</span> Feedback Trend — Last 14 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend} margin={{top:0,right:8,bottom:0,left:-20}}>
              <XAxis dataKey="date" tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{fill:'#94a3b8',fontSize:11}} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{fill:'#6366f1',r:3}} activeDot={{r:5}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Priority by Issue + Task Status + Effort */}
      <div className="charts-grid" style={{gridTemplateColumns:'2fr 1fr 1fr',marginBottom:24}}>
        <div className="chart-card">
          <div className="chart-title"><span>⚡</span> Priority by Issue Category</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityIssue} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="issueCategory" tick={{fill:'#94a3b8',fontSize:11}} />
              <YAxis tick={{fill:'#94a3b8',fontSize:11}} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" formatter={v => <span style={{color:'#94a3b8',fontSize:12}}>{v}</span>} />
              <Bar dataKey="Critical" stackId="a" fill="#ef4444" />
              <Bar dataKey="Moderate" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Low"      stackId="a" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title"><span>✅</span> Task Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={taskStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {taskStatus.map((s,i) => <Cell key={i} fill={STATUS_COLORS[s.status]||CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" formatter={v => <span style={{color:'#94a3b8',fontSize:11}}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title"><span>⚖️</span> Effort Allocation</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={effort} layout="vertical" margin={{top:0,right:0,bottom:0,left:10}}>
              <XAxis type="number" domain={[0,100]} tick={{fill:'#94a3b8',fontSize:11}} unit="%" />
              <YAxis type="category" dataKey="priority" tick={{fill:'#94a3b8',fontSize:12}} width={65} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="Top Management"    fill="#fbbf24" stackId="a" />
              <Bar dataKey="Middle Management" fill="#818cf8" stackId="a" />
              <Bar dataKey="Operational"       fill="#34d399" stackId="a" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Top Priority Actions + Recent Alerts */}
      <div className="charts-grid" style={{gridTemplateColumns:'1fr 1fr',marginBottom:0}}>
        {/* Top Priority Actions */}
        <div className="chart-card">
          <div className="chart-title"><span>🔴</span> Top Priority Actions</div>
          {topTasks.length === 0 ? (
            <div className="empty-state" style={{padding:'32px 0'}}>
              <div className="empty-state-icon">✅</div>
              <p>No critical open tasks</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {topTasks.map((t, i) => (
                <div key={t.id} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'10px 12px',
                  background:'var(--clr-surface-2)',borderRadius:8,border:'1px solid rgba(239,68,68,0.2)'}}>
                  <span style={{width:22,height:22,borderRadius:'50%',background:'rgba(239,68,68,0.15)',
                    color:'#f87171',fontWeight:800,fontSize:'0.72rem',display:'flex',
                    alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:'0.82rem',color:'var(--clr-text)',marginBottom:2}}>{t.title}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--clr-text-muted)'}}>
                      👤 {t.customer_name} · 🏢 {t.assignedManagementLevel} Mgmt
                      <span className="badge badge-critical" style={{marginLeft:8,fontSize:'0.65rem'}}>Critical</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="chart-card">
          <div className="chart-title"><span>🔔</span> Recent Active Alerts</div>
          {recentAlerts.length === 0 ? (
            <div className="empty-state" style={{padding:'32px 0'}}>
              <div className="empty-state-icon">🎉</div>
              <p>No active alerts</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {recentAlerts.map(a => (
                <div key={a.id} className={`alert-item ${a.alert_type === 'Escalation Alert' ? 'escalation' : 'unacked'}`}
                  style={{marginBottom:0}}>
                  <div className="alert-dot" style={{
                    background: a.alert_type === 'Escalation Alert' ? 'var(--clr-danger)' : 'var(--clr-warning)',marginTop:5
                  }} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--clr-text)'}}>
                      {a.alert_type === 'Escalation Alert' ? '🔴' : a.alert_type === 'Delay Alert' ? '🟡' : '💬'} {a.alert_type}
                    </div>
                    <div style={{fontSize:'0.75rem',color:'var(--clr-text-muted)',marginTop:2}}>
                      {a.customer_name} · {a.notified_level} Mgmt · {timeAgo(a.triggered_at)}
                    </div>
                  </div>
                  <span className={`badge badge-${a.priority?.toLowerCase()}`}>{a.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
