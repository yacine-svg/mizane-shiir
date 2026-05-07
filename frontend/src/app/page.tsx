'use client';

import Link from 'next/link';
import React from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   SVG ICONS
───────────────────────────────────────────────────────────────────────────── */
const IconMeter   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
const IconTarget  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconRhyme   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconSparkle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconWave    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconPen     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconArrow   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

/* ─────────────────────────────────────────────────────────────────────────────
   ARABESQUE DIVIDER
───────────────────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */
const features = [
  { icon: <IconMeter />,   glyph: '◈', title: 'كشف البحر',          desc: 'تحديد دقيق للبحر الشعري من بين ستة عشر بحراً كلاسيكياً وفق منظومة الخليل بن أحمد الفراهيدي.' },
  { icon: <IconTarget />,  glyph: '◇', title: 'تحديد الغرض',         desc: 'كشف موضوع القصيدة والغرض الشعري — مدح، رثاء، غزل، حكمة — بدقة عالية.' },
  { icon: <IconRhyme />,   glyph: '◆', title: 'تحليل القافية',        desc: 'استخراج حرف الروي وتصنيف القافية تلقائياً مع التحليل الصوتي الكامل.' },
  { icon: <IconSparkle />, glyph: '◉', title: 'المحسنات البديعية',   desc: 'اكتشاف الطباق والجناس والسجع والتشبيه وسائر الأساليب البلاغية في النص.' },
  { icon: <IconWave />,    glyph: '◈', title: 'تحليل التفعيلات',      desc: 'تفصيل دقيق لكل تفعيلة مع الإيقاع الموسيقي الكامل للقصيدة شطراً شطراً.' },
  { icon: <IconPen />,     glyph: '◇', title: 'الأسلوب والأسلوبية',  desc: 'تحليل البصمة الأسلوبية للشاعر ودرجة التعقيد والعمق الجمالي للنص الشعري.' },
];

