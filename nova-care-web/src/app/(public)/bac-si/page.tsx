'use client';

import { useState } from 'react';
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
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Suspense } from 'react';
import { formatPrice } from '@/lib/utils';

function DoctorListContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialSpecialty = searchParams.get('specialtyId') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(searchQuery, 500);

  const [filters, setFilters] = useState({
    specialtyId: initialSpecialty,
    hospitalId: '',
    minPrice: 0,
    maxPrice: 1000000,
  });

  const [showFilters, setShowFilters] = useState(false);

  const { data: specialties = [] } = useQuery({
    queryKey: ['specialties'],
    queryFn: specialtyService.getAll,
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: hospitalService.getAll,
  });

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors', debouncedQuery, filters],
    queryFn: () =>
      doctorService.search({
        q: debouncedQuery || undefined,
        specialtyId: filters.specialtyId || undefined,
        hospitalId: filters.hospitalId || undefined,
      }),
  });

  const clearFilters = () => {
    setFilters({
      specialtyId: '',
      hospitalId: '',
      minPrice: 0,
      maxPrice: 1000000,
    });
    setSearchQuery('');
  };

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-secondary">Tìm kiếm bác sĩ</h1>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Bộ lọc
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm bác sĩ theo tên, chuyên khoa..."
            className="pl-10 border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#4caf50] focus-visible:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters - Desktop & Responsive */}
        <div className={`md:block ${showFilters ? 'block' : 'hidden'} w-full md:w-72 flex-shrink-0`}>
          <Card className="border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden bg-white">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-secondary">Bộ lọc</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-secondary">
                  <X className="h-4 w-4 mr-1" />
                  Xóa
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Chuyên khoa</label>
                <Select
                  value={filters.specialtyId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, specialtyId: value })
                  }
                >
                  <SelectTrigger className="border-gray-200 focus:ring-0 focus:ring-offset-0 focus:border-[#4caf50] focus:outline-none transition-all">
                    <SelectValue placeholder="Tất cả chuyên khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cơ sở y tế</label>
                <Select
                  value={filters.hospitalId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, hospitalId: value })
                  }
                >
                  <SelectTrigger className="border-gray-200 focus:ring-0 focus:ring-offset-0 focus:border-[#4caf50] focus:outline-none transition-all">
                    <SelectValue placeholder="Tất cả cơ sở" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả cơ sở</SelectItem>
                    {hospitals.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-750 block">
                  Phí khám tối đa: {formatPrice(filters.maxPrice)}đ
                </label>
                <Slider
                  min={0}
                  max={1000000}
                  step={50000}
                  value={[filters.minPrice, filters.maxPrice]}
                  onValueChange={([min, max]) =>
                    setFilters({ ...filters, minPrice: min, maxPrice: max })
                  }
                />
              </div>

              <Button className="w-full bg-[#4caf50] hover:bg-[#439e47] text-white font-bold transition" onClick={() => setShowFilters(false)}>
                Áp dụng bộ lọc
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border p-6">
              <p className="text-gray-500">Không tìm thấy bác sĩ nào phù hợp</p>
              <Button variant="link" onClick={clearFilters} className="font-semibold">
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Tìm thấy {doctors.length} bác sĩ
              </p>
              {doctors.map((doctor) => {
                // Lọc thêm theo giá khám
                const defaultFee = doctor.workPlaces?.[0]?.consultationFee || 0;
                if (defaultFee < filters.minPrice || defaultFee > filters.maxPrice) {
                  return null;
                }
                return <DoctorCard key={doctor.id} doctor={doctor} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DoctorListPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    }>
      <DoctorListContent />
    </Suspense>
  );
}
