import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import {
  AppointmentStatus,
  ReportReason,
  ReviewStatus,
  ReviewTargetType,
  Role,
} from '@prisma/client';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ReviewsService (Unit & Business Rules)', () => {
  let service: ReviewsService;
  let prisma: any;
  let auditLogService: any;
  let notificationsService: any;

  beforeEach(async () => {
    prisma = {
      appointment: {
        findUnique: jest.fn(),
      },
      review: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      reviewCriteriaScore: {
        create: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      reviewModerationLog: {
        create: jest.fn(),
      },
      reviewResponse: {
        upsert: jest.fn(),
      },
      reviewReport: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      doctor: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      hospital: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    auditLogService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    notificationsService = {
      createNotification: jest.fn().mockResolvedValue({ id: 'noti-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. KIỂM TRA ĐIỀU KIỆN ĐÁNH GIÁ (ELIGIBILITY)
  // =========================================================================
  describe('getEligibility', () => {
    it('Lượt khám không tồn tại -> Báo NotFoundException', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);
      await expect(service.getEligibility('invalid-apt', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('Lượt khám thuộc bệnh nhân khác -> Bị từ chối (ForbiddenException)', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'apt-1',
        userId: 'other-user',
      });
      await expect(service.getEligibility('apt-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('Lượt khám chưa hoàn thành (PENDING) -> isCompleted = false, canReview = false', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'apt-1',
        bookingCode: 'BK123',
        userId: 'user-1',
        status: AppointmentStatus.PENDING,
        slot: {
          doctorWorkplace: {
            doctorId: 'doc-1',
            hospitalId: 'hosp-1',
            doctor: { id: 'doc-1', fullName: 'Bác sĩ A' },
            hospital: { id: 'hosp-1', name: 'Bệnh viện X' },
          },
        },
        reviews: [],
      });

      const result = await service.getEligibility('apt-1', 'user-1');
      expect(result.isCompleted).toBe(false);
      expect(result.canReviewDoctor).toBe(false);
      expect(result.canReviewHospital).toBe(false);
    });

    it('Lượt khám đã hoàn thành (COMPLETED) -> canReviewDoctor = true, canReviewHospital = true', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'apt-1',
        bookingCode: 'BK123',
        userId: 'user-1',
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
        slot: {
          doctorWorkplace: {
            doctorId: 'doc-1',
            hospitalId: 'hosp-1',
            doctor: { id: 'doc-1', fullName: 'Bác sĩ A' },
            hospital: { id: 'hosp-1', name: 'Bệnh viện X' },
          },
        },
        reviews: [],
      });

      const result = await service.getEligibility('apt-1', 'user-1');
      expect(result.isCompleted).toBe(true);
      expect(result.canReviewDoctor).toBe(true);
      expect(result.canReviewHospital).toBe(true);
    });
  });

  // =========================================================================
  // 2. TẠO ĐÁNH GIÁ (CREATE REVIEW)
  // =========================================================================
  describe('createReview', () => {
    it('Lượt khám chưa hoàn thành -> Chặn tạo đánh giá (BadRequestException)', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'apt-1',
        userId: 'user-1',
        status: AppointmentStatus.CONFIRMED,
      });

      await expect(
        service.createReview('user-1', {
          appointmentId: 'apt-1',
          targetType: ReviewTargetType.DOCTOR,
          rating: 5,
          comment: 'Bác sĩ khám rất tận tâm và chu đáo',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('Đánh giá lượt khám của người khác -> Bị từ chối (ForbiddenException)', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'apt-1',
        userId: 'another-user',
        status: AppointmentStatus.COMPLETED,
      });

      await expect(
        service.createReview('user-1', {
          appointmentId: 'apt-1',
          targetType: ReviewTargetType.DOCTOR,
          rating: 5,
          comment: 'Bác sĩ khám rất tận tâm và chu đáo',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Đã gửi đánh giá trước đó (Duplicate) -> Bị chặn (ConflictException)', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'apt-1',
        userId: 'user-1',
        status: AppointmentStatus.COMPLETED,
        slot: {
          doctorWorkplace: {
            doctorId: 'doc-1',
            hospitalId: 'hosp-1',
          },
        },
      });

      prisma.review.findUnique.mockResolvedValue({ id: 'existing-rev' });

      await expect(
        service.createReview('user-1', {
          appointmentId: 'apt-1',
          targetType: ReviewTargetType.DOCTOR,
          rating: 5,
          comment: 'Bác sĩ khám rất tận tâm và chu đáo',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('Lượt khám hợp lệ -> Tạo thành công với status PENDING và thời hạn 48h', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: 'apt-1',
        userId: 'user-1',
        status: AppointmentStatus.COMPLETED,
        slot: {
          doctorWorkplace: {
            doctorId: 'doc-1',
            hospitalId: 'hosp-1',
          },
        },
      });
      prisma.review.findUnique.mockResolvedValue(null);

      prisma.review.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'rev-1', ...data }));

      const res = await service.createReview('user-1', {
        appointmentId: 'apt-1',
        targetType: ReviewTargetType.DOCTOR,
        rating: 5,
        comment: 'Bác sĩ khám rất tận tâm và chu đáo.',
        criteria: {
          doctorAttitude: 5,
          doctorExplanation: 5,
        },
      });

      expect(res.status).toBe(ReviewStatus.PENDING);
      expect(res.rating).toBe(5);
      expect(res.doctorId).toBe('doc-1');
      expect(prisma.reviewModerationLog.create).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. CHỈNH SỬA ĐÁNH GIÁ (UPDATE REVIEW)
  // =========================================================================
  describe('updateReview', () => {
    it('Chỉnh sửa khi còn trong hạn 48h -> Thành công và chuyển về PENDING', async () => {
      const now = new Date();
      const inFuture = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Còn 24h

      prisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        userId: 'user-1',
        status: ReviewStatus.APPROVED,
        rating: 4,
        comment: 'Nội dung ban đầu',
        editWindowUntil: inFuture,
        targetType: ReviewTargetType.DOCTOR,
        doctorId: 'doc-1',
      });

      prisma.review.update.mockImplementation(({ data }: any) => Promise.resolve({ id: 'rev-1', ...data }));

      const res = await service.updateReview('user-1', 'rev-1', {
        rating: 5,
        comment: 'Nội dung cập nhật mới đã chỉnh sửa',
      });

      expect(res.status).toBe(ReviewStatus.PENDING);
      expect(res.rating).toBe(5);
      expect(res.isEdited).toBe(true);
      expect(prisma.reviewModerationLog.create).toHaveBeenCalled();
    });

    it('Chỉnh sửa khi đã quá thời hạn 48h -> Bị từ chối (BadRequestException)', async () => {
      const now = new Date();
      const inPast = new Date(now.getTime() - 1000); // Đã hết hạn

      prisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        userId: 'user-1',
        editWindowUntil: inPast,
      });

      await expect(
        service.updateReview('user-1', 'rev-1', {
          rating: 5,
          comment: 'Cố gắng sửa khi đã hết hạn',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // 4. KIỂM DUYỆT ĐÁNH GIÁ (MODERATION)
  // =========================================================================
  describe('moderateReview', () => {
    it('Admin duyệt đánh giá -> Trở thành APPROVED và cập nhật thống kê bác sĩ', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        status: ReviewStatus.PENDING,
        targetType: ReviewTargetType.DOCTOR,
        doctorId: 'doc-1',
        userId: 'patient-1',
      });

      prisma.review.update.mockResolvedValue({
        id: 'rev-1',
        status: ReviewStatus.APPROVED,
      });

      prisma.review.count.mockResolvedValue(1);
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5.0 } });

      const result = await service.moderateReview('admin-1', 'rev-1', {
        status: ReviewStatus.APPROVED,
      });

      expect(result.status).toBe(ReviewStatus.APPROVED);
      expect(prisma.doctor.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { rating: 5.0, reviewCount: 1 },
      });
      expect(auditLogService.logAction).toHaveBeenCalled();
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('Admin từ chối không có lý do -> Bị chặn (BadRequestException)', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        status: ReviewStatus.PENDING,
      });

      await expect(
        service.moderateReview('admin-1', 'rev-1', {
          status: ReviewStatus.REJECTED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // 5. PHẢN HỒI ĐÁNH GIÁ (RESPONSES)
  // =========================================================================
  describe('createOrUpdateResponse', () => {
    it('Bác sĩ phản hồi đánh giá của chính mình -> Thành công', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        doctorId: 'doc-1',
        userId: 'patient-1',
      });

      prisma.doctor.findUnique.mockResolvedValue({
        id: 'doc-1',
        fullName: 'Bác sĩ A',
        title: 'ThS.BS',
      });

      prisma.reviewResponse.upsert.mockResolvedValue({
        id: 'resp-1',
        responseContent: 'Cảm ơn bệnh nhân đã tin tưởng.',
      });

      const res = await service.createOrUpdateResponse(
        { id: 'user-doc', role: Role.DOCTOR, fullName: 'Bác sĩ A' } as any,
        'rev-1',
        { responseContent: 'Cảm ơn bệnh nhân đã tin tưởng.' },
      );

      expect(res.id).toBe('resp-1');
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('Bác sĩ phản hồi đánh giá của bác sĩ khác -> Bị chặn (ForbiddenException)', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        doctorId: 'other-doc',
      });

      prisma.doctor.findUnique.mockResolvedValue({
        id: 'my-doc',
      });

      await expect(
        service.createOrUpdateResponse(
          { id: 'user-doc', role: Role.DOCTOR } as any,
          'rev-1',
          { responseContent: 'Phản hồi nhầm của người khác' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Đại diện Bệnh viện phản hồi đánh giá của cơ sở mình -> Thành công', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: 'rev-2',
        hospitalId: 'hosp-1',
        userId: 'patient-1',
        hospital: { name: 'Bệnh viện Đa khoa Quốc tế' },
      });

      prisma.reviewResponse.upsert.mockResolvedValue({
        id: 'resp-2',
        responseContent: 'Cảm ơn phản hồi của quý khách.',
      });

      const res = await service.createOrUpdateResponse(
        { id: 'user-admin-hosp', role: Role.HOSPITAL_ADMIN, hospitalId: 'hosp-1' } as any,
        'rev-2',
        { responseContent: 'Cảm ơn phản hồi của quý khách.' },
      );

      expect(res.id).toBe('resp-2');
    });

    it('Đại diện Bệnh viện phản hồi đánh giá của viện khác -> Bị chặn (ForbiddenException)', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: 'rev-2',
        hospitalId: 'hosp-1',
      });

      await expect(
        service.createOrUpdateResponse(
          { id: 'user-admin-hosp', role: Role.HOSPITAL_ADMIN, hospitalId: 'other-hosp' } as any,
          'rev-2',
          { responseContent: 'Can thiệp trái phép' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // 6. THỐNG KÊ CÔNG KHAI & DANH SÁCH REVIEW CÔNG KHAI
  // =========================================================================
  describe('getPublicStats & getPublicDoctorReviews', () => {
    it('Tính điểm trung bình và phân bố sao chính xác', async () => {
      prisma.review.count.mockResolvedValue(10);
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.62 } });
      prisma.review.groupBy.mockResolvedValue([
        { rating: 5, _count: { rating: 7 } },
        { rating: 4, _count: { rating: 3 } },
      ]);
      prisma.reviewCriteriaScore.findMany.mockResolvedValue([]);

      const stats = await service.getPublicStats(ReviewTargetType.DOCTOR, 'doc-1');
      expect(stats.totalReviews).toBe(10);
      expect(stats.averageRating).toBe(4.6); // Làm tròn 1 chữ số thập phân
      expect(stats.starDistribution[5].count).toBe(7);
      expect(stats.starDistribution[5].percentage).toBe(70);
    });

    it('Chỉ trả về đánh giá APPROVED và ẩn danh tên tác giả nếu isAnonymous = true', async () => {
      prisma.review.findMany.mockResolvedValue([
        {
          id: 'rev-public-1',
          rating: 5,
          comment: 'Khám rất tốt',
          createdAt: new Date(),
          isAnonymous: true,
          user: { fullName: 'Nguyễn Văn An' },
          criteriaScore: null,
          responses: [],
        },
      ]);
      prisma.review.count.mockResolvedValue(1);

      const res = await service.getPublicDoctorReviews('doc-1', {});
      expect(res.total).toBe(1);
      expect(res.items[0].authorName).toBe('Nguyễn A***'); // Tên được ẩn danh
      expect(res.items[0].isAnonymous).toBe(true);
    });
  });

  // =========================================================================
  // 7. BÁO CÁO VI PHẠM (REPORTS)
  // =========================================================================
  describe('reportReview', () => {
    it('Tạo báo cáo vi phạm thành công', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 'rev-1' });
      prisma.reviewReport.create.mockResolvedValue({ id: 'rep-1' });

      const res = await service.reportReview('user-1', 'rev-1', {
        reason: ReportReason.INAPPROPRIATE_LANGUAGE,
        description: 'Chứa từ ngữ xúc phạm',
      });

      expect(res.id).toBe('rep-1');
      expect(prisma.reviewReport.create).toHaveBeenCalled();
    });
  });
});

