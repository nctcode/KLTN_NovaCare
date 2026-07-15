'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { homeService } from '@/services/home.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ChevronRight, Star, MapPin, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: specialties = [], isLoading: loadingSpecialties } = useQuery({
    queryKey: ['featured-specialties'],
    queryFn: homeService.getFeaturedSpecialties,
  });

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['featured-doctors'],
    queryFn: homeService.getFeaturedDoctors,
  });

  const { data: hospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ['featured-hospitals'],
    queryFn: homeService.getFeaturedHospitals,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/bac-si?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isLoading = loadingSpecialties || loadingDoctors || loadingHospitals;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-white to-primary/5 py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary mb-4 leading-tight">
              Đặt lịch khám{' '}
              <span className="text-primary-dark">dễ dàng</span>,{' '}
              <span className="text-primary-dark">nhanh chóng</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Kết nối với hàng ngàn bác sĩ và cơ sở y tế uy tín trên toàn quốc.
              Đặt lịch khám chỉ với vài cú nhấp chuột.
            </p>
            {/* Search Box */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..."
                  className="pl-10 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Tìm kiếm
              </Button>
            </form>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-dark">500+</div>
                <div className="text-sm text-gray-500">Bác sĩ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-dark">100+</div>
                <div className="text-sm text-gray-500">Cơ sở y tế</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-dark">10K+</div>
                <div className="text-sm text-gray-500">Lịch hẹn</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary">Chuyên khoa nổi bật</h2>
            <Link href="/chuyen-khoa" className="text-primary-dark hover:underline flex items-center font-semibold">
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          {loadingSpecialties ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {specialties.map((specialty) => (
                <Link
                  key={specialty.id}
                  href={`/bac-si?specialtyId=${specialty.id}`}
                  className="group"
                >
                  <Card className="text-center hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="text-4xl mb-2">{specialty.icon || '🏥'}</div>
                      <p className="text-sm font-medium group-hover:text-primary-dark transition text-secondary">
                        {specialty.name}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Doctors Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary">Bác sĩ tiêu biểu</h2>
            <Link href="/bac-si" className="text-primary-dark hover:underline flex items-center font-semibold">
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          {loadingDoctors ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <Link key={doctor.id} href={`/bac-si/${doctor.id}`} className="block">
                  <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl flex-shrink-0 text-secondary">
                          {doctor.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-secondary text-lg truncate">{doctor.fullName}</h3>
                          <p className="text-sm text-gray-500 truncate">{doctor.qualification || 'Bác sĩ chuyên khoa'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{doctor.rating || 4.8}</span>
                            <span className="text-sm text-gray-400">
                              ({doctor.reviewCount || 12} đánh giá)
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Hospitals Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary">Cơ sở y tế uy tín</h2>
            <Link href="/co-so-y-te" className="text-primary-dark hover:underline flex items-center font-semibold">
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          {loadingHospitals ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hospitals.map((hospital) => (
                <Link key={hospital.id} href={`/co-so-y-te/${hospital.id}`} className="block">
                  <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {hospital.logoUrl ? (
                            <img
                              src={hospital.logoUrl}
                              alt={hospital.name}
                              className="w-16 h-16 object-contain"
                            />
                          ) : (
                            <span className="text-3xl">🏥</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-secondary text-lg">{hospital.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">{hospital.address}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{hospital.rating || 4.7}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>Đang mở cửa</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
