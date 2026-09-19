'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Zap, Calendar, Users, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateSlotsDialogProps {
  open: boolean;
  onClose: () => void;
  defaultHospitalId?: string;
}

export function GenerateSlotsDialog({ open, onClose, defaultHospitalId }: GenerateSlotsDialogProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Helper date strings (YYYY-MM-DD)
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getDatePlusDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [hospitalId, setHospitalId] = useState(defaultHospitalId || '');
  const [doctorId, setDoctorId] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getDatePlusDays(14));
  const [slotDuration, setSlotDuration] = useState(30);
  const [capacity, setCapacity] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Hospitals
  const { data: hospitalsData } = useQuery({
    queryKey: ['admin-hospitals-generate-slots'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
    enabled: open,
  });

  // Fetch Doctors (optionally filtered by hospital)
  const { data: doctorsData } = useQuery({
    queryKey: ['admin-doctors-generate-slots', hospitalId],
    queryFn: () => adminService.getDoctors({ limit: 100, hospitalId: hospitalId || undefined, isActive: 'true' }),
    enabled: open,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      if (!startDate || !endDate) {
        throw new Error('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
      }
      if (startDate > endDate) {
        throw new Error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc');
      }

      return adminService.generateAppointmentSlots({
        hospitalId: hospitalId || undefined,
        doctorId: doctorId || undefined,
        startDate,
        endDate,
        slotDuration: Number(slotDuration),
        capacity: Number(capacity),
      });
    },
    onSuccess: (data: any) => {
      const createdCount = data?.created || 0;
      toast.success(`Đã tự động tạo thành công ${createdCount} khung giờ khám.`);
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-slots'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Không thể sinh khung giờ khám';
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  const handleQuickDays = (days: number) => {
    setStartDate(getTodayStr());
    setEndDate(getDatePlusDays(days));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={`max-w-lg p-6 rounded-2xl ${isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800'
          }`}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            Tự động sinh khung giờ khám
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 py-2 text-xs">
          <p className="text-slate-500">
            Hệ thống sẽ dựa trên <b>Lịch làm việc định kỳ theo tuần</b> của bác sĩ để tạo trước các khung giờ khám thực tế trong khoảng ngày được chọn.
          </p>

          {/* Scope Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Bệnh viện / Cơ sở</label>
              <select
                value={hospitalId}
                onChange={(e) => {
                  setHospitalId(e.target.value);
                  setDoctorId('');
                }}
                className={`w-full p-2.5 rounded-xl border font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
              >
                <option value="">Tất cả bệnh viện</option>
                {hospitalsData?.items?.map((h: any) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Bác sĩ áp dụng</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className={`w-full p-2.5 rounded-xl border font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
              >
                <option value="">Tất cả bác sĩ có lịch</option>
                {doctorsData?.items?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.title ? `${d.title} ` : ''}{d.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range & Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Khoảng ngày sinh khung giờ
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickDays(7)}
                  className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                >
                  +7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDays(14)}
                  className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                >
                  +14 ngày
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDays(30)}
                  className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                >
                  +30 ngày
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500">Từ ngày:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`mt-1 text-xs rounded-xl font-mono ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500">Đến ngày:</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`mt-1 text-xs rounded-xl font-mono ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Slot Duration & Capacity */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Thời lượng mỗi slot
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl border font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
              >
                <option value={15}>15 phút / lượt khám</option>
                <option value={20}>20 phút / lượt khám</option>
                <option value={30}>30 phút / lượt khám (Chuẩn)</option>
                <option value={45}>45 phút / lượt khám</option>
                <option value={60}>60 phút / lượt khám</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                Sức chứa mỗi slot (Quota)
              </label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl border font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
              >
                <option value={1}>1 người (Đúng giờ hẹn)</option>
                <option value={2}>2 người / slot</option>
                <option value={3}>3 người / slot (Medpro chuẩn)</option>
                <option value={5}>5 người / slot (Khám đông)</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`rounded-xl text-xs ${isLight ? 'border-slate-300 text-slate-700' : 'border-slate-800 text-slate-300'}`}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
            className="rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" />
            )}
            Bắt đầu sinh khung giờ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
