'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentCard } from '@/components/features/AppointmentCard';
import { Calendar, Clock, Loader2, CalendarCheck, CheckCircle2, ArrowRight, Filter } from 'lucide-react';
import Link from 'next/link';

export default function AppointmentPage() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const { data: upcoming = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ['appointments-upcoming'],
    queryFn: appointmentService.getUpcoming,
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['appointments-history'],
    queryFn: appointmentService.getHistory,
  });

  const isLoading = loadingUpcoming || loadingHistory;
  const completedCount = history.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="w-full space-y-6">
      {/* Header Banner - Full Width */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lịch khám của tôi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi danh sách lịch hẹn khám bệnh sắp tới và xem lại lịch sử khám
          </p>
        </div>

        <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-2 self-start md:self-auto">
          <Link href="/bac-si">
            <CalendarCheck className="w-4 h-4" />
            Đặt lịch khám mới
          </Link>
        </Button>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lịch hẹn sắp tới</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{upcoming.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Đã hoàn thành</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số lịch ghi nhận</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{upcoming.length + history.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-slate-200 pb-0">
          <TabsList className="bg-transparent space-x-6 p-0 h-auto">
            <TabsTrigger
              value="upcoming"
              className="px-0 py-3 rounded-none border-b-2 font-semibold text-sm transition data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 text-slate-500 bg-transparent shadow-none"
            >
              Sắp tới ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="px-0 py-3 rounded-none border-b-2 font-semibold text-sm transition data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 text-slate-500 bg-transparent shadow-none"
            >
              Lịch sử khám ({history.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
          </div>
        ) : (
          <>
            <TabsContent value="upcoming" className="space-y-4 mt-6">
              {upcoming.length === 0 ? (
                <Card className="border-dashed border-slate-300 bg-white">
                  <CardContent className="py-16 text-center text-slate-500 space-y-3">
                    <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-900">Bạn chưa có lịch hẹn khám nào sắp tới</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Hãy tìm bác sĩ phù hợp hoặc cơ sở y tế gần nhất để đăng ký lịch khám online ngay.
                    </p>
                    <div className="pt-2">
                      <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-2">
                        <Link href="/bac-si">
                          Đặt lịch ngay
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                upcoming.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-6">
              {history.length === 0 ? (
                <Card className="border-dashed border-slate-300 bg-white">
                  <CardContent className="py-16 text-center text-slate-500 space-y-2">
                    <Clock className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-900">Chưa có dữ liệu lịch sử khám</p>
                    <p className="text-xs text-slate-400">Các lịch khám đã hoàn tất hoặc hủy sẽ được lưu giữ tại đây.</p>
                  </CardContent>
                </Card>
              ) : (
                history.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

