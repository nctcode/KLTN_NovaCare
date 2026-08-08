'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building2,
  User,
  Stethoscope,
  Calendar,
  Clock,
  MapPin,
  Phone,
  FileText,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Hospital, Specialty, Doctor, MedicalService } from '@/types';
import { PatientProfile } from '@/types/profile.types';
import { formatPrice } from '@/lib/utils';

import { ClinicRoom } from './RoomSelectModal';
import { HospitalBookingMode } from './BookingTypeStep';

interface Step3ConfirmInfoProps {
  hospital: Hospital;
  specialty: Specialty | null;
  room?: ClinicRoom | null;
  doctor: Doctor | null;
  service: MedicalService | null;
  bookingMode?: HospitalBookingMode;
  selectedDate: string;
  selectedSlotTime: string;
  patientProfile: PatientProfile | null;
  reason: string;
  setReason: (reason: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3ConfirmInfo({
  hospital,
  specialty,
  room,
  doctor,
  service,
  bookingMode = 'doctor',
  selectedDate,
  selectedSlotTime,
  patientProfile,
  reason,
  setReason,
  onNext,
  onBack,
}: Step3ConfirmInfoProps) {
  const formattedDate = new Date(selectedDate).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const consultationFee = service?.price || (service as any)?.fee || (doctor as any)?.consultationFee || 300000;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0c4b39] to-emerald-900 text-white rounded-3xl p-6 shadow-md space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/10">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Bước 3 / 4 • Xác nhận thông tin</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          Kiểm Tra & Xác Nhận Phiếu Đặt Khám
        </h2>
        <p className="text-xs text-emerald-100/80 font-medium">
          Vui lòng kiểm tra kỹ thông tin cơ sở, bệnh nhân và lịch khám trước khi tiến hành thanh toán
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARD 1: THÔNG TIN BỆNH VIỆN / CƠ SỞ Y TẾ */}
          <Card className="border border-slate-200/90 shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0c4b39]" />
                  1. Thông tin Cơ sở Y tế
                </h3>
                <Badge className="bg-emerald-100 text-[#0c4b39] border border-emerald-200 text-[10px] font-bold">
                  Đối tác NovaCare
                </Badge>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 p-1">
                  {hospital.logoUrl ? (
                    <img src={hospital.logoUrl} alt={hospital.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Building2 className="w-8 h-8 text-[#0c4b39]" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <h4 className="font-black text-slate-900 text-base leading-snug">{hospital.name}</h4>
                  <p className="text-xs text-slate-600 font-semibold flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0c4b39] shrink-0 mt-0.5" />
                    <span>{hospital.address}</span>
                  </p>
                  {hospital.hotline && (
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0c4b39]" />
                      <span>Hotline cơ sở: <strong className="text-slate-900">{hospital.hotline}</strong></span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: THÔNG TIN BỆNH NHÂN */}
          <Card className="border border-slate-200/90 shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0c4b39]" />
                  2. Thông tin Bệnh nhân
                </h3>
                {patientProfile && (
                  <Badge className="bg-[#0c4b39] text-white text-[10px] font-bold">
                    {patientProfile.relation || 'Bản thân'}
                  </Badge>
                )}
              </div>

              {patientProfile && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Họ và tên bệnh nhân</span>
                    <span className="font-extrabold text-slate-950 text-sm block">{patientProfile.fullName}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Số điện thoại liên hệ</span>
                    <span className="font-extrabold text-slate-950 text-sm block">{patientProfile.phone}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Ngày sinh / Giới tính</span>
                    <span className="font-bold text-slate-900 block">
                      {patientProfile.dateOfBirth ? new Date(patientProfile.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'} • {patientProfile.gender === 'MALE' ? 'Nam' : 'Nữ'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Số CCCD / CMND</span>
                    <span className="font-bold text-slate-900 block">{patientProfile.identityNumber || 'Chưa cập nhật'}</span>
                  </div>

                  {patientProfile.address && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1 sm:col-span-2">
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Địa chỉ thường trú</span>
                      <span className="font-bold text-slate-900 block">{patientProfile.address}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD 3: THÔNG TIN ĐẶT KHÁM */}
          <Card className="border border-slate-200/90 shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#0c4b39]" />
                  3. Thông tin Chi tiết Đặt khám
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
                  <span className="font-bold text-slate-600">Chuyên khoa khám:</span>
                  <span className="font-black text-[#0c4b39] text-sm text-right">
                    {specialty?.name || 'Chuyên khoa tổng hợp'}
                  </span>
                </div>

                {/* Show Doctor for Doctor Mode */}
                {bookingMode === 'doctor' && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <span className="font-bold text-slate-600">Bác sĩ thăm khám:</span>
                    <span className="font-black text-slate-950 text-sm text-right">
                      {doctor ? `${doctor.title || 'BS.'} ${doctor.fullName}` : 'Bác sĩ chuyên khoa'}
                    </span>
                  </div>
                )}

                {/* Show Room for Service / Standard Mode */}
                {(bookingMode === 'service' || bookingMode === 'standard') && room && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <span className="font-bold text-slate-600">Phòng khám chỉ định:</span>
                    <span className="font-black text-[#0c4b39] text-sm text-right">
                      {room.roomNumber} - {room.name} ({room.floor})
                    </span>
                  </div>
                )}

                {/* Show Service for Doctor / Service Mode */}
                {(bookingMode === 'doctor' || bookingMode === 'service') && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <span className="font-bold text-slate-600">Dịch vụ đăng ký:</span>
                    <span className="font-black text-slate-950 text-sm text-right">
                      {service?.name || 'Khám y tế theo chỉ định'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#0c4b39]" /> Ngày khám bệnh
                    </span>
                    <span className="font-black text-slate-950 text-sm capitalize block">{formattedDate}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#0c4b39]" /> Giờ khám dự kiến
                    </span>
                    <span className="font-black text-[#0c4b39] text-sm block">{selectedSlotTime}</span>
                  </div>
                </div>

                {/* Input lý do khám */}
                <div className="pt-2 space-y-1.5">
                  <label className="text-xs font-black text-slate-900 block">
                    Lý do khám / Triệu chứng ban đầu (Không bắt buộc):
                  </label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ví dụ: Đau đầu kéo dài 3 ngày, ho nhẹ vào buổi sáng..."
                    className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-xl text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Cost & Confirm Card (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-200/90 shadow-md rounded-3xl bg-white overflow-hidden sticky top-6">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-base font-black text-slate-950 pb-3 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0c4b39]" />
                Tóm Tắt Chi Phí
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Giá dịch vụ khám:</span>
                  <span className="font-extrabold text-slate-900">{formatPrice(consultationFee)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Phí đặt lịch NovaCare:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">Miễn phí</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Tự động giữ chỗ:</span>
                  <span className="font-bold text-slate-900">Tức thì</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-950">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-[#0c4b39]">{formatPrice(consultationFee)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 font-medium space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" /> Cam kết giữ chỗ 100%
                </div>
                <p className="leading-relaxed">
                  Lịch hẹn của bạn sẽ được chuyển trực tiếp vào hệ thống điều phối của cơ sở y tế ngay khi hoàn tất.
                </p>
              </div>

              <Button
                type="button"
                onClick={onNext}
                className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-black text-sm h-12 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>Xác nhận & Sang Bước Thanh Toán</span>
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs h-10 rounded-2xl"
              >
                Quay lại sửa thông tin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
