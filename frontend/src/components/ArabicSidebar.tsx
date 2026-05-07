'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const pages = [
  { href: '/', label: 'الرئيسية', icon: '🏛' },
  { href: '/analyze', label: 'تحليل قصيدة', icon: '📜' },
  { href: '/signin', label: 'تسجيل الدخول', icon: '✒️' },
];

function PenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 21h4l11-11-4-4L4 17v4z" />
      <path d="M14.75 7.25l2 2" />
      <path d="M13 8l3 3" />
    </svg>
  );
}

function PaperIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <path d="M14 2v5h5" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

export default function ArabicSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
        aria-expanded={isOpen}
        aria-controls="site-sidebar"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-[#24180f] border border-[#c8922a] text-[#c8922a] p-3.5 rounded-2xl shadow-lg hover:bg-[#c8922a] hover:text-[#1a1008] transition-all"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Nicely Bigger Sidebar */}
      <aside 
        className={`
          fixed md:static top-0 right-0 h-screen 
          w-[420px] sm:w-[500px] md:w-[540px] 
          p-7 bg-[#24180f] border-l md:border border-[rgba(200,146,42,0.28)] 
          shadow-[0_12px_45px_rgba(0,0,0,0.55)] 
          transform transition-transform duration-300 ease-in-out z-40
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        <div className="mb-8">
          <div className="text-center text-2xl font-amiri text-[#c8922a]">
            ادوات الموقع
          </div>
          <p className="text-center text-sm text-[#d4b77d] mt-2">
            تنقل بين صفحات الموقع
          </p>
        </div>

        <ul className="space-y-3">
          {pages.map((page) => {
            const active = pathname === page.href;
            const icon = page.href === '/signin' ? <PenIcon /> : <PaperIcon />;

            return (
              <li key={page.href}>
                <Link
                  href={page.href}
                  onClick={() => setIsOpen(false)}
                  className={`block rounded-2xl px-5 py-4 text-[17px] font-naskh transition-all ${
                    active
                      ? 'bg-[#c8922a] text-[#1a1008] shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] font-medium'
                      : 'text-[#e8d9b8] hover:bg-[#c8922a]/10 hover:text-[#f0d9a8]'
                  }`}
                >
                  <span className="inline-flex items-center gap-3.5">
                    {icon} 
                    {page.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 border-t border-[rgba(200,146,42,0.35)] pt-7 text-[15px] text-[#b89c6e]">
          <p>☀️ للقصيدة نور وصوت</p>
          <p className="mt-1.5">✒️ اكتب بيتك بجرأة.</p>
        </div>
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}