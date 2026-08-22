import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { EncounterStatus, MedicalEncounter, Diagnosis, Observation, Prescription, PrescriptionItem } from '@prisma/client';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { CreateObservationDto } from './dto/create-observation.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CreatePrescriptionItemDto } from './dto/create-prescription-item.dto';

@Injectable()
export class ClinicalService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // 1. GET MEDICAL ENCOUNTER FULL DETAIL
  // ============================================
  async getEncounter(id: string): Promise<MedicalEncounter> {
    const encounter = await this.prisma.medicalEncounter.findUnique({
      where: { id },
      include: {
        patientProfile: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            dateOfBirth: true,
            phone: true,
            identityNumber: true,
            healthInsurance: true,
            medicalHistory: true,
            allergies: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            bookingCode: true,
            status: true,
            createdAt: true,
          },
        },
        diagnoses: {
          orderBy: { createdAt: 'asc' },
        },
        observations: {
          orderBy: { observedAt: 'asc' },
        },
        prescription: {
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!encounter) {
      throw new NotFoundException(`Lượt khám với ID ${id} không tồn tại`);
    }

    return encounter;
  }

  // ============================================
  // 2. ADD DIAGNOSIS (ONLY IN_PROGRESS)
  // ============================================
  async addDiagnosis(encounterId: string, dto: CreateDiagnosisDto): Promise<Diagnosis> {
    const encounter = await this.prisma.medicalEncounter.findUnique({
      where: { id: encounterId },
    });

    if (!encounter) {
      throw new NotFoundException(`Lượt khám với ID ${encounterId} không tồn tại`);
    }

    if (encounter.status !== EncounterStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Không thể thêm chẩn đoán khi hồ sơ lượt khám đang ở trạng thái ${encounter.status}`
      );
    }

    return this.prisma.diagnosis.create({
      data: {
        encounterId,
        icdCode: dto.icdCode,
        diseaseName: dto.diseaseName,
        isPrimary: dto.isPrimary ?? true,
        note: dto.note,
      },
    });
  }

  // ============================================
  // 3. ADD OBSERVATION (ONLY IN_PROGRESS)
  // ============================================
  async addObservation(encounterId: string, dto: CreateObservationDto): Promise<Observation> {
    const encounter = await this.prisma.medicalEncounter.findUnique({
      where: { id: encounterId },
    });

    if (!encounter) {
      throw new NotFoundException(`Lượt khám với ID ${encounterId} không tồn tại`);
    }

    if (encounter.status !== EncounterStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Không thể thêm chỉ số/xét nghiệm khi hồ sơ lượt khám đang ở trạng thái ${encounter.status}`
      );
    }

    return this.prisma.observation.create({
      data: {
        encounterId,
        category: dto.category,
        code: dto.code,
        name: dto.name,
        value: dto.value,
        unit: dto.unit,
        referenceRange: dto.referenceRange,
        interpretation: dto.interpretation,
      },
    });
  }

  // ============================================
  // 4. CREATE PRESCRIPTION (ONLY IN_PROGRESS)
  // ============================================
  async createPrescription(encounterId: string, dto: CreatePrescriptionDto): Promise<Prescription> {
    const encounter = await this.prisma.medicalEncounter.findUnique({
      where: { id: encounterId },
    });

    if (!encounter) {
      throw new NotFoundException(`Lượt khám với ID ${encounterId} không tồn tại`);
    }

    if (encounter.status !== EncounterStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Không thể tạo đơn thuốc khi hồ sơ lượt khám đang ở trạng thái ${encounter.status}`
      );
    }

    const existing = await this.prisma.prescription.findUnique({
      where: { encounterId },
      include: { items: true },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.prescription.create({
      data: {
        encounterId,
        prescriptionCode: this.generatePrescriptionCode(),
        note: dto.note,
      },
      include: { items: true },
    });
  }

  // ============================================
  // 5. ADD PRESCRIPTION ITEM (ONLY IN_PROGRESS)
  // ============================================
  async addPrescriptionItem(prescriptionId: string, dto: CreatePrescriptionItemDto): Promise<PrescriptionItem> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { encounter: true },
    });

    if (!prescription) {
      throw new NotFoundException(`Đơn thuốc với ID ${prescriptionId} không tồn tại`);
    }

    if (prescription.encounter.status !== EncounterStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Không thể thêm thuốc khi hồ sơ lượt khám đang ở trạng thái ${prescription.encounter.status}`
      );
    }

    return this.prisma.prescriptionItem.create({
      data: {
        prescriptionId,
        drugName: dto.drugName,
        dosage: dto.dosage,
        usageInstruction: dto.usageInstruction,
        quantity: dto.quantity,
        unit: dto.unit,
        duration: dto.duration,
        note: dto.note,
      },
    });
  }

  // ============================================
  // 6. COMPLETE ENCOUNTER (IN_PROGRESS -> COMPLETED)
  // ============================================
  async completeEncounter(encounterId: string): Promise<MedicalEncounter> {
    const encounter = await this.prisma.medicalEncounter.findUnique({
      where: { id: encounterId },
    });

    if (!encounter) {
      throw new NotFoundException(`Lượt khám với ID ${encounterId} không tồn tại`);
    }

    if (encounter.status !== EncounterStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Chỉ lượt khám đang ở trạng thái IN_PROGRESS mới được hoàn thành (COMPLETED). Trạng thái hiện tại: ${encounter.status}`
      );
    }

    return this.prisma.medicalEncounter.update({
      where: { id: encounterId },
      data: {
        status: EncounterStatus.COMPLETED,
      },
    });
  }

  // ============================================
  // 7. PUBLISH ENCOUNTER (COMPLETED -> PUBLISHED)
  // ============================================
  async publishEncounter(encounterId: string): Promise<MedicalEncounter> {
    const encounter = await this.prisma.medicalEncounter.findUnique({
      where: { id: encounterId },
    });

    if (!encounter) {
      throw new NotFoundException(`Lượt khám với ID ${encounterId} không tồn tại`);
    }

    if (encounter.status !== EncounterStatus.COMPLETED) {
      throw new BadRequestException(
        `Chỉ lượt khám đã COMPLETED mới được phép PUBLISHED. Trạng thái hiện tại: ${encounter.status}`
      );
    }

    return this.prisma.medicalEncounter.update({
      where: { id: encounterId },
      data: {
        status: EncounterStatus.PUBLISHED,
      },
    });
  }

  // Helper code generator
  private generatePrescriptionCode(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RX-${yyyy}${mm}${dd}-${randomHex}`;
  }
}
