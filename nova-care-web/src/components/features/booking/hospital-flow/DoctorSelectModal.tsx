'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck, Star, Check, Award, Calendar, DollarSign, Stethoscope } from 'lucide-react';
import { Doctor } from '@/types';
import { formatPrice } from '@/lib/utils';

interface DoctorSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  selectedDoctorId: string | null;
  onSelect: (doctor: Doctor) => void;
  specialtyName?: string;
  hospitalName?: string;
}

export function DoctorSelectModal({
  isOpen,
  onClose,
  doctors,
  selectedDoctorId,
  onSelect,
  specialtyName,
  hospitalName,
}: DoctorSelectModalProps) {
  const [search, setSearch] = useState('');

  const filtered = doctors.filter((doc) =>
    doc.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (doc.qualification && doc.qualification.toLowerCase().includes(search.toLowerCase())) ||
    (doc.title && doc.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c4b39] bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-200/60">
            <UserCheck className="w-3.5 h-3.5 text-[#0c4b39]" />
            <span>Bước 1.2 • Đội ngũ Bác Sĩ</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#0c4b39]" />
            Chọn Bác Sĩ Thăm Khám
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium">
            {specialtyName
              ? `Danh sách bác sĩ thuộc chuyên khoa ${specialtyName}${hospitalName ? ` tại ${hospitalName}` : ''}`
              : 'Chọn bác sĩ chuyên khoa có kinh nghiệm phù hợp với lịch của bạn'}
          </p>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên bác sĩ, học vị (PGS, TS, CKII...)"
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-xl text-xs"
          />
        </div>

        {/* List of Doctors */}
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Không có bác sĩ nào trong chuyên khoa này</p>
            </div>
          ) : (
            filtered.map((doc) => {
              const isSelected = selectedDoctorId === doc.id;
              const primaryWorkplace = doc.workPlaces?.[0];
              const fee = primaryWorkplace?.consultationFee || (doc as any).consultationFee || 300000;

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelect(doc);
                    onClose();
                  }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm ring-1 ring-[#0c4b39]'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={
                          doc.avatarUrl ||
                          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
                        }
                        alt={doc.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border border-white">
                        <Check className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {doc.title && (
                          <Badge variant="outline" className="bg-emerald-100/70 text-[#0c4b39] border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {doc.title}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1 text-amber-500 font-black text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {doc.rating || 4.9}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0c4b39] transition-colors truncate">
                        {doc.fullName}
                      </h4>

                      <p className="text-xs text-slate-600 font-medium flex items-center gap-2 flex-wrap">
                        {doc.qualification && <span>{doc.qualification}</span>}
                        {primaryWorkplace?.specialty?.name && (
                          <span className="text-[#0c4b39] font-bold">
                            • Chuyên khoa {primaryWorkplace.specialty.name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Giá khám</span>
                      <span className="text-sm font-black text-[#0c4b39]">
                        {formatPrice(fee)}
                      </span>
                    </div>

                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={`text-xs font-bold rounded-xl h-9 px-4 ${
                        isSelected
                          ? 'bg-[#0c4b39] hover:bg-[#09392b] text-white'
                          : 'border-slate-300 text-slate-700 hover:border-[#0c4b39] hover:text-[#0c4b39]'
                      }`}
                    >
                      {isSelected ? 'Đã chọn' : 'Chọn bác sĩ'}
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
