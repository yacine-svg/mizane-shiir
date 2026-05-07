import os
import pickle
import logging
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)
MAX_LEN = 512

def _find_models_dir() -> Path:
    candidates = [
        Path(__file__).resolve().parents[3] / "models",   # project-root/models
        Path(__file__).resolve().parents[2] / "models",   # backend/app/models
        Path("/app/models"),
        Path("models"),
    ]
    for c in candidates:
        if c.exists():
            return c
    raise FileNotFoundError(
        "Models directory not found. Tried:\n" +
        "\n".join(f"  - {p}" for p in candidates)
    )

class EraCNNLoader:
    """Lazy singleton loader for EraCNN."""
    
    def __init__(self):
        self.model: Optional[tf.keras.Model] = None
        self.tokenizer = None
        self.era_encoder = None
        self.poet_encoder = None
        self._loaded = False
    
    def load(self) -> None:
        if self._loaded:
            return
        
        models_dir = _find_models_dir()
        logger.info(f"Loading EraCNN artifacts from {models_dir}")
        
        # Shared tokenizer (same one used for theme model)
        with open(models_dir / "text_tokenizer.pkl", "rb") as f:
            self.tokenizer = pickle.load(f)
        
        with open(models_dir / "era_encoder_full.pkl", "rb") as f:
            self.era_encoder = pickle.load(f)
        
        with open(models_dir / "poet_encoder_full.pkl", "rb") as f:
            self.poet_encoder = pickle.load(f)
        
        self.model = tf.keras.models.load_model(
            str(models_dir / "era_cnn_final.keras")
        )
        self._loaded = True
        logger.info("EraCNN loaded successfully")
    
    def predict(self, text: str, poet_name: str = "غير معروف") -> Dict:
        self.load()
        
        from .text_utils import clean_arabic
        cleaned = clean_arabic(text)
        
        # Tokenize + pad
        seq = self.tokenizer.texts_to_sequences([cleaned])
        padded = pad_sequences(seq, maxlen=MAX_LEN, padding='post')
        
        # Encode poet (fallback to "غير معروف" if unknown)
        poet_known = poet_name in self.poet_encoder.classes_
        if poet_known:
            poet_idx = self.poet_encoder.transform([poet_name])[0]
        else:
            fallback = "غير معروف"
            if fallback in self.poet_encoder.classes_:
                poet_idx = self.poet_encoder.transform([fallback])[0]
            else:
                poet_idx = 0
        
        poet_arr = np.array([[poet_idx]])
        
        # Inference
        probs = self.model.predict([padded, poet_arr], verbose=0)[0]
        top3_idx = probs.argsort()[-3:][::-1]
        
        n_classes = min(len(self.era_encoder.classes_), len(probs))
        safe_top3 = [i for i in top3_idx if i < n_classes][:3]

        return {
            "era": str(self.era_encoder.classes_[safe_top3[0]]) if safe_top3 else "غير معروف",
            "confidence": float(probs[safe_top3[0]]) if safe_top3 else 0.0,
            "top3": [
                {"era": str(self.era_encoder.classes_[i]), "confidence": float(probs[i])}
                for i in safe_top3
            ],
            "poet_known": bool(poet_known),
            "poet_used": str(poet_name if poet_known else "غير معروف"),
        }

# ── Singleton accessor ──────────────────────────────────────────────────────
_era_loader: Optional[EraCNNLoader] = None

def get_era_analyzer() -> EraCNNLoader:
    global _era_loader
    if _era_loader is None:
        _era_loader = EraCNNLoader()
    return _era_loader