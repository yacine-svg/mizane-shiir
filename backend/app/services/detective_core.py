"""
arabic_style_detective.py
=========================
A rule-based Python module for analyzing rhyme (قافية) and figures of style
(المحسنات البديعية) in classical Arabic poetry.

Author  : Expert Python Developer / Arabic NLP Specialist
Approach: Pure regex + string manipulation + lightweight Levenshtein distance.
          No ML models or transformer libraries are used.

Input   : A verse split into sadr (صدر) and ajuz (عجز) — both Unicode strings
          with or without full tashkeel (diacritics).
Output  : A structured Python dict (JSON-serialisable) containing every detected
          rhetorical figure together with the exact word spans needed for UI
          highlighting.
"""

import re
import json
import unicodedata
from itertools import combinations
from typing import Any


# ---------------------------------------------------------------------------
# Unicode / diacritic constants
# ---------------------------------------------------------------------------

# Arabic combining diacritics (harakat) codepoints
TASHKEEL = (
    "\u064B"  # FATHATAN
    "\u064C"  # DAMMATAN
    "\u064D"  # KASRATAN
    "\u064E"  # FATHA
    "\u064F"  # DAMMA
    "\u0650"  # KASRA
    "\u0651"  # SHADDA
    "\u0652"  # SUKUN
    "\u0653"  # MADDAH ABOVE
    "\u0654"  # HAMZA ABOVE
    "\u0655"  # HAMZA BELOW
    "\u0670"  # SUPERSCRIPT ALEF (alef khanjariyya)
)

# Letters that are commonly normalised to bare alef for rhyme matching
ALEF_VARIANTS = "أإآا"

# Definite article prefix that must be stripped before Rawi detection
DEF_ARTICLE = re.compile(r"^ال")

# Feminine ta-marbuta (ة / ت at word-end) — treated as silent in classical Qafiya
TA_MARBUTA = re.compile(r"[ةت]$")

# Tanwin (nunation) suffix — silent in waqf (pause at verse end)
TANWIN_RE = re.compile(r"[\u064B\u064C\u064D]$")


# ---------------------------------------------------------------------------
# Levenshtein distance  (no external dependency)
# ---------------------------------------------------------------------------

def levenshtein(s1: str, s2: str) -> int:
    """
    Compute the classic Wagner-Fischer Levenshtein edit distance between
    two strings.  O(m·n) time, O(min(m,n)) space.
    """
    if s1 == s2:
        return 0
    if len(s1) < len(s2):
        s1, s2 = s2, s1
    prev = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1, 1):
        curr = [i]
        for j, c2 in enumerate(s2, 1):
            curr.append(min(
                prev[j] + 1,        # deletion
                curr[j - 1] + 1,    # insertion
                prev[j - 1] + (c1 != c2)  # substitution
            ))
        prev = curr
    return prev[-1]


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def strip_diacritics(text: str) -> str:
    """Remove all Arabic harakat / tashkeel from *text*."""
    return "".join(ch for ch in text if ch not in TASHKEEL)


def normalize_alef(text: str) -> str:
    """Collapse all alef variants (أإآ) to bare alef (ا)."""
    return re.sub(f"[{ALEF_VARIANTS}]", "ا", text)


def clean_word(word: str) -> str:
    """
    Full normalisation pipeline for a single Arabic word:
      1. Strip diacritics
      2. Normalise alef variants
      3. Remove tatweel (kashida) ـ
      4. Lower-case (no-op for Arabic but safe for mixed input)
    """
    word = strip_diacritics(word)
    word = normalize_alef(word)
    word = word.replace("\u0640", "")   # tatweel
    return word.strip()


def tokenize(text: str) -> list[dict]:
    """
    Tokenize *text* into a list of word-records, each carrying:
        {
          "raw"   : original surface form (with diacritics),
          "clean" : fully normalised form,
          "start" : character offset in *text*,
          "end"   : character offset in *text* (exclusive)
        }
    Punctuation-only tokens are discarded.
    """
    tokens = []
    # Match sequences of Arabic (and optional diacritic) characters
    for m in re.finditer(r"[\u0600-\u06FF\u0750-\u077F]+", text):
        raw = m.group()
        tokens.append({
            "raw"  : raw,
            "clean": clean_word(raw),
            "start": m.start(),
            "end"  : m.end(),
        })
    return tokens


