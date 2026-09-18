'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { specialtyService } from '@/services/specialty.service';
import { hospitalService } from '@/services/hospital.service';
import { DoctorCard } from '@/components/features/DoctorCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Stethoscope,
  Building2,
  Coins,
  Sparkles,
  UserCheck,
  CheckCircle2,
  RotateCcw,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Suspense } from 'react';
import { formatPrice } from '@/lib/utils';

function DoctorListContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialSpecialty = searchParams.get('specialtyId') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(searchQuery, 400);

  const [filters, setFilters] = useState({
    specialtyId: initialSpecialty,
    hospitalId: 'all',
    minPrice: 0,
    maxPrice: 1000000,
  });

  const [sortBy, setSortBy] = useState<'featured' | 'visits' | 'price-asc' | 'price-desc'>('featured');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const { data: specialties = [] } = useQuery({
    queryKey: ['specialties'],
    queryFn: specialtyService.getAll,
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: hospitalService.getAll,
  });

  const { data: rawDoctors = [], isLoading } = useQuery({
    queryKey: ['doctors', debouncedQuery, filters.specialtyId, filters.hospitalId],
    queryFn: () =>
      doctorService.search({
        q: debouncedQuery || undefined,
        specialtyId: filters.specialtyId === 'all' ? undefined : filters.specialtyId,
        hospitalId: filters.hospitalId === 'all' ? undefined : filters.hospitalId,
      }),
  });

  // Client-side price filtering & sorting
  const filteredAndSortedDoctors = useMemo(() => {
    let list = rawDoctors.filter((doc) => {
      const fee = doc.workPlaces?.[0]?.consultationFee || 200000;
      return fee >= filters.minPrice && fee <= filters.maxPrice;
    });

    if (sortBy === 'visits') {
      list = [...list].sort((a, b) => {
        const visitsA = a.consultationCount || (a.reviewCount ? a.reviewCount * 14 : 350);
        const visitsB = b.consultationCount || (b.reviewCount ? b.reviewCount * 14 : 350);
        return visitsB - visitsA;
      });
    } else if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => {
        const feeA = a.workPlaces?.[0]?.consultationFee || 200000;
        const feeB = b.workPlaces?.[0]?.consultationFee || 200000;
        return feeA - feeB;
      });
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => {
        const feeA = a.workPlaces?.[0]?.consultationFee || 200000;
        const feeB = b.workPlaces?.[0]?.consultationFee || 200000;
        return feeB - feeA;
      });
    }

    return list;
  }, [rawDoctors, filters.minPrice, filters.maxPrice, sortBy]);

  const clearFilters = () => {
    setFilters({
      specialtyId: 'all',
      hospitalId: 'all',
      minPrice: 0,
      maxPrice: 1000000,
    });
    setSearchQuery('');
    setSortBy('featured');
  };

  const activeFilterCount = (filters.specialtyId !== 'all' ? 1 : 0) +
    (filters.hospitalId !== 'all' ? 1 : 0) +
    (filters.maxPrice < 1000000 ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const selectedSpecialtyName = specialties.find(s => s.id === filters.specialtyId)?.name;
  const selectedHospitalName = hospitals.find(h => h.id === filters.hospitalId)?.name;

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Top Emerald Banner Header */}
      <section className="bg-gradient-to-r from-[#0c4b39] via-[#0e5843] to-[#073629] text-white pt-10 pb-12 shadow-lg relative overflow-hidden">
        {/* Glow backdrop circles */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-[#66FF33]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#66FF33] text-xs font-extrabold mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#66FF33]" />
              <span>Đội ngũ Y bác sĩ Chuyên khoa NovaCare</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              Tìm kiếm & Đặt lịch Bác sĩ Chuyên khoa
            </h1>
            <p className="text-sm md:text-base text-white/80 max-w-xl mx-auto mb-8 font-normal leading-relaxed">
              Kết nối trực tiếp với 500+ Bác sĩ ưu tú từ các Bệnh viện & Phòng khám lớn. Chủ động chọn giờ khám & nhận số thứ tự trực tuyến.
            </p>

            {/* Banner Search Input */}
            <div className="relative max-w-2xl mx-auto bg-white p-1.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/20">
              <Search className="h-5 w-5 text-gray-400 ml-3 shrink-0" />
              <Input
                type="text"
                placeholder="Tìm tên bác sĩ, chuyên khoa, phòng khám..."
                className="flex-1 border-none shadow-none focus-visible:ring-0 text-gray-800 placeholder:text-gray-400 text-sm md:text-base bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Button
                className="bg-[#0c4b39] hover:bg-[#083327] text-white font-bold px-6 h-11 rounded-xl shrink-0 cursor-pointer"
                onClick={() => {}}
              >
                Tìm bác sĩ
              </Button>
            </div>

            {/* Quick Specialty Filter Pills */}
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              <span className="text-xs text-white/70 font-semibold mr-1">Gợi ý nhanh:</span>
              <button
                onClick={() => setFilters(f => ({ ...f, specialtyId: 'all' }))}
                className={`text-xs px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                  filters.specialtyId === 'all'
                    ? 'bg-[#66FF33] text-[#0c4b39]'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                Tất cả chuyên khoa
              </button>
              {specialties.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFilters(f => ({ ...f, specialtyId: s.id }))}
                  className={`text-xs px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                    filters.specialtyId === s.id
                      ? 'bg-[#66FF33] text-[#0c4b39]'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="container-custom mt-8">
        {/* Mobile Filter Toggle */}
        <div className="flex md:hidden items-center justify-between gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="w-full bg-white border-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2 h-11 rounded-xl shadow-xs"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#0c4b39]" />
            <span>Bộ lọc bác sĩ ({activeFilterCount})</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar Filter Card */}
          <div className={`md:block ${showFiltersMobile ? 'block' : 'hidden'} w-full md:w-80 shrink-0 sticky top-24 z-20`}>
            <Card className="border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden bg-white">
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#0c4b39] font-extrabold text-base">
                    <Filter className="w-4 h-4 text-[#0c4b39]" />
                    <span>Bộ lọc tìm kiếm</span>
                    {activeFilterCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#0c4b39] text-white text-[11px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Xóa lọc</span>
                    </button>
                  )}
                </div>

                {/* Specialty Select */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#0c4b39]" />
                    <span>Chuyên khoa</span>
                  </label>
                  <Select
                    value={filters.specialtyId}
                    onValueChange={(value) =>
                      setFilters({ ...filters, specialtyId: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:ring-[#0c4b39] rounded-xl text-slate-800 font-medium">
                      <SelectValue placeholder="Tất cả chuyên khoa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-bold">Tất cả chuyên khoa</SelectItem>
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hospital Select */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0c4b39]" />
                    <span>Cơ sở Y tế / Bệnh viện</span>
                  </label>
                  <Select
                    value={filters.hospitalId}
                    onValueChange={(value) =>
                      setFilters({ ...filters, hospitalId: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:ring-[#0c4b39] rounded-xl text-slate-800 font-medium">
                      <SelectValue placeholder="Tất cả cơ sở" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-bold">Tất cả cơ sở y tế</SelectItem>
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Slider */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[#0c4b39]" />
                      <span>Phí khám tối đa</span>
                    </label>
                    <span className="text-xs font-extrabold text-[#0c4b39] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {formatPrice(filters.maxPrice)}đ
                    </span>
                  </div>
                  <Slider
                    min={100000}
                    max={1000000}
                    step={50000}
                    value={[filters.maxPrice]}
                    onValueChange={([val]) =>
                      setFilters({ ...filters, maxPrice: val })
                    }
                    className="py-2"
                  />
                  {/* Quick price presets */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => setFilters(f => ({ ...f, maxPrice: 300000 }))}
                      className={`text-[11px] font-bold py-1.5 rounded-lg border transition cursor-pointer ${
                        filters.maxPrice === 300000
                          ? 'bg-[#0c4b39] text-white border-[#0c4b39]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      &lt; 300k
                    </button>
                    <button
                      onClick={() => setFilters(f => ({ ...f, maxPrice: 500000 }))}
                      className={`text-[11px] font-bold py-1.5 rounded-lg border transition cursor-pointer ${
                        filters.maxPrice === 500000
                          ? 'bg-[#0c4b39] text-white border-[#0c4b39]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      &lt; 500k
                    </button>
                    <button
                      onClick={() => setFilters(f => ({ ...f, maxPrice: 1000000 }))}
                      className={`text-[11px] font-bold py-1.5 rounded-lg border transition cursor-pointer ${
                        filters.maxPrice === 1000000
                          ? 'bg-[#0c4b39] text-white border-[#0c4b39]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Tất cả
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full bg-[#0c4b39] hover:bg-[#083327] text-white font-extrabold h-11 rounded-xl transition shadow-md cursor-pointer mt-4"
                  onClick={() => setShowFiltersMobile(false)}
                >
                  Áp dụng bộ lọc
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Results Column */}
          <div className="flex-1 min-w-0 w-full">
            {/* Toolbar: Result stats & Sorting */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-[#1A2B3C] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#0c4b39]" />
                  <span>Danh sách Bác sĩ</span>
                  <span className="text-xs bg-emerald-100 text-[#0c4b39] font-black px-2.5 py-0.5 rounded-full">
                    {filteredAndSortedDoctors.length} bác sĩ
                  </span>
                </h2>

                {/* Active Filter Tags */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                    <span className="text-slate-400 font-medium">Lọc theo:</span>
                    {filters.specialtyId !== 'all' && selectedSpecialtyName && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#0c4b39] border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                        {selectedSpecialtyName}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
                          onClick={() => setFilters(f => ({ ...f, specialtyId: 'all' }))}
                        />
                      </span>
                    )}
                    {filters.hospitalId !== 'all' && selectedHospitalName && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold">
                        {selectedHospitalName}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
                          onClick={() => setFilters(f => ({ ...f, hospitalId: 'all' }))}
                        />
                      </span>
                    )}
                    {filters.maxPrice < 1000000 && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                        Dưới {formatPrice(filters.maxPrice)}đ
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
                          onClick={() => setFilters(f => ({ ...f, maxPrice: 1000000 }))}
                        />
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Sorting options */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sắp xếp:</span>
                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger className="h-9 border-slate-200 text-xs font-bold rounded-lg w-[170px] bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Bác sĩ nổi bật</SelectItem>
                    <SelectItem value="visits">Nhiều lượt khám nhất</SelectItem>
                    <SelectItem value="price-asc">Giá khám: Thấp đến cao</SelectItem>
                    <SelectItem value="price-desc">Giá khám: Cao đến thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Doctors Cards List */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39] mb-3" />
                <p className="text-slate-500 text-sm font-medium">Đang tải danh sách bác sĩ...</p>
              </div>
            ) : filteredAndSortedDoctors.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Không tìm thấy bác sĩ phù hợp</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  Rất tiếc, không có bác sĩ nào khớp với điều kiện lọc hiện tại. Thử thay đổi từ khóa hoặc xóa bớt bộ lọc.
                </p>
                <Button
                  onClick={clearFilters}
                  className="bg-[#0c4b39] hover:bg-[#083327] text-white font-bold px-6 h-10 rounded-xl"
                >
                  Xóa tất cả bộ lọc
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedDoctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39] mb-2" />
          <p className="text-slate-500 text-sm font-medium">Đang tải...</p>
        </div>
      }
    >
      <DoctorListContent />
    </Suspense>
  );
}

