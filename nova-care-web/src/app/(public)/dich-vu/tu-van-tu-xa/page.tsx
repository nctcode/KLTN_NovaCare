'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Video,
  Search,
  ShieldCheck,
  Clock,
  FileText,
  CheckCircle2,
  UserCheck,
  Smartphone,
  Star,
  Calendar,
  Sparkles,
  Zap,
  MessageSquare,
  ChevronRight,
  X,
  Stethoscope,
  Building,
  Upload,
  Check,
  Shield
} from 'lucide-react';

interface TeleDoctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  specialtyId: string;
  hospital: string;
  rating: number;
  consultationsCount: number;
  price: string;
  originalPrice: string;
  avatar: string;
  nextSlot: string;
  experience: string;
  bio: string;
}

const TELE_DOCTORS: TeleDoctor[] = [
  {
    id: 'doc-tele-1',
    name: 'ThS.BS Nguyễn Văn An',
    title: 'Thạc sĩ, Bác sĩ CKII',
    specialty: 'Nội Khoa & Bệnh Mạn Tính',
    specialtyId: 'noi-khoa',
    hospital: 'Bệnh viện Đa Khoa NovaCare Central',
    rating: 4.9,
    consultationsCount: 1420,
    price: '150.000đ',
    originalPrice: '250.000đ',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    nextSlot: '⚡ Có thể gọi ngay trong 15 phút',
    experience: '15 năm kinh nghiệm',
    bio: 'Chuyên tư vấn theo dõi tiểu đường, cao huyết áp, đọc kết quả xét nghiệm máu và tư vấn đơn thuốc mạn tính.'
  },
  {
    id: 'doc-tele-2',
    name: 'TS.BS Trần Thị Mai',
    title: 'Tiến sĩ Bác sĩ',
    specialty: 'Nhi Khoa',
    specialtyId: 'nhi-khoa',
    hospital: 'Bệnh viện Nhi Đồng 1',
    rating: 5.0,
    consultationsCount: 2150,
    price: '180.000đ',
    originalPrice: '300.000đ',
    avatar: 'https://images.unsplash.com/photo-1594824813566-81858a78c930?auto=format&fit=crop&q=80&w=300',
    nextSlot: 'Hôm nay: 18:30 - 19:30',
    experience: '18 năm kinh nghiệm',
    bio: 'Chuyên tư vấn các bệnh lý sốt, ho, tiêu chảy, dị ứng sữa, rối loạn tiêu hóa và dinh dưỡng ở trẻ em từ 0-12 tuổi.'
  },
  {
    id: 'doc-tele-3',
    name: 'BS.CKII Lê Hoàng Nam',
    title: 'Bác sĩ CKII',
    specialty: 'Da Liễu & Thẩm Mỹ Y Khoa',
    specialtyId: 'da-lieu',
    hospital: 'Bệnh viện Da Liễu TP.HCM',
    rating: 4.9,
    consultationsCount: 1890,
    price: '200.000đ',
    originalPrice: '350.000đ',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    nextSlot: '⚡ Có thể gọi ngay trong 20 phút',
    experience: '12 năm kinh nghiệm',
    bio: 'Tư vấn điều trị mụn trứng cá, mẩn ngứa, dị ứng da, chàm viêm da cơ địa và phác đồ chăm sóc da chuẩn y khoa.'
  },
  {
    id: 'doc-tele-4',
    name: 'ThS.BS Phạm Thị Thu',
    title: 'Thạc sĩ Bác sĩ',
    specialty: 'Sản Phụ Khoa & Thai Kỳ',
    specialtyId: 'san-phu-khoa',
    hospital: 'Bệnh viện Từ Dũ',
    rating: 4.8,
    consultationsCount: 980,
    price: '160.000đ',
    originalPrice: '280.000đ',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    nextSlot: 'Hôm nay: 19:00 - 20:00',
    experience: '14 năm kinh nghiệm',
    bio: 'Tư vấn sức khỏe thai kỳ, dinh dưỡng mẹ bầu, theo dõi chỉ số siêu âm thai và các vấn đề phụ khoa nhạy cảm.'
  },
  {
    id: 'doc-tele-5',
    name: 'TS.BS Ngô Minh Tuấn',
    title: 'Tiến sĩ Bác sĩ',
    specialty: 'Tâm Lý & Sức Khỏe Tinh Thần',
    specialtyId: 'tam-ly',
    hospital: 'Trung tâm Tư vấn Tâm lý NovaCare',
    rating: 5.0,
    consultationsCount: 1120,
    price: '250.000đ',
    originalPrice: '400.000đ',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    nextSlot: '⚡ Có thể gọi ngay trong 30 phút',
    experience: '16 năm kinh nghiệm',
    bio: 'Tham vấn trị liệu tâm lý cho người bị rối loạn lo âu, trầm cảm, mất ngủ kéo dài, căng thẳng công việc và học đường.'
  },
  {
    id: 'doc-tele-6',
    name: 'BS.CKI Võ Thành Trung',
    title: 'Bác sĩ CKI',
    specialty: 'Tai Mũi Họng & Hô Hấp',
    specialtyId: 'tai-mui-hong',
    hospital: 'Bệnh viện Tai Mũi Họng TP.HCM',
    rating: 4.9,
    consultationsCount: 1650,
    price: '150.000đ',
    originalPrice: '250.000đ',
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300',
    nextSlot: 'Hôm nay: 20:00 - 21:00',
    experience: '10 năm kinh nghiệm',
    bio: 'Tư vấn các bệnh lý viêm xoang, viêm họng hạt, khàn tiếng, ù tai và hướng dẫn chăm sóc đường hô hấp khi thời tiết thay đổi.'
  }
];

