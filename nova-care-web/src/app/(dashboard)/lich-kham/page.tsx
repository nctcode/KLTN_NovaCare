'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentCard } from '@/components/features/AppointmentCard';
import { Calendar, Clock, Loader2 } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Lịch khám của tôi</h1>
          <p className="text-sm text-gray-500">Xem và quản lý các lịch hẹn khám bệnh đã đăng ký</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Sắp tới ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Lịch sử ({history.length})
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {upcoming.length === 0 ? (
                <Card className="border-dashed bg-gray-50/50">
                  <CardContent className="py-12 text-center text-gray-500">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="font-medium text-secondary">Bạn không có lịch khám nào sắp tới</p>
                    <Link href="/bac-si">
                      <Button variant="link" className="mt-2 text-primary-dark font-semibold">
                        Đặt lịch ngay
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                upcoming.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              {history.length === 0 ? (
                <Card className="border-dashed bg-gray-50/50">
                  <CardContent className="py-12 text-center text-gray-500">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="font-medium text-secondary">Chưa có lịch sử khám bệnh</p>
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
