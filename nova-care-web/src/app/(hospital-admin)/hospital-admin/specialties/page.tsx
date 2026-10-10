'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hospitalAdminService } from '@/services/hospital-admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Link from 'next/link';
import {
  Stethoscope,
  Search,
  Users,
  ChevronRight,
  Loader2,
  Building2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export default function HospitalAdminSpecialtiesPage() {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<any | null>(null);

  const { data: specialties = [], isLoading } = useQuery({
    queryKey: ['hospital-admin-specialties'],
    queryFn: hospitalAdminService.getSpecialties,
  });

  const filteredSpecialties = useMemo(() => {
    if (!search.trim()) return specialties;
    const q = search.toLowerCase();
    return specialties.filter(
      (s: any) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [specialties, search]);

  const totalDoctors = useMemo(() => {
    return specialties.reduce((acc: number, curr: any) => acc + (curr.doctorCount || 0), 0);
  }, [specialties]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Chuyên Khoa Cung Cấp</h1>
              <p className="text-xs text-slate-500">
                Danh mục các chuyên khoa hiện đang hoạt động và có bác sĩ tiếp nhận bệnh nhân tại bệnh viện
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-semibold">
            {specialties.length} chuyên khoa • {totalDoctors} lượt phân bổ bác sĩ
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm chuyên khoa theo tên hoặc mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-9 text-xs rounded-xl focus:bg-white"
              />
            </div>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch('')}
                className="text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Specialties Grid */}
      {isLoading ? (
        <Card className="bg-white border-slate-200 p-12 text-center rounded-2xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Đang tải danh mục chuyên khoa của bệnh viện...</p>
        </Card>
      ) : filteredSpecialties.length === 0 ? (
        <Card className="bg-white border-slate-200 p-12 text-center rounded-2xl shadow-sm">
          <Stethoscope className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold text-slate-800">Không tìm thấy chuyên khoa nào</p>
          <p className="text-xs text-slate-500 mt-1">
            Không có chuyên khoa phù hợp với từ khóa tìm kiếm.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpecialties.map((spec: any) => (
            <Card
              key={spec.id}
              className="bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all shadow-sm rounded-2xl flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                      {spec.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={spec.icon}
                          alt={spec.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Stethoscope className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{spec.name}</h3>
                      <Badge
                        variant="outline"
                        className="bg-slate-50 border-slate-200 text-slate-700 text-[10px] mt-1 font-medium"
                      >
                        <Users className="w-3 h-3 mr-1 text-slate-500" />
                        {spec.doctorCount || 0} bác sĩ trực thuộc
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {spec.description || 'Chuyên khoa cung cấp dịch vụ khám và điều trị chuyên sâu.'}
                </p>

                {/* Doctors Avatars Preview */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex -space-x-2 overflow-hidden">
                    {(spec.doctors || []).slice(0, 4).map((doc: any) => (
                      <div
                        key={doc.id}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-slate-100 text-slate-700 font-semibold text-[10px] flex items-center justify-center overflow-hidden shrink-0 border border-slate-200"
                        title={`${doc.title || ''} ${doc.fullName}`}
                      >
                        {doc.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={doc.avatarUrl}
                            alt={doc.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{doc.fullName.charAt(0)}</span>
                        )}
                      </div>
                    ))}
                    {(spec.doctors?.length || 0) > 4 && (
                      <div className="inline-flex h-7 w-7 rounded-full ring-2 ring-white bg-slate-100 text-slate-600 font-bold text-[10px] items-center justify-center border border-slate-200">
                        +{spec.doctors.length - 4}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSpecialty(spec)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-7 px-2 rounded-lg font-semibold"
                  >
                    Xem chi tiết
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Specialty Detail & Doctor List */}
      <Dialog open={!!selectedSpecialty} onOpenChange={(open) => !open && setSelectedSpecialty(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              Chuyên khoa: {selectedSpecialty?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedSpecialty && (
            <div className="space-y-4 py-2 text-xs">
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {selectedSpecialty.description || 'Chưa cập nhật mô tả chuyên khoa.'}
              </p>

              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Danh sách bác sĩ thuộc chuyên khoa ({selectedSpecialty.doctors?.length || 0})</span>
                  <Button asChild variant="link" size="sm" className="text-emerald-700 text-xs p-0 h-auto font-semibold">
                    <Link href="/hospital-admin/doctors">Quản lý bác sĩ &rarr;</Link>
                  </Button>
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(selectedSpecialty.doctors || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      Chưa có bác sĩ nào thuộc chuyên khoa này tại bệnh viện.
                    </div>
                  ) : (
                    selectedSpecialty.doctors.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-700 font-bold">
                            {doc.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={doc.avatarUrl}
                                alt={doc.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{doc.fullName.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {doc.title ? `${doc.title} ` : ''}
                              {doc.fullName}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-600 font-medium">
                          Bác sĩ điều trị
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSpecialty(null)}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
