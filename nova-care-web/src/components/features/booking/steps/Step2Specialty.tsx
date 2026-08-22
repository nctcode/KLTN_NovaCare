'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { specialtyService } from '@/services/specialty.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIHealthAssessmentWizard } from '@/components/features/booking/AIHealthAssessmentWizard';
import { ArrowLeft, ChevronRight, Loader2, Search, Stethoscope, CheckCircle2, Sparkles, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface Step2SpecialtyProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step2Specialty({ onNext, onBack }: Step2SpecialtyProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const [selectedId, setSelectedId] = useState<string | null>(bookingData.specialtyId);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);

  const { data: specialties = [], isLoading } = useQuery({
    queryKey: ['specialties'],
    queryFn: specialtyService.getAll,
  });

  const filteredSpecialties = specialties.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (specialty: any) => {
    setSelectedId(specialty.id);
    setBookingData({
      specialtyId: specialty.id,
      specialtyName: specialty.name,
      // Clear dependent choices if specialty changed
      medicalServiceId: null,
      medicalServiceName: null,
      doctorId: null,
      doctorName: null,
      workplaceId: null,
      slotId: null,
      slot: null,
    });
  };

  const handleContinue = () => {
    if (!selectedId) {
      toast.error('Vui lòng chọn một chuyên khoa trước khi tiếp tục.');
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
            <Stethoscope className="w-3.5 h-3.5" />
            Bước 2: Chọn chuyên khoa
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-secondary">Chọn Chuyên Khoa Khám Bệnh</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lựa chọn chuyên khoa phù hợp với triệu chứng hoặc nhu cầu thăm khám của bạn.
          </p>
        </div>

        <Button
          onClick={() => setIsAiOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-[#0c4b39] text-white hover:from-emerald-700 hover:to-[#09382b] font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          Nhận Gợi Ý Từ AI
        </Button>
      </div>

      {/* AI Assistance Promo Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#0c4b39] text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
            <Bot className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Chưa rõ triệu chứng hoặc chưa biết chọn chuyên khoa?</h4>
            <p className="text-xs text-emerald-100">Sử dụng Trợ lý AI đo nhịp tim PPG, phân tích triệu chứng để nhận gợi ý tự động.</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAiOpen(true)}
          className="bg-white text-[#0c4b39] hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
          Sàng Lọc AI Ngay
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm nhanh chuyên khoa (Vd: Nội tổng quát, Tim mạch, Da liễu, Nhi khoa...)"
          className="pl-10 h-11 bg-white border-gray-200 focus-visible:ring-0 focus-visible:border-[#0c4b39] rounded-2xl text-sm font-medium"
        />
      </div>

      {/* Specialty Cards Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="animate-spin h-8 w-8 text-[#0c4b39] mb-2" />
          <p className="text-sm font-medium">Đang tải danh sách chuyên khoa...</p>
        </div>
      ) : filteredSpecialties.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500">
          <Stethoscope className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="font-bold text-gray-700">Không tìm thấy chuyên khoa nào</p>
          <p className="text-xs text-gray-400 mt-1">Thử đổi từ khóa tìm kiếm khác</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[440px] overflow-y-auto pr-1">
          {filteredSpecialties.map((specialty) => {
            const isSelected = selectedId === specialty.id;

            return (
              <Card
                key={specialty.id}
                onClick={() => handleSelect(specialty)}
                className={`cursor-pointer transition-all duration-200 rounded-2xl relative overflow-hidden bg-white ${
                  isSelected
                    ? 'border-2 border-[#0c4b39] bg-emerald-50/20 shadow-sm ring-2 ring-[#0c4b39]/15'
                    : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                }`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center font-bold shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold bg-[#0c4b39] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                        Đã chọn
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-secondary text-base">{specialty.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {specialty.description || 'Chuyên khoa tư vấn & chẩn đoán điều trị y tế chuyên sâu.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Actions Footer */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack} className="rounded-xl px-5 text-gray-600 border-gray-300 hover:bg-gray-50 font-semibold cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Quay lại
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedId}
          className="bg-[#0c4b39] hover:bg-[#09382b] text-white px-8 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          Tiếp tục chọn Dịch vụ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* AI Health Screening Modal Dialog */}
      <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>AI Sàng Lọc Sức Khỏe Tiền Khám</DialogTitle>
          </DialogHeader>
          <AIHealthAssessmentWizard onCancel={() => setIsAiOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
