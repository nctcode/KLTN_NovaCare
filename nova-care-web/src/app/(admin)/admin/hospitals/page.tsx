'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Search,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  X,
} from 'lucide-react';

export default function AdminHospitalsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-hospitals', page, search],
    queryFn: () => adminService.getHospitals({ page, limit: 10, search }),
  });

  const createMutation = useMutation({
    mutationFn: (newHosp: any) => adminService.createHospital(newHosp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] });
      setShowModal(false);
      setFormData({ name: '', address: '', phone: '', email: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteHospital(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hospitals'] });
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
            <Building2 className="w-6 h-6 text-[#66FF33]" />
            Quản Lý Cơ Sở Y Tế & Bệnh Viện
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý thông tin bệnh viện liên thông, địa chỉ chi nhánh và dịch vụ cung cấp.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#66FF33] text-slate-950 hover:bg-[#52e622] font-extrabold text-xs px-5 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm Bệnh Viện Mới
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-sm p-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Tìm theo Tên bệnh viện, Địa chỉ hoặc Số điện thoại..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>
      </Card>

      {/* Hospitals Table */}
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
                  <th className="p-4">Tên Bệnh Viện / Cơ Sở</th>
                  <th className="p-4">Địa Chỉ & Liên Hệ</th>
                  <th className="p-4">Chi Nhánh & Dịch Vụ</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500 font-medium">
                      Chưa có bệnh viện nào trong hệ thống
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((hosp: any) => (
                    <tr key={hosp.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 text-blue-400 font-black flex items-center justify-center text-sm shrink-0">
                            🏥
                          </div>
                          <div>
                            <p className="font-extrabold text-white text-sm">{hosp.name}</p>
                            <p className="text-[11px] text-slate-400">{hosp.description || 'Nền tảng y tế uy tín'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        <div className="flex items-center gap-1 text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{hosp.address || 'Chưa cập nhật địa chỉ'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{hosp.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">
                        {hosp.branches?.length || 0} chi nhánh / {hosp.services?.length || 0} dịch vụ y tế
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(hosp.id)}
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

      {/* Modal Create Hospital */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#66FF33]" /> Thêm Bệnh Viện Mới
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tên Bệnh Viện / Cơ sở Y tế *</label>
                <Input
                  type="text"
                  required
                  placeholder="Ví dụ: Bệnh viện Đa khoa Quốc tế NovaCare"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Địa chỉ trụ sở chính</label>
                <Input
                  type="text"
                  placeholder="Ví dụ: 123 Đường Nguyễn Trãi, Quận 1, TP.HCM"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Số điện thoại liên hệ</label>
                <Input
                  type="text"
                  placeholder="Ví dụ: 1900 6789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email liên hệ</label>
                <Input
                  type="email"
                  placeholder="contact@novacarehospital.vn"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Mô tả giới thiệu</label>
                <textarea
                  rows={3}
                  placeholder="Giới thiệu quy mô, trang thiết bị kỹ thuật cao..."
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
                  {createMutation.isPending ? 'Đang lưu...' : 'Lưu cơ sở'}
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
            Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> (Tổng {data.total} bệnh viện)
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
