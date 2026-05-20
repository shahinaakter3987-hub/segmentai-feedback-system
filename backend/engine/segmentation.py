"""
Customer segmentation logic.
Classifies customers into Premium, Medium, or Budget tiers
based on total spend and average rating.
"""


def segment_customer(total_spend: float, avg_rating: float = None) -> str:
    """
    Determine customer segment.

    Rules:
        Premium  → spend >= 1000  OR  avg_rating >= 4.5
        Medium   → spend 300–999  OR  avg_rating 3.0–4.4
        Budget   → spend < 300    OR  avg_rating < 3.0

    Returns: 'Premium', 'Medium', or 'Budget'
    """
    if total_spend >= 1000:
        return "Premium"
    if avg_rating is not None and avg_rating >= 4.5:
        return "Premium"
    if total_spend >= 300:
        return "Medium"
    if avg_rating is not None and avg_rating >= 3.0:
        return "Medium"
    return "Budget"


def segment_from_rating_only(rating: int) -> str:
    """Fallback when no spend data is available — use single rating."""
    if rating >= 5:
        return "Premium"
    if rating >= 3:
        return "Medium"
    return "Budget"
