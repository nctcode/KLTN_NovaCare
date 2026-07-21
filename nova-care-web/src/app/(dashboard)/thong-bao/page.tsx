'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell, CheckCheck, Loader2, CheckCircle2, MessageSquare, Info, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

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
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.isRead);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header Banner - Full Width */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Thông báo</h1>
            {unreadCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Cập nhật nhắc nhở lịch khám bệnh, kết quả và tin nhắn hệ thống
          </p>
        </div>

        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-xs text-slate-800 font-semibold border-slate-300 gap-2 self-start md:self-auto hover:bg-slate-50"
          >
            <CheckCheck className="h-4 w-4" />
            Đánh dấu đọc tất cả
          </Button>
        )}
      </div>

      {/* Toolbar - Filter Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
            filter === 'UNREAD'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      {filteredNotifications.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white">
          <CardContent className="py-16 text-center text-slate-500 space-y-2">
            <Bell className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-900">Không có thông báo nào</p>
            <p className="text-xs text-slate-500">
              {filter === 'UNREAD' ? 'Tất cả thông báo đã được đọc.' : 'Bạn hiện chưa nhận được thông báo mới.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all duration-200 cursor-pointer bg-white border ${
                !notification.isRead
                  ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                  : 'border-slate-200 hover:border-slate-400 shadow-xs'
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markOneMutation.mutate(notification.id);
                }
              }}
            >
              <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !notification.isRead
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold text-slate-900 text-sm">{notification.title}</p>
                    {!notification.isRead && (
                      <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                        Chưa đọc
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{notification.content}</p>
                  <p className="text-[11px] text-slate-500 font-semibold pt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

