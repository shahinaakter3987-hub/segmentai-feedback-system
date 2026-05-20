from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Date
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    segment = Column(String, default="Budget")  # Premium / Medium / Budget
    total_spend = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    feedbacks = relationship("Feedback", back_populates="customer")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    text = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)  # 1–5
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source = Column(String, default="manual")  # manual / csv

    customer = relationship("Customer", back_populates="feedbacks")
    analysis = relationship("AnalysisResult", back_populates="feedback", uselist=False)


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedback.id"), nullable=False)
    sentiment = Column(String)          # Positive / Neutral / Negative
    sentiment_score = Column(Float)     # -1.0 to 1.0
    issue_type = Column(String)         # Service / Product / Delivery / Refund / Availability / Other
    priority = Column(String)           # Critical / Moderate / Low
    risk_flag = Column(String, nullable=True)  # High Risk / Escalation Required / Business Opportunity
    analysed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    feedback = relationship("Feedback", back_populates="analysis")
    task = relationship("Task", back_populates="analysis", uselist=False)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id"), nullable=False)
    title = Column(String, nullable=False)
    recommended_action = Column(Text)
    assigned_to = Column(String)        # Top / Middle / Operational
    effort_pct_top = Column(Integer, default=0)
    effort_pct_mid = Column(Integer, default=0)
    effort_pct_ops = Column(Integer, default=0)
    status = Column(String, default="New")  # New / Assigned / In Progress / Delayed / Resolved / Escalated
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    due_at = Column(DateTime)
    resolved_at = Column(DateTime, nullable=True)
    sla_hours = Column(Integer, default=72)

    analysis = relationship("AnalysisResult", back_populates="task")
    alerts = relationship("Alert", back_populates="task")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    alert_type = Column(String)         # Delay / Escalation
    triggered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notified_level = Column(String)     # Top / Middle / Operational
    acknowledged = Column(Boolean, default=False)

    task = relationship("Task", back_populates="alerts")


class WeeklySummary(Base):
    __tablename__ = "weekly_summaries"

    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(Date)
    week_end = Column(Date)
    total_feedback = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    unresolved_count = Column(Integer, default=0)
    delayed_count = Column(Integer, default=0)
    resolved_count = Column(Integer, default=0)
    focus_recommendation = Column(Text)
    top5_actions = Column(Text)         # JSON string
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
