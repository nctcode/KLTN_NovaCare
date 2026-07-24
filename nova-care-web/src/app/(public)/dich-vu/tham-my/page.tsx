'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Search,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  AlertCircle,
  ChevronRight,
  PhoneCall,
  Zap,
  Info,
  Check,
  X,
  Award,
  HeartHandshake,
  UserCheck,
  Star,
  Flame
} from 'lucide-react';

// Categories data for Aesthetics
const CATEGORIES = [
  { id: 'all', name: 'Tất cả dịch vụ', icon: Sparkles },
  { id: 'mat', name: 'Thẩm Mỹ Khuôn Mặt', icon: Award },
  { id: 'voc-dang', name: 'Tạo Hình Vóc Dáng', icon: Flame },
  { id: 'tre-hoa', name: 'Trẻ Hóa & Điều Trị Da', icon: Star },
  { id: 'y-khoa', name: 'Thẩm Mỹ Y Khoa Chuẩn Viện', icon: ShieldCheck }
];

// Aesthetic Service Items
interface AestheticService {
  id: string;
  category: 'mat' | 'voc-dang' | 'tre-hoa' | 'y-khoa';
  title: string;
  doctor: string;
  hospital: string;
  address: string;
  duration: string;
  recoveryTime: string;
  badge: string;
  techSpec: string;
  originalPrice: string;
  price: string;
  warranty: string;
  highlights: string[];
}

