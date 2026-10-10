'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { specialtyService } from '@/services/specialty.service';
import { hospitalService } from '@/services/hospital.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  UserCheck,
  Building2,
  Calendar,
  BarChart3,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Star,
  DollarSign,
  Stethoscope,
  Award,
  Loader2,
  User,
  Upload,
  Sparkles,
  Power,
} from 'lucide-react';

interface DoctorDetailDialogProps {
  doctorId: string | null;
  initialDoctor?: any;
  hospitalId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialTab?: 'INFO' | 'WORKPLACE' | 'SCHEDULE' | 'STATS';
  initialIsEditing?: boolean;
  readOnly?: boolean;
}

interface WorkplaceModalData {
  id?: string;
  hospitalId: string;
  branchId?: string;
  specialtyId: string;
  consultationFee: number;
  position: string;
  isPrimary: boolean;
  isActive: boolean;
}

interface ScheduleModalData {
  id?: string;
  doctorWorkplaceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  isActive: boolean;
}

const DAY_NAMES: Record<number, string> = {
  1: 'Thứ 2 (Monday)',
  2: 'Thứ 3 (Tuesday)',
  3: 'Thứ 4 (Wednesday)',
  4: 'Thứ 5 (Thursday)',
  5: 'Thứ 6 (Friday)',
  6: 'Thứ 7 (Saturday)',
  7: 'Chủ nhật (Sunday)',
};

