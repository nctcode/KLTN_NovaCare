import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSpecialtyDto) {
    const existing = await this.prisma.specialty.findUnique({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Chuyên khoa "${createDto.name}" đã tồn tại`);
    }
    return this.prisma.specialty.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
    });
    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại');
    }
    return specialty;
  }

  async update(id: string, updateDto: UpdateSpecialtyDto) {
    await this.findOne(id);
    if (updateDto.name) {
      const existing = await this.prisma.specialty.findUnique({
        where: { name: updateDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Chuyên khoa "${updateDto.name}" đã tồn tại`);
      }
    }
    return this.prisma.specialty.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.specialty.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================================================
  // ĐẶT LỊCH THEO CHUYÊN KHOA: TÌM & LỌC BỆNH VIỆN
  // ==================================================
  async getHospitalsBySpecialty(specialtyId: string, filter: any) {
    const specialty = await this.findOne(specialtyId);

    // 1. Lấy danh sách bệnh viện active thuộc chuyên khoa này (qua HospitalSpecialty hoặc DoctorWorkplace)
    const hospitals = await this.prisma.hospital.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          {
            hospitalSpecialties: {
              some: {
                specialtyId,
                isActive: true,
              },
            },
          },
          {
            workPlaces: {
              some: {
                specialtyId,
                isActive: true,
              },
            },
          },
        ],
      },
    });

    const now = new Date();

    // Parse date filter limits if present
    let dateStart: Date | null = null;
    let dateEnd: Date | null = null;

    if (filter.date) {
      if (filter.date === 'today') {
        dateStart = new Date();
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date();
        dateEnd.setHours(23, 59, 59, 999);
      } else if (filter.date === 'tomorrow') {
        dateStart = new Date();
        dateStart.setDate(dateStart.getDate() + 1);
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date();
        dateEnd.setDate(dateEnd.getDate() + 1);
        dateEnd.setHours(23, 59, 59, 999);
      } else if (filter.date === 'weekend') {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 is Sun, 6 is Sat
        const satOffset = (6 - dayOfWeek + 7) % 7;
        dateStart = new Date();
        dateStart.setDate(today.getDate() + satOffset);
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date(dateStart);
        dateEnd.setDate(dateStart.getDate() + 1);
        dateEnd.setHours(23, 59, 59, 999);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(filter.date)) {
        dateStart = new Date(filter.date);
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date(filter.date);
        dateEnd.setHours(23, 59, 59, 999);
      }
    }

    // Process each hospital
    const hospitalResults: any[] = [];

    for (const hosp of hospitals) {
      // Lấy danh sách DoctorWorkplace active thuộc bệnh viện & chuyên khoa này
      const workplaces = await this.prisma.doctorWorkplace.findMany({
        where: {
          hospitalId: hosp.id,
          specialtyId,
          isActive: true,
          doctor: {
            isActive: true,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          consultationFee: true,
        },
      });

      const doctorCount = workplaces.length;

      // Phí khám từ... MIN(consultationFee)
      let startingFee = 0;
      if (workplaces.length > 0) {
        startingFee = Math.min(...workplaces.map((w) => Number(w.consultationFee)));
      }

      // Lấy danh sách AppointmentSlot của các bác sĩ thuộc chuyên khoa này tại bệnh viện
      const workplaceIds = workplaces.map((w) => w.id);

      let slotWhere: any = {
        doctorWorkplaceId: { in: workplaceIds },
        isActive: true,
        isAvailable: true,
        startTime: { gte: now },
      };

      if (dateStart && dateEnd) {
        slotWhere.startTime = { gte: dateStart, lte: dateEnd };
      }

      const availableSlots = await this.prisma.appointmentSlot.findMany({
        where: slotWhere,
        orderBy: { startTime: 'asc' },
      });

      // Filter slots by capacity (bookedCount < capacity)
      let validSlots = availableSlots.filter((s) => s.bookedCount < s.capacity);

      // Filter slots by timeOfDay if requested
      if (filter.timeOfDay) {
        validSlots = validSlots.filter((s) => {
          const hour = new Date(s.startTime).getHours();
          if (filter.timeOfDay === 'morning') return hour >= 0 && hour < 12;
          if (filter.timeOfDay === 'afternoon') return hour >= 12 && hour < 17;
          if (filter.timeOfDay === 'evening') return hour >= 17 && hour < 24;
          return true;
        });
      }

      const earliestSlot = validSlots.length > 0 ? validSlots[0].startTime : null;
      const totalAvailableSlots = validSlots.length;
      const hasAvailableSlots = validSlots.length > 0;

      // Calculate distance if lat and lng provided
      let distance: number | null = null;
      if (
        filter.lat !== undefined &&
        filter.lng !== undefined &&
        hosp.latitude !== null &&
        hosp.longitude !== null
      ) {
        distance = this.calculateHaversineDistance(
          Number(filter.lat),
          Number(filter.lng),
          Number(hosp.latitude),
          Number(hosp.longitude)
        );
      }

      hospitalResults.push({
        hospital: {
          id: hosp.id,
          name: hosp.name,
          address: hosp.address,
          city: hosp.city,
          type: hosp.type,
          logoUrl: hosp.logoUrl,
          coverImageUrl: hosp.coverImageUrl,
          rating: hosp.rating,
          reviewCount: hosp.reviewCount,
          latitude: hosp.latitude,
          longitude: hosp.longitude,
        },
        doctorCount,
        startingFee,
        earliestSlot,
        totalAvailableSlots,
        hasAvailableSlots,
        distance,
      });
    }

    // Apply distance filter
    let filtered = hospitalResults;
    if (filter.maxDistance !== undefined && filter.maxDistance > 0) {
      filtered = filtered.filter(
        (h) => h.distance !== null && h.distance <= Number(filter.maxDistance)
      );
    }

    // Apply price range filter
    if (filter.minPrice !== undefined && filter.minPrice > 0) {
      filtered = filtered.filter((h) => h.startingFee >= Number(filter.minPrice));
    }
    if (filter.maxPrice !== undefined && filter.maxPrice > 0) {
      filtered = filtered.filter((h) => h.startingFee <= Number(filter.maxPrice));
    }

    // Apply onlyAvailable filter
    if (filter.onlyAvailable === true || filter.onlyAvailable === 'true') {
      filtered = filtered.filter((h) => h.hasAvailableSlots);
    }

    // Calculate Min & Max starting fee and Max available slots across filtered items for normalization
    const startingFees = filtered.map((h) => h.startingFee);
    const minFee = startingFees.length > 0 ? Math.min(...startingFees) : 0;
    const maxFee = startingFees.length > 0 ? Math.max(...startingFees) : 0;

    const slotCounts = filtered.map((h) => h.totalAvailableSlots);
    const maxSlots = slotCounts.length > 0 ? Math.max(...slotCounts) : 0;

    // Calculate Weighted Scores (0-100)
    for (const item of filtered) {
      // 1. Slot score (30%)
      let slotScore = 0;
      if (item.earliestSlot) {
        const hours = (new Date(item.earliestSlot).getTime() - now.getTime()) / (1000 * 3600);
        if (hours <= 2) slotScore = 100;
        else if (hours <= 24) slotScore = 100 - (hours - 2) * (30 / 22);
        else if (hours <= 168) slotScore = 70 - (hours - 24) * (40 / 144);
        else slotScore = Math.max(10, 30 - (hours - 168) * (20 / 504));
      }

      // 2. Distance score (25%)
      let distanceScore: number | null = null;
      if (item.distance !== null) {
        const d = item.distance;
        if (d <= 1) distanceScore = 100;
        else if (d <= 30) distanceScore = Math.max(0, 100 - (d - 1) * (100 / 29));
        else distanceScore = 0;
      }

      // 3. Rating score (20%)
      const ratingScore = Math.min(100, Math.max(0, (item.hospital.rating / 5.0) * 100));

      // 4. Price score (15%)
      let priceScore = 100;
      if (maxFee > minFee) {
        priceScore = Math.max(0, Math.min(100, 100 * (1 - (item.startingFee - minFee) / (maxFee - minFee))));
      }

      // 5. Availability score (10%)
      let availabilityScore = 0;
      if (maxSlots > 0) {
        availabilityScore = Math.min(100, (item.totalAvailableSlots / maxSlots) * 100);
      }

      let finalScore = 0;
      if (distanceScore !== null) {
        finalScore =
          0.3 * slotScore +
          0.25 * distanceScore +
          0.2 * ratingScore +
          0.15 * priceScore +
          0.1 * availabilityScore;
      } else {
        finalScore =
          0.35 * slotScore +
          0.25 * ratingScore +
          0.25 * priceScore +
          0.15 * availabilityScore;
      }

      item.finalScore = Number(finalScore.toFixed(1));
      item.scores = {
        slotScore: Number(slotScore.toFixed(1)),
        distanceScore: distanceScore !== null ? Number(distanceScore.toFixed(1)) : null,
        ratingScore: Number(ratingScore.toFixed(1)),
        priceScore: Number(priceScore.toFixed(1)),
        availabilityScore: Number(availabilityScore.toFixed(1)),
      };
    }

    // Sorting
    const sortMode = filter.sort || 'relevant';

    filtered.sort((a, b) => {
      if (sortMode === 'earliest') {
        if (a.earliestSlot && b.earliestSlot) {
          return new Date(a.earliestSlot).getTime() - new Date(b.earliestSlot).getTime();
        }
        if (a.earliestSlot) return -1;
        if (b.earliestSlot) return 1;
        return b.hospital.rating - a.hospital.rating;
      }

      if (sortMode === 'nearest') {
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        return b.hospital.rating - a.hospital.rating;
      }

      if (sortMode === 'rating') {
        return b.hospital.rating - a.hospital.rating;
      }

      if (sortMode === 'price') {
        return a.startingFee - b.startingFee;
      }

      // Default: 'relevant' (Weighted Scoring)
      // Rank hospitals with available slots first, by finalScore DESC.
      // Rank hospitals without slots at the bottom, by rating DESC.
      if (a.hasAvailableSlots && !b.hasAvailableSlots) return -1;
      if (!a.hasAvailableSlots && b.hasAvailableSlots) return 1;
      if (a.hasAvailableSlots && b.hasAvailableSlots) {
        return b.finalScore - a.finalScore;
      }
      return b.hospital.rating - a.hospital.rating;
    });

    return {
      specialty,
      totalCount: filtered.length,
      hospitals: filtered,
    };
  }

  // Haversine formula to compute distance between two coordinates in km
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }
}

