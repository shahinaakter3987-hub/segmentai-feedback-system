/* ─── SegmentAI Local Data Store ────────────────────────────────────────────
 *  Single source of truth. All data persists in localStorage.
 *  No backend dependency for Version 1.
 * ─────────────────────────────────────────────────────────────────────────── */

const LS  = key => `segmentai_${key}`;
const load = key => { try { return JSON.parse(localStorage.getItem(LS(key))) } catch { return null } };
const save = (key, val) => localStorage.setItem(LS(key), JSON.stringify(val));

// ─── ID generator ──────────────────────────────────────────────────────────
let _id = load('_next_id') || 1000;
function nextId() { _id++; save('_next_id', _id); return _id; }

// ─── Helpers ────────────────────────────────────────────────────────────────
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function isoDate(d) { return d.toISOString().slice(0, 10); }

// ─── Keyword lists ──────────────────────────────────────────────────────────
const NEG_WORDS = ['rude','terrible','worst','horrible','bad','poor','late','delay','slow',
  'broken','angry','complaint','refund','cancel','unacceptable','disappointed','awful',
  'pathetic','never','wrong','lost','missing','damaged','expired','unavailable'];
const POS_WORDS = ['great','excellent','amazing','love','best','fast','perfect','happy',
  'thank','good','friendly','wonderful','awesome','outstanding','satisfied','quality',
  'recommend','pleased','impressive','fantastic'];

// ─── Rule-based AI analysis engine ─────────────────────────────────────────
export function analyzeFeedback(text, totalSpend = 0, rating = null) {
  const lower = (text || '').toLowerCase();
  const negCount = NEG_WORDS.filter(w => lower.includes(w)).length;
  const posCount = POS_WORDS.filter(w => lower.includes(w)).length;

  // Sentiment (rating can override text analysis)
  let sentiment = negCount > posCount ? 'Negative' : posCount > negCount ? 'Positive' : 'Neutral';
  if (rating !== null) {
    if (rating <= 2) sentiment = 'Negative';
    else if (rating >= 4) sentiment = 'Positive';
  }

  // Issue category classification
  let issueCategory = 'Other';
  if (/deliver|ship|courier|package|arrival|late|rider|transport/.test(lower))  issueCategory = 'Delivery';
  else if (/refund|money.?back|return|exchange/.test(lower))                     issueCategory = 'Refund';
  else if (/product|quality|defect|broken|damage|damaged|expired/.test(lower))   issueCategory = 'Product';
  else if (/service|staff|rude|support|response/.test(lower))                    issueCategory = 'Service';
  else if (/stock|avail|out.?of|unavailable|missing/.test(lower))                issueCategory = 'Availability';

  // Customer segment — EUR thresholds
  let customer_segment = 'Budget';
  if (totalSpend >= 2000)      customer_segment = 'Premium';
  else if (totalSpend >= 500)  customer_segment = 'Medium';

  // Priority — only Critical / Moderate / Low
  let priority = 'Low';
  if (sentiment === 'Negative') {
    if (customer_segment === 'Premium') priority = 'Critical';
    else if (customer_segment === 'Medium' && ['Delivery','Product','Refund'].includes(issueCategory)) priority = 'Critical';
    else priority = 'Moderate';
  } else if (sentiment === 'Neutral' && customer_segment === 'Premium') {
    priority = 'Moderate';
  }

  // Risk flag
  let risk_flag = null;
  if (priority === 'Critical' && customer_segment === 'Premium') risk_flag = 'Churn Risk';
  else if (priority === 'Critical') risk_flag = 'Revenue Risk';
  else if (priority === 'Moderate' && customer_segment === 'Premium') risk_flag = 'Revenue Risk';

  // Effort allocation
  let effort_pct_top = 10, effort_pct_mid = 30, effort_pct_ops = 60;
  if (priority === 'Critical') { effort_pct_top = 40; effort_pct_mid = 40; effort_pct_ops = 20; }
  else if (priority === 'Moderate') { effort_pct_top = 20; effort_pct_mid = 50; effort_pct_ops = 30; }

  // Management responsibility
  let assignedManagementLevel = 'Operational';
  if (priority === 'Critical')  assignedManagementLevel = 'Top';
  else if (priority === 'Moderate') assignedManagementLevel = 'Middle';

  // SLA hours
  const sla_hours = priority === 'Critical' ? 4 : priority === 'Moderate' ? 24 : 72;

  return { sentiment, issueCategory, customer_segment, priority, risk_flag,
           effort_pct_top, effort_pct_mid, effort_pct_ops, assignedManagementLevel, sla_hours };
}

