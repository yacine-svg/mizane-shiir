import type { Metadata } from 'next';
import './globals.css';
import ArabicSidebar from '@/components/ArabicSidebar';

export const metadata: Metadata = {
  title: 'ميزان الشعر — محلّل الشعر العربي',
  description: 'حلّل قصائدك العربية واكتشف البحر والقافية والصور البيانية بدقة وسهولة.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Scheherazade+New:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink min-h-screen text-parchment">
        <div className="min-h-screen lg:flex lg:items-start lg:gap-6">
          <div className="hidden lg:block lg:w-80 lg:h-screen lg:sticky lg:top-0 lg:p-6">
            <ArabicSidebar />
          </div>
          <main className="w-full lg:pl-0">{children}</main>
        </div>
      </body>
    </html>
  );
}