import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { DataSource, Gender } from '@prisma/client';
import { CatalogNormalizerService } from './catalog-normalizer.service';
import {
  RawHisCatalog,
  SyncResult,
  SyncItemDetail,
} from './catalog-sync.types';

@Injectable()
export class CatalogSyncService {
  private readonly logger = new Logger(CatalogSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: CatalogNormalizerService
  ) {}

  /**
   * Chuyển đổi endpoint sang host.docker.internal nếu backend đang chạy trong Docker
   */
  private resolveEndpointUrl(rawUrl?: string): string {
    const base = rawUrl?.trim() || 'http://localhost:4000/api/hospital-catalog';
    // Nếu chạy trong container Linux mà gọi localhost thì chuyển sang host.docker.internal
    if (
      process.env.DATABASE_URL?.includes('postgres:5432') &&
      (base.includes('localhost') || base.includes('127.0.0.1'))
    ) {
      return base.replace(/localhost|127\.0\.0\.1/, 'host.docker.internal');
    }
    return base;
  }

  /**
   * Gọi API lấy dữ liệu thô từ HIS
   */
  async fetchHisCatalog(url?: string): Promise<RawHisCatalog> {
    const targetUrl = this.resolveEndpointUrl(url);
    this.logger.log(`Bắt đầu kéo dữ liệu từ HIS endpoint: ${targetUrl}`);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new BadRequestException(
          `Hệ thống HIS trả về mã lỗi HTTP ${response.status}: ${response.statusText}`
        );
      }

      const json = await response.json();
      const catalog: RawHisCatalog = json?.data || json;

      if (!catalog?.hospital_code || !Array.isArray(catalog?.doctors)) {
        throw new BadRequestException(
          'Dữ liệu từ HIS không đúng định dạng chuẩn (thiếu hospital_code hoặc danh sách doctors)'
        );
      }

