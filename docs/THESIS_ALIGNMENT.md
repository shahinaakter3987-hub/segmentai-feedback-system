# Thesis Alignment — SegmentAI Feedback Decision System

## Research Context

This system is developed as the functional prototype for a development-based Master's thesis in the field of **AI Applied Engineering**. The thesis investigates how rule-based AI decision engines can automate customer feedback triage and management responsibility allocation in small-to-medium enterprise (SME) contexts.

---

## Research Questions Addressed

1. **RQ1** — Can a rule-based AI engine reliably classify customer feedback sentiment and issue categories without a trained ML model?
2. **RQ2** — How can customer segmentation (by spend tier) improve the precision of issue priority assignment?
3. **RQ3** — Can automated management responsibility allocation reduce response time to critical customer complaints?
4. **RQ4** — What is an effective SLA-based escalation logic for a multi-level management hierarchy?
5. **RQ5** — How can a weekly summary engine support data-driven management focus decisions?

---

## Prototype Contribution

| Component | Thesis Contribution |
|---|---|
| Rule-based NLP classifier | Demonstrates feasibility without trained ML models |
| Customer segmentation | EUR spend tiers as proxy for customer value |
| Priority engine | Decision matrix combining sentiment × segment |
| Management allocation | Effort percentage model per priority level |
| SLA escalation | Two-stage delay → escalation logic |
| Weekly summary | Automated management reporting |
| Dashboard | Real-time KPI visualisation for decision support |

---

## Academic Honesty Statement

This prototype is an original implementation. All classification rules, data models, and workflow logic are designed by the author. No third-party AI APIs or trained models are used in Version 1.

---

## Limitations Acknowledged

- Rule-based NLP has lower accuracy than transformer-based models.
- localStorage is not production-ready (no persistence across devices/browsers).
- Demo data is synthetic; real-world validation is required.
- Management allocation percentages are theoretical; empirical validation is future work.
