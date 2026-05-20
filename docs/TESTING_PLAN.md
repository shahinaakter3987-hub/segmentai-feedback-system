# Testing Plan — SegmentAI Feedback Decision System

## Testing Approach

Version 1 uses manual functional testing. Automated unit tests are planned for V2.

---

## Test Environment

- Browser: Chrome / Firefox (localStorage support required)
- Node.js: ≥ 18
- Commands: `cd frontend && npm run dev`

---

## Test Suite 1 — Feedback Intake & Analysis

| Test ID | Scenario | Expected Result |
|---|---|---|
| FI-01 | Submit feedback with spend €2500, rating 1, negative text | Sentiment: Negative, Segment: Premium, Priority: Critical |
| FI-02 | Submit feedback with spend €800, "delivery was late" | Category: Delivery, Segment: Medium, Priority: Critical |
| FI-03 | Submit feedback with spend €200, negative text | Segment: Budget, Priority: Moderate |
| FI-04 | Submit positive feedback, spend €100, rating 5 | Sentiment: Positive, Priority: Low, no task created |
| FI-05 | Submit with rating 1, positive text | Sentiment: Negative (rating overrides text) |
| FI-06 | Submit "The refund has not been processed" | Category: Refund |
| FI-07 | Submit "Product was broken upon delivery" | Category: Delivery (delivery matched first) |
| FI-08 | Submit without customer name | Form rejects — required field |

## Test Suite 2 — Task Creation

| Test ID | Scenario | Expected Result |
|---|---|---|
| TK-01 | Submit Critical feedback | Task created with SLA 4h, assigned to Top Management |
| TK-02 | Submit Moderate feedback | Task created with SLA 24h, assigned to Middle Management |
| TK-03 | Submit Low/Positive feedback | No task created |
| TK-04 | Advance task New → Assigned | Status updates in Task Tracker |
| TK-05 | Advance Delayed task | Status changes to In Progress |

## Test Suite 3 — SLA & Escalation

| Test ID | Scenario | Expected Result |
|---|---|---|
| SL-01 | Load demo data, click Run SLA Check | Overdue tasks marked Delayed, Delay Alerts created |
| SL-02 | Run SLA Check on already-Delayed tasks | Tasks escalated, Escalation Alerts created |
| SL-03 | Operational task escalated | assignedManagementLevel → Middle |
| SL-04 | Middle task escalated | assignedManagementLevel → Top |
| SL-05 | Resolved task | Not affected by SLA check |

## Test Suite 4 — Dashboard

| Test ID | Scenario | Expected Result |
|---|---|---|
| DB-01 | Load demo data | All 7 KPI cards show non-zero values |
| DB-02 | Priority by Issue chart | Shows bars for at least 3 issue categories |
| DB-03 | Task Status pie chart | Shows New, Assigned, Resolved, Delayed segments |
| DB-04 | Effort Allocation chart | Shows bars for Critical, Moderate, Low |
| DB-05 | Recent Alerts section | Shows unacknowledged alerts |

## Test Suite 5 — Weekly Summary

| Test ID | Scenario | Expected Result |
|---|---|---|
| WS-01 | Click Generate Report | All 6 KPI values update correctly |
| WS-02 | Critical issues exist | Recommendation mentions Top Management |
| WS-03 | Delays exist | Recommendation mentions SLA breach |
| WS-04 | No issues | Recommendation says "All systems nominal" |
| WS-05 | Most common issue | Correct category shown in summary card |

## Test Suite 6 — Demo Controls

| Test ID | Scenario | Expected Result |
|---|---|---|
| DC-01 | Click Load Demo Data | 20 feedback records created, all pages update |
| DC-02 | Click Reset All Data, confirm | localStorage cleared, KPIs show 0 |
| DC-03 | Click Reset, then Load Demo | Full demo cycle works cleanly |
| DC-04 | Run SLA Check from Dashboard | Result message shows checked/delayed/escalated |

## Test Suite 7 — Build & Deployment

| Test ID | Scenario | Expected Result |
|---|---|---|
| BD-01 | `npm run build` | No errors, dist/ created |
| BD-02 | Deploy to Vercel | App loads, demo data works |
| BD-03 | Hard refresh on Vercel | Data persists from localStorage |

---

## Known Limitations in Testing

- localStorage data is browser-specific — tests must be run in the same browser session.
- SLA escalation tests require backdated demo data to trigger delays.
- The `Load Demo Data` button in Settings always forces a fresh seed.
