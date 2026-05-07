import os
import json
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from pathlib import Path
import logging
from typing import List, Dict, Optional, Union, Tuple

logger = logging.getLogger(__name__)

# ── Theme Name Mapping (8 Arabic poetry themes) ──────────────────────────────
THEME_NAMES = {
    0: "عامة وقصيرة",
    1: "غزل ورومانسية",
    2: "حزن وعتاب",
    3: "مدح وفخر",
    4: "هجاء وذم",
    5: "دين وتصوف",
    6: "حكمة ونصيحة",
    7: "وطنية وسياسة",
}

# Reverse mapping for label lookup
THEME_NAME_TO_ID = {v: k for k, v in THEME_NAMES.items()}


class ThemeClassifier:
    """
    Wrapper around the fine-tuned BERT model for Arabic poetry theme classification.

    Model: CAMeL-Lab/bert-base-arabic-camelbert-ca fine-tuned on 8-class theme data.
    Input format: single verse as "sadr ajuz" (two hemistiches joined by space).
    Preprocessing: uses clean_arabic() from text_utils (same as training).
    """
    MAX_LENGTH = 128

    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Resolve model path
        if model_path is None:
            env_path = os.getenv("ARABIC_THEME_MODEL_PATH")
            if env_path:
                model_path = Path(env_path)
            else:
                possible_paths = [
                    Path(__file__).resolve().parents[3] / "models" / "best_arabic_theme_diwan_model_v2",
                    Path(__file__).resolve().parents[2] / "models" / "best_arabic_theme_diwan_model_v2",
                    Path("models/best_arabic_theme_diwan_model_v2"),
                ]
                model_path = None
                for p in possible_paths:
                    if p.exists():
                        model_path = p
                        break

                if model_path is None:
                    searched = "\n".join(f"  - {p}" for p in possible_paths)
                    raise FileNotFoundError(
                        f"Theme model not found. Tried:\n{searched}\n\n"
                        "Set ARABIC_THEME_MODEL_PATH env var or move your model."
                    )
        else:
            model_path = Path(model_path)

        self.model_path = str(model_path)
        self._validate_model_files(model_path)

        # ── AUTO-FIX MALFORMED config.json ────────────────────────────────
        self._fix_config_json(model_path)

        logger.info("Loading Arabic theme model from: %s", model_path)
        logger.info("Device: %s", self.device)

        self.tokenizer = AutoTokenizer.from_pretrained(str(model_path))
        self.model = AutoModelForSequenceClassification.from_pretrained(str(model_path))
        self.model.to(self.device)
        self.model.eval()

        # Build id2label from model config (should be Arabic names after fix)
        config_id2label = getattr(self.model.config, 'id2label', {})
        self.id2label = {}
        for k, v in config_id2label.items():
            key = int(k) if isinstance(k, str) and k.isdigit() else k
            self.id2label[key] = v

        logger.info("Theme model loaded successfully! Classes: %s", list(self.id2label.values()))

    def _fix_config_json(self, model_path: Path):
        """
        Fix malformed config.json where id2label/label2id have int values
        instead of str values.
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

        # Fix id2label: values must be strings (Arabic theme names)
        if "id2label" in config:
            id2label = config["id2label"]
            if isinstance(id2label, dict):
                fixed_id2label = {}
                for k, v in id2label.items():
                    if isinstance(v, int):
                        fixed_id2label[str(k)] = THEME_NAMES.get(v, str(v))
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
                    if isinstance(k, int) or (isinstance(k, str) and k.isdigit()):
                        int_key = int(k)
                        str_key = THEME_NAMES.get(int_key, str(int_key))
                    else:
                        str_key = str(k)
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
                "\nTheme model folder not found: {}\n"
                "Expected structure:\n"
                "  models/best_arabic_theme_diwan_model_v2/\n"
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
        logger.info("Found theme model weights: %s", weight_file)

    def predict(self, text: str) -> Dict:
        """
        Predict theme for a single verse string.

        Args:
            text: A verse as "sadr ajuz" (two hemistiches joined by space),
                  or raw poem text (will be preprocessed).

        Returns:
            Dict with theme_name, label_id, confidence, all_probs
        """
        # Preprocess exactly like training
        from app.services.text_utils import clean_arabic
        cleaned = clean_arabic(text)

        if not cleaned:
            return {
                "theme_name": "غير معروف",
                "label_id": -1,
                "confidence": 0.0,
                "all_probs": {},
            }

        inputs = self.tokenizer(
            cleaned,
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

        # Build probability distribution for all classes
        all_probs = {}
        prob_list = probs[0].cpu().tolist()
        for idx, p in enumerate(prob_list):
            name = self.id2label.get(idx, THEME_NAMES.get(idx, str(idx)))
            all_probs[name] = round(p, 4)

        theme_name = self.id2label.get(predicted_label, THEME_NAMES.get(predicted_label, "غير معروف"))

        return {
            "theme_name": theme_name,
            "label_id": predicted_label,
            "confidence": round(confidence, 4),
            "all_probs": all_probs,
        }

    def predict_batch(self, texts: List[str]) -> List[Dict]:
        """Predict themes for multiple verse strings."""
        if not texts:
            return []

        from app.services.text_utils import clean_arabic
        cleaned_texts = [clean_arabic(t) for t in texts]

        # Filter out empty texts but keep indices
        valid_indices = []
        valid_texts = []
        for i, t in enumerate(cleaned_texts):
            if t:
                valid_indices.append(i)
                valid_texts.append(t)

        if not valid_texts:
            return [{
                "theme_name": "غير معروف",
                "label_id": -1,
                "confidence": 0.0,
                "all_probs": {},
            } for _ in texts]

        inputs = self.tokenizer(
            valid_texts,
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

        # Build results
        results = [None] * len(texts)
        for batch_idx, orig_idx in enumerate(valid_indices):
            label = predicted_labels[batch_idx]
            confidence = probs[batch_idx][label].item()

            all_probs = {}
            prob_list = probs[batch_idx].cpu().tolist()
            for idx, p in enumerate(prob_list):
                name = self.id2label.get(idx, THEME_NAMES.get(idx, str(idx)))
                all_probs[name] = round(p, 4)

            theme_name = self.id2label.get(label, THEME_NAMES.get(label, "غير معروف"))
            results[orig_idx] = {
                "theme_name": theme_name,
                "label_id": label,
                "confidence": round(confidence, 4),
                "all_probs": all_probs,
            }

        # Fill empty results
        for i in range(len(texts)):
            if results[i] is None:
                results[i] = {
                    "theme_name": "غير معروف",
                    "label_id": -1,
                    "confidence": 0.0,
                    "all_probs": {},
                }

        return results


# ── Global singleton ─────────────────────────────────────────────────────────
_theme_classifier: Optional[ThemeClassifier] = None


def get_theme_classifier(model_path: Optional[str] = None) -> ThemeClassifier:
    """Get or create the theme classifier singleton."""
    global _theme_classifier
    if _theme_classifier is None:
        _theme_classifier = ThemeClassifier(model_path)
    return _theme_classifier


def reset_theme_classifier() -> None:
    """Reset the singleton."""
    global _theme_classifier
    _theme_classifier = None
    logger.info("Theme classifier singleton reset.")