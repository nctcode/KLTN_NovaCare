'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  Search,
  Building2,
  Tag,
  CheckCircle2,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  PhoneCall,
  ChevronRight,
  Filter,
  Check,
  X,
  Stethoscope,
  Building
} from 'lucide-react';

interface Facility {
  name: string;
  address: string;
  phone: string;
  hours: string;
  rating: number;
}

interface HealthPackage {
  id: string;
  title: string;
  category: string;
  targetGender: 'Tất cả' | 'Nam' | 'Nữ';
  originalPrice: string;
  price: string;
  image: string;
  description: string;
  included: string[];
  facilities: Facility[];
}

const HEALTH_PACKAGES: HealthPackage[] = [
  {
    id: 'pkg-tong-quat-vip',
    title: 'Gói Khám Sức Khỏe Tổng Quát VIP & Tầm Soát Ung Thư Toàn Diện',
    category: 'Tổng quát VIP',
    targetGender: 'Tất cả',
    originalPrice: '4.500.000đ',
    price: '3.650.000đ',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=500',
    description: 'Chương trình tầm soát sức khỏe toàn thân 28 danh mục chuyên sâu bao gồm MRI, siêu âm ổ bụng 4D, bộ marker ung thư và xét nghiệm gen.',
    included: [
      'Xét nghiệm công thức máu & mỡ máu 22 chỉ số',
      'Xét nghiệm 6 bộ dấu ấn Marker tầm soát ung thư',
      'Chụp X-quang tim phổi DR liều thấp & Siêu âm 4D',
      'Nội soi dạ dày gây mê công nghệ NMI không đau',
      'Bác sĩ CKII tư vấn phác đồ phòng bệnh cá nhân hóa'
    ],
    facilities: [
      {
        name: 'Bệnh viện Đa Khoa NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '028 3855 4269',
        hours: '07:00 - 17:00 (Thứ 2 - Chủ Nhật)',
        rating: 4.9
      },
      {
        name: 'Bệnh viện Đại Học Y Dược TP.HCM',
        address: '215 Hồng Bàng, Quận 5, TP.HCM',
        phone: '028 3855 4269',
        hours: '06:30 - 16:30 (Thứ 2 - Thứ 7)',
        rating: 4.8
      },
      {
        name: 'Trung Tâm Chẩn Đoán Y Khoa High-Tech',
        address: '102 Lý Thường Kiệt, Quận 10, TP.HCM',
        phone: '028 3864 1234',
        hours: '07:00 - 19:00 (Thứ 2 - Thứ 7)',
        rating: 4.9
      }
    ]
  },
  {
    id: 'pkg-tieu-hoa-gan-mat',
    title: 'Gói Khám Bệnh Tiêu Hóa - Gan Mật Chuyên Sâu & Vi Khuẩn HP',
    category: 'Nội khoa',
    targetGender: 'Tất cả',
    originalPrice: '1.200.000đ',
    price: '850.000đ',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=500',
    description: 'Tầm soát sớm các bệnh lý viêm dạ dày, trào ngược dạ dày thực quản, men gan cao và vi khuẩn Helicobacter Pylori qua hơi thở.',
    included: [
      'Khám lâm sàng với Bác sĩ CKI Tiêu Hóa',
      'Test vi khuẩn HP qua hơi thở C13 không xâm lấn',
      'Đo bộ chỉ số men gan AST, ALT, GGT, Bilirubin',
      'Siêu âm ổ bụng tổng quát màu 4D'
    ],
    facilities: [
      {
        name: 'Trung Tâm Nội Soi Doctor Check',
        address: '429 Hai Bà Trưng, Phường 8, Quận 3, TP.HCM',
        phone: '028 7300 1115',
        hours: '06:00 - 17:00 (Thứ 2 - Chủ Nhật)',
        rating: 4.9
      },
      {
        name: 'Phòng Khám Đa Khoa Quốc Tế NovaCare',
        address: '45 Võ Thị Sáu, Quận 3, TP.HCM',
        phone: '1900 1234',
        hours: '07:30 - 20:00 Hàng ngày',
        rating: 4.8
      }
    ]
  },
  {
    id: 'pkg-tong-quat-nu',
    title: 'Gói Khám Sức Khỏe Nữ Giới Chuyên Sâu & Tầm Soát Ung Thư Vú',
    category: 'Nữ giới',
    targetGender: 'Nữ',
    originalPrice: '2.800.000đ',
    price: '2.150.000đ',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=500',
    description: 'Được thiết kế riêng cho phụ nữ nhằm kiểm tra phụ khoa, siêu âm tuyến vú, phết tế bào Pap smear tầm soát sớm ung thư cổ tử cung.',
    included: [
      'Khám Phụ khoa & Nhũ khoa chuyên sâu',
      'Phết tế bào Pap Smear tầm soát ung thư cổ tử cung',
      'Siêu âm tuyến vú 4D & Siêu âm đầu dò phụ khoa',
      'Bộ xét nghiệm nội tiết tố nữ & vi chất'
    ],
    facilities: [
      {
        name: 'Bệnh viện Từ Dũ - Khoa Khám Theo Yêu Cầu',
        address: '284 Cống Quỳnh, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
        phone: '028 5404 2829',
        hours: '07:00 - 16:30 (Thứ 2 - Thứ 6)',
        rating: 4.9
      },
      {
        name: 'Phòng Khám Đa Khoa Golden Healthcare',
        address: '37 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP.HCM',
        phone: '028 3559 1199',
        hours: '07:30 - 17:00 (Thứ 2 - Thứ 7)',
        rating: 4.8
      }
    ]
  },
  {
    id: 'pkg-tim-mach-huyet-ap',
    title: 'Gói Tầm Soát Tim Mạch, Xơ Vữa Động Mạch & Phòng Đột Quỵ',
    category: 'Tim mạch',
    targetGender: 'Tất cả',
    originalPrice: '2.200.000đ',
    price: '1.690.000đ',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=500',
    description: 'Chẩn đoán chức năng tim, siêu âm Doppler tim màu 4D, đo độ xơ vữa mạch máu cảnh nhằm ngăn ngừa nguy cơ tai biến nhồi máu cơ tim.',
    included: [
      'Điện tim ECG 12 chuyển đạo máy tự động',
      'Siêu âm tim màu Doppler mạch máu chuyên sâu',
      'Xét nghiệm mỡ máu toàn phần (Cholesterol, Triglyceride, HDL, LDL)',
      'Siêu âm Doppler động mạch cảnh tầm soát xơ vữa'
    ],
    facilities: [
      {
        name: 'Bệnh viện Tim Tâm Đức',
        address: '04 Nguyễn Lương Bằng, Tân Phú, Quận 7, TP.HCM',
        phone: '028 5411 0036',
        hours: '07:00 - 16:30 (Thứ 2 - Thứ 7)',
        rating: 4.9
      },
      {
        name: 'Bệnh viện Đa Khoa NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 Hàng ngày',
        rating: 4.8
      }
    ]
  },
  {
    id: 'pkg-tieu-duong-xet-nghiem',
    title: 'Gói Khám & Tầm Soát Biến Chứng Đái Tháo Đường',
    category: 'Nội tiết',
    targetGender: 'Tất cả',
    originalPrice: '1.100.000đ',
    price: '790.000đ',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=500',
    description: 'Đánh giá nguy cơ và tầm soát sớm các biến chứng thận, mắt và thần kinh ở bệnh nhân tiền tiểu đường & đái tháo đường.',
    included: [
      'Đo Glucose máu lúc đói & Chỉ số HbA1c 3 tháng',
      'Đánh giá chức năng thận (Ure, Creatinin, Microalbumin niệu)',
      'Soi đáy mắt phát hiện võng mạc tiểu đường',
      'Tư vấn chế độ ăn kiểm soát chỉ số đường huyết'
    ],
    facilities: [
      {
        name: 'Phòng Khám Đa Khoa Phước Anh',
        address: '224 Nguyễn Trãi, Phường 3, Quận 5, TP.HCM',
        phone: '028 3838 1234',
        hours: '07:00 - 17:30 Hàng ngày',
        rating: 4.7
      },
      {
        name: 'Bệnh viện Đại Học Y Dược TP.HCM',
        address: '215 Hồng Bàng, Quận 5, TP.HCM',
        phone: '028 3855 4269',
        hours: '06:30 - 16:30 (Thứ 2 - Thứ 7)',
        rating: 4.8
      }
    ]
  },
  {
    id: 'pkg-kham-mat-khuc-xa',
    title: 'Gói Khám Mắt Chuyên Sâu, Đo Khúc Xạ & Tầm Soát Cườm Nước',
    category: 'Mắt',
    targetGender: 'Tất cả',
    originalPrice: '750.000đ',
    price: '490.000đ',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=500',
    description: 'Đo nhãn áp, soi đáy mắt chẩn đoán đục thủy tinh thể, cườm nước Glaucoma và tật khúc xạ bằng hệ thống máy sinh học kỹ thuật số.',
    included: [
      'Thử thị lực & Đo khúc xạ máy tự động',
      'Đo nhãn áp không tiếp xúc tầm soát Glaucoma',
      'Soi đáy mắt sinh học phát hiện tổn thương võng mạc',
      'Tư vấn bảo vệ mắt khi dùng máy tính'
    ],
    facilities: [
      {
        name: 'Trung Tâm Mắt Quốc Tế Phương Đông',
        address: '71 Ngô Thời Nhiệm, Phường 6, Quận 3, TP.HCM',
        phone: '028 3930 0999',
        hours: '07:30 - 17:00 Hàng ngày',
        rating: 4.9
      },
      {
        name: 'Bệnh viện Mắt TP.HCM',
        address: '280 Điện Biên Phủ, Phường 7, Quận 3, TP.HCM',
        phone: '028 3932 5713',
        hours: '07:00 - 16:30 (Thứ 2 - Thứ 6)',
        rating: 4.8
      }
    ]
  }
];