      return catalog;
    } catch (err: any) {
      this.logger.error(`Lỗi khi gọi HIS API (${targetUrl}): ${err?.message}`);
      throw new BadRequestException(
        `Không thể kết nối đến hệ thống HIS ngoài: ${err?.message}`
      );
    }
  }

  /**
   * Đồng bộ toàn bộ Catalog từ HIS vào NovaCare Database
   * Idempotent: Lần đầu created: N, lần 2 không đổi thì unchanged: N
   */
  async syncCatalog(endpointUrl?: string): Promise<SyncResult> {
    // 1. Kéo dữ liệu thô
    const rawCatalog = await this.fetchHisCatalog(endpointUrl);

    // 2. Chuẩn hóa dữ liệu qua Normalizer
    const normHospital = this.normalizer.normalizeHospital(rawCatalog);
    const normDoctors = this.normalizer.normalizeDoctors(rawCatalog.doctors);

    // 3. Upsert Hospital dựa trên externalId
    let hospital = await this.prisma.hospital.findUnique({
      where: { externalId: normHospital.externalId },
    });

    if (!hospital) {
      // Kiểm tra xem tên đã tồn tại chưa để tránh conflict unique name
      hospital = await this.prisma.hospital.findUnique({
        where: { name: normHospital.name },
      });

      if (hospital) {
        // Cập nhật thêm externalId và source vào viện sẵn có
        hospital = await this.prisma.hospital.update({
          where: { id: hospital.id },
          data: {
            externalId: normHospital.externalId,
            source: DataSource.API,
            hotline: normHospital.hotline,
            operatingHours: normHospital.operatingHours,
          },
        });
      } else {
        // Tạo mới hoàn toàn
        hospital = await this.prisma.hospital.create({
          data: {
            name: normHospital.name,
            externalId: normHospital.externalId,
            source: DataSource.API,
            address: normHospital.address,
            city: normHospital.city,
            hotline: normHospital.hotline,
            operatingHours: normHospital.operatingHours,
            type: 'INTERNATIONAL',
          },
        });
      }
    } else {
      // Đã có theo externalId: Cập nhật thông tin mới nhất
      hospital = await this.prisma.hospital.update({
        where: { id: hospital.id },
        data: {
          hotline: normHospital.hotline,
          operatingHours: normHospital.operatingHours,
          address: normHospital.address,
          city: normHospital.city,
        },
      });
    }

    // 4. Cache danh sách Chuyên khoa trong DB để mapping
    const existingSpecialties = await this.prisma.specialty.findMany({
      select: { id: true, name: true },
    });
    const specialtyMapByName = new Map<string, string>();
    for (const spec of existingSpecialties) {
      specialtyMapByName.set(spec.name.toLowerCase().trim(), spec.id);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    const details: SyncItemDetail[] = [];

    // 5. Upsert từng Bác sĩ và so sánh trạng thái
    for (const doc of normDoctors) {
      // Tìm specialtyId tương ứng
      let specialtyId = specialtyMapByName.get(
        doc.targetSpecialtyName.toLowerCase().trim()
      );
      if (!specialtyId) {
        // Nếu chưa có, lấy chuyên khoa đầu tiên làm fallback an toàn
        specialtyId = existingSpecialties[0]?.id;
      }

      // Tìm bác sĩ theo externalId
      const existingDoctor = await this.prisma.doctor.findUnique({
        where: { externalId: doc.externalId },
        include: {
          workPlaces: {
            where: { hospitalId: hospital.id },
            include: { schedules: true },
          },
        },
      });

      if (!existingDoctor) {
        // TẠO MỚI (CREATED)
        const newDoctor = await this.prisma.doctor.create({
          data: {
            fullName: doc.fullName,
            title: doc.title,
            qualification: doc.qualification,
            gender: doc.gender as Gender,
            yearsOfExperience: doc.yearsOfExperience,
            avatarUrl: doc.avatarUrl,
            externalId: doc.externalId,
            source: DataSource.API,
            workPlaces: {
              create: {
                hospitalId: hospital.id,
                specialtyId: specialtyId,
                consultationFee: doc.consultationFee,
                isPrimary: true,
                isActive: true,
                schedules: {
                  create: doc.weeklyShifts.map((shift) => ({
                    dayOfWeek: shift.day_of_week,
                    startTime: shift.start_time,
                    endTime: shift.end_time,
                    isActive: true,
                  })),
                },
              },
            },
          },
        });

        createdCount++;
        details.push({
          staffId: doc.externalId,
          doctorName: doc.fullName,
          specialtyName: doc.targetSpecialtyName,
          action: 'CREATED',
        });
      } else {
        // ĐÃ TỒN TẠI -> SO SÁNH XEM CÓ THAY ĐỔI KHÔNG (UPDATED vs UNCHANGED)
        const currentWorkplace = existingDoctor.workPlaces[0];
        const changes: string[] = [];

        if (existingDoctor.fullName !== doc.fullName) {
          changes.push(`Tên: "${existingDoctor.fullName}" -> "${doc.fullName}"`);
        }
        if (existingDoctor.title !== doc.title) {
          changes.push(`Học vị: "${existingDoctor.title}" -> "${doc.title}"`);
        }
        if (existingDoctor.qualification !== doc.qualification) {
          changes.push(`Bằng cấp: "${existingDoctor.qualification}" -> "${doc.qualification}"`);
        }
        if (
          currentWorkplace &&
          Number(currentWorkplace.consultationFee) !== doc.consultationFee
        ) {
          changes.push(
            `Giá khám: ${Number(currentWorkplace.consultationFee).toLocaleString()}đ -> ${doc.consultationFee.toLocaleString()}đ`
          );
        }

        if (changes.length > 0) {
          // CÓ THAY ĐỔI -> CẬP NHẬT (UPDATED)
          await this.prisma.doctor.update({
            where: { id: existingDoctor.id },
            data: {
              fullName: doc.fullName,
              title: doc.title,
              qualification: doc.qualification,
              yearsOfExperience: doc.yearsOfExperience,
            },
          });

          if (currentWorkplace) {
            await this.prisma.doctorWorkplace.update({
              where: { id: currentWorkplace.id },
              data: {
                consultationFee: doc.consultationFee,
                specialtyId: specialtyId,
              },
            });
          }

          updatedCount++;
          details.push({
            staffId: doc.externalId,
            doctorName: doc.fullName,
            specialtyName: doc.targetSpecialtyName,
            action: 'UPDATED',
            changes,
          });
        } else {
          // KHÔNG CÓ GÌ THAY ĐỔI -> GIỮ NGUYÊN (UNCHANGED)
          unchangedCount++;
          details.push({
            staffId: doc.externalId,
            doctorName: doc.fullName,
            specialtyName: doc.targetSpecialtyName,
            action: 'UNCHANGED',
          });
        }
      }
    }

    return {
      hospital: {
        id: hospital.id,
        name: hospital.name,
        externalId: hospital.externalId || '',
      },
      summary: {
        total: normDoctors.length,
        created: createdCount,
        updated: updatedCount,
        unchanged: unchangedCount,
      },
      details,
      syncedAt: new Date().toISOString(),
    };
  }
}
