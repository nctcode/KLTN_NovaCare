'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Calendar, ShieldAlert, LogOut } from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Tài khoản của tôi</h1>
        <p className="text-sm text-gray-500">Xem và cập nhật thông tin tài khoản cá nhân của bạn</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-secondary text-2xl font-bold">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <CardTitle className="text-xl text-secondary">{user?.fullName}</CardTitle>
            <p className="text-sm text-gray-500">Vai trò: Bệnh nhân</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-3 py-2 text-sm">
            <User className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-gray-400 text-xs">Tên đăng nhập</p>
              <p className="font-semibold text-secondary">{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2 text-sm border-t">
            <Mail className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-gray-400 text-xs">Địa chỉ email</p>
              <p className="font-semibold text-secondary">{user?.email || 'Chưa cập nhật'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2 text-sm border-t">
            <Phone className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-gray-400 text-xs">Số điện thoại</p>
              <p className="font-semibold text-secondary">{user?.phone || 'Chưa cập nhật'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2 text-sm border-t">
            <ShieldAlert className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-gray-400 text-xs">Trạng thái tài khoản</p>
              <p className="font-semibold text-success flex items-center gap-1 mt-0.5">
                <span className="w-2.5 h-2.5 bg-success rounded-full" />
                Đang hoạt động
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="destructive" onClick={logout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Đăng xuất tài khoản
        </Button>
      </div>
    </div>
  );
}
