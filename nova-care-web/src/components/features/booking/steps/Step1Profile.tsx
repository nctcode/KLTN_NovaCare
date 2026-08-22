'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PatientProfileForm } from '@/components/forms/PatientProfileForm';
import { ChevronRight, Loader2, Plus, UserCheck, CheckCircle2, User, Phone, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface Step1ProfileProps {
  onNext: () => void;
}

export function Step1Profile({ onNext }: Step1ProfileProps) {
  const queryClient = useQueryClient();
  const { bookingData, setBookingData } = useBookingStore();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(bookingData.patientProfileId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileService.getAll,
  });

  useEffect(() => {
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

  const handleContinue = () => {
    if (!selectedProfileId) {
      toast.error('Vui lòng chọn hoặc tạo mới một hồ sơ bệnh nhân trước khi tiếp tục.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0c4b39]/10 text-[#0c4b39] text-xs font-black uppercase tracking-wider mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            Bước 1: Chọn hồ sơ
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-secondary">Chọn Hồ Sơ Người Bệnh</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Vui lòng chọn hồ sơ người bệnh muốn đặt khám (Bản thân hoặc Người thân).
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#0c4b39] hover:bg-[#09382b] text-white rounded-xl font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm cursor-pointer">
              <Plus className="h-4 w-4" />
              Thêm hồ sơ người thân
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
            <Loader2 className="animate-spin h-8 w-8 text-[#0c4b39] mb-2" />
            <p className="text-sm font-medium">Đang tải hồ sơ bệnh nhân...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6 text-gray-500">
            <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700">Chưa có hồ sơ bệnh nhân nào</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Vui lòng tạo mới một hồ sơ để tiến hành đặt lịch khám</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#0c4b39] hover:bg-[#09382b] text-white rounded-xl font-bold px-4 py-2 cursor-pointer"
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
                      ? 'border-2 border-[#0c4b39] bg-emerald-50/20 shadow-sm ring-2 ring-[#0c4b39]/15'
                      : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0c4b39]/10 flex items-center justify-center text-[#0c4b39] font-bold text-xs">
                          {profile.fullName.charAt(0)}
                        </div>
                        <span className="font-extrabold text-secondary text-base">{profile.fullName}</span>
                      </div>

                      {isSelected ? (
                        <span className="text-[10px] font-bold bg-[#0c4b39] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
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
                        <span className="font-semibold text-gray-800">{profile.relation || 'Bản thân'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Số điện thoại:</span>
                        <span className="font-semibold text-gray-800">{profile.phone || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">CCCD/CMND:</span>
                        <span className="font-semibold text-gray-800">{profile.identityNumber || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          onClick={handleContinue}
          disabled={!selectedProfileId}
          className="bg-[#0c4b39] hover:bg-[#09382b] text-white px-8 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          Tiếp tục chọn Chuyên khoa
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
