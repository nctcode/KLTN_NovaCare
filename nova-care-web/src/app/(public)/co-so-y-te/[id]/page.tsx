'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospital.service';
import { doctorService } from '@/services/doctor.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Mail, Phone, Star, Loader2, User, ChevronRight, Stethoscope, Users } from 'lucide-react';
import Link from 'next/link';
import { formatPrice, getDoctorSpecialtyName } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HospitalDetailPage({ params }: PageProps) {
  const { id } = React.use(params);

  // Fetch hospital detail
  const { data: hospital, isLoading: loadingHospital, error: hospitalError } = useQuery({
    queryKey: ['hospital-detail', id],
    queryFn: () => hospitalService.getById(id),
  });

  // Fetch doctors at this hospital
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['hospital-doctors', id],
    queryFn: () => doctorService.search({ hospitalId: id }),
    enabled: !!hospital,
  });

  if (loadingHospital) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (hospitalError || !hospital) {
    return (
      <div className="container-custom py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-secondary">Không tìm thấy cơ sở y tế</h2>
        <p className="text-gray-500 text-sm">Cơ sở y tế không tồn tại hoặc đã bị gỡ bỏ.</p>
        <Button asChild>
          <Link href="/co-so-y-te">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const hospitalImages: Record<string, string> = {
    'Bệnh viện Đa khoa NovaCare': 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800',
    'Bệnh viện Chuyên khoa Sài Gòn': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
  };
  const bannerImage = hospitalImages[hospital.name] || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Header Banner */}
      <div className="h-64 md:h-80 w-full relative overflow-hidden bg-gray-900">
        <img
          src={bannerImage}
          alt={hospital.name}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#142330] via-[#142330]/40 to-transparent"></div>
        <div className="absolute bottom-6 left-0 right-0">
          <div className="container-custom text-white space-y-3">
            <div className="flex items-center gap-1.5 bg-[#4CAF50] text-white text-xs font-bold px-2.5 py-1 rounded-md w-fit">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{hospital.rating || 4.8} ({hospital.reviewCount || 45} đánh giá)</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{hospital.name}</h1>
            <p className="flex items-center gap-1 text-xs md:text-sm text-gray-300">
              <MapPin className="h-4 w-4 shrink-0 text-[#66FF33]" />
              <span>{hospital.address}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Detail Info & Doctor List */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Description */}
            <Card className="border border-gray-200/60 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-6 md:p-8 space-y-4">
                <h2 className="text-xl font-bold text-secondary tracking-tight">Giới thiệu</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {hospital.description || 
                    `Chào mừng bạn đến với ${hospital.name}. Chúng tôi cam kết cung cấp dịch vụ khám chữa bệnh chất lượng cao với đội ngũ chuyên gia tận tâm và trang thiết bị y tế hiện đại. Với phương châm bệnh nhân làm trung tâm, chúng tôi không ngừng cải tiến quy trình phục vụ để mang lại sự an tâm tuyệt đối cho khách hàng.`}
                </p>
              </CardContent>
            </Card>

            {/* Doctor List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-secondary tracking-tight flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-[#4CAF50]" />
                Đội ngũ bác sĩ liên kết ({doctors.length})
              </h2>

              {loadingDoctors ? (
                <div className="flex justify-center py-10 bg-white border border-gray-200/60 rounded-2xl">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-200/60 rounded-2xl p-6">
                  <p className="text-gray-500 text-sm">Chưa có thông tin bác sĩ liên kết tại cơ sở này.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => {
                    const firstWorkplace = doctor.workPlaces && doctor.workPlaces.length > 0
                      ? doctor.workPlaces[0]
                      : null;
                    const firstWorkplaceId = firstWorkplace?.id || null;
                    const bookingUrl = firstWorkplaceId
                      ? `/dat-lich?workplaceId=${firstWorkplaceId}`
                      : `/bac-si/${doctor.id}`;

                    const specialtyName = getDoctorSpecialtyName(doctor);
                    const fee = firstWorkplace?.consultationFee || 200000;
                    const visitsCount = doctor.consultationCount || (doctor.reviewCount ? doctor.reviewCount * 12 + 60 : 300);

                    return (
                      <Card key={doctor.id} className="hover:shadow-md transition border border-gray-200/60 bg-white rounded-xl overflow-hidden flex flex-col justify-between h-full">
                        <CardContent className="p-5 flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex-shrink-0 flex items-center justify-center text-[#2a6d54] font-bold overflow-hidden border border-emerald-100">
                              {doctor.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-secondary text-sm leading-snug truncate hover:text-[#4CAF50] transition-colors">
                                <Link href={`/bac-si/${doctor.id}`}>{doctor.fullName}</Link>
                              </h4>

                              {/* Chuyên khoa */}
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[#2a6d54] mt-1.5 truncate">
                                <Stethoscope className="h-3 w-3 shrink-0 text-[#2a6d54]" />
                                <span className="truncate">{specialtyName}</span>
                              </div>

                              {/* Rating & Lượt khám */}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <div className="flex items-center gap-0.5">
                                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs font-bold text-gray-700">5.0</span>
                                </div>
                                <span className="text-xs text-gray-400">({doctor.reviewCount || 20})</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                  <Users className="h-2.5 w-2.5 text-emerald-600" />
                                  {visitsCount}+ lượt khám
                                </span>
                              </div>

                              {/* Phí khám / Giá tiền */}
                              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className="text-gray-400">Giá khám:</span>
                                <span className="font-extrabold text-[#2a6d54]">
                                  {formatPrice(fee)}đ
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <div className="px-5 pb-5 pt-0">
                          <Link
                            href={bookingUrl}
                            className="block w-full text-center py-2 bg-[#2a6d54] hover:bg-[#205340] text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                          >
                            Đặt Lịch Khám
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column - Contact Details Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-gray-200/60 shadow-sm rounded-2xl bg-white overflow-hidden sticky top-24">
              <CardContent className="p-6 space-y-6">
                <h3 className="font-bold text-secondary text-base border-b border-gray-100 pb-3">
                  Thông tin liên hệ
                </h3>
                
                <div className="space-y-4">
                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Hotline đặt lịch</p>
                      <p className="text-sm font-bold text-secondary">1900 1234</p>
                    </div>
                  </div>

                  {/* Email */}
                  {hospital.email && (
                    <div className="flex items-start gap-3 border-t border-gray-50 pt-4">
                      <Mail className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">Thư điện tử</p>
                        <p className="text-sm font-medium text-secondary truncate">{hospital.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {hospital.website && (
                    <div className="flex items-start gap-3 border-t border-gray-50 pt-4">
                      <Globe className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">Trang web</p>
                        <a 
                          href={hospital.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm font-medium text-[#4CAF50] hover:underline truncate block"
                        >
                          {hospital.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button asChild className="w-full h-11">
                    <Link href="/co-so-y-te">
                      Xem tất cả cơ sở y tế
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
