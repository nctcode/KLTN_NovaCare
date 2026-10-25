'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { Loader2 } from 'lucide-react';

function DatLichRedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const workplaceId = searchParams.get('workplaceId');
  const hospitalId = searchParams.get('hospitalId');
  const doctorId = searchParams.get('doctorId');
  const specialtyId = searchParams.get('specialtyId');
  const serviceId = searchParams.get('serviceId');
  const date = searchParams.get('date');
  const mode = searchParams.get('mode');

  // Preload workplace if workplaceId is passed without hospitalId
  const { data: workplace, isLoading: loadingWp } = useQuery({
    queryKey: ['workplace-redirect-forward', workplaceId],
    queryFn: () => doctorService.getWorkplace(workplaceId!),
    enabled: !!workplaceId && !hospitalId,
  });

  useEffect(() => {
    if (workplaceId && !hospitalId && loadingWp) {
      return; // Wait until workplace is resolved to obtain hospitalId & doctorId
    }

    const params = new URLSearchParams();
    const finalHospitalId = hospitalId || workplace?.hospitalId;
    if (finalHospitalId) {
      params.append('hospitalId', finalHospitalId);
    }

    const finalDoctorId = doctorId || workplace?.doctorId;
    if (finalDoctorId) {
      params.append('doctorId', finalDoctorId);
      params.append('mode', 'doctor');
    } else if (mode && mode !== 'pre-filled' && mode !== 'traditional') {
      params.append('mode', mode.toLowerCase());
    } else if (specialtyId) {
      params.append('mode', 'general');
    } else if (serviceId) {
      params.append('mode', 'service');
    }

    const finalSpecialtyId = specialtyId || workplace?.specialtyId;
    if (finalSpecialtyId) {
      params.append('specialtyId', finalSpecialtyId);
    }
    if (serviceId) {
      params.append('serviceId', serviceId);
    }
    if (date) {
      params.append('date', date);
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `/dat-kham-co-so?${queryString}` : '/dat-kham-co-so';
    router.replace(targetUrl);
  }, [workplaceId, hospitalId, doctorId, specialtyId, serviceId, date, mode, workplace, loadingWp, router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 gap-3">
      <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
      <p className="text-xs font-bold text-slate-700">Đang chuyển tiếp tới luồng đặt khám cơ sở y tế NovaCare...</p>
    </div>
  );
}

export default function DatLichPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
        </div>
      }
    >
      <DatLichRedirectContent />
    </Suspense>
  );
}
