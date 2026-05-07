'use client';

import { useState } from "react";
import { Loader2, Copy, Check, FileText, FileJson, Trash2, Sparkles, BookOpen, Feather } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// ── Types ───────────────────────────────────────────────────────────────────

interface WordSpan {
  word: string;
  raw: string;
  start: number;
  end: number;
}

interface JinasTammDetail {
  word: string;
  spans: WordSpan[];
}

interface JinasNaqisDetail {
  word_a: string;
  word_b: string;
  similarity: number;
  spans: WordSpan[];
}

interface TibaqPairDetail {
  words: string[];
  spans: Record<string, WordSpan[]>;
}

interface MuqabalaPairDetail {
  sadr_word: string;
  ajuz_word: string;
}

interface MetaphorFlagDetail {
  label: string;
  concept_words: string[];
  action_words: string[];
  concept_spans: WordSpan[];
  action_spans: WordSpan[];
  note: string;
}

interface TasriDetail {
  sadr_end_word: string;
  ajuz_end_word: string;
  rawi_match: boolean;
  suffix_match: boolean;
}

interface VerseStyleDetail {
  verse_index: number;
  sadr: string;
  ajuz: string;
  tasri: TasriDetail | null;
  tibaq_pairs: TibaqPairDetail[];
  muqabala_pairs: MuqabalaPairDetail[];
  jinas_tamm: JinasTammDetail[];
  jinas_naqis: JinasNaqisDetail[];
  metaphor_flags: MetaphorFlagDetail[];
}

interface StyleFiguresDetail {
  figures: string[];
  verses: VerseStyleDetail[];
}

interface AnalysisResult {
  meter: string;
  tafilat: string[];
  theme: string;
  era?: string;
  confidence?: number;
  rhyme_rawi: string;
  rhyme_type: string;
  style_figures: string[];
  style_details?: StyleFiguresDetail;
}

interface AnalyzeClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

// ── Components ──────────────────────────────────────────────────────────────

const ArabesqueDivider = ({ opacity = 0.2 }: { opacity?: number }) => (
  <svg viewBox="0 0 600 32" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', maxWidth: 480, display: 'block', margin: '0 auto', opacity }} aria-hidden>
    <g stroke="#c8922a" strokeWidth="0.75">
      <line x1="0" y1="16" x2="220" y2="16" />
      <line x1="380" y1="16" x2="600" y2="16" />
      <path d="M220 16 C240 4, 260 4, 280 16 C300 28, 320 28, 340 16 C360 4, 370 4, 380 16" />
      <circle cx="300" cy="16" r="2.8" fill="#c8922a" />
      <circle cx="250" cy="8" r="1" fill="#c8922a" />
      <circle cx="350" cy="8" r="1" fill="#c8922a" />
    </g>
  </svg>
);

