'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { specialtyService } from '@/services/specialty.service';
import { Input } from '@/components/ui/input';
import {
  Search,
  Loader2,
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
  Stethoscope
} from 'lucide-react';
import Link from 'next/link';

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

export default function SpecialtiesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: specialties = [], isLoading } = useQuery({
    queryKey: ['specialties-list'],
    queryFn: specialtyService.getAll,
  });

  const filteredSpecialties = specialties.filter((specialty) =>
    specialty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (specialty.description && specialty.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.05),transparent_50%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
            Chuyên Khoa Y Tế
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base">
            Tìm kiếm bác sĩ giỏi theo các chuyên khoa lâm sàng, hỗ trợ điều trị nhanh chóng và hiệu quả.
          </p>
        </div>
      </section>

      <div className="container-custom mt-8 space-y-8">
        {/* Search filter */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm chuyên khoa..."
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
        ) : filteredSpecialties.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200/60 rounded-3xl p-8 max-w-md mx-auto space-y-4">
            <HeartPulse className="h-16 w-16 text-gray-300 mx-auto" />
            <h3 className="text-lg font-bold text-secondary">Không tìm thấy chuyên khoa</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại chính tả.
            </p>
          </div>
        ) : (
          /* Grid list of specialties */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filteredSpecialties.map((specialty) => {
              return (
                <Link
                  key={specialty.id}
                  href={`/bac-si?specialtyId=${specialty.id}`}
                  className="group bg-white border border-slate-200/80 hover:border-[#0c4b39]/40 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 rounded-2xl p-5 flex flex-col items-center justify-between h-[175px] text-center cursor-pointer no-underline relative overflow-hidden shadow-xs"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#0c4b39]/8 group-hover:bg-[#0c4b39] flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xs mb-1">
                    {renderSpecialtyIcon(specialty.name)}
                  </div>
                  <h3 className="font-bold text-[#1A2B3C] group-hover:text-[#0c4b39] text-sm md:text-base leading-tight line-clamp-2 max-w-full px-1">
                    {specialty.name}
                  </h3>
                  <span className="inline-block bg-[#0c4b39]/10 group-hover:bg-[#0c4b39] text-[#0c4b39] group-hover:text-white transition-all duration-300 text-[11px] font-extrabold py-1 px-5 rounded-full text-center uppercase tracking-wider shadow-xs mt-1">
                    Đặt khám
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
