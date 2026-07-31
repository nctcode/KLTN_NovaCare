'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Activity,
  CreditCard,
  History,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Bell,
  StickyNote,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  Building2,
  Stethoscope,
  Send,
  Loader2,
  Maximize2,
  Minimize2,
  Users,
  MapPin,
} from 'lucide-react';
import { AdminUserItem, AccountStatus, PatientProfileItem } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserDetailModalProps {
  user: AdminUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (userId: string, currentStatus: AccountStatus) => void;
  onResetPassword: (userId: string) => void;
  onSendNotification: (userId: string, title: string, message: string) => void;
  onAddInternalNote: (userId: string, note: string) => void;
  isLight?: boolean;
}

export const UserDetailDrawer: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onToggleStatus,
  onResetPassword,
  onSendNotification,
  onAddInternalNote,
  isLight = true,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'profiles' | 'activity' | 'payments'>('info');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Modals state
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.patientProfiles && user.patientProfiles.length > 0) {
      if (!selectedProfileId || !user.patientProfiles.some((p) => p.id === selectedProfileId)) {
        setSelectedProfileId(user.patientProfiles[0].id);
      }
    }
  }, [user, selectedProfileId]);

  const userActivities = React.useMemo(() => {
    if (!user) return [];
    const logs: Array<{
      id: string;
      title: string;
      description: string;
      timestamp: string;
      type: 'REGISTER' | 'LOGIN' | 'PROFILE' | 'BOOKING' | 'SECURITY';
    }> = [];

    // 1. Account Register & Login
    logs.push({
      id: `reg-${user.id}`,
      title: 'Tạo & Đăng ký tài khoản hệ thống',
      description: `Tài khoản người dùng được tạo thành công trên ứng dụng NovaCare.`,
      timestamp: new Date(user.createdAt).toLocaleString('vi-VN'),
      type: 'REGISTER',
    });

    if (user.lastLogin) {
      logs.push({
        id: `login-${user.id}`,
        title: 'Đăng nhập hệ thống gần nhất',
        description: `Người dùng đăng nhập thành công vào ứng dụng NovaCare.`,
        timestamp: new Date(user.lastLogin).toLocaleString('vi-VN'),
        type: 'LOGIN',
      });
    }

    // 2. Patient Profiles actions
    if (user.patientProfiles && user.patientProfiles.length > 0) {
      user.patientProfiles.forEach((prof) => {
        logs.push({
          id: `prof-${prof.id}`,
          title: `Thêm hồ sơ bệnh nhân: ${prof.fullName}`,
          description: `Đã khởi tạo hồ sơ bệnh nhân (${prof.relation || 'Bản thân'}) để hỗ trợ đăng ký khám chữa bệnh.`,
          timestamp: prof.createdAt
            ? new Date(prof.createdAt).toLocaleString('vi-VN')
            : new Date(user.createdAt).toLocaleString('vi-VN'),
          type: 'PROFILE',
        });
      });
    }

    // 3. Account Logs from DB / Mock
    if (user.accountLogs && user.accountLogs.length > 0) {
      user.accountLogs.forEach((l) => {
        if (l.action !== 'REGISTER' && l.action !== 'LOGIN') {
          logs.push({
            id: l.id,
            title: l.title,
            description: l.description,
            timestamp: l.timestamp,
            type: 'SECURITY',
          });
        }
      });
    }

    // 4. Booking actions
    if (user.bookingHistory && user.bookingHistory.length > 0) {
      user.bookingHistory.forEach((bk) => {
        logs.push({
          id: `bk-${bk.id}`,
          title: bk.status === 'CANCELLED' ? `Hủy lịch khám: ${bk.bookingCode}` : `Đặt lịch khám thành công: ${bk.bookingCode}`,
          description: `Lịch khám tại ${bk.hospitalName} (${bk.specialtyName}) vào ngày ${bk.appointmentDate}.`,
          timestamp: bk.appointmentDate,
          type: 'BOOKING',
        });
      });
    }

    return logs;
  }, [user]);

  if (!isOpen || !user) return null;

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Hoạt động
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-950 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            Đã khóa
          </span>
        );
      default:
        return null;
    }
  };

  const handleSendNotif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSendNotification(user.id, notifTitle, notifMessage);
      setNotifTitle('');
      setNotifMessage('');
      setShowNotifModal(false);
      setIsSubmitting(false);
    }, 300);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddInternalNote(user.id, newNoteContent);
    setNewNoteContent('');
  };

  const profiles: PatientProfileItem[] = user.patientProfiles || [];
  const currentProfile: PatientProfileItem | null =
    profiles.find((p) => p.id === selectedProfileId) || profiles[0] || null;



  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        {/* Centered Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full flex flex-col transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border border-slate-300 bg-white text-slate-950 ${
            isFullScreen
              ? 'h-full max-w-none rounded-none'
              : 'max-w-5xl max-h-[92vh]'
          }`}
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-300"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center">
                    {user.fullName.charAt(0)}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-950 tracking-tight">
                    {user.fullName}
                  </h2>
                  {getStatusBadge(user.status)}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-semibold text-slate-900">
                  <span>Mã ID: <code className="font-mono text-slate-950 font-bold bg-slate-200 px-1.5 py-0.5 rounded">{user.id}</code></span>
                  <span>•</span>
                  <span>SĐT: <strong className="text-slate-950 font-bold">{user.phone}</strong></span>
                  <span>•</span>
                  <span>Email: <span className="text-slate-950 font-bold truncate max-w-[200px] inline-block align-bottom">{user.email || 'Chưa đăng ký'}</span></span>
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? 'Thu nhỏ giữa màn hình' : 'Mở phóng to toàn màn hình'}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-800 transition"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-6 gap-2 bg-white overflow-x-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs border-b-2 transition whitespace-nowrap ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-800 font-bold hover:text-blue-700'
              }`}
            >
              <User className="w-4 h-4" />
              Thông Tin Tài Khoản
            </button>

            <button
              onClick={() => setActiveTab('profiles')}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs border-b-2 transition whitespace-nowrap ${
                activeTab === 'profiles'
                  ? 'border-blue-600 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-800 font-bold hover:text-blue-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Hồ Sơ Bệnh Nhân ({user.patientProfilesCount || profiles.length})
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs border-b-2 transition whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-800 font-bold hover:text-blue-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              Hoạt Động Tài Khoản ({userActivities.length})
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs border-b-2 transition whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'border-blue-600 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-800 font-bold hover:text-blue-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Thanh Toán ({user.paymentRecords?.length || 0})
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {/* TAB 1: THÔNG TIN TÀI KHOẢN */}
            {activeTab === 'info' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Privacy Banner */}
                <div className="p-4 rounded-xl border border-slate-300 bg-white text-slate-950 flex items-start gap-3 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-slate-950">Quyền quản lý dữ liệu:</strong> Thông tin tài khoản được đăng ký bởi người dùng trên ứng dụng cá nhân NovaCare. Quản trị viên chỉ theo dõi và thực hiện khóa/mở khóa tài khoản khi cần thiết.
                  </div>
                </div>

                {/* Personal Info Grid */}
                <div className="p-5 rounded-xl border border-slate-300 bg-white space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">Thông tin cá nhân</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                    <div>
                      <span className="text-slate-900 font-bold block mb-1">Họ và tên</span>
                      <div className="font-extrabold text-slate-950 text-sm truncate max-w-[200px]" title={user.fullName}>
                        {user.fullName}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-900 font-bold block mb-1">Số điện thoại</span>
                      <div className="font-extrabold text-slate-950 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-700" />
                        {user.phone}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-900 font-bold block mb-1">Email liên hệ</span>
                      <div className="font-extrabold text-slate-950 flex items-center gap-1.5 truncate max-w-[220px]" title={user.email}>
                        <Mail className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                        <span className="truncate">{user.email || 'Chưa đăng ký'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-900 font-bold block mb-1">Ngày đăng ký tài khoản</span>
                      <div className="font-extrabold text-slate-950 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-700" />
                        {new Date(user.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-900 font-bold block mb-1">Đăng nhập gần nhất</span>
                      <div className="font-extrabold text-slate-950 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-700" />
                        {new Date(user.lastLogin).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HỒ SƠ BỆNH NHÂN (PATIENT PROFILES) */}
            {activeTab === 'profiles' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Info Banner */}
                <div className="p-4 rounded-xl border border-slate-300 bg-white text-slate-950 text-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-950 text-sm">Danh sách Hồ sơ Bệnh nhân của tài khoản</h4>
                      <p className="text-slate-600 text-xs mt-0.5 font-medium">
                        Tài khoản này quản lý <strong className="text-slate-950">{profiles.length}</strong> hồ sơ. Chọn từng hồ sơ để xem chi tiết mã CCCD (đã che bớt bảo mật), BHYT và lịch sử đặt khám.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profiles Selection Horizontal Row / Cards */}
                {profiles.length === 0 ? (
                  <div className="p-8 text-center border border-slate-300 bg-white rounded-xl text-xs text-slate-700 font-bold">
                    Chưa có hồ sơ bệnh nhân nào được tạo cho tài khoản này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {profiles.map((prof) => {
                      const isSelected = currentProfile?.id === prof.id;
                      return (
                        <button
                          key={prof.id}
                          type="button"
                          onClick={() => setSelectedProfileId(prof.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                              : 'border-slate-300 bg-white hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5">
                              <span>{prof.fullName}</span>
                              {prof.isDefault && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-950 rounded border border-emerald-300">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded-full shrink-0">
                              {prof.relation || 'Bản thân'}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1 text-xs text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>
                                CCCD:{' '}
                                <strong className="font-mono text-slate-950">
                                  {prof.maskedCccd ||
                                    (prof.identityNumber
                                      ? prof.identityNumber.length >= 12
                                        ? `${prof.identityNumber.slice(0, 6)}******${prof.identityNumber.slice(-4)}`
                                        : `${prof.identityNumber.slice(0, 3)}***`
                                      : 'Chưa xác minh')}
                                </strong>
                              </span>
                            </div>
                            {prof.healthInsurance && (
                              <div className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                <span>
                                  BHYT: <strong className="font-mono text-slate-950">{prof.healthInsurance}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected Profile Detailed Card */}
                {currentProfile && (
                  <div className="p-5 rounded-2xl border border-slate-300 bg-white space-y-6 shadow-xs">
                    {/* Profile Header Title */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-base flex items-center justify-center">
                          {currentProfile.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-950">{currentProfile.fullName}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-950 border border-slate-300">
                              Quan hệ: {currentProfile.relation || 'Bản thân'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">
                            {currentProfile.isDefault
                              ? 'Hồ sơ mặc định tự động chọn khi đặt khám.'
                              : 'Hồ sơ người thân được đăng ký đặt khám.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Grid Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                      {/* CCCD (Che bớt) */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-900 font-bold block mb-1">Mã CCCD / Định danh</span>
                        <div className="font-mono font-black text-slate-950 text-sm flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>
                            {currentProfile.maskedCccd ||
                              (currentProfile.identityNumber
                                ? currentProfile.identityNumber.length >= 12
                                  ? `${currentProfile.identityNumber.slice(0, 6)}******${currentProfile.identityNumber.slice(-4)}`
                                  : `${currentProfile.identityNumber.slice(0, 3)}***`
                                : 'Chưa xác minh CCCD')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">Đã che bớt để bảo vệ dữ liệu cá nhân</span>
                      </div>

                      {/* BHYT */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-900 font-bold block mb-1">Thẻ Bảo Hiểm Y Tế (BHYT)</span>
                        <div className="font-mono font-black text-slate-950 text-sm flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span>{currentProfile.healthInsurance || 'Chưa cập nhật BHYT'}</span>
                        </div>
                      </div>

                      {/* Ngày sinh & Giới tính */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-900 font-bold block mb-1">Giới tính & Ngày sinh</span>
                        <div className="font-extrabold text-slate-950 text-xs space-y-1">
                          <div>
                            Giới tính: <strong>{currentProfile.gender === 'MALE' ? 'Nam' : currentProfile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</strong>
                          </div>
                          <div>
                            Ngày sinh: <strong>{currentProfile.dateOfBirth ? new Date(currentProfile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Địa chỉ */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-900 font-bold block mb-1">Địa chỉ thường trú</span>
                        <div className="font-extrabold text-slate-950 text-xs flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                          <span>{currentProfile.address || 'Chưa cập nhật địa chỉ'}</span>
                        </div>
                      </div>

                      {/* Tiền sử y tế & Dị ứng */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-900 font-bold block mb-1">Tiền sử y tế & Dị ứng</span>
                        <div className="font-semibold text-slate-950 text-xs space-y-1">
                          <div>
                            Tiền sử: <strong>{currentProfile.medicalHistory || 'Không có'}</strong>
                          </div>
                          <div>
                            Dị ứng: <strong className="text-rose-700">{currentProfile.allergies || 'Không có'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Người liên hệ khẩn cấp */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-900 font-bold block mb-1">Người liên hệ khẩn cấp</span>
                        <div className="font-extrabold text-slate-950 text-xs space-y-1">
                          <div>
                            Họ tên: <strong>{currentProfile.emergencyContact || 'Chưa cập nhật'}</strong>
                          </div>
                          <div>
                            SĐT: <strong>{currentProfile.emergencyPhone || 'Chưa cập nhật'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Specific Booking History */}
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Lịch sử đặt khám của riêng hồ sơ ({currentProfile.fullName})
                      </h4>

                      {(!currentProfile.bookingHistory || currentProfile.bookingHistory.length === 0) ? (
                        <div className="p-6 text-center border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium">
                          Hồ sơ này chưa có lịch sử đặt khám riêng.
                        </div>
                      ) : (
                        <div className="border border-slate-300 rounded-xl overflow-hidden text-xs bg-white">
                          <table className="w-full text-left whitespace-nowrap">
                            <thead className="font-bold uppercase text-xs bg-slate-100 text-slate-950 border-b border-slate-300">
                              <tr>
                                <th className="p-3">Mã lịch</th>
                                <th className="p-3">Bệnh viện & Chuyên khoa</th>
                                <th className="p-3">Ngày khám</th>
                                <th className="p-3 text-right">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {currentProfile.bookingHistory.map((bk) => (
                                <tr key={bk.id} className="hover:bg-slate-100">
                                  <td className="p-3 font-mono font-bold text-slate-950">{bk.bookingCode}</td>
                                  <td className="p-3">
                                    <div className="font-bold text-slate-950">{bk.hospitalName}</div>
                                    <div className="text-xs text-slate-600">
                                      {bk.specialtyName} {bk.doctorName ? `• ${bk.doctorName}` : ''}
                                    </div>
                                  </td>
                                  <td className="p-3 font-bold text-slate-950">{bk.appointmentDate}</td>
                                  <td className="p-3 text-right">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        bk.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-950' : 'bg-amber-100 text-amber-950'
                                      }`}
                                    >
                                      {bk.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đã xác nhận'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: HOẠT ĐỘNG TÀI KHOẢN */}
            {activeTab === 'activity' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Info Banner */}
                <div className="p-4 rounded-xl border border-slate-300 bg-white text-slate-950 text-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-950 text-sm">Nhật ký hoạt động của tài khoản</h4>
                      <p className="text-slate-600 text-xs mt-0.5 font-medium">
                        Theo dõi lịch sử tương tác như đăng ký, đăng nhập, thêm/cập nhật hồ sơ bệnh nhân, đặt và hủy lịch khám.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                    Timeline lịch sử hoạt động ({userActivities.length})
                  </h3>

                  {userActivities.length === 0 ? (
                    <div className="p-8 text-center border border-slate-300 bg-white rounded-xl text-xs text-slate-900 font-bold">
                      Chưa có hoạt động nào được ghi nhận
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
                      {userActivities.map((act) => (
                        <div key={act.id} className="relative flex items-start gap-3">
                          <div
                            className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white shrink-0 ${
                              act.type === 'REGISTER'
                                ? 'bg-emerald-600'
                                : act.type === 'LOGIN'
                                ? 'bg-blue-600'
                                : act.type === 'PROFILE'
                                ? 'bg-purple-600'
                                : act.type === 'BOOKING'
                                ? 'bg-amber-600'
                                : 'bg-slate-700'
                            }`}
                          />
                          <div className="p-4 rounded-xl border border-slate-300 bg-white text-xs space-y-1.5 w-full shadow-2xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                                {act.title}
                              </span>
                              <span className="text-xs font-bold text-slate-900 font-mono">
                                {act.timestamp}
                              </span>
                            </div>
                            <p className="text-slate-700 font-medium">{act.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Internal Notes Section */}
                <div className="pt-4 border-t border-slate-300 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                    <StickyNote className="w-4 h-4 text-amber-600" /> Ghi chú nội bộ Admin
                  </h3>

                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Nhập ghi chú nội bộ..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white text-slate-950 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!newNoteContent.trim()}
                        size="sm"
                        className="text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                      >
                        Lưu ghi chú
                      </Button>
                    </div>
                  </form>

                  {user.internalNotes && user.internalNotes.length > 0 && (
                    <div className="space-y-2">
                      {user.internalNotes.map((n) => (
                        <div key={n.id} className="p-3.5 rounded-lg bg-white border border-slate-300 text-xs">
                          <div className="flex items-center justify-between text-slate-950 font-bold mb-1">
                            <span>{n.adminName}</span>
                            <span className="font-mono text-xs text-slate-900">{n.createdAt}</span>
                          </div>
                          <p className="text-slate-950 font-medium">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: THANH TOÁN */}
            {activeTab === 'payments' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">Lịch sử giao dịch</h3>

                  {(!user.paymentRecords || user.paymentRecords.length === 0) ? (
                    <div className="p-8 text-center border border-slate-300 bg-white rounded-xl text-xs text-slate-900 font-bold">
                      Chưa có giao dịch thanh toán
                    </div>
                  ) : (
                    <div className="border border-slate-300 rounded-xl overflow-hidden text-xs bg-white">
                      <table className="w-full text-left whitespace-nowrap">
                        <thead className="font-bold uppercase text-xs bg-slate-100 text-slate-950 border-b border-slate-300">
                          <tr>
                            <th className="p-3.5">Mã Giao dịch</th>
                            <th className="p-3.5">Phương thức</th>
                            <th className="p-3.5">Ngày thanh toán</th>
                            <th className="p-3.5">Số tiền</th>
                            <th className="p-3.5 text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {user.paymentRecords.map((pay) => (
                            <tr key={pay.id} className="hover:bg-slate-100">
                              <td className="p-3.5 font-mono font-bold text-slate-950">
                                {pay.transactionId}
                              </td>
                              <td className="p-3.5 font-bold text-slate-950">
                                {pay.method === 'MOMO'
                                  ? 'Ví MoMo'
                                  : pay.method === 'VNPAY'
                                  ? 'VNPay QR'
                                  : pay.method === 'ATM_CARD'
                                  ? 'Thẻ ATM/Visa'
                                  : 'Tiền mặt'}
                              </td>
                              <td className="p-3.5 font-bold text-slate-950">
                                {pay.paymentDate}
                              </td>
                              <td className="p-3.5 font-black text-slate-950">
                                {pay.amount.toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-3.5 text-right">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    pay.status === 'SUCCESS'
                                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                      : pay.status === 'REFUNDED'
                                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                      : 'bg-rose-100 text-rose-950 border border-rose-300'
                                  }`}
                                >
                                  {pay.status === 'SUCCESS'
                                    ? 'Thành công'
                                    : pay.status === 'REFUNDED'
                                    ? 'Đã hoàn tiền'
                                    : 'Thất bại'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(user.id, user.status)}
                className={`text-xs font-bold rounded-lg ${
                  user.status === 'LOCKED'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
                    : 'border-rose-400 bg-rose-50 text-rose-950 hover:bg-rose-100'
                }`}
              >
                {user.status === 'LOCKED' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 mr-1.5" /> Mở khóa tài khoản
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 mr-1.5" /> Khóa tài khoản
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(true)}
                className="text-xs font-bold rounded-lg border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5 text-slate-700" /> Reset mật khẩu
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifModal(true)}
                className="text-xs font-bold rounded-lg border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
              >
                <Bell className="w-3.5 h-3.5 mr-1.5 text-slate-700" /> Gửi thông báo
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold border-slate-300 bg-white text-slate-950 hover:bg-slate-100 rounded-lg px-4"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>

      {/* Modal 1: Reset Password Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-300 bg-white text-slate-950 space-y-4">
            <div className="flex items-center gap-2 text-slate-950 font-black">
              <KeyRound className="w-5 h-5 text-slate-800" />
              <h3>Xác nhận Reset Mật khẩu</h3>
            </div>
            <p className="text-xs text-slate-900 font-medium">
              Hệ thống sẽ tạo mật khẩu ngẫu nhiên tạm thời gửi tới người dùng <strong className="text-slate-950 font-bold">{user.fullName}</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(false)}
                className="text-xs font-bold rounded-lg border-slate-300 text-slate-950 hover:bg-slate-100"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onResetPassword(user.id);
                  setShowResetModal(false);
                }}
                className="text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Tạo & Gửi mật khẩu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Send Notification */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-300 bg-white text-slate-950 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-950 font-black">
                <Bell className="w-5 h-5 text-slate-800" />
                <h3>Gửi thông báo tới người dùng</h3>
              </div>
              <button onClick={() => setShowNotifModal(false)} className="text-slate-600 hover:text-slate-950">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendNotif} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-950 block mb-1">
                  Tiêu đề thông báo
                </label>
                <Input
                  required
                  placeholder="Tiêu đề..."
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="text-xs rounded-lg border-slate-300 bg-white text-slate-950 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-950 block mb-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nội dung..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white text-slate-950 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifModal(false)}
                  className="text-xs font-bold rounded-lg border-slate-300 text-slate-950 hover:bg-slate-100"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1" /> Gửi thông báo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
