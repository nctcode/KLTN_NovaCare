'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, MapPin, Check, Sparkles, Clock, Users } from 'lucide-react';
import { Specialty } from '@/types';

export interface ClinicRoom {
  id: string;
  roomNumber: string;
  name: string;
  floor: string;
  zone: string;
  specialtyId?: string;
  specialtyName?: string;
  doctorInCharge?: string;
  status: 'AVAILABLE' | 'BUSY' | 'MAINTENANCE';
  capacityPerSession: number;
}

interface RoomSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpecialty: Specialty | null;
  selectedRoomId: string | null;
  onSelect: (room: ClinicRoom) => void;
  hospitalName?: string;
}

export function RoomSelectModal({
  isOpen,
  onClose,
  selectedSpecialty,
  selectedRoomId,
  onSelect,
  hospitalName,
}: RoomSelectModalProps) {
  const [search, setSearch] = useState('');

  // Generate realistic clinic rooms dynamically based on specialty
  const availableRooms: ClinicRoom[] = useMemo(() => {
    const specName = selectedSpecialty?.name || 'Khám Tổng Quát';

    const baseRooms: ClinicRoom[] = [
      {
        id: 'room-101',
        roomNumber: 'PK-101',
        name: `Phòng Khám ${specName} 01`,
        floor: 'Tầng 1',
        zone: 'Khu A - Tòa nhà Chính',
        specialtyId: selectedSpecialty?.id,
        specialtyName: specName,
        doctorInCharge: 'BS.CKII Nguyễn Văn An',
        status: 'AVAILABLE',
        capacityPerSession: 20,
      },
      {
        id: 'room-102',
        roomNumber: 'PK-102',
        name: `Phòng Khám ${specName} 02 (Kỹ thuật cao)`,
        floor: 'Tầng 1',
        zone: 'Khu A - Tòa nhà Chính',
        specialtyId: selectedSpecialty?.id,
        specialtyName: specName,
        doctorInCharge: 'ThS.BS Trần Thị Phương',
        status: 'AVAILABLE',
        capacityPerSession: 15,
      },
      {
        id: 'room-201',
        roomNumber: 'PK-201',
        name: `Phòng Chẩn Đóa & Thăm Khám ${specName}`,
        floor: 'Tầng 2',
        zone: 'Khu B - Tòa Chuyên Khoa',
        specialtyId: selectedSpecialty?.id,
        specialtyName: specName,
        doctorInCharge: 'PGS.TS Lê Đức Tuấn',
        status: 'AVAILABLE',
        capacityPerSession: 18,
      },
      {
        id: 'room-202',
        roomNumber: 'PK-202',
        name: `Phòng Khám ${specName} VIP / Khám Yêu Cầu`,
        floor: 'Tầng 2',
        zone: 'Khu VIP - Tòa Chuyên Khoa',
        specialtyId: selectedSpecialty?.id,
        specialtyName: specName,
        doctorInCharge: 'TS.BS Phạm Quốc Hùng',
        status: 'AVAILABLE',
        capacityPerSession: 12,
      },
    ];

    return baseRooms;
  }, [selectedSpecialty]);

  const filtered = availableRooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.floor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c4b39] bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-200/60">
            <Building2 className="w-3.5 h-3.5 text-[#0c4b39]" />
            <span>Danh mục Phòng Khám Chuyên Khoa</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0c4b39]" />
            Chọn Phòng Khám {selectedSpecialty ? `- ${selectedSpecialty.name}` : ''}
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium">
            {hospitalName
              ? `Vui lòng chọn phòng khám chuyên khoa phù hợp tại ${hospitalName}`
              : 'Chọn phòng khám theo vị trí tầng và phòng chuyên trách'}
          </p>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo số phòng, tầng (Ví dụ: PK-101, Tầng 1...)"
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-xl text-xs"
          />
        </div>

        {/* Room List */}
        <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Không tìm thấy phòng khám phù hợp</p>
            </div>
          ) : (
            filtered.map((room) => {
              const isSelected = selectedRoomId === room.id;

              return (
                <div
                  key={room.id}
                  onClick={() => {
                    onSelect(room);
                    onClose();
                  }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-emerald-50/90 border-[#0c4b39] shadow-sm ring-1 ring-[#0c4b39]'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-[#0c4b39] text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                        {room.roomNumber}
                      </Badge>
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0c4b39] transition-colors truncate">
                        {room.name}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0c4b39] shrink-0" />
                      <span>{room.floor} • {room.zone}</span>
                    </p>

                    {room.doctorInCharge && (
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#0c4b39]" />
                        <span>Bác sĩ phụ trách chính: <strong>{room.doctorInCharge}</strong></span>
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <Badge variant="outline" className="bg-emerald-50 text-[#0c4b39] border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full block text-center">
                      Đang hoạt động
                    </Badge>
                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={`text-xs font-bold rounded-xl h-8 px-3 ${
                        isSelected
                          ? 'bg-[#0c4b39] hover:bg-[#09392b] text-white'
                          : 'border-slate-300 text-slate-700 hover:border-[#0c4b39] hover:text-[#0c4b39]'
                      }`}
                    >
                      {isSelected ? 'Đã chọn' : 'Chọn phòng này'}
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
