'use client';
import { authClient } from "@/lib/auth-client";
import React, { useState } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────
interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// ─── Verse ────────────────────────────────────────────────
const VERSE = { text: 'وَمَا الشِّعْرُ إِلَّا مِرْآةُ الرُّوحِ', author: 'المتنبي' };

// ─── Eye Icon ─────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

// ─── Google Icon ──────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
      <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
      <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
      <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
    </svg>
  );
}

// ─── GitHub Icon ──────────────────────────────────────────
function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-1.47-3.795-1.47-.495-1.26-1.215-1.59-1.215-1.59-.99-.675.075-.66.075-.66 1.095.075 1.665 1.125 1.665 1.125.975 1.665 2.55 1.185 3.18.9.105-.705.375-1.185.675-1.455-2.55-.285-5.22-1.275-5.22-5.67 0-1.26.45-2.28 1.185-3.09-.12-.285-.51-1.425.105-2.97 0 0 .975-.315 3.195 1.185.93-.255 1.92-.375 2.895-.375s1.965.12 2.895.375c2.22-1.5 3.195-1.185 3.195-1.185.615 1.545.225 2.685.105 2.97.735.81 1.185 1.83 1.185 3.09 0 4.41-2.67 5.385-5.22 5.67.405.345.765 1.035.765 2.085 0 1.5-.015 2.715-.015 3.09 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function SignInPage() {
  const [form, setForm]             = useState<FormState>({ email: '', password: '', rememberMe: false });
  const [errors, setErrors]         = useState<FormErrors>({});
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading]       = useState(false);

  function validate(): boolean {
    const errs: FormErrors = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email)                    errs.email    = 'البريد الإلكتروني مطلوب';
    else if (!emailRe.test(form.email)) errs.email    = 'صيغة البريد الإلكتروني غير صحيحة';
    if (!form.password)                 errs.password = 'كلمة المرور مطلوبة';
    else if (form.password.length < 6)  errs.password = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await authClient.signIn.email({
        email: form.email,
        password: form.password,
        callbackURL: "/analyze",
      });

      if (result.error) {
        setErrors({ 
          general: result.error.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
        });
      }
      // Success: Better Auth will automatically redirect

    } catch (err: any) {
      setErrors({ 
        general: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى." 
      });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, checked, type } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name as keyof FormErrors]) setErrors(err => ({ ...err, [name]: undefined }));
  }

  const handleGoogle = async () => {
    await authClient.signIn.social({ provider: "google", callbackURL: "/analyze" });
  };
  const handleGitHub = async () => {
    await authClient.signIn.social({ provider: "github", callbackURL: "/analyze" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Scheherazade+New:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold:        #c8922a;
          --gold-light:  #e8c876;
          --gold-muted:  rgba(200,146,42,0.55);
          --gold-faint:  rgba(200,146,42,0.12);
          --ink:         #0e0a05;
          --ink-deep:    #070503;
          --parchment:   #f5edd8;
          --parchment-dim: #c2b59b;
          --parchment-faint: rgba(245,237,216,0.07);
          --crimson:     rgba(139,26,42,0.18);
          --border:      rgba(200,146,42,0.14);
          --border-hover: rgba(200,146,42,0.35);
          --error:       #e57373;
          --error-bg:    rgba(139,26,42,0.15);
          --radius:      14px;
          --radius-sm:   8px;
          --transition:  all 0.22s cubic-bezier(0.4,0,0.2,1);
        }

        body { background: var(--ink-deep); }

        /* ── Page shell ── */
        .page-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background:
            radial-gradient(ellipse 80% 60% at 20% 50%, rgba(200,146,42,0.055) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(139,26,42,0.06) 0%, transparent 55%),
            #0e0a05;
          font-family: 'Noto Naskh Arabic', serif;
          direction: rtl;
        }

        /* ── Card wrapper ── */
        .card-wrapper {
          width: 100%;
          max-width: 880px;
          display: flex;
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.4),
            0 32px 64px rgba(0,0,0,0.55),
            0 0 120px rgba(200,146,42,0.04);
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Left panel ── */
        .panel-left {
          width: 280px;
          flex-shrink: 0;
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 2rem;
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(170deg,
              rgba(200,146,42,0.08) 0%,
              rgba(14,10,5,0.98) 45%,
              rgba(139,26,42,0.07) 100%
            );
          border-left: 1px solid var(--border);
        }

        @media (min-width: 900px) {
          .panel-left { display: flex; }
        }

        /* Subtle geometric bg — just a hint */
        .panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              60deg,
              transparent,
              transparent 38px,
              rgba(200,146,42,0.028) 38px,
              rgba(200,146,42,0.028) 39px
            ),
            repeating-linear-gradient(
              -60deg,
              transparent,
              transparent 38px,
              rgba(200,146,42,0.028) 38px,
              rgba(200,146,42,0.028) 39px
            );
          pointer-events: none;
        }

        /* Soft glow at top */
        .panel-left::after {
          content: '';
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(200,146,42,0.09) 0%, transparent 70%);
          pointer-events: none;
        }

        .panel-verse {
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .panel-ornament-top {
          font-size: 1.6rem;
          color: rgba(200,146,42,0.35);
          display: block;
          margin-bottom: 1.5rem;
          letter-spacing: 0.4rem;
        }

        .panel-verse-text {
          font-family: 'Amiri', serif;
          font-size: 1.25rem;
          color: #e8d9b8;
          line-height: 2;
          font-style: italic;
        }

        .panel-verse-author {
          display: block;
          margin-top: 1rem;
          font-size: 0.78rem;
          color: var(--gold);
          opacity: 0.7;
          letter-spacing: 0.05em;
        }

        /* Feature list */
        .panel-features {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .panel-feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .panel-feature-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--gold);
          opacity: 0.5;
          flex-shrink: 0;
        }

        .panel-feature-label {
          font-size: 0.82rem;
          color: #a89880;
          line-height: 1.4;
        }

        /* Bottom ornament */
        .panel-ornament-bottom {
          position: relative;
          z-index: 1;
          text-align: center;
          font-size: 1rem;
          color: rgba(200,146,42,0.2);
          letter-spacing: 0.6rem;
        }

        /* ── Right form panel ── */
        .panel-right {
          flex: 1;
          background:
            radial-gradient(ellipse 70% 40% at 50% 0%, rgba(200,146,42,0.05) 0%, transparent 60%),
            rgba(16,11,6,0.97);
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        @media (max-width: 540px) {
          .panel-right { padding: 2rem 1.25rem; }
        }

        .form-inner { max-width: 360px; margin: 0 auto; width: 100%; }

        /* Header */
        .form-header {
          text-align: center;
          margin-bottom: 2.25rem;
          animation: fadeUp 0.6s 0.08s cubic-bezier(0.22,1,0.36,1) both;
        }

        .header-glyph {
          display: inline-block;
          font-size: 1.4rem;
          color: var(--gold-muted);
          margin-bottom: 1rem;
          letter-spacing: 0.3rem;
        }

        .form-title {
          font-family: 'Scheherazade New', serif;
          font-size: 1.85rem;
          font-weight: 600;
          color: var(--parchment);
          line-height: 1.3;
          margin-bottom: 0.4rem;
        }

        .form-subtitle {
          font-size: 0.85rem;
          color: var(--parchment-dim);
          opacity: 0.75;
        }

        /* Error banner */
        .error-banner {
          margin-bottom: 1.25rem;
          padding: 0.7rem 1rem;
          border-radius: var(--radius-sm);
          background: var(--error-bg);
          border: 1px solid rgba(139,26,42,0.3);
          color: var(--error);
          font-size: 0.85rem;
          text-align: center;
        }

        /* Form */
        .signin-form { display: flex; flex-direction: column; gap: 1.1rem; }

        /* Field */
        .field { display: flex; flex-direction: column; gap: 0.35rem; }

        .field-label {
          font-size: 0.82rem;
          color: var(--parchment-dim);
          opacity: 0.85;
          padding-right: 0.1rem;
        }

        .field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.35rem;
        }

        .field-row .field-label { margin-bottom: 0; }

        /* Input */
        .inp {
          width: 100%;
          padding: 0.7rem 0.95rem;
          background: rgba(255,255,255,0.032);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--parchment);
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.92rem;
          outline: none;
          transition: var(--transition);
          caret-color: var(--gold);
        }

        .inp::placeholder { color: rgba(194,181,155,0.3); }

        .inp:hover {
          border-color: rgba(200,146,42,0.22);
          background: rgba(255,255,255,0.04);
        }

        .inp:focus {
          border-color: var(--gold-muted);
          background: rgba(200,146,42,0.04);
          box-shadow: 0 0 0 3px rgba(200,146,42,0.08);
        }

        .inp.inp-error {
          border-color: rgba(229,115,115,0.45);
        }

        .inp-password-wrap { position: relative; }

        .inp-password-wrap .inp { padding-left: 2.4rem; }

        .inp-eye {
          position: absolute;
          left: 0.7rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(154,110,34,0.6);
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          display: flex;
          transition: color 0.18s;
        }

        .inp-eye:hover { color: var(--gold); }

        .field-error {
          font-size: 0.78rem;
          color: var(--error);
          opacity: 0.9;
          padding-right: 0.1rem;
        }

        /* Forgot link */
        .link-forgot {
          font-size: 0.78rem;
          color: rgba(200,146,42,0.55);
          text-decoration: none;
          transition: color 0.18s;
        }
        .link-forgot:hover { color: var(--gold); }

        /* Remember me */
        .remember-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .remember-checkbox {
          appearance: none;
          width: 15px;
          height: 15px;
          border: 1px solid rgba(200,146,42,0.3);
          border-radius: 3px;
          background: transparent;
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          flex-shrink: 0;
        }

        .remember-checkbox:checked {
          background: var(--gold);
          border-color: var(--gold);
        }

        .remember-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 3px; top: 1px;
          width: 5px; height: 8px;
          border: 1.5px solid var(--ink);
          border-top: none; border-left: none;
          transform: rotate(40deg);
        }

        .remember-label {
          font-size: 0.82rem;
          color: var(--parchment-dim);
          opacity: 0.75;
          cursor: pointer;
          user-select: none;
        }

        /* Submit button */
        .btn-submit {
          width: 100%;
          padding: 0.78rem 1rem;
          margin-top: 0.25rem;
          background: linear-gradient(135deg, #b07820 0%, #c8922a 50%, #b07820 100%);
          border: none;
          border-radius: var(--radius-sm);
          color: rgba(14,10,5,0.95);
          font-family: 'Amiri', serif;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }

        .btn-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.22s;
        }

        .btn-submit:hover:not(:disabled)::before { opacity: 1; }

        .btn-submit:hover:not(:disabled) {
          box-shadow: 0 4px 18px rgba(200,146,42,0.28);
          transform: translateY(-1px);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0 1.1rem;
          color: rgba(154,110,34,0.4);
          font-size: 0.78rem;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to left, transparent, rgba(200,146,42,0.18), transparent);
        }

        /* OAuth buttons */
        .oauth-stack { display: flex; flex-direction: column; gap: 0.6rem; }

        .btn-oauth {
          width: 100%;
          padding: 0.65rem 1rem;
          background: rgba(255,255,255,0.028);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--parchment-dim);
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.88rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: var(--transition);
        }

        .btn-oauth:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(200,146,42,0.22);
          color: var(--parchment);
        }

        /* Sign up */
        .signup-line {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.82rem;
          color: rgba(154,110,34,0.55);
        }

        .link-gold {
          color: var(--gold);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.18s;
        }
        .link-gold:hover { color: var(--gold-light); }

        /* Bottom flourish */
        .bottom-flourish {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.85rem;
          color: rgba(200,146,42,0.18);
          letter-spacing: 0.45rem;
        }

        /* Staggered animation */
        .anim-1 { animation: fadeUp 0.55s 0.10s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-2 { animation: fadeUp 0.55s 0.17s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-3 { animation: fadeUp 0.55s 0.24s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-4 { animation: fadeUp 0.55s 0.30s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-5 { animation: fadeUp 0.55s 0.36s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="page-shell">
        <div className="card-wrapper">

          {/* ── Left decorative panel ── */}
          <div className="panel-left">
            <div className="panel-verse">
              <span className="panel-ornament-top">✦ ✧ ✦</span>
              <p className="panel-verse-text">&ldquo;{VERSE.text}&rdquo;</p>
              <span className="panel-verse-author">— {VERSE.author}</span>
            </div>

            <div className="panel-features">
              {[
                'تحليل البحر الشعري',
                'كشف القافية والرويّ',
                'الصور البيانية',
                'إحصاءات دقيقة',
              ].map(label => (
                <div key={label} className="panel-feature">
                  <span className="panel-feature-dot" />
                  <span className="panel-feature-label">{label}</span>
                </div>
              ))}
            </div>

            <div className="panel-ornament-bottom">☽</div>
          </div>

          {/* ── Sign-in form ── */}
          <div className="panel-right">
            <div className="form-inner">

              {/* Header */}
              <div className="form-header text-center space-y-4">

  {/* Top: Back to home */}
  <Link 
    href="/" 
    className="inline-flex items-center gap-2 text-sm text-[#9a6e22] hover:text-[#c8922a] transition"
    style={{ fontFamily: "'Noto Naskh Arabic', serif" }}
  >
    <span>←</span>
    <span>العودة إلى الرئيسية</span>
  </Link>

  {/* Brand */}
  <div className="flex items-center justify-center gap-2">
    <span className="text-[#c8922a] text-xl">✦</span>
    <span 
      className="text-lg"
      style={{ fontFamily: "'Amiri', serif", color: '#e8d9b8' }}
    >
      ميزان الشعر
    </span>
    <span className="text-[#c8922a] text-xl">✦</span>
  </div>

  {/* Title */}
  <h1
    className="text-2xl md:text-3xl"
    style={{
      fontFamily: "'Scheherazade New', serif",
      color: '#f5edd8',
      lineHeight: 1.4
    }}
  >
    أهلاً بعودتك
  </h1>

  {/* Subtitle */}
  <p
    className="text-sm"
    style={{
      fontFamily: "'Noto Naskh Arabic', serif",
      color: '#c2b59b'
    }}
  >
    سجّل دخولك لمتابعة رحلتك مع الشعر
  </p>

</div>

              {/* General error */}
              {errors.general && (
                <div className="error-banner">{errors.general}</div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="signin-form">

                {/* Email */}
                <div className="field anim-1">
                  <label htmlFor="email" className="field-label">البريد الإلكتروني</label>
                  <input
                    id="email" name="email" type="email" autoComplete="email"
                    value={form.email} onChange={handleChange}
                    placeholder="example@mail.com"
                    className={`inp${errors.email ? ' inp-error' : ''}`}
                    dir="ltr" style={{ textAlign: 'right' }}
                  />
                  {errors.email && <span className="field-error">⚠ {errors.email}</span>}
                </div>

                {/* Password */}
                <div className="field anim-2">
                  <div className="field-row">
                    <label htmlFor="password" className="field-label">كلمة المرور</label>
                    <Link href="/forgot-password" className="link-forgot">نسيت كلمة المرور؟</Link>
                  </div>
                  <div className="inp-password-wrap">
                    <input
                      id="password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={form.password} onChange={handleChange}
                      placeholder="••••••••"
                      className={`inp${errors.password ? ' inp-error' : ''}`}
                    />
                    <button
                      type="button"
                      className="inp-eye"
                      onClick={() => setShowPass(p => !p)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {errors.password && <span className="field-error">⚠ {errors.password}</span>}
                </div>

                {/* Remember me */}
                <div className="remember-row anim-3">
                  <input
                    id="rememberMe" name="rememberMe" type="checkbox"
                    checked={form.rememberMe} onChange={handleChange}
                    className="remember-checkbox"
                  />
                  <label htmlFor="rememberMe" className="remember-label">تذكّرني</label>
                </div>

                {/* Submit */}
                <div className="anim-4">
                  <button type="submit" disabled={loading} className="btn-submit">
                    {loading ? (
                      <span className="btn-spinner">
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        جارٍ التحقق…
                      </span>
                    ) : 'دخول إلى الديوان'}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="divider anim-4">أو</div>

              {/* OAuth */}
              <div className="oauth-stack anim-5">
                <button className="btn-oauth" onClick={handleGoogle}>
                  <GoogleIcon />
                  المتابعة بـ Google
                </button>
                <button className="btn-oauth" onClick={handleGitHub}>
                  <GithubIcon />
                  المتابعة بـ GitHub
                </button>
              </div>

              {/* Sign up */}
              <p className="signup-line anim-5">
                ليس لديك حساب؟{' '}
                <Link href="/signup" className="link-gold">إنشاء حساب جديد</Link>
              </p>

              {/* Bottom flourish */}
              <div className="bottom-flourish">✦ ✧ ✦</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}