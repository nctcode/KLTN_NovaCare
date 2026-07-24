'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  UserCheck,
  Heart
} from 'lucide-react';

interface Center {
  name: string;
  address: string;
  phone: string;
  hours: string;
}

interface VaccineItem {
  id: string;
  category: 'tre-em' | 'mang-thai' | 'nguoi-lon' | 'goi-tron-goi';
  title: string;
  origin: string;
  diseaseTarget: string;
  recommendedAge: string;
  badge: string;
  originalPrice: string;
  price: string;
  status: 'Có sẵn' | 'Đặt trước';
  facilities: Center[];
  notes: string[];
}

const VACCINES: VaccineItem[] = [
  {
    id: 'gardasil-9',
    category: 'nguoi-lon',
    title: 'Vắc xin Gardasil 9 (Phòng 9 chủng Virus HPV gây ung thư cổ tử cung & mụn cóc sinh dục)',
    origin: 'Hãng MSD (Mỹ)',
    diseaseTarget: 'Ung thư cổ tử cung, ung thư hậu môn, mụn cóc sinh dục',
    recommendedAge: 'Nam & Nữ từ 9 đến 45 tuổi',
    badge: 'VẮC XIN THẾ HỆ MỚI',
    originalPrice: '3.150.000đ',
    price: '2.950.000đ/mũi',
    status: 'Có sẵn',
    facilities: [
      {
        name: 'Trung Tâm Tiêm Chủng VNVC NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 Hàng ngày'
      },
      {
        name: 'Trung Tâm Y Tế Dự Phòng NovaCare VIP',
        address: '45 Võ Thị Sáu, Quận 3, TP.HCM',
        phone: '028 3820 1234',
        hours: '07:30 - 20:00 Hàng ngày'
      }
    ],
    notes: [
      'Bảo quản chuẩn kho lạnh GSP 2-8°C tiêu chuẩn quốc tế.',
      'Khám phân loại sức khỏe miễn phí cùng Bác sĩ Chuyên khoa Nhi/Nhiễm trước tiêm.',
      'Theo dõi phản ứng sau tiêm 30 phút tại trung tâm với đầy đủ trang bị cấp cứu.'
    ]
  },
  {
    id: 'vaxigrip-tetra',
    category: 'nguoi-lon',
    title: 'Vắc xin Vaxigrip Tetra (Phòng 4 chủng Cúm Mùa Tứ Giá)',
    origin: 'Hãng Sanofi Pasteur (Pháp)',
    diseaseTarget: 'Cúm mùa (A/H1N1, A/H3N2, Cúm B/Yamagata, B/Victoria)',
    recommendedAge: 'Trẻ từ 6 tháng tuổi & Người lớn, người già',
    badge: 'KHUYÊN DÙNG HẰNG NĂM',
    originalPrice: '380.000đ',
    price: '340.000đ/mũi',
    status: 'Có sẵn',
    facilities: [
      {
        name: 'Trung Tâm Tiêm Chủng VNVC NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 Hàng ngày'
      },
      {
        name: 'Trung Tâm Tiêm Chủng Bệnh Viện Chợ Rẫy',
        address: '201B Nguyễn Chí Thanh, Quận 5, TP.HCM',
        phone: '028 3855 4137',
        hours: '07:00 - 16:30 (Thứ 2 - Thứ 6)'
      }
    ],
    notes: [
      'Tiêm nhắc lại 1 lần mỗi năm giúp giảm 80% nguy cơ biến chứng viêm phổi do cúm.',
      'Khám sàng lọc và tư vấn theo dõi sức khỏe miễn phí.'
    ]
  },
  {
    id: 'hexaxim-6-in-1',
    category: 'tre-em',
    title: 'Vắc xin 6 trong 1 Hexaxim (Phòng Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib)',
    origin: 'Hãng Sanofi Pasteur (Pháp)',
    diseaseTarget: '6 bệnh nguy hiểm đầu đời ở trẻ sơ sinh',
    recommendedAge: 'Trẻ từ 2 tháng đến 24 tháng tuổi',
    badge: 'MŨI TIÊM THỦY TỔ CHO BÉ',
    originalPrice: '1.080.000đ',
    price: '990.000đ/mũi',
    status: 'Có sẵn',
    facilities: [
      {
        name: 'Trung Tâm Tiêm Chủng VNVC NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 Hàng ngày'
      },
      {
        name: 'Bệnh Viện Nhi Đồng 1 - Khám Tiêm Chủng',
        address: '341 Sư Vạn Hạnh, Phường 10, Quận 10, TP.HCM',
        phone: '028 3927 1119',
        hours: '07:00 - 16:00 (Thứ 2 - Thứ 7)'
      }
    ],
    notes: [
      'Mũi tiêm gộp 6 bệnh giúp hạn chế tối đa số lần tiêm cho em bé.',
      'Sử dụng xi-ranh vô trùng đóng sẵn liều chuẩn vô trùng.'
    ]
  },
  {
    id: 'priorix-soi-quai-bi-rubella',
    category: 'mang-thai',
    title: 'Vắc xin MMR / Priorix (Phòng Sởi - Quai bị - Rubella)',
    origin: 'Hãng GSK (Bỉ)',
    diseaseTarget: 'Sởi, Quai bị, Rubella gây dị tật thai nhi',
    recommendedAge: 'Phụ nữ chuẩn bị mang thai trước 3 tháng & Trẻ em từ 9 tháng',
    badge: 'CẦN THIẾT KHI MANG THAI',
    originalPrice: '450.000đ',
    price: '390.000đ/mũi',
    status: 'Có sẵn',
    facilities: [
      {
        name: 'Trung Tâm Tiêm Chủng VNVC NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 Hàng ngày'
      },
      {
        name: 'Bệnh Viện Từ Dũ - Khoa Tiêm Chủng',
        address: '284 Cống Quỳnh, Quận 1, TP.HCM',
        phone: '028 5404 2829',
        hours: '07:00 - 16:30 (Thứ 2 - Thứ 6)'
      }
    ],
    notes: [
      'Phụ nữ cần hoàn thành mũi tiêm ít nhất 1-3 tháng trước khi có thai.',
      'Được lưu sổ tiêm chủng điện tử tự động nhắc lịch tiêm.'
    ]
  },
  {
    id: 'goi-tiem-so-sinh-0-12m',
    category: 'goi-tron-goi',
    title: 'Gói Tiêm Chủng Trọn Gói Cho Trẻ Từ 0 Đến 12 Tháng Tuổi (Gói Toàn Diện)',
    origin: 'Đa quốc gia (Mỹ, Pháp, Bỉ)',
    diseaseTarget: 'Toàn bộ vắc xin cần thiết trong năm đầu đời của bé (14 mũi)',
    recommendedAge: 'Dành cho trẻ sơ sinh mới sinh',
    badge: 'GIỮ VẮC XIN TRỌN GÓI',
    originalPrice: '14.500.000đ',
    price: '12.800.000đ/gói',
    status: 'Có sẵn',
    facilities: [
      {
        name: 'Trung Tâm Tiêm Chủng VNVC NovaCare Central',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
        phone: '1900 1234',
        hours: '07:00 - 17:00 Hàng ngày'
      }
    ],
    notes: [
      'Cam kết 100% không lo tăng giá vắc xin hay khan hiếm hàng.',
      'Miễn phí 100% dịch vụ tư vấn y khoa & lưu trữ sổ tiêm điện tử.'
    ]
  }
];

