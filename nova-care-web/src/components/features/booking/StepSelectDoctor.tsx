'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { hospitalService } from '@/services/hospital.service';
import { specialtyService } from '@/services/specialty.service';
import { medicalServiceService } from '@/services/medical-service.service';
import { healthPackageService } from '@/services/health-package.service';
import { hospitalBranchService } from '@/services/hospital-branch.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  ChevronRight,
  Star,
  Loader2,
  Stethoscope,
  Building2,
  MapPin,
  CheckCircle2,
  Filter,
  Users,
  Activity,
  Hospital as ClinicIcon,
  TestTube,
  PackageCheck,
  Check,
  Clock,
  Sparkles,
  Phone,
} from 'lucide-react';
import { formatPrice, getDoctorSpecialtyName } from '@/lib/utils';
import { HealthPackage, MedicalService, HospitalBranch } from '@/types';

interface StepSelectDoctorProps {
  onNext: () => void;
}

type BookingTab = 'doctor' | 'specialty' | 'hospital' | 'clinic' | 'service' | 'package';

export function StepSelectDoctor({ onNext }: StepSelectDoctorProps) {
  const { bookingData, setBookingData } = useBookingStore();
  const [activeTab, setActiveTab] = useState<BookingTab>('doctor');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(bookingData.doctorId);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(bookingData.hospitalId || '');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>(bookingData.specialtyId || '');

  // Queries
  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors-search', searchQuery, selectedHospitalId, selectedSpecialtyId],
    queryFn: () =>
      doctorService.search({
        q: searchQuery || undefined,
        hospitalId: selectedHospitalId === 'all' ? undefined : selectedHospitalId || undefined,
        specialtyId: selectedSpecialtyId === 'all' ? undefined : selectedSpecialtyId || undefined,
      }),
  });

  const { data: hospitals = [], isLoading: isLoadingHospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: hospitalService.getAll,
  });

  const { data: specialties = [], isLoading: isLoadingSpecialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: specialtyService.getAll,
  });

  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ['hospital-branches'],
    queryFn: () => hospitalBranchService.getAll(),
  });

  const { data: medicalServices = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['medical-services'],
    queryFn: () => medicalServiceService.getAll(),
  });

  const { data: healthPackages = [], isLoading: isLoadingPackages } = useQuery({
    queryKey: ['health-packages'],
    queryFn: () => healthPackageService.getAll(),
  });

  // Tab definitions
  const tabs = [
    { id: 'doctor', label: 'Đặt khám Bác sĩ', icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'specialty', label: 'Đặt khám Chuyên khoa', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'hospital', label: 'Đặt khám Bệnh viện', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'clinic', label: 'Đặt khám Phòng khám', icon: ClinicIcon, color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'service', label: 'Đặt khám Dịch vụ', icon: TestTube, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'package', label: 'Đặt khám Gói khám', icon: PackageCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  // Actions
  const handleSelectDoctor = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (doctor) {
      setSelectedDoctorId(doctorId);
      setBookingData({
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        specialtyId: doctor.workPlaces?.[0]?.specialtyId || null,
        hospitalId: doctor.workPlaces?.[0]?.hospitalId || null,
        workplaceId: doctor.workPlaces?.[0]?.id || null,
        bookingType: 'doctor',
      });
    }
  };

  const handleSelectSpecialty = (specialtyId: string) => {
    setSelectedSpecialtyId(specialtyId);
    setBookingData({
      specialtyId,
      bookingType: 'specialty',
    });
    // Switch to doctor tab filtered by specialty
    setActiveTab('doctor');
  };

  const handleSelectHospital = (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    setBookingData({
      hospitalId,
      bookingType: 'hospital',
    });
    // Switch to doctor tab filtered by hospital
    setActiveTab('doctor');
  };

  const handleSelectBranch = (branch: HospitalBranch) => {
    setSelectedHospitalId(branch.hospitalId);
    setBookingData({
      branchId: branch.id,
      hospitalId: branch.hospitalId,
      bookingType: 'clinic',
    });
    setActiveTab('doctor');
  };

  const handleSelectMedicalService = (service: MedicalService) => {
    setBookingData({
      medicalServiceId: service.id,
      medicalServiceName: service.name,
      hospitalId: service.hospitalId,
      bookingType: 'service',
    });
    if (service.hospitalId) {
      setSelectedHospitalId(service.hospitalId);
    }
    // Auto-select doctor from matching hospital if available
    const matchedDoctor = doctors.find((d) => d.workPlaces?.some((w) => w.hospitalId === service.hospitalId));
    if (matchedDoctor) {
      handleSelectDoctor(matchedDoctor.id);
    } else {
      setActiveTab('doctor');
    }
  };

  const handleSelectHealthPackage = (pkg: HealthPackage) => {
    setBookingData({
      healthPackageId: pkg.id,
      healthPackageName: pkg.name,
      hospitalId: pkg.hospitalId || null,
      bookingType: 'package',
    });
    if (pkg.hospitalId) {
      setSelectedHospitalId(pkg.hospitalId);
    }
    const matchedDoctor = doctors.find((d) => d.workPlaces?.some((w) => w.hospitalId === pkg.hospitalId));
    if (matchedDoctor) {
      handleSelectDoctor(matchedDoctor.id);
    } else {
      setActiveTab('doctor');
    }
  };

  const handleNext = () => {
    if (selectedDoctorId) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Badge & Title */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4caf50]/10 text-[#4caf50] text-xs font-bold uppercase tracking-wider mb-1">
            <Stethoscope className="w-3.5 h-3.5" />
            Bước 1: Lựa chọn hình thức đặt khám
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-secondary">
            {activeTab === 'doctor' && 'Danh sách bác sĩ chuyên khoa'}
            {activeTab === 'specialty' && 'Chọn chuyên khoa khám bệnh'}
            {activeTab === 'hospital' && 'Chọn bệnh viện / cơ sở y tế'}
            {activeTab === 'clinic' && 'Chọn phòng khám & chi nhánh'}
            {activeTab === 'service' && 'Chọn dịch vụ y tế lẻ'}
            {activeTab === 'package' && 'Danh sách gói khám sức khỏe tổng quát'}
          </h2>
        </div>
      </div>

      {/* 2. Modality Tabs Navigation (6 Tabs Bar) */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-1.5 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as BookingTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#4caf50] text-white shadow-sm ring-1 ring-[#4caf50]/30'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-secondary'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Filters Bar (Visible for Doctor tab or when filtering) */}
      {activeTab === 'doctor' && (
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-[#4caf50]" />
              Bộ lọc tìm kiếm bác sĩ
            </div>
            {(selectedHospitalId || selectedSpecialtyId) && (
              <button
                onClick={() => {
                  setSelectedHospitalId('');
                  setSelectedSpecialtyId('');
                  setSearchQuery('');
                }}
                className="text-[11px] font-semibold text-[#4caf50] hover:underline cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên bác sĩ..."
                className="pl-9 bg-white border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#4caf50] transition-all rounded-xl text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
              <SelectTrigger className="bg-white border-gray-200 focus:ring-0 focus:border-[#4caf50] rounded-xl text-sm">
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <SelectValue placeholder="Tất cả cơ sở y tế" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Tất cả cơ sở y tế</SelectItem>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSpecialtyId} onValueChange={setSelectedSpecialtyId}>
              <SelectTrigger className="bg-white border-gray-200 focus:ring-0 focus:border-[#4caf50] rounded-xl text-sm">
                <div className="flex items-center gap-2 truncate">
                  <Stethoscope className="w-4 h-4 text-gray-400 shrink-0" />
                  <SelectValue placeholder="Tất cả chuyên khoa" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
                {specialties.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* 4. Tab Content Container */}
      <div className="max-h-[520px] overflow-y-auto pr-1 space-y-4 scrollbar-thin">
        {/* TAB 1: DOCTOR LIST */}
        {activeTab === 'doctor' && (
          <>
            {isLoadingDoctors ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
                <p className="text-sm">Đang tải danh sách bác sĩ...</p>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Stethoscope className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">Không tìm thấy bác sĩ nào</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng thử lại với từ khóa hoặc bộ lọc khác</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => {
                  const workplace = doctor.workPlaces?.[0];
                  const isSelected = selectedDoctorId === doctor.id;
                  const visitsCount = doctor.consultationCount || (doctor.reviewCount ? doctor.reviewCount * 12 + 50 : 350);

                  return (
                    <Card
                      key={doctor.id}
                      className={`cursor-pointer transition-all duration-200 rounded-2xl bg-white relative overflow-hidden ${
                        isSelected
                          ? 'border-2 border-[#4caf50] bg-[#4caf50]/[0.02] shadow-md ring-2 ring-[#4caf50]/20'
                          : 'border border-gray-200 hover:border-[#4caf50]/60 hover:shadow-sm'
                      }`}
                      onClick={() => handleSelectDoctor(doctor.id)}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-[#4caf50] text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold flex items-center gap-1 z-10">
                          <CheckCircle2 className="w-3 h-3" />
                          ĐÃ CHỌN
                        </div>
                      )}

                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4caf50]/20 to-[#4caf50]/5 border border-[#4caf50]/20 flex items-center justify-center text-[#4caf50] font-bold text-xl shadow-inner">
                              {doctor.fullName.charAt(0)}
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Sẵn sàng nhận lịch" />
                          </div>

                          <div className="flex-1 min-w-0 pr-12">
                            <h3 className="font-bold text-secondary text-base truncate leading-snug">
                              {doctor.fullName}
                            </h3>
                            <p className="text-xs font-semibold text-[#4caf50] mt-0.5 truncate">
                              {doctor.qualification || 'Bác sĩ chuyên khoa'}
                            </p>

                            {/* Chuyên khoa badge */}
                            <div className="flex items-center gap-1 text-[11px] font-bold text-[#0c4b39] bg-[#0c4b39]/10 px-2 py-0.5 rounded-md mt-1 w-fit">
                              <Stethoscope className="w-3 h-3 text-[#0c4b39]" />
                              <span>Chuyên khoa: {getDoctorSpecialtyName(doctor)}</span>
                            </div>

                            {/* Rating & Reviews & Lượt khám */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <div className="flex items-center text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-gray-700">
                                {doctor.rating || 4.9}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <Users className="w-3 h-3 text-emerald-600" />
                                {visitsCount}+ lượt khám
                              </span>
                            </div>
                          </div>
                        </div>

                        {workplace?.hospital && (
                          <div className="bg-gray-50/80 rounded-xl p-2.5 text-xs space-y-1 text-gray-600 border border-gray-100">
                            <div className="flex items-center gap-1.5 font-semibold text-secondary truncate">
                              <Building2 className="w-3.5 h-3.5 text-[#4caf50] shrink-0" />
                              <span className="truncate">{workplace.hospital.name}</span>
                            </div>
                            <div className="flex items-start gap-1.5 text-gray-500 text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{workplace.hospital.address}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div>
                            <span className="text-[11px] text-gray-400 font-medium block">Phí khám công khai</span>
                            <span className="font-bold text-secondary text-base">
                              {workplace?.consultationFee ? `${formatPrice(workplace.consultationFee)}đ` : '350.000đ'}
                            </span>
                          </div>

                          <div className={`text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-[#4caf50] text-white'
                              : 'bg-emerald-50 text-[#4caf50] hover:bg-[#4caf50] hover:text-white'
                          }`}>
                            {isSelected ? 'Đã chọn bác sĩ' : 'Chọn lịch hẹn'}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: SPECIALTIES GRID */}
        {activeTab === 'specialty' && (
          <>
            {isLoadingSpecialties ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
                <p className="text-sm">Đang tải danh sách chuyên khoa...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {specialties.map((spec) => (
                  <Card
                    key={spec.id}
                    onClick={() => handleSelectSpecialty(spec.id)}
                    className="cursor-pointer transition-all duration-200 hover:border-[#4caf50] hover:shadow-md border border-gray-200 rounded-2xl bg-white p-4 flex items-center gap-3.5 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      {spec.icon || '🩺'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-secondary text-sm group-hover:text-[#4caf50] transition-colors truncate">
                        {spec.name}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {spec.description || 'Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#4caf50] transition-colors shrink-0" />
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 3: HOSPITALS LIST */}
        {activeTab === 'hospital' && (
          <>
            {isLoadingHospitals ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
                <p className="text-sm">Đang tải danh sách bệnh viện...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hospitals.map((hosp) => (
                  <Card
                    key={hosp.id}
                    onClick={() => handleSelectHospital(hosp.id)}
                    className="cursor-pointer transition-all duration-200 hover:border-[#4caf50] hover:shadow-md border border-gray-200 rounded-2xl bg-white p-4 space-y-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-secondary text-base group-hover:text-[#4caf50] transition-colors truncate">
                          {hosp.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {hosp.address}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 p-2.5 rounded-xl">
                      {hosp.description || 'Cơ sở y tế chất lượng cao với đầy đủ trang thiết bị khám chữa bệnh hiện đại.'}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                      <span className="text-amber-500 font-bold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {hosp.rating || 4.8} ({hosp.reviewCount || 100}+ đánh giá)
                      </span>
                      <span className="text-[#4caf50] font-bold group-hover:underline flex items-center gap-0.5">
                        Xem bác sĩ <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 4: CLINICS & BRANCHES */}
        {activeTab === 'clinic' && (
          <>
            {isLoadingBranches ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
                <p className="text-sm">Đang tải danh sách chi nhánh phòng khám...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((b) => (
                  <Card
                    key={b.id}
                    onClick={() => handleSelectBranch(b)}
                    className="cursor-pointer transition-all duration-200 hover:border-[#4caf50] hover:shadow-md border border-gray-200 rounded-2xl bg-white p-4 space-y-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <ClinicIcon className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-secondary text-base group-hover:text-[#4caf50] transition-colors truncate">
                          {b.name || 'Chi nhánh Phòng khám NovaCare'}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {b.address}
                        </p>
                      </div>
                    </div>
                    {b.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 p-2 rounded-xl">
                        <Phone className="w-3.5 h-3.5 text-[#4caf50]" />
                        <span>Hotline đặt hẹn: {b.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-end pt-1">
                      <span className="text-xs text-[#4caf50] font-bold flex items-center gap-0.5 group-hover:underline">
                        Đặt khám tại phòng khám này <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 5: MEDICAL SERVICES */}
        {activeTab === 'service' && (
          <>
            {isLoadingServices ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
                <p className="text-sm">Đang tải danh sách dịch vụ y tế...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicalServices.map((srv) => (
                  <Card
                    key={srv.id}
                    onClick={() => handleSelectMedicalService(srv)}
                    className="cursor-pointer transition-all duration-200 hover:border-[#4caf50] hover:shadow-md border border-gray-200 rounded-2xl bg-white p-4 space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <TestTube className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-secondary text-base group-hover:text-[#4caf50] transition-colors">
                            {srv.name}
                          </h3>
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" /> Thời gian: {srv.duration || 30} phút
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2">
                      {srv.description || 'Dịch vụ chẩn đoán y khoa chính xác, nhanh chóng với trang thiết bị đạt chuẩn.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-[11px] text-gray-400 font-medium block">Giá dịch vụ niêm yết</span>
                        <span className="font-bold text-secondary text-base text-[#4caf50]">
                          {formatPrice(srv.price)}đ
                        </span>
                      </div>
                      <Button className="bg-[#4caf50] hover:bg-[#439e47] text-white rounded-xl text-xs font-bold h-8 px-3">
                        Chọn dịch vụ này
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 6: HEALTH PACKAGES */}
        {activeTab === 'package' && (
          <>
            {isLoadingPackages ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
                <p className="text-sm">Đang tải danh sách gói khám...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthPackages.map((pkg) => {
                  const servicesList: string[] = Array.isArray(pkg.services)
                    ? (pkg.services as string[])
                    : ['Khám tổng quát', 'Xét nghiệm máu', 'Siêu âm'];

                  return (
                    <Card
                      key={pkg.id}
                      onClick={() => handleSelectHealthPackage(pkg)}
                      className="cursor-pointer transition-all duration-200 hover:border-[#4caf50] hover:shadow-md border border-gray-200 rounded-2xl bg-white p-5 space-y-3 relative overflow-hidden group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <PackageCheck className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block mb-0.5">
                              Gói khám ưu đãi
                            </span>
                            <h3 className="font-bold text-secondary text-base group-hover:text-[#4caf50] transition-colors leading-snug">
                              {pkg.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2">
                        {pkg.description || 'Chương trình tầm soát và chăm sóc sức khỏe toàn diện thiết kế bởi hội đồng chuyên gia.'}
                      </p>

                      {/* Included services list */}
                      <div className="bg-gray-50/80 rounded-xl p-3 space-y-1.5 border border-gray-100">
                        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#4caf50]" />
                          Danh mục dịch vụ bao gồm:
                        </span>
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                          {servicesList.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1 truncate">
                              <Check className="w-3 h-3 text-[#4caf50] shrink-0" />
                              <span className="truncate">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                          <span className="text-[11px] text-gray-400 font-medium block">Chi phí trọn gói</span>
                          <span className="font-extrabold text-secondary text-lg text-[#4caf50]">
                            {formatPrice(pkg.price)}đ
                          </span>
                        </div>

                        <Button className="bg-[#4caf50] hover:bg-[#439e47] text-white rounded-xl text-xs font-bold h-9 px-4 flex items-center gap-1 cursor-pointer">
                          Đặt gói khám này
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Action Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {selectedDoctorId ? (
            <span className="text-[#4caf50] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Đã chọn bác sĩ/lịch khám
            </span>
          ) : (
            <span>Vui lòng chọn 1 mục để tiếp tục</span>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={!selectedDoctorId}
          className="bg-[#4caf50] hover:bg-[#439e47] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
        >
          Tiếp tục chọn thời gian
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