const GeoPattern = () => (
  <div 
    className="absolute inset-0 pointer-events-none opacity-[0.03]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23c8922a' stroke-width='0.5'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z'/%3E%3Cpath d='M40 14 L66 40 L40 66 L14 40 Z'/%3E%3Ccircle cx='40' cy='40' r='10'/%3E%3C/g%3E%3C/svg%3E")`,
    }}
  />
);

const FigureBadge = ({ label, content }: { label: string; content: React.ReactNode }) => (
  <div style={{
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(200,146,42,0.05)',
    borderRadius: '8px',
    borderRight: '3px solid #c8922a',
  }}>
    <span style={{
      fontSize: '0.7rem',
      color: '#c8922a',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      padding: '0.2rem 0.5rem',
      background: 'rgba(200,146,42,0.1)',
      borderRadius: '4px',
      flexShrink: 0,
    }}>
      {label}
    </span>
    <div style={{
      fontSize: '0.9rem',
      color: '#f5edd8',
      lineHeight: 1.6,
    }}>
      {content}
    </div>
  </div>
);

const StyleDetailsPanel = ({ details }: { details?: StyleFiguresDetail }) => {
  if (!details || details.verses.length === 0) return null;

  const versesWithFigures = details.verses.filter(v => 
    v.tasri || 
    v.tibaq_pairs.length > 0 || 
    v.muqabala_pairs.length > 0 || 
    v.jinas_tamm.length > 0 || 
    v.jinas_naqis.length > 0 || 
    v.metaphor_flags.length > 0
  );

  if (versesWithFigures.length === 0) return null;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ 
        borderBottom: '1px solid rgba(200,146,42,0.2)', 
        paddingBottom: '0.75rem',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontFamily: "'Scheherazade New', serif",
          fontSize: '1.3rem',
          color: '#f5edd8',
          margin: 0,
        }}>
          تفاصيل الصور البلاغية
        </h3>
      </div>

      {versesWithFigures.map((verse, vIdx) => (
        <div key={vIdx} style={{
          background: 'rgba(14, 10, 5, 0.4)',
          border: '1px solid rgba(200,146,42,0.1)',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1rem',
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#c8922a',
            opacity: 0.6,
            marginBottom: '0.75rem',
            fontFamily: "'Noto Naskh Arabic', serif",
          }}>
            البيت {verse.verse_index + 1}
          </div>
          
          <div style={{
            fontFamily: "'Amiri', serif",
            fontSize: '1rem',
            color: '#f5edd8',
            opacity: 0.8,
            marginBottom: '1rem',
            lineHeight: 1.8,
          }} dir="rtl">
            {verse.sadr} <span style={{ color: '#c8922a', opacity: 0.4 }}>┃</span> {verse.ajuz}
          </div>

          {verse.tasri && (
            <FigureBadge 
              label="تصريع"
              content={
                <span>
                  تطابق الروي بين صدر البيت ({verse.tasri.sadr_end_word}) 
                  وعجزه ({verse.tasri.ajuz_end_word})
                </span>
              }
            />
          )}

          {verse.tibaq_pairs.map((pair, pIdx) => (
            <FigureBadge 
              key={`tibaq-${pIdx}`}
              label="طباق"
              content={
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    تضاد: <strong>{pair.words.join(" ↔ ")}</strong>
                  </div>
                  {Object.entries(pair.spans).map(([word, spans]) => (
                    <div key={word} style={{ 
                      fontSize: '0.85rem', 
                      color: '#c2b59b',
                      opacity: 0.7,
                      marginRight: '1rem'
                    }}>
                      &ldquo;{word}&rdquo;: {spans.map(s => s.raw).join(", ")}
                    </div>
                  ))}
                </div>
              }
            />
          ))}

          {verse.muqabala_pairs.map((pair, pIdx) => (
            <FigureBadge 
              key={`muqabala-${pIdx}`}
              label="مقابلة"
              content={
                <span>
                  تضاد عبر البيت: <strong>{pair.sadr_word}</strong> (الصدر) 
                  ↔ <strong>{pair.ajuz_word}</strong> (العجز)
                </span>
              }
            />
          ))}

          {verse.jinas_tamm.map((jinas, jIdx) => (
            <FigureBadge 
              key={`jt-${jIdx}`}
              label="جناس تام"
              content={
                <div>
                  تكرار: <strong>{jinas.word}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#c2b59b', opacity: 0.7, marginTop: '0.25rem' }}>
                    المواضع: {jinas.spans.map(s => `"${s.raw}"`).join(" • ")}
                  </div>
                </div>
              }
            />
          ))}

          {verse.jinas_naqis.map((jinas, jIdx) => (
            <FigureBadge 
              key={`jn-${jIdx}`}
              label="جناس ناقص"
              content={
                <div>
                  تشابه: <strong>{jinas.word_a}</strong> ↔ <strong>{jinas.word_b}</strong>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: '#c8922a',
                    marginRight: '0.5rem'
                  }}>
                    (تشابه {Math.round(jinas.similarity * 100)}%)
                  </span>
                  <div style={{ fontSize: '0.85rem', color: '#c2b59b', opacity: 0.7, marginTop: '0.25rem' }}>
                    المواضع: {jinas.spans.map(s => `"${s.raw}"`).join(" • ")}
                  </div>
                </div>
              }
            />
          ))}

          {verse.metaphor_flags.map((flag, fIdx) => (
            <FigureBadge 
              key={`meta-${fIdx}`}
              label={flag.label.includes("isti'ara") ? "استعارة" : "كناية"}
              content={
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>{flag.note}</div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: '#c8922a' }}>الصورة:</span> {flag.concept_words.join(", ")}
                    {" "}
                    <span style={{ color: '#c8922a' }}>الفعل:</span> {flag.action_words.join(", ")}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function AnalyzeClient({ user }: AnalyzeClientProps) {
  const [poemText, setPoemText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const analyzePoem = async () => {
    if (!poemText.trim()) {
      setError("الرجاء كتابة بيت أو قصيدة");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: poemText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل الاتصال بالخادم");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "تأكد أن الباك إند يعمل ثم حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    if (file.type === "application/json" || file.name.toLowerCase().endsWith(".json")) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.text) {
          setPoemText(parsed.text);
          setError("");
        } else {
          setError('ملف JSON يجب أن يحتوي على الحقل "text".');
        }
      } catch {
        setError("تعذّر قراءة ملف JSON، تأكد من أن التنسيق صحيح.");
      }
    } else {
      setPoemText(text);
      setError("");
    }

    e.target.value = "";
  };

  const clearText = () => {
    setPoemText("");
    setResult(null);
    setError("");
  };

  const copyResult = async () => {
    if (!result) return;

    const text = `البحر: ${result.meter}
