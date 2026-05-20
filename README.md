# SegmentAI — Feedback Decision System

> **AI Applied Engineering · Master's Thesis Prototype · Version 1.0**

A rule-based AI customer feedback decision system that classifies feedback, assigns priority, allocates management responsibility, tracks tasks, escalates delays, and produces weekly management focus recommendations — all running entirely in the browser via `localStorage`.

---

## Problem Statement

Businesses receive large volumes of unstructured customer feedback. Without a systematic approach, critical issues are missed, high-value customers churn, and management attention is poorly allocated. SegmentAI solves this by automating the triage, prioritisation, and escalation of customer feedback through a rule-based AI engine.

---

## Core Workflow

```
Customer Feedback
      ↓
AI / Rule-based Analysis  (sentiment · issue category · customer segment)
      ↓
Issue Category Classification  (Delivery · Product · Service · Refund · Availability · Other)
      ↓
Priority Assignment  (Critical · Moderate · Low)
      ↓
Management Responsibility Allocation  (Top · Middle · Operational)
      ↓
Automatic Task Creation  (with SLA deadline)
      ↓
SLA / Delay Check  (auto-mark overdue tasks → Delayed)
      ↓
Escalation  (Operational → Middle → Top Management)
      ↓
Weekly Summary + Management Focus Recommendation
      ↓
Dashboard  (real-time KPIs and charts)
```

---

## Key Features

| Feature | Description |
|---|---|
| Feedback Intake | Manual form or CSV-style bulk import |
| Sentiment Analysis | Rule-based keyword NLP (Positive / Neutral / Negative) |
| Issue Classification | 6 categories via regex keyword matching |
| Customer Segmentation | EUR spend tiers (Premium / Medium / Budget) |
| Priority Engine | Critical / Moderate / Low based on segment × sentiment |
| Task Tracker | Status workflow (New → Assigned → In Progress → Resolved) |
| SLA Check | Auto-detects overdue tasks, creates Delay Alerts |
| Escalation Engine | Escalates Delayed tasks up the management hierarchy |
| Weekly Summary | Aggregated KPIs + focus recommendation + top 5 actions |
| Management Focus | Per-level workload breakdown with AI recommendation |
| Dashboard | 6 charts + 7 KPI cards + recent alerts + top priority actions |
| Demo Controls | Load demo data, reset all, run SLA check, generate summary |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Charts | Recharts |
| Styling | Vanilla CSS (custom design system) |
| Data Layer | Browser LocalStorage (no backend for V1) |
| Deployment | Vercel (static hosting) |
| AI Engine | Rule-based NLP classifier (JavaScript) |

---

## LocalStorage Data Architecture

All data persists in the browser using `localStorage` under the namespace `segmentai_*`:

| Key | Content |
|---|---|
| `segmentai_feedback` | Array of all feedback records with analysis results |
| `segmentai_tasks` | Array of all tasks with status and SLA data |
| `segmentai_alerts` | Array of all alert/escalation notifications |
| `segmentai_summary` | Latest generated weekly summary object |
| `segmentai__next_id` | Auto-increment ID counter |

This approach allows the full prototype to run on Vercel as a static site with zero backend infrastructure.

---

## AI / Rule-based Analysis Explanation

The `analyzeFeedback()` function in `src/data/store.js` implements a lightweight NLP pipeline:

1. **Sentiment** — counts negative/positive keyword matches. Rating (1–5) can override text sentiment.
2. **Issue Category** — regex patterns match keywords to 6 categories.
3. **Customer Segment** — based on total spend in EUR (Premium ≥ €2000, Medium €500–1999, Budget < €500).
4. **Priority** — derived from segment × sentiment combination rules.
5. **Effort Allocation** — fixed percentages per priority (Critical: 40/40/20, Moderate: 20/50/30, Low: 10/30/60).
6. **SLA** — Critical: 4h, Moderate: 24h, Low: 72h.

---

## Management Responsibility Allocation

| Priority | Assigned To | Top | Middle | Operational |
|---|---|---|---|---|
| Critical | Top Management | 40% | 40% | 20% |
| Moderate | Middle Management | 20% | 50% | 30% |
| Low | Operational Staff | 10% | 30% | 60% |

---

## Delay Alert and Escalation Logic

1. **SLA Check** — scans all non-resolved tasks.
2. If `dueDate < now` and status is not already Delayed/Escalated → mark **Delayed** + create **Delay Alert**.
3. If overdue by more than one full SLA window and status is **Delayed** → escalate:
   - Operational → Middle Management
   - Middle → Top Management
   - Top → stays at Top Management
4. Creates **Escalation Alert** with new assigned level.

---

## How to Run Locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

On first load, the app auto-seeds 20 realistic demo feedback records and runs the full analysis pipeline.

---

## How to Deploy on Vercel

1. Push the repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Set **Root Directory** to `frontend`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

No environment variables are required for the frontend-only V1.

---

## Limitations (V1 Prototype)

- Data is stored in the browser — clearing browser data loses all records.
- The AI engine is rule-based, not a trained ML model.
- No user authentication or multi-user support.
- No persistent server-side database.
- SLA check must be triggered manually or on page load (no background cron).

---

## Future Development (V2)

- Python FastAPI backend with PostgreSQL persistence.
- Integration with real NLP models (spaCy, BERT sentiment).
- Email/SMS alert notifications.
- Multi-user authentication with role-based access control.
- Automated SLA cron jobs via Celery.
- CSV/Excel import from real CRM exports.

---

## Course Relevance

**AI Applied Engineering** — demonstrates practical application of rule-based AI decision engines, customer data classification, automated task management, and management decision support systems.

## Thesis Relevance

This prototype serves as the functional proof-of-concept for the development-based Master's thesis on *AI-assisted customer feedback management and management responsibility allocation in SME contexts*. The system demonstrates the full feedback-to-decision pipeline with measurable KPIs.
