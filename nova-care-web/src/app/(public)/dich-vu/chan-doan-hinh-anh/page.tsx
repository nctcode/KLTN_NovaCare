'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Search,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  ChevronRight,
  PhoneCall,
  Zap,
  Info,
  Check,
  X,
  Stethoscope,
  QrCode,
  UserCheck
} from 'lucide-react';

// Categories data
const CATEGORIES = [
  { id: 'all', name: 'Tất cả dịch vụ', icon: Activity },
  { id: 'mri', name: 'Chụp Cộng Hưởng Từ (MRI)', icon: Activity },
  { id: 'ct', name: 'Chụp CT-Scanner', icon: Zap },
  { id: 'noi-soi', name: 'Nội Soi Dạ Dày & Đại Tràng', icon: Stethoscope },
  { id: 'x-quang', name: 'Chụp X-Quang Kỹ Thuật Số', icon: FileText },
  { id: 'sieu-am', name: 'Siêu Âm Màu 4D & Doppler', icon: Sparkles }
];

// Hospitals / Centers filter
const HOSPITALS = [
  'Tất cả cơ sở y tế',
  'Bệnh viện Đa Khoa NovaCare Central',
  'Bệnh viện Chợ Rẫy',
  'Bệnh viện Đại Học Y Dược TP.HCM',
  'Trung Tâm Chẩn Đoán Hình Ảnh Y Khoa High-Tech',
  'Phòng Khám Đa Khoa Quốc Tế NovaCare'
];

// Service Items
interface ImagingService {
  id: string;
  category: 'mri' | 'ct' | 'noi-soi' | 'x-quang' | 'sieu-am';
  title: string;
  hospital: string;
  address: string;
  prepTime: string;
  resultTime: string;
  badge: string;
  badgeType: 'hot' | 'popular' | 'new';
  techSpec: string;
  originalPrice: string;
  price: string;
  bhytSupport: boolean;
  notes: string[];
}

