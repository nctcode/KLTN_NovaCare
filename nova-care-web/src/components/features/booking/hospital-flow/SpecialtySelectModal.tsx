'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Stethoscope, Check, Activity, Sparkles, Building2 } from 'lucide-react';
import { Specialty } from '@/types';

interface SpecialtySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialties: Specialty[];
  selectedSpecialtyId: string | null;
  onSelect: (specialty: Specialty) => void;
  hospitalName?: string;
}

export function SpecialtySelectModal({
  isOpen,
  onClose,
  specialties,
  selectedSpecialtyId,
  onSelect,
  hospitalName,
}: SpecialtySelectModalProps) {
  const [search, setSearch] = useState('');

  const filtered = specialties.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c4b39] bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-200/60">
            <Activity className="w-3.5 h-3.5 text-[#0c4b39]" />
            <span>Bước 1.1 • Danh mục Chuyên Khoa</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#0c4b39]" />
            Chọn Chuyên Khoa Khám
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium">
            {hospitalName ? `Các chuyên khoa hiện có tại ${hospitalName}` : 'Vui lòng chọn chuyên khoa phù hợp với nhu cầu khám bệnh của bạn'}
          </p>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm chuyên khoa (Nội khoa, Nhi khoa, Tim mạch...)"
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-xl text-xs"
          />
        </div>

        {/* List of Specialties */}
        <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Không tìm thấy chuyên khoa nào</p>
            </div>
          ) : (
            filtered.map((spec) => {
              const isSelected = selectedSpecialtyId === spec.id;
              return (
                <div
                  key={spec.id}
                  onClick={() => {
                    onSelect(spec);
                    onClose();
                  }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0c4b39] text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-[#0c4b39]'
                      }`}
                    >
                      {(spec as any).iconUrl ? (
                        <img src={(spec as any).iconUrl} alt={spec.name} className="w-6 h-6 object-contain" />
                      ) : (
                        <Stethoscope className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0c4b39] transition-colors truncate">
                        {spec.name}
                      </h4>
                      {spec.description && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">
                          {spec.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <Badge className="bg-[#0c4b39] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đã chọn
                      </Badge>
                    )}
                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={`text-xs font-bold rounded-xl h-8 px-3 ${
                        isSelected
                          ? 'bg-[#0c4b39] hover:bg-[#09392b] text-white'
                          : 'border-slate-300 text-slate-700 hover:border-[#0c4b39] hover:text-[#0c4b39]'
                      }`}
                    >
                      {isSelected ? 'Đã chọn' : 'Chọn'}
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
