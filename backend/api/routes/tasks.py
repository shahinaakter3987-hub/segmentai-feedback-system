from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from database import get_db
from models import Task, AnalysisResult, Feedback, Customer

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class TaskStatusUpdate(BaseModel):
    status: str  # New / Assigned / In Progress / Delayed / Resolved / Escalated
    note: Optional[str] = None


@router.get("/list")
def list_tasks(
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Task).join(AnalysisResult)

    if status:
        query = query.filter(Task.status == status)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)
    if priority:
        query = query.filter(AnalysisResult.priority == priority)

    tasks = query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for t in tasks:
        ar = t.analysis
        fb = ar.feedback if ar else None
        customer = fb.customer if fb else None
        result.append({
            "id": t.id,
            "title": t.title,
            "recommended_action": t.recommended_action,
            "assigned_to": t.assigned_to,
            "effort_pct_top": t.effort_pct_top,
            "effort_pct_mid": t.effort_pct_mid,
            "effort_pct_ops": t.effort_pct_ops,
            "status": t.status,
            "sla_hours": t.sla_hours,
            "created_at": t.created_at.isoformat(),
            "due_at": t.due_at.isoformat() if t.due_at else None,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
            "priority": ar.priority if ar else None,
            "issue_type": ar.issue_type if ar else None,
            "sentiment": ar.sentiment if ar else None,
            "risk_flag": ar.risk_flag if ar else None,
            "customer_name": customer.name if customer else "Unknown",
            "customer_segment": customer.segment if customer else "Budget",
            "feedback_text": fb.text[:120] if fb else "",
        })
    return result


@router.patch("/{task_id}/status")
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db)
):
    valid_statuses = ["New", "Assigned", "In Progress", "Delayed", "Resolved", "Escalated"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = payload.status
    if payload.status == "Resolved":
        task.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)
    return {"message": "Task status updated", "task_id": task_id, "new_status": payload.status}


@router.get("/stats")
def task_stats(db: Session = Depends(get_db)):
    statuses = ["New", "Assigned", "In Progress", "Delayed", "Resolved", "Escalated"]
    stats = {}
    for s in statuses:
        stats[s] = db.query(Task).filter(Task.status == s).count()

    levels = ["Top", "Middle", "Operational"]
    by_level = {}
    by_level_detail = {}
    for lvl in levels:
        by_level[lvl] = db.query(Task).filter(Task.assigned_to == lvl).count()
        level_stats = {}
        for s in statuses:
            level_stats[s] = db.query(Task).filter(
                Task.assigned_to == lvl, Task.status == s
            ).count()
        # Also count critical tasks for this level
        level_stats["Critical"] = db.query(Task).join(AnalysisResult).filter(
            Task.assigned_to == lvl,
            AnalysisResult.priority == "Critical"
        ).count()
        by_level_detail[lvl] = level_stats

    return {
        "by_status": stats,
        "by_level": by_level,
        "by_level_detail": by_level_detail,
        "total": db.query(Task).count(),
    }


@router.get("/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    ar = task.analysis
    fb = ar.feedback if ar else None
    customer = fb.customer if fb else None
    return {
        "id": task.id,
        "title": task.title,
        "recommended_action": task.recommended_action,
        "assigned_to": task.assigned_to,
        "effort_pct_top": task.effort_pct_top,
        "effort_pct_mid": task.effort_pct_mid,
        "effort_pct_ops": task.effort_pct_ops,
        "status": task.status,
        "sla_hours": task.sla_hours,
        "created_at": task.created_at.isoformat(),
        "due_at": task.due_at.isoformat() if task.due_at else None,
        "resolved_at": task.resolved_at.isoformat() if task.resolved_at else None,
        "priority": ar.priority if ar else None,
        "issue_type": ar.issue_type if ar else None,
        "customer_name": customer.name if customer else "Unknown",
        "customer_segment": customer.segment if customer else "Budget",
        "feedback_text": fb.text if fb else "",
        "alerts": [
            {"id": a.id, "type": a.alert_type, "level": a.notified_level,
             "triggered_at": a.triggered_at.isoformat(), "acknowledged": a.acknowledged}
            for a in task.alerts
        ]
    }
