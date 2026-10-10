'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hospitalAdminService } from '@/services/hospital-admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Search,
  Stethoscope,
  User,
  Loader2,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Coffee,
  LayoutList,
  CalendarDays,
  DollarSign,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ 2', fullLabel: 'Thứ Hai' },
  { value: 2, label: 'Thứ 3', fullLabel: 'Thứ Ba' },
  { value: 3, label: 'Thứ 4', fullLabel: 'Thứ Tư' },
  { value: 4, label: 'Thứ 5', fullLabel: 'Thứ Năm' },
  { value: 5, label: 'Thứ 6', fullLabel: 'Thứ Sáu' },
  { value: 6, label: 'Thứ 7', fullLabel: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật', fullLabel: 'Chủ Nhật' },
];

const DAY_NAMES: Record<number, string> = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  0: 'Chủ Nhật',
};

export default function HospitalAdminSchedulesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');

  const { data: rawSchedules = [], isLoading } = useQuery({
    queryKey: ['hospital-admin-schedules'],
    queryFn: hospitalAdminService.getSchedules,
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ['hospital-admin-specialties-list'],
    queryFn: hospitalAdminService.getSpecialties,
  });

  const schedules = useMemo(() => {
    return rawSchedules.filter((s: any) => {
      // Day filter
      if (selectedDay !== 'ALL' && s.dayOfWeek.toString() !== selectedDay) {
        return false;
      }
      // Specialty filter
      if (selectedSpecialty !== 'ALL' && s.specialty?.id !== selectedSpecialty) {
        return false;
      }
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const docName = (s.doctor?.fullName || '').toLowerCase();
        const specName = (s.specialty?.name || '').toLowerCase();
        if (!docName.includes(query) && !specName.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [rawSchedules, selectedDay, selectedSpecialty, search]);

  // Group schedules by day of week for calendar/grid view
  const schedulesByDay = useMemo(() => {
    const map: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
    for (const s of schedules) {
      if (map[s.dayOfWeek]) {
        map[s.dayOfWeek].push(s);
      }
    }
    return map;
  }, [schedules]);

  const activeSchedulesCount = useMemo(() => {
    return rawSchedules.filter((s: any) => s.isActive).length;
  }, [rawSchedules]);

  const uniqueDoctorsCount = useMemo(() => {
    const ids = new Set(rawSchedules.map((s: any) => s.doctor?.id).filter(Boolean));
    return ids.size;
  }, [rawSchedules]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Lịch Trực Bác Sĩ</h1>
              <p className="text-xs text-slate-500">
                Lịch làm việc định kỳ hàng tuần của các bác sĩ thuộc bệnh viện
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Link href="/hospital-admin/appointments" className="flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>Xem Lịch hẹn bệnh nhân</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng số ca trực tuần</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{rawSchedules.length}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Ca trực đang mở nhận lịch</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{activeSchedulesCount}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Bác sĩ có lịch trực</div>
              <div className="text-2xl font-black text-purple-700 mt-1">{uniqueDoctorsCount}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar & View Toggle */}
      <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto md:flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm bác sĩ hoặc chuyên khoa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-9 text-xs rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  aria-label="Lọc theo ngày trong tuần"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">Tất cả ngày trong tuần</option>
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.fullLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  aria-label="Lọc theo chuyên khoa"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">Tất cả chuyên khoa</option>
                  {specialties.map((spec: any) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Lưới tuần
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'table'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Danh sách
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main View Area */}
      {isLoading ? (
        <Card className="bg-white border-slate-200 p-12 text-center rounded-2xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Đang tải dữ liệu lịch trực...</p>
        </Card>
      ) : schedules.length === 0 ? (
        <Card className="bg-white border-slate-200 p-12 text-center rounded-2xl shadow-sm">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold text-slate-800">Không tìm thấy ca trực nào</p>
          <p className="text-xs text-slate-500 mt-1">
            Không có lịch làm việc phù hợp với tiêu chí tìm kiếm hiện tại.
          </p>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Weekly Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = schedulesByDay[day.value] || [];
            return (
              <div
                key={day.value}
                className="flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm min-h-[350px]"
              >
                {/* Day Header */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{day.label}</span>
                  <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-600 px-1.5 py-0 font-semibold">
                    {daySchedules.length} ca
                  </Badge>
                </div>

                {/* Day Content */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                  {daySchedules.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4 text-center text-[11px] text-slate-400">
                      Không có ca
                    </div>
                  ) : (
                    daySchedules.map((sch: any) => (
                      <div
                        key={sch.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          sch.isActive
                            ? 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:shadow-xs'
                            : 'bg-slate-50/50 border-slate-200/60 opacity-60'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                          <span className="truncate">
                            {sch.doctor?.title ? `${sch.doctor.title} ` : ''}
                            {sch.doctor?.fullName}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium truncate mt-0.5">
                          {sch.specialty?.name}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-700 mt-2 font-medium">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {sch.startTime} - {sch.endTime}
                          </span>
                        </div>
                        {sch.breakStart && sch.breakEnd && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <Coffee className="w-2.5 h-2.5" />
                            <span>
                              Nghỉ: {sch.breakStart}-{sch.breakEnd}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200 text-[10px]">
                          <span className="text-emerald-700 font-bold">
                            {sch.consultationFee
                              ? new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(sch.consultationFee)
                              : '0 đ'}
                          </span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              sch.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={sch.isActive ? 'Đang mở' : 'Tạm dừng'}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                    <th className="py-3 px-4">Ngày trong tuần</th>
                    <th className="py-3 px-4">Bác sĩ</th>
                    <th className="py-3 px-4">Chuyên khoa</th>
                    <th className="py-3 px-4">Thời gian làm việc</th>
                    <th className="py-3 px-4">Thời gian nghỉ trưa</th>
                    <th className="py-3 px-4 text-right">Giá khám</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {schedules.map((sch: any) => (
                    <tr key={sch.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium">
                          {DAY_NAMES[sch.dayOfWeek] || `Thứ ${sch.dayOfWeek}`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {sch.doctor?.title ? `${sch.doctor.title} ` : ''}
                          {sch.doctor?.fullName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{sch.specialty?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {sch.startTime} - {sch.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {sch.breakStart && sch.breakEnd ? (
                          <div className="flex items-center gap-1">
                            <Coffee className="w-3 h-3 text-slate-400" />
                            <span>
                              {sch.breakStart} - {sch.breakEnd}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Không nghỉ</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {sch.consultationFee
                          ? new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(sch.consultationFee)
                          : '0 đ'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sch.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                            Tạm ngưng
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
