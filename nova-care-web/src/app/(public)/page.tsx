'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { homeService } from '@/services/home.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  Loader2,
  User,
  FileText,
  Calendar,
  Building,
  Tag
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Specialty mapping to match screenshot aesthetics
const getSpecialtyDetails = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes('tim mạch')) {
    return {
      icon: '❤️',
      desc: 'Chẩn đoán, điều trị các bệnh lý tim mạch, cao huyết áp, suy tim hiệu quả.',
    };
  }
  if (normalized.includes('thần kinh')) {
    return {
      icon: '🧠',
      desc: 'Chăm sóc và điều trị chuyên sâu về thần kinh, đột quỵ, đau đầu, sa sút trí tuệ.',
    };
  }
  if (normalized.includes('nội tiết') || normalized.includes('nội khoa')) {
    return {
      icon: '🫁',
      desc: 'Theo dõi, khám và điều trị đái tháo đường, bệnh lý tuyến giáp, rối loạn chuyển hóa.',
    };
  }
  if (normalized.includes('nhi')) {
    return {
      icon: '👶',
      desc: 'Khám nhi toàn diện, tư vấn dinh dưỡng, tiêm chủng và theo dõi sự phát triển của trẻ.',
    };
  }
  if (normalized.includes('sản') || normalized.includes('phụ')) {
    return {
      icon: '🤰',
      desc: 'Chăm sóc sức khỏe thai sản, tầm soát ung thư phụ khoa, điều trị vô sinh hiếm muộn.',
    };
  }
  if (normalized.includes('xương') || normalized.includes('khớp')) {
    return {
      icon: '🦴',
      desc: 'Khám và điều trị thoái hóa khớp, cột sống, loãng xương, viêm khớp tự miễn.',
    };
  }
  if (normalized.includes('tai') || normalized.includes('họng')) {
    return {
      icon: '👂',
      desc: 'Điều trị viêm tai, viêm mũi xoang, viêm họng hạt, khàn tiếng ở người lớn và trẻ em.',
    };
  }
  if (normalized.includes('mắt')) {
    return {
      icon: '👁️',
      desc: 'Khám khúc xạ, điều trị đục thủy tinh thể, tăng nhãn áp và các bệnh lý về mắt.',
    };
  }
  return {
    icon: '🩺',
    desc: 'Cung cấp dịch vụ khám chữa bệnh chất lượng cao với trang thiết bị y tế hiện đại.',
  };
};

// Realistic Doctor visuals mapping
const getDoctorVisuals = (fullName: string) => {
  const name = fullName.toLowerCase();
  if (name.includes('an')) {
    return {
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
      title: 'Cố vấn Y khoa Cao cấp',
    };
  }
  if (name.includes('bình')) {
    return {
      image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200',
      title: 'Trưởng khoa Thần kinh',
    };
  }
  if (name.includes('cường')) {
    return {
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
      title: 'Bác sĩ Nội tiết chính',
    };
  }
  if (name.includes('dung')) {
    return {
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
      title: 'Bác sĩ Nhi khoa ưu tú',
    };
  }
  if (name.includes('em')) {
    return {
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
      title: 'Chuyên gia Cơ xương khớp',
    };
  }
  if (name.includes('phương')) {
    return {
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
      title: 'Trưởng khoa Sản phụ khoa',
    };
  }
  return {
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    title: 'Bác sĩ chuyên khoa',
  };
};

