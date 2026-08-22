import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ConsentStatus, PatientConsent } from '@prisma/client';
import { CreateConsentDto } from './dto/create-consent.dto';

@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // 1. CREATE CONSENT REQUEST (PENDING)
  // ============================================
  async createConsent(userId: string, dto: CreateConsentDto): Promise<PatientConsent> {
    if (dto.sourceHospitalId === dto.targetHospitalId) {
      throw new BadRequestException('sourceHospitalId và targetHospitalId phải khác nhau');
    }

    const patientProfile = await this.prisma.patientProfile.findFirst({
      where: { id: dto.patientProfileId, deletedAt: null },
    });
    if (!patientProfile) {
      throw new NotFoundException(`Hồ sơ bệnh nhân với ID ${dto.patientProfileId} không tồn tại`);
    }

    if (patientProfile.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền tạo consent cho hồ sơ bệnh nhân này');
    }

    const sourceHospital = await this.prisma.hospital.findUnique({
      where: { id: dto.sourceHospitalId },
    });
    if (!sourceHospital) {
      throw new NotFoundException(`Bệnh viện nguồn với ID ${dto.sourceHospitalId} không tồn tại`);
    }

    const targetHospital = await this.prisma.hospital.findUnique({
      where: { id: dto.targetHospitalId },
    });
    if (!targetHospital) {
      throw new NotFoundException(`Bệnh viện đích với ID ${dto.targetHospitalId} không tồn tại`);
    }

    let expiresDate: Date | null = null;
    if (dto.expiresAt) {
      expiresDate = new Date(dto.expiresAt);
      if (isNaN(expiresDate.getTime())) {
        throw new BadRequestException('expiresAt không đúng định dạng ngày tháng');
      }
      if (expiresDate <= new Date()) {
        throw new BadRequestException('expiresAt không được nằm trong quá khứ');
      }
    }

    const existingConsent = await this.prisma.patientConsent.findUnique({
      where: {
        patientProfileId_sourceHospitalId_targetHospitalId: {
          patientProfileId: dto.patientProfileId,
          sourceHospitalId: dto.sourceHospitalId,
          targetHospitalId: dto.targetHospitalId,
        },
      },
    });

    if (existingConsent) {
      if (existingConsent.status === ConsentStatus.PENDING || existingConsent.status === ConsentStatus.GRANTED) {
        if (existingConsent.status === ConsentStatus.GRANTED && existingConsent.expiresAt && existingConsent.expiresAt <= new Date()) {
          // Consent is expired, allow renewal
        } else {
          throw new ConflictException('Consent cho cặp bệnh viện này đã tồn tại');
        }
      }

      // Re-activate / reset consent request
      return this.prisma.patientConsent.update({
        where: { id: existingConsent.id },
        data: {
          status: ConsentStatus.PENDING,
          grantedAt: null,
          expiresAt: expiresDate,
        },
        include: {
          sourceHospital: { select: { id: true, name: true } },
          targetHospital: { select: { id: true, name: true } },
        },
      });
    }

    return this.prisma.patientConsent.create({
      data: {
        patientProfileId: dto.patientProfileId,
        sourceHospitalId: dto.sourceHospitalId,
        targetHospitalId: dto.targetHospitalId,
        status: ConsentStatus.PENDING,
        grantedAt: null,
        expiresAt: expiresDate,
      },
      include: {
        sourceHospital: { select: { id: true, name: true } },
        targetHospital: { select: { id: true, name: true } },
      },
    });
  }

  // ============================================
  // 2. CHECK CONSENT STATUS
  // ============================================
  async checkConsent(patientProfileId: string, sourceHospitalId: string, targetHospitalId: string) {
    if (!patientProfileId || !sourceHospitalId || !targetHospitalId) {
      throw new BadRequestException('Cần truyền đầy đủ patientProfileId, sourceHospitalId và targetHospitalId');
    }

    const consent = await this.prisma.patientConsent.findUnique({
      where: {
        patientProfileId_sourceHospitalId_targetHospitalId: {
          patientProfileId,
          sourceHospitalId,
          targetHospitalId,
        },
      },
    });

    if (!consent) {
      return {
        hasConsent: false,
        status: null,
        consentId: null,
        expiresAt: null,
      };
    }

    if (consent.status === ConsentStatus.GRANTED) {
      if (consent.expiresAt && consent.expiresAt <= new Date()) {
        await this.prisma.patientConsent.update({
          where: { id: consent.id },
          data: { status: ConsentStatus.EXPIRED },
        });

        return {
          hasConsent: false,
          status: ConsentStatus.EXPIRED,
          consentId: consent.id,
          expiresAt: consent.expiresAt,
        };
      }

      return {
        hasConsent: true,
        status: ConsentStatus.GRANTED,
        consentId: consent.id,
        expiresAt: consent.expiresAt,
      };
    }

    return {
      hasConsent: false,
      status: consent.status,
      consentId: consent.id,
      expiresAt: consent.expiresAt,
    };
  }

  // ============================================
  // 3. GET PATIENT CONSENTS LIST
  // ============================================
  async getPatientConsents(userId: string, patientProfileId: string) {
    const patientProfile = await this.prisma.patientProfile.findFirst({
      where: { id: patientProfileId, deletedAt: null },
    });

    if (!patientProfile) {
      throw new NotFoundException(`Hồ sơ bệnh nhân với ID ${patientProfileId} không tồn tại`);
    }

    if (patientProfile.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem consent của hồ sơ bệnh nhân này');
    }

    return this.prisma.patientConsent.findMany({
      where: { patientProfileId },
      include: {
        sourceHospital: {
          select: { id: true, name: true, city: true },
        },
        targetHospital: {
          select: { id: true, name: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // 4. GRANT CONSENT (PENDING -> GRANTED)
  // ============================================
  async grantConsent(userId: string, consentId: string): Promise<PatientConsent> {
    const consent = await this.prisma.patientConsent.findUnique({
      where: { id: consentId },
      include: { patientProfile: true },
    });

    if (!consent) {
      throw new NotFoundException(`Consent với ID ${consentId} không tồn tại`);
    }

    if (consent.patientProfile.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chấp thuận (GRANT) consent này');
    }

    if (consent.status === ConsentStatus.REVOKED) {
      throw new BadRequestException('Consent đã bị thu hồi (REVOKED), không thể grant trực tiếp');
    }

    if (consent.status === ConsentStatus.EXPIRED) {
      throw new BadRequestException('Consent đã hết hạn (EXPIRED), không thể grant trực tiếp');
    }

    if (consent.status !== ConsentStatus.PENDING) {
      throw new BadRequestException(`Chỉ consent ở trạng thái PENDING mới được phép cấp quyền (GRANT). Trạng thái hiện tại: ${consent.status}`);
    }

    if (consent.expiresAt && consent.expiresAt <= new Date()) {
      await this.prisma.patientConsent.update({
        where: { id: consentId },
        data: { status: ConsentStatus.EXPIRED },
      });
      throw new BadRequestException('Consent đã quá hạn, không thể grant');
    }

    return this.prisma.patientConsent.update({
      where: { id: consentId },
      data: {
        status: ConsentStatus.GRANTED,
        grantedAt: new Date(),
      },
      include: {
        sourceHospital: { select: { id: true, name: true } },
        targetHospital: { select: { id: true, name: true } },
      },
    });
  }

  // ============================================
  // 5. REVOKE CONSENT (GRANTED / PENDING -> REVOKED)
  // ============================================
  async revokeConsent(userId: string, consentId: string): Promise<PatientConsent> {
    const consent = await this.prisma.patientConsent.findUnique({
      where: { id: consentId },
      include: { patientProfile: true },
    });

    if (!consent) {
      throw new NotFoundException(`Consent với ID ${consentId} không tồn tại`);
    }

    if (consent.patientProfile.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thu hồi (REVOKE) consent này');
    }

    if (consent.status === ConsentStatus.REVOKED) {
      return consent;
    }

    return this.prisma.patientConsent.update({
      where: { id: consentId },
      data: {
        status: ConsentStatus.REVOKED,
      },
      include: {
        sourceHospital: { select: { id: true, name: true } },
        targetHospital: { select: { id: true, name: true } },
      },
    });
  }
}
