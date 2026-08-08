'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, MapPin, Check, Star, Phone } from 'lucide-react';
import { Hospital } from '@/types';

interface HospitalSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  selectedHospitalId: string | null;
  onSelect: (hospital: Hospital) => void;
}

export function HospitalSelectModal({
  isOpen,
  onClose,
  hospitals,
  selectedHospitalId,
  onSelect,
}: HospitalSelectModalProps) {
  const [search, setSearch] = useState('');

  const filtered = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    (h.address && h.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c4b39] bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-200/60">
            <Building2 className="w-3.5 h-3.5 text-[#0c4b39]" />
            <span>Bước 1 • Chọn Cơ sở Y tế</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Chọn Bệnh Viện / Phòng khám
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium">
            Danh sách các cơ sở y tế đối tác chính thức trên hệ thống NovaCare
          </p>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên bệnh viện, địa chỉ..."
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-xl text-xs"
          />
        </div>

        {/* List of Hospitals */}
        <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Không tìm thấy cơ sở y tế nào</p>
            </div>
          ) : (
            filtered.map((hosp) => {
              const isSelected = selectedHospitalId === hosp.id;

              return (
                <div
                  key={hosp.id}
                  onClick={() => {
                    onSelect(hosp);
                    onClose();
                  }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm ring-1 ring-[#0c4b39]'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1 shrink-0 flex items-center justify-center shadow-xs">
                      {hosp.logoUrl ? (
                        <img src={hosp.logoUrl} alt={hosp.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Building2 className="w-7 h-7 text-[#0c4b39]" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-emerald-100/80 text-[#0c4b39] border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Đối tác chính thức
                        </Badge>
                        <span className="flex items-center gap-1 text-amber-500 font-black text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {hosp.rating || 4.9}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0c4b39] transition-colors truncate">
                        {hosp.name}
                      </h4>

                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#0c4b39] shrink-0" />
                        <span className="truncate">{hosp.address}</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs font-bold rounded-xl h-9 px-4 shrink-0 ${
                      isSelected
                        ? 'bg-[#0c4b39] hover:bg-[#09392b] text-white'
                        : 'border-slate-300 text-slate-700 hover:border-[#0c4b39] hover:text-[#0c4b39]'
                    }`}
                  >
                    {isSelected ? 'Đã chọn' : 'Chọn cơ sở này'}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
