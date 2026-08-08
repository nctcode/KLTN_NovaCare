'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospital.service';
import { doctorService } from '@/services/doctor.service';
import { specialtyService } from '@/services/specialty.service';
import { hospitalBranchService } from '@/services/hospital-branch.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Globe,
  Mail,
  Phone,
  Star,
  Loader2,
  Stethoscope,
  Users,
  Building2,
  Clock,
  ShieldCheck,
  Award,
  Layers,
  Search,
  ExternalLink,
  Calendar,
  Sparkles,
  Info,
  Maximize2,
  X,
  PhoneCall,
  Activity,
  BedDouble,
  Server,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, getDoctorSpecialtyName } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Format Type Enum to Friendly Vietnamese
const formatHospitalType = (type?: string) => {
  if (!type) return '';
  if (type === 'PUBLIC' || type === 'Công') return 'Bệnh viện Công';
  if (type === 'PRIVATE' || type === 'Tư nhân') return 'Bệnh viện Tư nhân';
  if (type === 'INTERNATIONAL' || type === 'Quốc tế') return 'Bệnh viện Quốc tế';
  return `Bệnh viện ${type}`;
};

// Format Status Enum to Friendly Vietnamese
const formatHospitalStatus = (status?: string) => {
  if (!status) return '';
  if (status === 'ACTIVE' || status === 'Hoạt động') return 'Hoạt động';
  if (status === 'PAUSED' || status === 'Tạm ngưng') return 'Tạm ngưng';
  if (status === 'TERMINATED' || status === 'Ngừng hợp tác') return 'Ngừng hợp tác';
  return status;
};

