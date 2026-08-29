'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, ChevronRight, CheckCircle2, AlertCircle, XCircle, Loader2, FileText, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Appointment } from '@/types/appointment.types';
import { appointmentService } from '@/services/appointment.service';
import { toast } from 'sonner';
import { VietnamEMRModal, MedicalEncounterData } from '@/components/emr/VietnamEMRModal';

const statusConfig: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Chờ xác nhận', style: 'bg-amber-50 text-amber-700 border-amber-200/80', icon: <Clock className="w-3 h-3" /> },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', style: 'bg-amber-50 text-amber-700 border-amber-200/80', icon: <AlertCircle className="w-3 h-3" /> },
  CONFIRMED: { label: 'Đã xác nhận', style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', icon: <CheckCircle2 className="w-3 h-3" /> },
  PAID: { label: 'Đã thanh toán', style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', icon: <CheckCircle2 className="w-3 h-3" /> },
  COMPLETED: { label: 'Đã hoàn thành', style: 'bg-slate-100 text-slate-700 border-slate-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  CANCELLED: { label: 'Đã hủy', style: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> },
  EXPIRED: { label: 'Đã hết hạn', style: 'bg-slate-100 text-slate-600 border-slate-200', icon: <XCircle className="w-3 h-3" /> },
  NO_SHOW: { label: 'Không đến khám', style: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> },
};

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const queryClient = useQueryClient();
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isEMRModalOpen, setIsEMRModalOpen] = useState(false);
  const [activeEncounter, setActiveEncounter] = useState<MedicalEncounterData | null>(null);

  const status = statusConfig[appointment.status] || { label: appointment.status, style: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
  const startTime = appointment.slot?.startTime ? new Date(appointment.slot.startTime) : null;

  const handleFulfill = async () => {
    setIsFulfilling(true);
    try {
      const res = await appointmentService.mockFulfill(appointment.id);
      toast.success('🎉 Xác nhận khám thành công!', {
        description: 'Hồ sơ bệnh án điện tử (EMR) đã được tạo và lưu vào Sổ sức khỏe điện tử.',
      });

      // Prepare and open EMR modal immediately
      const enc = (res as any)?.medicalEncounter || (appointment as any)?.medicalEncounter;
      if (enc) {
        setActiveEncounter({
          ...enc,
          hospital: (res as any)?.slot?.doctorWorkplace?.hospital || appointment.slot?.doctorWorkplace?.hospital,
          patientProfile: (res as any)?.patientProfile || appointment.patientProfile,
        });
        setIsEMRModalOpen(true);
      }

      queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-all-appointments-so-suc-khoe'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xác nhận khám');
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleOpenEMR = () => {
    if (appointment.medicalEncounter) {
      setActiveEncounter({
        ...appointment.medicalEncounter,
        hospital: appointment.slot?.doctorWorkplace?.hospital,
        patientProfile: appointment.patientProfile,
      });
      setIsEMRModalOpen(true);
    }
  };

  return (
    <>
      <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200">
        <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                Mã: {appointment.bookingCode}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.style}`}>
                {status.icon}
                {status.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Bác sĩ: <strong className="text-slate-800">{appointment.slot?.doctorWorkplace?.doctor?.fullName || 'Bác sĩ phụ trách'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Ngày khám: <strong className="text-slate-800">{startTime ? format(startTime, 'dd/MM/yyyy', { locale: vi }) : '---'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Giờ khám: <strong className="text-slate-800">{startTime ? format(startTime, 'HH:mm', { locale: vi }) : '---'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{appointment.slot?.doctorWorkplace?.hospital?.name || 'Cơ sở khám y tế'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-between md:justify-end shrink-0">
            <div className="text-left md:text-right">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Chi phí</p>
              <p className="font-bold text-slate-900 text-sm sm:text-base">
                {appointment.totalPrice?.toLocaleString() || 0}đ
              </p>
            </div>
            <div className="flex items-center gap-2">
              {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                <Button
                  onClick={handleFulfill}
                  disabled={isFulfilling}
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs gap-1.5 shadow-xs cursor-pointer"
                >
                  {isFulfilling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      Tôi đã khám xong
                    </>
                  )}
                </Button>
              )}

              {(appointment.status === 'COMPLETED' || appointment.medicalEncounter) && (
                <Button
                  onClick={handleOpenEMR}
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1 shadow-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Xem bệnh án EMR
                </Button>
              )}

              <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1">
                <Link href={`/lich-kham/${appointment.id}`}>
                  Chi tiết
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vietnam Official EMR Full Dialog */}
      <VietnamEMRModal
        isOpen={isEMRModalOpen}
        onClose={() => setIsEMRModalOpen(false)}
        encounter={activeEncounter}
      />
    </>
  );
}