const steps = [
  { n: '١', title: 'أدخل النص',       detail: 'الصق قصيدتك أو أبياتك مباشرة — بيتٌ واحد أو قصيدة كاملة، يقرأها النظام على الفور.' },
  { n: '٢', title: 'المعالجة الذكية', detail: 'تعمل نماذج الذكاء الاصطناعي المُدرَّبة على تحليل البنية العروضية والبلاغية في ثوانٍ.' },
  { n: '٣', title: 'استكشف النتائج',  detail: 'استعرض تقريراً شاملاً لكل أبعاد القصيدة — لغةً وإيقاعاً وبلاغةً وأسلوباً.' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Scheherazade+New:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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
          --border-hv:  rgba(200,146,42,0.32);
          --radius:     14px;
          --transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
        }

        html { direction: rtl; scroll-behavior: smooth; }
        body {
          font-family: 'Noto Naskh Arabic', 'Amiri', serif;
          background: var(--ink);
          color: var(--parchment);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ── Geo tile bg ── */
        .geo-bg {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23c8922a' stroke-width='0.3' stroke-opacity='0.055'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z'/%3E%3Cpath d='M40 14 L66 40 L40 66 L14 40 Z'/%3E%3Ccircle cx='40' cy='40' r='10'/%3E%3C/g%3E%3C/svg%3E");
        }

        /* ── NAV ── */
        .nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(14,10,5,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-inner {
          max-width: 1120px; margin: 0 auto;
          padding: 0 2rem; height: 62px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-brand {
          display: flex; align-items: center; gap: 0.55rem;
          text-decoration: none;
        }
        .nav-brand-glyph { color: var(--gold); font-size: 0.95rem; opacity: 0.65; }
        .nav-brand-name {
          font-family: 'Amiri', serif;
          font-size: 1.35rem; color: var(--gold); font-weight: 700;
        }
        .nav-links { display: flex; align-items: center; gap: 1.5rem; }
        .nav-link {
          font-size: 0.88rem; color: var(--mist);
          text-decoration: none; transition: color 0.2s;
          font-family: 'Noto Naskh Arabic', serif;
        }
        .nav-link:hover { color: var(--gold-light); }
        .nav-cta {
          font-size: 0.88rem; color: var(--ink); font-weight: 700;
          font-family: 'Noto Naskh Arabic', serif;
          background: linear-gradient(135deg, #d9a030 0%, #a37320 100%);
          padding: 0.42rem 1.15rem; border-radius: 8px;
          text-decoration: none;
          box-shadow: 0 2px 14px rgba(200,146,42,0.2);
          transition: opacity 0.2s, transform 0.15s;
          display: inline-block;
        }
        .nav-cta:hover { opacity: 0.88; transform: translateY(-1px); }

        /* ── SECTION COMMON ── */
        .section-label {
          font-size: 0.7rem; color: var(--gold);
          letter-spacing: 0.16em; text-transform: uppercase;
          opacity: 0.7; margin-bottom: 0.8rem;
          font-family: 'Noto Naskh Arabic', serif;
          display: block;
        }
        .section-h2 {
          font-family: 'Amiri', serif;
          font-size: clamp(1.85rem, 4vw, 2.7rem);
          color: var(--parchment); font-weight: 700;
          line-height: 1.25; margin-bottom: 0.7rem;
        }
        .section-sub {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.97rem; color: var(--mist);
          line-height: 1.95; opacity: 0.8;
        }
        .container { max-width: 1100px; margin: 0 auto; }
        .container-md { max-width: 820px; margin: 0 auto; }
        .container-sm { max-width: 640px; margin: 0 auto; }

        /* ── HERO ── */
        .hero {
          position: relative;
          padding: 8rem 2rem 7rem;
          background-color: var(--ink);
          overflow: hidden;
          text-align: center;
        }
        .hero-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 70% 50% at 50% -5%, rgba(200,146,42,0.14) 0%, transparent 65%);
        }
        .hero-edge-l, .hero-edge-r {
          position: absolute; top: 0; bottom: 0; width: 2px;
          background: linear-gradient(to bottom, transparent, rgba(200,146,42,0.28) 30%, rgba(200,146,42,0.28) 70%, transparent);
        }
        .hero-edge-l { left: 0; }
        .hero-edge-r { right: 0; }
        .hero-verse-strip {
          position: absolute; left: 1.5rem; top: 50%; transform: translateY(-50%);
          writing-mode: vertical-rl;
          font-family: 'Amiri', serif; font-size: 0.68rem;
          color: var(--gold); opacity: 0.12;
          letter-spacing: 0.22em; user-select: none; white-space: nowrap;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.36rem 1rem; border-radius: 100px;
          border: 1px solid rgba(200,146,42,0.25);
          background: rgba(200,146,42,0.06);
          margin-bottom: 2rem;
          font-size: 0.78rem; color: var(--gold);
          font-family: 'Noto Naskh Arabic', serif;
        }
        .hero-badge-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--gold); box-shadow: 0 0 6px var(--gold);
          flex-shrink: 0;
        }
        .hero-title {
          font-family: 'Amiri', serif;
          font-size: clamp(4rem, 11vw, 7rem);
          font-weight: 700; color: var(--parchment);
          line-height: 1.05; margin-bottom: 0.6rem;
        }
        .hero-tagline {
          font-family: 'Amiri', serif;
          font-size: clamp(1.1rem, 2.6vw, 1.5rem);
          color: var(--gold); font-style: italic;
          opacity: 0.8; margin-bottom: 1rem; line-height: 1.75;
        }
        .hero-desc {
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 1rem; color: var(--mist);
          line-height: 2; opacity: 0.8;
          max-width: 500px; margin: 0 auto 2rem;
        }
        .hero-ctas {
          display: flex; gap: 0.9rem;
          justify-content: center; flex-wrap: wrap;
          margin-bottom: 3.5rem;
        }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.55rem;
          padding: 0.85rem 2rem;
          background: linear-gradient(135deg, #d9a030 0%, #a37320 60%, #d9a030 100%);
          background-size: 200% auto;
          color: var(--ink); font-weight: 700; font-size: 0.97rem;
          font-family: 'Noto Naskh Arabic', serif;
          border-radius: var(--radius); text-decoration: none;
          box-shadow: 0 5px 24px rgba(200,146,42,0.28), inset 0 1px 0 rgba(255,255,255,0.14);
          transition: transform 0.18s, box-shadow 0.2s;
          border: none; cursor: pointer;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 9px 32px rgba(200,146,42,0.42), inset 0 1px 0 rgba(255,255,255,0.14);
        }
        .btn-primary:active { transform: translateY(0); }

        .btn-secondary {
          display: inline-flex; align-items: center; gap: 0.55rem;
          padding: 0.85rem 1.75rem;
          background: transparent;
          color: var(--parchment); font-weight: 500; font-size: 0.97rem;
          font-family: 'Noto Naskh Arabic', serif;
          border-radius: var(--radius); text-decoration: none;
          border: 1px solid rgba(200,146,42,0.26);
          transition: border-color 0.2s, background 0.2s, color 0.2s;
        }
        .btn-secondary:hover {
          border-color: rgba(200,146,42,0.5);
          background: rgba(200,146,42,0.07);
          color: var(--gold-light);
        }

        /* Stats */
        .stats-row {
          display: flex; justify-content: center;
          gap: 3rem; flex-wrap: wrap;
          padding: 1.75rem 2.5rem;
          border: 1px solid rgba(200,146,42,0.12);
          border-radius: var(--radius);
          background: rgba(200,146,42,0.03);
          backdrop-filter: blur(8px);
          max-width: 540px; margin: 0 auto;
        }
        .stat-item { text-align: center; }
        .stat-val {
          font-family: 'Amiri', serif;
          font-size: 1.8rem; font-weight: 700;
          color: var(--gold); line-height: 1; margin-bottom: 0.25rem;
        }
        .stat-label {
          font-size: 0.78rem; color: var(--mist);
          opacity: 0.65; font-family: 'Noto Naskh Arabic', serif;
        }

        /* ── FEATURES ── */
        .features-section {
          padding: 7rem 2rem;
          background: var(--ink-mid);
        }
        .features-header { text-align: center; margin-bottom: 4rem; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1px;
          background: rgba(200,146,42,0.09);
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid rgba(200,146,42,0.12);
        }
        .feature-card {
          background: var(--ink-mid);
          padding: 2.1rem 1.8rem;
          transition: background 0.25s;
          cursor: default;
        }
        .feature-card:hover { background: rgba(200,146,42,0.05); }
        .feature-icon-wrap {
          display: flex; align-items: center; gap: 0.65rem;
          margin-bottom: 1rem;
        }
        .feature-glyph {
          font-size: 0.95rem; color: var(--gold); opacity: 0.55;
          line-height: 1; flex-shrink: 0;
        }
        .feature-icon { color: var(--gold); opacity: 0.8; }
        .feature-title {
          font-family: 'Amiri', serif;
          font-size: 1.15rem; color: var(--parchment);
          font-weight: 700; margin-bottom: 0.55rem;
        }
        .feature-desc {
          font-size: 0.88rem; color: var(--mist);
          line-height: 1.9; opacity: 0.75;
          font-family: 'Noto Naskh Arabic', serif;
        }

        /* ── HOW IT WORKS ── */
        .how-section { padding: 7rem 2rem; background: var(--ink); }
        .how-header { text-align: center; margin-bottom: 4rem; }
        .steps-list { display: flex; flex-direction: column; }
        .step-row {
          display: flex; gap: 2rem; align-items: flex-start;
          padding: 2.2rem 0;
        }
        .step-row + .step-row {
          border-top: 1px solid rgba(200,146,42,0.09);
        }
        .step-num {
          min-width: 50px; height: 50px; border-radius: 50%;
          border: 1px solid rgba(200,146,42,0.28);
          background: rgba(200,146,42,0.05);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Amiri', serif; font-size: 1.35rem;
          color: var(--gold); font-weight: 700; flex-shrink: 0;
        }
        .step-content { padding-top: 0.5rem; }
        .step-title {
          font-family: 'Amiri', serif;
          font-size: 1.2rem; color: var(--parchment);
          font-weight: 700; margin-bottom: 0.45rem;
        }
        .step-detail {
          font-size: 0.92rem; color: var(--mist);
          line-height: 1.9; opacity: 0.75;
          font-family: 'Noto Naskh Arabic', serif;
        }

        /* Demo card */
        .demo-card {
          margin-top: 4rem;
          border-radius: var(--radius);
          border: 1px solid rgba(200,146,42,0.16);
          overflow: hidden;
          background: rgba(200,146,42,0.025);
        }
        .demo-card-header {
          padding: 0.8rem 1.5rem;
          border-bottom: 1px solid rgba(200,146,42,0.1);
          display: flex; align-items: center; gap: 0.55rem;
          background: rgba(200,146,42,0.04);
        }
        .demo-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(200,146,42,0.38); }
        .demo-label {
          font-size: 0.75rem; color: var(--mist); opacity: 0.5;
          font-family: 'Noto Naskh Arabic', serif;
        }
        .demo-verse {
          padding: 2.2rem 2rem 1.75rem;
          text-align: center;
          border-bottom: 1px solid rgba(200,146,42,0.09);
          position: relative;
        }
        .demo-verse-ornament {
          position: absolute; top: 1rem; right: 1rem;
          color: var(--gold); opacity: 0.18;
          font-size: 1rem; font-family: 'Amiri', serif;
        }
        .demo-verse-ornament-l {
          position: absolute; top: 1rem; left: 1rem;
          color: var(--gold); opacity: 0.18;
          font-size: 1rem; font-family: 'Amiri', serif;
          transform: scaleX(-1); display: inline-block;
        }
        .demo-verse-text {
          font-family: 'Amiri', serif;
          font-size: clamp(1.1rem, 2.6vw, 1.45rem);
          color: var(--parchment); line-height: 2.1;
        }
        .demo-verse-author {
          font-size: 0.76rem; color: var(--gold);
          opacity: 0.55; margin-top: 0.65rem;
          font-family: 'Noto Naskh Arabic', serif;
        }
        .demo-results {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: rgba(200,146,42,0.09);
        }
        .demo-result-cell {
          background: var(--ink); padding: 1.2rem 0.6rem; text-align: center;
        }
        .demo-result-key {
          font-size: 0.68rem; color: var(--gold); opacity: 0.55;
          margin-bottom: 0.4rem; letter-spacing: 0.05em;
          font-family: 'Noto Naskh Arabic', serif;
        }
        .demo-result-val {
          font-family: 'Amiri', serif;
          font-size: 1rem; color: var(--parchment); font-weight: 600;
        }

        /* ── ABOUT ── */
        .about-section {
          padding: 7rem 2rem;
          background: var(--ink-light);
          position: relative; overflow: hidden;
        }
        .about-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 55% 50% at 80% 50%, rgba(200,146,42,0.06) 0%, transparent 65%);
        }
        .about-header { margin-bottom: 3.5rem; }
        .about-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.25rem;
          margin-top: 2.5rem;
        }
        .about-card {
          border: 1px solid rgba(200,146,42,0.14);
          border-radius: var(--radius);
          padding: 2.1rem 1.9rem;
          background: rgba(14,10,5,0.5);
          backdrop-filter: blur(6px);
          position: relative; overflow: hidden;
          transition: border-color 0.25s;
        }
        .about-card:hover { border-color: rgba(200,146,42,0.35); }
        .about-card-letter {
          position: absolute; top: 1rem; left: 1.2rem;
          font-family: 'Amiri', serif; font-size: 2.8rem;
          color: var(--gold); opacity: 0.07; line-height: 1; user-select: none;
        }
        .about-card-title {
          font-family: 'Amiri', serif;
          font-size: 1.2rem; color: var(--gold);
          font-weight: 700; margin-bottom: 0.9rem;
        }
        .about-card-text {
          font-size: 0.93rem; color: var(--mist);
          line-height: 2; opacity: 0.8;
          font-family: 'Noto Naskh Arabic', serif;
        }
        .tech-badges {
          display: flex; flex-wrap: wrap; gap: 0.55rem;
          margin-top: 2.25rem;
        }
        .tech-badge {
          padding: 0.3rem 0.85rem; border-radius: 100px;
          border: 1px solid rgba(200,146,42,0.2);
          background: rgba(200,146,42,0.055);
          font-size: 0.78rem; color: var(--gold);
          font-family: 'Noto Naskh Arabic', serif;
        }
        .tech-badge-dim {
          padding: 0.3rem 0.85rem; border-radius: 100px;
          border: 1px solid rgba(200,146,42,0.09);
          font-size: 0.78rem; color: var(--mist);
          opacity: 0.45; font-family: 'Noto Naskh Arabic', serif;
        }

        /* ── QUOTE BREAK ── */
        .quote-section {
          padding: 5.5rem 2rem;
          background: var(--ink-mid);
          text-align: center; position: relative; overflow: hidden;
        }
        .quote-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(200,146,42,0.06) 0%, transparent 70%);
        }
        .quote-text {
          font-family: 'Amiri', serif;
          font-size: clamp(1.25rem, 3vw, 1.9rem);
          color: var(--parchment); line-height: 1.95;
          margin: 2.5rem 0 1.25rem; font-style: italic;
        }
        .quote-cite {
          font-size: 0.85rem; color: var(--gold);
          opacity: 0.55; font-style: normal;
          font-family: 'Noto Naskh Arabic', serif;
        }

        /* ── FINAL CTA ── */
        .cta-section {
          padding: 8rem 2rem;
          background: var(--ink);
          text-align: center; position: relative; overflow: hidden;
        }
        .cta-glow-bottom {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 65% 55% at 50% 110%, rgba(200,146,42,0.11) 0%, transparent 60%);
        }
        .cta-verse-strip {
          position: absolute; right: 2rem; top: 50%; transform: translateY(-50%);
          writing-mode: vertical-rl;
          font-family: 'Amiri', serif; font-size: 0.68rem;
          color: var(--gold); opacity: 0.1;
          letter-spacing: 0.22em; user-select: none; white-space: nowrap;
        }
        .cta-h2 {
          font-family: 'Amiri', serif;
          font-size: clamp(2.3rem, 6vw, 3.5rem);
          color: var(--parchment); font-weight: 700;
          line-height: 1.2; margin-bottom: 1rem;
        }
        .cta-sub {
          font-size: 0.97rem; color: var(--mist);
          line-height: 2; opacity: 0.75;
          max-width: 440px; margin: 0 auto 1.75rem;
          font-family: 'Noto Naskh Arabic', serif;
        }
        .cta-buttons {
          display: flex; gap: 0.9rem;
          justify-content: center; flex-wrap: wrap;
        }

        /* ── FOOTER ── */
        .footer {
          background: #07040200;
          border-top: 1px solid rgba(200,146,42,0.1);
          padding: 2rem 2rem;
          background-color: #070402;
        }
        .footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .footer-brand {
          display: flex; align-items: center; gap: 0.5rem; text-decoration: none;
        }
        .footer-brand-glyph { color: var(--gold); opacity: 0.45; font-size: 0.85rem; }
        .footer-brand-name {
          font-family: 'Amiri', serif;
          font-size: 1rem; color: var(--gold); opacity: 0.6;
        }
        .footer-links { display: flex; gap: 1.75rem; }
        .footer-link {
          font-size: 0.82rem; color: var(--mist);
          text-decoration: none; opacity: 0.45;
          font-family: 'Noto Naskh Arabic', serif;
          transition: opacity 0.2s;
        }
        .footer-link:hover { opacity: 0.85; }
        .footer-copy {
          font-size: 0.74rem; color: var(--mist);
          opacity: 0.3; font-family: 'Noto Naskh Arabic', serif;
        }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(14,10,5,0.5); }
        ::-webkit-scrollbar-thumb { background: var(--gold-muted); border-radius: 2px; opacity: 0.6; }
        ::selection { background: rgba(200,146,42,0.28); color: var(--parchment); }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <div dir="rtl">

        {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="nav-brand">
              <span className="nav-brand-glyph">✦</span>
              <span className="nav-brand-name">ميزان الشعر</span>
            </Link>
            <div className="nav-links">
              <Link href="/analyze" className="nav-link">التحليل</Link>
              <Link href="/signin" className="nav-cta">دخول</Link>
            </div>
          </div>
        </nav>

        {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
        <section className="hero geo-bg">
          <div className="hero-glow" aria-hidden />
          <div className="hero-edge-l" aria-hidden />
          <div className="hero-edge-r" aria-hidden />
          <div className="hero-verse-strip" aria-hidden>
            وَمَنْ يَتَهَيَّبْ صُعُودَ الجِبَالِ يَعِشْ أَبَدَ الدَّهْرِ بَيْنَ الحُفَرْ
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              منصة تحليل الشعر العربي بالذكاء الاصطناعي
            </div>

            <h1 className="hero-title">ميزان الشعر</h1>

            <p className="hero-tagline">حيثُ يلتقي الموروثُ بالذكاء</p>

            <p className="hero-desc">
              اكتشف خبايا قصيدتك — البحر والقافية والبلاغة — في ثوانٍ معدودة،
              بتقنية مُدرَّبة على خمسة وخمسين ألف بيت شعري
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <ArabesqueDivider opacity={0.28} />
            </div>

            <div className="hero-ctas">
              <Link href="/analyze" className="btn-primary">
                ابدأ التحليل مجاناً <IconArrow />
              </Link>
              <Link href="/signin" className="btn-secondary">
                تسجيل الدخول
              </Link>
            </div>

            <div className="stats-row">
              {[
                { v: '١٦',   l: 'بحراً شعرياً' },
                { v: '٥٥K+', l: 'بيت مدرَّب' },
                { v: '١٠+',  l: 'محسناً بديعياً' },
              ].map(s => (
                <div key={s.l} className="stat-item">
                  <div className="stat-val">{s.v}</div>
                  <div className="stat-label">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══════════════════════════════════════════════════════════ */}
        <section className="features-section">
          <div style={{ marginBottom: '3rem' }}><ArabesqueDivider opacity={0.16} /></div>

          <div className="container">
            <div className="features-header">
              <span className="section-label">الإمكانيات</span>
              <h2 className="section-h2">تحليل شامل لكل أبعاد القصيدة</h2>
              <p className="section-sub" style={{ maxWidth: 440, margin: '0 auto' }}>
                من العروض الخليلي إلى الأساليب البلاغية — كلها في مكان واحد
              </p>
            </div>

            <div className="features-grid">
              {features.map((f, i) => (
                <div key={i} className="feature-card">
                  <div className="feature-icon-wrap">
                    <span className="feature-glyph">{f.glyph}</span>
                    <span className="feature-icon">{f.icon}</span>
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '3rem' }}><ArabesqueDivider opacity={0.16} /></div>
        </section>

        {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
        <section className="how-section">
          <div className="container-md">
            <div className="how-header">
              <span className="section-label">طريقة الاستخدام</span>
              <h2 className="section-h2">ثلاث خطوات فقط</h2>
            </div>

            <div className="steps-list">
              {steps.map((step, i) => (
                <div key={i} className="step-row">
                  <div className="step-num">{step.n}</div>
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-detail">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo card */}
            <div className="demo-card">
              <div className="demo-card-header">
                <div className="demo-dot" />
                <span className="demo-label">مثال — قصيدة المتنبي</span>
              </div>
              <div className="demo-verse">
                <span className="demo-verse-ornament">❧</span>
                <span className="demo-verse-ornament-l">❧</span>
                <p className="demo-verse-text">
                  عَلَى قَدْرِ أَهْلِ الْعَزْمِ تَأْتِي الْعَزَائِمُ
                  <br />
                  وَتَأْتِي عَلَى قَدْرِ الْكِرَامِ الْمَكَارِمُ
                </p>
                <p className="demo-verse-author">— أبو الطيب المتنبي</p>
              </div>
              <div className="demo-results">
                {[
                  { label: 'البحر', value: 'الكامل' },
                  { label: 'الغرض', value: 'مدح' },
                  { label: 'حرف الروي', value: 'الميم' },
                  { label: 'التفعيلة', value: 'متفاعلن' },
                ].map(item => (
                  <div key={item.label} className="demo-result-cell">
                    <div className="demo-result-key">{item.label}</div>
                    <div className="demo-result-val">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ ABOUT ═════════════════════════════════════════════════════════════ */}
        <section className="about-section geo-bg">
          <div className="about-glow" aria-hidden />
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>

            <div className="about-header">
              <span className="section-label">نبذة عن المنصة</span>
              <h2 className="section-h2">عن ميزان الشعر</h2>
              <p className="section-sub" style={{ maxWidth: 660, lineHeight: 2 }}>
                يُعدّ الشعر العربي من أعرق الفنون الأدبية، نشأ مرتبطاً باللغة والوجدان،
                وتطوّر عبر العصور وفق أوزان دقيقة وضع أسسها الخليل بن أحمد الفراهيدي.
              </p>
            </div>

            <ArabesqueDivider opacity={0.15} />

            <div className="about-grid">
              <div className="about-card">
                <span className="about-card-letter" aria-hidden>ع</span>
                <h3 className="about-card-title">علم العَروض وتحليل الشعر</h3>
                <p className="about-card-text">
                  يقوم تحليل الشعر العربي على دراسة البنية الوزنية والإيقاعية للأبيات،
                  من خلال تقطيعها إلى تفعيلات ومقارنتها بالبحور الشعرية المعروفة.
                  وقد وضع الخليل بن أحمد الفراهيدي هذا العلم في القرن الثامن الميلادي،
                  ليظل مرجعاً راسخاً لكل من أراد فهم موسيقى الشعر العربي.
                </p>
              </div>

              <div className="about-card">
                <span className="about-card-letter" aria-hidden>ذ</span>
                <h3 className="about-card-title">النموذج الذكي</h3>
                <p className="about-card-text">
                  قمنا بتطوير نموذج ذكاء اصطناعي قادر على تحليل الأبيات الشعرية آلياً،
                  واستخراج وزنها والتعرف على البحر الشعري، مُدرَّب على أكثر من خمسة وخمسين
                  ألف بيت شعري، ومدعوم بنماذج AraBERT و MARBERT و PyArud.
                </p>
              </div>
            </div>

            <div className="tech-badges">
              {['PyArud', 'AraBERT', 'MARBERT', 'MetRec'].map(tech => (
                <span key={tech} className="tech-badge">{tech}</span>
              ))}
              <span className="tech-badge-dim">جامعة قسنطينة ٢ — SDIA M1</span>
            </div>
          </div>
        </section>

        {/* ══ QUOTE BREAK ═══════════════════════════════════════════════════════ */}
        <section className="quote-section">
          <div className="quote-glow" aria-hidden />
          <div className="container-sm" style={{ position: 'relative', zIndex: 1 }}>
            <ArabesqueDivider opacity={0.2} />
            <blockquote className="quote-text">
              &ldquo;الشعر ديوانُ العرب، وفيه أسرار لغتهم وروح حضارتهم&rdquo;
            </blockquote>
            <cite className="quote-cite">— من التراث العربي</cite>
            <div style={{ marginTop: '2.5rem' }}><ArabesqueDivider opacity={0.2} /></div>
          </div>
        </section>

        {/* ══ FINAL CTA ═════════════════════════════════════════════════════════ */}
        <section className="cta-section geo-bg">
          <div className="cta-glow-bottom" aria-hidden />
          <div className="cta-verse-strip" aria-hidden>وَالشِّعْرُ لُبُّ الْمَرْءِ يُظْهِرُهُ</div>

          <div className="container-sm" style={{ position: 'relative', zIndex: 1 }}>
            <span className="section-label">ابدأ الآن</span>
            <h2 className="cta-h2">حلِّل قصيدتك الآن</h2>
            <p className="cta-sub">
              تجربة مجانية — لا يلزم تسجيل. فقط أدخل أبياتك واكتشف ما تخفيه من أسرار
            </p>
            <div style={{ marginBottom: '2.25rem' }}><ArabesqueDivider opacity={0.22} /></div>

            <div className="cta-buttons">
              <Link href="/analyze" className="btn-primary">
                تحليل قصيدة الآن <IconArrow />
              </Link>
              <Link href="/signin" className="btn-secondary">
                دخول / تسجيل
              </Link>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
        <footer className="footer">
          <div className="footer-inner">
            <Link href="/" className="footer-brand">
              <span className="footer-brand-glyph">✦</span>
              <span className="footer-brand-name">ميزان الشعر</span>
            </Link>
            <div className="footer-links">
              <Link href="/analyze" className="footer-link">التحليل</Link>
              <Link href="/signin" className="footer-link">الدخول</Link>
            </div>
            <p className="footer-copy">© ٢٠٢٦ ميزان الشعر — جامعة قسنطينة ٢</p>
          </div>
        </footer>

      </div>
    </>
  );
}