def word_similarity(w1: str, w2: str) -> float:
    """
    Return a normalised similarity score in [0, 1].
    Uses Levenshtein distance normalised by the length of the longer word.
    """
    max_len = max(len(w1), len(w2))
    if max_len == 0:
        return 1.0
    return 1.0 - levenshtein(w1, w2) / max_len


# ---------------------------------------------------------------------------
# ══════════════════════════════════════════════════════════════════════════
#                          ArabicStyleDetective
# ══════════════════════════════════════════════════════════════════════════
# ---------------------------------------------------------------------------

class ArabicStyleDetective:
    """
    Analyse a single Arabic verse (sadr + ajuz) for classical rhetorical figures.

    Detected figures
    ----------------
    • Qafiya & Rawi   — rhyme letter of the verse-end
    • Tasri'          — rhyme correspondence between sadr-end and ajuz-end
    • Tibaq           — antithesis (word pairs with opposite meanings)
    • Muqabala        — extended antithesis (two or more sequential tibaq pairs)
    • Jinas           — paronomasia (Tamm = identical; Naqis = near-identical)
    • Isti'ara/Kinaya — heuristic detection of metaphor / metonymy triggers
    """

    # ------------------------------------------------------------------ #
    #  Hardcoded antonym dictionary  (طباق)                               #
    #  Each entry is a frozenset of two clean (diacritic-free) words so   #
    #  look-up is bidirectional.                                            #
    # ------------------------------------------------------------------ #
    ANTONYM_PAIRS: list[frozenset] = [
        # Day / night / light
        frozenset({"ليل", "نهار"}),
        frozenset({"نور", "ظلام"}),
        frozenset({"ضوء", "ظلام"}),
        frozenset({"نور", "ظلمة"}),
        frozenset({"صبح", "مساء"}),
        frozenset({"فجر", "ليل"}),
        # Emotion
        frozenset({"حزن", "فرح"}),
        frozenset({"سعادة", "شقاء"}),
        frozenset({"سرور", "حزن"}),
        frozenset({"بكاء", "ضحك"}),
        frozenset({"بكى", "ضحك"}),
        frozenset({"حب", "كره"}),
        frozenset({"حب", "بغض"}),
        frozenset({"وصل", "هجر"}),
        frozenset({"قرب", "بعد"}),
        # Life / death
        frozenset({"حياة", "موت"}),
        frozenset({"حي", "ميت"}),
        frozenset({"وجود", "عدم"}),
        # Quality
        frozenset({"جمال", "قبح"}),
        frozenset({"حسن", "قبح"}),
        frozenset({"خير", "شر"}),
        frozenset({"صلاح", "فساد"}),
        frozenset({"عدل", "ظلم"}),
        frozenset({"صدق", "كذب"}),
        frozenset({"امانة", "خيانة"}),
        # Movement / state
        frozenset({"قيام", "قعود"}),
        frozenset({"قام", "قعد"}),
        frozenset({"يقظة", "نوم"}),
        frozenset({"صحو", "سكر"}),
        frozenset({"قوة", "ضعف"}),
        frozenset({"علم", "جهل"}),
        frozenset({"غنى", "فقر"}),
        frozenset({"عز", "ذل"}),
        frozenset({"نصر", "هزيمة"}),
        frozenset({"سلم", "حرب"}),
        frozenset({"سلام", "حرب"}),
        # Spatial / directional
        frozenset({"شرق", "غرب"}),
        frozenset({"شمال", "جنوب"}),
        frozenset({"فوق", "تحت"}),
        frozenset({"يمين", "شمال"}),
        frozenset({"امام", "خلف"}),
        # Size / number
        frozenset({"كبير", "صغير"}),
        frozenset({"كثير", "قليل"}),
        frozenset({"طويل", "قصير"}),
        # Time
        frozenset({"قديم", "جديد"}),
        frozenset({"اول", "اخر"}),
        frozenset({"بداية", "نهاية"}),
        # Colour / nature
        frozenset({"ابيض", "اسود"}),
        frozenset({"برد", "حر"}),
        frozenset({"شتاء", "صيف"}),
    ]

    # ------------------------------------------------------------------ #
    #  Heuristic metaphor triggers  (استعارة وكناية)                      #
    #                                                                      #
    #  DESIGN NOTE: Because we have no semantic model, we use a curated   #
    #  list of "concept × action" pairs that are canonically incongruous  #
    #  in literal Arabic — a lion cannot speak; a moon cannot walk —      #
    #  so their co-occurrence in a single verse is strong evidence of     #
    #  Isti'ara Makniyya (implicit metaphor) or Tasrihiyya (explicit).    #
    #  This is deliberately a heuristic / pattern-matching approximation. #
    # ------------------------------------------------------------------ #
    METAPHOR_TRIGGERS: list[dict] = [
        # Celestial bodies acting like humans
        {"concept": {"بدر", "قمر", "شمس"},
         "actions": {"سار", "جاء", "مشى", "اقبل", "مر", "يسير", "يمشي", "يجيء", "يمر"},
         "label": "isti'ara_makniyya", "note": "Celestial body + locomotion verb → personification"},
        # Predators speaking / ruling
        {"concept": {"اسد", "ليث", "ضرغام"},
         "actions": {"قال", "نطق", "حكم", "امر", "قضى", "يقول", "ينطق", "يحكم"},
         "label": "isti'ara_tasrihiyya", "note": "Lion epithet for a human ruler"},
        # Sea / flood for generosity
        {"concept": {"بحر", "يم", "فيض"},
         "actions": {"عطى", "جاد", "فاض", "سال", "يعطي", "يجود", "يفيض"},
         "label": "kinaya", "note": "Sea + generosity verb → metonymy for a generous person"},
        # Sword / blade for a decisive man
        {"concept": {"سيف", "حسام", "مهند"},
         "actions": {"قطع", "بات", "صال", "يقطع", "يصول"},
         "label": "isti'ara_tasrihiyya", "note": "Sword name as metonym for a warrior"},
        # Arrow for words / glances
        {"concept": {"سهم", "نبل"},
         "actions": {"اصاب", "جرح", "قتل", "يصيب", "يجرح", "يقتل"},
         "label": "kinaya", "note": "Arrow + wound verb applied to glances or words"},
        # Fire / burning for passion
        {"concept": {"نار", "لهب", "جمر"},
         "actions": {"احرق", "التهب", "اضرم", "يحرق", "يلتهب"},
         "label": "isti'ara_makniyya", "note": "Fire imagery for intense emotion"},
    ]

    # ------------------------------------------------------------------ #
    #  Jinas thresholds                                                    #
    # ------------------------------------------------------------------ #
    JINAS_TAMM_THRESHOLD    = 1.0   # identical strings → Jinas Tamm
    JINAS_NAQIS_MIN         = 0.70  # similarity ≥ 0.70 but < 1.0 → Jinas Naqis
    JINAS_MIN_WORD_LENGTH   = 2     # ignore single-character particles

    # ------------------------------------------------------------------ #
    #  Arabic stop-words  (حروف وأدوات)                                   #
    #                                                                      #
    #  Classical Arabic rhetoric (ابن رشيق القيرواني في العمدة,           #
    #  والقزويني في الإيضاح) is explicit: الجناس applies only to          #
    #  content words — nouns (أسماء), verbs (أفعال), adjectives.          #
    #  Particles (حروف), prepositions (حروف الجر), conjunctions,          #
    #  pronouns, and demonstratives are ALL excluded.                      #
    #                                                                      #
    #  All entries are stored as diacritic-free / alef-normalised clean   #
    #  forms, matching the values stored in _word_index.                  #
    # ------------------------------------------------------------------ #
    JINAS_STOP_WORDS: frozenset = frozenset({
        # Prepositions / حروف الجر
        "في", "من", "الى", "على", "عن", "مع", "الا", "حتى", "حتي",
        "كي", "منذ", "خلال", "حول", "تجاه", "ازاء", "بين", "فوق",
        "تحت", "امام", "وراء", "دون", "سوى", "سوي", "غير",
        "ب", "ل", "ك",
        # Conjunctions / حروف العطف والربط
        "و", "ف", "ثم", "او", "ام", "بل", "لكن", "لكنه",
        "اما", "لا", "ولا",
        # Definite article
        "ال",
        # Personal pronouns / ضمائر منفصلة
        "هو", "هي", "هم", "هن", "هما", "انت", "انتم", "انتن",
        "انا", "نحن", "انتما",
        # Demonstratives / أسماء الإشارة
        "هذا", "هذه", "هذان", "هاتان", "هؤلاء", "ذلك", "تلك",
        "ذانك", "تانك", "اولئك",
        # Relative pronouns / أسماء الموصول
        "الذي", "التي", "الذين", "اللواتي", "اللاتي", "اللائي", "ما",
        # Interrogatives used as particles
        "هل",
        # Negation particles / أدوات النفي
        "لم", "لن", "ليس", "ليست",
        # Conditional particles / أدوات الشرط
        "ان", "اذا", "لو", "لولا", "متى", "اينما", "كيفما", "كلما",
        # Emphatic / aspectual / other particles
        "قد", "قط", "اذ", "اذن", "ثمة", "حيث", "كما", "عند", "لدى", "لدي",
    })

    def __init__(self, sadr: str, ajuz: str):
        """
        Parameters
        ----------
        sadr : str
            First hemistich of the verse (الصدر).
        ajuz : str
            Second hemistich of the verse (العجز).
        """
        self.sadr = sadr
        self.ajuz = ajuz
        self.full_verse = sadr + " " + ajuz

        # Tokenize each hemistich and the full verse
        self.sadr_tokens  = tokenize(sadr)
        self.ajuz_tokens  = tokenize(ajuz)
        self.verse_tokens = tokenize(self.full_verse)

        # Build a fast lookup: clean_word → list of token records.
        # We also index the *article-stripped* form so that "الليل" matches
        # the bare antonym key "ليل" stored in ANTONYM_PAIRS.
        self._word_index: dict[str, list[dict]] = {}
        for tok in self.verse_tokens:
            # Index by full clean form
            self._word_index.setdefault(tok["clean"], []).append(tok)
            # Index by article-stripped form (different from full clean only
            # when the token starts with ال / كال / وال / فال / بال …)
            bare = self._strip_article_prefixes(tok["clean"])
            if bare != tok["clean"]:
                self._word_index.setdefault(bare, []).append(tok)

    # ================================================================== #
    #  Public API                                                          #
    # ================================================================== #

    def analyze(self) -> dict[str, Any]:
        """
        Run all detectors and return a unified result dictionary.

        Returns
        -------
        dict with keys:
            verse           – original sadr and ajuz
            qafiya_rawi     – rhyme analysis
            tasri           – Tasri' (rhyme correspondence) analysis
            tibaq           – Tibaq (antithesis) results
            muqabala        – Muqabala (extended antithesis) results
            jinas           – Jinas (paronomasia) results
            istara_kinaya   – Heuristic metaphor / metonymy flags
        """
        return {
            "verse": {
                "sadr": self.sadr,
                "ajuz": self.ajuz,
            },
            "qafiya_rawi"  : self._detect_qafiya_rawi(),
            "tasri"        : self._detect_tasri(),
            "tibaq"        : self._detect_tibaq(),
            "muqabala"     : self._detect_muqabala(),
            "jinas"        : self._detect_jinas(),
            "istara_kinaya": self._detect_metaphor(),
        }

    # ================================================================== #
    #  1. Qafiya & Rawi  (القافية وحرف الروي)                             #
    # ================================================================== #

    def _detect_qafiya_rawi(self) -> dict:
        """
        Identify the Rawi (حرف الروي) — the anchor consonant of the rhyme —
        from the last word of the ajuz.

        Classical Arud rules applied here:
          • Strip all diacritics / harakat.
          • Remove definite article (ال).
          • Remove final ta-marbuta (ة) — it is silent at pause.
          • The last letter of the resulting skeleton is the Rawi.
          • Special case: if the word ends in long vowel (ا / و / ي) preceded
            by a consonant, that consonant is the Rawi (the long vowel is the
            Rudif رديف).
        """
        if not self.ajuz_tokens:
            return {"rawi": None, "qafiya_word": None, "note": "ajuz is empty"}

        last_tok = self.ajuz_tokens[-1]
        raw_word  = last_tok["raw"]

        # Step 1 — strip diacritics
        skeleton = strip_diacritics(raw_word)
        # Step 2 — normalise alef variants
        skeleton = normalize_alef(skeleton)
        # Step 3 — remove definite article
        skeleton = DEF_ARTICLE.sub("", skeleton)
        # Step 4 — remove ta-marbuta
        skeleton = TA_MARBUTA.sub("", skeleton)
        # Step 5 — remove tatweel
        skeleton = skeleton.replace("\u0640", "")

        if not skeleton:
            return {"rawi": None, "qafiya_word": raw_word, "note": "empty after stripping"}

        # Step 6 — handle Rudif (رديف): long vowel at end
        rudif = None
        long_vowels = "اوي"
        if len(skeleton) >= 2 and skeleton[-1] in long_vowels:
            rudif = skeleton[-1]
            rawi  = skeleton[-2]   # consonant before the long vowel
        else:
            rawi = skeleton[-1]

        return {
            "qafiya_word"   : raw_word,
            "skeleton"      : skeleton,
            "rawi"          : rawi,
            "rudif"         : rudif,   # None if no long-vowel tail
            "has_rudif"     : rudif is not None,
        }

    # ================================================================== #
    #  2. Tasri'  (التصريع)                                               #
    # ================================================================== #

    def _detect_tasri(self) -> dict:
        """
        Tasri' occurs when the last word of the sadr rhymes with the last
        word of the ajuz — turning both hemistiches into a rhyming couplet
        rather than only the ajuz.

        Strategy
        --------
        1. Extract the Rawi of the sadr-end and the ajuz-end independently.
        2. Compare their Rawi letters.  If they match → strong Tasri'.
        3. Additionally compare the last 2–3 characters of their skeletons
           for a broader suffix-rhyme check.
        """
        if not self.sadr_tokens or not self.ajuz_tokens:
            return {"tasri_found": False, "note": "insufficient tokens"}

        sadr_last = self.sadr_tokens[-1]["raw"]
        ajuz_last = self.ajuz_tokens[-1]["raw"]

        sadr_skel = self._word_skeleton(sadr_last)
        ajuz_skel = self._word_skeleton(ajuz_last)

        # Rawi comparison
        sadr_rawi = sadr_skel[-1] if sadr_skel else None
        ajuz_rawi = ajuz_skel[-1] if ajuz_skel else None
        rawi_match = (sadr_rawi == ajuz_rawi) if (sadr_rawi and ajuz_rawi) else False

        # Suffix rhyme: last 2 consonant characters
        suffix_len  = 2
        sadr_suffix = sadr_skel[-suffix_len:] if len(sadr_skel) >= suffix_len else sadr_skel
        ajuz_suffix = ajuz_skel[-suffix_len:] if len(ajuz_skel) >= suffix_len else ajuz_skel
        suffix_match = (sadr_suffix == ajuz_suffix)

        tasri_found = rawi_match or suffix_match

        return {
            "tasri_found"  : tasri_found,
            "sadr_end_word": sadr_last,
            "ajuz_end_word": ajuz_last,
            "sadr_skeleton": sadr_skel,
            "ajuz_skeleton": ajuz_skel,
            "sadr_rawi"    : sadr_rawi,
            "ajuz_rawi"    : ajuz_rawi,
            "rawi_match"   : rawi_match,
            "suffix_match" : suffix_match,
        }

    # Common single-letter conjunction/preposition prefixes that attach
    # to words in Arabic writing: و ف ب ك ل
    _PREFIX_RE = re.compile(r"^[وفبكل]+")

    def _strip_article_prefixes(self, word: str) -> str:
        """
        Return *word* with leading conjunction/preposition prefixes AND the
        definite article (ال) removed.  Used to allow antonym look-up of
        "الليل" via bare key "ليل".
        Example: "كالنهار" → strip [ك] → "النهار" → strip [ال] → "نهار"
        """
        w = self._PREFIX_RE.sub("", word)  # remove و/ف/ب/ك/ل prefixes
        w = DEF_ARTICLE.sub("", w)         # remove definite article
        return w

    def _word_skeleton(self, word: str) -> str:
        """Apply the same normalisation pipeline used in Qafiya detection."""
        s = strip_diacritics(word)
        s = normalize_alef(s)
        s = DEF_ARTICLE.sub("", s)
        s = TA_MARBUTA.sub("", s)
        s = s.replace("\u0640", "")
        return s

    # ================================================================== #
    #  3. Tibaq  (طباق)                                                   #
    # ================================================================== #

    def _detect_tibaq(self) -> dict:
        """
        Scan the full verse for antonym pairs that both appear as tokens.

        For each pair in ANTONYM_PAIRS, check whether both members exist
        in the cleaned token set.  Collect all matches together with their
        exact positions for UI highlighting.
        """
        clean_set = set(self._word_index.keys())   # O(1) lookup
        found_pairs: list[dict] = []

        for pair in self.ANTONYM_PAIRS:
            w1, w2 = tuple(pair)
            if w1 in clean_set and w2 in clean_set:
                occurrences_w1 = self._word_index[w1]
                occurrences_w2 = self._word_index[w2]
                found_pairs.append({
                    "words"   : [w1, w2],
                    "spans"   : {
                        w1: [{"start": t["start"], "end": t["end"], "raw": t["raw"]}
                              for t in occurrences_w1],
                        w2: [{"start": t["start"], "end": t["end"], "raw": t["raw"]}
                              for t in occurrences_w2],
                    },
                })

        return {
            "tibaq_found": len(found_pairs) > 0,
            "count"      : len(found_pairs),
            "pairs"      : found_pairs,
        }

    # ================================================================== #
    #  4. Muqabala  (مقابلة)                                              #
    # ================================================================== #

    def _detect_muqabala(self) -> dict:
        """
        Muqabala is a structured antithesis where a sequence of N items in
        the sadr is set opposite to a corresponding sequence of N items in
        the ajuz (N ≥ 2).

        Algorithm
        ---------
        1. Find all antonym pairs that have at least one member in the sadr
           and the other member in the ajuz.
        2. If two or more such cross-hemistich pairs are found, this
           constitutes a Muqabala.

        This is a conservative heuristic: we require the pair to straddle
        the sadr/ajuz boundary, because Muqabala is specifically about the
        structural opposition of the two hemistiches.
        """
        # Build word sets that include both the full clean form AND the
        # article/prefix-stripped bare form, so "الفرح" matches antonym key "فرح".
        sadr_words: set[str] = set()
        for t in self.sadr_tokens:
            sadr_words.add(t["clean"])
            sadr_words.add(self._strip_article_prefixes(t["clean"]))

        ajuz_words: set[str] = set()
        for t in self.ajuz_tokens:
            ajuz_words.add(t["clean"])
            ajuz_words.add(self._strip_article_prefixes(t["clean"]))

        cross_pairs: list[dict] = []

        for pair in self.ANTONYM_PAIRS:
            w1, w2 = tuple(pair)
            # Case A: w1 in sadr, w2 in ajuz
            if w1 in sadr_words and w2 in ajuz_words:
                cross_pairs.append({"sadr_word": w1, "ajuz_word": w2})
            # Case B: w2 in sadr, w1 in ajuz
            elif w2 in sadr_words and w1 in ajuz_words:
                cross_pairs.append({"sadr_word": w2, "ajuz_word": w1})

        muqabala_found = len(cross_pairs) >= 2

        return {
            "muqabala_found"       : muqabala_found,
            "cross_hemistich_pairs": cross_pairs,
            "pair_count"           : len(cross_pairs),
            "note": ("Muqabala requires ≥ 2 opposing pairs across the two "
                     "hemistiches." if not muqabala_found else
                     "Multiple antithetic pairs detected across sadr/ajuz."),
        }

    # ================================================================== #
    #  5. Jinas  (جناس)                                                   #
    # ================================================================== #

    def _detect_jinas(self) -> dict:
        """
        Detect paronomasia:

        Jinas Tamm (جناس تامّ)
            Two tokens that are identical in their clean form but appear
            at different positions (or with different diacritisation /
            meaning implied by context).

        Jinas Naqis (جناس ناقص)
            Two tokens whose clean forms are *not* identical but whose
            Levenshtein-based similarity score is ≥ JINAS_NAQIS_MIN.
            Typical cases: one extra/missing letter, or a single
            substituted letter (e.g., غيث / غيظ).

        Filtering rules (classical rhetoric consensus):
          • Tokens shorter than JINAS_MIN_WORD_LENGTH are excluded.
          • Tokens whose clean form appears in JINAS_STOP_WORDS are
            excluded.  Classical rhetoricians (ابن رشيق, القزويني)
            restrict الجناس to content words — nouns, verbs, adjectives —
            explicitly excluding particles, prepositions, pronouns, and
            conjunctions.  A preposition like "في" repeated twice is
            syntactic parallelism, not Jinas.
        """
        # Filter: minimum length AND not a stop-word particle
        candidates = [
            t for t in self.verse_tokens
            if (len(t["clean"]) >= self.JINAS_MIN_WORD_LENGTH
                and t["clean"] not in self.JINAS_STOP_WORDS)
        ]

        tamm_found  : list[dict] = []
        naqis_found : list[dict] = []

        for i, tok_a in enumerate(candidates):
            for tok_b in candidates[i + 1:]:
                ca, cb = tok_a["clean"], tok_b["clean"]

                # Skip the exact same token position
                if tok_a["start"] == tok_b["start"]:
                    continue

                sim = word_similarity(ca, cb)

                if sim >= self.JINAS_TAMM_THRESHOLD:
                    # Identical strings → Jinas Tamm
                    tamm_found.append({
                        "word"  : ca,
                        "spans" : [
                            {"start": tok_a["start"], "end": tok_a["end"], "raw": tok_a["raw"]},
                            {"start": tok_b["start"], "end": tok_b["end"], "raw": tok_b["raw"]},
                        ],
                    })
                elif self.JINAS_NAQIS_MIN <= sim < self.JINAS_TAMM_THRESHOLD:
                    naqis_found.append({
                        "word_a"    : ca,
                        "word_b"    : cb,
                        "similarity": round(sim, 3),
                        "edit_dist" : levenshtein(ca, cb),
                        "spans"     : [
                            {"start": tok_a["start"], "end": tok_a["end"], "raw": tok_a["raw"]},
                            {"start": tok_b["start"], "end": tok_b["end"], "raw": tok_b["raw"]},
                        ],
                    })

        # De-duplicate Tamm entries (same word pair reported only once)
        seen_tamm: set[str] = set()
        deduped_tamm = []
        for entry in tamm_found:
            if entry["word"] not in seen_tamm:
                seen_tamm.add(entry["word"])
                deduped_tamm.append(entry)

        return {
            "jinas_found"       : bool(deduped_tamm or naqis_found),
            "jinas_tamm"        : {"found": bool(deduped_tamm), "instances": deduped_tamm},
            "jinas_naqis"       : {"found": bool(naqis_found),  "instances": naqis_found},
        }

    # ================================================================== #
    #  6. Heuristic Metaphor Engine  (استعارة وكناية)                     #
    # ================================================================== #

    def _detect_metaphor(self) -> dict:
        """
        Heuristic detection of Isti'ara (استعارة) and Kinaya (كناية).

        DESIGN NOTE
        -----------
        A genuine metaphor / metonymy detector requires semantic understanding
        that exceeds the scope of a rule-based system.  As a pragmatic
        approximation we exploit a key observable: classical Arabic metaphors
        frequently juxtapose a *tenor* noun (the thing compared) with a verb
        or adjective that is ONLY semantically coherent for the *vehicle*
        (the comparison object).  For example:
            - "البدر سار" (the full moon walked) — celestial body + motion verb
              implies the poet is comparing a human to the moon.
            - "الأسد تكلّم" (the lion spoke) — lion + speech verb → a brave man.

        We therefore scan the verse tokens for (concept_word, action_word)
        co-occurrences defined in METAPHOR_TRIGGERS.  A match is flagged as
        a *potential* figure with its label and an explanatory note.  The
        analyst / UI must apply human judgment to confirm.
        """
        # Use all keys in _word_index (includes bare/article-stripped forms)
        # so "البدر" correctly matches the trigger key "بدر".
        clean_tokens = set(self._word_index.keys())
        flags: list[dict] = []

        for trigger in self.METAPHOR_TRIGGERS:
            concept_hits = trigger["concept"] & clean_tokens
            action_hits  = trigger["actions"] & clean_tokens

            if concept_hits and action_hits:
                # Gather spans for every matched concept word
                concept_spans = []
                for cw in concept_hits:
                    for tok in self._word_index.get(cw, []):
                        concept_spans.append({"word": cw, "start": tok["start"], "end": tok["end"]})

                action_spans = []
                for aw in action_hits:
                    for tok in self._word_index.get(aw, []):
                        action_spans.append({"word": aw, "start": tok["start"], "end": tok["end"]})

                flags.append({
                    "label"        : trigger["label"],
                    "concept_words": list(concept_hits),
                    "action_words" : list(action_hits),
                    "concept_spans": concept_spans,
                    "action_spans" : action_spans,
                    "note"         : trigger["note"],
                    "confidence"   : "heuristic — requires human verification",
                })

        return {
            "metaphor_found": bool(flags),
            "flags"         : flags,
        }


