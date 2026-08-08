'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { hospitalService } from '@/services/hospital.service';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  MapPin,
  Globe,
  Mail,
  Star,
  Loader2,
  HeartPulse,
  Building2,
  Building,
  Stethoscope,
  Activity,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

const HOSPITAL_TYPES = [
  { id: 'all', name: 'Tất cả cơ sở', icon: HeartPulse },
  { id: 'benh-vien-cong', name: 'Bệnh viện Công', icon: Building2 },
  { id: 'benh-vien-tu', name: 'Bệnh viện Tư nhân', icon: Building },
  { id: 'phong-kham', name: 'Phòng khám Chuyên khoa', icon: Stethoscope },
  { id: 'xet-nghiem', name: 'Trung tâm Xét nghiệm & CĐHA', icon: Activity },
];

function HospitalsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get('type') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(typeParam);

  useEffect(() => {
    if (typeParam) {
      setSelectedType(typeParam);
    }
  }, [typeParam]);

  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ['hospitals-list'],
    queryFn: hospitalService.getAll,
  });

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    if (typeId === 'all') {
      router.push('/co-so-y-te');
    } else {
      router.push(`/co-so-y-te?type=${typeId}`);
    }
  };

  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesSearch =
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedType === 'benh-vien-cong') {
      return hospital.name.toLowerCase().includes('công') || hospital.name.toLowerCase().includes('trung ương');
    }
    if (selectedType === 'benh-vien-tu') {
      return !hospital.name.toLowerCase().includes('công') && (hospital.name.toLowerCase().includes('bệnh viện') || hospital.name.toLowerCase().includes('quốc tế'));
    }
    if (selectedType === 'phong-kham') {
      return hospital.name.toLowerCase().includes('phòng khám');
    }
    if (selectedType === 'xet-nghiem') {
      return hospital.name.toLowerCase().includes('xét nghiệm') || hospital.name.toLowerCase().includes('chẩn đoán');
    }

    return true;
  });

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.1),transparent_60%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-3.5 py-1 rounded-full border border-white/10 inline-block mb-3">
            Hệ thống đối tác y tế uy tín
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Cơ Sở Y Tế Liên Kết NovaCare
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Đặt khám nhanh chóng tại các bệnh viện tuyến đầu, bệnh viện quốc tế và phòng khám chất lượng cao trên toàn quốc.
          </p>
        </div>
      </section>

      <div className="container-custom mt-8 space-y-8">
        {/* Search & Category Tabs */}
        <div className="space-y-6">
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm bệnh viện, phòng khám, địa chỉ..."
              className="pl-12 h-12 w-full bg-white border-slate-200 focus-visible:ring-[#0c4b39] rounded-xl shadow-xs text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {HOSPITAL_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-[#0c4b39] text-white shadow-md scale-105'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-[#66FF33]' : 'text-slate-400'}`} />
                  <span>{type.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl p-8 max-w-md mx-auto space-y-4 shadow-xs">
            <HeartPulse className="h-16 w-16 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Không tìm thấy cơ sở y tế phù hợp</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Thử tìm kiếm theo từ khóa khác hoặc chuyển sang danh mục loại hình khác.
            </p>
            <button
              onClick={() => handleTypeChange('all')}
              className="px-4 py-2 bg-[#0c4b39] text-white text-xs font-bold rounded-lg hover:bg-[#083327] transition"
            >
              Xem tất cả cơ sở y tế
            </button>
          </div>
        ) : (
          /* Grid list of hospitals */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((hospital) => {
              const hospitalImages: Record<string, string> = {
                'Bệnh viện Đa khoa NovaCare': 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=400',
                'Bệnh viện Chuyên khoa Sài Gòn': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400',
              };
              const image = hospitalImages[hospital.name] || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=400';

              return (
                <Card key={hospital.id} className="hover:shadow-xl transition-all duration-300 border border-slate-200/70 overflow-hidden flex flex-col h-full bg-white rounded-2xl group">
                  {/* Hospital Image */}
                  <div className="h-48 w-full relative overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                      src={image}
                      alt={hospital.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-slate-800 flex items-center gap-1 shadow-xs">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      <span>{hospital.rating || 4.9}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-[#0c4b39]/90 text-white backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-[#66FF33]" />
                      <span>Đặt khám ưu tiên</span>
                    </div>
                  </div>

                  {/* Hospital Content */}
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-[#0c4b39] transition-colors">
                        <Link href={`/co-so-y-te/${hospital.id}`}>{hospital.name}</Link>
                      </h3>
                      <p className="text-[11px] text-[#0c4b39] font-bold bg-[#0c4b39]/8 inline-block px-2.5 py-0.5 rounded-full border border-[#0c4b39]/15">
                        Đối tác chính thức NovaCare
                      </p>

                      <div className="space-y-2 pt-2 text-xs text-slate-600 border-t border-slate-100">
                        {/* Address */}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{hospital.address}</span>
                        </div>
                        {/* Website */}
                        {hospital.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                            <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#0c4b39] font-medium truncate">
                              {hospital.website}
                            </a>
                          </div>
                        )}
                        {/* Email */}
                        {hospital.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">{hospital.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                      <Link
                        href={`/co-so-y-te/${hospital.id}`}
                        className="flex-1 text-center py-2.5 px-3 border border-[#0c4b39]/30 hover:border-[#0c4b39] hover:bg-[#0c4b39]/5 text-[#0c4b39] font-bold rounded-xl text-xs transition"
                      >
                        Chi tiết
                      </Link>
                      <Link
                        href={`/dat-kham-co-so?hospitalId=${hospital.id}`}
                        className="flex-1 text-center py-2.5 px-3 bg-[#0c4b39] hover:bg-[#083327] active:bg-[#06241c] text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
                      >
                        Đặt lịch ngay
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HospitalsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20 min-h-screen bg-[#F8F9FA]">
        <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
      </div>
    }>
      <HospitalsPageContent />
    </Suspense>
  );
}
