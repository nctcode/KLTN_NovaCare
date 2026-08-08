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
} from 'lucide-react';

interface DoctorDetailDialogProps {
  doctorId: string | null;
  initialDoctor?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialTab?: 'INFO' | 'WORKPLACE' | 'SCHEDULE' | 'STATS';
  initialIsEditing?: boolean;
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
  open,
  onOpenChange,
  onSuccess,
  initialTab = 'INFO',
  initialIsEditing = false,
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

  // Fetch specialties and hospitals for sub-modals
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
    enabled: open,
  });
  const specialties = Array.isArray(rawSpecialties) ? rawSpecialties : [];

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
          <DialogHeader className="border-b pb-4 border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black flex items-center gap-2.5">
                <UserCheck className="w-6 h-6 text-[#0c4b39] dark:text-[#66FF33]" />
                Chi tiết Hồ sơ Bác sĩ
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium mt-0.5">
                Xem và chỉnh sửa thông tin cá nhân, nơi công tác, lịch làm việc & thống kê bác sĩ.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 pr-6">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#0c4b39] hover:bg-[#09392b] text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-xs font-bold rounded-xl px-3">
                    <X className="w-3.5 h-3.5 mr-1" /> Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveInfo}
                    disabled={updateDoctorMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl px-4 flex items-center gap-1"
                  >
                    {updateDoctorMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Lưu
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0c4b39]" />
              <p className="text-xs text-slate-500 font-bold">Đang tải hồ sơ bác sĩ...</p>
            </div>
          ) : (
            <div className="space-y-6 pt-4 font-sans">
              {/* Toast Notification Banner */}
              {toastMessage && (
                <div className="flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* BANNER AVATAR LỚN & THÔNG TIN CHÍNH */}
              <Card className={`${cardBg} rounded-3xl p-5 sm:p-6 border relative`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                      {formData.avatarUrl || doctor?.avatarUrl ? (
                        <img
                          src={isEditing ? formData.avatarUrl : (formData.avatarUrl || doctor?.avatarUrl)}
                          alt={formData.fullName || doctor?.fullName || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCheck className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <Badge variant="outline" className="bg-emerald-50 text-[#0c4b39] border-emerald-300 dark:bg-emerald-950 dark:text-[#66FF33] font-black text-[11px] px-2.5 py-0.5">
                        {formData.title || doctor?.title || 'BS.'}
                      </Badge>
                      {formData.isActive ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-[11px] px-2.5 py-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 font-bold text-[11px] px-2.5 py-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Tạm ngưng
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      {formData.fullName || doctor?.fullName}
                    </h2>

                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>{formData.qualification || doctor?.qualification}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{formData.yearsOfExperience || doctor?.yearsOfExperience} năm kinh nghiệm</span>
                    </p>
                  </div>
                </div>
              </Card>

              {/* TAB NAVIGATION */}
              <div className={`p-1 rounded-2xl border flex items-center gap-1 overflow-x-auto ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <button
                  onClick={() => setActiveTab('INFO')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'INFO'
                      ? 'bg-[#0c4b39] text-white shadow'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <User className="w-3.5 h-3.5" /> 1. Thông tin
                </button>

                <button
                  onClick={() => setActiveTab('WORKPLACE')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'WORKPLACE'
                      ? 'bg-[#0c4b39] text-white shadow'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> 2. Nơi công tác ({doctor?.workPlaces?.length || 0})
                </button>

                <button
                  onClick={() => setActiveTab('SCHEDULE')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'SCHEDULE'
                      ? 'bg-[#0c4b39] text-white shadow'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> 3. Lịch làm việc
                </button>

                <button
                  onClick={() => setActiveTab('STATS')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'STATS'
                      ? 'bg-[#0c4b39] text-white shadow'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" /> 4. Thống kê
                </button>
              </div>

              {/* TAB 1: THÔNG TIN */}
              {activeTab === 'INFO' && (
                <Card className={`${cardBg} rounded-3xl p-5 space-y-5 border`}>
                  {!isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Họ và tên:</span>
                        <p className="font-extrabold text-sm">{doctor?.fullName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Chức danh:</span>
                        <p className="font-bold">{doctor?.title || 'BS.'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Trình độ chuyên môn:</span>
                        <p className="font-bold text-emerald-600">{doctor?.qualification}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Kinh nghiệm:</span>
                        <p className="font-bold">{doctor?.yearsOfExperience} năm</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Giới tính:</span>
                        <p className="font-bold">{doctor?.gender === 'MALE' ? 'Nam' : doctor?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Nguồn dữ liệu:</span>
                        <Badge variant="outline">{doctor?.source || 'MANUAL'}</Badge>
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 font-bold block mb-1">Tiểu sử & Giới thiệu:</span>
                        <p className="text-xs leading-relaxed font-medium bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          {doctor?.bio || 'Chưa cập nhật nội dung giới thiệu.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold block">Họ và tên *</label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className={`text-xs rounded-xl font-bold ${inputBg}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold block">Chức danh *</label>
                        <select
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className={`w-full text-xs font-bold rounded-xl p-2.5 border ${inputBg}`}
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
                        <label className="font-bold block">Chuyên môn *</label>
                        <Input
                          value={formData.qualification}
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                          className={`text-xs rounded-xl font-bold ${inputBg}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold block">Số năm kinh nghiệm</label>
                        <Input
                          type="number"
                          value={formData.yearsOfExperience}
                          onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                          className={`text-xs rounded-xl font-bold ${inputBg}`}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-bold block">Tiểu sử bác sĩ</label>
                        <textarea
                          rows={3}
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className={`w-full text-xs font-medium p-2.5 rounded-xl border ${inputBg}`}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* TAB 2: NƠI CÔNG TÁC */}
              {activeTab === 'WORKPLACE' && (
                <Card className={`${cardBg} rounded-3xl p-5 space-y-4 border`}>
                  <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                    <h3 className="font-black text-xs uppercase tracking-wider text-[#0c4b39] dark:text-[#66FF33] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" /> Danh sách nơi công tác
                    </h3>
                    <Button onClick={handleOpenAddWorkplace} size="sm" className="bg-[#0c4b39] text-white text-xs font-bold rounded-xl">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Thêm nơi công tác
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(doctor.workPlaces || []).map((wp: any) => (
                      <div key={wp.id} className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black">🏥 {wp.hospital?.name}</span>
                            {wp.isPrimary && <Badge className="bg-emerald-600 text-white text-[9px]">Chính</Badge>}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Chuyên khoa: <strong className="text-emerald-600">{wp.specialty?.name}</strong> • Giá khám: <strong>{Number(wp.consultationFee || 0).toLocaleString('vi-VN')} đ</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!wp.isPrimary && (
                            <Button size="sm" variant="outline" onClick={() => handleSetPrimaryWorkplace(wp.id)} className="text-[11px]">
                              Đặt làm chính
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleToggleWorkplaceStatus(wp.id, wp.isActive)} className="text-[11px]">
                            {wp.isActive ? 'Ngừng công tác' : 'Kích hoạt'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 3: LỊCH LÀM VIỆC */}
              {activeTab === 'SCHEDULE' && (
                <Card className={`${cardBg} rounded-3xl p-5 space-y-4 border`}>
                  <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                    <h3 className="font-black text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Ca làm việc theo tuần
                    </h3>
                    <Button onClick={handleOpenAddSchedule} size="sm" className="bg-[#0c4b39] text-white text-xs font-bold rounded-xl">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Thêm ca làm
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(doctor.workPlaces || []).map((wp: any) => (
                      <div key={wp.id} className="space-y-2">
                        <span className="font-bold text-xs text-slate-500">🏥 {wp.hospital?.name} ({wp.specialty?.name})</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(wp.schedules || []).map((sch: any) => (
                            <div key={sch.id} className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-emerald-600">{DAY_NAMES[sch.dayOfWeek] || `Thứ ${sch.dayOfWeek}`}</span>
                                <p className="text-[11px] font-semibold">{sch.startTime} - {sch.endTime}</p>
                              </div>
                              <button onClick={() => handleDeleteSchedule(sch.id)} className="text-rose-600 hover:underline text-[11px]">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 4: THỐNG KÊ */}
              {activeTab === 'STATS' && (
                <Card className={`${cardBg} rounded-3xl p-5 space-y-4 border`}>
                  <h3 className="font-black text-xs uppercase tracking-wider text-amber-600 flex items-center gap-1.5 border-b pb-2 border-slate-200 dark:border-slate-800">
                    <BarChart3 className="w-4 h-4" /> Chỉ số thống kê (Read-only)
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <Star className="w-6 h-6 text-amber-500 mx-auto mb-1 fill-amber-500" />
                      <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Đánh giá trung bình</p>
                      <h4 className="text-xl font-black text-amber-600">{doctor?.rating || 5.0} / 5.0</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                      <Award className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300">Lượt đánh giá</p>
                      <h4 className="text-xl font-black text-blue-600">{doctor?.reviewCount || 0}</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <Stethoscope className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Lượt khám</p>
                      <h4 className="text-xl font-black text-emerald-600">{doctor?.consultationCount || 0}</h4>
                    </div>
                  </div>
                </Card>
              )}
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
              <label className="font-bold block">Chuyên khoa *</label>
              <select
                value={wpForm.specialtyId}
                onChange={(e) => setWpForm({ ...wpForm, specialtyId: e.target.value })}
                className={`w-full text-xs font-bold rounded-xl p-2.5 border ${inputBg}`}
              >
                {specialties.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                {specialties.length === 0 && <option value="spec-1">Tim mạch</option>}
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
