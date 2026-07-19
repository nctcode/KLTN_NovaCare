'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MapPin, Clock, Award, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorService.getById(doctorId),
  });

  const [quickWpId, setQuickWpId] = useState('');
  const [quickDate, setQuickDate] = useState('');

  useEffect(() => {
    if (doctor?.workPlaces && doctor.workPlaces.length > 0) {
      setQuickWpId(doctor.workPlaces[0].id);
    }
  }, [doctor]);

  const handleQuickBook = () => {
    if (quickWpId) {
      router.push(`/dat-lich?workplaceId=${quickWpId}${quickDate ? `&date=${quickDate}` : ''}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container-custom py-12 text-center bg-white border rounded-lg max-w-md mx-auto my-12 p-6">
        <h1 className="text-2xl font-bold text-secondary">Không tìm thấy bác sĩ</h1>
        <Link href="/bac-si" className="text-[#4caf50] hover:text-[#439e47] mt-4 inline-block font-semibold transition hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }
  return (
    <div className="container-custom py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor Info */}
          <Card className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-24 h-24 rounded-full bg-[#4caf50]/10 flex items-center justify-center text-[#4caf50] font-bold text-3xl shrink-0">
                  {doctor.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-secondary">{doctor.fullName}</h1>
                  <p className="text-gray-600">{doctor.qualification || 'Bác sĩ chuyên khoa'}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="font-medium">{doctor.rating || 4.8}</span>
                      <span className="text-gray-500 text-sm">
                        ({doctor.reviewCount || 10} đánh giá)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Đang nhận lịch đặt</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {doctor.bio && (
            <Card className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden bg-white">
              <CardHeader>
                <CardTitle className="text-secondary">Giới thiệu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{doctor.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          {doctor.experience && (
            <Card className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden bg-white">
              <CardHeader>
                <CardTitle className="text-secondary">Kinh nghiệm chuyên môn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-[#4caf50] flex-shrink-0 mt-1" />
                  <p className="text-gray-600">{doctor.experience}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workplaces */}
          <Card className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardHeader>
              <CardTitle className="text-secondary">Nơi làm việc & Lịch khám</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {doctor.workPlaces?.map((workplace) => (
                <div
                  key={workplace.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl gap-4 bg-gray-50/50"
                >
                  <div>
                    <h4 className="font-semibold text-secondary">{workplace.hospital.name}</h4>
                    <p className="text-sm text-[#4caf50] font-semibold">
                      Chuyên khoa: {workplace.specialty.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                      <span>{workplace.hospital.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-500">Phí khám</p>
                      <p className="font-extrabold text-[#4caf50] text-lg">
                        {formatPrice(workplace.consultationFee)}đ
                      </p>
                    </div>
                    <Button asChild className="bg-[#4caf50] hover:bg-[#439e47] text-white font-bold transition">
                      <Link href={`/dat-lich?workplaceId=${workplace.id}`}>
                        Đặt lịch
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Booking */}
          <Card className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-secondary">Đặt lịch nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Chọn cơ sở khám</label>
                <select
                  value={quickWpId}
                  onChange={(e) => setQuickWpId(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-[#4caf50] transition-all"
                >
                  {doctor.workPlaces?.map((wp) => (
                    <option key={wp.id} value={wp.id}>
                      {wp.hospital.name} - {wp.specialty.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Chọn ngày khám (tùy chọn)</label>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-[#4caf50] transition-all"
                />
              </div>
              <Button className="w-full bg-[#4caf50] hover:bg-[#439e47] text-white font-bold transition" onClick={handleQuickBook} disabled={!quickWpId}>
                Tìm lịch trống
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-[#4caf50]" />
                <span>Thời gian khám mỗi ca: ~30 phút</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-[#4caf50]" />
                <span>Khám trực tiếp tại cơ sở y tế</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
