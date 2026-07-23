'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PatientProfileForm } from '@/components/forms/PatientProfileForm';
import { ArrowLeft, ChevronRight, Loader2, Plus, UserCheck, FileText, Activity, Phone, CreditCard, CheckCircle2, User } from 'lucide-react';

interface StepSelectProfileProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepSelectProfile({ onNext, onBack }: StepSelectProfileProps) {
  const queryClient = useQueryClient();
  const { bookingData, setBookingData } = useBookingStore();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(bookingData.patientProfileId);
  const [reason, setReason] = useState(bookingData.reason || '');
  const [symptoms, setSymptoms] = useState(bookingData.symptoms || '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileService.getAll,
  });

  useEffect(() => {
    // Tự động chọn hồ sơ mặc định của user nếu chưa có hồ sơ nào được chọn
    if (profiles.length > 0 && !selectedProfileId) {
      const defaultProfile = profiles.find((p) => p.isDefault) || profiles[0];
      setSelectedProfileId(defaultProfile.id);
      setBookingData({ patientProfileId: defaultProfile.id });
    }
  }, [profiles, selectedProfileId, setBookingData]);

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    setBookingData({ patientProfileId: id });
  };

  const handleNext = () => {
    if (selectedProfileId) {
      setBookingData({ reason, symptoms });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Badge & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4caf50]/10 text-[#4caf50] text-xs font-bold uppercase tracking-wider mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            Bước 3: Chọn hồ sơ
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-secondary">Chọn hồ sơ người bệnh</h2>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#4caf50] hover:bg-[#439e47] text-white rounded-xl font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm cursor-pointer">
              <Plus className="h-4 w-4" />
              Thêm hồ sơ bệnh nhân
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-secondary">Tạo hồ sơ bệnh nhân mới</DialogTitle>
            </DialogHeader>
            <PatientProfileForm
              onSuccess={() => {
                setIsDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['profiles'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Profiles list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
            <p className="text-sm">Đang tải hồ sơ bệnh nhân...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6 text-gray-500">
            <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">Chưa có hồ sơ bệnh nhân nào</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Vui lòng tạo mới một hồ sơ để tiến hành đặt lịch khám</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#4caf50] hover:bg-[#439e47] text-white rounded-xl font-bold px-4 py-2 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tạo hồ sơ ngay
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {profiles.map((profile) => {
              const isSelected = selectedProfileId === profile.id;

              return (
                <Card
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile.id)}
                  className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden bg-white ${
                    isSelected
                      ? 'border-2 border-[#4caf50] bg-[#4caf50]/[0.02] shadow-sm ring-2 ring-[#4caf50]/20'
                      : 'border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#4caf50]/10 flex items-center justify-center text-[#4caf50] font-bold text-xs">
                          {profile.fullName.charAt(0)}
                        </div>
                        <span className="font-bold text-secondary text-base">{profile.fullName}</span>
                      </div>

                      {isSelected ? (
                        <span className="text-[10px] font-bold bg-[#4caf50] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          Đang chọn
                        </span>
                      ) : profile.isDefault ? (
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          Mặc định
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Mối quan hệ:</span>
                        <span className="font-medium text-gray-800">{profile.relation || 'Bản thân'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Số điện thoại:</span>
                        <span className="font-medium text-gray-800">{profile.phone || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Số CCCD/CMND:</span>
                        <span className="font-medium text-gray-800">{profile.identityNumber || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Symptoms and Reason inputs */}
      {selectedProfileId && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#4caf50]" />
            <h3 className="font-bold text-secondary text-sm uppercase tracking-wider">Thông tin triệu chứng & lý do khám</h3>
          </div>

          <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gray-400" />
                Lý do đi khám chính *
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Đau đầu kéo dài, tái khám định kỳ, khám tổng quát..."
                className="bg-white border-gray-200 focus-visible:ring-0 focus-visible:border-[#4caf50] rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="symptoms" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-gray-400" />
                Mô tả triệu chứng cụ thể (tùy chọn)
              </Label>
              <Input
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ví dụ: Đau tăng về đêm, có kèm sốt nhẹ 2 ngày nay..."
                className="bg-white border-gray-200 focus-visible:ring-0 focus-visible:border-[#4caf50] rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack} className="rounded-xl px-5 text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Quay lại
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedProfileId}
          className="bg-[#4caf50] hover:bg-[#439e47] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          Xác nhận thông tin
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