const SERVICES: ImagingService[] = [
  {
    id: 'mri-so-nao',
    category: 'mri',
    title: 'Chụp Cộng Hưởng Từ (MRI) Sọ Não & Mạch Máu Náo 3.0 Tesla',
    hospital: 'Bệnh viện Đa Khoa NovaCare Central',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
    prepTime: 'Không cần nhịn ăn',
    resultTime: 'Trả kết quả sau 45 phút',
    badge: 'MÁY MRI 3.0 T SẮC NÉT',
    badgeType: 'hot',
    techSpec: 'Công nghệ Siemens Magnetom 3.0T thế hệ mới, không tia X',
    originalPrice: '2.800.000đ',
    price: '2.350.000đ',
    bhytSupport: true,
    notes: [
      'Phát hiện sớm tai biến, đột quỵ, u não và dị dạng mạch máu sọ não.',
      'Tháo bỏ toàn bộ trang sức kim loại, thẻ từ trước khi vào phòng chụp.',
      'Nhận file ảnh kỹ thuật số HD qua QR Code & Hồ sơ NovaCare.'
    ]
  },
  {
    id: 'noi-soi-da-day-em',
    category: 'noi-soi',
    title: 'Nội Soi Dạ Dày & Đại Tràng Gây Mê Không Đau (Công Nghệ NMI)',
    hospital: 'Bệnh viện Đa Khoa NovaCare Central',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
    prepTime: 'Nhịn ăn uống trước 6-8 tiếng',
    resultTime: 'Trả kết quả ngay sau khi tỉnh',
    badge: 'KHÔNG ĐAU - NMI TẦM SOÁT UNG THƯ',
    badgeType: 'popular',
    techSpec: 'Nội soi nhuộm màu NMI độ phóng đại 135 lần chẩn đoán vi tổn thương',
    originalPrice: '3.500.000đ',
    price: '2.950.000đ',
    bhytSupport: true,
    notes: [
      'Ngủ êm nhẹ nhàng trong 15 phút, hoàn toàn không đau, không buồn nôn.',
      'Bắt buộc đi cùng 01 người thân khi thực hiện nội soi gây mê.',
      'Bao gồm test vi khuẩn HP dạ dày nhanh & sinh thiết chẩn đoán (nếu có chỉ định).'
    ]
  },
  {
    id: 'ct-lung-toan-than',
    category: 'ct',
    title: 'Chụp CT-Scanner Phổi & Lồng Ngực Kỹ Thuật Số Liều Thấp (LDCT)',
    hospital: 'Trung Tâm Chẩn Đoán Hình Ảnh Y Khoa High-Tech',
    address: '102 Lý Thường Kiệt, Quận 10, TP.HCM',
    prepTime: 'Nhịn ăn 4 tiếng nếu có cản quang',
    resultTime: 'Trả kết quả trong 30 phút',
    badge: 'TẦM SOÁT UNG THƯ PHỔI',
    badgeType: 'hot',
    techSpec: 'Máy CT 128 lát cắt cắt lớp vi tính siêu tốc liều bức xạ thấp',
    originalPrice: '1.900.000đ',
    price: '1.550.000đ',
    bhytSupport: true,
    notes: [
      'Tầm soát sớm u phổi, nốt mờ phế quản ở người hút thuốc hoặc ho kéo dài.',
      'Hỗ trợ bơm thuốc cản quang thế hệ mới an toàn với chức năng thận.',
      'Được đọc kết quả bởi PGS.TS Chẩn đoán hình ảnh chuyên khoa.'
    ]
  },
  {
    id: 'mri-cot-song-that-lung',
    category: 'mri',
    title: 'Chụp MRI Cột Sống Thắt Lưng & Đĩa Đệm',
    hospital: 'Bệnh viện Đại Học Y Dược TP.HCM',
    address: '215 Hồng Bàng, Quận 5, TP.HCM',
    prepTime: 'Không cần nhịn ăn',
    resultTime: 'Trả kết quả sau 40 phút',
    badge: 'CHUẨN CHẨN ĐOÁN THOÁT VỊ',
    badgeType: 'popular',
    techSpec: 'Máy MRI 1.5 Tesla khảo sát chi tiết đĩa đệm L1-L5, S1',
    originalPrice: '2.200.000đ',
    price: '1.890.000đ',
    bhytSupport: true,
    notes: [
      'Đánh giá chính xác vị trí chèn ép rễ thần kinh, chèn ép tủy sống.',
      'Phù hợp người bị đau lưng lan xuống chân, tê bì đùi và mông.'
    ]
  },
  {
    id: 'noi-soi-tai-mui-hong',
    category: 'noi-soi',
    title: 'Nội Soi Tai Mũi Họng Ống Mềm HD Dành Cho Người Lớn & Trẻ Em',
    hospital: 'Phòng Khám Đa Khoa Quốc Tế NovaCare',
    address: '45 Võ Thị Sáu, Quận 3, TP.HCM',
    prepTime: 'Không cần nhịn ăn',
    resultTime: 'Trả kết quả sau 15 phút',
    badge: 'ỐNG MỀM SIÊU NHỎ NO PAIN',
    badgeType: 'new',
    techSpec: 'Ống soi đường kính chỉ 2.7mm cực êm cho cả trẻ em từ 2 tuổi',
    originalPrice: '450.000đ',
    price: '320.000đ',
    bhytSupport: false,
    notes: [
      'Phát hiện sớm viêm xoang, polyp mũi, viêm VA và hạt xơ dây thanh.',
      'Không gây kích ứng niêm mạc, không đau rát sau khi soi.'
    ]
  },
  {
    id: 'x-quang-nguc-thang',
    category: 'x-quang',
    title: 'Chụp X-Quang Phổi & Tim Ngực Kỹ Thuật Số (Digital Radiography)',
    hospital: 'Phòng Khám Đa Khoa Quốc Tế NovaCare',
    address: '45 Võ Thị Sáu, Quận 3, TP.HCM',
    prepTime: 'Không nhịn ăn',
    resultTime: 'Trả kết quả sau 15 phút',
    badge: 'X-QUANG DR LIỀU THẤP',
    badgeType: 'popular',
    techSpec: 'Hệ thống X-quang kỹ thuật số DR liều tia giảm 70%',
    originalPrice: '200.000đ',
    price: '150.000đ',
    bhytSupport: true,
    notes: [
      'Khảo sát tổn thương nhu mô phổi, dịch màng phổi, kích thước bóng tim.',
      'Nhận phim rửa giấy + Ảnh kỹ thuật số độ nét cao trên ứng dụng.'
    ]
  },
  {
    id: 'sieu-am-tim-doppler',
    category: 'sieu-am',
    title: 'Siêu Âm Tim Doppler Màu Chuyên Sâu 4D & Đánh Giá Chức Năng Thất',
    hospital: 'Bệnh viện Đa Khoa NovaCare Central',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
    prepTime: 'Không nhịn ăn',
    resultTime: 'Trả kết quả ngay sau khi khám',
    badge: 'SIÊU ÂM TIM CHUYÊN SÂU',
    badgeType: 'hot',
    techSpec: 'Máy siêu âm Philips EPIQ 7G Doppler màu vi mạch',
    originalPrice: '600.000đ',
    price: '450.000đ',
    bhytSupport: true,
    notes: [
      'Khảo sát hở/hẹp van tim, phân số tống máu EF, tăng áp động mạch phổi.',
      'Thực hiện trực tiếp bởi Bác sĩ Chuyên khoa Tim mạch giàu kinh nghiệm.'
    ]
  },
  {
    id: 'sieu-am-bung-tong-quat',
    category: 'sieu-am',
    title: 'Siêu Âm Bụng Tổng Quát 4D Khảo Sát Gan, Mật, Tụy, Thận, Tiền Liệt Tuyến',
    hospital: 'Trung Tâm Chẩn Đoán Hình Ảnh Y Khoa High-Tech',
    address: '102 Lý Thường Kiệt, Quận 10, TP.HCM',
    prepTime: 'Uống nhiều nước, nhịn tiểu trước 30p',
    resultTime: 'Trả kết quả sau 20 phút',
    badge: 'SIÊU ÂM BỤNG 4D KHẢO SÁT TOÀN DIỆN',
    badgeType: 'popular',
    techSpec: 'Đầu dò đa tần số dựng hình không gian 4D',
    originalPrice: '350.000đ',
    price: '250.000đ',
    bhytSupport: true,
    notes: [
      'Phát hiện sỏi thận, sỏi mật, gan nhiễm mỡ, u nang ổ bụng.',
      'Nên nhịn ăn sáng để khảo sát túi mật được căng to rõ nhất.'
    ]
  }
];

