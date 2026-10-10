'use client';

import { Suspense } from 'react';
import { HospitalIntegrationView } from '@/components/hospital-admin/integration/HospitalIntegrationView';
import { Loader2 } from 'lucide-react';

export default function HospitalIntegrationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs font-medium">Đang tải Cổng Tích hợp & Kết nối HIS...</span>
        </div>
      }
    >
      <HospitalIntegrationView />
    </Suspense>
  );
}
