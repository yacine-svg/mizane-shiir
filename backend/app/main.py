# backend/app/main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import PoemInput, AnalysisResult, EraResult
from app.services.meter import analyze_meter
from app.services.rhyme import analyze_rhyme
from app.services.theme import analyze_theme, analyze_theme_detailed
from app.services.style import analyze_style
from app.services.era import analyze_era
from app.services.poem_detective import analyze_style_detailed  # NEW

app = FastAPI(
    title="Arabic Poetry Analyzer",
    version="1.3.0",
    description="AI-powered Arabic poetry analysis: meter, rhyme, theme, era & style.",
)

# ... CORS, health checks same ...

@app.post("/analyze/era", response_model=EraResult)
async def analyze_era_only(
    poem: PoemInput,
    poet_name: str = Query(default="غير معروف", description="Poet name in Arabic")
):
    return analyze_era(poem.text, poet_name)

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_poem(
    poem: PoemInput,
    poet_name: str = Query(default="غير معروف", description="Poet name in Arabic")
):
    meter, tafilat, meter_details = analyze_meter(poem.text)
    rhyme_rawi, rhyme_type = analyze_rhyme(poem.text)

    # Theme analysis with confidence
    theme_result = analyze_theme_detailed(poem.text)
    theme = theme_result["theme"]
    theme_confidence = theme_result["confidence"]

    style_figures = analyze_style(poem.text)
    style_details = analyze_style_detailed(poem.text)  # NEW

    era_result = analyze_era(poem.text, poet_name)

    return {
        "meter": meter,
        "tafilat": tafilat,
        "theme": theme,
        "theme_confidence": theme_confidence,
        "era": era_result["era"],
        "era_confidence": era_result["confidence"],
        "rhyme_rawi": rhyme_rawi,
        "rhyme_type": rhyme_type,
        "style_figures": style_figures,
        "style_details": style_details,  # NEW
        "meter_details": meter_details.get("predictions", []),
        "verses_analyzed": meter_details.get("verses_analyzed", 0),
    }