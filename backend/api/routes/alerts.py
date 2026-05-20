from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Alert
from engine.alerts import run_delay_check

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/list")
def list_alerts(
    acknowledged: bool = None,
    alert_type: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Alert).order_by(Alert.triggered_at.desc())
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    alerts = query.limit(limit).all()

    result = []
    for a in alerts:
        task = a.task
        ar   = task.analysis if task else None
        fb   = ar.feedback if ar else None
        customer = fb.customer if fb else None
        result.append({
            "id": a.id,
            "alert_type": a.alert_type,
            "notified_level": a.notified_level,
            "triggered_at": a.triggered_at.isoformat(),
            "acknowledged": a.acknowledged,
            "task_id": a.task_id,
            "task_title": task.title if task else "",
            "task_status": task.status if task else "",
            "priority": ar.priority if ar else None,
            "customer_name": customer.name if customer else "Unknown",
            "customer_segment": customer.segment if customer else "",
        })
    return result


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}
    alert.acknowledged = True
    db.commit()
    return {"message": "Alert acknowledged", "alert_id": alert_id}


@router.post("/run-check")
def trigger_delay_check(db: Session = Depends(get_db)):
    """Manually trigger the SLA delay check engine."""
    result = run_delay_check(db)
    return {"message": "Delay check completed", **result}


@router.get("/stats")
def alert_stats(db: Session = Depends(get_db)):
    total     = db.query(Alert).count()
    delays    = db.query(Alert).filter(Alert.alert_type == "Delay").count()
    escalated = db.query(Alert).filter(Alert.alert_type == "Escalation").count()
    unacked   = db.query(Alert).filter(Alert.acknowledged == False).count()
    return {
        "total": total,
        "delays": delays,
        "escalations": escalated,
        "unacknowledged": unacked
    }
