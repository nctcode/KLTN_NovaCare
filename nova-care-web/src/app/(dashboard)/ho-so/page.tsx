'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PatientProfileForm } from '@/components/forms/PatientProfileForm';
import {
  Plus,
  User,
  Phone,
  Calendar,
  Heart,
  Shield,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Loader2,
  Search,
  FileCheck,
  UserCheck,
  Users,
  CalendarCheck,
  MapPin,
  ArrowRight,
  QrCode,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { PatientProfile } from '@/types/profile.types';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PatientProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [relationFilter, setRelationFilter] = useState<string>('ALL');

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileService.getAll,
  });

  const setDefaultMutation = useMutation({
    mutationFn: profileService.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Đã thiết lập hồ sơ khám mặc định');
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

  // Filter profiles by query and relationship
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery)) ||
      (p.identityNumber && p.identityNumber.includes(searchQuery));

    if (!matchesSearch) return false;
    if (relationFilter === 'SELF') return p.relation === 'Bản thân';
    if (relationFilter === 'RELATIVE') return p.relation !== 'Bản thân';
    return true;
  });

  const defaultProfile = profiles.find((p) => p.isDefault);

  return (
    <div className="w-full space-y-6">
      {/* Header Banner - Full Width Minimalist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hồ sơ bệnh nhân</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
              {profiles.length} hồ sơ
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Quản lý thông tin y tế của bản thân và người thân để đăng ký khám bệnh nhanh chóng
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold shadow-xs self-start md:self-auto">
              <Plus className="h-4 w-4" />
              Thêm hồ sơ mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">Thêm hồ sơ bệnh nhân mới</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Nhập đầy đủ thông tin bệnh nhân để sử dụng cho các lần đặt lịch khám tiếp theo
              </DialogDescription>
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

      {/* Inter-Hospital EHR Passport Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30">
            <Shield className="w-3.5 h-3.5" />
            Liên thông Hồ sơ Đa Bệnh viện
          </div>
          <h3 className="text-lg font-bold">Hộ chiếu Y tế Số (Medical Passport)</h3>
          <p className="text-xs text-slate-300">
            Cho phép Bác sĩ tại Bệnh viện B xem tiền sử khám, chẩn đoán & đơn thuốc từ Bệnh viện A qua Mã QR chia sẻ.
          </p>
        </div>
        <Button asChild className="bg-[#4caf50] hover:bg-[#439e47] text-white font-bold text-xs gap-2 shrink-0 rounded-xl px-4 py-2">
          <Link href="/tra-cuu-ho-so">
            Mở Cổng Tra cứu Liên thông
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số hồ sơ</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{profiles.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hồ sơ khám chính</p>
            <p className="text-base font-extrabold text-emerald-700 mt-1 truncate max-w-[180px]">
              {defaultProfile ? defaultProfile.fullName : 'Chưa chọn'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã cập nhật CCCD</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {profiles.filter((p) => p.identityNumber).length}/{profiles.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar - Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, SĐT, CCCD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setRelationFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${relationFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            Tất cả ({profiles.length})
          </button>
          <button
            onClick={() => setRelationFilter('SELF')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${relationFilter === 'SELF'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            Bản thân
          </button>
          <button
            onClick={() => setRelationFilter('RELATIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${relationFilter === 'RELATIVE'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            Người thân
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin h-8 w-8 text-slate-900" />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white">
          <CardContent className="py-16 text-center text-slate-500 space-y-3">
            <User className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-900">Không tìm thấy hồ sơ bệnh nhân nào</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Không có kết quả khớp với từ khóa tìm kiếm của bạn.'
                : 'Bạn chưa tạo hồ sơ bệnh nhân nào. Bấm nút "Thêm hồ sơ mới" để khởi tạo.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProfiles.map((profile) => (
            <Card
              key={profile.id}
              className={`bg-white border transition-all duration-200 ${profile.isDefault
                  ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                  : 'border-slate-200 hover:border-slate-400 shadow-sm'
                }`}
            >
              <CardContent className="p-6 space-y-5">
                {/* Header Profile info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {profile.fullName}
                        </h3>
                        {profile.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Hồ sơ chính
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        Mối quan hệ: <span className="font-bold text-slate-900">{profile.relation || 'Bản thân'}</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(profile.id)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2 -mt-2"
                    title="Xóa hồ sơ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-slate-600 shrink-0" />
                    <span>SĐT: <strong className="text-slate-900 font-bold">{profile.phone || 'Chưa cung cấp'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4 text-slate-600 shrink-0" />
                    <span>Ngày sinh: <strong className="text-slate-900 font-bold">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cung cấp'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Heart className="h-4 w-4 text-slate-600 shrink-0" />
                    <span>Giới tính: <strong className="text-slate-900 font-bold">{profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Shield className="h-4 w-4 text-slate-600 shrink-0" />
                    <span>CCCD: <strong className="text-slate-900 font-bold">{profile.identityNumber || 'Chưa cung cấp'}</strong></span>
                  </div>

                  {profile.healthInsurance && (
                    <div className="col-span-2 flex items-center gap-2 text-slate-700 border-t border-slate-200 pt-2 mt-0.5">
                      <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Thẻ BHYT: <strong className="text-slate-900 font-bold font-mono">{profile.healthInsurance}</strong></span>
                    </div>
                  )}

                  {profile.address && (
                    <div className="col-span-2 flex items-center gap-2 text-slate-700 border-t border-slate-200 pt-2">
                      <MapPin className="h-4 w-4 text-slate-600 shrink-0" />
                      <span className="truncate">Địa chỉ: <strong className="text-slate-900 font-bold">{profile.address}</strong></span>
                    </div>
                  )}

                  {(profile.emergencyContact || profile.emergencyPhone) && (
                    <div className="col-span-2 flex items-center gap-2 text-slate-700 border-t border-slate-200 pt-2">
                      <Phone className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Liên hệ khẩn cấp: <strong className="text-slate-900 font-bold">{profile.emergencyContact || ''} ({profile.emergencyPhone || '---'})</strong></span>
                    </div>
                  )}

                  {(profile.medicalHistory || profile.allergies) && (
                    <div className="col-span-2 flex items-start gap-2 text-slate-700 border-t border-slate-200 pt-2">
                      <Heart className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        {profile.medicalHistory && <p className="truncate">Tiền sử: <strong className="text-slate-900 font-bold">{profile.medicalHistory}</strong></p>}
                        {profile.allergies && <p className="truncate text-red-600">Dị ứng: <strong className="font-bold">{profile.allergies}</strong></p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {!profile.isDefault ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(profile.id)}
                        disabled={setDefaultMutation.isPending}
                        className="text-xs text-slate-800 font-semibold border-slate-300 hover:bg-slate-50"
                      >
                        Đặt làm hồ sơ chính
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-600 flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Hồ sơ chính
                      </span>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfile(profile)}
                      className="text-xs font-bold text-slate-900 border-slate-300 hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      {profile.identityNumber ? 'Cập nhật CCCD' : 'Quét & Định danh CCCD'}
                    </Button>
                  </div>

                  <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1 font-semibold">
                    <Link href="/bac-si">
                      Đặt lịch khám
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Profile & CCCD Verification Dialog */}
      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Cập nhật & Xác thực CCCD ({editingProfile?.fullName})
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Quét mã QR thẻ CCCD gắn chip hoặc cập nhật thông tin định danh cho hồ sơ bệnh nhân này để phục vụ việc đặt lịch khám.
            </DialogDescription>
          </DialogHeader>
          {editingProfile && (
            <PatientProfileForm
              initialData={editingProfile}
              onSuccess={() => {
                setEditingProfile(null);
                queryClient.invalidateQueries({ queryKey: ['profiles'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

