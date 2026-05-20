from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from database import get_db
from models import WeeklySummary
from engine.weekly import generate_weekly_summary

router = APIRouter(prefix="/weekly", tags=["Weekly Summary"])


@router.post("/generate")
def trigger_weekly_summary(db: Session = Depends(get_db)):
    """Generate (or regenerate) the weekly summary for the current week."""
    summary = generate_weekly_summary(db)
    return _format(summary)


@router.get("/latest")
def get_latest_summary(db: Session = Depends(get_db)):
    """Return the most recently generated weekly summary."""
    summary = db.query(WeeklySummary).order_by(WeeklySummary.generated_at.desc()).first()
    if not summary:
        # Auto-generate on first request
        summary = generate_weekly_summary(db)
    return _format(summary)


@router.get("/history")
def get_summary_history(limit: int = 10, db: Session = Depends(get_db)):
    summaries = db.query(WeeklySummary).order_by(WeeklySummary.week_start.desc()).limit(limit).all()
    return [_format(s) for s in summaries]


def _format(s: WeeklySummary) -> dict:
    top5 = []
    try:
        top5 = json.loads(s.top5_actions) if s.top5_actions else []
    except Exception:
        top5 = []
    return {
        "id": s.id,
        "week_start": str(s.week_start),
        "week_end":   str(s.week_end),
        "total_feedback":  s.total_feedback,
        "critical_count":  s.critical_count,
        "unresolved_count": s.unresolved_count,
        "delayed_count":   s.delayed_count,
        "resolved_count":  s.resolved_count,
        "focus_recommendation": s.focus_recommendation,
        "top5_actions": top5,
        "generated_at": s.generated_at.isoformat() if s.generated_at else None,
    }
