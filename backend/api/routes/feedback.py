from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import csv, io
from datetime import datetime, timezone

from database import get_db
from models import Customer, Feedback, AnalysisResult, Task, Alert
from engine.sentiment import analyse_sentiment
from engine.classifier import classify_issue
from engine.segmentation import segment_customer, segment_from_rating_only
from engine.decision import (
    assign_priority, get_effort, get_recommended_action,
    get_assigned_level, get_due_datetime, build_task_title
)

router = APIRouter(prefix="/feedback", tags=["Feedback"])


class FeedbackCreate(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    total_spend: Optional[float] = 0.0
    text: str
    rating: Optional[int] = None


def _process_and_save(db: Session, customer_name: str, customer_email: str,
                      total_spend: float, text: str, rating: int, source: str = "manual"):
    """Full pipeline: save feedback → analyse → create task."""
    # 1. Customer
    customer = db.query(Customer).filter(Customer.email == customer_email).first() if customer_email else None
    if not customer:
        segment = segment_customer(total_spend or 0, rating) if total_spend else (
            segment_from_rating_only(rating) if rating else "Budget"
        )
        customer = Customer(
            name=customer_name,
            email=customer_email,
            total_spend=total_spend or 0.0,
            segment=segment
        )
        db.add(customer)
        db.flush()
    else:
        # Re-segment with updated spend
        customer.total_spend = max(customer.total_spend, total_spend or 0)
        customer.segment = segment_customer(customer.total_spend, rating)

    # 2. Feedback record
    fb = Feedback(
        customer_id=customer.id,
        text=text,
        rating=rating,
        source=source,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(fb)
    db.flush()

    # 3. Sentiment + issue type
    sent_result = analyse_sentiment(text)
    issue_type  = classify_issue(text)

    # Count repeat issues for this customer
    repeat_count = db.query(AnalysisResult).join(Feedback).filter(
        Feedback.customer_id == customer.id,
        AnalysisResult.issue_type == issue_type,
        AnalysisResult.sentiment == "Negative"
    ).count()

    # 4. Priority + risk flag
    priority, risk_flag = assign_priority(
        customer.segment, sent_result["sentiment"], issue_type, repeat_count
    )

    # 5. Analysis record
    ar = AnalysisResult(
        feedback_id=fb.id,
        sentiment=sent_result["sentiment"],
        sentiment_score=sent_result["score"],
        issue_type=issue_type,
        priority=priority,
        risk_flag=risk_flag
    )
    db.add(ar)
    db.flush()

    # 6. Task creation
    effort = get_effort(priority)
    task = Task(
        analysis_id=ar.id,
        title=build_task_title(customer.segment, sent_result["sentiment"], issue_type, priority),
        recommended_action=get_recommended_action(priority, issue_type),
        assigned_to=get_assigned_level(priority),
        effort_pct_top=effort["top"],
        effort_pct_mid=effort["mid"],
        effort_pct_ops=effort["ops"],
        sla_hours=24 if priority == "Critical" else (72 if priority == "Moderate" else 168),
        due_at=get_due_datetime(priority),
        status="Assigned"
    )
    db.add(task)
    db.commit()
    db.refresh(fb)
    return fb


@router.post("/submit")
def submit_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    fb = _process_and_save(
        db,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        total_spend=payload.total_spend,
        text=payload.text,
        rating=payload.rating,
        source="manual"
    )
    return {"message": "Feedback submitted and analysed", "feedback_id": fb.id}


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    saved = 0
    errors = []
    for i, row in enumerate(reader):
        try:
            _process_and_save(
                db,
                customer_name=row.get("customer_name", "Unknown"),
                customer_email=row.get("customer_email", None),
                total_spend=float(row.get("total_spend", 0) or 0),
                text=row.get("feedback_text", row.get("text", "")),
                rating=int(row["rating"]) if row.get("rating") else None,
                source="csv"
            )
            saved += 1
        except Exception as e:
            errors.append({"row": i + 2, "error": str(e)})

    return {"imported": saved, "errors": errors}


@router.get("/list")
def list_feedback(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    items = db.query(Feedback).order_by(Feedback.submitted_at.desc()).offset(skip).limit(limit).all()
    result = []
    for fb in items:
        result.append({
            "id": fb.id,
            "customer_name": fb.customer.name if fb.customer else "Unknown",
            "customer_segment": fb.customer.segment if fb.customer else "Budget",
            "text": fb.text,
            "rating": fb.rating,
            "submitted_at": fb.submitted_at.isoformat(),
            "source": fb.source,
            "sentiment": fb.analysis.sentiment if fb.analysis else None,
            "issue_type": fb.analysis.issue_type if fb.analysis else None,
            "priority": fb.analysis.priority if fb.analysis else None,
            "risk_flag": fb.analysis.risk_flag if fb.analysis else None,
        })
    return result


@router.get("/count")
def feedback_count(db: Session = Depends(get_db)):
    return {"total": db.query(Feedback).count()}
