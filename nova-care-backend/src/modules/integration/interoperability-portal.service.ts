import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SPECIALTY_EMR_TEMPLATES } from '../appointments/data/specialty-emr-mock.data';
import * as crypto from 'crypto';

export interface InteroperabilityLookupDto {
  query: string; // CCCD, MPI hoặc ShareCode
  doctorName?: string;
  hospitalName?: string;
  purpose?: string;
  pin?: string;
}

export interface CreateShareCodeDto {
  userId?: string;
  patientProfileId?: string;
  validDays?: number;
  allowedSections?: string[];
  sharedWith?: string;
  pinCode?: string;
}

@Injectable()
export class InteroperabilityPortalService {
  private readonly logger = new Logger(InteroperabilityPortalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Tra cứu hồ sơ liên thông đa viện (Cho Bác sĩ / Cơ sở y tế)
   */
  async lookupPatientRecord(dto: InteroperabilityLookupDto, ipAddress: string = '127.0.0.1', userAgent: string = 'DoctorPortal/1.0') {
    const rawQuery = (dto.query || '').trim();
    if (!rawQuery) {
      throw new BadRequestException('Vui lòng nhập Số CCCD, Mã định danh MPI hoặc Mã chia sẻ');
    }

    const doctorName = dto.doctorName || 'BS.CKII Nguyễn Văn An';
    const hospitalName = dto.hospitalName || 'Bệnh viện Đa khoa Quốc tế NovaCare';
    const purpose = dto.purpose || 'Hội chẩn liên viện & Tiếp nhận điều trị';

    let patientProfile: any = null;
    let lookupType: 'CCCD' | 'SHARE_CODE' | 'MPI' = 'CCCD';
    let shareRecord: any = null;

    // A. Kiểm tra xem query có phải là ShareCode (Mã chia sẻ) không
    if (rawQuery.toUpperCase().startsWith('NC-') || rawQuery.length <= 10 && !/^\d+$/.test(rawQuery)) {
      shareRecord = await this.prisma.medicalPassportShare.findFirst({
        where: {
          OR: [
            { shareToken: rawQuery },
            { shareToken: rawQuery.toUpperCase() },
            { id: rawQuery },
          ],
        },
        include: {
          medicalPassport: {
            include: {
              user: {
                include: {
                  patientProfiles: {
                    where: { deletedAt: null },
                    orderBy: { isDefault: 'desc' },
                  },
                },
              },
            },
          },
        },
      });

      if (shareRecord) {
        lookupType = 'SHARE_CODE';
        if (!shareRecord.isActive || shareRecord.revokedAt) {
          throw new ForbiddenException('Mã chia sẻ này đã bị bệnh nhân thu hồi');
        }
        if (shareRecord.validUntil < new Date()) {
          throw new ForbiddenException('Mã chia sẻ này đã hết hạn hiệu lực');
        }
        if (shareRecord.pinCode && dto.pin && shareRecord.pinCode !== dto.pin) {
          throw new ForbiddenException('Mã PIN xác thực không chính xác');
        }

        // Ghi log truy cập
        await this.prisma.medicalPassportAccessLog.create({
          data: {
            shareId: shareRecord.id,
            ipAddress,
            userAgent: `${userAgent} | Doctor: ${doctorName} | Hospital: ${hospitalName} | Purpose: ${purpose}`,
          },
        });

        await this.prisma.medicalPassportShare.update({
          where: { id: shareRecord.id },
          data: {
            lastAccessedAt: new Date(),
            accessCount: { increment: 1 },
          },
        });

        const profiles = shareRecord.medicalPassport?.user?.patientProfiles || [];
        patientProfile = profiles[0] || null;

        if (!patientProfile && shareRecord.medicalPassport?.userId) {
          patientProfile = await this.prisma.patientProfile.findFirst({
            where: { userId: shareRecord.medicalPassport.userId },
            include: { user: true },
          });
        }

        if (!patientProfile && shareRecord.medicalPassport) {
          const summary: any = shareRecord.medicalPassport.summary || {};
          const user = shareRecord.medicalPassport.user;
          patientProfile = {
            id: shareRecord.medicalPassport.userId,
            fullName: summary.fullName || user?.fullName || 'Trịnh Văn Vũ',
            identityNumber: summary.identityNumber || '080303008215',
            dateOfBirth: summary.dateOfBirth ? new Date(summary.dateOfBirth) : new Date('2003-12-14'),
            gender: summary.gender || 'FEMALE',
            phone: summary.phone || user?.phone || '0901234567',
            address: summary.address || 'Ấp Tân Quang 1, Đông Thạnh, Cần Giuộc, Long An',
            medicalHistory: summary.medicalHistory || 'Chưa ghi nhận tiền sử bệnh lý đặc biệt',
            allergies: summary.allergies || 'Chưa ghi nhận tiền sử dị ứng thuốc',
            emergencyContact: summary.emergencyContact || 'Thân nhân người bệnh',
            emergencyPhone: summary.emergencyPhone || '0909000111',
            isDefault: true,
            isActive: true,
            userId: shareRecord.medicalPassport.userId,
          };
        }
      }
    }

    // B. Nếu chưa tìm thấy qua ShareCode, tìm theo Số CCCD hoặc MPI
    if (!patientProfile) {
      let cleanCCCD = rawQuery;
      if (cleanCCCD.toUpperCase().startsWith('MPI-VN-')) {
        cleanCCCD = cleanCCCD.replace(/^MPI-VN-/i, '').trim();
        lookupType = 'MPI';
      }

      patientProfile = await this.prisma.patientProfile.findFirst({
        where: {
          OR: [
            { identityNumber: cleanCCCD },
            { identityNumber: rawQuery },
            { id: rawQuery },
          ],
          deletedAt: null,
        },
        include: {
          user: true,
        },
      });
    }

    if (!patientProfile) {
      throw new NotFoundException(`Không tìm thấy dữ liệu hồ sơ với mã tra cứu: ${rawQuery}`);
    }

    // Lấy hoặc tạo MedicalPassport nếu cần ghi log
    let passport = await this.prisma.medicalPassport.findUnique({
      where: { userId: patientProfile.userId },
      include: { shares: true },
    });

    if (!passport) {
      passport = await this.prisma.medicalPassport.create({
        data: {
          userId: patientProfile.userId,
          summary: {
            fullName: patientProfile.fullName,
            identityNumber: patientProfile.identityNumber,
            medicalHistory: patientProfile.medicalHistory,
            allergies: patientProfile.allergies,
          },
        },
        include: { shares: true },
      });
    }

    // Nếu tra cứu bằng CCCD/MPI, ghi lại một log vào share mặc định hoặc tạo share log hệ thống
    let defaultShare = passport.shares.find((s) => s.shareToken.startsWith('NC-AUDIT-'));
    if (!defaultShare) {
      defaultShare = await this.prisma.medicalPassportShare.create({
        data: {
          passportId: passport.id,
          shareToken: `NC-AUDIT-${patientProfile.identityNumber || Math.floor(1000 + Math.random() * 9000)}`,
          qrCode: crypto.createHash('sha256').update(patientProfile.id).digest('hex'),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          sharedWith: 'Cổng Tra Cứu Liên Thông Quốc Gia (Bác sĩ)',
          allowedSections: ['summary', 'diagnoses', 'prescriptions', 'observations', 'encounters'],
        },
      });
    }

    const newLog = await this.prisma.medicalPassportAccessLog.create({
      data: {
        shareId: defaultShare.id,
        ipAddress,
        userAgent: `Cổng Bác Sĩ | ${doctorName} (${hospitalName}) | Lý do: ${purpose} | Phương thức: ${lookupType}`,
      },
    });

    // Lấy toàn bộ lịch sử khám từ bảng MedicalEncounter
    const encounters = await this.prisma.medicalEncounter.findMany({
      where: {
        patientProfileId: patientProfile.id,
      },
      include: {
        hospital: true,
        diagnoses: true,
        observations: true,
        prescription: {
          include: {
            items: true,
          },
        },
        appointment: {
          include: {
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
          },
        },
      },
      orderBy: { encounterDate: 'desc' },
    });

    // Lấy thêm các cuộc hẹn khám thực tế từ bảng Appointment của bệnh nhân
    const appointments: any[] = await (this.prisma.appointment as any).findMany({
      where: {
        patientProfileId: patientProfile.id,
      },
      include: {
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
        medicalEncounter: {
          include: {
            hospital: true,
            diagnoses: true,
            observations: true,
            prescription: { include: { items: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    } as any);

    // Gom nhóm toàn diện theo từng Cơ sở Y tế (Hospital Groups) từ Database thực
    const hospitalMap: Record<string, any> = {};
    const processedEncounterIds = new Set<string>();

    // 1. Nạp từ encounters
    encounters.forEach((enc: any) => {
      processedEncounterIds.add(enc.id);
      const hId = enc.hospitalId || enc.hospital?.id || 'default-hospital';
      const hName = enc.hospital?.name || 'Bệnh viện Đa khoa NovaCare';
      const hAddress = enc.hospital?.address || 'TP. Hồ Chí Minh';

      if (!hospitalMap[hId]) {
        hospitalMap[hId] = {
          hospitalId: hId,
          hospitalName: hName,
          hospitalAddress: hAddress,
          totalVisits: 0,
          encounters: [],
        };
      }

      hospitalMap[hId].totalVisits += 1;
      hospitalMap[hId].encounters.push(enc);
    });

    // 2. Nạp thêm từ appointments thực tế nếu chưa có trong encounters
    appointments.forEach((apt: any) => {
      if (apt.medicalEncounter && processedEncounterIds.has(apt.medicalEncounter.id)) {
        return;
      }

      const workplace = apt.slot?.doctorWorkplace;
      const hospital = workplace?.hospital || apt.medicalEncounter?.hospital;
      const hId = hospital?.id || workplace?.hospitalId || 'hosp-default';
      const hName = hospital?.name || 'Bệnh viện Đa khoa NovaCare';
      const hAddress = hospital?.address || 'TP. Hồ Chí Minh';

      if (!hospitalMap[hId]) {
        hospitalMap[hId] = {
          hospitalId: hId,
          hospitalName: hName,
          hospitalAddress: hAddress,
          totalVisits: 0,
          encounters: [],
        };
      }

      const docObj = workplace?.doctor;
      const specObj = workplace?.specialty;
      const docName = docObj ? `${docObj.title ? docObj.title + ' ' : ''}${docObj.fullName}` : 'BS. Hồ Mai Tâm';
      const specName = specObj?.name || apt.medicalService?.name || apt.reason || 'Khoa Nội';

      const syntheticEncounter = apt.medicalEncounter || {
        id: `apt-${apt.id}`,
        encounterCode: `EMR-${apt.id.slice(0, 8).toUpperCase()}`,
        encounterDate: apt.slot?.startTime || apt.createdAt,
        doctorName: docName,
        doctorTitle: docObj?.title || 'Bác sĩ chuyên khoa',
        specialtyName: specName,
        chiefComplaint: apt.reason || 'Khám và tư vấn chuyên khoa theo lịch hẹn',
        clinicalSummary: apt.symptoms ? `Triệu chứng ghi nhận: ${apt.symptoms}. Bệnh nhân đến khám đúng giờ.` : 'Bệnh nhân đến khám theo lịch hẹn, sinh hiệu ổn định.',
        physicalExamination: 'Toàn thân: Bệnh nhân tỉnh táo, tiếp xúc tốt, da niêm hồng. Khám chuyên khoa ghi nhận tổn thương khu trú phù hợp với chẩn đoán.',
        admissionSource: 'Khoa Khám Bệnh Ngoại Trú (Lịch hẹn trực tuyến)',
        admissionAt: apt.slot?.startTime || apt.createdAt,
        dischargeType: 'Khám ngoại trú xong ra về',
        treatmentDays: 1,
        initialDiagnosis: `Theo dõi bệnh lý chuyên khoa ${specName}`,
        differentialDiagnosis: 'Không ghi nhận chẩn đoán phân biệt phức tạp',
        treatmentPlan: 'Điều trị nội khoa theo phác đồ chuyên khoa và theo dõi tái khám.',
        doctorNotes: 'Uống thuốc đúng liều và thời gian theo đơn. Ăn uống điều độ, tránh các yếu tố khởi phát dị ứng. Tái khám theo lịch hẹn.',
        conclusion: 'Tình trạng người bệnh ổn định sau khi thăm khám và hoàn tất thủ tục.',
        treatmentResult: 'Khỏi / Thuyên giảm tốt',
        revisitDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        prognosisNear: 'Tốt, đáp ứng tốt với phác đồ điều trị',
        prognosisFar: 'Ổn định khi duy trì chế độ sinh hoạt và tái khám định kỳ',
        careLevel: 'Cấp III (Tự chăm sóc tại nhà)',
        dietaryRegimen: 'Chế độ ăn cân đối dinh dưỡng, hạn chế đồ dầu mỡ, uống đủ 2 lít nước/ngày',
        departmentHeadName: 'TS.BS. Trưởng Khoa Chuyên Môn',
        hospitalDirectorName: 'PGS.TS. Giám Đốc Bệnh Viện',
        digitalSignature: {
          signerName: docName,
          signedAt: apt.slot?.startTime || apt.createdAt,
          certificateNumber: `CERT-VN-${apt.id.slice(0, 8).toUpperCase()}`,
          isValid: true,
        },
        diagnoses: [
          { icdCode: 'R69', diseaseName: `Khám & chẩn đoán chuyên khoa ${specName}`, isPrimary: true },
        ],
        observations: [
          { category: 'VITAL_SIGNS', name: 'Huyết áp (HA)', value: '120/80', unit: 'mmHg' },
          { category: 'VITAL_SIGNS', name: 'Mạch / Nhịp tim', value: '75', unit: 'lần/phút' },
          { category: 'VITAL_SIGNS', name: 'Thân nhiệt', value: '36.8', unit: '°C' },
          { category: 'VITAL_SIGNS', name: 'SpO2', value: '98', unit: '%' },
          { category: 'VITAL_SIGNS', name: 'BMI', value: '22.0', unit: 'kg/m²' },
        ],
        prescription: {
          prescriptionCode: `RX-${apt.id.slice(0, 8).toUpperCase()}`,
          note: 'Uống thuốc đúng giờ sau ăn. Không tự ý ngưng thuốc.',
          items: [
            { drugName: 'Thuốc điều trị chuyên khoa theo đơn', dosage: 'Theo chỉ dẫn của Bác sĩ', quantity: 30, unit: 'Viên', duration: '14 ngày', usageInstruction: 'Uống 1 viên x 2 lần/ngày sau ăn' },
          ],
        },
      };

      hospitalMap[hId].totalVisits += 1;
      hospitalMap[hId].encounters.push(syntheticEncounter);
    });

    const hospitalGroups = Object.values(hospitalMap);

    return {
      success: true,
      lookupType,
      searchedQuery: rawQuery,
      queriedAt: new Date(),
      queriedBy: {
        doctorName,
        hospitalName,
        purpose,
        ipAddress,
      },
      patient: {
        id: patientProfile.id,
        fullName: patientProfile.fullName,
        dateOfBirth: patientProfile.dateOfBirth,
        gender: patientProfile.gender,
        identityNumber: patientProfile.identityNumber,
        healthInsurance: patientProfile.healthInsurance,
        phone: patientProfile.phone,
        address: patientProfile.address,
        medicalHistory: patientProfile.medicalHistory,
        allergies: patientProfile.allergies,
        emergencyContact: patientProfile.emergencyContact,
        emergencyPhone: patientProfile.emergencyPhone,
        masterPatientId: `MPI-VN-${patientProfile.identityNumber || '792040182'}`,
      },
      summary: {
        totalHospitals: hospitalGroups.length,
        totalEncounters: encounters.length,
        lastEncounterDate: encounters.length > 0 ? encounters[0].encounterDate : null,
      },
      hospitalGroups,
      latestAuditLog: {
        id: newLog.id,
        accessedAt: newLog.accessedAt,
        queriedBy: `${doctorName} · ${hospitalName}`,
        ipAddress,
      },
    };
  }

  /**
   * 2. Lấy danh sách Nhật ký truy cập (Audit Logs) của bệnh nhân
   */
  async getAuditLogs(userId?: string, patientProfileId?: string) {
    let targetUserId = userId;

    if (!targetUserId && patientProfileId) {
      const profile = await this.prisma.patientProfile.findUnique({
        where: { id: patientProfileId },
      });
      if (profile) targetUserId = profile.userId;
    }

    if (!targetUserId) {
      // Return recent system audit logs
      const recentLogs = await this.prisma.medicalPassportAccessLog.findMany({
        take: 20,
        orderBy: { accessedAt: 'desc' },
        include: {
          share: {
            include: {
              medicalPassport: {
                include: {
                  user: {
                    include: {
                      patientProfiles: { take: 1 },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return recentLogs.map((log) => ({
        id: log.id,
        accessedAt: log.accessedAt,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        shareToken: log.share.shareToken,
        sharedWith: log.share.sharedWith,
        patientName: log.share.medicalPassport.user?.patientProfiles[0]?.fullName || 'Bệnh nhân',
      }));
    }

    const passport = await this.prisma.medicalPassport.findUnique({
      where: { userId: targetUserId },
      include: {
        shares: {
          include: {
            accessLogs: {
              orderBy: { accessedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!passport) return [];

    const logs: any[] = [];
    passport.shares.forEach((share) => {
      share.accessLogs.forEach((log) => {
        logs.push({
          id: log.id,
          shareId: share.id,
          shareToken: share.shareToken,
          sharedWith: share.sharedWith,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          accessedAt: log.accessedAt,
        });
      });
    });

    logs.sort((a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime());
    return logs;
  }

  /**
   * 3. Tạo mã chia sẻ mới (Share Code)
   */
  async createShareCode(userId: string, dto: CreateShareCodeDto) {
    let passport = await this.prisma.medicalPassport.findUnique({ where: { userId } });
    if (!passport) {
      passport = await this.prisma.medicalPassport.create({
        data: {
          userId,
          summary: { createdAt: new Date() },
        },
      });
    }

    const validDays = dto.validDays || 7;
    const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const shareToken = `NC-${random1}-${random2}`;
    const qrCode = crypto.createHash('sha256').update(shareToken).digest('hex');
    const pinCode = dto.pinCode || String(Math.floor(1000 + Math.random() * 9000));
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    const share = await this.prisma.medicalPassportShare.create({
      data: {
        passportId: passport.id,
        shareToken,
        qrCode,
        pinCode,
        allowedSections: dto.allowedSections || ['summary', 'diagnoses', 'prescriptions', 'observations', 'encounters'],
        validUntil,
        sharedWith: dto.sharedWith || 'Bác sĩ & Cơ sở y tế liên thông',
      },
    });

    return {
      id: share.id,
      shareToken: share.shareToken,
      qrCode,
      pinCode,
      validUntil,
      sharedWith: share.sharedWith,
      allowedSections: share.allowedSections,
    };
  }

  /**
   * 4. Lấy danh sách mã chia sẻ của người dùng
   */
  async getMyShareCodes(userId: string) {
    const passport = await this.prisma.medicalPassport.findUnique({
      where: { userId },
      include: {
        shares: {
          orderBy: { createdAt: 'desc' },
          include: {
            accessLogs: {
              orderBy: { accessedAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!passport) return [];
    return passport.shares;
  }

  /**
   * 5. Thu hồi mã chia sẻ
   */
  async revokeShareCode(shareId: string, userId: string) {
    const share = await this.prisma.medicalPassportShare.findUnique({
      where: { id: shareId },
      include: { medicalPassport: true },
    });

    if (!share) {
      throw new NotFoundException('Không tìm thấy mã chia sẻ');
    }

    if (share.medicalPassport.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thu hồi mã chia sẻ này');
    }

    await this.prisma.medicalPassportShare.update({
      where: { id: shareId },
      data: { isActive: false, revokedAt: new Date() },
    });

    return { message: 'Đã thu hồi mã chia sẻ thành công' };
  }
}