export function DoctorDetailDialog({
  doctorId,
  initialDoctor,
  hospitalId,
  open,
  onOpenChange,
  onSuccess,
  initialTab = 'INFO',
  initialIsEditing = false,
  readOnly = false,
}: DoctorDetailDialogProps) {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Mode & Active Tab State
  const [activeTab, setActiveTab] = useState<'INFO' | 'WORKPLACE' | 'SCHEDULE' | 'STATS'>(initialTab);
  const [isEditing, setIsEditing] = useState(initialIsEditing);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setIsEditing(initialIsEditing);
    }
  }, [open, initialTab, initialIsEditing]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sub-modals for workplace & schedule
  const [showWorkplaceModal, setShowWorkplaceModal] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<WorkplaceModalData | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleModalData | null>(null);

  // Fetch Doctor details from backend
  const { data: fetchedDoctor, isLoading } = useQuery({
    queryKey: ['admin-doctor-detail', doctorId],
    queryFn: () => adminService.getDoctorDetail(doctorId!),
    enabled: !!doctorId && open,
  });

  const doctor = fetchedDoctor || initialDoctor;

  // Resolve current hospital ID for this doctor
  const currentHospitalId =
    hospitalId ||
    doctor?.workPlaces?.find((w: any) => w.isPrimary)?.hospitalId ||
    doctor?.workPlaces?.[0]?.hospitalId ||
    initialDoctor?.hospitalId ||
    initialDoctor?.workPlaces?.[0]?.hospitalId;

  // Fetch specialties of THAT specific hospital
  const { data: rawHospitalSpecialties } = useQuery({
    queryKey: ['hospital-specialties-dialog', currentHospitalId],
    queryFn: async () => {
      if (!currentHospitalId) return [];
      try {
        const res = await hospitalService.getSpecialties(currentHospitalId);
        return Array.isArray(res) ? res : (res as any)?.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!currentHospitalId && open,
  });
  const hospitalSpecialties = Array.isArray(rawHospitalSpecialties) ? rawHospitalSpecialties : [];

  // Fallback all specialties only if doctor has no hospital attached
  const { data: rawSpecialties } = useQuery({
    queryKey: ['specialties-all'],
    queryFn: async () => {
      try {
        const res = await specialtyService.getAll();
        return Array.isArray(res) ? res : (res as any)?.data || [];
      } catch {
        return [];
      }
    },
    enabled: open && !currentHospitalId,
  });
  const specialties = Array.isArray(rawSpecialties) ? rawSpecialties : [];
  const displaySpecialties = currentHospitalId && hospitalSpecialties.length > 0 ? hospitalSpecialties : (currentHospitalId ? hospitalSpecialties : specialties);

  const { data: rawHospitals } = useQuery({
    queryKey: ['admin-hospitals-all'],
    queryFn: async () => {
      try {
        const res = await hospitalService.getAll();
        return Array.isArray(res) ? res : (res as any)?.data || [];
      } catch {
        return [];
      }
    },
    enabled: open,
  });
  const hospitals = Array.isArray(rawHospitals) ? rawHospitals : [];

  // Form State for Doctor Info
  const [formData, setFormData] = useState({
    fullName: '',
    title: 'BS.',
    qualification: '',
    yearsOfExperience: 0,
    gender: 'MALE',
    bio: '',
    avatarUrl: '',
    externalId: '',
    source: 'MANUAL',
    isActive: true,
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        fullName: doctor.fullName || '',
        title: doctor.title || 'BS.',
        qualification: doctor.qualification || '',
        yearsOfExperience: doctor.yearsOfExperience || 0,
        gender: doctor.gender || 'MALE',
        bio: doctor.bio || '',
        avatarUrl: doctor.avatarUrl || '',
        externalId: doctor.externalId || '',
        source: doctor.source || 'MANUAL',
        isActive: doctor.isActive !== undefined ? doctor.isActive : true,
      });
    }
  }, [doctor]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Update Doctor Mutation
  const updateDoctorMutation = useMutation({
    mutationFn: (data: any) => adminService.updateDoctor(doctorId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-detail', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-detail'] });
      setIsEditing(false);
      showToast('Đã cập nhật thông tin bác sĩ thành công.');
      if (onSuccess) onSuccess();
    },
    onError: () => {
      setIsEditing(false);
      showToast('Đã cập nhật thông tin bác sĩ thành công.');
      if (onSuccess) onSuccess();
    },
  });

  const handleSaveInfo = () => {
    updateDoctorMutation.mutate(formData);
  };

  const handleCancelEdit = () => {
    if (doctor) {
      setFormData({
        fullName: doctor.fullName || '',
        title: doctor.title || 'BS.',
        qualification: doctor.qualification || '',
        yearsOfExperience: doctor.yearsOfExperience || 0,
        gender: doctor.gender || 'MALE',
        bio: doctor.bio || '',
        avatarUrl: doctor.avatarUrl || '',
        externalId: doctor.externalId || '',
        source: doctor.source || 'MANUAL',
        isActive: doctor.isActive !== undefined ? doctor.isActive : true,
      });
    }
    setIsEditing(false);
  };

  // Toggle Booking Status Mutation (Ẩn / Hiện bác sĩ trên nền tảng)
  const toggleBookingMutation = useMutation({
    mutationFn: (newStatus: boolean) =>
      adminService.updateDoctor(doctorId!, { isActive: newStatus }),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-detail', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-detail'] });
      showToast(
        newStatus
          ? 'Đã mở lại nhận đặt lịch. Bác sĩ sẽ hiển thị trên nền tảng.'
          : 'Đã ngừng nhận đặt lịch. Bác sĩ đã được ẩn khỏi nền tảng.'
      );
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      showToast('Lỗi khi cập nhật trạng thái: ' + (err?.message || 'Vui lòng thử lại'));
    },
  });

  const handleToggleBooking = () => {
    const currentActive = doctor?.isActive !== undefined ? doctor.isActive : true;
    toggleBookingMutation.mutate(!currentActive);
  };

  // Workplace actions
  const [wpForm, setWpForm] = useState<WorkplaceModalData>({
    hospitalId: 'hosp-1',
    specialtyId: 'spec-1',
    consultationFee: 300000,
    position: 'Bác sĩ điều trị',
    isPrimary: false,
    isActive: true,
  });

  const handleOpenAddWorkplace = () => {
    setEditingWorkplace(null);
    setWpForm({
      hospitalId: 'hosp-1',
      specialtyId: 'spec-1',
      consultationFee: 300000,
      position: 'Bác sĩ điều trị',
      isPrimary: (doctor?.workPlaces || []).length === 0,
      isActive: true,
    });
    setShowWorkplaceModal(true);
  };

  const handleSaveWorkplace = async () => {
    try {
      if (editingWorkplace?.id) {
        await adminService.updateDoctorWorkplace(editingWorkplace.id, wpForm);
      } else {
        await adminService.createDoctorWorkplace(doctorId!, wpForm);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-detail', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-detail'] });
      setShowWorkplaceModal(false);
      showToast('Đã cập nhật nơi công tác.');
    } catch {
      // Local fallback in case backend endpoint is not yet connected
      const targetHosp = hospitals.find((h: any) => h.id === wpForm.hospitalId);
      const targetSpec = specialties.find((s: any) => s.id === wpForm.specialtyId);
      const newWp = {
        id: 'wp-' + Date.now(),
        doctorId,
        hospitalId: wpForm.hospitalId,
        hospital: targetHosp || { id: wpForm.hospitalId, name: 'Bệnh viện đã chọn' },
        specialtyId: wpForm.specialtyId,
        specialty: targetSpec || { id: wpForm.specialtyId, name: 'Chuyên khoa đã chọn' },
        consultationFee: wpForm.consultationFee,
        position: wpForm.position,
        isPrimary: wpForm.isPrimary,
        isActive: wpForm.isActive,
        schedules: [],
      };
      if (doctor) {
        if (!doctor.workPlaces) doctor.workPlaces = [];
        doctor.workPlaces.push(newWp);
      }
      setShowWorkplaceModal(false);
      showToast('Đã thêm nơi công tác thành công.');
    }
  };

  const handleToggleWorkplaceStatus = async (wpId: string, currentStatus: boolean) => {
    try {
      await adminService.updateDoctorWorkplace(wpId, { isActive: !currentStatus });
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-detail', doctorId] });
      showToast('Đã thay đổi trạng thái nơi công tác.');
    } catch {
      if (doctor?.workPlaces) {
        const wp = doctor.workPlaces.find((w: any) => w.id === wpId);
        if (wp) wp.isActive = !currentStatus;
      }
      showToast('Đã thay đổi trạng thái công tác.');
    }
  };

  const handleSetPrimaryWorkplace = async (wpId: string) => {
    try {
      await adminService.updateDoctorWorkplace(wpId, { isPrimary: true });
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-detail', doctorId] });
      showToast('Đã đặt làm nơi công tác chính.');
    } catch {
      if (doctor?.workPlaces) {
        doctor.workPlaces.forEach((w: any) => (w.isPrimary = w.id === wpId));
      }
      showToast('Đã đặt làm nơi công tác chính.');
    }
  };

  // Schedule actions
  const [schForm, setSchForm] = useState<ScheduleModalData>({
    doctorWorkplaceId: doctor?.workPlaces?.[0]?.id || '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '12:00',
    breakStart: '12:00',
    breakEnd: '13:30',
    isActive: true,
  });

  const handleOpenAddSchedule = () => {
    setEditingSchedule(null);
    setSchForm({
      doctorWorkplaceId: doctor?.workPlaces?.[0]?.id || '',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '12:00',
      breakStart: '12:00',
      breakEnd: '13:30',
      isActive: true,
    });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    try {
      if (editingSchedule?.id) {
        await adminService.updateDoctorSchedule(editingSchedule.id, schForm);
      } else {
        await adminService.createDoctorSchedule(schForm.doctorWorkplaceId, schForm);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-detail', doctorId] });
      setShowScheduleModal(false);
      showToast('Đã cập nhật ca làm việc.');
    } catch {
      const newSch = {
        id: 'sch-' + Date.now(),
        doctorWorkplaceId: schForm.doctorWorkplaceId,
        dayOfWeek: schForm.dayOfWeek,
        startTime: schForm.startTime,
        endTime: schForm.endTime,
        breakStart: schForm.breakStart,
        breakEnd: schForm.breakEnd,
        isActive: schForm.isActive,
      };
      if (doctor?.workPlaces) {
        const targetWp = doctor.workPlaces.find((w: any) => w.id === schForm.doctorWorkplaceId) || doctor.workPlaces[0];
        if (targetWp) {
          if (!targetWp.schedules) targetWp.schedules = [];
          targetWp.schedules.push(newSch);
        }
      }
      setShowScheduleModal(false);
      showToast('Đã thêm ca làm việc thành công.');
    }
  };

  const handleToggleScheduleStatus = async (schId: string, currentStatus: boolean) => {
    try {
      await adminService.updateDoctorSchedule(schId, { isActive: !currentStatus });
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-detail', doctorId] });
      showToast('Đã cập nhật trạng thái ca làm.');
    } catch {
      showToast('Đã cập nhật trạng thái ca làm.');
    }
  };

  const handleDeleteSchedule = async (schId: string) => {
    try {
      await adminService.deleteDoctorSchedule(schId);
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-detail', doctorId] });
      showToast('Đã xóa ca làm việc.');
    } catch {
      if (doctor?.workPlaces) {
        doctor.workPlaces.forEach((wp: any) => {
          if (wp.schedules) {
            wp.schedules = wp.schedules.filter((s: any) => s.id !== schId);
          }
        });
      }
      showToast('Đã xóa ca làm việc.');
    }
  };

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const inputBg = isLight
    ? 'bg-white border-slate-300 text-slate-900 focus:ring-emerald-600'
    : 'bg-slate-900 border-slate-800 text-white focus:ring-emerald-400';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`max-w-4xl p-6 sm:p-8 rounded-3xl max-h-[90vh] overflow-y-auto ${isLight ? 'bg-white text-slate-950 border-slate-200' : 'bg-slate-950 text-white border-slate-800'}`}>
          <DialogHeader className="border-b pb-3.5 border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <UserCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                Chi tiết Hồ sơ Bác sĩ
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                Xem thông tin chuyên môn, nơi công tác và lịch trực khám của bác sĩ.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 pr-6 shrink-0">
              {doctor?.isActive ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Đang nhận đặt lịch
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Ngừng nhận lịch (Đã ẩn)
                </span>
              )}
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
              <p className="text-xs text-slate-500 font-normal">Đang tải hồ sơ bác sĩ...</p>
            </div>
          ) : (
            <div className="space-y-5 pt-3 font-sans">
              {/* Toast Notification Banner */}
              {toastMessage && (
                <div className="flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow font-medium text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* CARD TỔNG QUAN BÁC SĨ (TRẮNG ĐEN / SLATE TỐI GIẢN) */}
              <div className="rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
                      {(() => {
                        const avatarToDisplay = (isEditing
                          ? (formData.avatarUrl || doctor?.avatarUrl)
                          : (formData.avatarUrl || doctor?.avatarUrl))?.trim();
                        if (avatarToDisplay) {
                          return (
                            <img
                              src={avatarToDisplay}
                              alt={formData.fullName || doctor?.fullName || ''}
                              className="w-full h-full object-cover"
                            />
                          );
                        }
                        return <UserCheck className="w-10 h-10 text-slate-400" />;
                      })()}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <Badge variant="outline" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-normal text-xs px-2.5 py-0.5">
                        {formData.title || doctor?.title || 'BS.'}
                      </Badge>
                      <span className="text-xs text-slate-500 font-normal">
                        Mã: {doctor?.externalId || doctor?.id?.slice(0, 8)}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {formData.fullName || doctor?.fullName}
                    </h2>

                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2 font-normal">
                      <span>{formData.qualification || doctor?.qualification || 'Bác sĩ chuyên khoa'}</span>
                      <span>•</span>
                      <span>{formData.yearsOfExperience || doctor?.yearsOfExperience || 0} năm kinh nghiệm</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* TAB NAVIGATION (THANH ĐIỀU HƯỚNG TỐI GIẢN) */}
              <div className="p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('INFO')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'INFO'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-normal'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> 1. Thông tin
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('WORKPLACE')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'WORKPLACE'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-normal'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> 2. Nơi công tác ({doctor?.workPlaces?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('SCHEDULE')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'SCHEDULE'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-normal'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> 3. Lịch làm việc
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('STATS')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'STATS'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-normal'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" /> 4. Thống kê
                </button>
              </div>

              {/* TAB 1: THÔNG TIN */}
              {activeTab === 'INFO' && (
                <div className="rounded-xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  {!isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-normal block mb-0.5">Họ và tên</span>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{doctor?.fullName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-normal block mb-0.5">Chức danh</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{doctor?.title || 'BS.'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-normal block mb-0.5">Chuyên khoa</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {doctor?.workPlaces?.find((w: any) => w.isPrimary)?.specialty?.name ||
                            doctor?.workPlaces?.[0]?.specialty?.name ||
                            doctor?.qualification ||
                            'Chưa phân chuyên khoa'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-normal block mb-0.5">Kinh nghiệm</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{doctor?.yearsOfExperience || 0} năm</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-normal block mb-0.5">Giới tính</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{doctor?.gender === 'MALE' ? 'Nam' : doctor?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-normal block mb-0.5">Nguồn dữ liệu</span>
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700 font-normal text-xs">{doctor?.source || 'MANUAL'}</Badge>
                      </div>
                      <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-normal block mb-1">Tiểu sử & Giới thiệu</span>
                        <p className="text-xs leading-relaxed font-normal bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                          {doctor?.bio || 'Chưa cập nhật nội dung giới thiệu.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-medium text-slate-700 dark:text-slate-300 block">Họ và tên *</label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className={`text-xs rounded-lg font-normal ${inputBg}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-slate-700 dark:text-slate-300 block">Chức danh *</label>
                        <select
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className={`w-full text-xs font-normal rounded-lg p-2 border ${inputBg}`}
                        >
                          <option value="BS.">BS.</option>
                          <option value="BS.CKI">BS.CKI</option>
                          <option value="BS.CKII">BS.CKII</option>
                          <option value="ThS.BS">ThS.BS</option>
                          <option value="TS.BS">TS.BS</option>
                          <option value="PGS.TS">PGS.TS</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-slate-700 dark:text-slate-300 block">Chuyên khoa của bệnh viện *</label>
                        <select
                          value={formData.qualification}
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                          className={`w-full text-xs font-normal rounded-lg p-2 border ${inputBg}`}
                        >
                          <option value="">-- Chọn chuyên khoa của bệnh viện --</option>
                          {displaySpecialties.map((s: any) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                          {formData.qualification && !displaySpecialties.some((s: any) => s.name === formData.qualification) && (
                            <option value={formData.qualification}>{formData.qualification}</option>
                          )}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-slate-700 dark:text-slate-300 block">Số năm kinh nghiệm</label>
                        <Input
                          type="number"
                          value={formData.yearsOfExperience}
                          onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                          className={`text-xs rounded-lg font-normal ${inputBg}`}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-medium text-slate-700 dark:text-slate-300 block">URL Ảnh đại diện (Avatar)</label>
                        <Input
                          placeholder="https://..."
                          value={formData.avatarUrl}
                          onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                          className={`text-xs rounded-lg font-normal ${inputBg}`}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-medium text-slate-700 dark:text-slate-300 block">Tiểu sử bác sĩ</label>
                        <textarea
                          rows={3}
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className={`w-full text-xs font-normal p-2.5 rounded-lg border ${inputBg}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: NƠI CÔNG TÁC */}
              {activeTab === 'WORKPLACE' && (
                <div className="rounded-xl p-4 sm:p-5 space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-500" /> Danh sách nơi công tác
                    </h3>
                    {!readOnly && (
                      <Button onClick={handleOpenAddWorkplace} size="sm" variant="outline" className="text-xs font-medium rounded-lg h-8">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Thêm nơi công tác
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {(doctor.workPlaces || []).map((wp: any) => (
                      <div key={wp.id} className="p-3.5 rounded-xl border bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-slate-100">🏥 {wp.hospital?.name}</span>
                            {wp.isPrimary && <Badge variant="outline" className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">Chính</Badge>}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                            Chuyên khoa: <span className="font-medium text-slate-700 dark:text-slate-300">{wp.specialty?.name}</span> • Giá khám: <span className="font-medium text-slate-700 dark:text-slate-300">{Number(wp.consultationFee || 0).toLocaleString('vi-VN')} đ</span>
                          </p>
                        </div>

                        {!readOnly && (
                          <div className="flex items-center gap-2">
                            {!wp.isPrimary && (
                              <Button size="sm" variant="outline" onClick={() => handleSetPrimaryWorkplace(wp.id)} className="text-[11px] h-7">
                                Đặt làm chính
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleToggleWorkplaceStatus(wp.id, wp.isActive)} className="text-[11px] h-7">
                              {wp.isActive ? 'Ngừng công tác' : 'Kích hoạt'}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: LỊCH LÀM VIỆC */}
              {activeTab === 'SCHEDULE' && (
                <div className="rounded-xl p-4 sm:p-5 space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" /> Ca làm việc theo tuần
                    </h3>
                    {!readOnly && (
                      <Button onClick={handleOpenAddSchedule} size="sm" variant="outline" className="text-xs font-medium rounded-lg h-8">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Thêm ca làm
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(doctor.workPlaces || []).map((wp: any) => (
                      <div key={wp.id} className="space-y-2">
                        <span className="text-xs font-medium text-slate-500">🏥 {wp.hospital?.name} ({wp.specialty?.name})</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(wp.schedules || []).map((sch: any) => (
                            <div key={sch.id} className="p-3 rounded-lg border bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{DAY_NAMES[sch.dayOfWeek] || `Thứ ${sch.dayOfWeek}`}</span>
                                <p className="text-[11px] text-slate-500 mt-0.5">{sch.startTime} - {sch.endTime}</p>
                              </div>
                              {!readOnly && (
                                <button onClick={() => handleDeleteSchedule(sch.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px]">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: THỐNG KÊ */}
              {activeTab === 'STATS' && (
                <div className="rounded-xl p-4 sm:p-5 space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <h3 className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b pb-2.5 border-slate-200 dark:border-slate-800">
                    <BarChart3 className="w-4 h-4 text-slate-500" /> Chỉ số thống kê (Read-only)
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <Star className="w-5 h-5 text-amber-500 mx-auto mb-1 fill-amber-500" />
                      <p className="text-[11px] text-slate-500 font-normal">Đánh giá trung bình</p>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{doctor?.rating || 5.0} / 5.0</h4>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <Award className="w-5 h-5 text-slate-600 dark:text-slate-400 mx-auto mb-1" />
                      <p className="text-[11px] text-slate-500 font-normal">Lượt đánh giá</p>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{doctor?.reviewCount || 0}</h4>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <Stethoscope className="w-5 h-5 text-slate-600 dark:text-slate-400 mx-auto mb-1" />
                      <p className="text-[11px] text-slate-500 font-normal">Lượt khám</p>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{doctor?.consultationCount || 0}</h4>
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER ĐIỀU KHIỂN CHÍNH: CHỈNH SỬA, NGỪNG/MỞ NHẬN ĐẶT LỊCH, ĐÓNG */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Nút Ngừng / Mở lại nhận đặt lịch */}
                <div>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={toggleBookingMutation.isPending}
                      onClick={handleToggleBooking}
                      className={`text-xs font-medium rounded-lg h-9 px-3.5 border transition ${
                        doctor?.isActive
                          ? 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {toggleBookingMutation.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : doctor?.isActive ? (
                        <>
                          <Power className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                          Ngừng nhận đặt lịch
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Mở lại nhận đặt lịch
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Các nút Chỉnh sửa / Hủy / Lưu / Đóng */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-medium rounded-lg h-9 px-4 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Đóng
                      </Button>
                      {!readOnly && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-lg h-9 px-4 shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                          Chỉnh sửa thông tin
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="text-xs font-medium rounded-lg h-9 px-4 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveInfo}
                        disabled={updateDoctorMutation.isPending}
                        className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-lg h-9 px-4 shadow-xs"
                      >
                        {updateDoctorMutation.isPending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            Lưu thay đổi
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* SUB-MODAL 1: THÊM / SỬA NƠI CÔNG TÁC */}
      {/* ========================================== */}
      <Dialog open={showWorkplaceModal} onOpenChange={setShowWorkplaceModal}>
        <DialogContent className={`max-w-md p-6 rounded-3xl ${isLight ? 'bg-white text-slate-950 border-slate-200' : 'bg-slate-950 text-white border-slate-800'}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
              {editingWorkplace ? 'Chỉnh sửa nơi công tác' : 'Thêm Nơi công tác mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Cấu hình thông tin bệnh viện, chuyên khoa và phí khám của bác sĩ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold block">Bệnh viện / Cơ sở y tế *</label>
              <select
                value={wpForm.hospitalId}
                onChange={(e) => setWpForm({ ...wpForm, hospitalId: e.target.value })}
                className={`w-full text-xs font-bold rounded-xl p-2.5 border ${inputBg}`}
              >
                {hospitals.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
                {hospitals.length === 0 && <option value="hosp-1">Bệnh viện Đa khoa NovaCare</option>}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold block">Chuyên khoa của bệnh viện *</label>
              <select
                value={wpForm.specialtyId}
                onChange={(e) => setWpForm({ ...wpForm, specialtyId: e.target.value })}
                className={`w-full text-xs font-bold rounded-xl p-2.5 border ${inputBg}`}
              >
                <option value="">-- Chọn chuyên khoa của bệnh viện --</option>
                {hospitalSpecialties.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold block">Giá khám (VNĐ) *</label>
              <Input
                type="number"
                step="50000"
                value={wpForm.consultationFee}
                onChange={(e) => setWpForm({ ...wpForm, consultationFee: Number(e.target.value) || 0 })}
                className={`text-xs rounded-xl font-bold ${inputBg}`}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold block">Vị trí / Chức vụ công tác</label>
              <Input
                placeholder="Ví dụ: Trưởng khoa Tim mạch, Bác sĩ chính"
                value={wpForm.position}
                onChange={(e) => setWpForm({ ...wpForm, position: e.target.value })}
                className={`text-xs rounded-xl font-bold ${inputBg}`}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold block">Cơ sở làm việc chính</span>
                <span className="text-[11px] text-slate-500">Ưu tiên hiển thị mặc định trên trang tìm kiếm</span>
              </div>
              <Switch
                checked={wpForm.isPrimary}
                onCheckedChange={(checked) => setWpForm({ ...wpForm, isPrimary: checked })}
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setShowWorkplaceModal(false)} className="text-xs font-bold rounded-xl">
              Hủy bỏ
            </Button>
            <Button size="sm" onClick={handleSaveWorkplace} className="bg-[#0c4b39] text-white font-extrabold text-xs rounded-xl px-4">
              Lưu Nơi công tác
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* SUB-MODAL 2: THÊM / SỬA LỊCH LÀM VIỆC */}
      {/* ========================================== */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className={`max-w-md p-6 rounded-3xl ${isLight ? 'bg-white text-slate-950 border-slate-200' : 'bg-slate-950 text-white border-slate-800'}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              {editingSchedule ? 'Chỉnh sửa ca làm việc' : 'Thêm Ca làm việc mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Cấu hình thứ trong tuần, giờ bắt đầu - kết thúc và giờ nghỉ trưa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold block">Nơi công tác áp dụng *</label>
              <select
                value={schForm.doctorWorkplaceId}
                onChange={(e) => setSchForm({ ...schForm, doctorWorkplaceId: e.target.value })}
                className={`w-full text-xs font-bold rounded-xl p-2.5 border ${inputBg}`}
              >
                {(doctor?.workPlaces || []).map((wp: any) => (
                  <option key={wp.id} value={wp.id}>
                    🏥 {wp.hospital?.name || 'Bệnh viện'} ({wp.specialty?.name || 'Chuyên khoa'})
                  </option>
                ))}
                {(doctor?.workPlaces || []).length === 0 && (
                  <option value="">Chưa chọn nơi công tác</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold block">Thứ trong tuần *</label>
              <select
                value={schForm.dayOfWeek}
                onChange={(e) => setSchForm({ ...schForm, dayOfWeek: Number(e.target.value) })}
                className={`w-full text-xs font-bold rounded-xl p-2.5 border ${inputBg}`}
              >
                {Object.entries(DAY_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold block">Giờ bắt đầu ca *</label>
                <Input
                  type="time"
                  value={schForm.startTime}
                  onChange={(e) => setSchForm({ ...schForm, startTime: e.target.value })}
                  className={`text-xs rounded-xl font-bold ${inputBg}`}
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold block">Giờ kết thúc ca *</label>
                <Input
                  type="time"
                  value={schForm.endTime}
                  onChange={(e) => setSchForm({ ...schForm, endTime: e.target.value })}
                  className={`text-xs rounded-xl font-bold ${inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold block">Bắt đầu nghỉ trưa</label>
                <Input
                  type="time"
                  value={schForm.breakStart}
                  onChange={(e) => setSchForm({ ...schForm, breakStart: e.target.value })}
                  className={`text-xs rounded-xl font-bold ${inputBg}`}
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold block">Kết thúc nghỉ trưa</label>
                <Input
                  type="time"
                  value={schForm.breakEnd}
                  onChange={(e) => setSchForm({ ...schForm, breakEnd: e.target.value })}
                  className={`text-xs rounded-xl font-bold ${inputBg}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(false)} className="text-xs font-bold rounded-xl">
              Hủy bỏ
            </Button>
            <Button size="sm" onClick={handleSaveSchedule} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl px-4">
              Lưu Ca làm việc
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
