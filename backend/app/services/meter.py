from collections import Counter
import logging
from app.services.model_loader import get_meter_classifier
from app.services.text_utils import normalize_arabic_text, has_tashkeel

logger = logging.getLogger(__name__)


def analyze_meter(text: str) -> tuple[str, list[str], dict]:
    """
    Analyze the poetic meter of Arabic text using the fine-tuned BERT model.

    Input format:
        - Each verse on its own line (full verse)
        - OR hemistichs separated by newline (will be paired automatically)
    """
    # ------------------------------------------------------------------
    # STEP 1: NORMALIZE INPUT TEXT
    # ------------------------------------------------------------------
    original_text = text
    text = normalize_arabic_text(text, remove_diacritics=True)

    if has_tashkeel(original_text):
        logger.info("Tashkeel detected and removed from input text.")

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return "غير معروف", ["غير معروف"], {}

    # ------------------------------------------------------------------
    # STEP 2: VERSE CONSTRUCTION → list of (sadr, ajuz) tuples
    # ------------------------------------------------------------------
    pairs = []  # each element is (sadr, ajuz)

    if len(lines) >= 2 and len(lines) % 2 == 0:
        avg_len = sum(len(line) for line in lines) / len(lines)
        if avg_len < 80:
            # Mode B: Lines alternate hemistichs
            for i in range(0, len(lines), 2):
                pairs.append((lines[i], lines[i + 1]))
        else:
            # Mode A: Each line is a full verse → split roughly in half
            for line in lines:
                words = line.split()
                mid = len(words) // 2
                sadr = " ".join(words[:mid])
                ajuz = " ".join(words[mid:])
                pairs.append((sadr, ajuz))
    else:
        # Odd count or long lines → treat each as full verse, split in half
        for line in lines:
            words = line.split()
            mid = len(words) // 2
            sadr = " ".join(words[:mid])
            ajuz = " ".join(words[mid:])
            pairs.append((sadr, ajuz))

    if not pairs:
        return "غير معروف", ["غير معروف"], {}

    # ------------------------------------------------------------------
    # STEP 3: MODEL INFERENCE (split hemistichs → matches training)
    # ------------------------------------------------------------------
    classifier = get_meter_classifier()
    predictions = classifier.predict_batch_split(pairs)

    for p in predictions:
        logger.debug(
            "Predicted meter=%s confidence=%.4f",
            p["meter_name"], p["confidence"]
        )

    meter_names = [p["meter_name"] for p in predictions]

    # Overall meter = most frequent
    most_common = Counter(meter_names).most_common(1)
    overall_meter = most_common[0][0] if most_common else "غير معروف"

    # Get tafilat as a proper list of individual feet
    overall_tafilat = classifier.get_tafilat_for_meter(overall_meter)

    # Reconstruct full verse strings for display in response
    full_verses = [f"{s} {a}" for s, a in pairs]

    details = {
        "verses_analyzed": len(pairs),
        "overall_meter": overall_meter,
        "predictions": [
            {
                "verse": verse,
                "meter": pred["meter_name"],
                "label_id": pred["label_id"],
                "confidence": pred["confidence"],
                "tafilat": pred["tafilat"],
            }
            for verse, pred in zip(full_verses, predictions)
        ],
    }

    return overall_meter, overall_tafilat, details