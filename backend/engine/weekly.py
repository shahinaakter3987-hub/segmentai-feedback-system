"""
Weekly summary generation and management focus recommendation engine.
"""

import json
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Feedback, AnalysisResult, Task, Alert, WeeklySummary


LEVEL_LABELS = {
    "Top":         "Top Management",
    "Middle":      "Middle Management",
    "Operational": "Operational Level",
}


def _get_week_bounds() -> tuple[date, date]:
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday
    week_end   = week_start + timedelta(days=6)           # Sunday
    return week_start, week_end


def _compute_focus_score(db: Session, level: str) -> int:
    """Higher score = more attention needed."""
    delayed   = db.query(Task).filter(Task.assigned_to == level, Task.status == "Delayed").count()
    escalated = db.query(Task).filter(Task.assigned_to == level, Task.status == "Escalated").count()
    critical  = db.query(Task).join(AnalysisResult).filter(
        Task.assigned_to == level,
        AnalysisResult.priority == "Critical"
    ).count()
    unresolved = db.query(Task).filter(
        Task.assigned_to == level,
        Task.status.notin_(["Resolved"])
    ).count()

    return (delayed * 3) + (escalated * 4) + (critical * 2) + (unresolved * 1)


def _get_top5_actions(db: Session) -> list[str]:
    """Return top 5 recommended actions ordered by priority and age."""
    tasks = (
        db.query(Task)
        .join(AnalysisResult)
        .filter(Task.status.notin_(["Resolved"]))
        .order_by(
            # Critical first
            AnalysisResult.priority.desc(),
            Task.created_at.asc()
        )
        .limit(5)
        .all()
    )
    return [t.recommended_action for t in tasks if t.recommended_action]


def generate_weekly_summary(db: Session) -> WeeklySummary:
    """
    Generate (or regenerate) the weekly summary for the current week.
    Returns the WeeklySummary ORM object.
    """
    week_start, week_end = _get_week_bounds()
    start_dt = datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_dt   = datetime.combine(week_end,   datetime.max.time()).replace(tzinfo=timezone.utc)

    # ── Counts ──────────────────────────────────────────────────────────────
    total_feedback = db.query(Feedback).filter(
        Feedback.submitted_at.between(start_dt, end_dt)
    ).count()

    # If no feedback this week, use all-time totals for prototype
    if total_feedback == 0:
        total_feedback = db.query(Feedback).count()

    critical_count  = db.query(AnalysisResult).filter(AnalysisResult.priority == "Critical").count()
    delayed_count   = db.query(Task).filter(Task.status == "Delayed").count()
    resolved_count  = db.query(Task).filter(Task.status == "Resolved").count()
    unresolved_count = db.query(Task).filter(Task.status.notin_(["Resolved"])).count()

    # ── Focus Recommendation ────────────────────────────────────────────────
    levels = ["Top", "Middle", "Operational"]
    scores = {lvl: _compute_focus_score(db, lvl) for lvl in levels}
    focus_level = max(scores, key=lambda k: scores[k])

    delayed_for_focus = db.query(Task).filter(
        Task.assigned_to == focus_level,
        Task.status == "Delayed"
    ).count()

    # Build natural language recommendation
    rec_text = (
        f"{LEVEL_LABELS[focus_level]} should give more focus next week. "
        f"They currently have the highest workload pressure score ({scores[focus_level]} points), "
        f"with {delayed_for_focus} delayed task(s) and {scores[focus_level]} overall priority points. "
        f"Immediate attention is required to prevent further escalation."
    )

    # ── Top 5 Actions ───────────────────────────────────────────────────────
    top5 = _get_top5_actions(db)

    # ── Save / Update ────────────────────────────────────────────────────────
    existing = db.query(WeeklySummary).filter(
        WeeklySummary.week_start == week_start
    ).first()

    if existing:
        summary = existing
    else:
        summary = WeeklySummary(week_start=week_start, week_end=week_end)
        db.add(summary)

    summary.total_feedback   = total_feedback
    summary.critical_count   = critical_count
    summary.delayed_count    = delayed_count
    summary.resolved_count   = resolved_count
    summary.unresolved_count = unresolved_count
    summary.focus_recommendation = rec_text
    summary.top5_actions     = json.dumps(top5)
    summary.generated_at     = datetime.now(timezone.utc)

    db.commit()
    db.refresh(summary)
    return summary
