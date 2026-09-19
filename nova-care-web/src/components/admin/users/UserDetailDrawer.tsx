'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Activity,
  CreditCard,
  Lock,
  Unlock,
  KeyRound,
  Bell,
  Users,
  Loader2,
  Send,
} from 'lucide-react';
import { AdminUserItem, AccountStatus } from './types';
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

  // Sub-modals
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

  if (!isOpen || !user) return null;

  const profiles = user.patientProfiles || [];
  const currentProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddInternalNote(user.id, newNoteContent.trim());
    setNewNoteContent('');
  };

  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await onSendNotification(user.id, notifTitle.trim(), notifMessage.trim());
      setShowNotifModal(false);
      setNotifTitle('');
      setNotifMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common table styles
  const labelCellClass = `w-[150px] sm:w-[180px] px-3 py-2 text-slate-500 font-medium border-r ${
    isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/60 border-slate-800'
  }`;
  const valueCellClass = 'px-3 py-2 text-slate-900 dark:text-slate-100 font-normal';
  const tableContainerClass = `rounded-lg border overflow-hidden ${
    isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950'
  }`;
  const sectionHeaderClass = `px-3 py-1.5 font-bold text-xs border-b ${
    isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-900 text-slate-200 border-slate-800'
  }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        onClick={onClose}
      >
        {/* Centered Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-3xl flex flex-col rounded-xl border shadow-xl overflow-hidden max-h-[90vh] ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {user.fullName}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      user.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>SĐT: {user.phone}</span>
                  <span>•</span>
                  <span>Email: {user.email || 'Chưa đăng ký'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold transition whitespace-nowrap ${
                activeTab === 'info'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Thông tin tài khoản
            </button>

            <button
              onClick={() => setActiveTab('profiles')}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold transition whitespace-nowrap ${
                activeTab === 'profiles'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Hồ sơ bệnh nhân ({profiles.length})
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold transition whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Hoạt động & Ghi chú
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold transition whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Lịch sử thanh toán ({user.paymentRecords?.length || 0})
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {/* TAB 1: THÔNG TIN TÀI KHOẢN */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className={tableContainerClass}>
                  <div className={sectionHeaderClass}>1. Bảng thông tin tài khoản người dùng</div>
                  <table className="w-full text-xs border-collapse">
                    <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                      <tr>
                        <td className={labelCellClass}>Mã tài khoản (ID)</td>
                        <td className={`${valueCellClass} font-mono`}>{user.id}</td>
                      </tr>
                      <tr>
                        <td className={labelCellClass}>Họ và tên</td>
                        <td className={`${valueCellClass} font-semibold`}>{user.fullName}</td>
                      </tr>
                      <tr>
                        <td className={labelCellClass}>Số điện thoại</td>
                        <td className={`${valueCellClass} font-mono`}>{user.phone}</td>
                      </tr>
                      <tr>
                        <td className={labelCellClass}>Địa chỉ Email</td>
                        <td className={valueCellClass}>{user.email || 'Chưa cập nhật'}</td>
                      </tr>
                      <tr>
                        <td className={labelCellClass}>Vai trò hệ thống</td>
                        <td className={valueCellClass}>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {user.role || 'USER'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className={labelCellClass}>Trạng thái tài khoản</td>
                        <td className={valueCellClass}>
                          <span className={`font-semibold ${user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tài khoản đã bị khóa'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className={labelCellClass}>Ngày đăng ký</td>
                        <td className={valueCellClass}>{new Date(user.createdAt).toLocaleString('vi-VN')}</td>
                      </tr>
                      <tr>
                        <td className={labelCellClass}>Đăng nhập gần nhất</td>
                        <td className={valueCellClass}>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: HỒ SƠ BỆNH NHÂN */}
            {activeTab === 'profiles' && (
              <div className="space-y-4">
                {profiles.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg">
                    Chưa có hồ sơ bệnh nhân nào được liên kết.
                  </div>
                ) : (
                  <>
                    {/* Profile Selector if more than 1 */}
                    {profiles.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Chọn hồ sơ:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {profiles.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedProfileId(p.id)}
                              className={`px-2.5 py-1 rounded-lg border text-xs transition ${
                                selectedProfileId === p.id
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                                  : isLight
                                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              {p.fullName} {p.isDefault ? '(Mặc định)' : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Profile Detail Table */}
                    {currentProfile && (
                      <div className={tableContainerClass}>
                        <div className={sectionHeaderClass}>
                          Chi tiết hồ sơ bệnh nhân: {currentProfile.fullName}
                        </div>
                        <table className="w-full text-xs border-collapse">
                          <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                            <tr>
                              <td className={labelCellClass}>Họ và tên</td>
                              <td className={`${valueCellClass} font-semibold`}>{currentProfile.fullName}</td>
                            </tr>
                            <tr>
                              <td className={labelCellClass}>Mối quan hệ</td>
                              <td className={valueCellClass}>{currentProfile.relation || 'Bản thân'}</td>
                            </tr>
                            <tr>
                              <td className={labelCellClass}>Mã CCCD / Định danh</td>
                              <td className={`${valueCellClass} font-mono`}>
                                {currentProfile.maskedCccd || currentProfile.identityNumber || 'Chưa cập nhật'}
                              </td>
                            </tr>
                            <tr>
                              <td className={labelCellClass}>Mã thẻ BHYT</td>
                              <td className={`${valueCellClass} font-mono font-medium text-emerald-600`}>
                                {currentProfile.healthInsurance || 'Chưa cập nhật'}
                              </td>
                            </tr>
                            <tr>
                              <td className={labelCellClass}>Giới tính</td>
                              <td className={valueCellClass}>
                                {currentProfile.gender === 'MALE' ? 'Nam' : currentProfile.gender === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật'}
                              </td>
                            </tr>
                            <tr>
                              <td className={labelCellClass}>Ngày sinh</td>
                              <td className={valueCellClass}>
                                {currentProfile.dateOfBirth ? new Date(currentProfile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                              </td>
                            </tr>
                            <tr>
                              <td className={labelCellClass}>Địa chỉ thường trú</td>
                              <td className={valueCellClass}>{currentProfile.address || 'Chưa cập nhật'}</td>
                            </tr>
                            <tr>
                              <td className={labelCellClass}>Tiền sử y tế</td>
                              <td className={valueCellClass}>{currentProfile.medicalHistory || 'Không có'}</td>
                            </tr>
                            <tr>
                              <td className={labelCellClass}>Dị ứng thuốc/thức ăn</td>
                              <td className={valueCellClass}>{currentProfile.allergies || 'Không có'}</td>
                            </tr>
                            <tr>
                              <td className={labelCellClass}>Người liên hệ khẩn cấp</td>
                              <td className={valueCellClass}>
                                {currentProfile.emergencyContact ? `${currentProfile.emergencyContact} (${currentProfile.emergencyPhone || 'N/A'})` : 'Chưa cập nhật'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Booking History Table */}
                    {currentProfile?.bookingHistory && currentProfile.bookingHistory.length > 0 && (
                      <div className={tableContainerClass}>
                        <div className={sectionHeaderClass}>Lịch sử khám của hồ sơ</div>
                        <table className="w-full text-xs border-collapse">
                          <thead className={isLight ? 'bg-slate-50 border-b border-slate-200' : 'bg-slate-900 border-b border-slate-800'}>
                            <tr>
                              <th className="px-3 py-1.5 text-left font-semibold text-slate-500 w-[120px]">Mã lịch</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Cơ sở khám</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-slate-500 w-[120px]">Ngày khám</th>
                              <th className="px-3 py-1.5 text-right font-semibold text-slate-500 w-[110px]">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                            {currentProfile.bookingHistory.map((bk) => (
                              <tr key={bk.id}>
                                <td className="px-3 py-2 font-mono font-medium">#{bk.bookingCode}</td>
                                <td className="px-3 py-2">
                                  <div>{bk.hospitalName}</div>
                                  <div className="text-[11px] text-slate-500">{bk.specialtyName}</div>
                                </td>
                                <td className="px-3 py-2">{bk.appointmentDate}</td>
                                <td className="px-3 py-2 text-right font-medium">
                                  {bk.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã xác nhận'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 3: HOẠT ĐỘNG & GHI CHÚ */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {/* Notes Form */}
                <div className={tableContainerClass}>
                  <div className={sectionHeaderClass}>Ghi chú nội bộ của Quản trị viên</div>
                  <form onSubmit={handleAddNote} className="p-3 space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Nhập ghi chú cho tài khoản này..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!newNoteContent.trim()}
                        size="sm"
                        className="text-xs h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Lưu ghi chú
                      </Button>
                    </div>
                  </form>

                  {user.internalNotes && user.internalNotes.length > 0 && (
                    <div className={`border-t divide-y ${isLight ? 'border-slate-200 divide-slate-200' : 'border-slate-800 divide-slate-800'}`}>
                      {user.internalNotes.map((n) => (
                        <div key={n.id} className="p-3 text-xs">
                          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{n.adminName}</span>
                            <span className="font-mono">{n.createdAt}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: THANH TOÁN */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className={tableContainerClass}>
                  <div className={sectionHeaderClass}>Lịch sử thanh toán giao dịch</div>
                  {(!user.paymentRecords || user.paymentRecords.length === 0) ? (
                    <div className="p-6 text-center text-slate-500">
                      Chưa ghi nhận giao dịch thanh toán nào từ tài khoản này.
                    </div>
                  ) : (
                    <table className="w-full text-xs border-collapse">
                      <thead className={isLight ? 'bg-slate-50 border-b border-slate-200' : 'bg-slate-900 border-b border-slate-800'}>
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Mã GD</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Phương thức</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Thời gian</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-500">Số tiền</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-500">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                        {user.paymentRecords.map((pay) => (
                          <tr key={pay.id}>
                            <td className="px-3 py-2 font-mono font-medium">{pay.transactionId}</td>
                            <td className="px-3 py-2">
                              {pay.method === 'MOMO'
                                ? 'Ví MoMo'
                                : pay.method === 'VNPAY'
                                ? 'VNPay'
                                : pay.method === 'ATM_CARD'
                                ? 'Thẻ ATM'
                                : 'Tiền mặt'}
                            </td>
                            <td className="px-3 py-2">{pay.paymentDate}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold">
                              {pay.amount.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              <span
                                className={
                                  pay.status === 'SUCCESS'
                                    ? 'text-emerald-600'
                                    : pay.status === 'REFUNDED'
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }
                              >
                                {pay.status === 'SUCCESS' ? 'Thành công' : pay.status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Thất bại'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(user.id, user.status)}
                className={`text-xs h-8 px-2.5 rounded-lg font-medium ${
                  user.status === 'LOCKED'
                    ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    : 'border-rose-300 text-rose-700 hover:bg-rose-50'
                }`}
              >
                {user.status === 'LOCKED' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 mr-1" /> Mở khóa
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 mr-1" /> Khóa tài khoản
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(true)}
                className="text-xs h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1 text-slate-500" /> Reset mật khẩu
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifModal(true)}
                className="text-xs h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800"
              >
                <Bell className="w-3.5 h-3.5 mr-1 text-slate-500" /> Gửi thông báo
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 px-3 rounded-lg"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>

      {/* Modal 1: Reset Password Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <KeyRound className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span>Xác nhận Reset Mật khẩu</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Hệ thống sẽ tạo mật khẩu ngẫu nhiên tạm thời gửi tới người dùng <strong>{user.fullName}</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(false)}
                className="text-xs h-8 rounded-lg"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onResetPassword(user.id);
                  setShowResetModal(false);
                }}
                className="text-xs h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Tạo & Gửi mật khẩu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Send Notification */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>Gửi thông báo tới người dùng</span>
              </div>
              <button onClick={() => setShowNotifModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendNotif} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tiêu đề thông báo</label>
                <Input
                  required
                  placeholder="Nhập tiêu đề..."
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="text-xs rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Nội dung chi tiết</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập nội dung thông báo..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifModal(false)}
                  className="text-xs h-8 rounded-lg"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="text-xs h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
