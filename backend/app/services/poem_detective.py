# backend/app/services/poem_detective.py
import re
from typing import List, Tuple, Dict, Any
from .detective_core import ArabicStyleDetective


def _split_verses(text: str) -> List[Tuple[str, str]]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    verses = []

    for line in lines:
        if " #" in line:
            parts = line.split(" # ", 1)
            verses.append((parts[0].strip(), parts[1].strip()))
        else:
            words = line.split()
            mid = len(words) // 2
            sadr = " ".join(words[:mid])
            ajuz = " ".join(words[mid:])
            verses.append((sadr, ajuz))
    
    return verses


class PoemDetective:
    def __init__(self, text: str):
        self.text = text
        self.verses = _split_verses(text)
        self.results: List[Dict[str, Any]] = []

    def analyze(self) -> Dict[str, Any]:
        all_rawis: List[str] = []
        style_flags = {
            "tasri": False,
            "tibaq": False,
            "muqabala": False,
            "jinas_tamm": False,
            "jinas_naqis": False,
            "istiara": False,
            "kinaya": False,
        }
        
        # NEW: Collect rich per-verse details
        verse_details: List[Dict[str, Any]] = []

        for verse_idx, (sadr, ajuz) in enumerate(self.verses):
            if not ajuz:
                continue
            
            det = ArabicStyleDetective(sadr, ajuz)
            r = det.analyze()
            self.results.append(r)

            # ── Collect rawi ──
            qafiya = r["qafiya_rawi"]
            if qafiya and qafiya.get("rawi"):
                all_rawis.append(qafiya["rawi"])

            # ── Build verse detail ──
            v_detail: Dict[str, Any] = {
                "verse_index": verse_idx,
                "sadr": sadr,
                "ajuz": ajuz,
                "tasri": None,
                "tibaq_pairs": [],
                "muqabala_pairs": [],
                "jinas_tamm": [],
                "jinas_naqis": [],
                "metaphor_flags": [],
            }

            # Tasri
            if r["tasri"]["tasri_found"]:
                style_flags["tasri"] = True
                v_detail["tasri"] = {
                    "sadr_end_word": r["tasri"]["sadr_end_word"],
                    "ajuz_end_word": r["tasri"]["ajuz_end_word"],
                    "rawi_match": r["tasri"]["rawi_match"],
                    "suffix_match": r["tasri"]["suffix_match"],
                }

            # Tibaq
            if r["tibaq"]["tibaq_found"]:
                style_flags["tibaq"] = True
                for pair in r["tibaq"]["pairs"]:
                    v_detail["tibaq_pairs"].append({
                        "words": pair["words"],
                        "spans": {
                            w: [{"word": w, "raw": s["raw"], "start": s["start"], "end": s["end"]}
                                for s in spans]
                            for w, spans in pair["spans"].items()
                        }
                    })

            # Muqabala
            if r["muqabala"]["muqabala_found"]:
                style_flags["muqabala"] = True
                v_detail["muqabala_pairs"] = r["muqabala"]["cross_hemistich_pairs"]

            # Jinas Tamm
            if r["jinas"]["jinas_tamm"]["found"]:
                style_flags["jinas_tamm"] = True
                for inst in r["jinas"]["jinas_tamm"]["instances"]:
                    v_detail["jinas_tamm"].append({
                        "word": inst["word"],
                        "spans": [{"word": inst["word"], "raw": s["raw"], "start": s["start"], "end": s["end"]}
                                  for s in inst["spans"]]
                    })

            # Jinas Naqis
            if r["jinas"]["jinas_naqis"]["found"]:
                style_flags["jinas_naqis"] = True
                for inst in r["jinas"]["jinas_naqis"]["instances"]:
                    v_detail["jinas_naqis"].append({
                        "word_a": inst["word_a"],
                        "word_b": inst["word_b"],
                        "similarity": inst["similarity"],
                        "spans": [{"word": s.get("word", ""), "raw": s["raw"], "start": s["start"], "end": s["end"]}
                                  for s in inst["spans"]]
                    })

            # Metaphor / Kinaya
            for flag in r["istara_kinaya"]["flags"]:
                if "isti'ara" in flag["label"]:
                    style_flags["istiara"] = True
                elif "kinaya" in flag["label"]:
                    style_flags["kinaya"] = True
                
                v_detail["metaphor_flags"].append({
                    "label": flag["label"],
                    "concept_words": flag["concept_words"],
                    "action_words": flag["action_words"],
                    "concept_spans": [{"word": s["word"], "raw": s.get("raw", s["word"]), "start": s["start"], "end": s["end"]}
                                      for s in flag["concept_spans"]],
                    "action_spans": [{"word": s["word"], "raw": s.get("raw", s["word"]), "start": s["start"], "end": s["end"]}
                                     for s in flag["action_spans"]],
                    "note": flag["note"],
                })

            verse_details.append(v_detail)

        # ── Aggregate rhyme ──
        rhyme = self._aggregate_rhyme(all_rawis)

        # ── Build flat figures list ──
        figures: List[str] = []
        if style_flags["tasri"]:
            figures.append("تصريع")
        if style_flags["tibaq"]:
            figures.append("طباق")
        if style_flags["muqabala"]:
            figures.append("مقابلة")
        if style_flags["jinas_tamm"]:
            figures.append("جناس تام")
        if style_flags["jinas_naqis"]:
            figures.append("جناس ناقص")
        if style_flags["istiara"]:
            figures.append("استعارة")
        if style_flags["kinaya"]:
            figures.append("كناية")

        return {
            "rawi": rhyme["rawi"],
            "rhyme_type": rhyme["type"],
            "style_figures": figures,
            "style_details": {
                "figures": figures,
                "verses": verse_details,
            },
            "verses_analyzed": len(self.verses),
            "verse_details": self.results,
        }

    def _aggregate_rhyme(self, rawis: List[str]) -> Dict[str, str]:
        if not rawis:
            return {"rawi": "؟", "type": "مرسلة"}
        
        poem_rawi = rawis[-1]
        unique = set(rawis)
        if len(unique) == 1:
            rhyme_type = "مطلقة"
        else:
            matching = sum(1 for r in rawis if r == poem_rawi)
            rhyme_type = "مطلقة" if (matching / len(rawis) >= 0.7) else "مرسلة"
        
        return {"rawi": poem_rawi, "type": rhyme_type}


def analyze_rhyme(text: str) -> Tuple[str, str]:
    detective = PoemDetective(text)
    result = detective.analyze()
    return result["rawi"], result["rhyme_type"]


def analyze_style(text: str) -> List[str]:
    detective = PoemDetective(text)
    result = detective.analyze()
    return result["style_figures"]


# NEW: Rich style analysis
def analyze_style_detailed(text: str) -> Dict[str, Any]:
    detective = PoemDetective(text)
    return detective.analyze()["style_details"]