// ─── Collections ─────────────────────────────────────────────────────────────
export function getFeedback() { return load('feedback') || []; }
export function saveFeedback(l) { save('feedback', l); }
export function getTasks()    { return load('tasks') || []; }
export function saveTasks(l)  { save('tasks', l); }
export function getAlerts()   { return load('alerts') || []; }
export function saveAlerts(l) { save('alerts', l); }
export function getSummary()  { return load('summary') || null; }
export function saveSummary(s){ save('summary', s); }

// ─── Submit single feedback ──────────────────────────────────────────────────
export function submitOneFeedback({ customer_name, customer_email, total_spend, text, rating }) {
  const ratingInt = rating ? parseInt(rating) : null;
  const analysis  = analyzeFeedback(text, parseFloat(total_spend) || 0, ratingInt);
  const id = nextId();
  const record = {
    id, customer_name, customer_email: customer_email || null,
    total_spend: parseFloat(total_spend) || 0, text, rating: ratingInt,
    ...analysis, submitted_at: new Date().toISOString(),
  };
  const fbList = getFeedback(); fbList.push(record); saveFeedback(fbList);

  // Create task for non-Low or negative feedback
  let task = null;
  if (analysis.sentiment === 'Negative' || analysis.priority !== 'Low') {
    task = createTaskFromFeedback(record);
  }

  // Create alert
  const alerts = getAlerts();
  alerts.push({
    id: nextId(),
    task_id: task ? task.id : null,
    task_title: task ? task.title : `Feedback from ${record.customer_name}`,
    alert_type: analysis.priority === 'Critical' ? 'Critical Issue Alert' : 'New Feedback Alert',
    priority: record.priority,
    customer_name: record.customer_name,
    issue_category: record.issueCategory,
    notified_level: record.assignedManagementLevel,
    message: record.text,
    task_status: task ? task.status : 'N/A',
    triggered_at: new Date().toISOString(),
    acknowledged: false,
  });
  saveAlerts(alerts);
  return record;
}

// ─── Create task from feedback ───────────────────────────────────────────────
function createTaskFromFeedback(fb) {
  const tid = nextId();
  const due = new Date(Date.now() + fb.sla_hours * 3600000);
  const task = {
    id: tid, feedback_id: fb.id,
    title: `[${fb.issueCategory}] ${fb.customer_name} — ${fb.priority}`,
    recommended_action: `Investigate ${fb.issueCategory.toLowerCase()} issue reported by ${fb.customer_name}. Sentiment: ${fb.sentiment}. Segment: ${fb.customer_segment}.`,
    customer_name: fb.customer_name,
    customer_segment: fb.customer_segment,
    issueCategory: fb.issueCategory,
    priority: fb.priority,
    assignedManagementLevel: fb.assignedManagementLevel,
    status: 'New',
    sla_hours: fb.sla_hours,
    dueDate: due.toISOString(),
    created_at: new Date().toISOString(),
    effort_pct_top: fb.effort_pct_top,
    effort_pct_mid: fb.effort_pct_mid,
    effort_pct_ops: fb.effort_pct_ops,
    risk_flag: fb.risk_flag,
  };
  const list = getTasks(); list.push(task); saveTasks(list);
  return task;
}

// ─── Update task status ───────────────────────────────────────────────────────
export function updateTask(id, newStatus) {
  const list = getTasks();
  const t = list.find(x => x.id === id);
  if (t) { t.status = newStatus; saveTasks(list); }
  return t;
}