export default function HospitalDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);

  const [activeTab, setActiveTab] = useState('overview');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('ALL');

  const galleryRef = React.useRef<HTMLDivElement>(null);

  // Queries for real backend data
  const { data: hospital, isLoading: loadingHospital, error: hospitalError } = useQuery({
    queryKey: ['hospital-detail', id],
    queryFn: () => hospitalService.getById(id),
  });

  const { data: fetchedDoctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['hospital-doctors', id],
    queryFn: () => doctorService.search({ hospitalId: id }),
    enabled: !!id,
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ['specialties-all'],
    queryFn: () => specialtyService.getAll(),
  });

  const { data: fetchedBranches = [] } = useQuery({
    queryKey: ['hospital-branches', id],
    queryFn: () => hospitalBranchService.getAll(id),
    enabled: !!id,
  });

  const galleryImages = hospital?.images && hospital.images.length > 0 ? hospital.images : [];

  const handleScrollGallery = (direction: 'left' | 'right') => {
    if (galleryRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      galleryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredDoctors = fetchedDoctors.filter((doc) => {
    const matchName = doc.fullName.toLowerCase().includes(doctorSearch.toLowerCase());
    const matchSpecialty =
      selectedSpecialtyId === 'ALL' ||
      doc.workPlaces?.some((wp) => wp.specialtyId === selectedSpecialtyId);
    return matchName && matchSpecialty;
  });

  const mapEmbedUrl = React.useMemo(() => {
    if (hospital?.googleMapUrl) return hospital.googleMapUrl;
    if (hospital?.latitude && hospital?.longitude) {
      return `https://maps.google.com/maps?q=${hospital.latitude},${hospital.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    if (hospital?.address) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(
        hospital.address
      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    return '';
  }, [hospital?.googleMapUrl, hospital?.latitude, hospital?.longitude, hospital?.address]);

  const googleMapUrl = React.useMemo(() => {
    if (hospital?.googleMapUrl) return hospital.googleMapUrl;
    if (hospital?.address) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(hospital.address)}`;
    }
    return '';
  }, [hospital?.googleMapUrl, hospital?.address]);

  if (loadingHospital) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[500px] gap-3">
        <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
        <p className="text-xs font-bold text-slate-800">Đang tải dữ liệu từ hệ thống...</p>
      </div>
    );
  }

  if (hospitalError || !hospital) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[450px] gap-4 text-center px-4">
        <Building2 className="w-12 h-12 text-slate-400" />
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy cơ sở y tế</h2>
        <p className="text-slate-600 text-xs leading-relaxed max-w-md">
          Cơ sở y tế không tồn tại hoặc đã bị gỡ trên hệ thống NovaCare.
        </p>
        <Button asChild className="bg-[#0c4b39] hover:bg-[#09392b] text-white text-xs rounded-xl">
          <Link href="/co-so-y-te">Quay lại danh sách cơ sở y tế</Link>
        </Button>
      </div>
    );
  }

  const phoneValue = hospital.hotline || hospital.phone;
  const hospitalTypeLabel = formatHospitalType(hospital.type);
  const hospitalStatusLabel = formatHospitalStatus(hospital.status);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 text-slate-900">
      {/* ==================================================
          1. HEADER BANNER & BACK BUTTON
         ================================================== */}
      <div className="relative w-full h-[280px] sm:h-[340px] md:h-[380px] bg-slate-950 overflow-hidden">
        <img
          src={hospital.coverImageUrl || hospital.coverImage || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80'}
          alt={hospital.name}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />

        <div className="absolute top-4 left-0 right-0 z-20">
          <div className="container-custom flex items-center justify-between">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl shadow-lg border border-slate-200 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4 text-[#0c4b39]" />
              Quay lại
            </Button>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#0c4b39] text-white shadow-md border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Đối tác NovaCare
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container-custom -mt-24 sm:-mt-28 md:-mt-32 relative z-30 space-y-6">
        {/* ==================================================
            2. SUMMARY CARD
           ================================================== */}
        <Card className="border border-slate-200/80 shadow-xl rounded-3xl bg-white overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Logo Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-white p-2 border border-slate-200 shadow-md ring-4 ring-white flex items-center justify-center">
                  {hospital.logoUrl ? (
                    <img
                      src={hospital.logoUrl}
                      alt={hospital.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-[#0c4b39]" />
                  )}
                </div>
              </div>

              {/* Information Summary */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {hospitalStatusLabel && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-900 border-emerald-300 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-none"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      {hospitalStatusLabel}
                    </Badge>
                  )}

                  {hospitalTypeLabel && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-950 border-blue-200 text-xs font-bold px-3 py-1 rounded-xl shadow-none"
                    >
                      {hospitalTypeLabel}
                    </Badge>
                  )}

                  {hospital.rating ? (
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-xl border border-amber-200">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>{hospital.rating}</span>
                      {hospital.reviewCount ? (
                        <span className="text-amber-800 font-semibold">
                          ({hospital.reviewCount} đánh giá)
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                  {hospital.name}
                </h1>

                {hospital.address && (
                  <p className="flex items-start gap-2 text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                    <MapPin className="w-4 h-4 text-[#0c4b39] shrink-0 mt-0.5" />
                    <span>{hospital.address}</span>
                  </p>
                )}

                {/* Quick Info Badges (Only render existing fields) */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {phoneValue && (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100/80 text-xs font-bold text-slate-800 flex items-center gap-2">
                      <PhoneCall className="w-3.5 h-3.5 text-[#0c4b39]" />
                      <span>Hotline: <strong className="text-slate-950">{phoneValue}</strong></span>
                    </div>
                  )}

                  {hospital.operatingHours && (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100/80 text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#0c4b39]" />
                      <span>Giờ làm việc: <strong className="text-slate-950">{hospital.operatingHours}</strong></span>
                    </div>
                  )}

                  {fetchedDoctors.length > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100/80 text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#0c4b39]" />
                      <span>Đội ngũ: <strong className="text-slate-950">{fetchedDoctors.length} bác sĩ</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Booking Button */}
              <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
                <Button
                  asChild
                  className="w-full md:w-auto bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs sm:text-sm h-12 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Link href={`/dat-kham-co-so?hospitalId=${hospital.id}`}>
                    <Calendar className="w-4 h-4" />
                    Đặt lịch khám ngay
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================================================
            3. TABS NAVIGATION
         ================================================== */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white p-2 rounded-3xl border border-slate-200/80 shadow-sm sticky top-4 z-40">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl h-auto">
              <TabsTrigger
                value="overview"
                className="text-xs font-extrabold py-2.5 rounded-xl data-[state=active]:bg-[#0c4b39] data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tổng quan</span>
              </TabsTrigger>

              <TabsTrigger
                value="info"
                className="text-xs font-extrabold py-2.5 rounded-xl data-[state=active]:bg-[#0c4b39] data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Thông tin chi tiết</span>
              </TabsTrigger>

              <TabsTrigger
                value="branches"
                className="text-xs font-extrabold py-2.5 rounded-xl data-[state=active]:bg-[#0c4b39] data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Cơ sở ({fetchedBranches.length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="doctors"
                className="text-xs font-extrabold py-2.5 rounded-xl data-[state=active]:bg-[#0c4b39] data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Bác sĩ ({fetchedDoctors.length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="specialties"
                className="text-xs font-extrabold py-2.5 rounded-xl data-[state=active]:bg-[#0c4b39] data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Chuyên khoa ({specialties.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ==================================================
              TAB 1: TỔNG QUAN (OVERVIEW)
             ================================================== */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="border border-slate-200/80 shadow-sm rounded-3xl bg-white p-6 sm:p-8 space-y-6">
              {hospital.description && (
                <div>
                  <h3 className="text-lg font-black text-slate-950 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#0c4b39]" />
                    Giới thiệu tổng quan
                  </h3>
                  <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line">
                    {hospital.description}
                  </p>
                </div>
              )}

              {/* Real System Scale Summary (Omit tiles for missing data) */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-950">Thống kê quy mô thực tế</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {fetchedDoctors.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-center">
                      <Users className="w-6 h-6 text-[#0c4b39] mx-auto mb-1" />
                      <p className="text-xl font-black text-slate-950">{fetchedDoctors.length}</p>
                      <p className="text-xs text-slate-800 font-bold mt-0.5">Bác sĩ liên kết</p>
                    </div>
                  )}

                  {specialties.length > 0 && (
                    <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-center">
                      <Activity className="w-6 h-6 text-blue-700 mx-auto mb-1" />
                      <p className="text-xl font-black text-slate-950">{specialties.length}</p>
                      <p className="text-xs text-slate-800 font-bold mt-0.5">Chuyên khoa tích hợp</p>
                    </div>
                  )}

                  {fetchedBranches.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/70 text-center">
                      <Building2 className="w-6 h-6 text-indigo-700 mx-auto mb-1" />
                      <p className="text-xl font-black text-slate-950">{fetchedBranches.length}</p>
                      <p className="text-xs text-slate-800 font-bold mt-0.5">Cơ sở chi nhánh</p>
                    </div>
                  )}

                  {hospital.establishedYear && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-center">
                      <Award className="w-6 h-6 text-amber-700 mx-auto mb-1" />
                      <p className="text-xl font-black text-slate-950">{hospital.establishedYear}</p>
                      <p className="text-xs text-slate-800 font-bold mt-0.5">Năm thành lập</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery Images */}
              {galleryImages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#0c4b39]" />
                      Hình ảnh cơ sở y tế ({galleryImages.length} hình)
                    </h4>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleScrollGallery('left')}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-xl border-slate-300 text-slate-800 hover:bg-slate-100"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleScrollGallery('right')}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-xl border-slate-300 text-slate-800 hover:bg-slate-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div
                    ref={galleryRef}
                    className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x cursor-grab active:cursor-grabbing"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {galleryImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveImageIdx(idx);
                          setLightboxOpen(true);
                        }}
                        className="group relative shrink-0 w-64 sm:w-72 h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-sm snap-start cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                      >
                        <img
                          src={imgUrl}
                          alt={`${hospital.name} - Ảnh ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <span className="text-[10px] text-slate-200 font-semibold flex items-center gap-1">
                            <Maximize2 className="w-2.5 h-2.5 text-emerald-400" /> Xem ảnh {idx + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ==================================================
              TAB 2: THÔNG TIN CHI TIẾT (ONLY RENDER EXISTING FIELDS)
             ================================================== */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SECTION 1: THÔNG TIN CƠ BẢN CỦA BỆNH VIỆN */}
              <Card className="border border-slate-200/80 shadow-sm rounded-3xl bg-white p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-[#0c4b39] border border-emerald-200/60">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950">1. Thông tin cơ bản của bệnh viện</h3>
                    <p className="text-xs text-slate-600 font-medium">Hồ sơ & Quy mô chứng nhận</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hospital.name && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1 sm:col-span-2">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Tên chính thức</span>
                      <p className="font-extrabold text-slate-950 text-xs leading-snug">{hospital.name}</p>
                    </div>
                  )}

                  {hospitalTypeLabel && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Phân loại cơ sở</span>
                      <div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-950 border-blue-200 font-bold text-xs">
                          {hospitalTypeLabel}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {hospitalStatusLabel && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Trạng thái hệ thống</span>
                      <div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-950 border-emerald-300 font-bold text-xs">
                          {hospitalStatusLabel}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {hospital.establishedYear && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Năm thành lập</span>
                      <p className="font-extrabold text-slate-950 text-xs">Năm {hospital.establishedYear}</p>
                    </div>
                  )}

                  {hospital.bedCount && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Giường bệnh</span>
                      <p className="font-extrabold text-slate-950 text-xs">{hospital.bedCount} giường bệnh</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* SECTION 2: THÔNG TIN LIÊN HỆ */}
              <Card className="border border-slate-200/80 shadow-sm rounded-3xl bg-white p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/60">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950">2. Thông tin liên hệ</h3>
                    <p className="text-xs text-slate-600 font-medium">Kênh hỗ trợ & Đường dây nóng</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hospital.address && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1 sm:col-span-2">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Địa chỉ trụ sở chính</span>
                      <p className="font-extrabold text-slate-950 text-xs leading-snug">{hospital.address}</p>
                    </div>
                  )}

                  {phoneValue && (
                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                      <span className="text-[11px] text-[#0c4b39] font-extrabold uppercase tracking-wider">Hotline Đặt khám</span>
                      <p className="font-black text-[#0c4b39] text-sm">{phoneValue}</p>
                    </div>
                  )}

                  {hospital.emergencyHotline && (
                    <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 space-y-1">
                      <span className="text-[11px] text-rose-800 font-extrabold uppercase tracking-wider">Hotline Cấp cứu</span>
                      <p className="font-black text-rose-700 text-sm">{hospital.emergencyHotline}</p>
                    </div>
                  )}

                  {hospital.email && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Email liên hệ</span>
                      <p className="font-bold text-slate-950 text-xs truncate">{hospital.email}</p>
                    </div>
                  )}

                  {hospital.website && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Website chính thức</span>
                      <a
                        href={hospital.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#0c4b39] hover:underline text-xs truncate flex items-center gap-1"
                      >
                        {hospital.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </Card>

              {/* SECTION 3: VỊ TRÍ & BẢN ĐỒ (Render map only if embed or address exists) */}
              <Card className="border border-slate-200/80 shadow-sm rounded-3xl bg-white p-6 sm:p-8 space-y-5 md:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-950">3. Vị trí địa lý & Bản đồ (Google Maps)</h3>
                      <p className="text-xs text-slate-600 font-medium">Định vị trực tuyến trên bản đồ số</p>
                    </div>
                  </div>

                  {googleMapUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-[#0c4b39] text-[#0c4b39] hover:bg-emerald-50 text-xs font-bold rounded-2xl flex items-center gap-1.5"
                    >
                      <a href={googleMapUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Mở Google Maps chỉ đường
                      </a>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 space-y-3">
                    {hospital.city && (
                      <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                        <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Tỉnh / Thành phố</span>
                        <p className="font-black text-slate-950 text-xs">{hospital.city}</p>
                      </div>
                    )}

                    {hospital.address && (
                      <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                        <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Địa chỉ chi tiết</span>
                        <p className="font-extrabold text-slate-950 text-xs leading-snug">{hospital.address}</p>
                      </div>
                    )}

                    {hospital.latitude && hospital.longitude && (
                      <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                        <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Tọa độ địa lý (GPS)</span>
                        <p className="font-mono font-bold text-slate-950 text-xs">
                          {hospital.latitude}, {hospital.longitude}
                        </p>
                      </div>
                    )}
                  </div>

                  {mapEmbedUrl && (
                    <div className="lg:col-span-7 h-[280px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                      <iframe
                        title={`Bản đồ ${hospital.name}`}
                        src={mapEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* SECTION 4: THÔNG TIN HỆ THỐNG NOVACARE */}
              <Card className="border border-slate-200/80 shadow-sm rounded-3xl bg-white p-6 sm:p-8 space-y-5 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/60">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950">4. Thông tin kết nối hệ thống NovaCare</h3>
                    <p className="text-xs text-slate-600 font-medium">Trạng thái đồng bộ dữ liệu hạ tầng y tế</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                    <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Mã ID hệ thống</span>
                    <p className="font-mono font-black text-slate-950 text-xs truncate">{hospital.id}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                    <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Trạng thái API</span>
                    <p className="font-extrabold text-emerald-800 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      {hospital.isActive ? 'Đã kết nối trực tuyến' : 'Tạm ngưng kết nối'}
                    </p>
                  </div>

                  {fetchedBranches.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Số cơ sở chi nhánh</span>
                      <p className="font-black text-slate-950 text-xs">{fetchedBranches.length} cơ sở</p>
                    </div>
                  )}

                  {fetchedDoctors.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 space-y-1">
                      <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Số bác sĩ đồng bộ</span>
                      <p className="font-black text-slate-950 text-xs">{fetchedDoctors.length} bác sĩ</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ==================================================
              TAB 3: CƠ SỞ (BRANCHES)
             ================================================== */}
          <TabsContent value="branches" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0c4b39]" />
                  Danh sách cơ sở & Chi nhánh thực tế
                </h3>
                <span className="text-xs text-slate-800 font-black">
                  Tổng số: {fetchedBranches.length} cơ sở
                </span>
              </div>

              {fetchedBranches.length === 0 ? (
                <Card className="border border-slate-200 shadow-sm rounded-3xl bg-white p-12 text-center space-y-2">
                  <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Chưa có chi nhánh phụ cho cơ sở y tế này.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fetchedBranches.map((br) => (
                    <Card
                      key={br.id}
                      className="border border-slate-200/80 shadow-sm rounded-3xl bg-white overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {br.image && (
                          <div className="h-44 w-full overflow-hidden relative">
                            <img
                              src={br.image}
                              alt={br.name || 'Chi nhánh'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <CardContent className="p-6 space-y-3">
                          <h4 className="font-black text-slate-950 text-base leading-snug">
                            {br.name || 'Cơ sở chi nhánh'}
                          </h4>

                          <div className="space-y-2 text-xs text-slate-800 font-semibold">
                            {br.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-[#0c4b39] shrink-0 mt-0.5" />
                                <span>{br.address}</span>
                              </div>
                            )}

                            {br.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#0c4b39] shrink-0" />
                                <span>Điện thoại: <strong className="text-slate-950">{br.phone}</strong></span>
                              </div>
                            )}

                            {br.workingHours && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#0c4b39] shrink-0" />
                                <span>Giờ làm việc: <strong className="text-slate-950">{br.workingHours}</strong></span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </div>

                      <div className="px-6 pb-6 pt-0 flex items-center gap-3">
                        {br.mapEmbedUrl && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full text-xs font-extrabold rounded-2xl border-slate-300 text-slate-900 hover:bg-slate-100"
                          >
                            <a href={br.mapEmbedUrl} target="_blank" rel="noopener noreferrer">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-[#0c4b39]" /> Xem Bản đồ
                            </a>
                          </Button>
                        )}
                        <Button
                          asChild
                          size="sm"
                          className="w-full text-xs font-extrabold rounded-2xl bg-[#0c4b39] hover:bg-[#083629] text-white"
                        >
                          <Link href={`/dat-lich?workplaceId=${br.id}`}>Đặt lịch tại đây</Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ==================================================
              TAB 4: BÁC SĨ (DOCTORS)
             ================================================== */}
          <TabsContent value="doctors" className="space-y-6">
            <Card className="border border-slate-200/80 shadow-sm rounded-3xl bg-white p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Tìm tên bác sĩ..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    className="pl-9 text-xs rounded-2xl border-slate-300 font-semibold text-slate-950 placeholder:text-slate-500"
                  />
                </div>

                <div className="w-full sm:w-64">
                  <select
                    value={selectedSpecialtyId}
                    onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0c4b39]"
                  >
                    <option value="ALL">Tất cả chuyên khoa ({specialties.length})</option>
                    {specialties.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingDoctors ? (
                <div className="py-16 text-center">
                  <Loader2 className="animate-spin h-8 w-8 text-[#0c4b39] mx-auto" />
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="py-16 text-center space-y-2 border border-dashed border-slate-300 rounded-2xl">
                  <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-800 font-bold">Chưa tìm thấy bác sĩ phù hợp trong hệ thống.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDoctors.map((doc) => {
                    const firstWp = doc.workPlaces && doc.workPlaces.length > 0 ? doc.workPlaces[0] : null;
                    const specName = getDoctorSpecialtyName(doc);
                    const fee = firstWp?.consultationFee ? Number(firstWp.consultationFee) : 250000;

                    return (
                      <Card
                        key={doc.id}
                        className="hover:shadow-md transition-all border border-slate-200 bg-white rounded-3xl overflow-hidden flex flex-col justify-between"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3.5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-[#0c4b39] text-lg">
                              {doc.avatarUrl ? (
                                <img
                                  src={doc.avatarUrl}
                                  alt={doc.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                doc.fullName.charAt(0)
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-extrabold text-slate-950 text-sm truncate hover:text-[#0c4b39]">
                                <Link href={`/bac-si/${doc.id}`}>{doc.fullName}</Link>
                              </h4>

                              <p className="text-xs font-bold text-[#0c4b39] mt-0.5 truncate flex items-center gap-1">
                                <Stethoscope className="w-3 h-3 text-[#0c4b39]" />
                                <span>{specName}</span>
                              </p>

                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-0.5 text-xs font-bold text-amber-950 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                  <span>{doc.rating || 5.0}</span>
                                </div>
                                {doc.reviewCount ? (
                                  <span className="text-xs text-slate-700 font-semibold">
                                    ({doc.reviewCount} đánh giá)
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-3 pt-2 text-xs font-bold flex items-center justify-between">
                                <span className="text-slate-700">Giá khám:</span>
                                <span className="text-[#0c4b39] font-black">
                                  {formatPrice(fee)}đ
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>

                        <div className="px-5 pb-5 pt-0">
                          <Button
                            asChild
                            className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-extrabold h-9 rounded-2xl"
                          >
                            <Link href={`/dat-lich?doctorId=${doc.id}&hospitalId=${hospital.id}`}>
                              Đặt lịch khám
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ==================================================
              TAB 5: CHUYÊN KHOA (SPECIALTIES)
             ================================================== */}
          <TabsContent value="specialties" className="space-y-6">
            <Card className="border border-slate-200/80 shadow-sm rounded-3xl bg-white p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0c4b39]" />
                  Danh sách chuyên khoa y tế ({specialties.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialties.length > 0 ? (
                  specialties.map((spec) => (
                    <div
                      key={spec.id}
                      className="p-5 rounded-3xl bg-slate-50/90 border border-slate-200/70 hover:border-emerald-400 transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-300 text-[#0c4b39] flex items-center justify-center shadow-sm">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-xs bg-white border-slate-300 text-slate-800 font-bold rounded-xl">
                          Chuyên khoa
                        </Badge>
                      </div>

                      <h4 className="font-black text-slate-950 text-sm">
                        {spec.name}
                      </h4>

                      {spec.description && (
                        <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">
                          {spec.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-800 font-bold col-span-3 text-center py-8">
                    Đang cập nhật danh sách chuyên khoa...
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Lightbox Modal for Gallery Images */}
      {lightboxOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 text-white hover:text-slate-300 p-2 rounded-full bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full space-y-3 text-center">
            <div className="relative overflow-hidden rounded-3xl bg-black border border-white/10 max-h-[75vh]">
              <img
                src={galleryImages[activeImageIdx]}
                alt={`Ảnh ${activeImageIdx + 1}`}
                className="w-full h-auto max-h-[75vh] object-contain mx-auto"
              />
            </div>

            <div className="flex items-center justify-between text-white px-2">
              <Button
                onClick={() =>
                  setActiveImageIdx((prev) =>
                    prev === 0 ? galleryImages.length - 1 : prev - 1
                  )
                }
                variant="ghost"
                className="text-white hover:bg-white/10 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Ảnh trước
              </Button>

              <p className="text-xs font-bold text-slate-200">
                Hình ảnh {activeImageIdx + 1} / {galleryImages.length}
              </p>

              <Button
                onClick={() =>
                  setActiveImageIdx((prev) =>
                    prev === galleryImages.length - 1 ? 0 : prev + 1
                  )
                }
                variant="ghost"
                className="text-white hover:bg-white/10 text-xs font-bold"
              >
                Ảnh sau <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
