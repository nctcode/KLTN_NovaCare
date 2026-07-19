'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospital.service';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Globe, Mail, Star, Loader2, HeartPulse } from 'lucide-react';
import Link from 'next/link';

export default function HospitalsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ['hospitals-list'],
    queryFn: hospitalService.getAll,
  });

  const filteredHospitals = hospitals.filter((hospital) =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.05),transparent_50%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
            Cơ Sở Y Tế Liên Kết
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base">
            Tìm kiếm và đặt lịch khám tại hệ thống các bệnh viện, phòng khám đa khoa uy tín hàng đầu trên cả nước.
          </p>
        </div>
      </section>

      <div className="container-custom mt-8 space-y-8">
        {/* Search filter */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm bệnh viện, phòng khám, địa điểm..."
            className="pl-12 h-12 w-full bg-white border-gray-200 focus-visible:ring-[#4CAF50] rounded-xl shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200/60 rounded-3xl p-8 max-w-md mx-auto space-y-4">
            <HeartPulse className="h-16 w-16 text-gray-300 mx-auto" />
            <h3 className="text-lg font-bold text-secondary">Không tìm thấy cơ sở y tế</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại chính tả.
            </p>
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
                <Card key={hospital.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200/60 overflow-hidden flex flex-col h-full bg-white rounded-2xl">
                  {/* Hospital Image */}
                  <div className="h-48 w-full relative overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={image}
                      alt={hospital.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-gray-800 flex items-center gap-1 shadow-sm">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span>{hospital.rating || 4.8}</span>
                    </div>
                  </div>

                  {/* Hospital Content */}
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h3 className="font-bold text-secondary text-base leading-snug line-clamp-1 hover:text-[#4CAF50] transition-colors">
                        <Link href={`/co-so-y-te/${hospital.id}`}>{hospital.name}</Link>
                      </h3>
                      <p className="text-xs text-[#0c4b39] font-bold bg-[#0c4b39]/5 inline-block px-2.5 py-0.5 rounded-full">
                        Bệnh viện Liên kết
                      </p>

                      <div className="space-y-2 pt-2 text-xs text-gray-500 border-t border-gray-100">
                        {/* Address */}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{hospital.address}</span>
                        </div>
                        {/* Website */}
                        {hospital.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 shrink-0 text-gray-400" />
                            <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#4CAF50] truncate">
                              {hospital.website}
                            </a>
                          </div>
                        )}
                        {/* Email */}
                        {hospital.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="truncate">{hospital.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                      <Link
                        href={`/co-so-y-te/${hospital.id}`}
                        className="flex-1 text-center py-2.5 px-4 border border-[#0c4b39]/20 hover:border-[#0c4b39] text-[#0c4b39] font-bold rounded-lg text-xs transition"
                      >
                        Chi tiết
                      </Link>
                      <Link
                        href={`/bac-si?hospitalId=${hospital.id}`}
                        className="flex-1 text-center py-2.5 px-4 bg-[#2a6d54] hover:bg-[#205340] active:bg-[#1a4434] text-white font-semibold rounded-lg text-xs transition shadow-sm cursor-pointer"
                      >
                        Xem bác sĩ
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