التفعيلات: ${result.tafilat.join(" • ")}
الموضوع: ${result.theme}
العصر: ${result.era || "غير معروف"}
الروي: ${result.rhyme_rawi}
النوع: ${result.rhyme_type}
الصور البلاغية: ${result.style_figures?.join(" • ") || "غير متوفرة"}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("تم النسخ: " + text);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/signin";
  };

  return (
    <>
      <style>{`
        :root {
          --ink:        #0e0a05;
          --ink-mid:    #1a1008;
          --ink-light:  #201408;
          --parchment:  #f5edd8;
          --parchment-dim: #c2b59b;
          --gold:       #c8922a;
          --gold-light: #e8c876;
          --gold-muted: #9a6e22;
          --crimson:    #8b1a2a;
          --mist:       #c2b59b;
          --border:     rgba(200,146,42,0.14);
          --border-hover: rgba(200,146,42,0.32);
          --radius:     14px;
          --transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
        }

        .analyze-page {
          min-height: 100vh;
          background: 
            radial-gradient(ellipse 80% 50% at 50% -5%, rgba(200,146,42,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(139,26,42,0.04) 0%, transparent 55%),
            linear-gradient(180deg, #0e0a05 0%, #1a1008 50%, #0e0a05 100%);
          font-family: 'Noto Naskh Arabic', serif;
          position: relative;
          overflow-x: hidden;
        }

        .analyze-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          position: relative;
          z-index: 1;
        }

        .glass-card {
          background: rgba(26, 16, 8, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(200,146,42,0.15);
          border-radius: var(--radius);
          box-shadow: 
            0 4px 24px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .section-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .section-label {
          font-size: 0.7rem;
          color: var(--gold);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.7;
          margin-bottom: 0.8rem;
          display: block;
          font-family: 'Noto Naskh Arabic', serif;
        }

        .section-title {
          font-family: 'Scheherazade New', serif;
          font-size: clamp(2rem, 5vw, 2.8rem);
          color: var(--parchment);
          font-weight: 600;
          line-height: 1.3;
          margin-bottom: 0.5rem;
        }

        .section-subtitle {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.97rem;
          color: var(--mist);
          line-height: 1.95;
          opacity: 0.8;
          max-width: 500px;
          margin: 0 auto;
        }

        .input-card {
          padding: 2.5rem;
          margin-bottom: 2rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(200,146,42,0.1);
        }

        .header-content h1 {
          font-family: 'Scheherazade New', serif;
          font-size: clamp(1.8rem, 4vw, 2.4rem);
          color: var(--parchment);
          font-weight: 600;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .header-content p {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.95rem;
          color: var(--mist);
          opacity: 0.75;
          line-height: 1.8;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .btn-nav {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border: 1px solid rgba(200,146,42,0.3);
          border-radius: 8px;
          background: transparent;
          color: var(--parchment-dim);
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.85rem;
          text-decoration: none;
          transition: var(--transition);
          cursor: pointer;
        }

        .btn-nav:hover {
          border-color: var(--gold);
          color: var(--gold-light);
          background: rgba(200,146,42,0.08);
        }

        .controls-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .btn-control {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1rem;
          border: 1px solid rgba(200,146,42,0.25);
          border-radius: 8px;
          background: rgba(200,146,42,0.05);
          color: var(--parchment);
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-control:hover {
          background: rgba(200,146,42,0.12);
          border-color: rgba(200,146,42,0.4);
          transform: translateY(-1px);
        }

        .btn-control input {
          display: none;
        }

        .poem-textarea {
          width: 100%;
          min-height: 200px;
          padding: 1.25rem;
          background: rgba(14, 10, 5, 0.5);
          border: 1px solid rgba(200,146,42,0.2);
          border-radius: 10px;
          color: var(--parchment);
          font-family: 'Amiri', serif;
          font-size: 1.1rem;
          line-height: 2;
          resize: vertical;
          outline: none;
          transition: var(--transition);
        }

        .poem-textarea::placeholder {
          color: rgba(194, 181, 155, 0.4);
          font-style: italic;
        }

        .poem-textarea:hover {
          border-color: rgba(200,146,42,0.3);
          background: rgba(14, 10, 5, 0.6);
        }

        .poem-textarea:focus {
          border-color: var(--gold-muted);
          background: rgba(200,146,42,0.03);
          box-shadow: 0 0 0 3px rgba(200,146,42,0.08);
        }

        .action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1.5rem;
          align-items: center;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.85rem 2rem;
          background: linear-gradient(135deg, #d9a030 0%, #a37320 60%, #d9a030 100%);
          background-size: 200% auto;
          border: none;
          border-radius: 10px;
          color: var(--ink);
          font-family: 'Amiri', serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: 0 4px 18px rgba(200,146,42,0.28);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(200,146,42,0.4);
          background-position: right center;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 1px solid rgba(200,146,42,0.25);
          border-radius: 10px;
          color: var(--parchment);
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-secondary:hover {
          border-color: rgba(200,146,42,0.45);
          background: rgba(200,146,42,0.08);
          color: var(--gold-light);
        }

        .error-banner {
          margin-top: 1.25rem;
          padding: 0.9rem 1.25rem;
          border-radius: 8px;
          background: rgba(139, 26, 42, 0.15);
          border: 1px solid rgba(139, 26, 42, 0.3);
          color: #e57373;
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .results-card {
          padding: 2.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--mist);
          opacity: 0.6;
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 1rem;
        }

        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.3;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1px;
          background: rgba(200,146,42,0.12);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .result-cell {
          background: rgba(14, 10, 5, 0.7);
          padding: 1.5rem 1rem;
          text-align: center;
          transition: background 0.2s;
        }

        .result-cell:hover {
          background: rgba(200,146,42,0.05);
        }

        .result-label {
          font-size: 0.7rem;
          color: var(--gold);
          opacity: 0.6;
          margin-bottom: 0.6rem;
          letter-spacing: 0.05em;
          font-family: 'Noto Naskh Arabic', serif;
          text-transform: uppercase;
        }

        .result-value {
          font-family: 'Amiri', serif;
          font-size: 1.15rem;
          color: var(--parchment);
          font-weight: 600;
          line-height: 1.4;
        }

        .result-cell-wide {
          grid-column: 1 / -1;
          text-align: right;
          padding: 1.25rem 1.5rem;
        }

        .result-cell-wide .result-value {
          text-align: right;
          line-height: 1.8;
        }

        .btn-copy {
          width: 100%;
          padding: 0.9rem;
          background: rgba(200,146,42,0.08);
          border: 1px solid rgba(200,146,42,0.2);
          border-radius: 8px;
          color: var(--parchment);
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: var(--transition);
        }

        .btn-copy:hover {
          background: rgba(200,146,42,0.15);
          border-color: rgba(200,146,42,0.35);
        }

        .btn-copy.copied {
          background: rgba(200,146,42,0.2);
          color: var(--gold-light);
        }

        .verse-strip {
          position: fixed;
          right: 2rem;
          top: 50%;
          transform: translateY(-50%);
          writing-mode: vertical-rl;
          font-family: 'Amiri', serif;
          font-size: 0.7rem;
          color: var(--gold);
          opacity: 0.08;
          letter-spacing: 0.25em;
          user-select: none;
          white-space: nowrap;
          pointer-events: none;
          z-index: 0;
        }

        .glow-top {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(200,146,42,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }

        @media (max-width: 768px) {
          .analyze-container {
            padding: 1.5rem 1rem;
          }

          .input-card,
          .results-card {
            padding: 1.5rem;
          }

          .card-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            justify-content: flex-end;
          }

          .results-grid {
            grid-template-columns: 1fr;
          }

          .verse-strip {
            display: none;
          }
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(14, 10, 5, 0.3);
        }

        ::-webkit-scrollbar-thumb {
          background: var(--gold-muted);
          border-radius: 3px;
          opacity: 0.6;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--gold);
        }

        ::selection {
          background: rgba(200,146,42,0.3);
          color: var(--parchment);
        }
      `}</style>

      <div className="analyze-page">
        <GeoPattern />
        <div className="glow-top" />

        <div className="verse-strip" aria-hidden>
          وَمَنْ يَتَهَيَّبْ صُعُودَ الجِبَالِ يَعِشْ أَبَدَ الدَّهْرِ بَيْنَ الحُفَرْ
        </div>

        <div className="analyze-container">
          {/* Header */}
          <div className="section-header animate-fade-up">
            <span className="section-label">منصة التحليل</span>
            <h1 className="section-title">محلل القصائد المتقدم</h1>
            <p className="section-subtitle">
              اكتشف خبايا قصيدتك — البحر والقافية والبلاغة — في ثوانٍ معدودة
            </p>
            <div style={{ marginTop: '1.5rem' }}>
              <ArabesqueDivider opacity={0.25} />
            </div>
          </div>

          {/* Input Card */}
          <section className="glass-card input-card animate-fade-up stagger-1">
            <div className="card-header">
              <div className="header-content">
                <h1>
                  <Feather size={28} style={{ verticalAlign: 'middle', marginLeft: '0.5rem', color: '#c8922a' }} />
                  أدخل النص الشعري
                </h1>
                <p>رفع ملف، كتابة قصيدة، ثم تحليل فوري مع مخرجات مفصلة</p>
              </div>
              <div className="header-actions">
                <Link href="/" className="btn-nav">
                  ← العودة
                </Link>
                <button onClick={handleLogout} className="btn-nav">
                  خروج
                </button>
              </div>
            </div>

            <div className="controls-row">
              <label className="btn-control">
                <FileText size={16} />
                رفع .txt
                <input type="file" accept=".txt" onChange={handleFile} />
              </label>

              <label className="btn-control">
                <FileJson size={16} />
                رفع JSON
                <input type="file" accept=".json" onChange={handleFile} />
              </label>

              <button type="button" onClick={clearText} className="btn-control">
                <Trash2 size={16} />
                مسح النص
              </button>
            </div>

            <textarea
              value={poemText}
              onChange={(e) => setPoemText(e.target.value)}
              placeholder="أدخل بيت الشعر هنا أو الصق القصيدة بالكامل..."
              className="poem-textarea"
              dir="rtl"
            />

            <div className="action-row">
              <button
                onClick={analyzePoem}
                disabled={loading || !poemText.trim()}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    تحليل الآن
                  </>
                )}
              </button>

              {result && (
                <button onClick={() => setResult(null)} className="btn-secondary">
                  <Trash2 size={16} />
                  حذف النتيجة
                </button>
              )}
            </div>

            {error && (
              <div className="error-banner">
                <span>⚠</span>
                {error}
              </div>
            )}
          </section>

          {/* Results Card */}
          <section className="glass-card results-card animate-fade-up stagger-2">
            <div className="section-header" style={{ marginBottom: '2rem' }}>
              <span className="section-label">النتائج</span>
              <h2 className="section-title" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                <BookOpen size={24} style={{ verticalAlign: 'middle', marginLeft: '0.5rem', color: '#c8922a' }} />
                نتائج التحليل
              </h2>
            </div>

            {!result ? (
              <div className="empty-state">
                <div className="empty-state-icon">✦</div>
                <p>لا توجد بيانات بعد. ابدأ التحليل لعرض النتائج بشكل جميل.</p>
              </div>
            ) : (
              <>
                <div className="results-grid">
                  <div className="result-cell">
                    <div className="result-label">البحر</div>
                    <div className="result-value">{result.meter}</div>
                  </div>
                  <div className="result-cell">
                    <div className="result-label">الموضوع</div>
                    <div className="result-value">{result.theme}</div>
                  </div>
                  <div className="result-cell">
                    <div className="result-label">العصر</div>
                    <div className="result-value">{result.era || "غير معروف"}</div>
                  </div>
                  <div className="result-cell">
                    <div className="result-label">الروي</div>
                    <div className="result-value">{result.rhyme_rawi}</div>
                  </div>
                  <div className="result-cell">
                    <div className="result-label">نوع القافية</div>
                    <div className="result-value">{result.rhyme_type}</div>
                  </div>
                  <div className="result-cell result-cell-wide">
                    <div className="result-label">التفعيلات</div>
                    <div className="result-value" style={{ fontSize: '1.05rem' }}>
                      {result.tafilat.join(" • ")}
                    </div>
                  </div>
                  {result.style_figures && result.style_figures.length > 0 && (
                    <div className="result-cell result-cell-wide">
                      <div className="result-label">الصور البلاغية</div>
                      <div className="result-value" style={{ fontSize: '1.05rem' }}>
                        {result.style_figures.join(" • ")}
                      </div>
                    </div>
                  )}
                </div>

                {result.style_details && result.style_details.verses.length > 0 && (
                  <StyleDetailsPanel details={result.style_details} />
                )}

                <button
                  onClick={copyResult}
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      نسخ التفاصيل
                    </>
                  )}
                </button>
              </>
            )}
          </section>

          {/* Bottom flourish */}
          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <ArabesqueDivider opacity={0.15} />
            <p style={{ 
              marginTop: '1.5rem', 
              fontSize: '0.8rem', 
              color: '#c2b59b', 
              opacity: 0.4,
              fontFamily: "'Noto Naskh Arabic', serif"
            }}>
              ميزان الشعر — تحليل الشعر العربي بالذكاء الاصطناعي
            </p>
          </div>
        </div>
      </div>
    </>
  );
}