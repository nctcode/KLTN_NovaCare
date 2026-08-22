import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { MatchingStatus, PatientHospitalLink } from '@prisma/client';
import { CreateHospitalLinkDto } from './dto/create-hospital-link.dto';

@Injectable()
export class IdentityMatchingService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // 1. MATCH PATIENT BY IDENTITY NUMBER (CCCD)
  // ============================================
  async matchPatientByIdentityNumber(identityNumber: string) {
    if (!identityNumber || !identityNumber.trim()) {
      throw new BadRequestException('identityNumber không được để trống');
    }

    const cleanIdentityNumber = identityNumber.trim();
    const profile = await this.prisma.patientProfile.findFirst({
      where: {
        identityNumber: cleanIdentityNumber,
        deletedAt: null,
      },
    });

    if (!profile) {
      return {
        matched: false,
        message: `Không tìm thấy hồ sơ bệnh nhân với số CCCD ${cleanIdentityNumber}`,
      };
    }

    const hospitalLinks = await this.prisma.patientHospitalLink.findMany({
      where: { patientProfileId: profile.id },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    const hospitalIdentities = await Promise.all(
      hospitalLinks.map(async (link) => {
        const encounterCount = await this.prisma.medicalEncounter.count({
          where: {
            patientProfileId: profile.id,
            hospitalId: link.hospitalId,
          },
        });

        return {
          hospitalId: link.hospitalId,
          hospitalName: link.hospital.name,
          externalPatientId: link.externalPatientId,
          matchingStatus: link.matchingStatus,
          encounterCount,
        };
      })
    );

    return {
      matched: true,
      patientProfile: {
        id: profile.id,
        fullName: profile.fullName,
        identityNumber: profile.identityNumber,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        phone: profile.phone,
      },
      hospitalIdentities,
    };
  }

  // ============================================
  // 2. GET PATIENT IDENTITIES BY PATIENT PROFILE ID
  // ============================================
  async getPatientIdentities(patientProfileId: string) {
    const profile = await this.prisma.patientProfile.findFirst({
      where: {
        id: patientProfileId,
        deletedAt: null,
      },
    });

    if (!profile) {
      throw new NotFoundException(`Hồ sơ bệnh nhân với ID ${patientProfileId} không tồn tại`);
    }

    const hospitalLinks = await this.prisma.patientHospitalLink.findMany({
      where: { patientProfileId: profile.id },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    const hospitalIdentities = await Promise.all(
      hospitalLinks.map(async (link) => {
        const encounterCount = await this.prisma.medicalEncounter.count({
          where: {
            patientProfileId: profile.id,
            hospitalId: link.hospitalId,
          },
        });

        return {
          hospitalId: link.hospitalId,
          hospitalName: link.hospital.name,
          externalPatientId: link.externalPatientId,
          matchingStatus: link.matchingStatus,
          encounterCount,
        };
      })
    );

    return {
      patientProfile: {
        id: profile.id,
        fullName: profile.fullName,
        identityNumber: profile.identityNumber,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        phone: profile.phone,
      },
      hospitalIdentities,
    };
  }

  // ============================================
  // 3. CREATE / UPDATE HOSPITAL LINK
  // ============================================
  async createHospitalLink(
    patientProfileId: string,
    dto: CreateHospitalLinkDto
  ): Promise<PatientHospitalLink> {
    const profile = await this.prisma.patientProfile.findFirst({
      where: { id: patientProfileId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException(`Hồ sơ bệnh nhân với ID ${patientProfileId} không tồn tại`);
    }

    const hospital = await this.prisma.hospital.findUnique({
      where: { id: dto.hospitalId },
    });
    if (!hospital) {
      throw new NotFoundException(`Bệnh viện với ID ${dto.hospitalId} không tồn tại`);
    }

    // Check duplicate link for this patient and hospital
    const existingPatientLink = await this.prisma.patientHospitalLink.findUnique({
      where: {
        patientProfileId_hospitalId: {
          patientProfileId,
          hospitalId: dto.hospitalId,
        },
      },
    });
    if (existingPatientLink) {
      throw new ConflictException('Bệnh nhân này đã có mã liên kết tại bệnh viện này');
    }

    // Check duplicate externalPatientId for another patient in the same hospital
    const existingExternalLink = await this.prisma.patientHospitalLink.findUnique({
      where: {
        hospitalId_externalPatientId: {
          hospitalId: dto.hospitalId,
          externalPatientId: dto.externalPatientId,
        },
      },
    });
    if (existingExternalLink) {
      throw new ConflictException('Mã bệnh nhân (externalPatientId) đã được sử dụng tại bệnh viện này');
    }

    return this.prisma.patientHospitalLink.create({
      data: {
        patientProfileId,
        hospitalId: dto.hospitalId,
        externalPatientId: dto.externalPatientId,
        matchingStatus: dto.matchingStatus || MatchingStatus.MATCHED,
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
