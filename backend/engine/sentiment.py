"""
Sentiment analysis using TextBlob.
Returns sentiment label and polarity score.
"""
from textblob import TextBlob


def analyse_sentiment(text: str) -> dict:
    """
    Analyse the sentiment of a feedback text.

    Returns:
        dict with keys: sentiment (str), score (float)
    """
    blob = TextBlob(text)
    score = blob.sentiment.polarity  # -1.0 to 1.0

    if score > 0.1:
        label = "Positive"
    elif score < -0.1:
        label = "Negative"
    else:
        label = "Neutral"

    return {"sentiment": label, "score": round(score, 4)}
