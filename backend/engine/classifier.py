"""
Keyword-based issue type classifier.
Maps feedback text to one of six issue categories.
"""

KEYWORD_MAP = {
    "Service": [
        "staff", "rude", "slow service", "wait time", "attitude", "customer service",
        "unfriendly", "ignored", "unhelpful", "unprofessional", "response time",
        "no response", "support", "assistance", "helpdesk"
    ],
    "Product": [
        "quality", "broken", "defective", "wrong item", "expired", "damaged",
        "faulty", "poor quality", "not working", "malfunction", "counterfeit",
        "fake", "inferior", "substandard", "bad product"
    ],
    "Delivery": [
        "late", "missing", "not arrived", "shipping", "delay", "delayed",
        "never received", "wrong address", "courier", "package", "tracking",
        "dispatched", "out for delivery", "lost parcel"
    ],
    "Refund": [
        "refund", "money back", "charge", "billing", "receipt", "overcharged",
        "double charged", "payment", "invoice", "reimbursement", "credit",
        "cashback", "reversal"
    ],
    "Availability": [
        "out of stock", "unavailable", "sold out", "not available", "no stock",
        "cannot find", "discontinued", "waiting list", "backorder"
    ],
}


def classify_issue(text: str) -> str:
    """
    Classify the primary issue type from feedback text.

    Returns one of: Service, Product, Delivery, Refund, Availability, Other
    """
    text_lower = text.lower()
    scores = {category: 0 for category in KEYWORD_MAP}

    for category, keywords in KEYWORD_MAP.items():
        for kw in keywords:
            if kw in text_lower:
                scores[category] += 1

    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "Other"
