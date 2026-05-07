import re

# Arabic diacritics (tashkeel) Unicode ranges
# U+064B to U+065F + U+0670
TASHKEEL_CHARS = set(
    "ًٌٍَُِّْٰٕٖٜٟٓٔٗ٘ٙٚٛٝٞ"
)

# Tatweel (kashida) — stretch character
TATWEEL = "ـ"


def remove_tashkeel(text: str) -> str:
    """
    Remove all Arabic diacritics (tashkeel) from text.
    
    This includes fatha, damma, kasra, shadda, sukun, tanween,
    and other combining marks above/below Arabic letters.
    
    Args:
        text: Input Arabic text (may or may not have diacritics)
    
    Returns:
        Text with all diacritics removed
    
    Example:
        >>> remove_tashkeel("قُلْ هُوَ اللَّهُ أَحَدٌ")
        'قل هو الله احد'
    """
    return ''.join(
        c for c in text
        if c not in TASHKEEL_CHARS
    )


def remove_tatweel(text: str) -> str:
    """Remove tatweel (kashida) stretch characters."""
    return text.replace(TATWEEL, "")


def normalize_arabic_text(text: str, remove_diacritics: bool = True) -> str:
    """
    Normalize Arabic poetry text for model input.
    
    Steps:
        1. Strip leading/trailing whitespace
        2. Remove tashkeel (diacritics) if requested
        3. Remove tatweel (kashida)
        4. Normalize whitespace (collapse multiple spaces/newlines)
    
    Args:
        text: Raw input text from user
        remove_diacritics: Whether to strip tashkeel (default: True)
    
    Returns:
        Clean normalized text ready for model inference
    """
    text = text.strip()
    
    if remove_diacritics:
        text = remove_tashkeel(text)
    
    text = remove_tatweel(text)
    
    # Normalize whitespace: collapse multiple spaces, tabs, etc.
    text = re.sub(r'[\s]+', ' ', text)
    
    return text.strip()

def clean_arabic(text: str) -> str:
    """
    Exact preprocessing used for ThemeCNN & EraCNN training.
    """
    if not isinstance(text, str) or not text.strip():
        return ""
    # Remove diacritics / harakat
    text = re.sub(r'[\u0610-\u061A\u064B-\u065F\u0670]', '', text)
    # Normalize alef variants
    text = re.sub(r'[أإآٱ]', 'ا', text)
    # Remove tatweel (kashida)
    text = re.sub(r'ـ+', '', text)
    # Keep Arabic chars, spaces, and '#' (verse separator)
    text = re.sub(r'[^ء-ي\s#]', ' ', text)
    # Collapse whitespace
    return re.sub(r'\s+', ' ', text).strip()


def has_tashkeel(text: str) -> bool:
    """Check if text contains any Arabic diacritics."""
    return any(c in TASHKEEL_CHARS for c in text)


def get_text_stats(text: str) -> dict:
    """Get statistics about the text (useful for debugging)."""
    lines = [l for l in text.splitlines() if l.strip()]
    return {
        "total_chars": len(text),
        "has_tashkeel": has_tashkeel(text),
        "tashkeel_count": sum(1 for c in text if c in TASHKEEL_CHARS),
        "line_count": len(lines),
    }