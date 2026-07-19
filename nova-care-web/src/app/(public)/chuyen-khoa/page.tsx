'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { specialtyService } from '@/services/specialty.service';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2, HeartPulse, Stethoscope } from 'lucide-react';
import Link from 'next/link';

// Specialty mapping to match clinic aesthetics
const getSpecialtyDetails = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes('tim mạch')) {
    return {
      icon: '❤️',
      desc: 'Chẩn đoán, điều trị các bệnh lý tim mạch, cao huyết áp, suy tim hiệu quả.',
    };
  }
  if (normalized.includes('thần kinh')) {
    return {
      icon: '🧠',
      desc: 'Chăm sóc và điều trị chuyên sâu về thần kinh, đột quỵ, đau đầu, sa sút trí tuệ.',
    };
  }
  if (normalized.includes('nội tiết') || normalized.includes('nội khoa')) {
    return {
      icon: '🫁',
      desc: 'Theo dõi, khám và điều trị đái tháo đường, bệnh lý tuyến giáp, rối loạn chuyển hóa.',
    };
  }
  if (normalized.includes('nhi')) {
    return {
      icon: '👶',
      desc: 'Khám nhi toàn diện, tư vấn dinh dưỡng, tiêm chủng và theo dõi sự phát triển của trẻ.',
    };
  }
  if (normalized.includes('sản') || normalized.includes('phụ')) {
    return {
      icon: '🤰',
      desc: 'Chăm sóc sức khỏe thai sản, tầm soát ung thư phụ khoa, điều trị vô sinh hiếm muộn.',
    };
  }
  if (normalized.includes('xương') || normalized.includes('khớp')) {
    return {
      icon: '🦴',
      desc: 'Khám và điều trị thoái hóa khớp, cột sống, loãng xương, viêm khớp tự miễn.',
    };
  }
  if (normalized.includes('tai') || normalized.includes('họng')) {
    return {
      icon: '👂',
      desc: 'Điều trị viêm tai, viêm mũi xoang, viêm họng hạt, khàn tiếng ở người lớn và trẻ em.',
    };
  }
  if (normalized.includes('mắt')) {
    return {
      icon: '👁️',
      desc: 'Khám khúc xạ, điều trị đục thủy tinh thể, tăng nhãn áp và các bệnh lý về mắt.',
    };
  }
  return {
    icon: '🩺',
    desc: 'Cung cấp dịch vụ khám chữa bệnh chất lượng cao với trang thiết bị y tế hiện đại.',
  };
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpecialties.map((specialty) => {
              const details = getSpecialtyDetails(specialty.name);

              return (
                <Card 
                  key={specialty.id} 
                  className="hover:shadow-md hover:border-[#0c4b39]/20 transition-all border border-gray-200/60 bg-white rounded-2xl overflow-hidden flex flex-col justify-between h-[220px]"
                >
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="text-3xl">
                        {specialty.icon || details.icon}
                      </div>
                      <h3 className="font-bold text-[#0c4b39] text-base leading-snug line-clamp-1">
                        {specialty.name}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {specialty.description || details.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50">
                      <Link
                        href={`/bac-si?specialtyId=${specialty.id}`}
                        className="inline-flex items-center gap-1.5 bg-[#0c4b39] text-white hover:bg-[#083629] text-xs font-bold py-1.5 px-4 rounded-md uppercase tracking-wider transition shadow-sm"
                      >
                        <Stethoscope className="h-3.5 w-3.5" />
                        Tìm Bác Sĩ
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
