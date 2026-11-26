import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(params: {
    userId: string;
    action: string;
    success?: boolean;
    description?: string;
    entityType: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const log = await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          success: params.success ?? true,
          description: params.description || this.buildDescription(params.action, params.entityType, params.entityId),
          entityType: params.entityType,
          entityId: params.entityId || null,
          oldValue: params.oldValue ? params.oldValue : undefined,
          newValue: params.newValue ? params.newValue : undefined,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
      this.logger.log(`AuditLog [${params.action}] on ${params.entityType} by user ${params.userId}`);
      return log;
    } catch (error: any) {
      this.logger.error(`Failed to record AuditLog: ${error.message}`);
    }
  }

  async getLogs(page = 1, limit = 20, search?: string, success?: boolean, entityType?: string, startDate?: string, endDate?: string) {
    const skip = (page - 1) * limit;
    const where: any = search
      ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { entityType: { contains: search, mode: 'insensitive' } },
            { user: { fullName: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};
    if (success !== undefined) where.success = success;
    if (entityType) where.entityType = entityType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: await Promise.all(items.map(async (item) => ({
        ...item,
        description: await this.resolveDescription(item),
      }))),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async resolveDescription(item: any) {
    if (item.description && item.description !== item.action) return item.description;

    let subject = '';
    const db = this.prisma as any;
    try {
      if (item.entityId && item.entityType === 'User') {
        const record = await db.user.findUnique({ where: { id: item.entityId }, select: { fullName: true, email: true } });
        subject = record?.fullName || record?.email || '';
      } else if (item.entityId && item.entityType === 'PartnerRequest') {
        const record = await db.partnerRequest.findUnique({ where: { id: item.entityId }, select: { hospitalName: true, contactName: true, email: true } });
        subject = record?.hospitalName || record?.contactName || record?.email || '';
      } else if (item.entityId && item.entityType === 'Appointment') {
        const record = await db.appointment.findUnique({ where: { id: item.entityId }, include: { user: { select: { fullName: true } } } });
        subject = record?.user?.fullName || record?.bookingCode || '';
      } else if (item.entityId && item.entityType === 'Hospital') {
        const record = await db.hospital.findUnique({ where: { id: item.entityId }, select: { name: true } });
        subject = record?.name || '';
      } else if (item.entityId && item.entityType === 'Doctor') {
        const record = await db.doctor.findUnique({ where: { id: item.entityId }, include: { user: { select: { fullName: true } } } });
        subject = record?.user?.fullName || '';
      }
    } catch {
      // A deleted entity should not prevent the audit log list from loading.
    }

    return `${this.buildDescription(item.action, item.entityType, item.entityId)}${subject ? ` - ${subject}` : ''}`;
  }

  private buildDescription(action: string, entityType: string, entityId?: string | null) {
    const descriptions: Record<string, string> = {
      APPROVE_PARTNER_REQUEST: 'Phê duyệt yêu cầu hợp tác',
      REJECT_PARTNER_REQUEST: 'Từ chối yêu cầu hợp tác',
      LOCK_USER: 'Khóa tài khoản người dùng',
      UNLOCK_USER: 'Mở khóa tài khoản người dùng',
      UPDATE_USER_ROLE: 'Cập nhật vai trò người dùng',
      CREATE_HOSPITAL_ADMIN: 'Tạo tài khoản quản trị bệnh viện',
      REFUND_PAYMENT_TRANSACTION: 'Hoàn tiền giao dịch thanh toán',
      CHECK_IN_APPOINTMENT: 'Xác nhận bệnh nhân đã đến khám',
      REVERT_NO_SHOW_APPOINTMENT: 'Khôi phục lịch hẹn vắng mặt',
    };
    Object.assign(descriptions, {
      ACTIVATE_SPECIALTY: 'K\u00edch ho\u1ea1t chuy\u00ean khoa',
      DEACTIVATE_SPECIALTY: 'V\u00f4 hi\u1ec7u h\u00f3a chuy\u00ean khoa',
      CREATE_SPECIALTY: 'T\u1ea1o chuy\u00ean khoa', UPDATE_SPECIALTY: 'C\u1eadp nh\u1eadt chuy\u00ean khoa',
      CREATE_HOSPITAL: 'T\u1ea1o c\u01a1 s\u1edf y t\u1ebf', UPDATE_HOSPITAL: 'C\u1eadp nh\u1eadt c\u01a1 s\u1edf y t\u1ebf', DELETE_HOSPITAL: 'X\u00f3a c\u01a1 s\u1edf y t\u1ebf',
      CREATE_DOCTOR: 'T\u1ea1o b\u00e1c s\u0129', UPDATE_DOCTOR: 'C\u1eadp nh\u1eadt b\u00e1c s\u0129', DELETE_DOCTOR: 'X\u00f3a b\u00e1c s\u0129', CREATE_DOCTOR_ACCOUNT: 'T\u1ea1o t\u00e0i kho\u1ea3n b\u00e1c s\u0129',
      ACTIVATE_MEDICAL_SERVICE: 'K\u00edch ho\u1ea1t d\u1ecbch v\u1ee5 y t\u1ebf', DEACTIVATE_MEDICAL_SERVICE: 'V\u00f4 hi\u1ec7u h\u00f3a d\u1ecbch v\u1ee5 y t\u1ebf',
      CREATE_MEDICAL_SERVICE: 'T\u1ea1o d\u1ecbch v\u1ee5 y t\u1ebf', UPDATE_MEDICAL_SERVICE: 'C\u1eadp nh\u1eadt d\u1ecbch v\u1ee5 y t\u1ebf', DELETE_MEDICAL_SERVICE: 'X\u00f3a d\u1ecbch v\u1ee5 y t\u1ebf',
      ACTIVATE_HEALTH_PACKAGE: 'K\u00edch ho\u1ea1t g\u00f3i kh\u00e1m', DEACTIVATE_HEALTH_PACKAGE: 'V\u00f4 hi\u1ec7u h\u00f3a g\u00f3i kh\u00e1m',
      CREATE_HEALTH_PACKAGE: 'T\u1ea1o g\u00f3i kh\u00e1m', UPDATE_HEALTH_PACKAGE: 'C\u1eadp nh\u1eadt g\u00f3i kh\u00e1m', DELETE_HEALTH_PACKAGE: 'X\u00f3a g\u00f3i kh\u00e1m',
      UPDATE_APPOINTMENT_STATUS: 'C\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i l\u1ecbch h\u1eb9n', RECORD_PATIENT_CONTACT: 'Ghi nh\u1eadn li\u00ean h\u1ec7 b\u1ec7nh nh\u00e2n',
      CONSULTATION_CREATED: 'T\u1ea1o bu\u1ed5i t\u01b0 v\u1ea5n', CONSULTATION_ATTACHMENT_UPLOADED: 'T\u1ea3i l\u00ean t\u00e0i li\u1ec7u t\u01b0 v\u1ea5n', INTEROPERABILITY_RECORD_VIEWED: 'Xem h\u1ed3 s\u01a1 li\u00ean th\u00f4ng', PRE_EXAM_SESSION: 'Th\u1ef1c hi\u1ec7n phi\u00ean ti\u1ec1n kh\u00e1m',
      CREATED: 'T\u1ea1o m\u1edbi', UPDATED: 'C\u1eadp nh\u1eadt', UNCHANGED: 'Kh\u00f4ng thay \u0111\u1ed5i',
    });
    return `${descriptions[action] || 'Th\u1ef1c hi\u1ec7n thao t\u00e1c'}${entityId ? ` (${entityType}: ${entityId})` : ''}`;
  }
}
