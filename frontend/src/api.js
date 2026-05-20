/* ─── SegmentAI API Client (Frontend-only, localStorage-backed) ─────────────
 *  All calls are synchronous localStorage operations wrapped as async.
 *  Satisfies Version 1 requirements — no Python backend needed.
 * ─────────────────────────────────────────────────────────────────────────── */

import * as store from './data/store'

const wrap = fn => async (...args) => ({ data: fn(...args) })

// ── Dashboard ──────────────────────────────────────────────────────────────
export const fetchKPIs            = wrap(store.getKPIs)
export const fetchSentiment       = wrap(store.getSentimentDist)
export const fetchSegments        = wrap(store.getSegmentDist)
export const fetchTrend           = wrap(store.getFeedbackTrend)
export const fetchPriorityByIssue = wrap(store.getPriorityByIssue)
export const fetchTaskStatus      = wrap(store.getTaskStatusDist)
export const fetchEffortAlloc     = wrap(store.getEffortAlloc)
export const fetchRecentAlerts    = async () => ({
  data: store.getAlerts().filter(a => !a.acknowledged).slice(0, 8)
})

// ── Feedback ───────────────────────────────────────────────────────────────
export const fetchFeedbackList = async (skip = 0, limit = 50) => ({
  data: store.getFeedback().slice(skip, skip + limit)
})
export const submitFeedback = async data => ({ data: store.submitOneFeedback(data) })

// ── Tasks ──────────────────────────────────────────────────────────────────
export const fetchTasks       = async () => ({ data: store.getTasks() })
export const fetchTask        = async id => ({ data: store.getTasks().find(t => t.id == id) })
export const updateTaskStatus = async (id, status) => ({ data: store.updateTask(id, status) })
export const fetchTaskStats   = wrap(store.getTaskStats)

// ── Alerts ─────────────────────────────────────────────────────────────────
export const fetchAlerts       = async () => ({ data: store.getAlerts() })
export const acknowledgeAlert  = async id => { store.ackAlert(id); return { data: { ok: true } } }
export const runDelayCheck     = async () => ({ data: store.runSLACheck() })
export const fetchAlertStats   = wrap(store.getAlertStats)

// ── Weekly Summary ─────────────────────────────────────────────────────────
export const fetchWeeklySummary    = async () => ({ data: store.getSummary() })
export const generateWeeklySummary = async () => ({ data: store.generateSummary() })

// ── Demo Controls ──────────────────────────────────────────────────────────
export const loadDemoData  = async () => ({ data: { imported: store.loadDemoData() } })
export const resetAllData  = async () => { store.resetAllData(); return { data: { ok: true } } }

export default {
  get:  async url  => url.includes('/dashboard/kpis') ? fetchKPIs() : { data: null },
  post: async (url, data) => url.includes('/feedback/submit') ? submitFeedback(data) : { data: null },
}
