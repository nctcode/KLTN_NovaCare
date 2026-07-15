'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PatientProfileForm } from '@/components/forms/PatientProfileForm';
import { Plus, User, Phone, Calendar, Heart, Shield, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileService.getAll,
  });

  const setDefaultMutation = useMutation({
    mutationFn: profileService.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Đã đặt hồ sơ mặc định');
    },
    onError: () => {
      toast.error('Không thể thiết lập hồ sơ mặc định');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: profileService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Xóa hồ sơ thành công');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa hồ sơ này');
    },
  });

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân này?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Hồ sơ bệnh nhân</h1>
          <p className="text-sm text-gray-500">Quản lý hồ sơ y tế của bạn và người thân để đặt lịch khám nhanh hơn</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm hồ sơ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm hồ sơ bệnh nhân mới</DialogTitle>
            </DialogHeader>
            <PatientProfileForm
              onSuccess={() => {
                setIsCreateOpen(false);
                queryClient.invalidateQueries({ queryKey: ['profiles'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      ) : profiles.length === 0 ? (
        <Card className="border-dashed bg-gray-50/50">
          <CardContent className="py-12 text-center text-gray-500">
            Bạn chưa tạo hồ sơ bệnh nhân nào. Vui lòng bấm &quot;Thêm hồ sơ&quot; để tạo.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="relative hover:shadow transition border border-gray-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary text-lg flex items-center gap-2">
                        {profile.fullName}
                        {profile.isDefault && (
                          <span className="text-[10px] bg-primary text-secondary px-2 py-0.5 rounded-full font-bold">
                            Mặc định
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">Mối quan hệ: {profile.relation || 'Bản thân'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t pt-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{profile.phone || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>
                      {profile.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')
                        : 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Heart className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>Giới tính: {profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>CCCD: {profile.identityNumber || 'Chưa cung cấp'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                  {!profile.isDefault ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(profile.id)}
                      className="text-primary-dark font-medium"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Đặt làm mặc định
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Hồ sơ đặt lịch chính
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(profile.id)}
                    className="text-danger hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
