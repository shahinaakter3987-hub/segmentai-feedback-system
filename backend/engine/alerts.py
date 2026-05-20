"""
SLA-based delay detection and escalation logic.
Scans tasks, marks overdue ones as Delayed, and creates Alert records.
"""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import Task, Alert


ESCALATION_LEVEL_UP = {
    "Operational": "Middle",
    "Middle":      "Top",
    "Top":         "Top",   # Already at top — no further escalation
}


def run_delay_check(db: Session) -> dict:
    """
    Scan all non-resolved tasks and:
    - Mark as 'Delayed' if SLA breached
    - Create a Delay alert (if not already created)
    - Escalate to next management level if delayed > 24h past due_at

    Returns: summary dict with counts
    """
    now = datetime.now(timezone.utc)
    newly_delayed = 0
    newly_escalated = 0

    active_tasks = db.query(Task).filter(
        Task.status.notin_(["Resolved", "Escalated"])
    ).all()

    for task in active_tasks:
        if task.due_at is None:
            continue

        due_at = task.due_at
        # Make timezone-aware if naive
        if due_at.tzinfo is None:
            due_at = due_at.replace(tzinfo=timezone.utc)

        if now > due_at:
            # Mark as Delayed
            if task.status not in ("Delayed", "Escalated"):
                task.status = "Delayed"
                newly_delayed += 1

                # Create Delay alert if one doesn't exist for this task
                existing = db.query(Alert).filter(
                    Alert.task_id == task.id,
                    Alert.alert_type == "Delay"
                ).first()
                if not existing:
                    alert = Alert(
                        task_id=task.id,
                        alert_type="Delay",
                        notified_level=task.assigned_to,
                        acknowledged=False,
                    )
                    db.add(alert)

            # Escalate if still delayed > 24h after due_at
            overtime_hours = (now - due_at).total_seconds() / 3600
            if overtime_hours > 24 and task.status == "Delayed":
                next_level = ESCALATION_LEVEL_UP.get(task.assigned_to, "Top")
                if next_level != task.assigned_to:
                    task.status = "Escalated"
                    task.assigned_to = next_level
                    newly_escalated += 1

                    esc_alert = Alert(
                        task_id=task.id,
                        alert_type="Escalation",
                        notified_level=next_level,
                        acknowledged=False,
                    )
                    db.add(esc_alert)

    db.commit()
    return {
        "checked": len(active_tasks),
        "newly_delayed": newly_delayed,
        "newly_escalated": newly_escalated,
    }
