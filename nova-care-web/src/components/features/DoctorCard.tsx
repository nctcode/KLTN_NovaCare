'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MapPin } from 'lucide-react';
import { Doctor } from '@/types';

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const defaultWorkplace = doctor.workPlaces?.[0];

  return (
    <Card className="hover:shadow-md transition">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl flex-shrink-0 text-secondary">
              {doctor.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-secondary">{doctor.fullName}</h3>
              <p className="text-sm text-gray-500">{doctor.qualification || 'Bác sĩ chuyên khoa'}</p>
              {defaultWorkplace && (
                <>
                  <p className="text-sm font-medium text-primary-dark mt-1">
                    {defaultWorkplace.specialty.name}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{defaultWorkplace.hospital.name}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{doctor.rating || 4.8}</span>
                <span className="text-sm text-gray-400">({doctor.reviewCount || 10} đánh giá)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 mt-4 sm:mt-0 w-full sm:w-auto border-t pt-4 sm:border-t-0 sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-xs text-gray-500">Phí khám</p>
              <p className="font-bold text-secondary text-lg">
                {defaultWorkplace ? `${defaultWorkplace.consultationFee.toLocaleString()}đ` : 'Liên hệ'}
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/bac-si/${doctor.id}`}>Xem chi tiết</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
