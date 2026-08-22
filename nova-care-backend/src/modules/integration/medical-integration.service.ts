import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ConsentService } from './consent.service';
import { HospitalDataAdapter } from './hospital-data.adapter';
import { MedicalDataNormalizerService } from './medical-data-normalizer.service';
import { UnifiedMedicalRecordDto } from './dto/unified-medical-record.dto';

@Injectable()
export class MedicalIntegrationService {
  private readonly logger = new Logger(MedicalIntegrationService.name);

  constructor(
    private prisma: PrismaService,
    private consentService: ConsentService,
    private hospitalDataAdapter: HospitalDataAdapter,
    private normalizer: MedicalDataNormalizerService,
  ) {}

  async getSharedMedicalHistory(
    identityNumber: string,
    sourceHospitalId: string,
    targetHospitalId: string,
  ): Promise<UnifiedMedicalRecordDto> {
    // Step 1: Validate parameters
    if (!identityNumber || !identityNumber.trim()) {
      throw new BadRequestException('identityNumber không được để trống');
    }
    if (!sourceHospitalId || !targetHospitalId) {
      throw new BadRequestException('Cần truyền đầy đủ sourceHospitalId và targetHospitalId');
    }

    // Step 2: Validate sourceHospital !== targetHospital
    if (sourceHospitalId === targetHospitalId) {
      throw new BadRequestException('sourceHospitalId và targetHospitalId phải khác nhau');
    }

    // Step 3: Identity Matching - Find PatientProfile
    const patientProfile = await this.prisma.patientProfile.findFirst({
      where: {
        identityNumber: identityNumber.trim(),
        deletedAt: null,
      },
    });

    if (!patientProfile) {
      throw new NotFoundException(`Không tìm thấy bệnh nhân với số CCCD ${identityNumber}`);
    }

    // Step 4: Verify PatientHospitalLink for source & target hospitals
    const sourceLink = await this.prisma.patientHospitalLink.findUnique({
      where: {
        patientProfileId_hospitalId: {
          patientProfileId: patientProfile.id,
          hospitalId: sourceHospitalId,
        },
      },
    });
    if (!sourceLink) {
      throw new NotFoundException(`Bệnh nhân chưa có mã liên kết tại bệnh viện nguồn (ID: ${sourceHospitalId})`);
    }

    const targetLink = await this.prisma.patientHospitalLink.findUnique({
      where: {
        patientProfileId_hospitalId: {
          patientProfileId: patientProfile.id,
          hospitalId: targetHospitalId,
        },
      },
    });
    if (!targetLink) {
      throw new NotFoundException(`Bệnh nhân chưa có mã liên kết tại bệnh viện đích (ID: ${targetHospitalId})`);
    }

    // Step 5: Consent Enforcement
    const consentCheck = await this.consentService.checkConsent(
      patientProfile.id,
      sourceHospitalId,
      targetHospitalId,
    );

    if (!consentCheck.hasConsent) {
      throw new ForbiddenException(
        `Không có quyền truy xuất lịch sử y tế. Trạng thái Consent: ${consentCheck.status || 'CHƯA_CẤP_QUYỀN'}`
      );
    }

    // Step 6: Fetch source and target hospitals
    const [sourceHospital, targetHospital] = await Promise.all([
      this.prisma.hospital.findUnique({ where: { id: sourceHospitalId } }),
      this.prisma.hospital.findUnique({ where: { id: targetHospitalId } }),
    ]);

    if (!sourceHospital || !targetHospital) {
      throw new NotFoundException('Thông tin bệnh viện không tồn tại');
    }

    // Step 7: Call HospitalDataAdapter for PUBLISHED encounters only
    const rawEncounters = await this.hospitalDataAdapter.getPatientEncounters(
      patientProfile.id,
      sourceHospitalId,
    );

    // Step 8: Normalize data using MedicalDataNormalizer
    const normalizedRecord = this.normalizer.normalizeMedicalRecord(
      patientProfile,
      sourceHospital,
      targetHospital,
      rawEncounters,
    );

    // Step 9: Audit Log entry
    this.logger.log(
      `[MEDICAL_HISTORY_ACCESSED] Patient: ${patientProfile.fullName} (${patientProfile.id}) | Source: ${sourceHospital.name} | Target: ${targetHospital.name} | Encounters: ${rawEncounters.length}`
    );

    return normalizedRecord;
  }
}
