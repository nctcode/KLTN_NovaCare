'use client';

import { useState, use, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { specialtyService } from '@/services/specialty.service';
import { SpecialtyBookingModal } from '@/components/features/booking/SpecialtyBookingModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2,
  MapPin,
  Star,
  Calendar,
  Clock,
  Stethoscope,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  Loader2,
  Navigation,
  Sparkles,
  Info,
  DollarSign,
  AlertCircle,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{
    specialtyId: string;
  }>;
}

function SpecialtyHospitalsContent({ specialtyId }: { specialtyId: string }) {
  const router = useRouter();

  // Patient Location state
  const [patientLocation, setPatientLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filters State
  const [selectedSort, setSelectedSort] = useState<string>('relevant');
  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Selected hospital for booking modal
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);

  // Get user geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị vị trí');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPatientLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError('Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí.');
      },
      { timeout: 10000 }
    );
  };

  // Build query params for API
  const queryParams: Record<string, any> = {
    sort: selectedSort,
  };

  if (patientLocation) {
    queryParams.lat = patientLocation.lat;
    queryParams.lng = patientLocation.lng;
  }

  if (selectedDistance !== 'all') {
    queryParams.maxDistance = Number(selectedDistance);
  }

  if (selectedDate !== 'all') {
    queryParams.date = selectedDate;
  }

  if (selectedTimeOfDay !== 'all') {
    queryParams.timeOfDay = selectedTimeOfDay;
  }

  if (selectedPriceRange === 'under-200k') {
    queryParams.maxPrice = 200000;
  } else if (selectedPriceRange === '200k-500k') {
    queryParams.minPrice = 200000;
    queryParams.maxPrice = 500000;
  } else if (selectedPriceRange === 'over-500k') {
    queryParams.minPrice = 500000;
  }

  if (onlyAvailable) {
    queryParams.onlyAvailable = true;
  }

  // Fetch Hospitals by Specialty from Backend API
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['specialty-hospitals', specialtyId, queryParams],
    queryFn: () => specialtyService.getHospitalsBySpecialty(specialtyId, queryParams),
  });

  const specialty = data?.specialty;
  const hospitalsList = data?.hospitals || [];

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedSort('relevant');
    setSelectedDistance('all');
    setSelectedDate('all');
    setSelectedTimeOfDay('all');
    setSelectedPriceRange('all');
    setOnlyAvailable(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 text-slate-900">
      {/* Banner & Breadcrumb Header */}
      <section className="bg-[#0c4b39] text-white py-10 sm:py-12 relative overflow-hidden">
        <div className="container-custom relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-200/90">
            <Link href="/" className="hover:text-white transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <Link href="/chuyen-khoa" className="hover:text-white transition-colors">
              Chuyên khoa
            </Link>
            <span>/</span>
            <span className="text-white font-bold">{specialty?.name || 'Chi tiết chuyên khoa'}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-200">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Luồng Đặt Lịch Theo Chuyên Khoa • NovaCare</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Khám Chuyên Khoa {specialty?.name || ''}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl">
                {specialty?.description ||
                  `Danh sách bệnh viện, phòng khám chuyên khoa ${specialty?.name || ''} uy tín. Đặt khám nhanh chóng, không mất thời gian chờ đợi.`}
              </p>
            </div>

            <Button
              onClick={() => router.push('/chuyen-khoa')}
              variant="outline"
              size="sm"
              className="bg-emerald-950/40 border-emerald-400/40 text-emerald-100 hover:bg-emerald-900/60 font-bold text-xs rounded-2xl h-10 px-4 self-start md:self-center shrink-0"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Chuyên khoa khác
            </Button>
          </div>
        </div>
      </section>

      <div className="container-custom mt-8 space-y-6">
        {/* Geolocation Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c4b39] flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">
                Định vị vị trí hiện tại của bạn
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {patientLocation
                  ? `Vị trí đã bật: Lat ${patientLocation.lat.toFixed(3)}, Lng ${patientLocation.lng.toFixed(3)} (Tính khoảng cách chuẩn xác)`
                  : 'Bật vị trí để tính khoảng cách và xếp hạng bệnh viện gần bạn nhất.'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGetLocation}
            disabled={locating}
            className={`h-10 px-4 rounded-xl text-xs font-bold shrink-0 transition-all ${
              patientLocation
                ? 'bg-emerald-100 text-[#0c4b39] border border-emerald-300 hover:bg-emerald-200'
                : 'bg-[#0c4b39] hover:bg-[#09382b] text-white shadow-xs'
            }`}
          >
            {locating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                <span>Đang định vị...</span>
              </>
            ) : patientLocation ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-[#0c4b39]" />
                <span>Đã bật vị trí</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-1.5" />
                <span>Lấy vị trí của tôi</span>
              </>
            )}
          </Button>
        </div>

        {/* Filter & Sorting Controls Bar */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          {/* Sorting Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-[#0c4b39]" />
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Sắp xếp theo:
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {[
                { id: 'relevant', label: '⭐ Phù hợp nhất', badge: 'Weighted Scoring' },
                { id: 'earliest', label: '⚡ Lịch sớm nhất' },
                { id: 'nearest', label: '📍 Gần tôi nhất', disabled: !patientLocation },
                { id: 'rating', label: '🏆 Rating cao' },
                { id: 'price', label: '💵 Giá thấp nhất' },
              ].map((tab) => {
                const isActive = selectedSort === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={tab.disabled}
                    onClick={() => setSelectedSort(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      isActive
                        ? 'bg-[#0c4b39] text-white shadow-xs'
                        : tab.disabled
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Criteria Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Distance Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0c4b39]" />
                <span>Khoảng cách</span>
              </label>
              <select
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(e.target.value)}
                disabled={!patientLocation}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold px-3 text-slate-800 focus:outline-none focus:border-[#0c4b39] disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="all">Tất cả khoảng cách</option>
                <option value="2">Dưới 2 km</option>
                <option value="5">Dưới 5 km</option>
                <option value="10">Dưới 10 km</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0c4b39]" />
                <span>Ngày khám</span>
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold px-3 text-slate-800 focus:outline-none focus:border-[#0c4b39]"
              >
                <option value="all">Tất cả các ngày</option>
                <option value="today">Hôm nay ({format(new Date(), 'dd/MM')})</option>
                <option value="tomorrow">Ngày mai</option>
                <option value="weekend">Cuối tuần này</option>
              </select>
            </div>

            {/* Time of Day Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#0c4b39]" />
                <span>Buổi trong ngày</span>
              </label>
              <select
                value={selectedTimeOfDay}
                onChange={(e) => setSelectedTimeOfDay(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold px-3 text-slate-800 focus:outline-none focus:border-[#0c4b39]"
              >
                <option value="all">Tất cả buổi</option>
                <option value="morning">Buổi sáng (00h - 12h)</option>
                <option value="afternoon">Buổi chiều (12h - 17h)</option>
                <option value="evening">Buổi tối (17h - 24h)</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#0c4b39]" />
                <span>Mức giá khám</span>
              </label>
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold px-3 text-slate-800 focus:outline-none focus:border-[#0c4b39]"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under-200k">Dưới 200.000đ</option>
                <option value="200k-500k">Từ 200.000đ - 500.000đ</option>
                <option value="over-500k">Trên 500.000đ</option>
              </select>
            </div>
          </div>

          {/* Bottom Controls Row: Checkbox & Reset */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyAvailable"
                checked={onlyAvailable}
                onCheckedChange={(checked) => setOnlyAvailable(!!checked)}
                className="data-[state=checked]:bg-[#0c4b39] border-slate-300"
              />
              <label
                htmlFor="onlyAvailable"
                className="text-xs font-bold text-slate-800 cursor-pointer select-none"
              >
                [✓] Chỉ hiển thị bệnh viện có lịch trống khả dụng
              </label>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-9 px-3 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>

        {/* Hospital Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0c4b39]" />
              <span>Cơ sở Y tế triển khai Chuyên khoa {specialty?.name || ''}</span>
            </h3>
            <span className="text-xs font-extrabold text-slate-600">
              Tìm thấy {hospitalsList.length} cơ sở
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-[#0c4b39] animate-spin" />
              <p className="text-xs font-bold text-slate-600">
                Đang tìm kiếm & tính toán thứ tự phù hợp nhất...
              </p>
            </div>
          ) : isError ? (
            <div className="py-12 bg-red-50 border border-red-200 rounded-3xl p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h4 className="font-extrabold text-red-900">Không thể tải dữ liệu bệnh viện</h4>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="text-xs font-bold border-red-300 text-red-700"
              >
                Thử lại
              </Button>
            </div>
          ) : hospitalsList.length === 0 ? (
            <div className="py-16 bg-white border border-slate-200/90 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-xs">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto" />
              <h4 className="font-extrabold text-slate-900 text-base">
                Không tìm thấy bệnh viện phù hợp
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Không có cơ sở y tế nào đáp ứng đầy đủ tất cả các tiêu chí lọc của bạn. Bạn thử thay
                đổi khoảng cách, ngày khám hoặc bỏ chọn "Chỉ hiển thị nơi còn lịch".
              </p>
              <Button
                onClick={handleResetFilters}
                className="bg-[#0c4b39] hover:bg-[#09382b] text-white font-bold text-xs h-10 px-6 rounded-xl"
              >
                Xem tất cả bệnh viện
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {hospitalsList.map((item: any) => {
                const hosp = item.hospital;
                const hasSlots = item.hasAvailableSlots;
                const score = item.finalScore;

                return (
                  <Card
                    key={hosp.id}
                    className="border border-slate-200/90 hover:border-[#0c4b39]/50 shadow-sm hover:shadow-md transition-all duration-200 rounded-3xl overflow-hidden bg-white"
                  >
                    <CardContent className="p-6 sm:p-7">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        {/* Hospital Info Left Column */}
                        <div className="flex items-start gap-4 flex-1">
                          {/* Logo Avatar */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-emerald-100 p-1 shadow-xs shrink-0 flex items-center justify-center">
                            {hosp.logoUrl ? (
                              <img
                                src={hosp.logoUrl}
                                alt={hosp.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <Building2 className="w-8 h-8 text-[#0c4b39]" />
                            )}
                          </div>

                          <div className="space-y-2">
                            {/* Badges & Scores */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {hosp.type && (
                                <Badge className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                  {hosp.type}
                                </Badge>
                              )}

                              {hosp.rating && (
                                <span className="flex items-center gap-1 text-amber-500 font-extrabold text-xs">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span>{hosp.rating}</span>
                                  <span className="text-slate-400">({hosp.reviewCount || 0})</span>
                                </span>
                              )}

                              {item.distance !== null && (
                                <Badge className="bg-emerald-50 text-[#0c4b39] border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  📍 Cách bạn {item.distance} km
                                </Badge>
                              )}

                              {selectedSort === 'relevant' && score > 0 && (
                                <Badge className="bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>Điểm phù hợp: {score}/100</span>
                                </Badge>
                              )}
                            </div>

                            {/* Hospital Title */}
                            <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-snug">
                              {hosp.name}
                            </h3>

                            {/* Address */}
                            <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#0c4b39] shrink-0" />
                              <span>{hosp.address}</span>
                            </p>

                            {/* Doctor Count & Price */}
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 pt-1 flex-wrap">
                              <span className="flex items-center gap-1 text-slate-800">
                                <Stethoscope className="w-4 h-4 text-[#0c4b39]" />
                                <span>{item.doctorCount} bác sĩ chuyên khoa</span>
                              </span>

                              <span className="flex items-center gap-1 text-[#0c4b39]">
                                <DollarSign className="w-4 h-4 text-[#0c4b39]" />
                                <span>Giá khám từ: {item.startingFee?.toLocaleString('vi-VN')}đ</span>
                              </span>
                            </div>

                            {/* Earliest Slot Status Banner */}
                            <div className="pt-2">
                              {hasSlots && item.earliestSlot ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-[#0c4b39]">
                                  <Clock className="w-4 h-4 text-[#0c4b39]" />
                                  <span>
                                    Lịch khám gần nhất: {format(new Date(item.earliestSlot), 'HH:mm - dd/MM/yyyy')}
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                                  <AlertCircle className="w-4 h-4 text-amber-600" />
                                  <span>Bệnh viện hiện chưa có lịch trống</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Hospital Action Button */}
                        <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              setSelectedHospitalForModal(hosp);
                              setIsBookingModalOpen(true);
                            }}
                            className="bg-[#0c4b39] hover:bg-[#09382b] text-white font-extrabold text-xs h-11 px-6 rounded-2xl w-full md:w-auto shadow-sm flex items-center justify-center gap-2"
                          >
                            <span>Xem bác sĩ & lịch khám</span>
                            <Stethoscope className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Specialty Booking Modal Flow */}
      {selectedHospitalForModal && specialty && (
        <SpecialtyBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedHospitalForModal(null);
          }}
          hospital={selectedHospitalForModal}
          specialty={specialty}
        />
      )}
    </div>
  );
}

export default function SpecialtyHospitalsPage({ params }: PageProps) {
  const { specialtyId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center py-20 bg-[#F8FAFC]">
          <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
        </div>
      }
    >
      <SpecialtyHospitalsContent specialtyId={specialtyId} />
    </Suspense>
  );
}
