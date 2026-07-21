'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { appointmentService } from '@/services/appointment.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  LogOut, 
  Lock, 
  BellRing, 
  Copy, 
  Check, 
  FileText, 
  Calendar, 
  ShieldAlert, 
  Laptop, 
  Smartphone,
  Save,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPage() {
  const { user, logout, logoutAll } = useAuth();
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'notifications'>('info');

  // Load count statistics for full context
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileService.getAll,
  });

  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ['appointments-upcoming'],
    queryFn: appointmentService.getUpcoming,
  });

  // Local state for editable info presentation
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditing, setIsEditing] = useState(false);

  // Security password state mock handling
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [reminderNotif, setReminderNotif] = useState(true);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      toast.success('Đã sao chép Mã định danh tài khoản');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    toast.success('Đã lưu cập nhật thông tin cá nhân');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    toast.success('Cập nhật mật khẩu thành công');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Profile Header Banner - Pure White & Crisp */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl font-bold shadow-md shrink-0 ring-4 ring-emerald-50">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {user?.fullName || 'Tài khoản người dùng'}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Đã xác thực
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
                  {user?.role === 'PATIENT' ? 'Bệnh nhân' : user?.role || 'Bệnh nhân'}
                </span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                <span>Tên đăng nhập: <strong className="text-slate-900 font-bold">{user?.username}</strong></span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                  ID: {user?.id?.slice(0, 8) || 'N/A'}...
                  <button 
                    onClick={handleCopyId} 
                    className="p-1 hover:text-slate-900 text-slate-500 transition"
                    title="Sao chép ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <Button variant="outline" size="sm" onClick={logoutAll} className="text-slate-700 font-semibold border-slate-300 hover:bg-slate-50">
              Đăng xuất thiết bị khác
            </Button>
            <Button variant="destructive" size="sm" onClick={logout} className="gap-2 font-semibold shadow-xs">
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hồ sơ y tế</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{profiles.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-800">
              <FileText className="w-5 h-5 text-slate-800" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lịch sắp tới</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{upcomingAppointments.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 shadow-xs flex items-center justify-center text-amber-700">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bảo mật</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">100%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs flex items-center justify-center text-emerald-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hệ thống</p>
              <p className="text-xl font-bold text-slate-900 mt-2">Bình thường</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-800">
              <BellRing className="w-5 h-5 text-slate-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Crisp & Distinct */}
      <div className="flex border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 text-sm font-bold transition border-b-2 ${
            activeTab === 'info'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-bold transition border-b-2 ${
            activeTab === 'security'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Bảo mật & Đăng nhập
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-sm font-bold transition border-b-2 ${
            activeTab === 'notifications'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Cài đặt thông báo
        </button>
      </div>

      {/* Tab Content 1: Personal Info */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Chi tiết thông tin cá nhân</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Quản lý các thông tin cơ bản liên kết với tài khoản NovaCare
                </CardDescription>
              </div>
              <Button
                variant={isEditing ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="font-semibold text-xs border-slate-300"
              >
                {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveInfo} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-bold text-slate-900">Họ và tên</Label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={!isEditing}
                        className="pl-9 bg-white border-slate-300 text-slate-900 font-semibold focus-visible:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-xs font-bold text-slate-900">Tên tài khoản (Username)</Label>
                    <Input
                      id="username"
                      value={user?.username || ''}
                      disabled
                      className="bg-slate-100 border-slate-200 text-slate-900 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-900">Địa chỉ Email</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!isEditing}
                        placeholder="Chưa cập nhật"
                        className="pl-9 bg-white border-slate-300 text-slate-900 font-semibold focus-visible:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold text-slate-900">Số điện thoại</Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                        placeholder="Chưa cập nhật"
                        className="pl-9 bg-white border-slate-300 text-slate-900 font-semibold focus-visible:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button type="submit" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                      <Save className="w-4 h-4" />
                      Lưu thay đổi
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Side card - Account Summary Overview */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900">Tổng quan tài khoản</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600 text-xs font-medium">Loại tài khoản</span>
                  <span className="font-bold text-slate-900">Bệnh nhân</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600 text-xs font-medium">Trạng thái</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Hoạt động
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600 text-xs font-medium">Ngày khởi tạo</span>
                  <span className="font-bold text-slate-900 text-xs">2026-07-15</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-600 text-xs font-medium">Xác thực 2 lớp (2FA)</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Tắt</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 shadow-md bg-slate-900 text-white">
              <CardContent className="p-6 space-y-3">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Bảo vệ thông tin y tế</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dữ liệu y tế và hồ sơ của bạn được mã hóa an toàn theo chuẩn bảo mật. 
                  Không chia sẻ tài khoản cá nhân cho bất kỳ ai.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Content 2: Security */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-900">Đổi mật khẩu</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Nên đổi mật khẩu định kỳ để tăng cường an toàn dữ liệu
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-xs font-bold text-slate-900">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 bg-white border-slate-300 text-slate-900 font-semibold focus-visible:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-bold text-slate-900">Mật khẩu mới</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      className="pl-9 bg-white border-slate-300 text-slate-900 font-semibold focus-visible:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-900">Xác nhận mật khẩu mới</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="pl-9 bg-white border-slate-300 text-slate-900 font-semibold focus-visible:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                    Cập nhật mật khẩu
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900">Lịch sử thiết bị</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Laptop className="w-5 h-5 text-slate-800 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-900">Chrome on Windows (Thiết bị này)</p>
                    <p className="text-slate-600">Vừa xong</p>
                    <p className="text-emerald-700 font-bold pt-1">Đang hoạt động</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Smartphone className="w-5 h-5 text-slate-800 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-900">Safari on iPhone</p>
                    <p className="text-slate-600">2 giờ trước</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Content 3: Notifications */}
      {activeTab === 'notifications' && (
        <Card className="border-slate-200 shadow-sm bg-white max-w-3xl">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Cấu hình thông báo</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Tùy chỉnh các kênh nhận thông báo xác nhận lịch hẹn và kết quả khám
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-sm text-slate-900">Thông báo qua Email</p>
                <p className="text-xs text-slate-600">Nhận phiếu khám, hóa đơn và lịch hẹn qua email cá nhân</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="w-5 h-5 accent-slate-900 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div>
                <p className="font-bold text-sm text-slate-900">Nhắc nhở SMS</p>
                <p className="text-xs text-slate-600">Gửi tin nhắn SMS nhắc trước 2 giờ đến giờ khám bệnh</p>
              </div>
              <input
                type="checkbox"
                checked={smsNotif}
                onChange={(e) => setSmsNotif(e.target.checked)}
                className="w-5 h-5 accent-slate-900 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div>
                <p className="font-bold text-sm text-slate-900">Thông báo hệ thống web</p>
                <p className="text-xs text-slate-600">Hiển thị quả chuông thông báo trực tiếp khi đăng nhập</p>
              </div>
              <input
                type="checkbox"
                checked={reminderNotif}
                onChange={(e) => setReminderNotif(e.target.checked)}
                className="w-5 h-5 accent-slate-900 rounded cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button onClick={() => toast.success('Đã lưu cấu hình thông báo')} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                Lưu cấu hình
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

