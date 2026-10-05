import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppointmentStatus,
  BookingType,
  ConsultationChannel,
  ConsultationMessageType,
  ConsultationRequestMode,
  ConsultationSenderType,
  ConsultationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const consultationInclude = Prisma.validator<Prisma.ConsultationSessionInclude>()({
  patientProfile: {
    select: { id: true, fullName: true, dateOfBirth: true, gender: true, relation: true, userId: true },
  },
  doctor: {
    select: { id: true, fullName: true, title: true, avatarUrl: true, userId: true },
  },
  doctorWorkplace: {
    select: {
      id: true,
      hospital: { select: { id: true, name: true, logoUrl: true } },
      specialty: { select: { id: true, name: true } },
    },
  },
  appointment: {
    select: {
      id: true,
      bookingCode: true,
      status: true,
      slot: { select: { id: true, startTime: true, endTime: true } },
    },
  },
});

type ConsultationWithAccess = Prisma.ConsultationSessionGetPayload<{
  include: typeof consultationInclude;
}>;

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditLogService,
  ) {}

  async create(userId: string, dto: CreateConsultationDto) {
    const duplicate = await this.prisma.consultationSession.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: consultationInclude,
    });
    if (duplicate) {
      if (duplicate.createdByUserId !== userId) throw new ConflictException('Khóa yêu cầu đã được sử dụng');
      return duplicate;
    }

    if (dto.requestMode !== ConsultationRequestMode.SCHEDULED) {
      throw new ServiceUnavailableException('Tư vấn ngay chưa được hỗ trợ vì chưa có trạng thái trực tuyến của bác sĩ');
    }
    if (dto.channel !== ConsultationChannel.CHAT) {
      throw new ServiceUnavailableException('Phiên gọi video chưa được hỗ trợ');
    }
    if (!dto.consentAccepted) throw new BadRequestException('Cần xác nhận chia sẻ thông tin với bác sĩ tư vấn');

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: dto.appointmentId, userId },
      include: {
        patientProfile: { select: { id: true, userId: true } },
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: { include: { user: { select: { id: true, isActive: true } } } },
                specialty: true,
              },
            },
          },
        },
      },
    });
    if (!appointment) throw new NotFoundException('Lịch tư vấn không tồn tại hoặc không thuộc tài khoản này');
    if (appointment.patientProfile.userId !== userId) throw new ForbiddenException('Không có quyền sử dụng hồ sơ bệnh nhân này');
    if (appointment.status !== AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.PAID) {
      throw new BadRequestException('Lịch tư vấn phải được xác nhận hoặc thanh toán trước khi tạo phiên');
    }

    const workplace = appointment.slot.doctorWorkplace;
    if (!workplace.doctor.userId || !workplace.doctor.user?.isActive) {
      throw new ServiceUnavailableException('Bác sĩ chưa có tài khoản tư vấn hợp lệ');
    }
    await this.assertOnlineSchedule(workplace.id, appointment.slot.startTime, appointment.slot.endTime);

    const existingForAppointment = await this.prisma.consultationSession.findUnique({
      where: { appointmentId: appointment.id },
      include: consultationInclude,
    });
    if (existingForAppointment) return existingForAppointment;

    const openBeforeMinutes = this.numberConfig('CONSULTATION_CHAT_OPEN_MINUTES_BEFORE', 0, 0, 1440);
    const chatOpenAt = new Date(appointment.slot.startTime.getTime() - openBeforeMinutes * 60_000);
    const session = await this.prisma.consultationSession.create({
      data: {
        patientProfileId: appointment.patientProfileId,
        doctorId: workplace.doctorId,
        doctorWorkplaceId: workplace.id,
        specialtyId: workplace.specialtyId,
        appointmentId: appointment.id,
        createdByUserId: userId,
        idempotencyKey: dto.idempotencyKey,
        requestMode: dto.requestMode,
        channel: dto.channel,
        status: ConsultationStatus.SCHEDULED,
        topic: dto.topic.trim(),
        description: dto.description.trim(),
        scheduledStartAt: appointment.slot.startTime,
        scheduledEndAt: appointment.slot.endTime,
        chatOpenAt,
        expiresAt: appointment.slot.endTime,
        videoEnabled: false,
      },
      include: consultationInclude,
    });

    await this.audit.logAction({
      userId,
      action: 'CONSULTATION_CREATED',
      entityType: 'ConsultationSession',
      entityId: session.id,
      newValue: { status: session.status, doctorId: session.doctorId, appointmentId: session.appointmentId },
    });
    await this.notifications.createNotification(
      workplace.doctor.userId,
      'Có yêu cầu tư vấn mới',
      'Bạn có một phiên tư vấn mới cần xem xét.',
      NotificationType.CONSULTATION_STATUS,
      { consultationId: session.id, route: 'consultation' },
    );
    return session;
  }

  async findAll(userId: string, cursor?: string, rawLimit?: number) {
    const limit = Math.min(Math.max(Number(rawLimit) || 20, 1), 50);
    const rows = await this.prisma.consultationSession.findMany({
      where: {
        OR: [
          { createdByUserId: userId },
          { patientProfile: { userId } },
          { doctor: { userId } },
        ],
      },
      include: {
        ...consultationInclude,
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { attachments: true } },
        _count: {
          select: { messages: { where: { senderUserId: { not: userId }, readAt: null } } },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: items.map(({ _count, ...item }) => ({ ...item, unreadCount: _count.messages })),
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }

  async findOne(id: string, userId: string) {
    return this.getAccessible(id, userId);
  }

  async accept(id: string, userId: string) {
    const session = await this.getDoctorSession(id, userId);
    this.requireStatus(session.status, [ConsultationStatus.SCHEDULED, ConsultationStatus.WAITING]);
    return this.transition(session, userId, ConsultationStatus.ACCEPTED, { acceptedAt: new Date() });
  }

  async start(id: string, userId: string) {
    const session = await this.getDoctorSession(id, userId);
    this.requireStatus(session.status, [ConsultationStatus.ACCEPTED]);
    if (session.chatOpenAt && session.chatOpenAt > new Date()) {
      throw new BadRequestException('Phiên tư vấn chưa đến thời gian bắt đầu');
    }
    return this.transition(session, userId, ConsultationStatus.ACTIVE, { startedAt: new Date() });
  }

  async complete(id: string, userId: string) {
    const session = await this.getDoctorSession(id, userId);
    this.requireStatus(session.status, [ConsultationStatus.ACTIVE]);
    return this.transition(session, userId, ConsultationStatus.COMPLETED, { completedAt: new Date() });
  }

  async cancel(id: string, userId: string) {
    const session = await this.getAccessible(id, userId);
    this.requireStatus(session.status, [
      ConsultationStatus.SCHEDULED,
      ConsultationStatus.WAITING,
      ConsultationStatus.ACCEPTED,
    ]);
    return this.transition(session, userId, ConsultationStatus.CANCELLED, { cancelledAt: new Date() });
  }

  async listMessages(id: string, userId: string, before?: string, rawLimit?: number) {
    await this.getAccessible(id, userId);
    const limit = Math.min(Math.max(Number(rawLimit) || 30, 1), 50);
    let beforeDate: Date | undefined;
    if (before) {
      const cursorMessage = await this.prisma.consultationMessage.findFirst({
        where: { id: before, consultationId: id },
        select: { createdAt: true },
      });
      if (!cursorMessage) throw new BadRequestException('Con trỏ tin nhắn không hợp lệ');
      beforeDate = cursorMessage.createdAt;
    }
    const rows = await this.prisma.consultationMessage.findMany({
      where: { consultationId: id, ...(beforeDate ? {
        OR: [
          { createdAt: { lt: beforeDate } },
          { createdAt: beforeDate, id: { lt: before } },
        ],
      } : {}) },
      include: { attachments: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const incomingIds = page.filter((message) => message.senderUserId !== userId && !message.deliveredAt).map((message) => message.id);
    if (incomingIds.length) {
      await this.prisma.consultationMessage.updateMany({
        where: { id: { in: incomingIds }, deliveredAt: null },
        data: { deliveredAt: new Date() },
      });
    }
    return {
      items: page.reverse(),
      nextCursor: hasMore ? page[0]?.id ?? null : null,
    };
  }

  async sendText(id: string, userId: string, dto: SendMessageDto) {
    const session = await this.getAccessible(id, userId);
    this.requireStatus(session.status, [ConsultationStatus.ACCEPTED, ConsultationStatus.ACTIVE]);
    if (session.chatOpenAt && session.chatOpenAt > new Date()) {
      throw new BadRequestException('Phiên chat chưa được mở');
    }
    const text = dto.text.trim();
    if (!text) throw new BadRequestException('Tin nhắn không được để trống');

    const duplicate = await this.prisma.consultationMessage.findUnique({
      where: { senderUserId_clientMessageId: { senderUserId: userId, clientMessageId: dto.clientMessageId } },
      include: { attachments: true },
    });
    if (duplicate) {
      if (duplicate.consultationId !== id) throw new ConflictException('Mã tin nhắn đã được sử dụng');
      return duplicate;
    }

    const isDoctor = session.doctor.userId === userId;
    const message = await this.prisma.consultationMessage.create({
      data: {
        consultationId: id,
        senderUserId: userId,
        senderType: isDoctor ? ConsultationSenderType.DOCTOR : ConsultationSenderType.PATIENT,
        messageType: ConsultationMessageType.TEXT,
        clientMessageId: dto.clientMessageId,
        text,
      },
      include: { attachments: true },
    });
    await this.prisma.consultationSession.update({ where: { id }, data: { updatedAt: new Date() } });

    const recipientId = isDoctor ? session.patientProfile.userId : session.doctor.userId;
    if (recipientId) {
      await this.notifications.createNotification(
        recipientId,
        isDoctor ? 'Bạn có tin nhắn mới từ bác sĩ' : 'Bạn có tin nhắn tư vấn mới',
        isDoctor ? 'Mở NovaCare để xem phản hồi trong phiên tư vấn.' : 'Mở NovaCare để xem tin nhắn trong phiên tư vấn.',
        NotificationType.CONSULTATION_MESSAGE,
        { consultationId: id, route: 'consultation_chat' },
      );
    }
    return message;
  }

  async sendAttachment(
    id: string,
    userId: string,
    clientMessageId: string,
    file: Express.Multer.File,
    caption?: string,
  ) {
    const session = await this.getAccessible(id, userId);
    this.requireStatus(session.status, [ConsultationStatus.ACCEPTED, ConsultationStatus.ACTIVE]);
    if (session.chatOpenAt && session.chatOpenAt > new Date()) throw new BadRequestException('Phiên chat chưa được mở');
    if (!clientMessageId?.trim()) throw new BadRequestException('Thiếu mã tin nhắn');
    if (!file?.buffer?.length) throw new BadRequestException('Tệp tải lên không hợp lệ');

    const allowed: Record<string, { extension: string; type: ConsultationMessageType }> = {
      'image/jpeg': { extension: '.jpg', type: ConsultationMessageType.IMAGE },
      'image/png': { extension: '.png', type: ConsultationMessageType.IMAGE },
      'application/pdf': { extension: '.pdf', type: ConsultationMessageType.DOCUMENT },
    };
    const rule = allowed[file.mimetype?.toLowerCase()];
    if (!rule) throw new BadRequestException('Chỉ hỗ trợ tệp JPEG, PNG hoặc PDF');
    if (file.buffer.length > 10 * 1024 * 1024) throw new BadRequestException('Tệp không được vượt quá 10 MB');
    const signatureMatches = file.mimetype === 'image/jpeg'
      ? file.buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
      : file.mimetype === 'image/png'
        ? file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    if (!signatureMatches) throw new BadRequestException('Nội dung tệp không khớp định dạng khai báo');
    if (clientMessageId.length > 128 || (caption?.length ?? 0) > 4000) {
      throw new BadRequestException('Thông tin tài liệu vượt quá giới hạn');
    }

    const duplicate = await this.prisma.consultationMessage.findUnique({
      where: { senderUserId_clientMessageId: { senderUserId: userId, clientMessageId } },
      include: { attachments: true },
    });
    if (duplicate) {
      if (duplicate.consultationId !== id) throw new ConflictException('Mã tin nhắn đã được sử dụng');
      return duplicate;
    }

    const storageKey = `${id}/${randomUUID()}${rule.extension}`;
    const absolutePath = path.join(process.cwd(), 'uploads', 'consultations', storageKey);
    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.promises.writeFile(absolutePath, file.buffer, { flag: 'wx' });

    let persisted = false;
    try {
      const isDoctor = session.doctor.userId === userId;
      const message = await this.prisma.$transaction(async (tx) => {
        const created = await tx.consultationMessage.create({
          data: {
            consultationId: id,
            senderUserId: userId,
            senderType: isDoctor ? ConsultationSenderType.DOCTOR : ConsultationSenderType.PATIENT,
            messageType: rule.type,
            clientMessageId,
            text: caption?.trim() || null,
          },
        });
        await tx.consultationAttachment.create({
          data: {
            consultationId: id,
            messageId: created.id,
            uploadedByUserId: userId,
            status: 'READY',
            type: rule.type,
            fileName: path.basename(file.originalname || `tai-lieu${rule.extension}`).slice(0, 180),
            mimeType: file.mimetype,
            sizeBytes: file.buffer.length,
            storageKey,
          },
        });
        await tx.consultationSession.update({ where: { id }, data: { updatedAt: new Date() } });
        return tx.consultationMessage.findUniqueOrThrow({ where: { id: created.id }, include: { attachments: true } });
      });
      persisted = true;
      const recipientId = isDoctor ? session.patientProfile.userId : session.doctor.userId;
      if (recipientId) {
        await this.notifications.createNotification(
          recipientId,
          isDoctor ? 'Bác sĩ đã gửi tài liệu trong phiên tư vấn' : 'Có tài liệu mới trong phiên tư vấn',
          'Mở NovaCare để xem tài liệu trong phiên tư vấn.',
          NotificationType.CONSULTATION_MESSAGE,
          { consultationId: id, route: 'consultation_chat' },
        );
      }
      await this.audit.logAction({
        userId,
        action: 'CONSULTATION_ATTACHMENT_UPLOADED',
        entityType: 'ConsultationSession',
        entityId: id,
        newValue: { messageId: message.id, mimeType: file.mimetype, sizeBytes: file.size },
      });
      return message;
    } catch (error) {
      if (!persisted) await fs.promises.unlink(absolutePath).catch(() => undefined);
      throw error;
    }
  }

  async getAttachment(id: string, attachmentId: string, userId: string) {
    await this.getAccessible(id, userId);
    const attachment = await this.prisma.consultationAttachment.findFirst({
      where: { id: attachmentId, consultationId: id, status: 'READY' },
    });
    if (!attachment) throw new NotFoundException('Tài liệu không tồn tại');
    const absolutePath = path.resolve(process.cwd(), 'uploads', 'consultations', attachment.storageKey);
    const root = path.resolve(process.cwd(), 'uploads', 'consultations');
    if (!absolutePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(absolutePath)) {
      throw new NotFoundException('Tài liệu không còn tồn tại');
    }
    return { ...attachment, absolutePath };
  }

  async markRead(id: string, userId: string, lastReadMessageId: string) {
    await this.getAccessible(id, userId);
    const last = await this.prisma.consultationMessage.findFirst({
      where: { id: lastReadMessageId, consultationId: id },
      select: { createdAt: true },
    });
    if (!last) throw new BadRequestException('Tin nhắn cuối đã đọc không hợp lệ');
    const now = new Date();
    const result = await this.prisma.consultationMessage.updateMany({
      where: {
        consultationId: id,
        senderUserId: { not: userId },
        createdAt: { lte: last.createdAt },
        readAt: null,
      },
      data: { deliveredAt: now, readAt: now },
    });
    return { updatedCount: result.count, readAt: now, lastReadMessageId };
  }

  private async transition(
    session: ConsultationWithAccess,
    actorUserId: string,
    status: ConsultationStatus,
    timestamps: Prisma.ConsultationSessionUpdateInput,
  ) {
    const updated = await this.prisma.consultationSession.update({
      where: { id: session.id },
      data: { status, ...timestamps },
      include: consultationInclude,
    });
    await this.audit.logAction({
      userId: actorUserId,
      action: `CONSULTATION_${status}`,
      entityType: 'ConsultationSession',
      entityId: session.id,
      oldValue: { status: session.status },
      newValue: { status },
    });
    const recipients = [session.patientProfile.userId, session.doctor.userId]
      .filter((id): id is string => Boolean(id && id !== actorUserId));
    await Promise.all(recipients.map((recipientId) => this.notifications.createNotification(
      recipientId,
      'Trạng thái phiên tư vấn đã thay đổi',
      'Mở NovaCare để xem trạng thái mới của phiên tư vấn.',
      NotificationType.CONSULTATION_STATUS,
      { consultationId: session.id, status, route: 'consultation' },
    )));
    return updated;
  }

  private async getAccessible(id: string, userId: string): Promise<ConsultationWithAccess> {
    const session = await this.prisma.consultationSession.findUnique({ where: { id }, include: consultationInclude });
    if (!session) throw new NotFoundException('Phiên tư vấn không tồn tại');
    const allowed = session.createdByUserId === userId
      || session.patientProfile.userId === userId
      || session.doctor.userId === userId;
    if (!allowed) throw new ForbiddenException('Không có quyền truy cập phiên tư vấn này');
    return session;
  }

  private async getDoctorSession(id: string, userId: string): Promise<ConsultationWithAccess> {
    const session = await this.getAccessible(id, userId);
    if (session.doctor.userId !== userId) throw new ForbiddenException('Chỉ bác sĩ được phân công mới có thể thực hiện thao tác này');
    return session;
  }

  private requireStatus(actual: ConsultationStatus, allowed: ConsultationStatus[]) {
    if (!allowed.includes(actual)) {
      throw new ConflictException(`Không thể thực hiện thao tác khi phiên ở trạng thái ${actual}`);
    }
  }

  private async assertOnlineSchedule(workplaceId: string, start: Date, end: Date) {
    const shiftedStart = new Date(start.getTime() + 7 * 60 * 60 * 1000);
    const shiftedEnd = new Date(end.getTime() + 7 * 60 * 60 * 1000);
    const dayOfWeek = shiftedStart.getUTCDay();
    const startMinutes = shiftedStart.getUTCHours() * 60 + shiftedStart.getUTCMinutes();
    const endMinutes = shiftedEnd.getUTCHours() * 60 + shiftedEnd.getUTCMinutes();
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorWorkplaceId: workplaceId,
        dayOfWeek,
        isActive: true,
        bookingType: { in: [BookingType.ONLINE, BookingType.ALL] },
      },
      select: { startTime: true, endTime: true, breakStart: true, breakEnd: true },
    });
    const valid = schedules.some((schedule) => {
      const toMinutes = (value: string) => {
        const [hours, minutes] = value.split(':').map(Number);
        return hours * 60 + minutes;
      };
      if (startMinutes < toMinutes(schedule.startTime) || endMinutes > toMinutes(schedule.endTime)) return false;
      if (schedule.breakStart && schedule.breakEnd) {
        return !(startMinutes < toMinutes(schedule.breakEnd) && endMinutes > toMinutes(schedule.breakStart));
      }
      return true;
    });
    if (!valid) throw new BadRequestException('Khung giờ đã chọn không thuộc lịch tư vấn online của bác sĩ');
  }

  private numberConfig(key: string, fallback: number, min: number, max: number) {
    const parsed = Number(this.config.get<string>(key));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
  }
}
