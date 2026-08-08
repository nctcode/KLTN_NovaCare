'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Phone,
  CreditCard,
  Heart,
  Loader2,
  Users,
  Shield,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { PatientProfile } from '@/types/profile.types';
import { NewProfileModal } from './NewProfileModal';
import { toast } from 'sonner';

interface Step2SelectPatientProfileProps {
  selectedProfileId: string | null;
  setSelectedProfile: (profile: PatientProfile | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2SelectPatientProfile({
  selectedProfileId,
  setSelectedProfile,
  onNext,
  onBack,
}: Step2SelectPatientProfileProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch patient profiles
  const {
    data: profiles = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['patient-profiles-list'],
    queryFn: () => profileService.getAll(),
  });

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleValidateAndNext = () => {
    if (!selectedProfileId || !selectedProfile) {
      toast.error('Vui lòng chọn 1 hồ sơ người bệnh để tiếp tục!');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0c4b39] to-emerald-900 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/10">
            <Users className="w-3.5 h-3.5" />
            <span>Bước 2 / 4 • Hồ sơ người bệnh</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Chọn Hồ Sơ Đăng Ký Khám
          </h2>
          <p className="text-xs text-emerald-100/80 font-medium">
            Chọn hồ sơ bản thân hoặc người thân đã lưu, hoặc tạo mới hồ sơ ngay bên dưới
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-white text-[#0c4b39] hover:bg-emerald-50 font-black text-xs h-11 px-5 rounded-2xl shadow-sm border border-emerald-200 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4 text-[#0c4b39]" />
          <span>Thêm hồ sơ mới</span>
        </Button>
      </div>

      {/* Profiles List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-xs font-bold">
          <Loader2 className="animate-spin w-6 h-6 text-[#0c4b39]" />
          Đang tải danh sách hồ sơ người bệnh...
        </div>
      ) : profiles.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center bg-white space-y-4">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">Bạn chưa có hồ sơ bệnh nhân nào</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              Vui lòng tạo hồ sơ bệnh nhân đầu tiên để làm thủ tục tiếp nhận tại bệnh viện.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs h-11 px-6 rounded-2xl shadow-md inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Tạo hồ sơ bệnh nhân ngay
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {profiles.map((prof) => {
            const isSelected = selectedProfileId === prof.id;

            return (
              <Card
                key={prof.id}
                onClick={() => setSelectedProfile(prof)}
                className={`border-2 transition-all cursor-pointer rounded-3xl p-5 hover:shadow-md relative overflow-hidden ${
                  isSelected
                    ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm ring-2 ring-[#0c4b39]'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <CardContent className="p-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#0c4b39] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {prof.relation || 'Bản thân'}
                      </Badge>
                      {prof.isDefault && (
                        <Badge variant="outline" className="bg-emerald-100 text-[#0c4b39] border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Mặc định
                        </Badge>
                      )}
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-[#0c4b39] bg-[#0c4b39] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                      {prof.fullName}
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-3">
                      <span>Giới tính: {prof.gender === 'MALE' ? 'Nam' : prof.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span>
                      {prof.dateOfBirth && (
                        <span>• Ngày sinh: {new Date(prof.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-600 font-medium border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#0c4b39] shrink-0" />
                      <span>SĐT: <strong className="text-slate-900">{prof.phone}</strong></span>
                    </div>

                    {prof.identityNumber && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#0c4b39] shrink-0" />
                        <span>CCCD/CMND: <strong className="text-slate-900">{prof.identityNumber}</strong></span>
                      </div>
                    )}

                    {prof.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#0c4b39] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{prof.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs h-11 px-6 rounded-2xl flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Button>

        <Button
          type="button"
          onClick={handleValidateAndNext}
          className="bg-[#0c4b39] hover:bg-[#083629] text-white font-black text-sm h-12 px-8 rounded-2xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
        >
          <span>Tiếp tục: Xác Nhận Thông Tin</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* NEW PROFILE MODAL */}
      <NewProfileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success('Đã thêm hồ sơ người bệnh thành công!');
        }}
      />
    </div>
  );
}
