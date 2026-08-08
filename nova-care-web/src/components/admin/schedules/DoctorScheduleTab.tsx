'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DoctorScheduleDialog } from './DoctorScheduleDialog';
import {
  Calendar,
  Plus,
  Search,
  Building2,
  Stethoscope,
  Clock,
  Loader2,
  Edit,
  Power,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const DAY_NAMES: Record<number, string> = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  0: 'Chủ Nhật',
};

export function DoctorScheduleTab() {
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [search, setSearch] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const cardStyle = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tableHeaderStyle = isLight
    ? 'bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider'
    : 'bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider';

  // Fetch Hospitals for filter dropdown
  const { data: hospitalsData } = useQuery({
    queryKey: ['admin-hospitals-filter-schedules'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
  });

  // Fetch Specialties for filter dropdown
  const { data: specialtiesData } = useQuery({
    queryKey: ['admin-specialties-filter-schedules'],
    queryFn: () => adminService.getSpecialties({ limit: 100 }),
  });

  // Fetch Doctor Schedules list
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['admin-doctor-schedules', search, hospitalId, branchId, specialtyId, statusFilter],
    queryFn: () =>
      adminService.getDoctorSchedules({
        search,
        hospitalId,
        branchId,
        specialtyId,
        isActive: statusFilter,
      }),
  });

  // Toggle active / inactive mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, currentActive }: { id: string; currentActive: boolean }) => {
      return adminService.updateDoctorSchedule(id, { isActive: !currentActive });
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái lịch làm việc thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể thay đổi trạng thái');
    },
  });

  const handleOpenAdd = () => {
    setSelectedSchedule(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sched: any) => {
    setSelectedSchedule(sched);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Subheader */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-[#66FF33]" />
            Quản lý lịch làm việc
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Quản lý thời gian làm việc định kỳ của bác sĩ tại từng bệnh viện và cơ sở.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="rounded-xl font-bold bg-[#0c4b39] hover:bg-[#083629] text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm text-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm lịch làm việc
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <Card className={`${cardStyle} p-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Doctor */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="🔍 Tìm bác sĩ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 text-xs rounded-xl ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'
              }`}
            />
          </div>

          {/* Hospital Select */}
          <select
            value={hospitalId}
            onChange={(e) => {
              setHospitalId(e.target.value);
              setBranchId('');
            }}
            className={`border text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <option value="">Bệnh viện ▼ (Tất cả)</option>
            {hospitalsData?.items?.map((h: any) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Specialty Select */}
          <select
            value={specialtyId}
            onChange={(e) => setSpecialtyId(e.target.value)}
            className={`border text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <option value="">Chuyên khoa ▼ (Tất cả)</option>
            {specialtiesData?.items?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`border text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <option value="">Trạng thái ▼ (Tất cả)</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã tắt</option>
          </select>

          {/* Reset Filters */}
          {(search || hospitalId || branchId || specialtyId || statusFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setHospitalId('');
                setBranchId('');
                setSpecialtyId('');
                setStatusFilter('');
              }}
              className={`rounded-xl text-xs ${isLight ? 'border-slate-300 text-slate-700' : 'border-slate-800 text-slate-300'}`}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </Card>

      {/* Table List */}
      <Card className={`${cardStyle} overflow-hidden`}>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className={tableHeaderStyle}>
                <tr>
                  <th className="p-4">Bác sĩ</th>
                  <th className="p-4">Bệnh viện</th>
                  <th className="p-4">Cơ sở</th>
                  <th className="p-4">Chuyên khoa</th>
                  <th className="p-4">Ngày làm việc</th>
                  <th className="p-4">Giờ làm việc</th>
                  <th className="p-4">Nghỉ giữa ca</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {!schedules || schedules.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-slate-400" />
                        <span>Chưa có lịch làm việc phù hợp với bộ lọc hiện tại.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  schedules.map((sched: any) => {
                    const wp = sched.doctorWorkplace;
                    const doc = wp?.doctor;
                    const hosp = wp?.hospital;
                    const branch = wp?.branch;
                    const spec = wp?.specialty;

                    return (
                      <tr key={sched.id} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}`}>
                        {/* Doctor Name */}
                        <td className={`p-4 font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <div>{doc?.title ? `${doc.title} ` : 'BS. '}{doc?.fullName || 'N/A'}</div>
                          <div className="text-[11px] font-normal text-slate-500">{doc?.qualification}</div>
                        </td>

                        {/* Hospital */}
                        <td className={`p-4 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{hosp?.name || 'N/A'}</span>
                          </div>
                        </td>

                        {/* Branch */}
                        <td className={`p-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{branch?.name || branch?.address || 'Cơ sở chính'}</span>
                          </div>
                        </td>

                        {/* Specialty */}
                        <td className={`p-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          <div className="flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>{spec?.name || 'N/A'}</span>
                          </div>
                        </td>

                        {/* Day of Week */}
                        <td className="p-4 font-bold text-emerald-600 dark:text-[#66FF33]">
                          {DAY_NAMES[sched.dayOfWeek] || `Thứ ${sched.dayOfWeek}`}
                        </td>

                        {/* Working Hours */}
                        <td className={`p-4 font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {sched.startTime} - {sched.endTime}
                            </span>
                          </div>
                        </td>

                        {/* Break Time */}
                        <td className={`p-4 font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {sched.breakStart && sched.breakEnd ? (
                            <span>{sched.breakStart} - {sched.breakEnd}</span>
                          ) : (
                            <span className="text-slate-400 italic">Không nghỉ</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                              sched.isActive
                                ? isLight
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-emerald-950 text-[#66FF33] border-emerald-800'
                                : isLight
                                ? 'bg-slate-100 text-slate-600 border-slate-300'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {sched.isActive ? 'Hoạt động' : 'Tắt'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right space-x-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(sched)}
                            className={`text-xs font-bold rounded-xl ${
                              isLight ? 'border-slate-300 text-slate-800 hover:bg-slate-100' : 'border-slate-800 text-white hover:bg-slate-900'
                            }`}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1 text-blue-500" /> Sửa
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={toggleMutation.isPending}
                            onClick={() =>
                              toggleMutation.mutate({ id: sched.id, currentActive: sched.isActive })
                            }
                            className={`text-xs font-bold rounded-xl ${
                              sched.isActive
                                ? isLight
                                  ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                  : 'border-amber-800 text-amber-400 hover:bg-amber-950'
                                : isLight
                                ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                : 'border-emerald-800 text-[#66FF33] hover:bg-emerald-950'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5 mr-1" />
                            {sched.isActive ? 'Tắt' : 'Bật'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit DoctorSchedule */}
      <DoctorScheduleDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        scheduleToEdit={selectedSchedule}
      />
    </div>
  );
}
