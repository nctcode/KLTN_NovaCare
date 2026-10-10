'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { consultationService, consultationStatus } from '@/services/consultation.service';
import { useAuthStore } from '@/stores/auth.store';

export default function ConsultationsPage() {
  const userId = useAuthStore(s => s.user?.id);
  const query = useInfiniteQuery({ queryKey: ['consultations', userId], initialPageParam: undefined as string | undefined, enabled: !!userId,
    queryFn: ({ pageParam }) => consultationService.list(pageParam), getNextPageParam: page => page.data.nextCursor ?? undefined });
  return <section className="space-y-5">
    <h1 className="text-2xl font-bold text-emerald-900">Tư vấn với bác sĩ</h1>
    <p>Quản lý phiên tư vấn, nhắn tin và tham gia video theo lịch hẹn.</p>
    {query.isPending && <p role="status">Đang tải cuộc tư vấn…</p>}
    {query.isError && <div role="alert">Không thể tải dữ liệu. <button onClick={() => query.refetch()}>Thử lại</button></div>}
    {query.data?.pages[0].data.items.length === 0 && <p>Chưa có phiên tư vấn. Tạo phiên từ lịch khám online đã được xác nhận trên ứng dụng NovaCare.</p>}
    {query.data?.pages.flatMap(p => p.data.items).map(session => <Link key={session.id} href={`/tu-van/${session.id}`}
      className="block rounded-2xl border border-emerald-100 bg-white p-5 hover:bg-emerald-50">
      <h2 className="font-bold">{session.doctor.fullName} · {session.doctorWorkplace.specialty.name}</h2>
      <p>{session.patientProfile.fullName}</p>
      <p>{new Date(session.scheduledStartAt).toLocaleString('vi-VN')} · {session.videoEnabled ? 'Video và chat' : 'Chat'}</p>
      <span className="text-emerald-800">{consultationStatus[session.status] || session.status}</span>
    </Link>)}
    {query.hasNextPage && <button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Xem thêm</button>}
  </section>;
}
