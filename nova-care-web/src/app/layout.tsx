import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'NovaCare - Đặt lịch khám trực tuyến',
  description: 'Đặt lịch khám bệnh dễ dàng với NovaCare. Tìm bác sĩ, cơ sở y tế và đặt lịch nhanh chóng.',
  keywords: 'đặt lịch khám, bác sĩ, bệnh viện, sức khỏe, NovaCare',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
