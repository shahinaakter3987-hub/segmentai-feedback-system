from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # ensure all models are registered

from api.routes import feedback, tasks, dashboard, alerts, weekly

# ── Create tables ────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SegmentAI Feedback System",
    description=(
        "AI-powered customer feedback decision system with smart alerts "
        "and effort allocation. Built for academic prototype demonstration."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(feedback.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(weekly.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "running",
        "system": "SegmentAI Feedback System",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