export default function VaccineBookingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineItem | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Center | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-26');
  const [selectedSlot, setSelectedSlot] = useState<string>('08:00 - 09:00');
  const [patientName, setPatientName] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  const categories = [
    { id: 'all', name: 'Tất cả vắc xin' },
    { id: 'tre-em', name: 'Vắc xin Trẻ em (0-24 tháng)' },
    { id: 'mang-thai', name: 'Phụ nữ Chuẩn bị Mang thai' },
    { id: 'nguoi-lon', name: 'Vắc xin Người lớn' },
    { id: 'goi-tron-goi', name: 'Gói Tiêm Chủng Trọn Gói' }
  ];

  const filteredVaccines = VACCINES.filter(vax => {
    const matchCat = selectedCategory === 'all' || vax.category === selectedCategory;
    const matchQuery = searchQuery.trim() === '' ||
      vax.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vax.diseaseTarget.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const handleOpenBooking = (vax: VaccineItem) => {
    setSelectedVaccine(vax);
    setSelectedFacility(vax.facilities[0] || null);
    setBookingSuccess(false);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#0c4b39] via-[#093c2d] to-[#083327] text-white py-16 relative overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/15 inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#66FF33]" /> Đặt Lịch Tiêm Chủng Vacxin An Toàn NovaCare
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Đặt Lịch Tiêm Chủng Vắc Xin Trẻ Em & Người Lớn Có Địa Điểm Tiêm Rõ Ràng
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Hệ thống kho lạnh GSP đạt chuẩn quốc tế. Khám sàng lọc miễn phí 100% trước tiêm cùng đội ngũ bác sĩ chuyên khoa.
          </p>
        </div>
      </section>

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">

        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Nhập vắc xin cần tìm: Gardasil 9, Cúm, 6 in 1 Hexaxim, Sởi..."
              className="pl-12 h-12 w-full bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-2xl text-xs font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0c4b39] text-[#66FF33] shadow-md scale-105'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Vaccine List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVaccines.map((vax) => (
            <Card
              key={vax.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 bg-[#0c4b39]/10 text-[#0c4b39] rounded-full border border-[#0c4b39]/15">
                    {vax.badge}
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                    {vax.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base md:text-lg group-hover:text-[#0c4b39] transition-colors leading-snug mb-1.5">
                    {vax.title}
                  </h3>
                  <p className="text-xs text-[#0c4b39] font-bold">Xuất xứ: {vax.origin} | Đối tượng: {vax.recommendedAge}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <p className="font-bold text-slate-900">🎯 Phòng ngừa bệnh lý:</p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{vax.diseaseTarget}</p>
                </div>

                {/* Facilities List Preview */}
                <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100 space-y-1.5">
                  <p className="text-[11px] font-extrabold text-[#0c4b39] flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5 text-[#0c4b39]" /> {vax.facilities.length} Trung Tâm Tiêm Chủng Tiếp Nhận:
                  </p>
                  <div className="space-y-1 pl-1 text-[11px] text-slate-700">
                    {vax.facilities.map((fac, fIdx) => (
                      <div key={fIdx} className="font-medium">• {fac.name} - <span className="text-slate-500">{fac.address}</span></div>
                    ))}
                  </div>
                </div>

                <ul className="space-y-1 text-xs text-slate-600">
                  {vax.notes.map((n, nIdx) => (
                    <li key={nIdx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[#0c4b39] shrink-0 mt-0.5" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 line-through mr-2">{vax.originalPrice}</span>
                  <span className="text-xl font-black text-[#0c4b39]">{vax.price}</span>
                </div>
                <Button
                  onClick={() => handleOpenBooking(vax)}
                  className="bg-[#0c4b39] hover:bg-[#083327] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-2xl shadow-sm transition flex items-center gap-1"
                >
                  <span>Chọn địa điểm & Giữ mũi</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

      </div>

      {/* BOOKING MODAL */}
      {selectedVaccine && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedVaccine(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            {!bookingSuccess ? (
              <>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
                    Đăng ký giữ vắc xin trực tuyến
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    {selectedVaccine.title}
                  </h3>
                  <p className="text-xs text-[#0c4b39] font-bold mt-1">Đơn giá: {selectedVaccine.price}</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-800 block">
                    1. Chọn Trung Tâm Tiêm Chủng Gần Bạn (Bắt buộc) *
                  </label>
                  <div className="space-y-2">
                    {selectedVaccine.facilities.map((fac, fIdx) => (
                      <div
                        key={fIdx}
                        onClick={() => setSelectedFacility(fac)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                          selectedFacility?.name === fac.name
                            ? 'bg-[#0c4b39]/5 border-[#0c4b39] ring-2 ring-[#0c4b39]/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Building2 className="h-5 w-5 text-[#0c4b39] shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs">{fac.name}</h4>
                          <p className="text-[11px] text-slate-500">{fac.address}</p>
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
                      2. Họ & Tên Người Tiêm / Em Bé
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên người tiêm..."
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block mb-1">Ngày Tiêm Dự Kiến</label>
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
                        <option value="08:00 - 09:00">08:00 - 09:00</option>
                        <option value="09:30 - 10:30">09:30 - 10:30</option>
                        <option value="14:00 - 15:00">14:00 - 15:00</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setSelectedVaccine(null)} className="rounded-xl text-xs font-bold">
                    Hủy bỏ
                  </Button>
                  <Button
                    onClick={() => setBookingSuccess(true)}
                    className="bg-[#0c4b39] hover:bg-[#083327] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
                  >
                    Xác nhận giữ vắc xin
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-[#0c4b39] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-[#0c4b39]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Giữ Mũi Vắc Xin Thành Công!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  Mã Phiếu Tiêm Chủng <strong className="text-[#0c4b39]">NC-VAX-{Math.floor(100000 + Math.random() * 900000)}</strong> đã được giữ mũi tại hệ thống kho lạnh trung tâm.
                </p>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-xs text-slate-800 space-y-1.5 text-left">
                  <p><strong>Loại vắc xin:</strong> {selectedVaccine.title}</p>
                  <p><strong>Trung tâm tiêm:</strong> {selectedFacility?.name}</p>
                  <p><strong>Địa chỉ:</strong> {selectedFacility?.address}</p>
                  <p><strong>Thời gian hẹn:</strong> {selectedSlot} - {selectedDate}</p>
                </div>

                <Button onClick={() => setSelectedVaccine(null)} className="w-full bg-[#0c4b39] text-white font-bold text-xs py-3 rounded-xl">
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
