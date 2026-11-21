'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, DoorOpen, Loader2, Moon, Plus, Save, Stethoscope, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services/admin.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type RoomMode = 'SERVICE' | 'AFTER_HOURS';
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));

export default function ClinicRoomManagementPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';
  const [hospitalId, setHospitalId] = useState(isHospitalAdmin ? user?.hospitalId || '' : '');
  const [mode, setMode] = useState<RoomMode>('SERVICE');
  const [enabledIds, setEnabledIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [roomForm, setRoomForm] = useState({ specialtyId: '', code: '', name: '' });
  const [sessionForm, setSessionForm] = useState({ specialtyId: '', medicalServiceId: '', roomId: '', slotId: '', capacity: 1 });

  const { data: hospitalsData } = useQuery({
    queryKey: ['clinic-room-hospitals'],
    queryFn: () => adminService.getHospitals({ limit: 100 }),
    enabled: !isHospitalAdmin,
  });
  const hospitals = hospitalsData?.items || (Array.isArray(hospitalsData) ? hospitalsData : []);
  useEffect(() => {
    if (!isHospitalAdmin && !hospitalId && hospitals.length) setHospitalId(hospitals[0].id);
  }, [hospitalId, hospitals, isHospitalAdmin]);

  const queryKey = ['clinic-room-management', hospitalId, mode];
  const { data: config, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminService.getClinicRoomManagement(hospitalId, mode),
    enabled: !!hospitalId,
  });
  useEffect(() => {
    if (config?.specialties) setEnabledIds(config.specialties.filter((item: any) => item.enabled).map((item: any) => item.id));
    setRoomForm({ specialtyId: '', code: '', name: '' });
    setSessionForm({ specialtyId: '', medicalServiceId: '', roomId: '', slotId: '', capacity: 1 });
  }, [config, mode]);

  const enabledSpecialties = useMemo(
    () => (config?.specialties || []).filter((item: any) => mode === 'SERVICE' || enabledIds.includes(item.id)),
    [config, enabledIds, mode],
  );
  const filteredServices = (config?.services || []).filter((item: any) => item.specialtyId === sessionForm.specialtyId);
  const filteredRooms = (config?.rooms || []).filter((item: any) => item.specialtyId === sessionForm.specialtyId);
  const filteredSlots = (config?.candidateSlots || []).filter((item: any) =>
    item.doctorWorkplace?.specialtyId === sessionForm.specialtyId && item.compatibleServiceIds?.includes(sessionForm.medicalServiceId),
  );

  const reload = async () => queryClient.invalidateQueries({ queryKey });
  const saveSpecialties = async () => {
    setSaving(true);
    try {
      await adminService.saveAfterHoursSpecialties(hospitalId, enabledIds);
      toast.success('Đã lưu chuyên khoa được phép khám ngoài giờ');
      await reload();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Không thể lưu cấu hình'); }
    finally { setSaving(false); }
  };
  const createRoom = async () => {
    if (!roomForm.specialtyId || !roomForm.code.trim() || !roomForm.name.trim()) return toast.error('Vui lòng nhập đủ chuyên khoa, mã và tên phòng');
    setSaving(true);
    try {
      await adminService.createClinicRoom({ hospitalId, ...roomForm, code: roomForm.code.trim(), name: roomForm.name.trim() });
      setRoomForm({ specialtyId: '', code: '', name: '' });
      toast.success('Đã tạo phòng khám thực tế');
      await reload();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Không thể tạo phòng khám'); }
    finally { setSaving(false); }
  };
  const assignSession = async () => {
    const { specialtyId: _specialtyId, ...payload } = sessionForm;
    if (!payload.medicalServiceId || !payload.roomId || !payload.slotId) return toast.error('Vui lòng chọn đủ dịch vụ, phòng khám và khung giờ');
    setSaving(true);
    try {
      await adminService.assignClinicRoomSession({ ...payload, mode });
      setSessionForm({ specialtyId: '', medicalServiceId: '', roomId: '', slotId: '', capacity: 1 });
      toast.success(mode === 'SERVICE' ? 'Đã phân phòng cho dịch vụ' : 'Đã mở ca khám ngoài giờ');
      await reload();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Không thể phân phòng khám'); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
      <div><h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white"><DoorOpen className="h-5 w-5 text-emerald-600"/>Quản lý phòng khám & dịch vụ</h1><p className="mt-1 text-sm text-slate-500">Phân phòng và khung giờ thực tế cho khám dịch vụ hoặc khám ngoài giờ.</p></div>
      {!isHospitalAdmin && <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="">Chọn bệnh viện</option>{hospitals.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
    </div>

    <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5">
      <Button className="flex-1" variant={mode === 'SERVICE' ? 'default' : 'ghost'} onClick={() => setMode('SERVICE')}><Stethoscope className="mr-2 h-4 w-4"/>Khám dịch vụ</Button>
      <Button className="flex-1" variant={mode === 'AFTER_HOURS' ? 'default' : 'ghost'} onClick={() => setMode('AFTER_HOURS')}><Moon className="mr-2 h-4 w-4"/>Khám ngoài giờ</Button>
    </div>

    {!hospitalId ? <p className="rounded-2xl border border-dashed p-10 text-center text-slate-500">Chọn bệnh viện để quản lý.</p> : isLoading ? <div className="flex justify-center p-16"><Loader2 className="animate-spin text-emerald-600"/></div> : <>
      {mode === 'AFTER_HOURS' && <Card><CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between"><div><h2 className="font-bold">Chuyên khoa được khám ngoài giờ</h2><p className="text-xs text-slate-500">Mobile chỉ hiển thị các chuyên khoa được bật và có ca phòng thực tế.</p></div><Button onClick={saveSpecialties} disabled={saving}><Save className="mr-2 h-4 w-4"/>Lưu</Button></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(config?.specialties || []).map((item: any) => { const checked = enabledIds.includes(item.id); return <button key={item.id} onClick={() => setEnabledIds((old) => checked ? old.filter((id) => id !== item.id) : [...old, item.id])} className={`flex items-center justify-between rounded-xl border p-3 text-left text-sm ${checked ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white'}`}><span>{item.name}</span>{checked && <Check className="h-4 w-4"/>}</button>; })}</div>
      </CardContent></Card>}

      <Card><CardContent className="space-y-4 p-5">
        <div><h2 className="font-bold">Danh mục phòng khám thực tế</h2><p className="text-xs text-slate-500">Phòng được lưu trong cơ sở dữ liệu và dùng chung đúng chuyên khoa.</p></div>
        <div className="grid gap-3 md:grid-cols-4">
          <select value={roomForm.specialtyId} onChange={(e) => setRoomForm({...roomForm, specialtyId:e.target.value})} className="h-10 rounded-xl border px-3 text-sm"><option value="">Chọn chuyên khoa</option>{enabledSpecialties.map((item:any)=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <Input placeholder="Mã phòng, ví dụ TM-01" value={roomForm.code} onChange={(e)=>setRoomForm({...roomForm,code:e.target.value})}/>
          <Input placeholder="Tên phòng khám" value={roomForm.name} onChange={(e)=>setRoomForm({...roomForm,name:e.target.value})}/>
          <Button onClick={createRoom} disabled={saving}><Plus className="mr-2 h-4 w-4"/>Thêm phòng</Button>
        </div>
        <div className="flex flex-wrap gap-2">{(config?.rooms || []).map((room:any)=><span key={room.id} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold"><DoorOpen className="mr-1 inline h-3.5 w-3.5 text-emerald-600"/>{room.code} · {room.name}</span>)}</div>
      </CardContent></Card>

      <Card><CardContent className="space-y-4 p-5">
        <div><h2 className="font-bold">Phân dịch vụ, phòng khám và ca khám</h2><p className="text-xs text-slate-500">Chọn tuần tự chuyên khoa → dịch vụ → phòng khám → khung giờ thực tế.</p></div>
        <div className="grid gap-3 lg:grid-cols-5">
          <select value={sessionForm.specialtyId} onChange={(e)=>setSessionForm({...sessionForm,specialtyId:e.target.value,medicalServiceId:'',roomId:'',slotId:''})} className="h-10 rounded-xl border px-3 text-sm"><option value="">1. Chuyên khoa</option>{enabledSpecialties.map((item:any)=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select disabled={!sessionForm.specialtyId} value={sessionForm.medicalServiceId} onChange={(e)=>setSessionForm({...sessionForm,medicalServiceId:e.target.value,roomId:'',slotId:''})} className="h-10 rounded-xl border px-3 text-sm disabled:bg-slate-100"><option value="">2. Dịch vụ</option>{filteredServices.map((item:any)=><option key={item.id} value={item.id}>{item.name} · {money(Number(item.price))}</option>)}</select>
          <select disabled={!sessionForm.medicalServiceId} value={sessionForm.roomId} onChange={(e)=>setSessionForm({...sessionForm,roomId:e.target.value,slotId:''})} className="h-10 rounded-xl border px-3 text-sm disabled:bg-slate-100"><option value="">3. Phòng khám</option>{filteredRooms.map((item:any)=><option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select>
          <select disabled={!sessionForm.roomId} value={sessionForm.slotId} onChange={(e)=>setSessionForm({...sessionForm,slotId:e.target.value})} className="h-10 rounded-xl border px-3 text-sm disabled:bg-slate-100"><option value="">4. Khung giờ</option>{filteredSlots.map((item:any)=><option key={item.id} value={item.id}>{dateTime(item.startTime)} · {item.doctorWorkplace?.doctor?.fullName}</option>)}</select>
          <Button onClick={assignSession} disabled={saving || !sessionForm.slotId}>Phân phòng</Button>
        </div>
        <div className="space-y-2">{(config?.sessions || []).map((session:any)=><div key={session.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm"><div><p className="font-semibold">{session.service?.specialty?.name} · {session.service?.name}</p><p className="text-xs text-slate-500">{session.room?.code} · {session.room?.name} · {dateTime(session.slot?.startTime)}</p></div><Button variant="outline" size="sm" onClick={async()=>{await adminService.deleteAfterHoursSession(session.id);toast.success('Đã xóa phân phòng');await reload();}}><Trash2 className="h-4 w-4 text-red-500"/></Button></div>)}</div>
      </CardContent></Card>
    </>}
  </div>;
}
