export function getBadgeClass(type, value) {
  if (!value) return 'badge badge-neutral'
  const v = value.toLowerCase().replace(/\s+/g, '-')
  return `badge badge-${v}`
}

export function priorityColor(p) {
  if (p === 'Critical') return 'var(--clr-critical)'
  if (p === 'Moderate') return 'var(--clr-moderate)'
  return 'var(--clr-low)'
}

export function segmentColor(s) {
  if (s === 'Premium')     return 'var(--clr-premium)'
  if (s === 'Medium')      return 'var(--clr-medium)'
  return 'var(--clr-budget)'
}

export function sentimentColor(s) {
  if (s === 'Positive') return 'var(--clr-positive)'
  if (s === 'Negative') return 'var(--clr-negative)'
  return 'var(--clr-neutral)'
}

export function statusBadgeClass(status) {
  const map = {
    'New': 'badge-new',
    'Assigned': 'badge-assigned',
    'In Progress': 'badge-in-progress',
    'Delayed': 'badge-delayed',
    'Resolved': 'badge-resolved',
    'Escalated': 'badge-escalated',
  }
  return `badge ${map[status] || 'badge-neutral'}`
}

export function timeAgo(isoStr) {
  if (!isoStr) return '—'
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (days > 0)  return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0)  return `${mins}m ago`
  return 'just now'
}

export function formatDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export const CHART_COLORS = [
  '#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#a78bfa','#38bdf8','#34d399'
]
