import os
import json
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from pathlib import Path
import logging
from typing import List, Dict, Optional, Union, Tuple

logger = logging.getLogger(__name__)

# ── Meter Name Mapping (16 Arabic meters) ────────────────────────────────────
METER_NAMES = {
    0: "طويل", 1: "مديد", 2: "بسيط", 3: "وافر", 4: "كامل",
    5: "هزج", 6: "رجز", 7: "رمل", 8: "سريع", 9: "منسرح",
    10: "خفيف", 11: "مضارع", 12: "مقتضب", 13: "مجتث",
    14: "متقارب", 15: "متدارك",
}

# ── Tafilat mapping (prosodic feet for each meter) ───────────────────────────
METER_TAFILAT_RAW = {
    "طويل": "فعولن مفاعيلن فعولن مفاعيلن",
    "مديد": "فاعلاتن فاعلن فاعلاتن",
    "بسيط": "مستفعلن فاعلن مستفعلن فاعلن",
    "وافر": "مفاعلتن مفاعلتن فعولن",
    "كامل": "متفاعلن متفاعلن متفاعلن",
    "هزج": "مفاعيلن مفاعيلن",
    "رجز": "مستفعلن مستفعلن مستفعلن",
    "رمل": "فاعلاتن فاعلاتن فاعلاتن",
    "سريع": "مستفعلن مستفعلن فاعلن",
    "منسرح": "مستفعلن مفاعلن فاعلاتن",
    "خفيف": "فاعلاتن مستفعلن فاعلاتن",
    "مضارع": "مفاعلن فاعلاتن مفاعلن",
    "مقتضب": "مفاعلن فاعلاتن",
    "مجتث": "مستفعلن فاعلاتن مستفعلن",
    "متقارب": "فعولن فعولن فعولن فعولن",
    "متدارك": "فاعلن فاعلن فاعلن فاعلن",
}

# Arabic diacritics (tashkeel)
TASHKEEL_CHARS = set(
    "ًٌٍَُِّْٰٕٖٜٟٓٔٗ٘ٙٚٛٝٞ"
)


def remove_tashkeel(text: str) -> str:
    """Remove all Arabic diacritics from text."""
    return ''.join(c for c in text if c not in TASHKEEL_CHARS)


def get_tafilat_for_meter(meter_name: str) -> List[str]:
    """Return tafilat as a list of individual feet."""
    raw = METER_TAFILAT_RAW.get(meter_name, "غير معروف")
    if raw == "غير معروف":
        return ["غير معروف"]
    return raw.split()


