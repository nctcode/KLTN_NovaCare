'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã đánh dấu đọc tất cả thông báo');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi cập nhật thông báo');
    },
  });

  const markOneMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Thông báo</h1>
          <p className="text-sm text-gray-500">Cập nhật tin tức và nhắc nhở lịch khám bệnh của bạn</p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Đọc tất cả
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed bg-gray-50/50">
          <CardContent className="py-12 text-center text-gray-500">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium text-secondary">Không có thông báo nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition hover:shadow-md cursor-pointer ${
                !notification.isRead ? 'border-l-4 border-primary bg-primary/5' : ''
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markOneMutation.mutate(notification.id);
                }
              }}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    !notification.isRead ? 'bg-primary' : 'bg-gray-350'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-secondary text-sm">{notification.title}</p>
                  <p className="text-sm text-gray-650 mt-1">{notification.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
                {!notification.isRead && (
                  <span className="text-[10px] font-bold bg-primary text-secondary px-1.5 py-0.5 rounded-full shrink-0">
                    Mới
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
