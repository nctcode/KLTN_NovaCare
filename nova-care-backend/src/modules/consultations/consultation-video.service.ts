import { BadRequestException, ForbiddenException, Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class ConsultationVideoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsultationVideoService.name);
  private timer?: ReturnType<typeof setInterval>;
  private reconciling = false;
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService, private readonly audit: AuditLogService) {}

  isConfigured() {
    return this.config.get('LIVEKIT_ENABLED') === 'true'
      && /^wss:\/\/[^\s]+$/.test(this.config.get<string>('LIVEKIT_URL') || '')
      && Boolean(this.config.get('LIVEKIT_API_KEY') && this.config.get('LIVEKIT_API_SECRET'));
  }

  requireConfigured() {
    if (!this.isConfigured()) throw new ServiceUnavailableException('Tư vấn video chưa được cấu hình. Vui lòng liên hệ cơ sở y tế.');
  }

  private client() {
    this.requireConfigured();
    return new RoomServiceClient(this.config.get<string>('LIVEKIT_URL')!.replace(/^wss:/, 'https:'),
      this.config.get<string>('LIVEKIT_API_KEY'), this.config.get<string>('LIVEKIT_API_SECRET'));
  }

  private roomName(id: string) { return `novacare-consultation-${id}`; }

  async authorize(id: string, userId: string) {
    const session = await this.prisma.consultationSession.findUnique({
      where: { id }, include: { doctor: { include: { user: true } }, patientProfile: true, appointment: true },
    });
    if (!session || (session.doctor.userId !== userId && session.createdByUserId !== userId && session.patientProfile.userId !== userId)) {
      throw new ForbiddenException('Không có quyền tham gia phòng tư vấn này');
    }
    const now = Date.now();
    if (!session.videoEnabled || !['ACCEPTED', 'ACTIVE'].includes(session.status)
      || !session.scheduledStartAt || !session.scheduledEndAt
      || session.scheduledStartAt.getTime() > now || session.scheduledEndAt.getTime() <= now
      || !session.appointment || !['CONFIRMED', 'PAID'].includes(session.appointment.status)
      || !session.doctor.user?.isActive) {
      throw new BadRequestException('Phòng video chưa mở hoặc đã kết thúc. Cần bác sĩ tiếp nhận và đến đúng giờ hẹn.');
    }
    return session;
  }

  async join(id: string, userId: string) {
    const session = await this.authorize(id, userId);
    this.requireConfigured();
    const roomName = this.roomName(id);
    try {
      await this.client().createRoom({ name: roomName, maxParticipants: 2, emptyTimeout: 120, departureTimeout: 120 });
      // Check again after the external request in case the session was cancelled meanwhile.
      await this.authorize(id, userId);
      const ttl = Math.max(1, Math.min(120, Math.floor((session.scheduledEndAt!.getTime() - Date.now()) / 1000)));
      const token = new AccessToken(this.config.get<string>('LIVEKIT_API_KEY'), this.config.get<string>('LIVEKIT_API_SECRET'), {
        identity: userId, ttl,
        name: session.doctor.userId === userId ? 'Bác sĩ' : 'Người bệnh',
      });
      token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: false });
      await this.audit.logAction({ userId, action: 'CONSULTATION_VIDEO_JOIN_AUTHORIZED', entityType: 'ConsultationSession', entityId: id });
      return { serverUrl: this.config.get<string>('LIVEKIT_URL'), participantToken: await token.toJwt(), roomName,
        consultationId: id, endsAt: session.scheduledEndAt, tokenExpiresAt: new Date(Date.now() + ttl * 1000) };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      throw new ServiceUnavailableException('Không thể kết nối dịch vụ video. Vui lòng thử lại.');
    }
  }

  async close(id: string) {
    if (!this.isConfigured()) return;
    const client = this.client();
    const name = this.roomName(id);
    const rooms = await client.listRooms([name]);
    if (rooms.length) await client.deleteRoom(name);
  }

  async webhook(body: string, authorization?: string) {
    this.requireConfigured();
    let event;
    try {
      event = await new WebhookReceiver(this.config.get<string>('LIVEKIT_API_KEY')!, this.config.get<string>('LIVEKIT_API_SECRET')!)
        .receive(body, authorization);
    } catch { throw new ForbiddenException('Webhook không hợp lệ'); }
    const roomName = event.room?.name;
    const prefix = 'novacare-consultation-';
    if (!roomName?.startsWith(prefix)) return;
    const id = roomName.slice(prefix.length);
    const userId = event.participant?.identity;
    if (event.event === 'participant_joined' && userId) {
      try { await this.authorize(id, userId); }
      catch { await this.client().removeParticipant(roomName, userId); return; }
      // Events are informational: disconnect is never interpreted as completion.
      // Audit entries are deduplicated by LiveKit's event ID on redelivery.
      const exists = await this.prisma.auditLog.findFirst({ where: { action: 'CONSULTATION_VIDEO_JOINED', entityId: event.id } });
      if (!exists) await this.audit.logAction({ userId, action: 'CONSULTATION_VIDEO_JOINED', entityType: 'LiveKitEvent', entityId: event.id,
        newValue: { consultationId: id } });
    }
  }

  onModuleInit() {
    // Reconcile against DB after restart too; token expiry alone does not end a connected call.
    this.timer = setInterval(() => void this.reconcile(), 30_000);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async reconcile() {
    if (!this.isConfigured() || this.reconciling) return;
    this.reconciling = true;
    try {
      const rooms = await this.client().listRooms();
      for (const room of rooms.filter(r => r.name.startsWith('novacare-consultation-'))) {
        const id = room.name.slice('novacare-consultation-'.length);
        const session = await this.prisma.consultationSession.findUnique({ where: { id }, include: { appointment: true, doctor: { include: { user: true } } } });
        if (!session || !session.videoEnabled || !['ACCEPTED', 'ACTIVE'].includes(session.status)
          || !session.scheduledEndAt || session.scheduledEndAt.getTime() <= Date.now()
          || !session.appointment || !['CONFIRMED', 'PAID'].includes(session.appointment.status)
          || !session.doctor.user?.isActive) await this.client().deleteRoom(room.name);
      }
    } catch { this.logger.warn('LiveKit room reconciliation failed; will retry.'); }
    finally { this.reconciling = false; }
  }
}