const MOCK_PACKAGES = [
  {
    id: 'pkg-1',
    title: 'Gói khám Bệnh Tiêu Hoá - Gan Mật',
    location: 'Trung Tâm Nội Soi Tiêu Hoá Doctor Check',
    price: '200.000đ',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'pkg-2',
    title: 'Gói khám mắt tổng quát',
    location: 'Trung Tâm Mắt Quốc Tế Phương Đông',
    price: '500.000đ',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'pkg-3',
    title: 'Gói khám tiểu đường',
    location: 'Phòng Khám Đa khoa Quốc Tế Golden Healthcare',
    price: '720.000đ',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'pkg-4',
    title: 'Khám sức khỏe xin việc',
    location: 'Phòng Khám Đa Khoa Phước Anh',
    price: '380.000đ',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const packagesScrollRef = useRef<HTMLDivElement>(null);

  const scrollPackages = (direction: 'left' | 'right') => {
    if (packagesScrollRef.current) {
      const { scrollLeft, clientWidth } = packagesScrollRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth / 2
        : scrollLeft + clientWidth / 2;
      packagesScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const { data: specialties = [], isLoading: loadingSpecialties } = useQuery({
    queryKey: ['featured-specialties'],
    queryFn: homeService.getFeaturedSpecialties,
  });

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['featured-doctors'],
    queryFn: homeService.getFeaturedDoctors,
  });

  const { data: hospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ['featured-hospitals'],
    queryFn: homeService.getFeaturedHospitals,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/bac-si?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth / 2
        : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F8F9FA]">
      {/* Hero Section */}
      <section className="relative bg-[#0c4b39] pt-16 md:pt-24 pb-0 text-white overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-[#66FF33]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-[#4CAF50]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Medical Watermark Pattern (EKG Wave & Crosses) */}
        <div className="absolute inset-0 pointer-events-none opacity-25 select-none">
          <svg className="w-full h-full min-w-[1000px]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ekg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#66FF33" stopOpacity="1" />
                <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Background grids */}
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(102, 255, 51, 0.05)" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />

            {/* Giant EKG wave across the center */}
            <path
              d="M -100 220 L 200 220 L 220 200 L 240 220 L 260 300 L 280 80 L 300 240 L 320 220 L 350 200 L 380 220 L 600 220 L 620 200 L 640 220 L 660 300 L 680 80 L 700 240 L 720 220 L 1500 220"
              fill="none"
              stroke="url(#ekg-gradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70 animate-pulse"
            />

            {/* Floating Medical Cross Icons */}
            <g fill="none" stroke="#66FF33" strokeWidth="2.5" strokeLinecap="round" className="opacity-50">
              {/* Cross 1 */}
              <path d="M 120 100 L 120 120 M 110 110 L 130 110" />
              {/* Cross 2 */}
              <path d="M 850 80 L 850 100 M 840 90 L 860 90" />
              {/* Cross 3 */}
              <path d="M 780 320 L 780 340 M 770 330 L 790 330" />
              {/* Cross 4 */}
              <path d="M 280 340 L 280 360 M 270 350 L 290 350" />
            </g>
          </svg>
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Đặt lịch khám dễ dàng, <br className="hidden sm:inline" />
              <span className="text-[#66FF33] inline-block mt-1">nhanh chóng</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Kết nối với hàng ngàn bác sĩ và cơ sở y tế uy tín trên toàn quốc.
              Đặt lịch khám chỉ với vài cú nhấp chuột.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                <Input
                  type="text"
                  placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..."
                  className="pl-12 h-12 w-full bg-white text-gray-900 placeholder:text-gray-400 border-none rounded-lg focus-visible:ring-[#66FF33] text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-8 bg-[#66FF33] hover:bg-[#5ae62e] text-[#1A2B3C] font-bold text-base rounded-lg transition shadow-md shrink-0 cursor-pointer"
              >
                Tìm kiếm
              </Button>
            </form>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-6 mt-14 max-w-xl mx-auto border-t border-white/10 pt-10 pb-4">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-white">500+</div>
                <div className="text-sm text-white/70 mt-1">Bác sĩ</div>
              </div>
              <div className="text-center border-x border-white/10 px-4">
                <div className="text-3xl md:text-4xl font-extrabold text-white">100+</div>
                <div className="text-sm text-white/70 mt-1">Cơ sở y tế</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-white">10K+</div>
                <div className="text-sm text-white/70 mt-1">Lịch hẹn</div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works banner */}
        <div className="container-custom mt-8">
          <div className="bg-[#083327] rounded-t-3xl pt-6 pb-6 px-8 max-w-5xl mx-auto border-t border-x border-white/10 shadow-2xl relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left steps */}
              <div className="flex items-center gap-12 flex-1 justify-end w-full md:w-auto">
                <Link href={isAuthenticated ? "/tai-khoan" : "/dang-nhap"} className="flex flex-col items-center group cursor-pointer text-center no-underline">
                  <div className="w-11 h-11 bg-[#66FF33]/15 text-[#66FF33] rounded-full flex items-center justify-center border border-[#66FF33]/30 group-hover:scale-105 transition">
                    <User className="h-5 w-5" />
                  </div>
                  <span className="text-white/80 text-xs mt-2 font-medium">Bệnh nhân</span>
                </Link>
                <Link href={isAuthenticated ? "/ho-so" : "/dang-nhap"} className="flex flex-col items-center group cursor-pointer text-center no-underline">
                  <div className="w-11 h-11 bg-[#66FF33]/15 text-[#66FF33] rounded-full flex items-center justify-center border border-[#66FF33]/30 group-hover:scale-105 transition">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-white/80 text-xs mt-2 font-medium">Thông tin</span>
                </Link>
              </div>

              {/* Center Title */}
              <div className="text-center px-4 shrink-0">
                <h3 className="text-white font-bold text-lg md:text-xl uppercase tracking-wider relative inline-block py-1">
                  Cách thức hoạt động
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#66FF33]"></span>
                </h3>
              </div>

              {/* Right steps */}
              <div className="flex items-center gap-12 flex-1 justify-start w-full md:w-auto">
                <Link href="/bac-si" className="flex flex-col items-center group cursor-pointer text-center no-underline">
                  <div className="w-11 h-11 bg-[#66FF33]/15 text-[#66FF33] rounded-full flex items-center justify-center border border-[#66FF33]/30 group-hover:scale-105 transition">
                    <Search className="h-5 w-5" />
                  </div>
                  <span className="text-white/80 text-xs mt-2 font-medium">Tìm bác sĩ</span>
                </Link>
                <Link href="/dat-lich" className="flex flex-col items-center group cursor-pointer text-center no-underline">
                  <div className="w-11 h-11 bg-[#66FF33]/15 text-[#66FF33] rounded-full flex items-center justify-center border border-[#66FF33]/30 group-hover:scale-105 transition">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <span className="text-white/80 text-xs mt-2 font-medium">Đặt lịch</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">Chuyên khoa nổi bật</h2>
            <Link href="/chuyen-khoa" className="text-[#4CAF50] hover:text-[#3d9c41] transition-colors flex items-center font-bold text-sm uppercase tracking-wider">
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingSpecialties ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="relative px-2">
              {/* Left Scroll Trigger */}
              <button
                onClick={() => scroll('left')}
                className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-md border border-gray-100 rounded-full flex items-center justify-center hover:bg-gray-50 transition cursor-pointer text-gray-700 hover:scale-105 animate-fade-in"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Slider list */}
              <div
                ref={scrollRef}
                className="flex gap-5 overflow-x-auto scrollbar-none pb-4 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {specialties.map((specialty) => {
                  const details = getSpecialtyDetails(specialty.name);
                  return (
                    <div
                      key={specialty.id}
                      className="min-w-[260px] max-w-[280px] flex-shrink-0 bg-[#0c4b39]/5 border border-[#0c4b39]/10 rounded-2xl p-6 text-gray-800 flex flex-col justify-between h-[210px] group hover:border-[#0c4b39]/30 hover:bg-[#0c4b39]/8 hover:shadow-md transition-all duration-300 shadow-sm relative overflow-hidden"
                    >
                      <div>
                        <div className="text-3xl mb-3 group-hover:scale-105 transition-transform duration-300">
                          {specialty.icon || details.icon}
                        </div>
                        <h3 className="font-bold text-[#0c4b39] text-base leading-tight line-clamp-1">{specialty.name}</h3>
                        <p className="text-xs text-[#0c4b39]/70 mt-2 line-clamp-2 leading-relaxed font-medium">
                          {specialty.description || details.desc}
                        </p>
                      </div>
                      <div>
                        <Link
                          href={`/bac-si?specialtyId=${specialty.id}`}
                          className="inline-block bg-[#0c4b39] text-white hover:bg-[#083629] transition-all duration-300 text-xs font-extrabold py-1.5 px-6 rounded-md text-center mt-3 uppercase tracking-wider cursor-pointer shadow-sm"
                        >
                          view
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Scroll Trigger */}
              <button
                onClick={() => scroll('right')}
                className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-md border border-gray-100 rounded-full flex items-center justify-center hover:bg-gray-50 transition cursor-pointer text-gray-700 hover:scale-105 animate-fade-in"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Doctors Section */}
      <section className="py-16 bg-[#F8F9FA] border-b border-gray-100">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">Bác sĩ tiêu biểu</h2>
            <Link href="/bac-si" className="text-[#4CAF50] hover:text-[#3d9c41] transition-colors flex items-center font-bold text-sm uppercase tracking-wider">
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingDoctors ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.slice(0, 3).map((doctor) => {
                const details = getDoctorVisuals(doctor.fullName);
                const firstWorkplaceId = doctor.workPlaces && doctor.workPlaces.length > 0
                  ? doctor.workPlaces[0].id
                  : null;
                const bookingUrl = firstWorkplaceId
                  ? `/dat-lich?workplaceId=${firstWorkplaceId}`
                  : `/bac-si/${doctor.id}`;

                return (
                  <Card key={doctor.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200/60 overflow-hidden flex flex-col justify-between h-full bg-white rounded-2xl">
                    <CardContent className="p-6 flex-1">
                      <div className="flex items-start gap-4">
                        <img
                          src={details.image}
                          alt={doctor.fullName}
                          className="w-16 h-16 rounded-full object-cover border border-gray-100 shadow-sm flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-secondary text-base leading-snug truncate hover:text-[#4CAF50] transition-colors">
                            <Link href={`/bac-si/${doctor.id}`}>{doctor.fullName}</Link>
                          </h3>
                          <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                            {doctor.qualification || details.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-gray-700">5</span>
                            <span className="text-xs text-gray-400">
                              ({doctor.reviewCount || 28} rating thực tế)
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <div className="px-6 pb-6">
                      <Link
                        href={bookingUrl}
                        className="block w-full text-center py-2.5 px-4 bg-[#2a6d54] hover:bg-[#205340] active:bg-[#1a4434] text-white font-semibold rounded-lg text-sm transition shadow-sm cursor-pointer"
                      >
                        Đặt Lịch
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Hospitals Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">Cơ sở y tế uy tín</h2>
            <Link href="/co-so-y-te" className="text-[#4CAF50] hover:text-[#3d9c41] transition-colors flex items-center font-bold text-sm uppercase tracking-wider">
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingHospitals ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.slice(0, 3).map((hospital) => {
                const hospitalImages: Record<string, string> = {
                  'Bệnh viện Đa khoa NovaCare': 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=400',
                  'Bệnh viện Chuyên khoa Sài Gòn': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400',
                };
                const image = hospitalImages[hospital.name] || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=400';

                return (
                  <Card key={hospital.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200/60 overflow-hidden flex flex-col h-full bg-white rounded-2xl">
                    <div className="h-44 w-full relative overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={image}
                        alt={hospital.name}
                        className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-gray-800 flex items-center gap-1 shadow-sm">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span>{hospital.rating || 4.8}</span>
                      </div>
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-secondary text-base leading-snug line-clamp-1 hover:text-[#4CAF50] transition-colors">
                          <Link href={`/co-so-y-te/${hospital.id}`}>{hospital.name}</Link>
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Bệnh viện Tư nhân</p>
                        <div className="flex items-start gap-1.5 text-xs text-gray-500 mt-3">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{hospital.address}</span>
                        </div>
                      </div>
                      <div className="mt-5">
                        <Link
                          href={`/co-so-y-te/${hospital.id}`}
                          className="block w-full text-center py-2.5 px-4 bg-[#2a6d54] hover:bg-[#205340] active:bg-[#1a4434] text-white font-semibold rounded-lg text-sm transition shadow-sm cursor-pointer"
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Comprehensive Health Packages Section */}
      <section className="py-16 bg-[#F8F9FA] border-t border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Title */}
            <div className="w-full lg:w-1/4 lg:sticky lg:top-24">
              <h2 className="text-3xl md:text-4xl font-extrabold text-secondary leading-tight tracking-tight">
                Chương trình <br />
                chăm sóc sức khỏe <br />
                toàn diện
              </h2>
              <p className="text-gray-500 text-sm mt-4 max-w-xs">
                Lựa chọn đa dạng các gói khám chuyên sâu, tầm soát sức khỏe định kỳ phù hợp với nhu cầu cá nhân.
              </p>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => scrollPackages('left')}
                  className="w-9 h-9 bg-white shadow-md border border-gray-100 rounded-full flex items-center justify-center hover:bg-gray-50 transition cursor-pointer text-gray-700 hover:scale-105"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => scrollPackages('right')}
                  className="w-9 h-9 bg-white shadow-md border border-gray-100 rounded-full flex items-center justify-center hover:bg-gray-50 transition cursor-pointer text-gray-700 hover:scale-105"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Right Slider */}
            <div className="w-full lg:w-3/4 overflow-hidden relative">
              <div
                ref={packagesScrollRef}
                className="flex gap-5 overflow-x-auto scrollbar-none pb-4 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {MOCK_PACKAGES.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="min-w-[280px] max-w-[280px] hover:shadow-[0_15px_30px_-5px_rgba(12,75,57,0.3),0_0_15px_rgba(102,255,51,0.15)] hover:border-[#66FF33]/20 border border-gray-100 hover:scale-[1.02] transition-all duration-300 overflow-hidden flex flex-col h-[340px] bg-white rounded-2xl flex-shrink-0"
                  >
                    <div className="h-32 w-full relative overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={pkg.image}
                        alt={pkg.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#0e523f] via-[#0a3a2c] to-[#06241c] border-t border-white/5 flex-1 flex flex-col justify-between text-white relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-tr before:from-white/0 before:via-white/5 before:to-white/10 before:pointer-events-none">
                      <div>
                        <h3 className="font-bold text-sm leading-snug line-clamp-2 h-10 hover:text-[#66FF33] transition-colors">
                          {pkg.title}
                        </h3>
                        <div className="flex items-start gap-1.5 text-xs text-white/70 mt-2">
                          <Building className="h-3.5 w-3.5 shrink-0 text-white/60 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{pkg.location}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-[#66FF33] mt-2">
                          <Tag className="h-4 w-4 text-[#66FF33]" />
                          <span>{pkg.price}</span>
                        </div>
                        <Link
                          href={`/dat-lich?packageId=${pkg.id}`}
                          className="block w-full text-center py-2 bg-[#66FF33] hover:bg-[#5ae62e] active:bg-[#4dd323] text-[#0c4b39] font-extrabold rounded-lg text-xs uppercase tracking-wider mt-3 transition duration-300 shadow-[0_4px_12px_rgba(102,255,51,0.3)] hover:shadow-[0_0_15px_rgba(102,255,51,0.6)] hover:scale-[1.02] cursor-pointer"
                        >
                          Đặt khám ngay
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
