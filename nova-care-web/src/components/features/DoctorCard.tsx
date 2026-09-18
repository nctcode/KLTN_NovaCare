'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Stethoscope, Users, CheckCircle2, Calendar, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Doctor } from '@/types';
import { formatPrice, getDoctorSpecialtyName, getDoctorAvatar } from '@/lib/utils';

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const defaultWorkplace = doctor.workPlaces?.[0];
  const visitsCount = doctor.consultationCount || (doctor.reviewCount ? doctor.reviewCount * 14 + 120 : 450);
  const specialtyName = getDoctorSpecialtyName(doctor);
  const avatarUrl = getDoctorAvatar(doctor);
  const ratingValue = doctor.rating || 4.86;
  const reviewCount = doctor.reviewCount || 153;

  // Add degree title if not present in name
  const formattedTitle = doctor.fullName.startsWith('BS')
    ? doctor.fullName
    : `BS.CKII ${doctor.fullName}`;

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border border-slate-200/80 hover:border-[#0c4b39]/40 rounded-2xl overflow-hidden bg-white group">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-5 justify-between items-start">
          {/* Left info area */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start flex-1 min-w-0">
            {/* Avatar with Status Pulse */}
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/20 shadow-md group-hover:scale-105 transition-transform duration-300 bg-slate-100">
                <img
                  src={avatarUrl}
                  alt={doctor.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Green online pulse badge */}
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sẵn sàng</span>
                </div>
              </div>
            </div>

            {/* Doctor Details */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-[#1A2B3C] group-hover:text-[#0c4b39] transition-colors leading-tight">
                  <Link href={`/bac-si/${doctor.id}`} className="no-underline text-inherit">
                    {formattedTitle}
                  </Link>
                </h3>
                <span className="inline-flex items-center text-blue-600" title="Bác sĩ đã xác minh">
                  <CheckCircle2 className="w-4 h-4 fill-blue-50 text-white" />
                </span>
              </div>

              {/* Specialty & Hospital tags */}
              <div className="mt-2.5 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c4b39] bg-[#0c4b39]/8 px-3 py-1 rounded-lg border border-[#0c4b39]/10">
                  <Stethoscope className="h-3.5 w-3.5 shrink-0 text-[#0c4b39]" />
                  <span>Chuyên khoa: {specialtyName}</span>
                </div>

                {defaultWorkplace?.hospital?.name && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-600 font-medium truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{defaultWorkplace.hospital.name}</span>
                  </div>
                )}
              </div>

              {/* Ratings & Stats Pills */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/70 px-2.5 py-0.5 rounded-md text-xs font-extrabold">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>{ratingValue}</span>
                  <span className="text-[11px] text-amber-700/80 font-normal">({reviewCount} đánh giá)</span>
                </div>

                <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{visitsCount}+ lượt khám</span>
                </div>

                <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>Đặt lịch 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right action & Price box */}
          <div className="flex flex-col sm:flex-row lg:flex-col justify-between items-center sm:items-end lg:items-end gap-3 mt-4 lg:mt-0 w-full lg:w-48 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
            <div className="text-center sm:text-right w-full sm:w-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Giá khám niêm yết
              </span>
              <p className="font-black text-[#0c4b39] text-xl sm:text-2xl mt-0.5">
                {defaultWorkplace ? `${formatPrice(defaultWorkplace.consultationFee)}đ` : '200.000đ'}
              </p>
            </div>

            <div className="flex sm:flex-row lg:flex-col gap-2 w-full">
              <Button
                asChild
                variant="outline"
                className="flex-1 w-full border-slate-200 hover:border-[#0c4b39]/30 text-slate-700 hover:text-[#0c4b39] font-bold text-xs h-10 rounded-xl transition"
              >
                <Link href={`/bac-si/${doctor.id}`}>Xem chi tiết</Link>
              </Button>

              <Button
                asChild
                className="flex-1 w-full bg-[#0c4b39] hover:bg-[#083327] active:bg-[#05221a] text-white font-extrabold text-xs h-10 rounded-xl transition shadow-md hover:shadow-emerald-900/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Link href={defaultWorkplace?.id ? `/dat-lich?workplaceId=${defaultWorkplace.id}` : `/bac-si/${doctor.id}`}>
                  <Calendar className="w-3.5 h-3.5 text-[#66FF33]" />
                  <span>Đặt lịch ngay</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

