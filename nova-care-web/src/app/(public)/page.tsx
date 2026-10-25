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
  Building2,
  Tag,
  HeartPulse,
  Brain,
  Activity,
  Baby,
  Sparkles,
  Bone,
  Ear,
  Eye,
  Smile,
  Microscope,
  Stethoscope,
  Users,
  Video,
  FlaskConical,
  ShieldCheck,
  FileCheck,
  UserCheck,
  CheckCircle2,
  Zap,
  ArrowRight,
  Bot,
  Smartphone,
  Shield,
  Award,
  QrCode,
  HeartHandshake,
  Check,
  PhoneCall,
  Sparkle,
  CalendarCheck2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, getDoctorSpecialtyName } from '@/lib/utils';

// Render Lucide icons matching specialty names with NovaCare green palette
const renderSpecialtyIcon = (name: string, className = "h-7 w-7 text-[#0c4b39] group-hover:text-white transition-colors duration-300") => {
  const normalized = name.toLowerCase();
  if (normalized.includes('tim mạch')) return <HeartPulse className={className} />;
  if (normalized.includes('thần kinh')) return <Brain className={className} />;
  if (normalized.includes('nội tiết') || normalized.includes('nội khoa')) return <Activity className={className} />;
  if (normalized.includes('nhi')) return <Baby className={className} />;
  if (normalized.includes('sản') || normalized.includes('phụ')) return <Sparkles className={className} />;
  if (normalized.includes('xương') || normalized.includes('khớp')) return <Bone className={className} />;
  if (normalized.includes('tai') || normalized.includes('họng')) return <Ear className={className} />;
  if (normalized.includes('mắt')) return <Eye className={className} />;
  if (normalized.includes('răng')) return <Smile className={className} />;
  if (normalized.includes('tiêu hóa')) return <Microscope className={className} />;
  return <Stethoscope className={className} />;
};

// Realistic Doctor visuals mapping
const getDoctorVisuals = (fullName: string) => {
  const name = fullName.toLowerCase();
  if (name.includes('an')) {
    return {
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      title: 'Cố vấn Y khoa Cao cấp',
      badge: 'Chuyên gia đầu ngành',
    };
  }
  if (name.includes('bình') || name.includes('hùng')) {
    return {
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
      title: 'Trưởng khoa Thần kinh',
      badge: 'Tiến sĩ Y khoa',
    };
  }
  if (name.includes('cường') || name.includes('nam')) {
    return {
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
      title: 'Bác sĩ Chuyên khoa II',
      badge: '15+ năm kinh nghiệm',
    };
  }
  if (name.includes('dung') || name.includes('liên')) {
    return {
      image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400',
      title: 'Bác sĩ Chuyên khoa ưu tú',
      badge: 'Tận tâm chu đáo',
    };
  }
  if (name.includes('phương') || name.includes('nguyên')) {
    return {
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      title: 'Bác sĩ Nội trú Chuyên khoa',
      badge: 'Bác sĩ xuất sắc',
    };
  }
  return {
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400',
    title: 'Bác sĩ chuyên khoa',
    badge: 'Đã xác thực',
  };
};

const MOCK_PACKAGES = [
  {
    id: 'pkg-1',
    title: 'Gói khám Bệnh Tiêu Hoá - Gan Mật',
    location: 'Trung Tâm Nội Soi Tiêu Hoá Doctor Check',
    price: '200.000đ',
    badge: 'Tầm soát NBI',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'pkg-2',
    title: 'Gói khám mắt tổng quát & Khúc xạ',
    location: 'Trung Tâm Mắt Quốc Tế Phương Đông',
    price: '500.000đ',
    badge: 'Công nghệ Đức',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'pkg-3',
    title: 'Gói tầm soát tiểu đường & Tim mạch',
    location: 'Phòng Khám Đa khoa Quốc Tế Golden Healthcare',
    price: '720.000đ',
    badge: 'Toàn diện',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'pkg-4',
    title: 'Khám sức khỏe xin việc & Lái xe',
    location: 'Phòng Khám Đa Khoa Phước Anh',
    price: '380.000đ',
    badge: 'Chuẩn Bộ Y Tế',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400',
  },
];