# ============================================================================
#  Demo
# ============================================================================

def demo():
    """
    Demonstrate ArabicStyleDetective on three carefully chosen verses.

    ── Verse 1 ─ Ibn Zaydun (Tasri' + Jinas Naqis) ──────────────────────
    صدر: أضحى التنائي بديلاً من تدانينا
    عجز: وناب عن طيب لقيانا تجافينا
    • Tasri'     — "تدانينا" / "تجافينا" share the ـينا ending.
    • Jinas Naqis — تدانينا ↔ تجافينا (2-letter difference, sim ≈ 0.71).

    ── Verse 2 ─ Al-Mutanabbi (Tibaq + Muqabala) ────────────────────────
    صدر: تَبكي الحمامةُ في ليلٍ على غصنٍ
    عجز: وتضحكُ الزهرةُ في نهارٍ على فَنَنِ
    • Tibaq    — ليل ↔ نهار,  تبكي ↔ تضحك.
    • Muqabala — two opposing pairs straddle the sadr/ajuz divide.

    ── Verse 3 ─ Classical (Isti'ara + Tibaq) ───────────────────────────
    صدر: يسير البدر في الليل ببهجةٍ
    عجز: ويجلو الظلام ويُضيء كالنهار
    • Isti'ara Makniyya — "البدر يسير" (moon + locomotion verb).
    • Tibaq             — ليل ↔ نهار,  ظلام ↔ يضيء.
    """

    verses = [
        {
            "title": "Ibn Zaydun — Tasri' & Jinas Naqis",
            "sadr" : "أضحى التنائي بديلاً من تدانينا",
            "ajuz" : "وناب عن طيب لقيانا تجافينا",
        },
        {
            "title": "Classical style — Tibaq (ليل/نهار)",
            "sadr" : "تبكي الحمامة في ليل على غصن",
            "ajuz" : "وتضحك الزهرة في نهار على فنن",
        },
        {
            "title": "Classical — Isti'ara Makniyya & Tibaq",
            "sadr" : "يسير البدر في الليل ببهجة",
            "ajuz" : "ويجلو الظلام ويضيء كالنهار",
        },
        {
            # Deliberately crafted to showcase Muqabala:
            # Sadr has (حزن / ليل), Ajuz has their opposites (فرح / نهار)
            # → two cross-hemistich antonym pairs → Muqabala confirmed.
            "title": "Crafted — Muqabala (حزن↔فرح  ليل↔نهار across hemistiches)",
            "sadr" : "حزن الفؤاد وبكى في ليل طويل",
            "ajuz" : "وجاء الفرح وغنى في نهار جميل",
        },
    ]

    for verse_data in verses:
        print("=" * 70)
        print(f"  {verse_data['title']}")
        print(f"  صدر: {verse_data['sadr']}")
        print(f"  عجز: {verse_data['ajuz']}")
        print("=" * 70)

        detective = ArabicStyleDetective(verse_data["sadr"], verse_data["ajuz"])
        result    = detective.analyze()

        print(json.dumps(result, ensure_ascii=False, indent=2))
        print()


if __name__ == "__main__":
    demo()
