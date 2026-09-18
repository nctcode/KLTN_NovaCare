'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { appointmentService } from '@/services/appointment.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Calendar,
  FileCheck,
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface InpatientVerificationStepProps {
  hospitalId: string;
  hospitalName: string;
  selectedEncounterId?: string | null;
  onSelectEncounter: (encounter: any) => void;
  onNext: () => void;
}

export function InpatientVerificationStep({
  hospitalId,
  hospitalName,
  selectedEncounterId,
  onSelectEncounter,
  onNext,
}: InpatientVerificationStepProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Fetch past appointment/encounter records for logged in user
  const { data: appointmentHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['inpatient-history', user?.id],
    queryFn: () => appointmentService.getHistory(),
    enabled: !!isAuthenticated && !!user?.id,
  });

  // Filter inpatient records matching hospitalId or manual code
  const inpatientRecords = appointmentHistory.filter((apt: any) => {
    const matchesHospital = !hospitalId || apt.slot?.doctorWorkplace?.hospitalId === hospitalId;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        matchesHospital &&
        (apt.bookingCode?.toLowerCase().includes(q) ||
          apt.id?.toLowerCase().includes(q) ||
          apt.reason?.toLowerCase().includes(q))
      );
    }
    return matchesHospital;
  });

  if (!isAuthenticated) {
    return (
      <Card className="border-2 border-purple-200 bg-purple-50/40 rounded-3xl p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900">Yêu Cầu Đăng Nhập Tài Khoản</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
            Để tra cứu hồ sơ đợt điều trị nội trú và đăng ký lịch tái khám tại {hospitalName}, vui lòng đăng nhập tài khoản của bạn.
          </p>
        </div>
        <Button
          onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(window.location.href)}`)}
          className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs h-11 rounded-2xl px-6"
        >
          <span>Đăng nhập tài khoản ngay</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    );
  }

  const handleSelect = (record: any) => {
    setSelectedRecord(record);
    onSelectEncounter(record);
    toast.success(`Đã chọn đợt điều trị mã #${record.bookingCode || record.id?.slice(0, 8)}`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white border border-purple-100 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-700" />
            <h3 className="text-base font-black text-slate-900">
              Tra Cứu Hồ Sơ Điều Trị Nội Trú Tại {hospitalName}
            </h3>
          </div>
          <Badge className="bg-purple-100 text-purple-800 font-bold text-[11px] px-2.5 py-1">
            Xác minh bệnh án nội trú
          </Badge>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Hệ thống tự động đồng bộ đợt khám/điều trị trước đây của bạn. Vui lòng chọn đợt điều trị cần đăng ký tái khám hoặc nhập mã hồ sơ xuất viện bên dưới.
        </p>

        {/* Search input for record code */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nhập mã đặt khám / mã bệnh án nội trú / lý do khám..."
            className="pl-10 h-10 rounded-2xl border-slate-200 text-xs font-semibold focus-visible:ring-purple-600 bg-slate-50"
          />
        </div>
      </div>

      {/* Record list or loading/empty states */}
      {loadingHistory ? (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Đang kiểm tra dữ liệu hồ sơ nội trú...</p>
        </div>
      ) : inpatientRecords.length === 0 ? (
        <Card className="border border-slate-200 bg-slate-50 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-800">
              Chưa Tìm Thấy Hồ Sơ Đợt Điều Trị Nội Trú Mới Đây
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Không tìm thấy hồ sơ đợt điều trị nội trú phù hợp để tái khám tại {hospitalName}. Bạn vẫn có thể tiếp tục bằng cách chọn đợt khám gần nhất hoặc nhập ghi chú tái khám.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const fallbackRecord = { id: 'manual', bookingCode: 'MANUAL_INPATIENT', reason: 'Tái khám nội trú theo hẹn' };
              setSelectedRecord(fallbackRecord);
              onSelectEncounter(fallbackRecord);
            }}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-2xl h-10 px-4"
          >
            Tiếp tục đăng ký tái khám thủ công
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Danh sách đợt điều trị có sẵn ({inpatientRecords.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inpatientRecords.map((rec: any) => {
              const isSelected = selectedRecord?.id === rec.id || selectedEncounterId === rec.id;
              return (
                <Card
                  key={rec.id}
                  onClick={() => handleSelect(rec)}
                  className={`border-2 cursor-pointer transition-all rounded-3xl p-5 relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/80 shadow-md ring-2 ring-purple-600'
                      : 'border-slate-200 bg-white hover:border-purple-400'
                  }`}
                >
                  <CardContent className="p-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-100 text-purple-900 font-extrabold text-[10px]">
                        Mã: #{rec.bookingCode || rec.id?.slice(0, 8)}
                      </Badge>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-700" />}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-900 leading-snug">
                        {rec.reason || rec.medicalService?.name || 'Khám bệnh / Điều trị nội trú'}
                      </p>
                      {rec.createdAt && (
                        <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-600" />
                          <span>Ngày tạo: {new Date(rec.createdAt).toLocaleDateString('vi-VN')}</span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="pt-2">
          <Button
            onClick={onNext}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs h-11 rounded-2xl flex items-center justify-center gap-2 shadow-md"
          >
            <span>Tiếp tục chọn thời gian tái khám</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