const SERVICES: AestheticService[] = [
  {
    id: 'nang-mui-surgiform',
    category: 'mat',
    title: 'Nâng Mũi Cấu Trúc Bọc Sụn Surgiform Chuẩn Tỉ Lệ Vàng 3D',
    doctor: 'ThS.BS Chuyên Khoa I Nguyễn Hoàng Nam',
    hospital: 'Trung Tâm Tạo Hình Thẩm Mỹ NovaCare Beauty',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
    duration: '60 - 90 phút',
    recoveryTime: 'Cắt chỉ sau 7 ngày',
    badge: 'CÔNG NGHỆ CHUẨN KOREA',
    techSpec: 'Sụn sinh học Surgiform nhập khẩu Mỹ tương thích 99% với cơ thể',
    originalPrice: '35.000.000đ',
    price: '28.500.000đ',
    warranty: 'Bảo hành vĩnh viễn',
    highlights: [
      'Dáng mũi S-Line/L-Line tự nhiên, đầu mũi thon gọn không bóng đỏ.',
      'Mô phỏng dáng mũi 3D Crisalix trước khi phẫu thuật.',
      'Miễn phí 100% chi phí tái khám và thay băng hậu phẫu.'
    ]
  },
  {
    id: 'cat-mi-nhan-5d',
    category: 'mat',
    title: 'Cắt Mí Nếp Mảnh 5D Nano Plasma Không Đau Không Sẹo',
    doctor: 'BS CKI Lê Thị Minh Thư',
    hospital: 'Trung Tâm Tạo Hình Thẩm Mỹ NovaCare Beauty',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
    duration: '45 phút',
    recoveryTime: 'Hồi phục sau 5 ngày',
    badge: 'TẠO NẾP MÍ TỰ NHIÊN',
    techSpec: 'Dao Plasma khóa mạch máu tức thì, hạn chế tối đa sưng nếp mí',
    originalPrice: '12.000.000đ',
    price: '8.900.000đ',
    warranty: 'Bảo hành 10 năm',
    highlights: [
      'Loại bỏ bọng mỡ mắt thừa và da chùng viền mi trên.',
      'Nếp mí tự nhiên cân đối, đường chỉ khâu nội soi thẩm mỹ không sẹo.',
      'Chiếu tia Plasma lạnh giúp vết thương khô nhanh sau 24h.'
    ]
  },
  {
    id: 'hut-mo-lipo-ultrasound',
    category: 'voc-dang',
    title: 'Hút Mỡ Bụng Tạo Form S-Line Công Nghệ Vaser Lipo 4D',
    doctor: 'TS.BS Phạm Quốc Cường',
    hospital: 'Bệnh viện Đa Khoa NovaCare Central',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
    duration: '90 - 120 phút',
    recoveryTime: 'Nghỉ dưỡng 2-3 ngày',
    badge: 'GIẢM 10-15CM VÒNG EO',
    techSpec: 'Sóng siêu âm đa tần hóa lỏng mỡ thừa nhẹ nhàng không xâm lấn cơ',
    originalPrice: '65.000.000đ',
    price: '49.000.000đ',
    warranty: 'Cam kết bằng văn bản',
    highlights: [
      'Loại bỏ triệt để 90% mỡ thừa vùng bụng trên, bụng dưới và hai bên eo.',
      'Sử dụng sóng RF làm săn chắc da bụng, tránh trùng nhão sau hút.',
      'Thực hiện tại phòng mổ vô trùng 1 chiều đạt chuẩn Bộ Y Tế.'
    ]
  },
  {
    id: 'nang-nguc-nano-chip',
    category: 'voc-dang',
    title: 'Nâng Ngực Nội Soi Đặt Túi Motiva Ergonomix Nano Chip Ergonomic',
    doctor: 'TS.BS Phạm Quốc Cường',
    hospital: 'Bệnh viện Đa Khoa NovaCare Central',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
    duration: '90 phút',
    recoveryTime: 'Xuất viện sau 24h',
    badge: 'TÚI NANO CHIP HOA KỲ',
    techSpec: 'Túi ngực linh hoạt linh hoạt chuyển động theo tư thế đứng/nằm',
    originalPrice: '85.000.000đ',
    price: '68.000.000đ',
    warranty: 'Bảo hành toàn cầu trọn đời',
    highlights: [
      'Phẫu thuật nội soi qua đường nách/chân ngực không lộ sẹo.',
      'Túi chứa chip thông minh lưu trữ thông số an toàn chuẩn FDA.',
      'Tặng áo định hình cao cấp và 5 buổi chiếu tia giảm sưng.'
    ]
  },
  {
    id: 'tre-hoa-hifu-ultherapy',
    category: 'tre-hoa',
    title: 'Nâng Cơ Trẻ Hóa Xóa Nhăn Toàn Mặt Hifu Ultherapy 1200 Shots',
    doctor: 'ThS.BS Nguyễn Thị Phương Thảo',
    hospital: 'Phòng Khám Thẩm Mỹ Quốc Tế NovaCare VIP',
    address: '45 Võ Thị Sáu, Quận 3, TP.HCM',
    duration: '60 phút',
    recoveryTime: 'Không cần nghỉ dưỡng',
    badge: 'TRẺ HÓA 5-10 TUỔI',
    techSpec: 'Sóng siêu âm hội tụ vi điểm tác động sâu lớp cơ SMAS 4.5mm',
    originalPrice: '25.000.000đ',
    price: '16.500.000đ',
    warranty: 'Hiệu quả 12 - 24 tháng',
    highlights: [
      'Xóa mờ rãnh cười, nếp nhăn trán, săn chắc nọng cằm chảy xệ.',
      'Kích thích sản sinh Collagen & Elastin tự nhiên dưới da.',
      'Thực hiện xong trang điểm và đi làm bình thường ngay lập tức.'
    ]
  },
  {
    id: 'laser-co2-fractional-seo',
    category: 'y-khoa',
    title: 'Điều Trị Sẹo Rỗ Sẹo Lồi Công Nghệ Laser CO2 Fractional & PR.P',
    doctor: 'BS CKI Lê Thị Minh Thư',
    hospital: 'Phòng Khám Thẩm Mỹ Quốc Tế NovaCare VIP',
    address: '45 Võ Thị Sáu, Quận 3, TP.HCM',
    duration: '45 - 60 phút',
    recoveryTime: 'Bong vảy sau 3-5 ngày',
    badge: 'LẤY LẠI LÀN DA MỊN MÀNG',
    techSpec: 'Tia Laser vi điểm bóc tách đáy sẹo kết hợp Huyết tương giàu tiểu cầu PR.P',
    originalPrice: '6.000.000đ',
    price: '3.800.000đ',
    warranty: 'Cam kết mờ sẹo 80-90%',
    highlights: [
      'Làm đầy các vết sẹo rỗ lâu năm, sẹo mụn xơ cứng.',
      'Thu nhỏ lỗ chân lông và làm đều màu sắc tố da toàn mặt.',
      'Miễn phí bộ sản phẩm tế bào gốc phục hồi da sau điều trị.'
    ]
  }
];

