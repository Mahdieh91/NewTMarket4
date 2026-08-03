// src/app/layout.tsx
import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const vazir = Vazirmatn({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'بازار هوشمند فناوری و نوآوری',
  description: 'پلتفرم جامع مدیریت تعاملات فناورانه و نوآورانه',
  
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.className} min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa]`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}