'use client';

import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Check, Clock3, DoorOpen, Loader2, Moon, Stethoscope } from 'lucide-react';
import { afterHoursService } from '@/services/after-hours.service';
import { Button } from '@/components/ui/button';
import { Hospital, Specialty, Doctor, MedicalService } from '@/types';
import { ClinicRoom } from './RoomSelectModal';

interface Props {
  hospital: Hospital;
  selectedSpecialty: Specialty | null;
  setSelectedSpecialty: (value: Specialty | null) => void;
  selectedRoom: ClinicRoom | null;
  setSelectedRoom: (value: ClinicRoom | null) => void;
  setSelectedDoctor: (value: Doctor | null) => void;
  selectedService: MedicalService | null;
  setSelectedService: (value: MedicalService | null) => void;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  selectedSlotId: string | null;
  setSelectedSlotId: (value: string | null) => void;
  selectedSlotTime: string;
  setSelectedSlotTime: (value: string) => void;
  onNext: () => void;
}

const currency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
const timeLabel = (start: string, end: string) => `${new Date(start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} – ${new Date(end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

export function AfterHoursBookingStep(props: Props) {
  const { data: sessions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['after-hours-catalog', props.hospital.id],
    queryFn: () => afterHoursService.getCatalog(props.hospital.id),
  });
  const specialties = useMemo(() => Array.from(new Map(sessions.map((item: any) => [item.service.specialty.id, item.service.specialty])).values()) as Specialty[], [sessions]);
  const specialtySessions = sessions.filter((item: any) => item.service.specialty.id === props.selectedSpecialty?.id);
  const rooms = Array.from(new Map(specialtySessions.map((item: any) => [item.room.id, item.room])).values()) as any[];
  const roomSessions = specialtySessions.filter((item: any) => item.room.id === props.selectedRoom?.id);
  const dates = Array.from(new Set(roomSessions.map((item: any) => item.slot.startTime.slice(0, 10)))).sort() as string[];
  const timeSessions = roomSessions.filter((item: any) => item.slot.startTime.slice(0, 10) === props.selectedDate);

  useEffect(() => {
    if (specialties.length === 1 && !props.selectedSpecialty) props.setSelectedSpecialty(specialties[0]);
  }, [specialties, props]);
  useEffect(() => {
    const service = specialtySessions[0]?.service;
    if (service && props.selectedService?.id !== service.id) props.setSelectedService(service);
  }, [props.selectedSpecialty?.id, specialtySessions, props]);

  const selectSpecialty = (item: Specialty) => {
    props.setSelectedSpecialty(item); props.setSelectedRoom(null); props.setSelectedDoctor(null);
    props.setSelectedDate(''); props.setSelectedSlotId(null); props.setSelectedSlotTime('');
  };
  const selectRoom = (room: any) => {
    props.setSelectedRoom({ id: room.id, roomNumber: room.code, name: room.name, floor: '', zone: '', specialtyId: room.specialtyId, status: 'AVAILABLE', capacityPerSession: 1 });
    props.setSelectedDate(''); props.setSelectedSlotId(null); props.setSelectedSlotTime('');
  };
  const selectSlot = (session: any) => {
    props.setSelectedSlotId(session.slot.id);
    props.setSelectedSlotTime(timeLabel(session.slot.startTime, session.slot.endTime));
    props.setSelectedDoctor(session.slot.doctorWorkplace?.doctor || null);
  };

  if (isLoading) return <div className="flex justify-center p-16"><Loader2 className="animate-spin text-emerald-600"/></div>;
  if (isError) return <div className="rounded-2xl border p-8 text-center"><p>Không thể tải lịch khám ngoài giờ.</p><Button className="mt-3" onClick={()=>refetch()}>Thử lại</Button></div>;
  if (!sessions.length) return <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center"><CalendarDays className="mx-auto h-10 w-10 text-slate-300"/><h3 className="mt-3 font-bold">Cơ sở chưa có lịch khám ngoài giờ còn chỗ</h3><p className="text-sm text-slate-500">Vui lòng chọn cơ sở hoặc hình thức khác.</p></div>;

  return <div className="space-y-5">
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-3"><Moon className="text-emerald-700"/><div><h2 className="font-bold">Khám ngoài giờ</h2><p className="text-sm text-emerald-800">{props.hospital.name} · Thứ bảy và chủ nhật · {currency(270000)}</p></div></div></div>
    <Choice title="1. Chọn chuyên khoa" icon={<Stethoscope className="h-5 w-5"/>}>{specialties.map((item)=><ChoiceButton key={item.id} selected={props.selectedSpecialty?.id===item.id} onClick={()=>selectSpecialty(item)}>{item.name}</ChoiceButton>)}</Choice>
    {props.selectedSpecialty && <Choice title="2. Dịch vụ" icon={<Moon className="h-5 w-5"/>}><ChoiceButton selected>{props.selectedService?.name || 'Khám dịch vụ ngoài giờ'}<span className="block text-xs text-slate-500">Giá chung: {currency(270000)}</span></ChoiceButton></Choice>}
    {props.selectedSpecialty && <Choice title="3. Chọn phòng khám" icon={<DoorOpen className="h-5 w-5"/>}>{rooms.map((room:any)=><ChoiceButton key={room.id} selected={props.selectedRoom?.id===room.id} onClick={()=>selectRoom(room)}>{room.code} · {room.name}</ChoiceButton>)}</Choice>}
    {props.selectedRoom && <Choice title="4. Chọn ngày khám" icon={<CalendarDays className="h-5 w-5"/>}>{dates.map((date)=><ChoiceButton key={date} selected={props.selectedDate===date} onClick={()=>{props.setSelectedDate(date);props.setSelectedSlotId(null);props.setSelectedSlotTime('')}}>{dateLabel(date)}</ChoiceButton>)}</Choice>}
    {props.selectedDate && <Choice title="5. Chọn giờ khám" icon={<Clock3 className="h-5 w-5"/>}><div className="grid gap-2 sm:grid-cols-3">{timeSessions.map((session:any)=><ChoiceButton key={session.id} selected={props.selectedSlotId===session.slot.id} onClick={()=>selectSlot(session)}>{timeLabel(session.slot.startTime, session.slot.endTime)}<span className="block text-xs text-slate-500">Còn {session.slot.capacity-session.slot.bookedCount} chỗ</span></ChoiceButton>)}</div></Choice>}
    <div className="flex justify-end"><Button disabled={!props.selectedSlotId} onClick={props.onNext} className="h-12 rounded-xl bg-emerald-700 px-8 font-bold hover:bg-emerald-800">Tiếp tục</Button></div>
  </div>;
}

function Choice({ title, icon, children }: { title:string; icon:ReactNode; children:ReactNode }) { return <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5"><h3 className="flex items-center gap-2 font-bold text-slate-900"><span className="text-emerald-700">{icon}</span>{title}</h3><div className="grid gap-2">{children}</div></section>; }
function ChoiceButton({ selected=false, onClick, children }: { selected?:boolean; onClick?:()=>void; children:ReactNode }) { return <button type="button" onClick={onClick} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm font-semibold ${selected?'border-emerald-600 bg-emerald-50 text-emerald-900':'border-slate-200 bg-white hover:border-emerald-300'}`}><span>{children}</span>{selected&&<Check className="h-4 w-4 text-emerald-700"/>}</button>; }
