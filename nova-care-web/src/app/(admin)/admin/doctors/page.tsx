'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  UserCheck,
  Search,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    qualification: 'Bác sĩ Chuyên khoa I',
    experience: '8 năm kinh nghiệm',
    bio: '',
  });

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider'
    : 'bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-doctors', page, search],
    queryFn: () => adminService.getDoctors({ page, limit: 10, search }),
  });

  const createMutation = useMutation({
    mutationFn: (newDoc: any) => adminService.createDoctor(newDoc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      setShowModal(false);
      setFormData({ fullName: '', qualification: 'Bác sĩ Chuyên khoa I', experience: '8 năm kinh nghiệm', bio: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) return;
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <UserCheck className="w-6 h-6 text-[#0c4b39] dark:text-[#66FF33]" />
            Quản Lý Danh Mục Bác Sĩ
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Thêm mới, chỉnh sửa thông tin bác sĩ, trình độ chuyên môn và nơi làm việc.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs px-5 py-2 rounded-xl flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Bác Sĩ Mới
        </Button>
      </div>

      {/* Search Bar */}
      <Card className={`${cardStyle} p-4`}>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Tìm theo Tên bác sĩ hoặc Trình độ chuyên môn..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={`pl-9 text-xs rounded-xl ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'}`}
          />
        </div>
      </Card>

      {/* Doctors Table */}
      <Card className={`${cardStyle} overflow-hidden`}>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-[#0c4b39] animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className={tableHeaderStyle}>
                <tr>
                  <th className="p-4">Bác Sĩ</th>
                  <th className="p-4">Trình độ & Kinh nghiệm</th>
                  <th className="p-4">Cơ sở làm việc & Chuyên khoa</th>
                  <th className="p-4">Đánh giá</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">
                      Chưa có thông tin bác sĩ nào trong hệ thống
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((doc: any) => (
                    <tr key={doc.id} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}`}>
                      <td className={`p-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-black flex items-center justify-center text-sm shrink-0 border ${
                            isLight ? 'bg-emerald-50 border-emerald-200 text-[#0c4b39]' : 'bg-emerald-950 border-emerald-800 text-[#66FF33]'
                          }`}>
                            {doc.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className={`font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{doc.fullName}</p>
                            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{doc.bio || 'Chưa có mô tả tiểu sử'}</p>
                          </div>
                        </div>
                      </td>
                      <td className={isLight ? 'p-4 text-slate-700' : 'p-4 text-slate-300'}>
                        <div className="font-semibold text-emerald-600">{doc.qualification}</div>
                        <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{doc.experience || 'Chưa cập nhật'}</div>
                      </td>
                      <td className={`p-4 max-w-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {doc.workPlaces?.length === 0 ? (
                          <span className="text-slate-500 italic">Chưa phân công cơ sở</span>
                        ) : (
                          doc.workPlaces?.map((wp: any) => (
                            <div key={wp.id} className="text-[11px] font-medium">
                              🏥 <strong>{wp.hospital?.name}</strong> ({wp.specialty?.name})
                            </div>
                          ))
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${
                          isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          ⭐ {doc.rating || 5.0} ({doc.reviewCount || 0} đánh giá)
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(doc.id)}
                          className={`text-xs font-bold rounded-xl ${
                            isLight ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'border-rose-900 text-rose-400 hover:bg-rose-950'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Modal Create Doctor */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0c4b39]" /> Thêm Bác Sĩ Mới
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Họ và Tên Bác sĩ *</label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Bác sĩ Nguyễn Văn C"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}
                />
              </div>

              <div>
                <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Trình độ chuyên môn</label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Tiến sĩ Bác sĩ Chuyên khoa II"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className={isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}
                />
              </div>

              <div>
                <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Kinh nghiệm công tác</label>
                <Input
                  type="text"
                  placeholder="Ví dụ: 10 năm kinh nghiệm tại BV Chợ Rẫy"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className={isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}
                />
              </div>

              <div>
                <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Tiểu sử & Giới thiệu</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả tóm tắt kinh nghiệm làm việc và thành tựu..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#0c4b39] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-slate-300 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-extrabold rounded-xl px-5"
                >
                  {createMutation.isPending ? 'Đang lưu...' : 'Lưu bác sĩ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className={`flex items-center justify-between p-4 rounded-xl border text-xs ${
          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <span>
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} bác sĩ)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className={isLight ? 'border-slate-300 text-slate-800 rounded-xl' : 'border-slate-800 text-white rounded-xl'}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className={isLight ? 'border-slate-300 text-slate-800 rounded-xl' : 'border-slate-800 text-white rounded-xl'}
            >
              Trang sau <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
