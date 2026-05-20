from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta, timezone

from database import get_db
from models import Feedback, AnalysisResult, Task, Customer, Alert

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)):
    """Top-level KPI cards."""
    total_feedback  = db.query(Feedback).count()
    critical_count  = db.query(AnalysisResult).filter(AnalysisResult.priority == "Critical").count()
    delayed_count   = db.query(Task).filter(Task.status == "Delayed").count()
    escalated_count = db.query(Task).filter(Task.status == "Escalated").count()
    resolved_count  = db.query(Task).filter(Task.status == "Resolved").count()
    active_alerts   = db.query(Alert).filter(Alert.acknowledged == False).count()
    total_tasks     = db.query(Task).count()

    return {
        "total_feedback":  total_feedback,
        "critical_count":  critical_count,
        "delayed_count":   delayed_count,
        "escalated_count": escalated_count,
        "resolved_count":  resolved_count,
        "active_alerts":   active_alerts,
        "total_tasks":     total_tasks,
    }


@router.get("/sentiment-distribution")
def sentiment_distribution(db: Session = Depends(get_db)):
    """Sentiment counts for bar chart."""
    rows = db.query(
        AnalysisResult.sentiment,
        func.count(AnalysisResult.id).label("count")
    ).group_by(AnalysisResult.sentiment).all()
    return [{"sentiment": r.sentiment, "count": r.count} for r in rows]


@router.get("/segment-distribution")
def segment_distribution(db: Session = Depends(get_db)):
    """Customer segment counts for pie chart."""
    rows = db.query(
        Customer.segment,
        func.count(Customer.id).label("count")
    ).group_by(Customer.segment).all()
    return [{"segment": r.segment, "count": r.count} for r in rows]


@router.get("/feedback-trend")
def feedback_trend(db: Session = Depends(get_db)):
    """Daily feedback counts for last 28 days — line graph."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=28)
    rows = db.query(Feedback).filter(Feedback.submitted_at >= cutoff).all()

    daily = {}
    for fb in rows:
        day = fb.submitted_at.date().isoformat()
        daily[day] = daily.get(day, 0) + 1

    # Fill missing days with 0
    result = []
    for i in range(28):
        day = (datetime.now(timezone.utc) - timedelta(days=27 - i)).date().isoformat()
        result.append({"date": day, "count": daily.get(day, 0)})
    return result


@router.get("/priority-by-issue")
def priority_by_issue(db: Session = Depends(get_db)):
    """Priority count per issue type — stacked bar chart."""
    rows = db.query(
        AnalysisResult.issue_type,
        AnalysisResult.priority,
        func.count(AnalysisResult.id).label("count")
    ).group_by(AnalysisResult.issue_type, AnalysisResult.priority).all()

    data = {}
    for r in rows:
        if r.issue_type not in data:
            data[r.issue_type] = {"issue_type": r.issue_type, "Critical": 0, "Moderate": 0, "Low": 0}
        data[r.issue_type][r.priority] = r.count
    return list(data.values())


@router.get("/task-status")
def task_status_chart(db: Session = Depends(get_db)):
    """Task status counts — donut chart."""
    statuses = ["New", "Assigned", "In Progress", "Delayed", "Resolved", "Escalated"]
    result = []
    for s in statuses:
        count = db.query(Task).filter(Task.status == s).count()
        result.append({"status": s, "count": count})
    return result


@router.get("/effort-allocation")
def effort_allocation(db: Session = Depends(get_db)):
    """Average effort % per management level grouped by priority."""
    priorities = ["Critical", "Moderate", "Low"]
    result = []
    for p in priorities:
        tasks = db.query(Task).join(AnalysisResult).filter(AnalysisResult.priority == p).all()
        if tasks:
            avg_top = sum(t.effort_pct_top for t in tasks) / len(tasks)
            avg_mid = sum(t.effort_pct_mid for t in tasks) / len(tasks)
            avg_ops = sum(t.effort_pct_ops for t in tasks) / len(tasks)
        else:
            avg_top, avg_mid, avg_ops = 0, 0, 0

        result.append({
            "priority": p,
            "Top Management": round(avg_top, 1),
            "Middle Management": round(avg_mid, 1),
            "Operational": round(avg_ops, 1),
        })
    return result


@router.get("/recent-alerts")
def recent_alerts(limit: int = 10, db: Session = Depends(get_db)):
    """Latest alerts for escalation timeline."""
    alerts = db.query(Alert).order_by(Alert.triggered_at.desc()).limit(limit).all()
    result = []
    for a in alerts:
        task = a.task
        result.append({
            "id": a.id,
            "alert_type": a.alert_type,
            "notified_level": a.notified_level,
            "triggered_at": a.triggered_at.isoformat(),
            "acknowledged": a.acknowledged,
            "task_id": a.task_id,
            "task_title": task.title if task else "",
            "task_status": task.status if task else "",
        })
    return result
