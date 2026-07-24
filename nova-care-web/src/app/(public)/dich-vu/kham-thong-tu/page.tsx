'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
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
  UserCheck,
  Car,
  Briefcase,
  GraduationCap,
  Globe
} from 'lucide-react';

interface Facility {
  name: string;
  address: string;
  phone: string;
  hours: string;
  portalSync: boolean; // Tự động liên thông Dịch vụ công Quốc gia
}

interface CircularExamItem {
  id: string;
  category: 'lai-xe' | 'xin-viec' | 'du-hoc' | 'work-permit';
  title: string;
  regulationCode: string;
  badge: string;
  originalPrice: string;
  price: string;
  turnaroundTime: string;
  facilities: Facility[];
  itemsIncluded: string[];
}

const EXAM_ITEMS: CircularExamItem[] = [
  {
    id: 'kham-lai-xe-gplx',
    category: 'lai-xe',
    title: 'Khám Sức Khỏe Lái Xe Ô Tô (B1, B2, C, D, E) & Mô Tô (A1, A2)',
    regulationCode: 'Thông tư liên tịch 24/2015/TTLT-BYT-BGTVT',
    badge: 'LIÊN THÔNG CỔNG DỊCH VỤ CÔNG QUỐC GIA',
    originalPrice: '450.000đ',
    price: '350.000đ',
    turnaroundTime: 'Nhận giấy sau 30 - 45 phút',
    facilities: [
      {
        name: 'Bệnh viện Đa Khoa NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 (Thứ 2 - Chủ Nhật)',
        portalSync: true
      },
      {
        name: 'Bệnh viện Giao Thông Vận Tải TP.HCM',
        address: '136 Nguyễn Thông, Phường 9, Quận 3, TP.HCM',
        phone: '028 3931 7192',
        hours: '07:30 - 16:30 (Thứ 2 - Thứ 6)',
        portalSync: true
      },
      {
        name: 'Phòng Khám Đa Khoa Phước Anh',
        address: '224 Nguyễn Trãi, Phường 3, Quận 5, TP.HCM',
        phone: '028 3838 1234',
        hours: '07:00 - 17:30 Hàng ngày',
        portalSync: true
      }
    ],
    itemsIncluded: [
      'Tự động truyền dữ liệu Giấy khám điện tử lên Cổng Dịch vụ công Quốc gia để đổi GPLX Online.',
      'Xét nghiệm 4 chất gây nghiện trong nước tiểu (Morphin, Amphetamin, Methamphetamin, THC).',
      'Đo nồng độ cồn trong máu/hơi thở & Đo thị lực, sắc giác tiêu chuẩn lái xe.',
      'Khám các chuyên khoa: Tâm thần, Thần kinh, Mắt, Tai Mũi Họng, Cơ xương khớp.'
    ]
  },
  {
    id: 'kham-xin-viec-tt32',
    category: 'xin-viec',
    title: 'Khám Sức Khỏe Xin Việc & Học Tập Theo Thông Tư 32/2023/TT-BYT',
    regulationCode: 'Thông tư 32/2023/TT-BYT (Thay thế TT 14/2013)',
    badge: 'MẪU GIẤY CHUẨN BỘ Y TẾ',
    originalPrice: '350.000đ',
    price: '250.000đ',
    turnaroundTime: 'Nhận kết quả trong 45 phút',
    facilities: [
      {
        name: 'Bệnh viện Đa Khoa NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 Hàng ngày',
        portalSync: false
      },
      {
        name: 'Phòng Khám Đa Khoa Quốc Tế NovaCare VIP',
        address: '45 Võ Thị Sáu, Quận 3, TP.HCM',
        phone: '028 3820 1234',
        hours: '07:30 - 20:00 Hàng ngày',
        portalSync: false
      }
    ],
    itemsIncluded: [
      'Khám thể lực (Chiều cao, cân nặng, huyết áp, mạch).',
      'Khám chuyên khoa: Nội khoa, Ngoại khoa, Mắt, Tai Mũi Họng, Răng Hàm Mặt, Da liễu.',
      'Chụp X-quang tim phổi thẳng kỹ thuật số DR.',
      'Xét nghiệm công thức máu & nước tiểu toàn phần (Nếu có yêu cầu của cơ quan).'
    ]
  },
  {
    id: 'kham-du-hoc-xkld',
    category: 'du-hoc',
    title: 'Khám Sức Khỏe Đi Du Học, Học Tập & Xuất Khẩu Lao Động (XKLD)',
    regulationCode: 'Tiêu chuẩn Hồ sơ Lãnh sự & Đại sứ quán',
    badge: 'CHUẨN HỒ SƠ QUỐC TẾ',
    originalPrice: '1.200.000đ',
    price: '890.000đ',
    turnaroundTime: 'Trả kết quả trong ngày',
    facilities: [
      {
        name: 'Bệnh viện Đa Khoa NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 Hàng ngày',
        portalSync: false
      },
      {
        name: 'Bệnh viện Chợ Rẫy - Khám Xuất Cảnh',
        address: '201B Nguyễn Chí Thanh, Quận 5, TP.HCM',
        phone: '028 3855 4137',
        hours: '07:00 - 16:00 (Thứ 2 - Thứ 6)',
        portalSync: false
      }
    ],
    itemsIncluded: [
      'Xét nghiệm Lao phổi (Quantiferon TB / X-quang), Giang mai, HIV, Viêm gan B, C.',
      'Kiểm tra thị lực màu & Thần kinh tâm thần.',
      'Bác sĩ ký xác nhận bản Tiếng Anh / Tiếng Song ngữ theo form Đại sứ quán.'
    ]
  },
  {
    id: 'kham-work-permit-nguoi-nuoc-ngoai',
    category: 'work-permit',
    title: 'Khám Sức Khỏe Cho Người Nước Ngoài Làm Việc Tại VN (Work Permit)',
    regulationCode: 'Thông tư 14/2013/TT-BYT dành cho người nước ngoài',
    badge: 'BỆNH VIỆN ĐỦ ĐIỀU KIỆN WORK PERMIT',
    originalPrice: '2.500.000đ',
    price: '1.950.000đ',
    turnaroundTime: 'Trả kết quả sau 2 - 3 giờ',
    facilities: [
      {
        name: 'Bệnh viện Đa Khoa NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 Hàng ngày',
        portalSync: false
      },
      {
        name: 'Bệnh viện Đại Học Y Dược TP.HCM',
        address: '215 Hồng Bàng, Quận 5, TP.HCM',
        phone: '028 3855 4269',
        hours: '06:30 - 16:30 (Thứ 2 - Thứ 7)',
        portalSync: false
      }
    ],
    itemsIncluded: [
      'Khám toàn diện danh mục 18 hạng mục y tế cho lao động nước ngoài.',
      'Xét nghiệm Ký sinh trùng, Công thức máu, Men gan, Chức năng thận, HIV, Giang mai.',
      'Chụp X-quang phổi DR & Siêu âm bụng 4D.',
      'Hỗ trợ phiên dịch Tiếng Anh / Tiếng Trung / Tiếng Hàn trong suốt buổi khám.'
    ]
  }
];

