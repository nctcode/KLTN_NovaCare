'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Check, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { MedicalService } from '@/types';
import { formatPrice } from '@/lib/utils';

interface ServiceSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: MedicalService[];
  selectedServiceId: string | null;
  onSelect: (service: MedicalService) => void;
  hospitalName?: string;
}

export function ServiceSelectModal({
  isOpen,
  onClose,
  services,
  selectedServiceId,
  onSelect,
  hospitalName,
}: ServiceSelectModalProps) {
  const [search, setSearch] = useState('');

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c4b39] bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-200/60">
            <FileText className="w-3.5 h-3.5 text-[#0c4b39]" />
            <span>Bước 1.3 • Gói Dịch Vụ Khám</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#0c4b39]" />
            Chọn Dịch Vụ Khám Y Tế
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium">
            {hospitalName ? `Các gói khám & dịch vụ y tế cung cấp tại ${hospitalName}` : 'Vui lòng chọn loại hình dịch vụ khám phù hợp với bạn'}
          </p>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm dịch vụ (Khám chuyên khoa, Khám tư vấn, Tổng quát...)"
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-xl text-xs"
          />
        </div>

        {/* List of Services */}
        <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Không tìm thấy dịch vụ phù hợp</p>
            </div>
          ) : (
            filtered.map((srv) => {
              const isSelected = selectedServiceId === srv.id;
              const price = srv.price || (srv as any).fee || 300000;

              return (
                <div
                  key={srv.id}
                  onClick={() => {
                    onSelect(srv);
                    onClose();
                  }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm ring-1 ring-[#0c4b39]'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0c4b39] transition-colors truncate">
                        {srv.name}
                      </h4>
                      <Badge className="bg-emerald-100 text-[#0c4b39] border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Chuẩn Y Tế
                      </Badge>
                    </div>

                    {srv.description && (
                      <p className="text-xs text-slate-500 font-medium line-clamp-2">
                        {srv.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#0c4b39]" /> Thời gian: ~30 phút
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <ShieldCheck className="w-3 h-3" /> Bảo hiểm hỗ trợ
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="text-sm font-black text-[#0c4b39] block">
                      {formatPrice(price)}
                    </span>
                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={`text-xs font-bold rounded-xl h-8 px-3 ${
                        isSelected
                          ? 'bg-[#0c4b39] hover:bg-[#09392b] text-white'
                          : 'border-slate-300 text-slate-700 hover:border-[#0c4b39] hover:text-[#0c4b39]'
                      }`}
                    >
                      {isSelected ? 'Đã chọn' : 'Chọn dịch vụ'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