export default function EndoscopyImagingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedHospital, setSelectedHospital] = useState<string>('Tất cả cơ sở y tế');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookingService, setBookingService] = useState<ImagingService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-25');
  const [selectedSlot, setSelectedSlot] = useState<string>('08:00 - 08:30');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Filter logic
  const filteredServices = SERVICES.filter(service => {
    const matchCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchHospital = selectedHospital === 'Tất cả cơ sở y tế' || service.hospital === selectedHospital;
    const matchQuery = searchQuery.trim() === '' ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.techSpec.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchHospital && matchQuery;
  });

  const handleOpenBooking = (service: ImagingService) => {
    setBookingService(service);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = () => {
    setBookingSuccess(true);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24">
      {/* Medpro Style Hero Banner */}
      <section className="bg-gradient-to-r from-[#0c4b39] via-[#093c2d] to-[#083327] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.15),transparent_60%)] pointer-events-none" />
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/15 inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#66FF33]" /> Đặt Lịch Chẩn Đoán Hình Ảnh & Nội Soi Medpro Standard
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
                Đặt Lịch Chụp Phim (MRI, CT, X-Quang) & Nội Soi Không Đau
              </h1>
              <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-2xl">
                Kết nối 50+ Bệnh viện & Trung tâm chẩn đoán uy tín. Ưu tiên vào phòng chụp đúng khung giờ, nhịn ăn đúng hướng dẫn y khoa và nhận file kết quả kỹ thuật số HD trực tuyến trên ứng dụng.
              </p>

              {/* Stats Bar */}
              <div className="pt-2 grid grid-cols-3 gap-4 border-t border-white/10 max-w-xl">
                <div>
                  <p className="text-2xl font-black text-[#66FF33]">10.000+</p>
                  <p className="text-[11px] text-white/70">Ca chụp/nội soi mỗi tháng</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#66FF33]">50+</p>
                  <p className="text-[11px] text-white/70">Cơ sở y tế liên kết</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#66FF33]">30 phút</p>
                  <p className="text-[11px] text-white/70">Trả kq file HD qua QR</p>
                </div>
              </div>
            </div>

            {/* Quick Search Card */}
            <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-white/20 space-y-4">
              <h3 className="font-extrabold text-[#0c4b39] text-base flex items-center gap-2">
                <Search className="h-5 w-5 text-[#0c4b39]" /> Tìm dịch vụ Chụp phim / Nội soi
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Tên dịch vụ hoặc triệu chứng
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nhập: MRI sọ não, Nội soi dạ dày NMI, CT phổi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Chọn Bệnh viện / Trung tâm Chẩn đoán
                  </label>
                  <select
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                  >
                    {HOSPITALS.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">

        {/* Category Chips Bar */}
        <section className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#0c4b39] text-[#66FF33] shadow-md scale-105'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-[#66FF33]' : 'text-[#0c4b39]'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Service Cards Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                Danh Sách Gói Chụp Phim & Nội Soi Khả Dụng ({filteredServices.length})
              </h2>
              <p className="text-xs text-slate-500">Giá dịch vụ công khai minh bạch, hỗ trợ Bảo Hiểm Y Tế</p>
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <Card className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
              <h3 className="font-extrabold text-slate-900 text-lg">Không tìm thấy gói dịch vụ phù hợp</h3>
              <p className="text-xs text-slate-500">Vui lòng chọn danh mục khác hoặc thay đổi từ khóa tìm kiếm.</p>
              <Button
                onClick={() => { setSelectedCategory('all'); setSelectedHospital('Tất cả cơ sở y tế'); setSearchQuery(''); }}
                className="bg-[#0c4b39] text-white font-bold text-xs rounded-xl"
              >
                Đặt lại bộ lọc
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServices.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group space-y-5"
                >
                  <div className="space-y-4">
                    {/* Header Badge & Hospital */}
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 bg-[#0c4b39]/10 text-[#0c4b39] rounded-full border border-[#0c4b39]/15">
                        {item.badge}
                      </span>
                      {item.bhytSupport && (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-700" /> BHYT Chi Trả
                        </span>
                      )}
                    </div>

                    {/* Title & Tech Spec */}
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base md:text-lg group-hover:text-[#0c4b39] transition-colors leading-snug mb-1.5">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#0c4b39] font-semibold bg-[#0c4b39]/5 px-3 py-1.5 rounded-xl border border-[#0c4b39]/10 inline-block">
                        ⚙️ {item.techSpec}
                      </p>
                    </div>

                    {/* Hospital & Location */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <Building2 className="h-4 w-4 text-[#0c4b39] shrink-0" />
                        <span>{item.hospital}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{item.address}</span>
                      </div>
                    </div>

                    {/* Time & Preparation Notes */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-100 space-y-0.5">
                        <p className="text-amber-800 font-bold flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Chuẩn bị trước
                        </p>
                        <p className="text-slate-700 font-medium">{item.prepTime}</p>
                      </div>
                      <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 space-y-0.5">
                        <p className="text-emerald-800 font-bold flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-emerald-600" /> Trả kết quả
                        </p>
                        <p className="text-slate-700 font-medium">{item.resultTime}</p>
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {item.notes.map((note, nIdx) => (
                        <li key={nIdx} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-[#0c4b39] shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer Price & Booking CTA Button */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-400 line-through mr-2">{item.originalPrice}</span>
                      <span className="text-xl font-black text-[#0c4b39]">{item.price}</span>
                    </div>
                    <Button
                      onClick={() => handleOpenBooking(item)}
                      className="bg-[#0c4b39] hover:bg-[#083327] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-2xl shadow-sm transition flex items-center gap-1.5"
                    >
                      <span>Đặt lịch khám</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: MEDPRO GUIDELINES & PREPARATION RULES */}
        <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39]">
              <Info className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Lưu Ý Quan Trọng Y Khoa Trước Khi Chụp Phim & Nội Soi</h2>
              <p className="text-xs text-slate-500">Đảm bảo kết quả chẩn đoán hình ảnh chính xác và an toàn tuyệt đối</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm text-[#0c4b39]">1. Nội soi Dạ dày & Đại tràng</h4>
              <ul className="space-y-1.5 text-slate-600">
                <li>• Nhịn ăn hoàn toàn trước 6 - 8 tiếng.</li>
                <li>• Không uống nước có màu (cà phê, trà, nước ngọt).</li>
                <li>• Bắt buộc đi cùng người thân khi chọn nội soi gây mê.</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm text-[#0c4b39]">2. Chụp Cộng Hưởng Từ (MRI)</h4>
              <ul className="space-y-1.5 text-slate-600">
                <li>• Tháo bỏ răng giả, khuyên tai, trang sức kim loại.</li>
                <li>• Thông báo nếu có máy tạo nhịp tim hoặc van tim nhân tạo.</li>
                <li>• Thả lỏng cơ thể trong suốt 15-30 phút chụp.</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm text-[#0c4b39]">3. Chụp CT-Scanner & X-Quang</h4>
              <ul className="space-y-1.5 text-slate-600">
                <li>• Phụ nữ mang thai hoặc nghi ngờ mang thai cần báo bác sĩ.</li>
                <li>• Nhịn ăn 4 tiếng nếu có tiêm thuốc cản quang.</li>
                <li>• Uống nhiều nước sau khi tiêm cản quang để đào thải.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 4: SUPPORT HOTLINE */}
        <div className="bg-gradient-to-r from-[#0c4b39] to-[#083327] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold">Cần hỗ trợ tư vấn chọn gói Chụp Phim / Nội Soi?</h3>
            <p className="text-white/70 text-xs">Đội ngũ kỹ thuật viên y tế NovaCare tư vấn miễn phí 24/7 cho bạn.</p>
          </div>
          <a
            href="tel:19001234"
            className="px-6 py-3.5 bg-[#66FF33] hover:bg-[#5ae62e] text-[#0c4b39] font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            <PhoneCall className="h-4 w-4" /> Tổng đài 1900 1234
          </a>
        </div>

      </div>

      {/* QUICK BOOKING MODAL */}
      {bookingService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setBookingService(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            {!bookingSuccess ? (
              <>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
                    Xác nhận đặt lịch chẩn đoán
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                    {bookingService.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{bookingService.hospital}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Giá gói niêm yết:</span>
                    <span className="font-bold text-[#0c4b39] text-base">{bookingService.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
                    <span className="text-slate-500">Quyền lợi BHYT:</span>
                    <span className="font-bold text-emerald-700">Được áp dụng tại viện</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                      1. Chọn Ngày Khám / Chụp Phim
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
                      2. Chọn Khung Giờ Giờ Hẹn Khả Dụng
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['07:30 - 08:00', '08:00 - 08:30', '09:00 - 09:30', '10:00 - 10:30', '13:30 - 14:00', '14:30 - 15:00'].map((slot, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                            selectedSlot === slot
                              ? 'bg-[#0c4b39] text-[#66FF33] border-[#0c4b39]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setBookingService(null)}
                    className="rounded-xl text-xs font-bold"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    onClick={handleConfirmBooking}
                    className="bg-[#0c4b39] hover:bg-[#083327] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
                  >
                    Xác nhận đặt lịch
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-[#0c4b39] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-[#0c4b39]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Đặt Lịch Thành Công!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  Mã Phiếu Chụp Phim / Nội Soi <strong className="text-[#0c4b39]">NC-MED-{Math.floor(100000 + Math.random() * 900000)}</strong> đã được cấp và lưu trong tài khoản của bạn.
                </p>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-xs text-slate-800 space-y-1 text-left">
                  <p><strong>Dịch vụ:</strong> {bookingService.title}</p>
                  <p><strong>Bệnh viện:</strong> {bookingService.hospital}</p>
                  <p><strong>Thời gian:</strong> {selectedSlot} - {selectedDate}</p>
                  <p><strong>Hướng dẫn:</strong> {bookingService.prepTime}</p>
                </div>

                <Button
                  onClick={() => setBookingService(null)}
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
