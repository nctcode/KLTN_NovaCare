import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SearchCategory, SearchSortBy, UniversalSearchQueryDto } from './dto/universal-search.dto';

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(dto: UniversalSearchQueryDto) {
    const category = dto.category || SearchCategory.ALL;
    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(dto.limit) || 20));
    const skip = (page - 1) * limit;

    const hasCoords =
      typeof dto.lat === 'number' &&
      typeof dto.lng === 'number' &&
      !isNaN(dto.lat) &&
      !isNaN(dto.lng);

    const specialtyIdList = dto.specialtyIds
      ? dto.specialtyIds.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    switch (category) {
      case SearchCategory.DOCTOR:
        return this.searchDoctors(dto, page, limit, skip, hasCoords, specialtyIdList);
      case SearchCategory.HOSPITAL:
        return this.searchFacilities(dto, 'HOSPITAL', page, limit, skip, hasCoords, specialtyIdList);
      case SearchCategory.CLINIC:
        return this.searchFacilities(dto, 'CLINIC', page, limit, skip, hasCoords, specialtyIdList);
      case SearchCategory.SPECIALTY:
        return this.searchSpecialties(dto, page, limit, skip);
      case SearchCategory.SERVICE:
        return this.searchServices(dto, page, limit, skip, specialtyIdList);
      case SearchCategory.ALL:
      default:
        return this.searchAll(dto, hasCoords, specialtyIdList);
    }
  }

  private async searchDoctors(
    dto: UniversalSearchQueryDto,
    page: number,
    limit: number,
    skip: number,
    hasCoords: boolean,
    specialtyIdList: string[],
  ) {
    const q = dto.q?.trim();
    const whereConditions: any[] = [{ deletedAt: null }, { isActive: true }];

    if (q) {
      whereConditions.push({
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { qualification: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
          {
            workPlaces: {
              some: {
                specialty: { name: { contains: q, mode: 'insensitive' } },
              },
            },
          },
        ],
      });
    }

    if (specialtyIdList.length > 0) {
      whereConditions.push({
        workPlaces: {
          some: {
            specialtyId: { in: specialtyIdList },
            isActive: true,
          },
        },
      });
    }

    if (dto.province) {
      whereConditions.push({
        workPlaces: {
          some: {
            hospital: {
              OR: [
                { city: { contains: dto.province, mode: 'insensitive' } },
                { address: { contains: dto.province, mode: 'insensitive' } },
              ],
            },
          },
        },
      });
    }

    if (dto.district) {
      whereConditions.push({
        workPlaces: {
          some: {
            hospital: {
              address: { contains: dto.district, mode: 'insensitive' },
            },
          },
        },
      });
    }

    const doctors = await this.prisma.doctor.findMany({
      where: { AND: whereConditions },
      include: {
        workPlaces: {
          where: { isActive: true },
          include: {
            hospital: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                latitude: true,
                longitude: true,
                type: true,
              },
            },
            specialty: { select: { id: true, name: true } },
          },
        },
      },
    });

    const mapped = (doctors as any[]).map((doc: any) => {
      let minDistance: number | null = null;
      let nearestFacility: any = null;

      if (hasCoords) {
        for (const wp of doc.workPlaces) {
          if (wp.hospital?.latitude != null && wp.hospital?.longitude != null) {
            const dist = haversineDistanceKm(
              dto.lat!,
              dto.lng!,
              wp.hospital.latitude,
              wp.hospital.longitude,
            );
            if (minDistance === null || dist < minDistance) {
              minDistance = dist;
              nearestFacility = wp.hospital;
            }
          }
        }
      }

      const primaryWp = doc.workPlaces.find((w: any) => w.isPrimary) || doc.workPlaces[0];

      return {
        id: doc.id,
        fullName: doc.fullName,
        title: doc.title,
        avatarUrl: doc.avatarUrl,
        qualification: doc.qualification,
        yearsOfExperience: doc.yearsOfExperience,
        rating: doc.rating,
        reviewCount: doc.reviewCount,
        consultationCount: doc.consultationCount,
        specialties: doc.workPlaces.map((w: any) => w.specialty),
        hospital: primaryWp?.hospital || null,
        distanceKm: minDistance,
        nearestFacilityName: nearestFacility?.name || primaryWp?.hospital?.name || null,
        workPlaces: doc.workPlaces,
      };
    });

    if (dto.sort === SearchSortBy.DISTANCE && hasCoords) {
      mapped.sort((a: any, b: any) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    const total = mapped.length;
    const items = mapped.slice(skip, skip + limit);

    return {
      category: SearchCategory.DOCTOR,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
      items,
    };
  }

  private async searchFacilities(
    dto: UniversalSearchQueryDto,
    mode: 'HOSPITAL' | 'CLINIC',
    page: number,
    limit: number,
    skip: number,
    hasCoords: boolean,
    specialtyIdList: string[],
  ) {
    const q = dto.q?.trim();
    const whereConditions: any[] = [{ deletedAt: null }, { isActive: true }];

    if (mode === 'CLINIC') {
      whereConditions.push({
        OR: [
          { name: { contains: 'Phòng khám', mode: 'insensitive' } },
          { description: { contains: 'Phòng khám', mode: 'insensitive' } },
        ],
      });
    } else {
      whereConditions.push({
        NOT: { name: { contains: 'Phòng khám' } },
      });
    }

    if (q) {
      whereConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (specialtyIdList.length > 0) {
      whereConditions.push({
        hospitalSpecialties: {
          some: {
            specialtyId: { in: specialtyIdList },
            isActive: true,
          },
        },
      });
    }

    if (dto.province) {
      whereConditions.push({
        OR: [
          { city: { contains: dto.province, mode: 'insensitive' } },
          { address: { contains: dto.province, mode: 'insensitive' } },
        ],
      });
    }

    if (dto.district) {
      whereConditions.push({
        address: { contains: dto.district, mode: 'insensitive' },
      });
    }

    const facilities = await this.prisma.hospital.findMany({
      where: { AND: whereConditions },
      include: {
        branches: { where: { isActive: true } },
        hospitalSpecialties: {
          where: { isActive: true },
          include: { specialty: true },
        },
      },
    });

    const mapped = (facilities as any[]).map((fac: any) => {
      let minDistance: number | null = null;
      if (hasCoords) {
        if (fac.latitude != null && fac.longitude != null) {
          minDistance = haversineDistanceKm(dto.lat!, dto.lng!, fac.latitude, fac.longitude);
        }
        for (const b of fac.branches) {
          if (b.latitude != null && b.longitude != null) {
            const bDist = haversineDistanceKm(dto.lat!, dto.lng!, b.latitude, b.longitude);
            if (minDistance === null || bDist < minDistance) {
              minDistance = bDist;
            }
          }
        }
      }

      return {
        id: fac.id,
        name: fac.name,
        address: fac.address,
        city: fac.city,
        type: fac.type,
        rating: fac.rating,
        reviewCount: fac.reviewCount,
        logoUrl: fac.logoUrl,
        coverImageUrl: fac.coverImageUrl,
        phone: fac.phone,
        hotline: fac.hotline,
        operatingHours: fac.operatingHours,
        distanceKm: minDistance,
        branchesCount: fac.branches.length,
        specialties: fac.hospitalSpecialties.map((s: any) => s.specialty),
      };
    });

    if (dto.sort === SearchSortBy.DISTANCE && hasCoords) {
      mapped.sort((a: any, b: any) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    const total = mapped.length;
    const items = mapped.slice(skip, skip + limit);

    return {
      category: mode === 'CLINIC' ? SearchCategory.CLINIC : SearchCategory.HOSPITAL,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
      items,
    };
  }

  private async searchSpecialties(
    dto: UniversalSearchQueryDto,
    page: number,
    limit: number,
    skip: number,
  ) {
    const q = dto.q?.trim();
    const where: any = { isActive: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.specialty.count({ where }),
      this.prisma.specialty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      category: SearchCategory.SPECIALTY,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
      items,
    };
  }

  private async searchServices(
    dto: UniversalSearchQueryDto,
    page: number,
    limit: number,
    skip: number,
    specialtyIdList: string[],
  ) {
    const q = dto.q?.trim();
    const where: any = { isActive: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (specialtyIdList.length > 0) {
      where.specialtyId = { in: specialtyIdList };
    }

    const [total, items] = await Promise.all([
      this.prisma.medicalService.count({ where }),
      this.prisma.medicalService.findMany({
        where,
        include: { hospital: { select: { id: true, name: true, city: true } } },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      category: SearchCategory.SERVICE,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
      items,
    };
  }

  private async searchAll(
    dto: UniversalSearchQueryDto,
    hasCoords: boolean,
    specialtyIdList: string[],
  ) {
    const [doctorsRes, hospitalsRes, clinicsRes, specialtiesRes, servicesRes] = await Promise.all([
      this.searchDoctors(dto, 1, 5, 0, hasCoords, specialtyIdList),
      this.searchFacilities(dto, 'HOSPITAL', 1, 4, 0, hasCoords, specialtyIdList),
      this.searchFacilities(dto, 'CLINIC', 1, 4, 0, hasCoords, specialtyIdList),
      this.searchSpecialties(dto, 1, 6, 0),
      this.searchServices(dto, 1, 5, 0, specialtyIdList),
    ]);

    return {
      category: SearchCategory.ALL,
      doctors: doctorsRes.items,
      doctorsCount: doctorsRes.total,
      hospitals: hospitalsRes.items,
      hospitalsCount: hospitalsRes.total,
      clinics: clinicsRes.items,
      clinicsCount: clinicsRes.total,
      specialties: specialtiesRes.items,
      specialtiesCount: specialtiesRes.total,
      services: servicesRes.items,
      servicesCount: servicesRes.total,
    };
  }

  async getPopular() {
    const [specialties, hospitals, clinics] = await Promise.all([
      this.prisma.specialty.findMany({
        where: { isActive: true },
        take: 8,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.hospital.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          name: { not: { contains: 'Phòng khám' } },
        },
        take: 4,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          logoUrl: true,
          rating: true,
          reviewCount: true,
          type: true,
        },
      }),
      this.prisma.hospital.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          name: { contains: 'Phòng khám' },
        },
        take: 3,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          logoUrl: true,
          rating: true,
          reviewCount: true,
          type: true,
        },
      }),
    ]);

    return {
      popularSpecialties: specialties,
      popularHospitals: hospitals,
      popularClinics: clinics,
    };
  }

  async getLocations() {
    return [
      {
        province: 'Thành phố Hồ Chí Minh',
        districts: [
          'Quận 1',
          'Quận 3',
          'Quận 5',
          'Quận 7',
          'Quận 10',
          'Quận Tân Bình',
          'Quận Gò Vấp',
          'Quận Bình Tân',
          'TP. Thủ Đức',
        ],
      },
      {
        province: 'Thành phố Hà Nội',
        districts: ['Quận Hoàn Kiếm', 'Quận Ba Đình', 'Quận Đống Đa', 'Quận Cầu Giấy', 'Quận Hai Bà Trưng'],
      },
      {
        province: 'Thành phố Đà Nẵng',
        districts: ['Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà'],
      },
      {
        province: 'Thành phố Cần Thơ',
        districts: ['Quận Ninh Kiều', 'Quận Cái Răng'],
      },
      {
        province: 'Tỉnh An Giang',
        districts: ['TP. Long Xuyên', 'TP. Châu Đốc'],
      },
      {
        province: 'Tỉnh Đồng Nai',
        districts: ['TP. Biên Hòa', 'Huyện Long Thành'],
      },
    ];
  }
}
