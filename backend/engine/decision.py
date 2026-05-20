"""
Decision engine: priority assignment, effort allocation, and
recommended action generation.
"""

from datetime import datetime, timedelta, timezone

# ── Priority Rules ────────────────────────────────────────────────────────────

PRIORITY_RULES = [
    # (segment, sentiment, issue_type_hint) → (priority, risk_flag)
    ("Premium", "Negative", None,       "Critical", "High Risk"),
    ("Medium",  "Negative", "Product",  "Critical", None),
    ("Medium",  "Negative", "Delivery", "Critical", None),
    ("Medium",  "Negative", None,       "Moderate", None),
    ("Budget",  "Negative", "Product",  "Moderate", None),
    ("Budget",  "Negative", "Delivery", "Moderate", None),
    ("Budget",  "Positive", None,       "Low",      "Business Opportunity"),
    ("Premium", "Neutral",  None,       "Moderate", None),
    ("Medium",  "Neutral",  None,       "Low",      None),
    ("Budget",  "Neutral",  None,       "Low",      None),
    (None,      "Positive", None,       "Low",      None),
]

EFFORT_MAP = {
    "Critical": {"top": 40, "mid": 40, "ops": 20},
    "Moderate": {"top": 20, "mid": 50, "ops": 30},
    "Low":      {"top": 10, "mid": 30, "ops": 60},
}

SLA_HOURS = {
    "Critical": 24,
    "Moderate": 72,
    "Low":      168,
}

ACTION_TEMPLATES = {
    ("Critical", "Service"):      "Escalate service complaint — assign senior manager to contact customer immediately",
    ("Critical", "Product"):      "Initiate urgent product quality investigation and offer replacement or refund",
    ("Critical", "Delivery"):     "Trace shipment urgently and provide customer with immediate resolution",
    ("Critical", "Refund"):       "Process refund request as priority — verify billing and confirm reversal",
    ("Critical", "Availability"): "Notify supply chain team — urgent restocking required for critical customer",
    ("Critical", "Other"):        "Investigate critical issue and assign dedicated account manager",
    ("Moderate", "Service"):      "Review service quality — schedule team briefing and follow up with customer",
    ("Moderate", "Product"):      "Investigate product complaint and arrange replacement if confirmed",
    ("Moderate", "Delivery"):     "Monitor delivery status and provide proactive update to customer",
    ("Moderate", "Refund"):       "Review refund request and process within standard SLA",
    ("Moderate", "Availability"): "Update stock forecasting and notify customer of restock timeline",
    ("Moderate", "Other"):        "Assign to relevant department for review and response",
    ("Low", "Service"):           "Log feedback for service quality review in next team meeting",
    ("Low", "Product"):           "Record product feedback for quality improvement review",
    ("Low", "Delivery"):          "Note delivery feedback — monitor for recurring pattern",
    ("Low", "Refund"):            "Acknowledge refund inquiry and route to accounts team",
    ("Low", "Availability"):      "Flag stock inquiry for inventory team review",
    ("Low", "Other"):             "Acknowledge and log feedback — no immediate action required",
}

ASSIGNED_TO_MAP = {
    "Critical": "Top",
    "Moderate": "Middle",
    "Low":      "Operational",
}


def assign_priority(segment: str, sentiment: str, issue_type: str,
                    repeat_count: int = 0) -> tuple[str, str | None]:
    """
    Determine issue priority and risk flag.

    Args:
        segment:      'Premium' | 'Medium' | 'Budget'
        sentiment:    'Positive' | 'Neutral' | 'Negative'
        issue_type:   'Service' | 'Product' | 'Delivery' | 'Refund' | 'Availability' | 'Other'
        repeat_count: how many times this issue type has appeared for this customer

    Returns:
        (priority, risk_flag)  e.g. ('Critical', 'High Risk')
    """
    # Repeated issue → escalation regardless of segment
    if repeat_count >= 3 and sentiment == "Negative":
        return "Critical", "Escalation Required"

    for rule in PRIORITY_RULES:
        r_seg, r_sent, r_issue, priority, risk_flag = rule
        seg_match   = (r_seg is None or r_seg == segment)
        sent_match  = (r_sent is None or r_sent == sentiment)
        issue_match = (r_issue is None or r_issue == issue_type)
        if seg_match and sent_match and issue_match:
            return priority, risk_flag

    # Default fallback
    return "Low", None


def get_effort(priority: str) -> dict:
    return EFFORT_MAP.get(priority, EFFORT_MAP["Low"])


def get_sla_hours(priority: str) -> int:
    return SLA_HOURS.get(priority, 72)


def get_recommended_action(priority: str, issue_type: str) -> str:
    return ACTION_TEMPLATES.get(
        (priority, issue_type),
        "Review issue and assign to relevant management level"
    )


def get_assigned_level(priority: str) -> str:
    return ASSIGNED_TO_MAP.get(priority, "Operational")


def get_due_datetime(priority: str) -> datetime:
    hours = get_sla_hours(priority)
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def build_task_title(segment: str, sentiment: str, issue_type: str, priority: str) -> str:
    return f"[{priority}] {issue_type} issue — {segment} customer ({sentiment})"
