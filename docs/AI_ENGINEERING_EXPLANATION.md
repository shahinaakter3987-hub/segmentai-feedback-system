# AI Engineering Explanation — SegmentAI

## What "AI" Does in This System

SegmentAI uses **rule-based AI** (a classical AI approach) rather than machine learning. This is a deliberate design choice for a V1 prototype: it is transparent, deterministic, and requires no training data.

---

## The Analysis Pipeline (`analyzeFeedback` in `store.js`)

### Step 1 — Sentiment Classification

A keyword matching approach scans feedback text against two curated word lists:

**Negative keywords:** rude, terrible, worst, horrible, bad, poor, late, delay, slow, broken, angry, complaint, refund, cancel, unacceptable, disappointed, awful, pathetic, never, wrong, lost, missing, damaged, expired, unavailable

**Positive keywords:** great, excellent, amazing, love, best, fast, perfect, happy, thank, good, friendly, wonderful, awesome, outstanding, satisfied, quality, recommend, pleased, impressive, fantastic

- More negative matches → **Negative**
- More positive matches → **Positive**
- Equal or none → **Neutral**
- Star rating (1–5) can override text sentiment (≤2 → Negative, ≥4 → Positive)

### Step 2 — Issue Category Classification

Regex pattern matching assigns one of 6 categories:

| Category | Trigger Keywords |
|---|---|
| Delivery | deliver, ship, courier, package, arrival, late, rider, transport |
| Refund | refund, money back, return, exchange |
| Product | product, quality, defect, broken, damage, damaged, expired |
| Service | service, staff, rude, support, response |
| Availability | stock, avail, out of, unavailable, missing |
| Other | (fallback) |

### Step 3 — Customer Segmentation (EUR Spend Tiers)

| Segment | Spend Threshold |
|---|---|
| Premium | ≥ €2,000 |
| Medium | €500 – €1,999 |
| Budget | < €500 |

### Step 4 — Priority Assignment (Decision Matrix)

| Sentiment | Segment | Issue | Priority |
|---|---|---|---|
| Negative | Premium | Any | **Critical** |
| Negative | Medium | Delivery / Product / Refund | **Critical** |
| Negative | Medium | Other | **Moderate** |
| Negative | Budget | Any | **Moderate** |
| Neutral | Premium | Any | **Moderate** |
| Positive | Any | Any | **Low** |
| Neutral | Medium/Budget | Any | **Low** |

### Step 5 — Management Responsibility Allocation

| Priority | Assigned Level | Top % | Middle % | Ops % |
|---|---|---|---|---|
| Critical | Top Management | 40 | 40 | 20 |
| Moderate | Middle Management | 20 | 50 | 30 |
| Low | Operational Staff | 10 | 30 | 60 |

### Step 6 — SLA Assignment

| Priority | SLA Window |
|---|---|
| Critical | 4 hours |
| Moderate | 24 hours |
| Low | 72 hours |

---

## Escalation Logic

```
Task created → status: New
  ↓ (SLA check: dueDate < now)
Status: Delayed → Delay Alert created
  ↓ (SLA check: overdue > sla_hours again)
Status: Escalated → Escalation Alert created
  Operational → Middle Management
  Middle      → Top Management
  Top         → stays at Top Management
```

---

## Why Rule-Based AI?

1. **Transparency** — every decision is explainable.
2. **No training data required** — suitable for a prototype.
3. **Deterministic** — same input always produces the same output.
4. **Fast** — runs entirely in the browser with zero latency.

## Future ML Enhancements (V2)

- Fine-tuned BERT/RoBERTa sentiment classifier
- spaCy NER for automated customer data extraction
- Clustering algorithms for issue pattern detection
- Predictive churn modelling from historical feedback trends
