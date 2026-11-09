import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import {
  AppointmentStatus,
  NotificationType,
  ReportReason,
  ReviewStatus,
  ReviewTargetType,
  Role,
  User,
} from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { CreateReviewResponseDto } from './dto/create-review-response.dto';
import { CreateReviewReportDto } from './dto/create-review-report.dto';
import { QueryReviewDto } from './dto/query-review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Helper: Lấy thời hạn chỉnh sửa (mặc định 48 giờ)
   */
  private getEditWindowHours(): number {
    const hours = parseInt(process.env.REVIEW_EDIT_WINDOW_HOURS || '48', 10);
    return isNaN(hours) || hours <= 0 ? 48 : hours;
  }

  /**
   * Helper: Ẩn danh tên người dùng công khai (vd: "Nguyễn Văn An" -> "Nguyễn V*** n")
   */
  private maskName(fullName?: string | null): string {
    if (!fullName) return 'Người bệnh NovaCare';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      const name = parts[0];
      return name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    }
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return `${firstName} ${lastName[0]}***`;
  }

  // =========================================================================
  // 1. KIỂM TRA ĐIỀU KIỆN ĐÁNH GIÁ (ELIGIBILITY)
  // =========================================================================
  async getEligibility(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientProfile: true,
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: true,
                hospital: true,
                specialty: true,
              },
            },
          },
        },
        reviews: {
          include: {
            criteriaScore: true,
            responses: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch khám không tồn tại');
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập lịch khám này');
    }

    const isCompleted = appointment.status === AppointmentStatus.COMPLETED;
    const workplace = appointment.slot?.doctorWorkplace;
    const doctor = workplace?.doctor || null;
    const hospital = workplace?.hospital || null;

    const doctorReview = appointment.reviews.find((r) => r.targetType === ReviewTargetType.DOCTOR) || null;
    const hospitalReview = appointment.reviews.find((r) => r.targetType === ReviewTargetType.HOSPITAL) || null;

    const now = new Date();

    const checkEditInfo = (rev: typeof doctorReview) => {
      if (!rev) return null;
      const canEdit = now <= rev.editWindowUntil;
      const remainingSeconds = Math.max(0, Math.floor((rev.editWindowUntil.getTime() - now.getTime()) / 1000));
      return {
        id: rev.id,
        rating: rev.rating,
        comment: rev.comment,
        status: rev.status,
        moderationReason: rev.moderationReason,
        canEdit,
        editWindowUntil: rev.editWindowUntil,
        remainingEditSeconds: remainingSeconds,
        isEdited: rev.isEdited,
      };
    };

    return {
      appointmentId: appointment.id,
      bookingCode: appointment.bookingCode,
      status: appointment.status,
      isCompleted,
      completedAt: appointment.completedAt,
      doctor: doctor
        ? {
            id: doctor.id,
            fullName: doctor.fullName,
            title: doctor.title,
            avatarUrl: doctor.avatarUrl,
            specialty: workplace?.specialty?.name || '',
          }
        : null,
      hospital: hospital
        ? {
            id: hospital.id,
            name: hospital.name,
            address: hospital.address,
            logoUrl: hospital.logoUrl,
          }
        : null,
      doctorReview: checkEditInfo(doctorReview),
      hospitalReview: checkEditInfo(hospitalReview),
      canReviewDoctor: isCompleted && !!doctor && !doctorReview,
      canReviewHospital: isCompleted && !!hospital && !hospitalReview,
    };
  }

  // =========================================================================
  // 2. TẠO ĐÁNH GIÁ MỚI
  // =========================================================================
  async createReview(userId: string, dto: CreateReviewDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        slot: {
          include: {
            doctorWorkplace: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch khám không tồn tại');
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Bạn chỉ được đánh giá lịch khám của chính mình');
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        `Chỉ các lượt khám đã hoàn thành (COMPLETED) mới được phép gửi đánh giá. Trạng thái hiện tại: ${appointment.status}`,
      );
    }

    const workplace = appointment.slot?.doctorWorkplace;
    if (!workplace) {
      throw new BadRequestException('Không tìm thấy thông tin cơ sở khám hoặc bác sĩ phụ trách lượt khám này');
    }

    let doctorId: string | null = null;
    let hospitalId: string | null = null;

    if (dto.targetType === ReviewTargetType.DOCTOR) {
      doctorId = workplace.doctorId;
      hospitalId = workplace.hospitalId;
      if (!doctorId) {
        throw new BadRequestException('Lượt khám này không có bác sĩ phụ trách để đánh giá');
      }
    } else if (dto.targetType === ReviewTargetType.HOSPITAL) {
      hospitalId = workplace.hospitalId;
      if (!hospitalId) {
        throw new BadRequestException('Lượt khám này không có thông tin cơ sở y tế để đánh giá');
      }
    }

    // Kiểm tra trùng lặp nghiệp vụ
    const existing = await this.prisma.review.findUnique({
      where: {
        appointmentId_targetType: {
          appointmentId: dto.appointmentId,
          targetType: dto.targetType,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Bạn đã gửi đánh giá cho ${dto.targetType === ReviewTargetType.DOCTOR ? 'bác sĩ' : 'cơ sở y tế'} của lượt khám này rồi`,
      );
    }

    const windowHours = this.getEditWindowHours();
    const now = new Date();
    const editWindowUntil = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

    const cleanComment = dto.comment.trim();

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          appointmentId: dto.appointmentId,
          userId,
          targetType: dto.targetType,
          doctorId,
          hospitalId,
          rating: dto.rating,
          comment: cleanComment,
          isAnonymous: dto.isAnonymous ?? false,
          status: ReviewStatus.PENDING,
          editWindowUntil,
        },
      });

      // Tạo điểm tiêu chí chi tiết nếu có
      if (dto.criteria) {
        await tx.reviewCriteriaScore.create({
          data: {
            reviewId: review.id,
            doctorAttitude: dto.criteria.doctorAttitude || null,
            doctorExplanation: dto.criteria.doctorExplanation || null,
            doctorDedication: dto.criteria.doctorDedication || null,
            doctorCommunication: dto.criteria.doctorCommunication || null,
            hospitalFacility: dto.criteria.hospitalFacility || null,
            hospitalHygiene: dto.criteria.hospitalHygiene || null,
            hospitalReception: dto.criteria.hospitalReception || null,
            hospitalWaitingTime: dto.criteria.hospitalWaitingTime || null,
            hospitalStaffAttitude: dto.criteria.hospitalStaffAttitude || null,
          },
        });
      }

      // Ghi nhật ký kiểm duyệt ban đầu
      await tx.reviewModerationLog.create({
        data: {
          reviewId: review.id,
          previousStatus: null,
          newStatus: ReviewStatus.PENDING,
          reason: 'Người bệnh gửi đánh giá mới sau buổi khám',
          snapshotContent: {
            rating: dto.rating,
            comment: cleanComment,
            criteria: dto.criteria || null,
          } as any,
        },
      });

      return review;
    });
  }

  // =========================================================================
  // 3. CHỈNH SỬA ĐÁNH GIÁ (TRONG VÒNG 48 GIỜ)
  // =========================================================================
  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { criteriaScore: true },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa đánh giá này');
    }

    const now = new Date();
    if (now > review.editWindowUntil) {
      throw new BadRequestException(
        `Đã hết thời hạn cho phép chỉnh sửa đánh giá (${this.getEditWindowHours()} giờ kể từ lúc gửi lần đầu)`,
      );
    }

    const cleanComment = dto.comment.trim();
    const wasApproved = review.status === ReviewStatus.APPROVED;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Lưu snapshot nội dung cũ vào lịch sử kiểm toán
      await tx.reviewModerationLog.create({
        data: {
          reviewId: review.id,
          previousStatus: review.status,
          newStatus: ReviewStatus.PENDING,
          reason: 'Người bệnh cập nhật nội dung đánh giá trong thời hạn cho phép',
          snapshotContent: {
            rating: review.rating,
            comment: review.comment,
            isAnonymous: review.isAnonymous,
            criteriaScore: review.criteriaScore,
          } as any,
        },
      });

      // Cập nhật review: chuyển trạng thái về PENDING theo quy định kiểm duyệt an toàn
      const res = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: dto.rating,
          comment: cleanComment,
          isAnonymous: dto.isAnonymous !== undefined ? dto.isAnonymous : review.isAnonymous,
          status: ReviewStatus.PENDING,
          isEdited: true,
          editedAt: now,
          moderationReason: null,
        },
      });

      // Cập nhật tiêu chí chi tiết
      if (dto.criteria) {
        await tx.reviewCriteriaScore.upsert({
          where: { reviewId },
          create: {
            reviewId,
            doctorAttitude: dto.criteria.doctorAttitude || null,
            doctorExplanation: dto.criteria.doctorExplanation || null,
            doctorDedication: dto.criteria.doctorDedication || null,
            doctorCommunication: dto.criteria.doctorCommunication || null,
            hospitalFacility: dto.criteria.hospitalFacility || null,
            hospitalHygiene: dto.criteria.hospitalHygiene || null,
            hospitalReception: dto.criteria.hospitalReception || null,
            hospitalWaitingTime: dto.criteria.hospitalWaitingTime || null,
            hospitalStaffAttitude: dto.criteria.hospitalStaffAttitude || null,
          },
          update: {
            doctorAttitude: dto.criteria.doctorAttitude || null,
            doctorExplanation: dto.criteria.doctorExplanation || null,
            doctorDedication: dto.criteria.doctorDedication || null,
            doctorCommunication: dto.criteria.doctorCommunication || null,
            hospitalFacility: dto.criteria.hospitalFacility || null,
            hospitalHygiene: dto.criteria.hospitalHygiene || null,
            hospitalReception: dto.criteria.hospitalReception || null,
            hospitalWaitingTime: dto.criteria.hospitalWaitingTime || null,
            hospitalStaffAttitude: dto.criteria.hospitalStaffAttitude || null,
          },
        });
      }

      return res;
    });

    // Nếu trước đó đang APPROVED, việc quay về PENDING làm thay đổi điểm số công khai -> tính lại stats
    if (wasApproved) {
      if (review.targetType === ReviewTargetType.DOCTOR && review.doctorId) {
        await this.recalculateTargetStats(ReviewTargetType.DOCTOR, review.doctorId);
      } else if (review.targetType === ReviewTargetType.HOSPITAL && review.hospitalId) {
        await this.recalculateTargetStats(ReviewTargetType.HOSPITAL, review.hospitalId);
      }
    }

    return updated;
  }

  // =========================================================================
  // 4. LẤY DANH SÁCH ĐÁNH GIÁ CỦA CHÍNH BỆNH NHÂN (MY REVIEWS)
  // =========================================================================
  async getMyReviews(userId: string, query: QueryReviewDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.status) where.status = query.status;
    if (query.targetType) where.targetType = query.targetType;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            select: {
              bookingCode: true,
              completedAt: true,
            },
          },
          doctor: {
            select: {
              id: true,
              fullName: true,
              title: true,
              avatarUrl: true,
            },
          },
          hospital: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              address: true,
            },
          },
          criteriaScore: true,
          responses: true,
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    const now = new Date();
    const formatted = items.map((rev) => {
      const canEdit = now <= rev.editWindowUntil;
      const remainingSeconds = Math.max(0, Math.floor((rev.editWindowUntil.getTime() - now.getTime()) / 1000));
      return {
        ...rev,
        canEdit,
        remainingEditSeconds: remainingSeconds,
      };
    });

    return {
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================================================================
  // 5. LẤY DANH SÁCH ĐÁNH GIÁ CÔNG KHAI CỦA BÁC SĨ (PUBLIC)
  // =========================================================================
  async getPublicDoctorReviews(doctorId: string, query: QueryReviewDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      doctorId,
      targetType: ReviewTargetType.DOCTOR,
      status: ReviewStatus.APPROVED,
    };

    if (query.rating && query.rating >= 1 && query.rating <= 5) {
      where.rating = query.rating;
    }

    const orderBy: any = {};
    if (query.sortBy === 'highest') {
      orderBy.rating = 'desc';
    } else if (query.sortBy === 'lowest') {
      orderBy.rating = 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
          criteriaScore: true,
          responses: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    const sanitized = items.map((item) => ({
      id: item.id,
      rating: item.rating,
      comment: item.comment,
      createdAt: item.createdAt,
      authorName: item.isAnonymous ? this.maskName(item.user.fullName) : item.user.fullName,
      isAnonymous: item.isAnonymous,
      isVerifiedVisit: true,
      criteria: item.criteriaScore
        ? {
            attitude: item.criteriaScore.doctorAttitude,
            explanation: item.criteriaScore.doctorExplanation,
            dedication: item.criteriaScore.doctorDedication,
            communication: item.criteriaScore.doctorCommunication,
          }
        : null,
      responses: item.responses.map((r) => ({
        id: r.id,
        responderName: r.responderName,
        responderRole: r.responderRole,
        responseContent: r.responseContent,
        createdAt: r.createdAt,
      })),
    }));

    return {
      items: sanitized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================================================================
  // 6. LẤY DANH SÁCH ĐÁNH GIÁ CÔNG KHAI CỦA BỆNH VIỆN (PUBLIC)
  // =========================================================================
  async getPublicHospitalReviews(hospitalId: string, query: QueryReviewDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      hospitalId,
      targetType: ReviewTargetType.HOSPITAL,
      status: ReviewStatus.APPROVED,
    };

    if (query.rating && query.rating >= 1 && query.rating <= 5) {
      where.rating = query.rating;
    }

    const orderBy: any = {};
    if (query.sortBy === 'highest') {
      orderBy.rating = 'desc';
    } else if (query.sortBy === 'lowest') {
      orderBy.rating = 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
          criteriaScore: true,
          responses: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    const sanitized = items.map((item) => ({
      id: item.id,
      rating: item.rating,
      comment: item.comment,
      createdAt: item.createdAt,
      authorName: item.isAnonymous ? this.maskName(item.user.fullName) : item.user.fullName,
      isAnonymous: item.isAnonymous,
      isVerifiedVisit: true,
      criteria: item.criteriaScore
        ? {
            facility: item.criteriaScore.hospitalFacility,
            hygiene: item.criteriaScore.hospitalHygiene,
            reception: item.criteriaScore.hospitalReception,
            waitingTime: item.criteriaScore.hospitalWaitingTime,
            staffAttitude: item.criteriaScore.hospitalStaffAttitude,
          }
        : null,
      responses: item.responses.map((r) => ({
        id: r.id,
        responderName: r.responderName,
        responderRole: r.responderRole,
        responseContent: r.responseContent,
        createdAt: r.createdAt,
      })),
    }));

    return {
      items: sanitized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================================================================
  // 7. LẤY THỐNG KÊ TỔNG HỢP CÔNG KHAI (STATS)
  // =========================================================================
  async getPublicStats(targetType: ReviewTargetType, targetId: string) {
    const where: any = {
      targetType,
      status: ReviewStatus.APPROVED,
      ...(targetType === ReviewTargetType.DOCTOR ? { doctorId: targetId } : { hospitalId: targetId }),
    };

    const [total, avgAgg, starsGroup, criteriaScores] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { rating: true },
      }),
      this.prisma.reviewCriteriaScore.findMany({
        where: {
          review: where,
        },
      }),
    ]);

    const rawAverage = avgAgg._avg.rating || 0;
    const averageRating = total > 0 ? Math.round(rawAverage * 10) / 10 : 0;

    // Phân bố sao 1-5
    const starDistribution: Record<number, { count: number; percentage: number }> = {
      1: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      5: { count: 0, percentage: 0 },
    };

    starsGroup.forEach((item) => {
      const star = item.rating;
      const count = item._count.rating;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      if (starDistribution[star]) {
        starDistribution[star] = { count, percentage };
      }
    });

    // Điểm tiêu chí chi tiết
    let criteriaAverages: any = {};
    if (criteriaScores.length > 0) {
      if (targetType === ReviewTargetType.DOCTOR) {
        const attitudes = criteriaScores.map((c) => c.doctorAttitude).filter((v): v is number => v !== null);
        const explanations = criteriaScores.map((c) => c.doctorExplanation).filter((v): v is number => v !== null);
        const dedications = criteriaScores.map((c) => c.doctorDedication).filter((v): v is number => v !== null);
        const communications = criteriaScores.map((c) => c.doctorCommunication).filter((v): v is number => v !== null);

        const calcAvg = (arr: number[]) =>
          arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

        criteriaAverages = {
          attitude: calcAvg(attitudes),
          explanation: calcAvg(explanations),
          dedication: calcAvg(dedications),
          communication: calcAvg(communications),
        };
      } else {
        const facilities = criteriaScores.map((c) => c.hospitalFacility).filter((v): v is number => v !== null);
        const hygienes = criteriaScores.map((c) => c.hospitalHygiene).filter((v): v is number => v !== null);
        const receptions = criteriaScores.map((c) => c.hospitalReception).filter((v): v is number => v !== null);
        const waitingTimes = criteriaScores.map((c) => c.hospitalWaitingTime).filter((v): v is number => v !== null);
        const staffAttitudes = criteriaScores.map((c) => c.hospitalStaffAttitude).filter((v): v is number => v !== null);

        const calcAvg = (arr: number[]) =>
          arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

        criteriaAverages = {
          facility: calcAvg(facilities),
          hygiene: calcAvg(hygienes),
          reception: calcAvg(receptions),
          waitingTime: calcAvg(waitingTimes),
          staffAttitude: calcAvg(staffAttitudes),
        };
      }
    }

    return {
      targetType,
      targetId,
      totalReviews: total,
      averageRating,
      starDistribution,
      criteriaAverages,
    };
  }

  // =========================================================================
  // 8. TÍNH LẠI VÀ ĐỒNG BỘ ĐIỂM SỐ VÀO BẢNG DOCTOR / HOSPITAL
  // =========================================================================
  async recalculateTargetStats(targetType: ReviewTargetType, targetId: string) {
    try {
      const where: any = {
        targetType,
        status: ReviewStatus.APPROVED,
        ...(targetType === ReviewTargetType.DOCTOR ? { doctorId: targetId } : { hospitalId: targetId }),
      };

      const [count, agg] = await Promise.all([
        this.prisma.review.count({ where }),
        this.prisma.review.aggregate({
          where,
          _avg: { rating: true },
        }),
      ]);

      const rating = count > 0 && agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0;

      if (targetType === ReviewTargetType.DOCTOR) {
        await this.prisma.doctor.update({
          where: { id: targetId },
          data: {
            rating,
            reviewCount: count,
          },
        });
      } else {
        await this.prisma.hospital.update({
          where: { id: targetId },
          data: {
            rating,
            reviewCount: count,
          },
        });
      }
    } catch (err: any) {
      this.logger.error(`Lỗi cập nhật cache rating cho ${targetType} [${targetId}]: ${err.message}`);
    }
  }

  // =========================================================================
  // 9. PHẢN HỒI CỦA BÁC SĨ HOẶC CƠ SỞ Y TẾ
  // =========================================================================
  async createOrUpdateResponse(responderUser: User, reviewId: string, dto: CreateReviewResponseDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        doctor: true,
        hospital: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    let responderName = responderUser.fullName;
    let responderRole: Role = responderUser.role;

    if (responderUser.role === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: responderUser.id },
      });
      if (!doctor || doctor.id !== review.doctorId) {
        throw new ForbiddenException('Bác sĩ chỉ có quyền phản hồi đánh giá liên quan đến chính mình');
      }
      responderName = `${doctor.title ? doctor.title + ' ' : 'Bác sĩ '}${doctor.fullName}`;
    } else if (responderUser.role === Role.HOSPITAL_ADMIN) {
      if (!responderUser.hospitalId || responderUser.hospitalId !== review.hospitalId) {
        throw new ForbiddenException('Bạn chỉ có quyền phản hồi đánh giá thuộc cơ sở y tế của mình');
      }
      responderName = review.hospital?.name ? `Đại diện ${review.hospital.name}` : 'Đại diện cơ sở y tế';
    } else if (responderUser.role === Role.ADMIN) {
      responderName = 'Ban Quản trị NovaCare';
      responderRole = Role.ADMIN;
    } else {
      throw new ForbiddenException('Bạn không có quyền phản hồi đánh giá này');
    }

    const response = await this.prisma.reviewResponse.upsert({
      where: {
        reviewId_responderId: {
          reviewId,
          responderId: responderUser.id,
        },
      },
      create: {
        reviewId,
        responderId: responderUser.id,
        responderRole,
        responderName,
        responseContent: dto.responseContent.trim(),
      },
      update: {
        responseContent: dto.responseContent.trim(),
        responderName,
      },
    });

    // Thông báo in-app cho người bệnh tác giả đánh giá
    await this.notificationsService.createNotification(
      review.userId,
      'Phản hồi mới về đánh giá của bạn',
      `${responderName} đã gửi phản hồi cho đánh giá của bạn trên NovaCare.`,
      NotificationType.SYSTEM,
      { reviewId, responseId: response.id },
    );

    return response;
  }

  // =========================================================================
  // 10. BÁO CÁO VI PHẠM (REPORT REVIEW)
  // =========================================================================
  async reportReview(reporterUserId: string | null, reviewId: string, dto: CreateReviewReportDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    return this.prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId: reporterUserId,
        reason: dto.reason,
        description: dto.description?.trim() || null,
      },
    });
  }

  // =========================================================================
  // 11. QUẢN TRỊ KIỂM DUYỆT ĐÁNH GIÁ (ADMIN MODERATION)
  // =========================================================================
  async moderateReview(
    adminUserId: string,
    reviewId: string,
    dto: ModerateReviewDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    if ((dto.status === ReviewStatus.REJECTED || dto.status === ReviewStatus.HIDDEN) && !dto.moderationReason) {
      throw new BadRequestException('Bắt buộc phải cung cấp lý do khi từ chối hoặc ẩn đánh giá');
    }

    const previousStatus = review.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.review.update({
        where: { id: reviewId },
        data: {
          status: dto.status,
          moderationReason: dto.moderationReason || null,
          moderatedBy: adminUserId,
          moderatedAt: new Date(),
        },
      });

      await tx.reviewModerationLog.create({
        data: {
          reviewId,
          adminUserId,
          previousStatus,
          newStatus: dto.status,
          reason: dto.moderationReason || 'Kiểm duyệt bởi Quản trị viên',
        },
      });

      return res;
    });

    // Đồng bộ điểm số nếu trạng thái thay đổi liên quan đến APPROVED
    if (previousStatus === ReviewStatus.APPROVED || dto.status === ReviewStatus.APPROVED) {
      if (review.targetType === ReviewTargetType.DOCTOR && review.doctorId) {
        await this.recalculateTargetStats(ReviewTargetType.DOCTOR, review.doctorId);
      } else if (review.targetType === ReviewTargetType.HOSPITAL && review.hospitalId) {
        await this.recalculateTargetStats(ReviewTargetType.HOSPITAL, review.hospitalId);
      }
    }

    // Ghi nhật ký kiểm toán hệ thống
    await this.auditLogService.logAction({
      userId: adminUserId,
      action: `REVIEW_${dto.status}`,
      entityType: 'REVIEW',
      entityId: reviewId,
      oldValue: { status: previousStatus },
      newValue: { status: dto.status, reason: dto.moderationReason },
      ipAddress,
      userAgent,
    });

    // Gửi thông báo đến người bệnh
    let notiTitle = 'Đánh giá của bạn đã được phê duyệt';
    let notiContent = 'Đánh giá của bạn đã được kiểm duyệt và hiển thị công khai trên NovaCare.';
    if (dto.status === ReviewStatus.REJECTED) {
      notiTitle = 'Đánh giá chưa được phê duyệt';
      notiContent = `Đánh giá của bạn bị từ chối với lý do: ${dto.moderationReason}. Bạn có thể chỉnh sửa lại trong thời hạn cho phép.`;
    } else if (dto.status === ReviewStatus.HIDDEN) {
      notiTitle = 'Đánh giá đã bị ẩn';
      notiContent = `Đánh giá của bạn đã bị ẩn do vi phạm chính sách: ${dto.moderationReason}.`;
    }

    await this.notificationsService.createNotification(
      review.userId,
      notiTitle,
      notiContent,
      NotificationType.SYSTEM,
      { reviewId, status: dto.status },
    );

    return updated;
  }

  // =========================================================================
  // 12. DANH SÁCH ĐÁNH GIÁ DÀNH CHO QUẢN TRỊ VIÊN
  // =========================================================================
  async adminGetReviews(query: QueryReviewDto, hospitalIdFilter?: string | null) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.targetType) where.targetType = query.targetType;
    if (query.rating) where.rating = query.rating;
    if (query.targetId) {
      where.OR = [{ doctorId: query.targetId }, { hospitalId: query.targetId }];
    }
    if (hospitalIdFilter) {
      where.hospitalId = hospitalIdFilter;
    }
    if (query.q) {
      where.comment = { contains: query.q, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            select: {
              bookingCode: true,
              completedAt: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              fullName: true,
              title: true,
            },
          },
          hospital: {
            select: {
              id: true,
              name: true,
            },
          },
          criteriaScore: true,
          responses: true,
          reports: true,
          moderationLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================================================================
  // 13. DANH SÁCH BÁO CÁO VI PHẠM (REPORTS)
  // =========================================================================
  async adminGetReports(page = 1, limit = 10, isResolved?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (isResolved !== undefined) {
      where.isResolved = isResolved;
    }

    const [items, total] = await Promise.all([
      this.prisma.reviewReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          review: {
            include: {
              user: { select: { fullName: true } },
              doctor: { select: { fullName: true } },
              hospital: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.reviewReport.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================================================================
  // 14. GIẢI QUYẾT BÁO CÁO VI PHẠM
  // =========================================================================
  async adminResolveReport(adminUserId: string, reportId: string, isResolved = true) {
    const report = await this.prisma.reviewReport.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Báo cáo không tồn tại');
    }

    return this.prisma.reviewReport.update({
      where: { id: reportId },
      data: {
        isResolved,
        resolvedAt: isResolved ? new Date() : null,
        resolvedBy: isResolved ? adminUserId : null,
      },
    });
  }
}
