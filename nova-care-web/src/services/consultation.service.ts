import { apiClient } from '@/lib/api-client';

export interface ConsultationSession {
  id: string;
  status: string;
  topic: string;
  description: string;
  videoEnabled: boolean;
  scheduledStartAt: string;
  scheduledEndAt: string;
  doctor: { userId: string; fullName: string };
  patientProfile: { fullName: string };
  doctorWorkplace: { specialty: { name: string } };
}
export interface ConsultationMessage {
  id: string; senderUserId: string; senderType: string; text?: string; sentAt: string;
  attachments?: { id: string; fileName: string }[];
}
export interface VideoAccess { serverUrl: string; participantToken: string; endsAt: string }
type Response<T> = { data: T };
export const consultationService = {
  list: (cursor?: string) => apiClient.get<Response<{ items: ConsultationSession[]; nextCursor: string | null }>>('/consultations', { params: { cursor } }),
  detail: (id: string) => apiClient.get<Response<ConsultationSession>>(`/consultations/${id}`),
  transition: (id: string, action: string) => apiClient.patch<Response<ConsultationSession>>(`/consultations/${id}/${action}`),
  join: (id: string) => apiClient.post<Response<VideoAccess>>(`/consultation-video/${id}/join`),
  messages: (id: string, before?: string) => apiClient.get<Response<{ items: ConsultationMessage[]; nextCursor: string | null }>>(`/consultations/${id}/messages`, { params: { before } }),
  send: (id: string, text: string, clientMessageId: string) => apiClient.post<Response<ConsultationMessage>>(`/consultations/${id}/messages`, { text, clientMessageId }),
};
export const consultationStatus: Record<string, string> = {
  SCHEDULED: 'Đã đặt lịch', WAITING: 'Chờ bác sĩ', ACCEPTED: 'Đã tiếp nhận', ACTIVE: 'Đang tư vấn',
  COMPLETED: 'Đã kết thúc', CANCELLED: 'Đã hủy', EXPIRED: 'Đã hết hạn',
};