export default function AestheticServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookingService, setBookingService] = useState<AestheticService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-26');
  const [selectedSlot, setSelectedSlot] = useState<string>('09:00 - 10:00');
  const [patientNote, setPatientNote] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Filter logic
  const filteredServices = SERVICES.filter(service => {
    const matchCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchQuery = searchQuery.trim() === '' ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.techSpec.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchQuery;
  });

  const handleOpenBooking = (service: AestheticService) => {
    setBookingService(service);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = () => {
    setBookingSuccess(true);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24">
      {/* Premium Luxury Hero Banner */}
      <section className="bg-gradient-to-r from-[#0c4b39] via-[#093c2d] to-[#041d16] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.18),transparent_60%)] pointer-events-none" />
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/15 inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#66FF33]" /> Viện Tạo Hình Thẩm Mỹ & Trẻ Hóa NovaCare Beauty
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
                Khám & Tạo Hình Thẩm Mỹ Công Nghệ Cao Chuẩn Y Khoa
              </h1>
              <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-2xl">
                Đội ngũ Thạc sĩ - Bác sĩ Chuyên khoa Tạo hình Thẩm mỹ trên 15 năm kinh nghiệm. Ứng dụng công nghệ làm đẹp tiên tiến đạt chứng nhận an toàn khắt khe FDA Hoa Kỳ & CE Châu Âu.
              </p>

              {/* Quality Badges */}
              <div className="pt-2 grid grid-cols-3 gap-4 border-t border-white/10 max-w-xl">
                <div>
                  <p className="text-2xl font-black text-[#66FF33]">100%</p>
                  <p className="text-[11px] text-white/70">Bác sĩ có CCHN Tạo hình</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#66FF33]">5.000+</p>
                  <p className="text-[11px] text-white/70">Ca phẫu thuật thành công</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#66FF33]">Chuẩn FDA</p>
                  <p className="text-[11px] text-white/70">Vô trùng phòng mổ 1 chiều</p>
                </div>
              </div>
            </div>

            {/* Quick Search Card */}
            <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-white/20 space-y-4">
              <h3 className="font-extrabold text-[#0c4b39] text-base flex items-center gap-2">
                <Search className="h-5 w-5 text-[#0c4b39]" /> Tìm kiếm dịch vụ làm đẹp
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Nhập tên dịch vụ thẩm mỹ
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ví dụ: Nâng mũi Surgiform, Cắt mí Nano, Hút mỡ Vaser, Hifu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs text-[#0c4b39] font-medium">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Miễn phí 100% chi phí thăm khám & tư vấn 1:1 cùng Bác sĩ Chuyên khoa.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">

        {/* Category Filter Chips Bar */}
        <section className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
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

        {/* Aesthetic Service Cards Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                Danh Sách Dịch Vụ Thẩm Mỹ & Trẻ Hóa ({filteredServices.length})
              </h2>
              <p className="text-xs text-slate-500">Cam kết bảo hành kết quả lâu dài & Chăm sóc hậu phẫu VIP 1:1</p>
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <Card className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
              <h3 className="font-extrabold text-slate-900 text-lg">Không tìm thấy dịch vụ thẩm mỹ phù hợp</h3>
              <p className="text-xs text-slate-500">Vui lòng chọn danh mục khác hoặc thay đổi từ khóa tìm kiếm.</p>
              <Button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
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
                    {/* Header Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 bg-[#0c4b39]/10 text-[#0c4b39] rounded-full border border-[#0c4b39]/15">
                        {item.badge}
                      </span>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-md shrink-0 flex items-center gap-1">
                        <Award className="h-3 w-3 text-amber-700" /> {item.warranty}
                      </span>
                    </div>

                    {/* Service Title */}
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base md:text-lg group-hover:text-[#0c4b39] transition-colors leading-snug mb-1.5">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#0c4b39] font-semibold bg-[#0c4b39]/5 px-3 py-1.5 rounded-xl border border-[#0c4b39]/10 inline-block">
                        ✨ {item.techSpec}
                      </p>
                    </div>

                    {/* Doctor & Hospital Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 font-bold text-[#0c4b39]">
                        <UserCheck className="h-4 w-4 text-[#0c4b39] shrink-0" />
                        <span>Trực tiếp thực hiện: {item.doctor}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium text-[11px]">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{item.hospital}</span>
                      </div>
                    </div>

                    {/* Duration & Recovery */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 space-y-0.5">
                        <p className="text-emerald-800 font-bold flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-emerald-600" /> Thời gian thực hiện
                        </p>
                        <p className="text-slate-700 font-medium">{item.duration}</p>
                      </div>
                      <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 space-y-0.5">
                        <p className="text-blue-800 font-bold flex items-center gap-1">
                          <HeartHandshake className="h-3.5 w-3.5 text-blue-600" /> Thời gian hồi phục
                        </p>
                        <p className="text-slate-700 font-medium">{item.recoveryTime}</p>
                      </div>
                    </div>

                    {/* Key Highlights */}
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {item.highlights.map((hl, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-[#0c4b39] shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-400 line-through mr-2">{item.originalPrice}</span>
                      <span className="text-xl font-black text-[#0c4b39]">{item.price}</span>
                    </div>
                    <Button
                      onClick={() => handleOpenBooking(item)}
                      className="bg-[#0c4b39] hover:bg-[#083327] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-2xl shadow-sm transition flex items-center gap-1.5"
                    >
                      <span>Đặt lịch tư vấn</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: 4-STEP SAFETY PROCESS BANNER */}
        <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Quy Trình 4 Bước Tạo Hình Thẩm Mỹ An Toàn Chuẩn Bộ Y Tế</h2>
              <p className="text-xs text-slate-500">Đảm bảo sức khỏe tuyệt đối và kết quả thẩm mỹ hoàn hảo nhất</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2 text-center">
              <div className="w-8 h-8 rounded-full bg-[#0c4b39] text-[#66FF33] font-bold text-xs flex items-center justify-center mx-auto">
                1
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Thăm Khám & Mô Phỏng 3D</h4>
              <p className="text-[11px] text-slate-500">Thăm khám 1:1 với Bác sĩ & dựng form 3D Crisalix</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2 text-center">
              <div className="w-8 h-8 rounded-full bg-[#0c4b39] text-[#66FF33] font-bold text-xs flex items-center justify-center mx-auto">
                2
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Kiểm Tra Sức Khỏe Tổng Quát</h4>
              <p className="text-[11px] text-slate-500">Xét nghiệm máu, đo điện tim đạt chuẩn phẫu thuật</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2 text-center">
              <div className="w-8 h-8 rounded-full bg-[#0c4b39] text-[#66FF33] font-bold text-xs flex items-center justify-center mx-auto">
                3
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Thực Hiện Phẫu Thuật</h4>
              <p className="text-[11px] text-slate-500">Phòng mổ vô trùng 1 chiều trang bị hiện đại</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2 text-center">
              <div className="w-8 h-8 rounded-full bg-[#0c4b39] text-[#66FF33] font-bold text-xs flex items-center justify-center mx-auto">
                4
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Chăm Sóc Hậu Phẫu VIP</h4>
              <p className="text-[11px] text-slate-500">Chiếu tia Plasma lạnh giảm sưng & tái khám 0đ</p>
            </div>
          </div>
        </section>

        {/* SECTION 4: HOTLINE SUPPORT BANNER */}
        <div className="bg-gradient-to-r from-[#0c4b39] to-[#083327] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold">Cần bác sĩ thẩm mỹ gọi lại tư vấn riêng?</h3>
            <p className="text-white/70 text-xs">Đội ngũ chuyên gia thẩm mỹ NovaCare luôn sẵn sàng lắng nghe mong muốn của bạn.</p>
          </div>
          <a
            href="tel:19001234"
            className="px-6 py-3.5 bg-[#66FF33] hover:bg-[#5ae62e] text-[#0c4b39] font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            <PhoneCall className="h-4 w-4" /> Hotline Thẩm Mỹ 1900 1234
          </a>
        </div>

      </div>

      {/* QUICK BOOKING CONSULTATION MODAL */}
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
                    Đăng ký tư vấn thẩm mỹ VIP
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                    {bookingService.title}
                  </h3>
                  <p className="text-xs text-[#0c4b39] font-bold mt-1">Bác sĩ phụ trách: {bookingService.doctor}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Giá ưu đãi đặc biệt:</span>
                    <span className="font-bold text-[#0c4b39] text-base">{bookingService.price}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                    <span className="text-slate-500">Chính sách bảo hành:</span>
                    <span className="font-bold text-amber-800">{bookingService.warranty}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                      1. Chọn Ngày Khám & Tư Vấn
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
                      2. Chọn Khung Giờ Hẹn Gặp Bác Sĩ
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['09:00 - 10:00', '10:30 - 11:30', '14:00 - 15:00', '15:30 - 16:30', '17:00 - 18:00', '18:30 - 19:30'].map((slot, sIdx) => (
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

                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                      3. Ghi chú mong muốn làm đẹp (Không bắt buộc)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Muốn thu gọn cánh mũi, mong muốn nếp mí tự nhiên..."
                      value={patientNote}
                      onChange={(e) => setPatientNote(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                    />
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
                    Xác nhận đặt hẹn tư vấn
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-[#0c4b39] rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-10 w-10 text-[#0c4b39]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Đăng Ký Tư Vấn Thành Công!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  Mã Hẹn Tư Vấn Thẩm Mỹ VIP <strong className="text-[#0c4b39]">NC-BEAUTY-{Math.floor(100000 + Math.random() * 900000)}</strong> đã được ghi nhận. Trợ lý Bác sĩ sẽ gọi điện xác nhận trong 15 phút.
                </p>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-xs text-slate-800 space-y-1 text-left">
                  <p><strong>Dịch vụ:</strong> {bookingService.title}</p>
                  <p><strong>Bác sĩ tư vấn:</strong> {bookingService.doctor}</p>
                  <p><strong>Thời gian:</strong> {selectedSlot} - {selectedDate}</p>
                  <p><strong>Ưu đãi:</strong> Miễn phí 100% phí thăm khám & Mô phỏng 3D Crisalix</p>
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
