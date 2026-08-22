import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { EncounterStatus } from '@prisma/client';
import { IHospitalDataAdapter } from './hospital-adapter.interface';

@Injectable()
export class HospitalDataAdapter implements IHospitalDataAdapter {
  constructor(private prisma: PrismaService) {}

  /**
   * Logical Mock HIS Adapter / Logical Hospital Data Adapter
   * Queries Prisma directly for MedicalEncounters belonging strictly to
   * patientProfileId AND hospitalId with status PUBLISHED.
   */
  async getPatientEncounters(
    patientProfileId: string,
    hospitalId: string,
  ): Promise<any[]> {
    return this.prisma.medicalEncounter.findMany({
      where: {
        patientProfileId,
        hospitalId,
        status: EncounterStatus.PUBLISHED,
      },
      include: {
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
      orderBy: { encounterDate: 'desc' },
    });
  }
}