// Medpro-style supported services in NovaCare system
const QUICK_BOOKING_SERVICES = [
  {
    id: 'facility',
    title: 'Đặt khám tại cơ sở',
    subtitle: 'Lấy số thứ tự trực tuyến tại BV & PK',
    icon: Building2,
    href: '/co-so-y-te',
    badge: 'Cơ sở uy tín',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconBg: 'bg-emerald-50 text-[#0c4b39] group-hover:bg-[#0c4b39] group-hover:text-white',
  },
  {
    id: 'specialty',
    title: 'Đặt khám chuyên khoa',
    subtitle: 'Hơn 30+ chuyên khoa chuyên sâu',
    icon: Stethoscope,
    href: '/chuyen-khoa',
    badge: 'Đa dạng khoa',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    iconBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
  },
  {
    id: 'doctor',
    title: 'Đặt khám theo bác sĩ',
    subtitle: 'Chọn bác sĩ giỏi & chủ động giờ khám',
    icon: UserCheck,
    href: '/bac-si',
    badge: 'Bác sĩ giỏi',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
  },
  {
    id: 'inpatient-followup',
    title: 'Tái khám nội trú',
    subtitle: 'Nhập mã bệnh án đặt lịch tái khám',
    icon: CalendarCheck2,
    href: '/dat-kham-co-so?mode=inpatient_followup',
    badge: 'Tái khám nhanh',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconBg: 'bg-emerald-50 text-[#0c4b39] group-hover:bg-[#0c4b39] group-hover:text-white',
  },
  {
    id: 'telehealth',
    title: 'Tư vấn video bác sĩ',
    subtitle: 'Khám trực tuyến 1-1 không di chuyển',
    icon: Video,
    href: '/dich-vu/tu-van-tu-xa',
    badge: 'Khám từ xa',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    iconBg: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white',
  },
  {
    id: 'testing',
    title: 'Xét nghiệm & CĐHA',
    subtitle: 'Xét nghiệm máu, Siêu âm, X-quang, MRI',
    icon: FlaskConical,
    href: '/dich-vu/chan-doan-hinh-anh',
    badge: 'Kết quả nhanh',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    iconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
  },
  {
    id: 'health-package',
    title: 'Gói khám sức khỏe',
    subtitle: 'Tầm soát & Khám sức khỏe tổng quát',
    icon: ShieldCheck,
    href: '/dich-vu/goi-kham-suc-khoe',
    badge: 'Ưu đãi 20%',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    iconBg: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
  },
  {
    id: 'circular-exam',
    title: 'Khám SK thông tư',
    subtitle: 'Giấy khám sức khỏe xin việc, lái xe',
    icon: FileCheck,
    href: '/dich-vu/kham-thong-tu',
    badge: 'Chuẩn Bộ Y Tế',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    iconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
  },
];

