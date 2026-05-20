import { useLocation } from 'react-router-dom'
import { useRole } from '../context/RoleContext'

const TITLES = {
  '/':         '📊 Dashboard',
  '/feedback': '💬 Feedback Intake',
  '/analysis': '🔬 Analysis Results',
  '/issues':   '🚨 Issue Priority Board',
  '/tasks':    '✅ Task Tracker',
  '/alerts':   '🔔 Alerts & Escalations',
  '/weekly':   '📋 Weekly Summary',
  '/focus':    '🎯 Management Focus',
  '/settings': '⚙️ Settings',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { roleInfo } = useRole()

  return (
    <header className="topbar">
      <span className="topbar-title">{TITLES[pathname] || 'SegmentAI'}</span>
      <div className="topbar-right">
        <span style={{
          fontSize: '0.78rem',
          color: 'var(--clr-text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: roleInfo?.color,
            display: 'inline-block',
          }} />
          {roleInfo?.icon} {roleInfo?.label}
        </span>
      </div>
    </header>
  )
}
