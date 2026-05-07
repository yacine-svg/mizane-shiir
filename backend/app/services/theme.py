from app.services.theme_model_loader import get_theme_classifier
from app.services.text_utils import clean_arabic
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

# Lazy-loaded singleton
_theme_classifier = None


def _get_classifier():
    """Lazy initializer for the theme classifier singleton."""
    global _theme_classifier
    if _theme_classifier is None:
        _theme_classifier = get_theme_classifier()
    return _theme_classifier


def analyze_theme(text: str) -> str:
    """
    Analyze the theme/subject of Arabic poetry using the fine-tuned BERT model.

    Args:
        text: Raw Arabic poem text. Can be a single verse (sadr + ajuz)
              or multiple verses. If multiple verses, analyzes the first verse.

    Returns:
        Arabic theme name (e.g., "غزل ورومانسية", "مدح وفخر", etc.)
    """
    try:
        classifier = _get_classifier()

        # If text has multiple lines/verses, take the first non-empty one
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if not lines:
            return "غير معروف"

        # Use first verse for theme analysis (matches training: one verse = sadr + ajuz)
        first_verse = lines[0]

        result = classifier.predict(first_verse)
        return result["theme_name"]

    except Exception as e:
        logger.error("Theme analysis failed: %s", e)
        return "غير معروف"


def analyze_theme_detailed(text: str) -> Dict:
    """
    Detailed theme analysis with confidence scores for all classes.

    Args:
        text: Raw Arabic poem text.

    Returns:
        Dict with:
            - theme: predicted theme name
            - confidence: confidence score (0-1)
            - all_probs: dict of {theme_name: probability} for all 8 classes
    """
    try:
        classifier = _get_classifier()

        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if not lines:
            return {
                "theme": "غير معروف",
                "confidence": 0.0,
                "all_probs": {},
            }

        first_verse = lines[0]
        result = classifier.predict(first_verse)

        return {
            "theme": result["theme_name"],
            "confidence": result["confidence"],
            "all_probs": result["all_probs"],
        }

    except Exception as e:
        logger.error("Detailed theme analysis failed: %s", e)
        return {
            "theme": "غير معروف",
            "confidence": 0.0,
            "all_probs": {},
        }


def analyze_themes_batch(texts: List[str]) -> List[str]:
    """
    Batch theme analysis for multiple poems/verses.

    Args:
        texts: List of raw Arabic poem texts.

    Returns:
        List of theme names.
    """
    try:
        classifier = _get_classifier()

        # Extract first verse from each text
        first_verses = []
        for text in texts:
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            first_verses.append(lines[0] if lines else "")

        results = classifier.predict_batch(first_verses)
        return [r["theme_name"] for r in results]

    except Exception as e:
        logger.error("Batch theme analysis failed: %s", e)
        return ["غير معروف"] * len(texts)