export default function HealthPackagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedPackage, setSelectedPackage] = useState<HealthPackage | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedDate, setSelectedDate] = useState('2026-07-26');
  const [selectedSlot, setSelectedSlot] = useState('08:00 - 09:00');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const categories = ['Tất cả', 'Tổng quát VIP', 'Nữ giới', 'Nội khoa', 'Tim mạch', 'Nội tiết', 'Mắt'];

  const filteredPackages = HEALTH_PACKAGES.filter((pkg) => {
    const matchesSearch = pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.facilities.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tất cả' || pkg.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenBooking = (pkg: HealthPackage) => {
    setSelectedPackage(pkg);
    setSelectedFacility(pkg.facilities[0] || null);
    setBookingSuccess(false);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#0c4b39] via-[#093c2d] to-[#083327] text-white py-16 relative overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/15 inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#66FF33]" /> Danh Mục Gói Khám Sức Khỏe & Tầm Soát Chủ Động
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Gói Khám Sức Khỏe Tổng Quát & Chuyên Sâu Có Địa Điểm Khám Rõ Ràng
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Mỗi gói khám đều liệt kê minh bạch danh sách các **Bệnh viện & Phòng khám liên kết** để bạn lựa chọn cơ sở thuận tiện nhất gần nhà.
          </p>
        </div>
      </section>

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">

        {/* Search & Categories Filter */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Nhập tên gói khám, địa chỉ quận huyện, tên bệnh viện..."
              className="pl-12 h-12 w-full bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-2xl text-xs font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0c4b39] text-[#66FF33] shadow-md scale-105'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Packages List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <Card key={pkg.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                  <img
                    src={pkg.image}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#0c4b39] text-[#66FF33] font-extrabold text-[10px] uppercase px-3 py-1 rounded-full shadow-md">
                    {pkg.category}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-base md:text-lg leading-snug group-hover:text-[#0c4b39] transition-colors line-clamp-2">
                    {pkg.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Affiliated Facilities Preview Badge */}
                  <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100 space-y-1.5">
                    <p className="text-[11px] font-extrabold text-[#0c4b39] flex items-center gap-1.5 uppercase tracking-wider">
                      <Building2 className="h-3.5 w-3.5 text-[#0c4b39]" /> {pkg.facilities.length} Cơ Sở Y Tế Tiếp Nhận Khám:
                    </p>
                    <div className="space-y-1 pl-1">
                      {pkg.facilities.slice(0, 2).map((fac, fIdx) => (
                        <div key={fIdx} className="text-[11px] text-slate-700 font-medium flex items-center justify-between">
                          <span className="truncate max-w-[200px]">• {fac.name}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">{fac.address.split(',')[2] || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Included Items */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Danh mục khám bao gồm:</span>
                    {pkg.included.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#0c4b39] shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 line-through block">{pkg.originalPrice}</span>
                  <span className="text-xl font-black text-[#0c4b39]">{pkg.price}</span>
                </div>

                <Button
                  onClick={() => handleOpenBooking(pkg)}
                  className="py-2.5 px-5 bg-[#0c4b39] hover:bg-[#083327] text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-sm transition"
                >
                  Chọn cơ sở & Khám
                </Button>
              </div>
            </Card>
          ))}
        </div>

      </div>

      {/* BOOKING & FACILITY SELECTION MODAL */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            {!bookingSuccess ? (
              <>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
                    Đăng ký gói khám sức khỏe
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    {selectedPackage.title}
                  </h3>
                  <p className="text-xs text-[#0c4b39] font-bold mt-1">Giá gói khám: {selectedPackage.price}</p>
                </div>

                {/* Facility Selection List */}
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-800 block">
                    1. Chọn Bệnh Viện / Phòng Khám Tiếp Nhận (Bắt buộc) *
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedPackage.facilities.map((fac, fIdx) => (
                      <div
                        key={fIdx}
                        onClick={() => setSelectedFacility(fac)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          selectedFacility?.name === fac.name
                            ? 'bg-[#0c4b39]/5 border-[#0c4b39] ring-2 ring-[#0c4b39]/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white text-[#0c4b39] shadow-xs mt-0.5">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs">{fac.name}</h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {fac.address}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" /> {fac.hours} | Hotline: {fac.phone}
                          </p>
                        </div>
                        {selectedFacility?.name === fac.name && (
                          <CheckCircle2 className="h-5 w-5 text-[#0c4b39] shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date & Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                      2. Chọn Ngày Dự Kiến Đến Khám
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                      3. Chọn Khung Giờ Đón Tiếp
                    </label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                    >
                      <option value="07:30 - 08:30">07:30 - 08:30 (Ưu tiên sáng)</option>
                      <option value="08:30 - 09:30">08:30 - 09:30</option>
                      <option value="09:30 - 10:30">09:30 - 10:30</option>
                      <option value="13:30 - 14:30">13:30 - 14:30 (Chiều)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPackage(null)}
                    className="rounded-xl text-xs font-bold"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    onClick={() => setBookingSuccess(true)}
                    className="bg-[#0c4b39] hover:bg-[#083327] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
                  >
                    Xác nhận chọn cơ sở & Đặt lịch
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-[#0c4b39] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-[#0c4b39]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Đăng Ký Khám Thành Công!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  Mã Phiếu Đặt Gói Khám <strong className="text-[#0c4b39]">NC-[#0c4b39]-{Math.floor(100000 + Math.random() * 900000)}</strong> đã được lưu. Vui lòng mang mã này đến cơ sở y tế đã chọn.
                </p>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-xs text-slate-800 space-y-1.5 text-left">
                  <p><strong>Gói khám:</strong> {selectedPackage.title}</p>
                  <p><strong>Địa điểm đến khám:</strong> {selectedFacility?.name}</p>
                  <p><strong>Địa chỉ:</strong> {selectedFacility?.address}</p>
                  <p><strong>Thời gian hẹn:</strong> {selectedSlot} - {selectedDate}</p>
                </div>

                <Button
                  onClick={() => setSelectedPackage(null)}
                  className="w-full bg-[#0c4b39] text-white font-bold text-xs py-3 rounded-xl"
                >
                  Hoàn tất & Đóng window
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