const TRENDING_TAGS = [
  'Tim mạch',
  'Cơ xương khớp',
  'Nhi khoa',
  'Nội soi tiêu hóa',
  'Khám tổng quát',
  'Da liễu thẩm mỹ'
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
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
    } else {
      router.push('/bac-si');
    }
  };

  const handleQuickSearch = (tag: string) => {
    setSearchQuery(tag);
    router.push(`/bac-si?q=${encodeURIComponent(tag)}`);
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
    <div className="bg-[#F8FAFC] min-h-screen text-[#1E293B]">
      {/* ── 1. Hero Section (Split Modern Healthcare & AI Hub) ─────────── */}
      <section className="relative bg-gradient-to-br from-[#062c22] via-[#094132] to-[#041d16] text-white pt-10 md:pt-16 pb-20 md:pb-28 overflow-hidden">
        {/* Soft Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Subtle Horizontal EKG Pulse Wave Background */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-25 overflow-hidden">
          <svg className="w-full h-full min-w-[1200px]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1400 400">
            <defs>
              <linearGradient id="ekg-glow-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
                <stop offset="35%" stopColor="#34D399" stopOpacity="0.9" />
                <stop offset="65%" stopColor="#06B6D4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M -50 200 L 150 200 L 180 180 L 195 220 L 220 200 L 235 150 L 250 260 L 270 70 L 290 230 L 310 200 L 450 200 L 520 180 L 535 220 L 550 140 L 570 280 L 590 50 L 610 240 L 630 200 L 780 200 L 850 200 L 865 160 L 880 250 L 900 80 L 920 230 L 940 200 L 1150 200 L 1170 270 L 1190 60 L 1210 240 L 1230 200 L 1500 200"
              fill="none"
              stroke="url(#ekg-glow-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Headline & Smart Omnisearch */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-emerald-400/25 text-emerald-300 text-xs font-semibold backdrop-blur-md mb-4 shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>Nền tảng Y tế Số & Đặt khám Trực tuyến NovaCare</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[52px] font-black text-white leading-[1.18] tracking-tight mb-4">
                Chăm sóc sức khỏe gia đình bạn bằng cả{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200">
                  Tâm Đức & Công Nghệ Số
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-emerald-100/85 leading-relaxed max-w-xl mb-7">
                Kết nối trực tiếp mạng lưới hơn 500+ bác sĩ chuyên khoa đầu ngành và bệnh viện uy tín. Lấy số thứ tự trực tuyến, chủ động khung giờ và giảm 80% thời gian chờ đợi.
              </p>

              {/* Smart Omnisearch Box */}
              <form
                onSubmit={handleSearch}
                className="w-full max-w-2xl bg-white p-2 rounded-2xl shadow-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-2"
              >
                {/* Location selector */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 border-r border-gray-200 text-xs font-bold text-gray-700 shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Toàn quốc</option>
                    <option value="HCM">TP. Hồ Chí Minh</option>
                    <option value="HN">Hà Nội</option>
                    <option value="DN">Đà Nẵng</option>
                  </select>
                </div>

                {/* Keyword input */}
                <div className="flex-1 relative w-full flex items-center">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Tìm theo bác sĩ, chuyên khoa, triệu chứng, bệnh viện..."
                    className="pl-11 pr-4 h-12 w-full bg-transparent text-gray-900 placeholder:text-gray-400 border-none rounded-xl focus-visible:ring-0 text-sm md:text-base font-medium shadow-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full sm:w-auto h-12 px-7 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm md:text-base rounded-xl transition-all duration-200 shadow-md hover:shadow-emerald-900/40 shrink-0 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Tìm kiếm</span>
                  <Search className="w-4 h-4" />
                </Button>
              </form>

              {/* Trending Quick Search Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-emerald-100/80">
                <span className="font-semibold text-emerald-300">Gợi ý tìm nhanh:</span>
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickSearch(tag)}
                    className="bg-white/10 hover:bg-white/20 text-white/90 hover:text-white px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer border border-white/10"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Trust Social Proof Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mt-8 pt-6 border-t border-white/10 w-full max-w-2xl">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">180+</div>
                  <div className="text-xs text-emerald-200/70 font-medium">Bác sĩ chuyên khoa</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">8+</div>
                  <div className="text-xs text-emerald-200/70 font-medium">Bệnh viện đối tác</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">50.000+</div>
                  <div className="text-xs text-emerald-200/70 font-medium">Lượt khám tin chọn</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 flex items-center gap-1">
                    4.9 <Star className="w-4 h-4 fill-amber-300 inline text-amber-300" />
                  </div>
                  <div className="text-xs text-emerald-200/70 font-medium">Đánh giá hài lòng</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual & Interactive Floating Cards */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Doctor Visual with Glow Ring */}
              <div className="relative w-full max-w-md mx-auto">
                {/* Decorative Circular Gradient Ring */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-teal-400/20 to-transparent rounded-3xl blur-xl transform -rotate-3 scale-105" />

                {/* Main Hero Doctor Image */}
                <div className="relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gradient-to-b from-white/10 to-black/30 backdrop-blur-sm">
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=700"
                    alt="Bác sĩ chuyên khoa NovaCare"
                    className="w-full h-[400px] sm:h-[450px] object-cover object-top hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#062c22]/90 via-[#062c22]/20 to-transparent" />

                  {/* Doctor Info Tag on Image */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Đội ngũ Bác sĩ Chứng chỉ Hành nghề</span>
                    </div>
                    <p className="text-xs text-emerald-100/90 leading-tight">
                      Khám tận tâm, tư vấn chính xác và phác đồ điều trị cá thể hóa chuẩn Bộ Y Tế.
                    </p>
                  </div>
                </div>

                {/* Floating Card 1: Top Right - Verified Doctor */}
                <div className="absolute -top-4 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md text-gray-900 p-3 rounded-2xl shadow-xl border border-white/40 flex items-center gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-gray-900">4.95 ⭐</span>
                      <span className="text-[10px] text-gray-500">(500+ đánh giá)</span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700">Chuyên gia Y khoa Uy tín</div>
                  </div>
                </div>

                {/* Floating Card 2: Bottom Left - Đặt khám cơ sở */}
                <Link
                  href="/dat-kham-co-so"
                  className="absolute -bottom-5 -left-4 sm:-left-6 bg-gradient-to-r from-[#0c4b39] to-[#063024] text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 text-left hover:scale-105 transition-transform no-underline"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-white">Đặt khám cơ sở y tế</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    </div>
                    <div className="text-[11px] text-emerald-200">Lấy số thứ tự trực tuyến ➔</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Quick Booking Services (Dịch vụ Tiện ích NovaCare) ──────── */}
      <section className="relative z-20 -mt-10 md:-mt-14 container-custom mb-16">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Dịch vụ tiện ích đa kênh NovaCare</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">
                Đặt khám y tế trực tuyến
              </h2>
            </div>
            <p className="text-xs md:text-sm text-gray-500 max-w-md sm:text-right">
              Chủ động lựa chọn hình thức thăm khám nhanh chóng và phù hợp nhất dành cho bạn và gia đình
            </p>
          </div>

          {/* 8 Feature Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {QUICK_BOOKING_SERVICES.map((service) => {
              const IconComponent = service.icon;

              const CardContentInner = (
                <div className="h-full flex flex-col justify-between p-4 md:p-5 bg-white border border-gray-100 hover:border-emerald-600/40 rounded-2xl group transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 relative overflow-hidden">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xs ${service.iconBg}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] md:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${service.badgeColor} shrink-0`}>
                      {service.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="font-bold text-[#1A2B3C] group-hover:text-emerald-700 text-sm md:text-base leading-snug transition-colors mb-1 line-clamp-1">
                      {service.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {service.subtitle}
                    </p>
                  </div>

                  {/* Action Link Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                    <span>Đặt ngay</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );

              return (
                <Link key={service.id} href={service.href} className="no-underline">
                  {CardContentInner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Chuyên khoa nổi bật (Featured Specialties) ─────────────── */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Đa dạng chuyên môn</div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">Chuyên khoa nổi bật</h2>
            </div>
            <Link href="/chuyen-khoa" className="text-emerald-700 hover:text-emerald-800 transition-colors flex items-center font-bold text-sm uppercase tracking-wider">
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingSpecialties ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
          ) : (
            <div className="relative px-2">
              {/* Left Scroll Trigger */}
              <button
                type="button"
                onClick={() => scroll('left')}
                className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center hover:bg-emerald-50 transition cursor-pointer text-gray-700 hover:scale-105"
                aria-label="Cuộn trái"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Slider list */}
              <div
                ref={scrollRef}
                className="flex gap-5 overflow-x-auto scrollbar-none pb-4 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {specialties.map((specialty) => (
                  <Link
                    key={specialty.id}
                    href={`/dat-kham-co-so?specialtyId=${specialty.id}&mode=general`}
                    className="min-w-[190px] max-w-[210px] flex-shrink-0 bg-white border border-slate-200 hover:border-emerald-600/50 rounded-2xl p-5 text-gray-800 flex flex-col items-center justify-between h-[180px] group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 shadow-xs relative overflow-hidden cursor-pointer no-underline"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-700 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xs mb-1">
                      {renderSpecialtyIcon(specialty.name)}
                    </div>
                    <h3 className="font-bold text-[#1A2B3C] group-hover:text-emerald-700 text-sm md:text-base leading-tight text-center line-clamp-2 max-w-full px-1">
                      {specialty.name}
                    </h3>
                    <span className="inline-block bg-emerald-50 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white transition-all duration-300 text-[11px] font-extrabold py-1 px-5 rounded-full text-center uppercase tracking-wider shadow-xs mt-1">
                      Đặt khám
                    </span>
                  </Link>
                ))}
              </div>

              {/* Right Scroll Trigger */}
              <button
                type="button"
                onClick={() => scroll('right')}
                className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center hover:bg-emerald-50 transition cursor-pointer text-gray-700 hover:scale-105"
                aria-label="Cuộn phải"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Bác sĩ tiêu biểu (Featured Doctors) ────────────────────── */}
      <section className="py-16 bg-[#F8FAFC] border-b border-gray-100">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Đội ngũ chuyên gia</div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">Bác sĩ tiêu biểu</h2>
            </div>
            <Link href="/bac-si" className="text-emerald-700 hover:text-emerald-800 transition-colors flex items-center font-bold text-sm uppercase tracking-wider">
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingDoctors ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.slice(0, 3).map((doctor) => {
                const details = getDoctorVisuals(doctor.fullName);
                const firstWorkplace = doctor.workPlaces && doctor.workPlaces.length > 0
                  ? doctor.workPlaces[0]
                  : null;
                const firstWorkplaceId = firstWorkplace?.id || null;
                const bookingUrl = firstWorkplace?.hospitalId
                  ? `/dat-kham-co-so?hospitalId=${firstWorkplace.hospitalId}&doctorId=${doctor.id}&mode=doctor`
                  : firstWorkplaceId
                  ? `/dat-kham-co-so?workplaceId=${firstWorkplaceId}&mode=doctor`
                  : `/dat-kham-co-so?doctorId=${doctor.id}&mode=doctor`;

                const specialtyName = getDoctorSpecialtyName(doctor);
                const consultationFee = firstWorkplace?.consultationFee || 200000;
                const visitsCount = doctor.consultationCount || (doctor.reviewCount ? doctor.reviewCount * 14 + 80 : 350);
                const hospitalName = firstWorkplace?.hospital?.name || 'Bệnh viện Đa khoa NovaCare';

                return (
                  <Card key={doctor.id} className="hover:shadow-xl transition-all duration-300 border border-slate-200/90 overflow-hidden flex flex-col justify-between h-full bg-white rounded-3xl group">
                    <CardContent className="p-6 flex-1">
                      {/* Top Info Bar */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Đang nhận lịch
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{details.badge}</span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <img
                            src={details.image}
                            alt={doctor.fullName}
                            className="w-18 h-18 rounded-2xl object-cover border-2 border-emerald-100 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-500 font-semibold">{doctor.title || 'BS.CKII'}</div>
                          <h3 className="font-extrabold text-secondary text-base md:text-lg leading-snug truncate group-hover:text-emerald-700 transition-colors">
                            <Link href={`/bac-si/${doctor.id}`}>{doctor.fullName}</Link>
                          </h3>

                          {/* Chuyên khoa */}
                          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mt-1 truncate bg-emerald-50/80 px-2.5 py-0.5 rounded-md w-fit">
                            <Stethoscope className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                            <span className="truncate">{specialtyName}</span>
                          </div>

                          {/* Bệnh viện */}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 truncate">
                            <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{hospitalName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating & Stats */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-gray-800">{doctor.rating ? doctor.rating.toFixed(1) : '5.0'}</span>
                          </div>
                          <span className="text-gray-400">({doctor.reviewCount || 35})</span>
                        </div>
                        <span className="font-bold text-emerald-700">
                          {visitsCount}+ lượt khám
                        </span>
                      </div>

                      {/* Phí khám */}
                      <div className="mt-3 bg-slate-50 p-2.5 rounded-xl flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">Giá khám niêm yết:</span>
                        <span className="text-sm font-black text-emerald-800">
                          {formatPrice(consultationFee)}đ
                        </span>
                      </div>
                    </CardContent>

                    <div className="px-6 pb-6">
                      <Link
                        href={bookingUrl}
                        className="block w-full text-center py-3 px-4 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold rounded-xl text-sm transition shadow-md hover:shadow-emerald-900/20 cursor-pointer"
                      >
                        Đặt Lịch Khám Ngay
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 6. Cơ sở y tế uy tín (Prestigious Hospitals) ─────────────── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Mạng lưới y tế</div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">Cơ sở y tế uy tín</h2>
            </div>
            <Link href="/co-so-y-te" className="text-emerald-700 hover:text-emerald-800 transition-colors flex items-center font-bold text-sm uppercase tracking-wider">
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingHospitals ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.slice(0, 3).map((hospital) => {
                const hospitalImages: Record<string, string> = {
                  'Bệnh viện Đa khoa NovaCare': 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=500',
                  'Bệnh viện Chuyên khoa Sài Gòn': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=500',
                  'Bệnh viện Quốc tế Nova Central': 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=500',
                };
                const image = hospitalImages[hospital.name] || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=500';

                return (
                  <Card key={hospital.id} className="hover:shadow-xl transition-all duration-300 border border-slate-200/90 overflow-hidden flex flex-col h-full bg-white rounded-3xl group">
                    <div className="h-48 w-full relative overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={image}
                        alt={hospital.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-emerald-800 shadow-sm">
                        {hospital.type === 'INTERNATIONAL' ? 'Bệnh viện Quốc tế' : 'Bệnh viện Đa khoa'}
                      </div>
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-gray-800 flex items-center gap-1 shadow-sm">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span>{hospital.rating ? hospital.rating.toFixed(1) : '4.9'}</span>
                      </div>
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-secondary text-base md:text-lg leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          <Link href={`/co-so-y-te/${hospital.id}`}>{hospital.name}</Link>
                        </h3>
                        <p className="text-xs text-emerald-700 mt-1 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Hỗ trợ khám BHYT & Bảo lãnh viện phí</span>
                        </p>
                        <div className="flex items-start gap-1.5 text-xs text-gray-500 mt-3 leading-relaxed">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
                          <span className="line-clamp-2">{hospital.address}</span>
                        </div>
                      </div>
                      <div className="mt-5">
                        <Link
                          href={`/co-so-y-te/${hospital.id}`}
                          className="block w-full text-center py-2.5 px-4 bg-slate-100 hover:bg-emerald-700 text-gray-800 hover:text-white font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer"
                        >
                          Xem thông tin & Đặt khám
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

      {/* ── 7. Gói khám sức khỏe toàn diện (Packages Carousel) ───────── */}
      <section className="py-16 bg-[#F8FAFC] border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Title */}
            <div className="w-full lg:w-1/4 lg:sticky lg:top-24">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Chủ động phòng ngừa</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-secondary leading-tight tracking-tight">
                Chương trình <br />
                chăm sóc sức khỏe <br />
                toàn diện
              </h2>
              <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                Lựa chọn đa dạng các gói khám chuyên sâu, tầm soát sức khỏe định kỳ với chi phí tối ưu dành cho cá nhân và gia đình.
              </p>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => scrollPackages('left')}
                  className="w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center hover:bg-emerald-50 transition cursor-pointer text-gray-700 hover:scale-105"
                  aria-label="Cuộn trái gói khám"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollPackages('right')}
                  className="w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center hover:bg-emerald-50 transition cursor-pointer text-gray-700 hover:scale-105"
                  aria-label="Cuộn phải gói khám"
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
                    className="min-w-[280px] max-w-[280px] hover:shadow-2xl border border-slate-200 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-[360px] bg-white rounded-3xl flex-shrink-0 group"
                  >
                    <div className="h-36 w-full relative overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={pkg.image}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-emerald-800 shadow-xs">
                        {pkg.badge}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#0c4b39] via-[#093d2e] to-[#052219] border-t border-white/10 flex-1 flex flex-col justify-between text-white">
                      <div>
                        <h3 className="font-extrabold text-sm leading-snug line-clamp-2 h-10 group-hover:text-emerald-300 transition-colors">
                          {pkg.title}
                        </h3>
                        <div className="flex items-start gap-1.5 text-xs text-white/70 mt-2">
                          <Building className="h-3.5 w-3.5 shrink-0 text-emerald-300/80 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{pkg.location}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-base font-black text-emerald-300 mt-2">
                          <Tag className="h-4 w-4 text-emerald-300" />
                          <span>{pkg.price}</span>
                        </div>
                        <Link
                          href="/dat-kham-co-so?mode=service"
                          className="block w-full text-center py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-[#0c4b39] font-black rounded-xl text-xs uppercase tracking-wider mt-3 transition duration-200 shadow-md cursor-pointer"
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

      {/* ── 8. Quy trình 4 bước đặt khám tiện lợi (How It Works Timeline) ── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tiện lợi & Nhanh chóng</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-secondary tracking-tight">
              Quy trình 4 bước đặt khám thông minh
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Tiết kiệm tối đa thời gian xếp hàng tại bệnh viện, chủ động theo dõi lịch trình khám bệnh ngay trên thiết bị
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-slate-200/80 hover:border-emerald-600/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center mb-4">
                  01
                </div>
                <h3 className="font-extrabold text-base text-gray-900 mb-2">Tìm kiếm thông minh</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Lựa chọn Bác sĩ, Chuyên khoa, Bệnh viện mong muốn hoặc sử dụng Trợ lý AI để được gợi ý chuẩn xác.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200/60 text-xs font-bold text-emerald-700">
                Bước 1 / 4
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-slate-200/80 hover:border-emerald-600/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-black text-xl flex items-center justify-center mb-4">
                  02
                </div>
                <h3 className="font-extrabold text-base text-gray-900 mb-2">Chọn giờ & Lấy số</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Chủ động lựa chọn ngày khám và khung giờ còn trống phù hợp nhất với lịch trình sinh hoạt của bạn.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200/60 text-xs font-bold text-teal-700">
                Bước 2 / 4
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-slate-200/80 hover:border-emerald-600/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 font-black text-xl flex items-center justify-center mb-4">
                  03
                </div>
                <h3 className="font-extrabold text-base text-gray-900 mb-2">Thanh toán linh hoạt</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Xác nhận thông tin bệnh nhân, áp dụng BHYT và thanh toán an toàn qua VNPay, thẻ tín dụng hoặc tại viện.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200/60 text-xs font-bold text-blue-700">
                Bước 3 / 4
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-slate-200/80 hover:border-emerald-600/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 font-black text-xl flex items-center justify-center mb-4">
                  04
                </div>
                <h3 className="font-extrabold text-base text-gray-900 mb-2">Khám không chờ đợi</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Nhận phiếu khám điện tử có mã QR, đến thẳng phòng khám theo giờ hẹn mà không cần bốc số lấy phiếu giấy.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200/60 text-xs font-bold text-purple-700">
                Bước 4 / 4
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. NovaCare Mobile App Showcase Section ─────────────────── */}
      <section className="py-16 bg-gradient-to-br from-[#062c22] via-[#094132] to-[#041d16] text-white overflow-hidden relative">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-400/30">
                <Smartphone className="w-4 h-4 text-emerald-300" />
                <span>Trải nghiệm Y tế Đa nền tảng</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4 tracking-tight">
                Tải Ứng Dụng NovaCare Mobile <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                  Chăm sóc sức khỏe ngay trên tay
                </span>
              </h2>
              <p className="text-sm md:text-base text-emerald-100/85 leading-relaxed mb-6 max-w-xl">
                Tích hợp toàn bộ hồ sơ y bạ điện tử, nhận thông báo nhắc lịch khám, gọi video tư vấn từ xa và thanh toán viện phí trực tuyến chỉ với vài thao tác chạm trên điện thoại Android & iOS.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-white/90">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Lấy số thứ tự trực tuyến từ xa, cập nhật hàng chờ theo thời gian thực</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/90">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Lưu trữ sổ khám, kết quả xét nghiệm và đơn thuốc điện tử liên thông</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/90">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Bác sĩ gia đình tư vấn trực tuyến qua Video Call độ phân giải cao</span>
                </div>
              </div>

              {/* Download App Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="bg-black/60 hover:bg-black/80 border border-white/20 text-white px-5 py-3 rounded-2xl flex items-center gap-3 transition cursor-pointer shadow-lg"
                >
                  <Smartphone className="w-6 h-6 text-emerald-400" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] text-gray-400 uppercase">Tải miễn phí trên</div>
                    <div className="text-sm font-black">Google Play Store</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="bg-black/60 hover:bg-black/80 border border-white/20 text-white px-5 py-3 rounded-2xl flex items-center gap-3 transition cursor-pointer shadow-lg"
                >
                  <AppleIcon className="w-6 h-6 text-white" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] text-gray-400 uppercase">Tải miễn phí trên</div>
                    <div className="text-sm font-black">Apple App Store</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Phone Mockup Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-64 sm:w-72 bg-slate-900 border-4 border-slate-700 rounded-[40px] p-3 shadow-2xl">
                {/* Speaker pill */}
                <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-3" />
                
                {/* Phone screen preview */}
                <div className="bg-[#F8FAFC] rounded-[30px] p-4 text-gray-900 overflow-hidden text-xs">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <div className="font-black text-emerald-800 text-sm">NovaCare Mobile</div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Trực tuyến</span>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-3.5 rounded-2xl mb-3 shadow-sm">
                    <div className="text-[10px] opacity-80 uppercase">Phiếu khám điện tử</div>
                    <div className="text-base font-black mt-0.5">Số thứ tự: #18</div>
                    <div className="text-[11px] opacity-90 mt-1">Phòng khám: Tim mạch 02</div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
                      <span className="font-bold text-gray-700">Hình thức đăng ký</span>
                      <span className="text-[10px] text-emerald-600 font-extrabold">Theo cơ sở y tế</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
                      <span className="font-bold text-gray-700">Hồ sơ y bạ EHR</span>
                      <span className="text-[10px] text-emerald-600 font-extrabold">Đã liên thông</span>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <div className="w-16 h-16 mx-auto bg-white p-1 rounded-xl border border-gray-200 shadow-xs flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-gray-800" />
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 block">Quét QR tại cổng bệnh viện</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Trust Guarantees & Commitments Bar ───────────────────── */}
      <section className="py-10 bg-slate-50 border-t border-gray-200">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5 p-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Bảo mật chuẩn Y tế</h4>
                <p className="text-xs text-gray-500">Mã hóa dữ liệu bệnh án theo chuẩn HL7/FHIR</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">100% Bác sĩ Chứng chỉ</h4>
                <p className="text-xs text-gray-500">Hồ sơ chuyên môn được xác thực minh bạch</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Hỗ trợ Tổng đài 24/7</h4>
                <p className="text-xs text-gray-500">Đường dây nóng 1900 1234 luôn sẵn sàng</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Đồng hành Chăm sóc</h4>
                <p className="text-xs text-gray-500">Nhắc lịch tái khám và hỗ trợ sau điều trị</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Simple Apple Icon SVG helper for App Store button
function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.86.96-2.95-.93.04-2.07.62-2.73 1.4-.58.67-1.09 1.76-.95 2.82 1.04.08 2.1-.51 2.72-1.27z" />
    </svg>
  );
}
