'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Package,
  Search,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  X,
} from 'lucide-react';

export default function AdminHealthPackagesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 1500000,
    duration: 90,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-health-packages', page, search],
    queryFn: () => adminService.getHealthPackages({ page, limit: 10, search }),
  });

  const createMutation = useMutation({
    mutationFn: (newPkg: any) => adminService.createHealthPackage(newPkg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-health-packages'] });
      setShowModal(false);
      setFormData({ name: '', description: '', price: 1500000, duration: 90 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteHealthPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-health-packages'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[#66FF33]" />
            Quản Lý Gói Khám Sức Khỏe
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tạo và quản lý các gói khám sức khỏe tổng quát, doanh nghiệp và tầm soát bệnh lý.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#66FF33] text-slate-950 hover:bg-[#52e622] font-extrabold text-xs px-5 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm Gói Khám Mới
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-sm p-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Tìm theo Tên gói khám hoặc Nội dung mô tả..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>
      </Card>

      {/* Packages Table */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-[#66FF33] animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Tên Gói Khám</th>
                  <th className="p-4">Bệnh Viện Cung Cấp</th>
                  <th className="p-4">Đơn Giá (VNĐ)</th>
                  <th className="p-4">Thời Gian Thực Hiện</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">
                      Chưa có gói khám sức khỏe nào trong hệ thống
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((pkg: any) => (
                    <tr key={pkg.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 font-black flex items-center justify-center text-sm shrink-0">
                            🎁
                          </div>
                          <div>
                            <p className="font-extrabold text-white">{pkg.name}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-sm">{pkg.description || 'Chưa có mô tả'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-semibold">
                        {pkg.hospital?.name || 'Áp dụng toàn hệ thống'}
                      </td>
                      <td className="p-4 font-extrabold text-[#66FF33]">
                        {Number(pkg.price || 0).toLocaleString()}đ
                      </td>
                      <td className="p-4 text-slate-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400" /> {pkg.duration || 60} phút
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(pkg.id)}
                          className="border-rose-900 text-rose-400 hover:bg-rose-950 text-xs font-bold rounded-xl"
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

      {/* Modal Create Package */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-[#66FF33]" /> Thêm Gói Khám Mới
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tên Gói Khám Sức Khỏe *</label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Gói Khám Sức Khỏe Tổng Quát Chuyên Sâu VIP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Giá gói khám (VNĐ)</label>
                <Input
                  type="number"
                  placeholder="1500000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Thời gian thực hiện (Phút)</label>
                <Input
                  type="number"
                  placeholder="90"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 60 })}
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Mô tả nội dung gói khám</label>
                <textarea
                  rows={3}
                  placeholder="Danh mục danh sách xét nghiệm, siêu âm, chụp X-quang bao gồm..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#66FF33]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-slate-800 text-slate-400 text-xs font-bold rounded-xl"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#66FF33] text-slate-950 hover:bg-[#52e622] text-xs font-extrabold rounded-xl px-5"
                >
                  {createMutation.isPending ? 'Đang lưu...' : 'Lưu gói khám'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
          <span>
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} gói)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-800 text-white rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className="border-slate-800 text-white rounded-xl"
            >
              Trang sau <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