export default function CircularExamPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<CircularExamItem | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-26');
  const [selectedSlot, setSelectedSlot] = useState<string>('08:00 - 09:00');
  const [patientName, setPatientName] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  const categories = [
    { id: 'all', name: 'Tất cả dịch vụ thông tư', icon: FileText },
    { id: 'lai-xe', name: 'Khám Sức Khỏe Lái Xe (GPLX)', icon: Car },
    { id: 'xin-viec', name: 'Khám Xin Việc (TT 32)', icon: Briefcase },
    { id: 'du-hoc', name: 'Khám Du Học & XKLD', icon: GraduationCap },
    { id: 'work-permit', name: 'Khám Người Nước Ngoài (Work Permit)', icon: Globe }
  ];

  const filteredExams = EXAM_ITEMS.filter(item => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchQuery = searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.regulationCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const handleOpenBooking = (item: CircularExamItem) => {
    setSelectedExam(item);
    setSelectedFacility(item.facilities[0] || null);
    setBookingSuccess(false);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#0c4b39] via-[#093c2d] to-[#083327] text-white py-16 relative overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/15 inline-flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-[#66FF33]" /> Khám Sức Khỏe Thông Tư & Cấp Giấy Chứng Nhận Y Tế Hợp Pháp
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Khám Sức Khỏe Lái Xe (Đổi GPLX Online), Xin Việc & Work Permit
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Hệ thống Bệnh viện được Bộ Y Tế & Sở GTVT cấp phép. Tự động truyền dữ liệu khám lái xe lên Cổng Dịch vụ công Quốc gia nhanh chóng trong 30 phút.
          </p>
        </div>
      </section>

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">

        {/* Category Filter Chips Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Nhập loại khám: Khám lái xe B2, Khám xin việc TT 32, Work permit..."
              className="pl-12 h-12 w-full bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-2xl text-xs font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0c4b39] text-[#66FF33] shadow-md scale-105'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-[#66FF33]' : 'text-[#0c4b39]'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exams List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredExams.map((item) => (
            <Card
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 bg-[#0c4b39]/10 text-[#0c4b39] rounded-full border border-[#0c4b39]/15">
                    {item.badge}
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-md shrink-0">
                    ⏱️ {item.turnaroundTime}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base md:text-lg group-hover:text-[#0c4b39] transition-colors leading-snug mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#0c4b39] font-bold bg-[#0c4b39]/5 px-3 py-1 rounded-xl border border-[#0c4b39]/10 inline-block">
                    📜 Căn cứ pháp lý: {item.regulationCode}
                  </p>
                </div>

                {/* Facilities Authorized List */}
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100 space-y-1.5">
                  <p className="text-[11px] font-extrabold text-[#0c4b39] flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5 text-[#0c4b39]" /> {item.facilities.length} Cơ Sở Y Tế Đủ Điều Kiện Cấp Giấy Khám:
                  </p>
                  <div className="space-y-1 pl-1 text-[11px] text-slate-700">
                    {item.facilities.map((fac, fIdx) => (
                      <div key={fIdx} className="font-medium flex items-center justify-between">
                        <span>• {fac.name}</span>
                        {fac.portalSync && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#66FF33]/20 text-[#0c4b39] rounded">
                            Liên thông Dịch vụ công
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Nội dung quy trình khám:</span>
                  {item.itemsIncluded.map((inc, iIdx) => (
                    <div key={iIdx} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="h-3.5 w-3.5 text-[#0c4b39] shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 line-through mr-2">{item.originalPrice}</span>
                  <span className="text-xl font-black text-[#0c4b39]">{item.price}</span>
                </div>
                <Button
                  onClick={() => handleOpenBooking(item)}
                  className="bg-[#0c4b39] hover:bg-[#083327] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-2xl shadow-sm transition flex items-center gap-1"
                >
                  <span>Chọn cơ sở & Đặt khám</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

      </div>

      {/* BOOKING MODAL */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedExam(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            {!bookingSuccess ? (
              <>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
                    Đăng ký khám sức khỏe thông tư
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    {selectedExam.title}
                  </h3>
                  <p className="text-xs text-[#0c4b39] font-bold mt-1">Lệ phí niêm yết: {selectedExam.price}</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-800 block">
                    1. Chọn Bệnh Viện / Phòng Khám Cấp Giấy (Bắt buộc) *
                  </label>
                  <div className="space-y-2">
                    {selectedExam.facilities.map((fac, fIdx) => (
                      <div
                        key={fIdx}
                        onClick={() => setSelectedFacility(fac)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                          selectedFacility?.name === fac.name
                            ? 'bg-[#0c4b39]/5 border-[#0c4b39] ring-2 ring-[#0c4b39]/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Building2 className="h-5 w-5 text-[#0c4b39] shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs">{fac.name}</h4>
                          <p className="text-[11px] text-slate-500">{fac.address}</p>
                          {fac.portalSync && (
                            <p className="text-[10px] text-emerald-700 font-extrabold mt-0.5">
                              ✓ Có liên thông Cổng Dịch vụ công Quốc gia (đổi bằng lái online)
                            </p>
                          )}
                        </div>
                        {selectedFacility?.name === fac.name && (
                          <CheckCircle2 className="h-5 w-5 text-[#0c4b39] shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1">
                      2. Họ & Tên Người Khám (Theo CCCD / Hộ Chiếu)
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập họ tên người đi khám..."
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block mb-1">Ngày Đến Khám</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block mb-1">Khung Giờ Hẹn</label>
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="08:00 - 09:00">08:00 - 09:00 (Nhận giấy trước 10h)</option>
                        <option value="09:30 - 10:30">09:30 - 10:30</option>
                        <option value="14:00 - 15:00">14:00 - 15:00 (Chiều)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setSelectedExam(null)} className="rounded-xl text-xs font-bold">
                    Hủy bỏ
                  </Button>
                  <Button
                    onClick={() => setBookingSuccess(true)}
                    className="bg-[#0c4b39] hover:bg-[#083327] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
                  >
                    Xác nhận đặt lịch khám
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-[#0c4b39] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-[#0c4b39]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Đặt Lịch Khám Thành Công!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  Mã Giấy Khám Thông Tư <strong className="text-[#0c4b39]">NC-DOC-{Math.floor(100000 + Math.random() * 900000)}</strong> đã được cấp. Khi đi khám vui lòng mang theo 02 ảnh 4x6 nền trắng & CCCD gốc.
                </p>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-xs text-slate-800 space-y-1.5 text-left">
                  <p><strong>Loại khám:</strong> {selectedExam.title}</p>
                  <p><strong>Cơ sở y tế:</strong> {selectedFacility?.name}</p>
                  <p><strong>Địa chỉ:</strong> {selectedFacility?.address}</p>
                  <p><strong>Thời gian hẹn:</strong> {selectedSlot} - {selectedDate}</p>
                </div>

                <Button onClick={() => setSelectedExam(null)} className="w-full bg-[#0c4b39] text-white font-bold text-xs py-3 rounded-xl">
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
