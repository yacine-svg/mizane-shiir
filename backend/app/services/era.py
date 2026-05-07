from .keras_models import get_era_analyzer

def analyze_era(text: str, poet_name: str = "غير معروف") -> dict:
    """
    Predict the historical era of an Arabic poem.
    
    Args:
        text: Full poem text
        poet_name: Poet name (in Arabic). Unknown poets fall back safely.
    
    Returns:
        Dict with era, confidence, top-3 predictions, and poet metadata.
    """
    analyzer = get_era_analyzer()
    return analyzer.predict(text, poet_name)