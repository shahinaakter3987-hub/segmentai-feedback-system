# SegmentAI Backend — FastAPI (Future Enhancement / V2)

> ⚠️ **The backend is NOT required for the Version 1 prototype.**
> The frontend runs fully standalone using `localStorage` as the data layer.
> This directory contains the Python/FastAPI backend built during early development,
> preserved for reference and planned V2 integration.

---

## Status: Optional / Future Enhancement

All features in Version 1 are implemented in the **frontend-only** prototype:

| Feature | V1 (Frontend) | V2 (Backend) |
|---|---|---|
| Feedback intake | ✅ localStorage | Planned: PostgreSQL |
| Sentiment analysis | ✅ Rule-based JS engine | Planned: spaCy / BERT |
| Task management | ✅ localStorage | Planned: FastAPI REST |
| SLA / Escalation | ✅ In-browser logic | Planned: Celery cron |
| Weekly summary | ✅ Computed in browser | Planned: Server-side |
| Auth | ❌ Not in V1 | Planned: JWT / OAuth |

---

## Running the Backend (V2 — Optional)

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn main:app --reload
# → API available at http://localhost:8000
# → Swagger docs at http://localhost:8000/docs
```

> The backend requires Python 3.10+ and a SQLite or PostgreSQL database.
> Update `backend/database.py` with your DATABASE_URL.

---

## Backend Structure

```
backend/
├── main.py                    # FastAPI app entry point
├── models.py                  # SQLAlchemy models
├── database.py                # DB connection
├── requirements.txt           # Python dependencies
├── seed.py                    # Database seeder
├── api/
│   └── routes/
│       ├── feedback.py        # POST /feedback/submit
│       ├── dashboard.py       # GET /dashboard/kpis
│       ├── tasks.py           # GET/PUT /tasks
│       ├── alerts.py          # GET /alerts
│       └── weekly.py          # GET /weekly-summary
└── engine/
    ├── sentiment.py           # Sentiment classifier
    ├── classifier.py          # Issue category classifier
    ├── segmentation.py        # Customer segmentation
    ├── decision.py            # Priority + allocation engine
    ├── alerts.py              # Alert generation
    └── weekly.py              # Weekly summary generator
```
