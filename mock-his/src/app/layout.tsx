import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mock HIS - Cổng Tra Cứu Hồ Sơ Liên Thông",
  description: "Hệ thống bệnh viện mô phỏng - Tra cứu dữ liệu hồ sơ bệnh án liên thông qua NovaCare API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
