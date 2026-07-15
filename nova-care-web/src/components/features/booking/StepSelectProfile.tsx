'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PatientProfileForm } from '@/components/forms/PatientProfileForm';
import { ArrowLeft, ChevronRight, Loader2, Plus, User, FileText, Activity } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">Chọn hồ sơ người bệnh</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Thêm hồ sơ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo hồ sơ bệnh nhân mới</DialogTitle>
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
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
          </div>
        ) : profiles.length === 0 ? (
          <Card className="border-dashed bg-gray-50/50">
            <CardContent className="py-12 text-center text-gray-500">
              Bạn chưa có hồ sơ bệnh nhân nào. Vui lòng bấm &quot;Thêm hồ sơ&quot; ở trên để tiếp tục.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                onClick={() => handleSelectProfile(profile.id)}
                className={`cursor-pointer transition hover:shadow ${
                  selectedProfileId === profile.id ? 'border-2 border-primary bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary-dark" />
                    <span className="font-semibold text-secondary">{profile.fullName}</span>
                    {profile.isDefault && (
                      <span className="text-[10px] font-bold bg-primary text-secondary px-1.5 py-0.5 rounded ml-auto">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Mối quan hệ: {profile.relation || 'Bản thân'}</p>
                  <p className="text-xs text-gray-500">Số điện thoại: {profile.phone || '---'}</p>
                  <p className="text-xs text-gray-500">Số CCCD: {profile.identityNumber || '---'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Symptoms and Reason inputs */}
      {selectedProfileId && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-secondary">Thông tin sức khỏe ban đầu</h3>
          <div className="space-y-2">
            <Label htmlFor="reason" className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-gray-400" />
              Lý do đi khám
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Đau ngực, đau đầu kéo dài..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symptoms" className="flex items-center gap-1">
              <Activity className="h-4 w-4 text-gray-400" />
              Triệu chứng đi kèm (tùy chọn)
            </Label>
            <Input
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Ví dụ: Triệu chứng xuất hiện 3 ngày trước, đau nhiều hơn về đêm..."
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <Button onClick={handleNext} disabled={!selectedProfileId}>
          Tiếp tục
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