// ─── SLA check → delays + escalations ────────────────────────────────────────
export function runSLACheck() {
  const tasks  = getTasks();
  const alerts = getAlerts();
  const now    = Date.now();
  let newly_delayed = 0, newly_escalated = 0;

  tasks.forEach(t => {
    if (t.status === 'Resolved') return;
    const due = new Date(t.dueDate).getTime();

    // Mark as Delayed
    if (due < now && t.status !== 'Delayed' && t.status !== 'Escalated') {
      t.status = 'Delayed';
      newly_delayed++;
      alerts.push({
        id: nextId(), task_id: t.id, task_title: t.title,
        alert_type: 'Delay Alert',
        priority: t.priority,
        customer_name: t.customer_name,
        issue_category: t.issueCategory || 'Other',
        notified_level: t.assignedManagementLevel,
        message: `SLA breached (${t.sla_hours}h). Task overdue. Immediate action required.`,
        task_status: 'Delayed',
        triggered_at: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Escalate if already Delayed and still overdue beyond SLA window
    const overdue_hours = (now - due) / 3600000;
    if (overdue_hours > t.sla_hours && t.status === 'Delayed') {
      t.status = 'Escalated';
      newly_escalated++;
      const oldLevel = t.assignedManagementLevel;
      let newLevel   = oldLevel === 'Operational' ? 'Middle' : 'Top';
      t.assignedManagementLevel = newLevel;
      alerts.push({
        id: nextId(), task_id: t.id, task_title: t.title,
        alert_type: 'Escalation Alert',
        priority: t.priority,
        customer_name: t.customer_name,
        issue_category: t.issueCategory || 'Other',
        notified_level: newLevel,
        message: `Overdue by ${Math.round(overdue_hours)}h. Escalated from ${oldLevel} to ${newLevel} Management.`,
        task_status: 'Escalated',
        triggered_at: new Date().toISOString(),
        acknowledged: false,
      });
    }
  });

  saveTasks(tasks);
  saveAlerts(alerts);
  return { checked: tasks.length, newly_delayed, newly_escalated };
}

// ─── Acknowledge alert ────────────────────────────────────────────────────────
export function ackAlert(id) {
  const list = getAlerts();
  const a = list.find(x => x.id === id);
  if (a) { a.acknowledged = true; saveAlerts(list); }
}

// ─── Generate weekly summary ──────────────────────────────────────────────────
export function generateSummary() {
  const fb = getFeedback(), tasks = getTasks();
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);

  const critical   = tasks.filter(t => t.priority === 'Critical').length;
  const delayed    = tasks.filter(t => t.status === 'Delayed').length;
  const resolved   = tasks.filter(t => t.status === 'Resolved').length;
  const escalated  = tasks.filter(t => t.status === 'Escalated').length;
  const unresolved = tasks.filter(t => t.status !== 'Resolved').length;

  // Most common issue category
  const issueCounts = {};
  fb.forEach(f => { issueCounts[f.issueCategory] = (issueCounts[f.issueCategory] || 0) + 1; });
  const most_common_issue = Object.entries(issueCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';

  // Focus recommendation
  let focusParts = [];
  if (critical > 0)    focusParts.push(`${critical} critical issue(s) require immediate Top Management intervention.`);
  if (escalated > 0)   focusParts.push(`${escalated} escalation(s) active — Top Management must act.`);
  if (delayed > 0)     focusParts.push(`${delayed} task(s) have breached SLA — Middle Management review required.`);
  if (unresolved > resolved) focusParts.push(`Backlog growing (${unresolved} unresolved vs ${resolved} resolved) — consider reallocation.`);

  let focus_recommendation;
  if (!focusParts.length) {
    focus_recommendation = '✅ All systems nominal. Workload is well-distributed across management levels. Continue monitoring Premium customer satisfaction.';
  } else {
    const level = (critical > 0 || escalated > 0) ? 'Top Management' : 'Middle Management';
    focus_recommendation = `🎯 Primary focus: ${level}. ` + focusParts.join(' ');
  }

  // Top 5 priority actions
  const top5 = [];
  tasks.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').slice(0, 2)
    .forEach(t => top5.push(`Resolve CRITICAL issue: "${t.title}" — assigned to ${t.assignedManagementLevel} Management`));
  tasks.filter(t => t.status === 'Escalated').slice(0, 1)
    .forEach(t => top5.push(`Handle escalation: "${t.title}" — escalated to ${t.assignedManagementLevel} Management`));
  tasks.filter(t => t.status === 'Delayed').slice(0, 2)
    .forEach(t => top5.push(`Address delayed task: "${t.title}" — SLA exceeded`));
  if (top5.length < 5) top5.push(`Review effort allocation balance — most common issue: ${most_common_issue}`);
  if (top5.length < 5) top5.push('Conduct weekly management sync on unresolved customer feedback');
  if (top5.length < 5) top5.push('Audit Premium customer satisfaction scores and retention risk');

  const summary = {
    week_start: isoDate(weekStart), week_end: isoDate(now),
    total_feedback: fb.length,
    critical_count: critical, delayed_count: delayed,
    resolved_count: resolved, unresolved_count: unresolved,
    escalated_count: escalated, most_common_issue,
    focus_recommendation, top5_actions: top5.slice(0, 5),
    generated_at: new Date().toISOString(),
  };
  saveSummary(summary);
  return summary;
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────
export function getKPIs() {
  const fb = getFeedback(), tasks = getTasks(), alerts = getAlerts();
  return {
    total_feedback:  fb.length,
    critical_count:  tasks.filter(t => t.priority === 'Critical').length,
    delayed_count:   tasks.filter(t => t.status  === 'Delayed').length,
    escalated_count: tasks.filter(t => t.status  === 'Escalated').length,
    resolved_count:  tasks.filter(t => t.status  === 'Resolved').length,
    active_alerts:   alerts.filter(a => !a.acknowledged).length,
    total_tasks:     tasks.length,
  };
}

export function getSentimentDist() {
  const counts = { Positive: 0, Neutral: 0, Negative: 0 };
  getFeedback().forEach(f => { counts[f.sentiment] = (counts[f.sentiment] || 0) + 1; });
  return Object.entries(counts).map(([sentiment, count]) => ({ sentiment, count }));
}

export function getSegmentDist() {
  const counts = { Premium: 0, Medium: 0, Budget: 0 };
  getFeedback().forEach(f => { counts[f.customer_segment] = (counts[f.customer_segment] || 0) + 1; });
  return Object.entries(counts).map(([segment, count]) => ({ segment, count }));
}

export function getFeedbackTrend() {
  const map = {};
  getFeedback().forEach(f => { const d = f.submitted_at?.slice(0,10); if (d) map[d] = (map[d]||0)+1; });
  const result = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = isoDate(d);
    result.push({ date: key, count: map[key] || 0 });
  }
  return result;
}

export function getPriorityByIssue() {
  const feedback = getFeedback();
  const cats = ['Delivery','Product','Service','Refund','Availability','Other'];
  return cats.map(issueCategory => {
    const fb = feedback.filter(f => f.issueCategory === issueCategory);
    return {
      issueCategory,
      Critical: fb.filter(f => f.priority === 'Critical').length,
      Moderate: fb.filter(f => f.priority === 'Moderate').length,
      Low:      fb.filter(f => f.priority === 'Low').length,
    };
  }).filter(r => r.Critical + r.Moderate + r.Low > 0);
}

export function getTaskStatusDist() {
  const tasks = getTasks();
  const statuses = ['New','Assigned','In Progress','Delayed','Escalated','Resolved'];
  return statuses.map(status => ({ status, count: tasks.filter(t => t.status === status).length }))
                 .filter(s => s.count > 0);
}

export function getEffortAlloc() {
  const tasks = getTasks();
  return ['Critical','Moderate','Low'].map(priority => {
    const pts = tasks.filter(t => t.priority === priority);
    if (!pts.length) return { priority, 'Top Management': 0, 'Middle Management': 0, 'Operational': 0 };
    const avg = fn => Math.round(pts.reduce((s,t) => s + (t[fn]||0), 0) / pts.length);
    return { priority, 'Top Management': avg('effort_pct_top'), 'Middle Management': avg('effort_pct_mid'), 'Operational': avg('effort_pct_ops') };
  });
}

export function getTaskStats() {
  const tasks = getTasks();
  const byLevel = { Top: 0, Middle: 0, Operational: 0 };
  const byLevelDetail = {
    Top:         { Critical: 0, Delayed: 0, Escalated: 0, Resolved: 0 },
    Middle:      { Critical: 0, Delayed: 0, Escalated: 0, Resolved: 0 },
    Operational: { Critical: 0, Delayed: 0, Escalated: 0, Resolved: 0 },
  };
  tasks.forEach(t => {
    const lvl = t.assignedManagementLevel || 'Operational';
    byLevel[lvl] = (byLevel[lvl] || 0) + 1;
    if (byLevelDetail[lvl]) {
      if (t.priority === 'Critical')   byLevelDetail[lvl].Critical++;
      if (t.status  === 'Delayed')     byLevelDetail[lvl].Delayed++;
      if (t.status  === 'Escalated')   byLevelDetail[lvl].Escalated++;
      if (t.status  === 'Resolved')    byLevelDetail[lvl].Resolved++;
    }
  });
  return { total: tasks.length, by_level: byLevel, by_level_detail: byLevelDetail };
}

export function getAlertStats() {
  const alerts = getAlerts();
  return {
    total:         alerts.length,
    unacknowledged:alerts.filter(a => !a.acknowledged).length,
    delays:        alerts.filter(a => a.alert_type === 'Delay Alert').length,
    escalations:   alerts.filter(a => a.alert_type === 'Escalation Alert').length,
  };
}

// ─── Data reset ───────────────────────────────────────────────────────────────
export function resetAllData() {
  ['feedback','tasks','alerts','summary','_next_id'].forEach(k => localStorage.removeItem(LS(k)));
  _id = 1000;
  save('_next_id', _id);
}

// ─── Seed check ───────────────────────────────────────────────────────────────
export function isSeeded() { return getFeedback().length > 0; }

// ─── Seed / Load demo data ───────────────────────────────────────────────────
export function seedDemoData() {
  if (isSeeded()) return getFeedback().length;
  return _runSeed();
}

export function loadDemoData() {
  resetAllData();
  return _runSeed();
}

function _runSeed() {
  const demos = [
    { customer_name:'Sarah Johnson',    customer_email:'sarah@corp.com',         total_spend:2500, rating:1, text:'The staff were incredibly rude and the service was unacceptable for a premium customer like me. I demand immediate resolution.' },
    { customer_name:'Michael Chen',     customer_email:'mchen@tech.io',          total_spend:1800, rating:1, text:'This is the third time my delivery has been late. Your courier service is terrible. I am considering cancelling.' },
    { customer_name:'Emma Williams',    customer_email:'emma.w@mail.com',        total_spend:950,  rating:2, text:'Product quality has dropped. The item I received was damaged and broken upon arrival. Very disappointed.' },
    { customer_name:'James Brown',      customer_email:'jbrown@biz.net',         total_spend:450,  rating:3, text:'Delivery was delayed by five days with no notification. This is not acceptable service.' },
    { customer_name:'Lisa Anderson',    customer_email:'l.anderson@co.com',      total_spend:3200, rating:1, text:'I requested a refund two weeks ago and nobody has responded. This is the worst customer service I have ever experienced.' },
    { customer_name:'David Kim',        customer_email:'dkim@startup.co',        total_spend:200,  rating:2, text:'The product I ordered was out of stock after payment. Poor availability management.' },
    { customer_name:'Rachel Green',     customer_email:'rgreen@corp.com',        total_spend:1500, rating:5, text:'Excellent service! The delivery was fast and the product quality is outstanding. I will definitely recommend your company.' },
    { customer_name:'Tom Wilson',       customer_email:'twilson@mail.com',       total_spend:80,   rating:4, text:'Good experience overall. Product arrived on time and was exactly as described. Happy customer.' },
    { customer_name:'Nina Patel',       customer_email:'npatel@enterprise.com',  total_spend:4500, rating:1, text:'Your support team is pathetic. I have been waiting over a week regarding my complaint about wrong shipment.' },
    { customer_name:'Alex Turner',      customer_email:'aturner@biz.com',        total_spend:320,  rating:3, text:'Delivery was slow but product quality was acceptable. Average experience, nothing special.' },
    { customer_name:'Sofia Garcia',     customer_email:'sgarcia@mail.com',       total_spend:150,  rating:2, text:'I am disappointed with the service. The staff could not answer my questions and response time was terrible.' },
    { customer_name:'Chris Taylor',     customer_email:'ctaylor@tech.co',        total_spend:2800, rating:2, text:'Missing items from my order. As a long-time premium customer I expected better quality control.' },
    { customer_name:'Olivia Martin',    customer_email:'omartin@corp.net',       total_spend:600,  rating:4, text:'Great product, friendly staff, and fast delivery. One minor packaging issue but overall a wonderful experience.' },
    { customer_name:'Robert Lee',       customer_email:'rlee@biz.io',            total_spend:90,   rating:1, text:'Terrible quality. Product broke after one day. I want a full refund and will never buy again.' },
    { customer_name:'Aisha Khan',       customer_email:'akhan@mail.com',         total_spend:1200, rating:3, text:'Average service. Delivery was on time but the product had minor defects. Needs improvement in quality control.' },
    { customer_name:'Marcus Johnson',   customer_email:'mjohnson@co.com',        total_spend:75,   rating:5, text:'Amazing experience! Love the product, fast shipping, and customer support was very helpful. Best purchase this year!' },
    { customer_name:'Priya Sharma',     customer_email:'psharma@enterprise.com', total_spend:5000, rating:1, text:'Unacceptable delay in processing my refund. As your highest-tier customer I demand immediate attention from management.' },
    { customer_name:'Daniel Wright',    customer_email:'dwright@tech.com',       total_spend:400,  rating:3, text:'The delivery courier lost my first package. Had to wait extra days for replacement. Frustrating experience.' },
    { customer_name:'Jessica Moore',    customer_email:'jmoore@mail.com',        total_spend:250,  rating:4, text:'Satisfied with my purchase. Good quality product and reasonable shipping time. Would buy again.' },
    { customer_name:'Ahmed Hassan',     customer_email:'ahassan@biz.net',        total_spend:1600, rating:2, text:'Service quality has been declining. My last three orders all had issues — late delivery or wrong items.' },
  ];

  // Submit all and backdate
  demos.forEach((d, i) => {
    const daysBack = Math.floor(i * 14 / demos.length);
    const record   = submitOneFeedback(d);

    // Backdate feedback
    const fb   = getFeedback();
    const item  = fb.find(f => f.id === record.id);
    if (item) item.submitted_at = daysAgo(daysBack);
    saveFeedback(fb);

    // Backdate task and recompute dueDate
    const tasks = getTasks();
    const task  = tasks.find(t => t.feedback_id === record.id);
    if (task) {
      task.created_at = daysAgo(daysBack);
      task.dueDate    = new Date(new Date(task.created_at).getTime() + task.sla_hours * 3600000).toISOString();
    }
    saveTasks(tasks);
  });

  // Advance some task statuses for variety
  const tasks = getTasks();
  tasks.forEach((t, i) => {
    if (i % 6 === 0) t.status = 'Resolved';
    else if (i % 5 === 0) t.status = 'In Progress';
    else if (i % 4 === 0) t.status = 'Assigned';
  });
  saveTasks(tasks);

  // Run SLA check to generate realistic delay/escalation alerts
  runSLACheck();
  // Generate weekly summary
  generateSummary();

  return getFeedback().length;
}
