'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Stethoscope, Users } from 'lucide-react';
import { Doctor } from '@/types';
import { formatPrice, getDoctorSpecialtyName } from '@/lib/utils';

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const defaultWorkplace = doctor.workPlaces?.[0];
  const visitsCount = doctor.consultationCount || (doctor.reviewCount ? doctor.reviewCount * 12 + 100 : 350);
  const specialtyName = getDoctorSpecialtyName(doctor);

  return (
    <Card className="hover:shadow-md transition border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0c4b39]/10 flex items-center justify-center text-[#0c4b39] font-bold text-2xl shrink-0 border border-[#0c4b39]/15">
              {doctor.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-lg text-secondary">{doctor.fullName}</h3>
              
              {/* Chuyên khoa & Cơ sở */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#0c4b39]">
                  <Stethoscope className="h-4 w-4 shrink-0 text-[#0c4b39]" />
                  <span>Chuyên khoa: {specialtyName}</span>
                </div>
                {defaultWorkplace?.hospital?.name && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span>{defaultWorkplace.hospital.name}</span>
                  </div>
                )}
              </div>

              {/* Rating & Lượt khám */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                  <span className="text-xs font-bold text-gray-800">{doctor.rating || 4.8}</span>
                  <span className="text-[11px] text-gray-500">({doctor.reviewCount || 10} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{visitsCount}+ lượt khám</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 mt-4 sm:mt-0 w-full sm:w-auto border-t border-gray-100 pt-4 sm:border-t-0 sm:pt-0">
            <div className="text-left sm:text-right bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60 sm:bg-transparent sm:p-0 sm:border-none">
              <p className="text-xs text-gray-500 font-medium">Giá khám public</p>
              <p className="font-extrabold text-[#0c4b39] text-xl">
                {defaultWorkplace ? `${formatPrice(defaultWorkplace.consultationFee)}đ` : 'Liên hệ'}
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto bg-[#0c4b39] hover:bg-[#083327] text-white font-bold transition shadow-xs">
              <Link href={`/bac-si/${doctor.id}`}>Xem chi tiết</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
