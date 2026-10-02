import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsentStatus, PatientConsent } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { CreateConsentDto } from './dto/create-consent.dto';

@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaService) {}

  async createConsent(userId: string, dto: CreateConsentDto): Promise<PatientConsent> {
    if (dto.sourceHospitalId === dto.targetHospitalId) throw new BadRequestException('Cơ sở nguồn và cơ sở đích phải khác nhau');
    if (!dto.encounterIds?.length || !dto.allowedSections?.length) throw new BadRequestException('Cần chọn ít nhất một lần khám và một nhóm dữ liệu để chia sẻ');

    const patientProfile = await this.prisma.patientProfile.findFirst({ where: { id: dto.patientProfileId, deletedAt: null } });
    if (!patientProfile) throw new NotFoundException('Hồ sơ bệnh nhân không tồn tại');
    if (patientProfile.userId !== userId) throw new ForbiddenException('Bạn không có quyền quản lý hồ sơ này');

    const [sourceHospital, targetHospital] = await Promise.all([
      this.prisma.hospital.findUnique({ where: { id: dto.sourceHospitalId } }),
      this.prisma.hospital.findUnique({ where: { id: dto.targetHospitalId } }),
    ]);
    if (!sourceHospital || !targetHospital) throw new NotFoundException('Cơ sở y tế nguồn hoặc đích không tồn tại');

    const encounterIds = [...new Set(dto.encounterIds)];
    const selectedEncounters = await this.prisma.medicalEncounter.findMany({
      where: { id: { in: encounterIds }, patientProfileId: dto.patientProfileId, hospitalId: dto.sourceHospitalId, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (selectedEncounters.length !== encounterIds.length) throw new BadRequestException('Một hoặc nhiều hồ sơ được chọn không thuộc cơ sở nguồn hoặc chưa được công bố');

    let expiresAt: Date | null = null;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) throw new BadRequestException('Thời hạn chia sẻ không hợp lệ');
    }

    const scope = { encounterIds: selectedEncounters.map((encounter) => encounter.id), allowedSections: [...new Set(dto.allowedSections)] };
    const existing = await this.prisma.patientConsent.findUnique({
      where: { patientProfileId_sourceHospitalId_targetHospitalId: { patientProfileId: dto.patientProfileId, sourceHospitalId: dto.sourceHospitalId, targetHospitalId: dto.targetHospitalId } },
    });
    const data = { status: ConsentStatus.PENDING, grantedAt: null, expiresAt, scope, purpose: dto.purpose || 'TREATMENT', confirmedAt: null, revokedAt: null };
    const include = { sourceHospital: { select: { id: true, name: true } }, targetHospital: { select: { id: true, name: true } } };
    if (existing) return this.prisma.patientConsent.update({ where: { id: existing.id }, data, include });
    return this.prisma.patientConsent.create({ data: { ...data, patientProfileId: dto.patientProfileId, sourceHospitalId: dto.sourceHospitalId, targetHospitalId: dto.targetHospitalId }, include });
  }

  async checkConsent(patientProfileId: string, sourceHospitalId: string, targetHospitalId: string) {
    if (!patientProfileId || !sourceHospitalId || !targetHospitalId) throw new BadRequestException('Thiếu thông tin kiểm tra quyền chia sẻ');
    const consent = await this.prisma.patientConsent.findUnique({ where: { patientProfileId_sourceHospitalId_targetHospitalId: { patientProfileId, sourceHospitalId, targetHospitalId } } });
    if (!consent) return { hasConsent: false, status: null, consentId: null, expiresAt: null, scope: null };
    if (consent.status === ConsentStatus.GRANTED && consent.expiresAt && consent.expiresAt <= new Date()) {
      await this.prisma.patientConsent.update({ where: { id: consent.id }, data: { status: ConsentStatus.EXPIRED } });
      return { hasConsent: false, status: ConsentStatus.EXPIRED, consentId: consent.id, expiresAt: consent.expiresAt, scope: consent.scope };
    }
    const scope = consent.scope as { encounterIds?: unknown; allowedSections?: unknown } | null;
    const hasScopedAccess = Array.isArray(scope?.encounterIds) && scope.encounterIds.length > 0
      && Array.isArray(scope?.allowedSections) && scope.allowedSections.length > 0;
    return {
      hasConsent: consent.status === ConsentStatus.GRANTED && hasScopedAccess,
      status: consent.status,
      consentId: consent.id,
      expiresAt: consent.expiresAt,
      scope: consent.scope,
    };
  }

  async getPatientConsents(userId: string, patientProfileId: string) {
    await this.assertProfileOwner(userId, patientProfileId);
    return this.prisma.patientConsent.findMany({
      where: { patientProfileId },
      include: { sourceHospital: { select: { id: true, name: true, city: true } }, targetHospital: { select: { id: true, name: true, city: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getShareableRecords(userId: string, patientProfileId: string, targetHospitalId: string) {
    await this.assertProfileOwner(userId, patientProfileId);
    if (!targetHospitalId) throw new BadRequestException('Thiếu cơ sở y tế đích');
    return this.prisma.medicalEncounter.findMany({
      where: { patientProfileId, hospitalId: { not: targetHospitalId }, status: 'PUBLISHED' },
      select: {
        id: true,
        encounterCode: true,
        encounterDate: true,
        specialtyName: true,
        clinicalSummary: true,
        chiefComplaint: true,
        initialDiagnosis: true,
        doctorName: true,
        hospital: { select: { id: true, name: true, logoUrl: true, address: true } },
        diagnoses: { select: { icdCode: true, diseaseName: true, isPrimary: true } },
      },
      orderBy: { encounterDate: 'desc' },
    });
  }

  async getSharedAccessLogs(userId: string, patientProfileId: string) {
    await this.assertProfileOwner(userId, patientProfileId);
    return this.prisma.auditLog.findMany({
      where: { action: 'INTEROPERABILITY_RECORD_VIEWED', entityType: 'PatientProfile', entityId: patientProfileId },
      select: {
        id: true,
        createdAt: true,
        newValue: true,
        user: { select: { fullName: true, hospital: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async grantConsent(userId: string, consentId: string): Promise<PatientConsent> {
    const consent = await this.prisma.patientConsent.findUnique({ where: { id: consentId }, include: { patientProfile: true } });
    if (!consent) throw new NotFoundException('Quyền chia sẻ không tồn tại');
    if (consent.patientProfile.userId !== userId) throw new ForbiddenException('Bạn không có quyền cấp quyền này');
    if (consent.status !== ConsentStatus.PENDING) throw new BadRequestException('Quyền chia sẻ không còn chờ xác nhận');
    if (consent.expiresAt && consent.expiresAt <= new Date()) {
      await this.prisma.patientConsent.update({ where: { id: consentId }, data: { status: ConsentStatus.EXPIRED } });
      throw new BadRequestException('Quyền chia sẻ đã quá hạn');
    }
    return this.prisma.patientConsent.update({
      where: { id: consentId }, data: { status: ConsentStatus.GRANTED, grantedAt: new Date(), confirmedAt: new Date() },
      include: { sourceHospital: { select: { id: true, name: true } }, targetHospital: { select: { id: true, name: true } } },
    });
  }

  async revokeConsent(userId: string, consentId: string): Promise<PatientConsent> {
    const consent = await this.prisma.patientConsent.findUnique({ where: { id: consentId }, include: { patientProfile: true } });
    if (!consent) throw new NotFoundException('Quyền chia sẻ không tồn tại');
    if (consent.patientProfile.userId !== userId) throw new ForbiddenException('Bạn không có quyền thu hồi quyền này');
    if (consent.status === ConsentStatus.REVOKED) return consent;
    return this.prisma.patientConsent.update({
      where: { id: consentId }, data: { status: ConsentStatus.REVOKED, revokedAt: new Date() },
      include: { sourceHospital: { select: { id: true, name: true } }, targetHospital: { select: { id: true, name: true } } },
    });
  }

  private async assertProfileOwner(userId: string, patientProfileId: string) {
    const profile = await this.prisma.patientProfile.findFirst({ where: { id: patientProfileId, deletedAt: null } });
    if (!profile) throw new NotFoundException('Hồ sơ bệnh nhân không tồn tại');
    if (profile.userId !== userId) throw new ForbiddenException('Bạn không có quyền xem hồ sơ này');
  }
}
