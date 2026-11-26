import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { EmailService } from '@/modules/email/email.service';
import { ConfigService } from '@nestjs/config';
import { CreatePartnerRequestDto } from './dto/create-partner-request.dto';
import { ApprovePartnerRequestDto } from './dto/approve-partner-request.dto';
import { UpdatePartnerStatusDto } from './dto/update-partner-status.dto';
import {
  PartnerRequestStatus,
  PartnerType,
  PartnershipStatus,
  Role,
  DataSource,
  Prisma,
} from '@prisma/client';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class PartnerRequestsService {
  private readonly logger = new Logger(PartnerRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * 1. Public: Tiếp nhận đơn gửi yêu cầu hợp tác
   */
  async createRequest(dto: CreatePartnerRequestDto) {
    const type = dto.type || PartnerType.HOSPITAL;
    const resolvedHospitalName =
      dto.hospitalName?.trim() ||
      (type === PartnerType.DOCTOR
        ? `Bác sĩ ${dto.contactName.trim()}`
        : dto.contactName?.trim() || 'Cơ sở Y tế');

    const request = await this.prisma.partnerRequest.create({
      data: {
        type,
        contactName: dto.contactName.trim(),
        titleOrRole: dto.titleOrRole?.trim(),
        phone: dto.phone.trim(),
        email: dto.email.trim().toLowerCase(),
        hospitalName: resolvedHospitalName,
        specialty: dto.specialty?.trim(),
        notes: dto.notes?.trim(),
        status: PartnerRequestStatus.PENDING,
      },
    });

    this.logger.log(
      `Đã nhận yêu cầu hợp tác mới từ [${request.hospitalName}] - Người liên hệ: ${request.contactName} (${request.email})`,
    );

    return {
      success: true,
      message: 'Gửi yêu cầu hợp tác thành công. Đội ngũ NovaCare sẽ liên hệ trong 24h.',
      data: request,
    };
  }

  /**
   * 2. Admin: Danh sách yêu cầu hợp tác
   */
  async findAll(params?: {
    type?: PartnerType;
    status?: PartnerRequestStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PartnerRequestWhereInput = {
      ...(params?.type ? { type: params.type } : {}),
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.search
        ? {
            OR: [
              { hospitalName: { contains: params.search, mode: 'insensitive' } },
              { contactName: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
              { phone: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.partnerRequest.count({ where }),
      this.prisma.partnerRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 3. Admin: Xem chi tiết yêu cầu
   */
  async findById(id: string) {
    const item = await this.prisma.partnerRequest.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy yêu cầu hợp tác');
    }

    let linkedHospital: any = null;
    let linkedUser: any = null;

    if (item.createdHospitalId) {
      linkedHospital = await this.prisma.hospital.findUnique({
        where: { id: item.createdHospitalId },
      });
    }

    if (item.createdUserId) {
      linkedUser = await this.prisma.user.findUnique({
        where: { id: item.createdUserId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          activationToken: true,
          activationExpiresAt: true,
        },
      });
    }

    return {
      ...item,
      linkedHospital,
      linkedUser,
    };
  }

  /**
   * 4. Admin: Cập nhật trạng thái (CONTACTED, REJECTED)
   */
  async updateStatus(id: string, dto: UpdatePartnerStatusDto, adminUserId?: string) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu hợp tác');
    }

    if (request.status === PartnerRequestStatus.APPROVED) {
      throw new BadRequestException('Yêu cầu hợp tác này đã được duyệt trước đó');
    }

    const adminNote = dto.adminNote?.trim();
    const rejectionReason = dto.status === PartnerRequestStatus.REJECTED
      ? adminNote
      : undefined;
    if (dto.status === PartnerRequestStatus.REJECTED) {
      if (!adminNote) {
        throw new BadRequestException('Vui lòng nhập lý do từ chối');
      }
      if (request.status !== PartnerRequestStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể từ chối yêu cầu đang chờ xử lý');
      }
    }

    const updatedRequest = await this.prisma.partnerRequest.update({
      where: { id },
      data: {
        status: dto.status,
        ...(adminNote ? { adminNote } : {}),
      },
    });

    if (dto.status === PartnerRequestStatus.REJECTED && rejectionReason) {
      const actorId = adminUserId;
      if (!actorId) {
        throw new BadRequestException('Admin user is required for this operation');
      }
      await this.auditLogService.logAction({
        userId: actorId,
        action: 'REJECT_PARTNER_REQUEST',
        description: `Từ chối yêu cầu hợp tác của ${request.hospitalName || request.contactName || request.email}`,
        entityType: 'PartnerRequest',
        entityId: id,
        oldValue: { status: request.status },
        newValue: { status: updatedRequest.status, reason: rejectionReason },
      });

      await this.emailService.sendPartnerRejectionEmail(
        request.email,
        request.hospitalName,
        request.contactName,
        rejectionReason,
      );
    }

    return updatedRequest;
  }

  /**
   * 5. Admin: DUYỆT HỢP TÁC & TẠO HOSPITAL ADMIN & GỬI EMAIL KÍCH HOẠT
   */
  async approveRequest(id: string, dto: ApprovePartnerRequestDto, adminUserId?: string) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu hợp tác');
    }

    if (request.status === PartnerRequestStatus.APPROVED) {
      throw new BadRequestException('Yêu cầu hợp tác này đã được phê duyệt thành công trước đó');
    }

    if (dto.approvalDocumentData) {
      if (dto.approvalDocumentMimeType !== 'application/pdf') {
        throw new BadRequestException('Văn bản chấp thuận phải là file PDF');
      }
      const raw = dto.approvalDocumentData.replace(/^data:application\/pdf;base64,/, '');
      if (Buffer.byteLength(raw, 'base64') > 5 * 1024 * 1024) {
        throw new BadRequestException('Văn bản PDF không được vượt quá 5MB');
      }
    }

    const targetHospitalName = (dto.hospitalName || request.hospitalName).trim();
    const targetAdminEmail = (dto.adminEmail || request.email).trim().toLowerCase();
    const targetAdminFullName = (
      dto.adminFullName ||
      request.contactName ||
      `Quản Trị Viên ${targetHospitalName}`
    ).trim();

    // 1. Kiểm tra tài khoản email đã tồn tại hay chưa
    const existingUser: any = null;

    // 2. Tìm hoặc tạo Bệnh viện
    let hospital = await this.prisma.hospital.findFirst({
      where: { name: { equals: targetHospitalName, mode: 'insensitive' } },
    });

    if (!hospital) {
      hospital = await this.prisma.hospital.create({
        data: {
          name: targetHospitalName,
          phone: null,
          email: null,
          status: PartnershipStatus.ACTIVE,
          isActive: true,
          source: DataSource.MANUAL,
          description: `Cơ sở y tế hợp tác phát triển cùng NovaCare (${request.specialty || ''})`.trim(),
        },
      });
      this.logger.log(`Tạo mới cơ sở y tế: [${hospital.name}] (ID: ${hospital.id})`);
    }

    // Email/phone trong đơn chỉ dùng cho liên hệ và gửi link kích hoạt.
    // Không bao giờ dùng chúng làm thông tin liên hệ của cơ sở y tế.
    if (hospital.email !== null || hospital.phone !== null) {
      hospital = await this.prisma.hospital.update({
        where: { id: hospital.id },
        data: { email: null, phone: null },
      });
    }

    // 3. Tạo activation token (hạn 48h)
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    let user: any;

    if (!existingUser) {
      // Băm mật khẩu ngẫu nhiên tạm thời (không ai đăng nhập được cho đến khi kích hoạt)
      const placeholderPassword = crypto.randomUUID() + '!A1';
      const passwordHash = await argon2.hash(placeholderPassword);

      // Xử lý conflict số điện thoại nếu đã có người dùng khác đăng ký bằng sđt này
      let userPhone: string | null = request.phone;
      const phoneTaken = await this.prisma.user.findUnique({ where: { phone: request.phone } });
      if (phoneTaken) {
        userPhone = null; // Bỏ qua gán phone nếu đã trùng để tránh unique violation
      }

      user = await this.prisma.user.create({
        data: {
          // Email trong đơn chỉ dùng để gửi link kích hoạt; email đăng nhập
          // sẽ được bệnh viện tự nhập và lưu ở bước kích hoạt.
          email: null,
          phone: userPhone,
          fullName: targetAdminFullName,
          passwordHash,
          role: Role.HOSPITAL_ADMIN,
          hospitalId: hospital.id,
          isActive: false, // Chưa kích hoạt
          activationToken,
          activationExpiresAt,
        },
      });
      this.logger.log(`Tạo tài khoản Hospital Admin mới: [${user.email}] cho viện [${hospital.name}]`);
    } else {
      // Nâng cấp tài khoản hiện có
      user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: Role.HOSPITAL_ADMIN,
          hospitalId: hospital.id,
          activationToken,
          activationExpiresAt,
          fullName: targetAdminFullName,
        },
      });
      this.logger.log(`Gán quyền Hospital Admin cho tài khoản hiện có: [${user.email}]`);
    }

    // 4. Cập nhật trạng thái đơn yêu cầu hợp tác
    const updatedRequest = await this.prisma.partnerRequest.update({
      where: { id },
      data: {
        status: PartnerRequestStatus.APPROVED,
        approvedAt: new Date(),
        createdHospitalId: hospital.id,
        createdUserId: user.id,
        adminNote: dto.adminNote || request.adminNote,
        approvalDocumentName: dto.approvalDocumentName || null,
        approvalDocumentMimeType: dto.approvalDocumentMimeType || null,
        approvalDocumentData: dto.approvalDocumentData || null,
      },
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'APPROVE_PARTNER_REQUEST',
        description: `Phê duyệt yêu cầu hợp tác của ${request.hospitalName || request.contactName || request.email}`,
        entityType: 'PartnerRequest',
        entityId: id,
        oldValue: { status: request.status },
        newValue: { status: updatedRequest.status, approvalDocumentName: dto.approvalDocumentName },
      });
    }

    // 5. Gửi email duyệt kèm link kích hoạt để bệnh viện tự đặt email và mật khẩu
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'http://localhost:3001';
    const activationUrl = `${frontendUrl}/dang-nhap?token=${activationToken}`;
    await this.emailService.sendHospitalActivationEmail(
      targetAdminEmail,
      hospital.name,
      targetAdminFullName,
      activationUrl,
    );

    return {
      success: true,
      message: `Đã phê duyệt yêu cầu hợp tác và gửi email kích hoạt tới ${targetAdminEmail}`,
      data: {
        request: updatedRequest,
        hospital: {
          id: hospital.id,
          name: hospital.name,
        },
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
        activationUrl,
      },
    };
  }
}
