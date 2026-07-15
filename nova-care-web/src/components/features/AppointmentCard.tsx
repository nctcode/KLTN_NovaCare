'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Appointment } from '@/types/appointment.types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  PENDING: { label: 'Chờ xác nhận', variant: 'secondary' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'default' },
  PAID: { label: 'Đã thanh toán', variant: 'success' },
  COMPLETED: { label: 'Đã hoàn thành', variant: 'secondary' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
  EXPIRED: { label: 'Đã hết hạn', variant: 'destructive' },
  NO_SHOW: { label: 'Không đến khám', variant: 'destructive' },
};

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const status = statusConfig[appointment.status] || { label: appointment.status, variant: 'secondary' };
  const startTime = appointment.slot?.startTime ? new Date(appointment.slot.startTime) : null;

  return (
    <Card className="hover:shadow-md transition duration-200">
      <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-secondary text-sm">Mã: {appointment.bookingCode}</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate">Bác sĩ: {appointment.slot?.doctorWorkplace?.doctor?.fullName || 'Bác sĩ'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                {startTime ? format(startTime, 'dd/MM/yyyy', { locale: vi }) : '---'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                {startTime ? format(startTime, 'HH:mm', { locale: vi }) : '---'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">{appointment.slot?.doctorWorkplace?.hospital?.name || 'Cơ sở khám'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto border-t pt-4 md:border-t-0 md:pt-0 justify-between md:justify-end">
          <div className="text-left md:text-right">
            <p className="text-xs text-gray-400">Tổng phí</p>
            <p className="font-bold text-secondary text-base">
              {appointment.totalPrice?.toLocaleString() || 0}đ
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/lich-kham/${appointment.id}`}>
              Chi tiết
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