export default function TelehealthPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<TeleDoctor | null>(null);
  const [consultType, setConsultType] = useState<'video' | 'chat'>('video');
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-26');
  const [selectedSlot, setSelectedSlot] = useState<string>('19:00 - 19:30');
  const [patientNote, setPatientNote] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  const specialties = [
    { id: 'all', name: 'Tất cả chuyên khoa' },
    { id: 'noi-khoa', name: 'Nội Khoa & Bệnh Mạn Tính' },
    { id: 'nhi-khoa', name: 'Nhi Khoa' },
    { id: 'da-lieu', name: 'Da Liễu & Thẩm Mỹ' },
    { id: 'san-phu-khoa', name: 'Sản Phụ Khoa' },
    { id: 'tam-ly', name: 'Tâm Lý & Tinh Thần' },
    { id: 'tai-mui-hong', name: 'Tai Mũi Họng' }
  ];

  const filteredDoctors = TELE_DOCTORS.filter(doc => {
    const matchSpec = selectedSpecialty === 'all' || doc.specialtyId === selectedSpecialty;
    const matchQuery = searchQuery.trim() === '' ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.bio.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSpec && matchQuery;
  });

  const handleOpenBooking = (doc: TeleDoctor) => {
    setSelectedDoctor(doc);
    setBookingSuccess(false);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#0c4b39] via-[#093c2d] to-[#083327] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(102,255,51,0.15),transparent_60%)]"></div>
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-4 py-1.5 rounded-full border border-white/15 inline-flex items-center gap-1.5">
            <Video className="h-4 w-4 text-[#66FF33] animate-pulse" /> Đặt Khám Trực Tuyến Telehealth 1-1 HD Sắc Nét
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Tư Vấn Y Tế Từ Xa Với Bác Sĩ Chuyên Khoa Hàng Đầu
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Kết nối Video Call 1-1 riêng tư ngay tại nhà. Nhận đơn thuốc điện tử hợp pháp và phác đồ điều trị được lưu tự động trong Hồ sơ Bệnh nhân.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/90 font-bold pt-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#66FF33]" />
              <span>100% Bác sĩ CCHN Bệnh viện lớn</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#66FF33]" />
              <span>Đơn thuốc điện tử qua App / SMS</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#66FF33]" />
              <span>Khung giờ linh hoạt 07:00 - 22:00</span>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">

        {/* 4 Steps Telehealth Process */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-[#0c4b39] bg-[#0c4b39]/10 px-3 py-1 rounded-full">
              Quy trình đơn giản
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">4 Bước Đặt Lịch & Khám Trực Tuyến Từ Xa</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0c4b39] text-[#66FF33] font-black text-lg flex items-center justify-center shadow-sm">1</div>
              <h4 className="font-bold text-slate-900 text-sm">Chọn Bác Sĩ & Giờ Gọi</h4>
              <p className="text-slate-500 text-xs">Lựa chọn chuyên khoa, bác sĩ và khung giờ tiện lợi nhất.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0c4b39] text-[#66FF33] font-black text-lg flex items-center justify-center shadow-sm">2</div>
              <h4 className="font-bold text-slate-900 text-sm">Điền Triệu Chứng</h4>
              <p className="text-slate-500 text-xs">Mô tả triệu chứng bệnh hoặc đính kèm ảnh xét nghiệm nếu có.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0c4b39] text-[#66FF33] font-black text-lg flex items-center justify-center shadow-sm">3</div>
              <h4 className="font-bold text-slate-900 text-sm">Video Call 1-1 HD</h4>
              <p className="text-slate-500 text-xs">Truy cập Link phòng khám riêng tư, nói chuyện trực tiếp với Bác sĩ.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0c4b39] text-[#66FF33] font-black text-lg flex items-center justify-center shadow-sm">4</div>
              <h4 className="font-bold text-slate-900 text-sm">Nhận Đơn Thuốc Ele</h4>
              <p className="text-slate-500 text-xs">Bác sĩ gửi đơn thuốc điện tử và dặn dò lưu tự động vào Hồ sơ.</p>
            </div>
          </div>
        </div>

        {/* Search & Specialty Filter */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm bác sĩ tư vấn: ThS.BS Nguyễn Văn An, Nhi khoa, Da liễu, Tiểu đường..."
              className="pl-12 h-12 w-full bg-slate-50 border-slate-200 focus-visible:ring-[#0c4b39] rounded-2xl text-xs font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {specialties.map((spec) => (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSpecialty === spec.id
                    ? 'bg-[#0c4b39] text-[#66FF33] shadow-md scale-105'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {spec.name}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <Card
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-xs">
                    <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      {doc.specialty}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#0c4b39] transition-colors truncate">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate">{doc.title}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <Building className="h-3 w-3 shrink-0 text-slate-400" /> {doc.hospital}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{doc.rating}</span>
                    <span className="text-slate-400 font-normal">({doc.consultationsCount} cuộc gọi)</span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-semibold">{doc.experience}</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {doc.bio}
                </p>

                <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100 text-[11px] text-[#0c4b39] font-bold flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#0c4b39] fill-[#0c4b39] shrink-0" />
                  <span>{doc.nextSlot}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 line-through block">{doc.originalPrice}</span>
                  <span className="text-lg font-black text-[#0c4b39]">{doc.price} <span className="text-[10px] font-normal text-slate-500">/ 15 phút</span></span>
                </div>

                <Button
                  onClick={() => handleOpenBooking(doc)}
                  className="bg-[#0c4b39] hover:bg-[#083327] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer"
                >
                  <Video className="h-4 w-4 text-[#66FF33]" />
                  <span>Đặt khám</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>

      </div>

      {/* TELEHEALTH BOOKING MODAL */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {!bookingSuccess ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c4b39] bg-[#0c4b39]/10 px-2.5 py-0.5 rounded-full">
                      Tư vấn trực tuyến 1-1
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">{selectedDoctor.name}</h3>
                    <p className="text-xs text-slate-500">{selectedDoctor.specialty} | Phí: <strong className="text-[#0c4b39]">{selectedDoctor.price}</strong></p>
                  </div>
                </div>

                {/* Form Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                      1. Hình thức tư vấn
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setConsultType('video')}
                        className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition cursor-pointer ${
                          consultType === 'video'
                            ? 'bg-[#0c4b39]/5 border-[#0c4b39] text-[#0c4b39] ring-2 ring-[#0c4b39]/20'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Video className="h-4 w-4 text-[#0c4b39]" />
                        <span>Video Call 1-1 HD</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConsultType('chat')}
                        className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition cursor-pointer ${
                          consultType === 'chat'
                            ? 'bg-[#0c4b39]/5 border-[#0c4b39] text-[#0c4b39] ring-2 ring-[#0c4b39]/20'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <MessageSquare className="h-4 w-4 text-[#0c4b39]" />
                        <span>Chat Tin Nhắn Y Tế</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block mb-1">2. Chọn Ngày Tư Vấn</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block mb-1">3. Khung Giờ Hẹn</label>
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                      >
                        <option value="18:30 - 19:00">18:30 - 19:00</option>
                        <option value="19:00 - 19:30">19:00 - 19:30</option>
                        <option value="20:00 - 20:30">20:00 - 20:30</option>
                        <option value="21:00 - 21:30">21:00 - 21:30</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1">
                      4. Mô Tả Triệu Chứng Hoặc Câu Hỏi Cho Bác Sĩ
                    </label>
                    <textarea
                      rows={3}
                      placeholder="VD: Bé bị sốt 38.5 độ từ đêm qua kèm ho khan, chưa dùng thuốc gì..."
                      value={patientNote}
                      onChange={(e) => setPatientNote(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setSelectedDoctor(null)} className="rounded-xl text-xs font-bold cursor-pointer">
                    Hủy bỏ
                  </Button>
                  <Button
                    onClick={() => setBookingSuccess(true)}
                    className="bg-[#0c4b39] hover:bg-[#083327] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Video className="h-4 w-4 text-[#66FF33]" />
                    <span>Xác nhận & Nhận Mã Phòng Call</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-[#0c4b39] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-[#0c4b39]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Đặt Lịch Tư Vấn Thành Công!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  Mã Phòng Khám Trực Tuyến <strong className="text-[#0c4b39]">NC-TELE-{Math.floor(100000 + Math.random() * 900000)}</strong> đã được khởi tạo. Đường link tham gia phòng gọi đã gửi qua SMS.
                </p>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-xs text-slate-800 space-y-1.5 text-left">
                  <p><strong>Bác sĩ tư vấn:</strong> {selectedDoctor.name}</p>
                  <p><strong>Chuyên khoa:</strong> {selectedDoctor.specialty}</p>
                  <p><strong>Hình thức:</strong> {consultType === 'video' ? 'Video Call 1-1 HD' : 'Chat Tin Nhắn Y Tế'}</p>
                  <p><strong>Thời gian hẹn:</strong> {selectedSlot} - {selectedDate}</p>
                  <p className="text-[#0c4b39] font-bold">✓ Vui lòng bật Micro & Camera trước giờ hẹn 5 phút.</p>
                </div>

                <Button onClick={() => setSelectedDoctor(null)} className="w-full bg-[#0c4b39] text-white font-bold text-xs py-3 rounded-xl cursor-pointer">
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
