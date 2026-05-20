import { NavLink } from 'react-router-dom'
import { useRole, ROLES } from '../context/RoleContext'

const NAV = [
  { section: 'Overview' },
  { to: '/',         icon: '📊', label: 'Dashboard' },
  { section: 'Data' },
  { to: '/feedback', icon: '💬', label: 'Feedback Intake' },
  { to: '/analysis', icon: '🔬', label: 'Analysis Results' },
  { section: 'Actions' },
  { to: '/issues',   icon: '🚨', label: 'Issue Priority' },
  { to: '/tasks',    icon: '✅', label: 'Task Tracker' },
  { section: 'Reports' },
  { to: '/alerts',   icon: '🔔', label: 'Alerts' },
  { to: '/weekly',   icon: '📋', label: 'Weekly Summary' },
  { to: '/focus',    icon: '🎯', label: 'Mgmt Focus' },
  { section: 'System' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const { role, setRole } = useRole()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">SegmentAI</div>
        <div className="sidebar-logo-sub">Feedback Decision System</div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section-label">{item.section}</div>
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-role">
        <div className="role-label">Viewing as</div>
        <select
          className="role-select"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {Object.entries(ROLES).map(([key, val]) => (
            <option key={key} value={key}>{val.icon} {val.label}</option>
          ))}
        </select>
      </div>
    </aside>
  )
}