class MeterClassifier:
    """
    Wrapper around the fine-tuned BERT model for Arabic meter classification.
    Supports both .safetensors and .bin model weights.
    Auto-fixes malformed config.json (id2label with int values instead of str).
    """
    MAX_LENGTH = 128

    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Resolve model path
        if model_path is None:
            env_path = os.getenv("ARABIC_METER_MODEL_PATH")
            if env_path:
                model_path = Path(env_path)
            else:
                possible_paths = [
                    Path(__file__).resolve().parents[3] / "models" / "best_arabic_meter_model",
                    Path(__file__).resolve().parents[2] / "models" / "best_arabic_meter_model",
                    Path("models/best_arabic_meter_model"),
                ]
                model_path = None
                for p in possible_paths:
                    if p.exists():
                        model_path = p
                        break

                if model_path is None:
                    searched = "\n".join(f"  - {p}" for p in possible_paths)
                    raise FileNotFoundError(
                        f"Model not found. Tried:\n{searched}\n\n"
                        "Set ARABIC_METER_MODEL_PATH env var or move your model."
                    )
        else:
            model_path = Path(model_path)

        self.model_path = str(model_path)
        self._validate_model_files(model_path)

        # ── AUTO-FIX MALFORMED config.json ────────────────────────────────
        self._fix_config_json(model_path)

        logger.info("Loading Arabic meter model from: %s", model_path)
        logger.info("Device: %s", self.device)

        self.tokenizer = AutoTokenizer.from_pretrained(str(model_path))
        self.model = AutoModelForSequenceClassification.from_pretrained(str(model_path))
        self.model.to(self.device)
        self.model.eval()

        logger.info("Model loaded successfully!")

    def _fix_config_json(self, model_path: Path):
        """
        Fix malformed config.json where id2label/label2id have int values
        instead of str values (causes huggingface_hub StrictDataclassFieldValidationError).
        """
        config_path = model_path / "config.json"
        if not config_path.exists():
            return

        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        except (json.JSONDecodeError, IOError):
            logger.warning("Could not read config.json for auto-fix, skipping.")
            return

        modified = False

        # Fix id2label: values must be strings
        if "id2label" in config:
            id2label = config["id2label"]
            if isinstance(id2label, dict):
                fixed_id2label = {}
                for k, v in id2label.items():
                    if isinstance(v, int):
                        # Map to Arabic meter name; fallback to str(v)
                        fixed_id2label[str(k)] = METER_NAMES.get(v, str(v))
                        modified = True
                    elif isinstance(v, str):
                        fixed_id2label[str(k)] = v
                    else:
                        fixed_id2label[str(k)] = str(v)
                        modified = True
                config["id2label"] = fixed_id2label

        # Fix label2id: keys must be strings, values must be ints
        if "label2id" in config:
            label2id = config["label2id"]
            if isinstance(label2id, dict):
                fixed_label2id = {}
                for k, v in label2id.items():
                    # Determine the proper string key
                    if isinstance(k, int) or (isinstance(k, str) and k.isdigit()):
                        int_key = int(k)
                        str_key = METER_NAMES.get(int_key, str(int_key))
                    else:
                        str_key = str(k)
                    # Ensure value is int
                    if isinstance(v, int):
                        int_val = v
                    elif isinstance(v, str) and v.isdigit():
                        int_val = int(v)
                        modified = True
                    else:
                        int_val = int(v) if not isinstance(v, str) else 0
                        modified = True
                    fixed_label2id[str_key] = int_val
                config["label2id"] = fixed_label2id

        if modified:
            try:
                with open(config_path, "w", encoding="utf-8") as f:
                    json.dump(config, f, ensure_ascii=False, indent=2)
                logger.info("Auto-fixed malformed config.json (id2label/label2id types).")
            except IOError as e:
                logger.warning("Could not write fixed config.json: %s", e)

    def _validate_model_files(self, model_path: Path):
        """Check that required model files exist."""
        if not model_path.exists():
            raise FileNotFoundError(
                "\nModel folder not found: {}\n"
                "Expected structure:\n"
                "  models/best_arabic_meter_model/\n"
                "    ├── model.safetensors\n"
                "    ├── tokenizer_config.json\n"
                "    ├── tokenizer.json\n"
                "    ├── config.json\n"
                "    └── training_args.bin".format(model_path)
            )

        required = ["config.json", "tokenizer.json"]
        missing = [f for f in required if not (model_path / f).exists()]
        if missing:
            raise FileNotFoundError(
                "Missing required files in {}: {}".format(model_path, missing)
            )

        has_safetensors = (model_path / "model.safetensors").exists()
        has_bin = (model_path / "pytorch_model.bin").exists()

        if not (has_safetensors or has_bin):
            raise FileNotFoundError(
                "No model weights found in {}\n"
                "Expected either:\n"
                "  - model.safetensors\n"
                "  - pytorch_model.bin".format(model_path)
            )

        weight_file = "model.safetensors" if has_safetensors else "pytorch_model.bin"
        logger.info("Found model weights: %s", weight_file)

    def _clean_text(self, text: str) -> str:
        """Clean text before tokenization."""
        text = remove_tashkeel(text)
        text = text.replace("ـ", "")  # Remove tatweel
        return text.strip()

    # ── NEW: Split-hemistich methods (matches training format) ──────────────

    def predict_split(self, sadr: str, ajuz: str) -> Dict:
        """Predict meter from two hemistichs (exactly like training)."""
        sadr = self._clean_text(sadr)
        ajuz = self._clean_text(ajuz)

        inputs = self.tokenizer(
            sadr, ajuz,
            return_tensors="pt",
            truncation=True,
            max_length=self.MAX_LENGTH,
            padding=True,
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            predicted_label = torch.argmax(probs, dim=1).item()
            confidence = probs[0][predicted_label].item()

        meter_name = METER_NAMES.get(predicted_label, "غير معروف")
        return {
            "meter_name": meter_name,
            "label_id": predicted_label,
            "confidence": round(confidence, 4),
            "tafilat": get_tafilat_for_meter(meter_name),
        }

    def predict_batch_split(self, pairs: List[Tuple[str, str]]) -> List[Dict]:
        """Batch predict from (sadr, ajuz) pairs."""
        if not pairs:
            return []

        sadrs = [self._clean_text(s) for s, _ in pairs]
        ajuzs = [self._clean_text(a) for _, a in pairs]

        inputs = self.tokenizer(
            sadrs, ajuzs,
            return_tensors="pt",
            truncation=True,
            max_length=self.MAX_LENGTH,
            padding=True,
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            predicted_labels = torch.argmax(probs, dim=1).tolist()
            confidences = probs.gather(
                dim=1,
                index=torch.tensor(predicted_labels).unsqueeze(1)
            ).squeeze(1).tolist()

        results = []
        for label, conf in zip(predicted_labels, confidences):
            meter_name = METER_NAMES.get(label, "غير معروف")
            results.append({
                "meter_name": meter_name,
                "label_id": label,
                "confidence": round(conf, 4),
                "tafilat": get_tafilat_for_meter(meter_name),
            })
        return results

    # ── Legacy single-string methods (kept for compatibility) ───────────────

    def predict(self, verse: str) -> Dict:
        """Predict meter for a single verse string."""
        inputs = self._tokenize_single(verse)

        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            predicted_label = torch.argmax(probs, dim=1).item()
            confidence = probs[0][predicted_label].item()

        meter_name = METER_NAMES.get(predicted_label, "غير معروف")
        return {
            "meter_name": meter_name,
            "label_id": predicted_label,
            "confidence": round(confidence, 4),
            "tafilat": get_tafilat_for_meter(meter_name),
        }

    def predict_batch(self, verses: List[str]) -> List[Dict]:
        """Predict meters for multiple verse strings."""
        if not verses:
            return []

        inputs = self._tokenize_single(verses)

        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            predicted_labels = torch.argmax(probs, dim=1).tolist()
            confidences = probs.gather(
                dim=1,
                index=torch.tensor(predicted_labels).unsqueeze(1)
            ).squeeze(1).tolist()

        results = []
        for label, conf in zip(predicted_labels, confidences):
            meter_name = METER_NAMES.get(label, "غير معروف")
            results.append({
                "meter_name": meter_name,
                "label_id": label,
                "confidence": round(conf, 4),
                "tafilat": get_tafilat_for_meter(meter_name),
            })
        return results

    def _tokenize_single(self, texts: Union[str, List[str]]) -> Dict:
        """Tokenize single-string input."""
        is_batch = isinstance(texts, list)
        if is_batch:
            texts = [self._clean_text(t) for t in texts]
        else:
            texts = self._clean_text(texts)

        inputs = self.tokenizer(
            texts,
            return_tensors="pt",
            truncation=True,
            max_length=self.MAX_LENGTH,
            padding=True,
        )
        return {k: v.to(self.device) for k, v in inputs.items()}

    def get_tafilat_for_meter(self, meter_name: str) -> List[str]:
        """Public accessor for tafilat lookup."""
        return get_tafilat_for_meter(meter_name)


# ── Global singleton ─────────────────────────────────────────────────────────
_meter_classifier: Optional[MeterClassifier] = None


def get_meter_classifier(model_path: Optional[str] = None) -> MeterClassifier:
    """Get or create the classifier singleton."""
    global _meter_classifier
    if _meter_classifier is None:
        _meter_classifier = MeterClassifier(model_path)
    return _meter_classifier


def reset_meter_classifier() -> None:
    """Reset the singleton."""
    global _meter_classifier
    _meter_classifier = None
    logger.info("Meter classifier singleton reset.")