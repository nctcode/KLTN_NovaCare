import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
<<<<<<< HEAD
=======
  Logger,
>>>>>>> 5d6d7dd (feat: Tich hop lien he hop tac va ket noi API HIS doi tac)
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AppointmentStatus, Prisma, DataSource, Gender } from '@prisma/client';
import { UpdateMyHospitalDto } from './dto/update-my-hospital.dto';
import { SyncHospitalCatalogDto } from './dto/sync-hospital-catalog.dto';
import { CatalogSyncService } from '@/modules/integration/catalog-sync/catalog-sync.service';
import { CatalogNormalizerService } from '@/modules/integration/catalog-sync/catalog-normalizer.service';

@Injectable()
export class HospitalAdminService {
  private readonly logger = new Logger(HospitalAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogSyncService: CatalogSyncService,
    private readonly catalogNormalizer: CatalogNormalizerService,
  ) { }

  /**
   * 1. Lấy thông tin chi tiết bệnh viện của mình
   */
  async getMyHospital(hospitalId: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        _count: {
          select: {
            workPlaces: { where: { isActive: true } },
            services: { where: { isActive: true } },
            packages: { where: { isActive: true } },
          },
        },
      },
    });

    if (!hospital) {
      throw new NotFoundException('Không tìm thấy cơ sở y tế');
    }

    return hospital;
  }

  /**
   * 2. Cập nhật thông tin bệnh viện của mình
   */
  async updateMyHospital(hospitalId: string, dto: UpdateMyHospitalDto) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new NotFoundException('Không tìm thấy cơ sở y tế');
    }

    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        hotline: dto.hotline ?? hospital.hotline,
        phone: dto.phone ?? hospital.phone,
        emergencyHotline: dto.emergencyHotline ?? hospital.emergencyHotline,
        address: dto.address ?? hospital.address,
        operatingHours: dto.operatingHours ?? hospital.operatingHours,
        description: dto.description ?? hospital.description,
        website: dto.website ?? hospital.website,
        email: dto.email ?? hospital.email,
      },
    });
  }

  /**
   * 3. Lấy danh sách bác sĩ thuộc bệnh viện của mình (DATA ISOLATION)
   */
  async getMyDoctors(
    hospitalId: string,
    params?: {
      search?: string;
      specialtyId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DoctorWorkplaceWhereInput = {
      hospitalId,
      ...(params?.specialtyId ? { specialtyId: params.specialtyId } : {}),
      ...(params?.search
        ? {
          doctor: {
            OR: [
              { fullName: { contains: params.search, mode: 'insensitive' } },
              { externalId: { contains: params.search, mode: 'insensitive' } },
              { qualification: { contains: params.search, mode: 'insensitive' } },
            ],
          },
        }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.doctorWorkplace.count({ where }),
      this.prisma.doctorWorkplace.findMany({
        where,
        skip,
        take: limit,
        include: {
          doctor: true,
          specialty: true,
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: items.map((wp) => ({
        workplaceId: wp.id,
        doctorId: wp.doctorId,
        externalId: wp.doctor.externalId,
        source: wp.doctor.source,
        fullName: wp.doctor.fullName,
        title: wp.doctor.title,
        qualification: wp.doctor.qualification,
        avatarUrl: wp.doctor.avatarUrl,
        gender: wp.doctor.gender,
        yearsOfExperience: wp.doctor.yearsOfExperience,
        specialty: wp.specialty.name,
        specialtyId: wp.specialtyId,
        consultationFee: Number(wp.consultationFee),
        isActive: wp.isActive,
        schedules: wp.schedules,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 4. Chỉnh sửa giá khám hoặc bật/tắt bác sĩ tại viện mình
   */
  async updateDoctorWorkplace(
    hospitalId: string,
    workplaceId: string,
    data: { consultationFee?: number; isActive?: boolean; specialtyId?: string }
  ) {
    const workplace = await this.prisma.doctorWorkplace.findFirst({
      where: { id: workplaceId, hospitalId },
    });

    if (!workplace) {
      throw new NotFoundException(
        'Không tìm thấy bác sĩ tại cơ sở y tế của bạn'
      );
    }

    return this.prisma.doctorWorkplace.update({
      where: { id: workplaceId },
      data: {
        ...(data.consultationFee !== undefined
          ? { consultationFee: data.consultationFee }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.specialtyId ? { specialtyId: data.specialtyId } : {}),
      },
      include: { doctor: true, specialty: true },
    });
  }

  /**
   * 5. Lấy danh sách lịch hẹn tại bệnh viện của mình (DATA ISOLATION)
   */
  async getMyAppointments(
    hospitalId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: AppointmentStatus | 'OVERDUE';
      search?: string;
    }
  ) {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      slot: {
        doctorWorkplace: {
          hospitalId,
        },
      },
      ...(params?.status === 'OVERDUE' ? {
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.PAID] },
        medicalEncounter: { is: null },
        AND: [{ slot: { startTime: { lt: new Date() } } }],
      } : params?.status ? { status: params.status } : {}),
      ...(params?.search
        ? {
          OR: [
            { bookingCode: { contains: params.search, mode: 'insensitive' } },
            {
              patientProfile: {
                fullName: { contains: params.search, mode: 'insensitive' },
              },
            },
            {
              slot: {
                doctorWorkplace: {
                  doctor: {
                    fullName: { contains: params.search, mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          patientProfile: {
            select: {
              fullName: true,
              phone: true,
              gender: true,
              dateOfBirth: true,
            },
          },
          slot: {
            include: {
              doctorWorkplace: {
                include: {
                  doctor: { select: { fullName: true, title: true } },
                  specialty: { select: { name: true } },
                },
              },
            },
          },
          payment: { select: { status: true, amount: true, paymentMethod: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: items.map((a) => ({
        id: a.id,
        bookingCode: a.bookingCode,
        patientName: a.patientProfile.fullName,
        patientPhone: a.patientProfile.phone,
        doctorName: `${a.slot.doctorWorkplace.doctor.title || ''} ${a.slot.doctorWorkplace.doctor.fullName}`.trim(),
        specialty: a.slot.doctorWorkplace.specialty.name,
        startTime: a.slot.startTime,
        endTime: a.slot.endTime,
        status: a.status,
        totalPrice: Number(a.totalPrice),
        paymentStatus: a.payment?.status || 'PENDING',
        createdAt: a.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 6. Cập nhật trạng thái lịch hẹn (Xác nhận / Hoàn thành / Hủy)
   */
  async updateAppointmentStatus(
    hospitalId: string,
    appointmentId: string,
    newStatus: AppointmentStatus,
    note?: string
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        slot: { doctorWorkplace: { hospitalId } },
      },
      include: { slot: true, medicalEncounter: true },
    });

    if (!appointment) {
      throw new NotFoundException(
        'Lịch hẹn không tồn tại hoặc không thuộc cơ sở y tế của bạn'
      );
    }

    if (newStatus === 'NO_SHOW' && (
      !['PENDING', 'CONFIRMED', 'PAID'].includes(appointment.status) ||
      appointment.slot.startTime > new Date() || appointment.medicalEncounter
    )) throw new BadRequestException('Chỉ xác nhận không đến khám khi đã qua giờ hẹn và chưa tiếp nhận.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: newStatus,
          ...(newStatus === AppointmentStatus.COMPLETED
            ? { completedAt: new Date() }
            : {}),
          ...(newStatus === AppointmentStatus.CANCELLED
            ? { cancelledAt: new Date() }
            : {}),
        },
      });

      // Lưu vết lịch sử trạng thái
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId,
          status: newStatus,
          note: note || `Cập nhật bởi Quản trị viên Bệnh viện`,
        },
      });

      if (newStatus !== appointment.status) await tx.notification.create({
        data: {
          userId: appointment.userId,
          type: newStatus === 'CANCELLED' ? 'CANCELLED' : 'SYSTEM',
          title: 'Cơ sở cập nhật lịch khám',
          content: newStatus === 'NO_SHOW'
            ? `Cơ sở xác nhận bạn không đến khám lịch ${appointment.bookingCode}. Nếu thông tin chưa đúng, vui lòng liên hệ cơ sở. Việc thanh toán được xử lý riêng.`
            : `Lịch ${appointment.bookingCode} đã được cập nhật: ${note || newStatus}.`,
          data: { appointmentId },
        }
      });
      return updated;
    });
  }

  /**
   * 7. Thống kê tổng quan cho Dashboard của viện
   */
  async getDashboardOverview(hospitalId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalDoctors,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
    ] = await Promise.all([
      this.prisma.doctorWorkplace.count({
        where: { hospitalId, isActive: true },
      }),
      this.prisma.appointment.count({
        where: {
          slot: {
            doctorWorkplace: { hospitalId },
            startTime: { gte: today, lt: tomorrow },
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          slot: { doctorWorkplace: { hospitalId } },
          status: AppointmentStatus.COMPLETED,
        },
      }),
      this.prisma.appointment.count({
        where: {
          slot: { doctorWorkplace: { hospitalId } },
          status: AppointmentStatus.PENDING,
        },
      }),
    ]);

    return {
      totalDoctors,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
    };
  }

  /**
   * 8. Lấy danh mục chuyên khoa và số lượng bác sĩ của viện mình
   */
  async getMySpecialties(hospitalId: string) {
    const [hospitalSpecialties, workplaces] = await Promise.all([
      this.prisma.hospitalSpecialty.findMany({
        where: { hospitalId, isActive: true },
        include: { specialty: true },
      }),
      this.prisma.doctorWorkplace.findMany({
        where: { hospitalId, isActive: true },
        include: {
          specialty: true,
          doctor: {
            select: { id: true, fullName: true, title: true, avatarUrl: true },
          },
        },
      }),
    ]);

    // Group by specialty
    const specialtyMap = new Map<string, any>();

    for (const hs of hospitalSpecialties) {
      if (hs.specialty && !specialtyMap.has(hs.specialtyId)) {
        specialtyMap.set(hs.specialtyId, {
          id: hs.specialty.id,
          name: hs.specialty.name,
          description: hs.specialty.description,
          icon: hs.specialty.icon,
          doctorCount: 0,
          doctors: [],
        });
      }
    }

    for (const wp of workplaces) {
      if (wp.specialty && !specialtyMap.has(wp.specialtyId)) {
        specialtyMap.set(wp.specialtyId, {
          id: wp.specialty.id,
          name: wp.specialty.name,
          description: wp.specialty.description,
          icon: wp.specialty.icon,
          doctorCount: 0,
          doctors: [],
        });
      }
      const item = specialtyMap.get(wp.specialtyId);
      if (item) {
        item.doctorCount += 1;
        item.doctors.push(wp.doctor);
      }
    }

    return Array.from(specialtyMap.values());
  }

  /**
   * 9. Lấy danh sách lịch trực / làm việc của bác sĩ trong viện
   */
  async getMySchedules(hospitalId: string) {
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorWorkplace: {
          hospitalId,
          isActive: true,
        },
      },
      include: {
        doctorWorkplace: {
          include: {
            doctor: { select: { id: true, fullName: true, title: true } },
            specialty: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return schedules.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      breakStart: s.breakStart,
      breakEnd: s.breakEnd,
      isActive: s.isActive,
      doctor: s.doctorWorkplace.doctor,
      specialty: s.doctorWorkplace.specialty,
      consultationFee: s.doctorWorkplace.consultationFee,
    }));
  }

  /**
   * 10. Lấy danh sách dịch vụ y tế của bệnh viện (DATA ISOLATION)
   */
  async getMyServices(
    hospitalId: string,
    params?: {
      search?: string;
      specialtyId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const targetHospitalId = await this.resolveHospitalId(hospitalId);
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicalServiceWhereInput = {
      hospitalId: targetHospitalId,
      ...(params?.specialtyId ? { specialtyId: params.specialtyId } : {}),
      ...(params?.search
        ? {
          name: { contains: params.search, mode: 'insensitive' },
        }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.medicalService.count({ where }),
      this.prisma.medicalService.findMany({
        where,
        skip,
        take: limit,
        include: {
          specialty: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        duration: s.duration,
        isActive: s.isActive,
        specialty: s.specialty,
        createdAt: s.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 11. Cập nhật dịch vụ y tế của bệnh viện
   */
  async updateMyService(
    hospitalId: string,
    serviceId: string,
    data: { price?: number; isActive?: boolean }
  ) {
    const targetHospitalId = await this.resolveHospitalId(hospitalId);
    const service = await this.prisma.medicalService.findFirst({
      where: { id: serviceId, hospitalId: targetHospitalId },
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ tại cơ sở y tế của bạn');
    }

    return this.prisma.medicalService.update({
      where: { id: serviceId },
      data: {
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: {
        specialty: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Helper giải quyết hospitalId an toàn (fallback cho Platform Admin)
   */
  async resolveHospitalId(hospitalId?: string): Promise<string> {
    if (hospitalId) return hospitalId;
    const first = await this.prisma.hospital.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!first) throw new NotFoundException('Không tìm thấy cơ sở y tế nào trong hệ thống');
    return first.id;
  }

  /**
   * 12. Test Handshake kết nối HIS
   */
  async testHandshake(endpointUrl?: string, authType?: string, authToken?: string) {
    if (!endpointUrl || !endpointUrl.trim()) {
      throw new BadRequestException('Vui lòng nhập đường dẫn Endpoint URL của hệ thống HIS');
    }

    if (authType && authType !== 'none' && (!authToken || !authToken.trim())) {
      throw new BadRequestException(
        `Bạn đã chọn phương thức xác thực "${authType === 'api_key' ? 'X-API-KEY' : 'Bearer Token'}" nhưng chưa nhập mã khóa API Key / Token`
      );
    }

    const rawCatalog = await this.catalogSyncService.fetchHisCatalog(
      endpointUrl,
      authType,
      authToken
    );
    return {
      success: true,
      hospitalCode: rawCatalog.hospital_code,
      hospitalName: rawCatalog.hospital_name,
      hotline: rawCatalog.hotline || null,
      emergencyHotline: rawCatalog.emergency_hotline || null,
      address: rawCatalog.address || null,
      city: rawCatalog.city || null,
      website: rawCatalog.website || null,
      establishedYear: rawCatalog.established_year ? Number(rawCatalog.established_year) : null,
      bedCount: rawCatalog.bed_count ? Number(rawCatalog.bed_count) : null,
      operatingHours: rawCatalog.operating_hours || null,
      totalDepartments: rawCatalog.departments?.length || 0,
      totalDoctors: rawCatalog.doctors?.length || 0,
      departments: rawCatalog.departments || [],
      doctors: (rawCatalog.doctors || []).map((doc) => ({
        staffId: doc.staff_id,
        fullName: doc.full_name,
        academicDegree: doc.academic_degree,
        qualificationTitle: doc.qualification_title,
        gender: doc.gender,
        deptCode: doc.dept_code,
        consultationFee: doc.consultation_fee,
        experienceYears: doc.experience_years,
        avatarUrl: doc.avatar_url,
        shiftsCount: doc.weekly_shifts?.length || 0,
        weeklyShifts: doc.weekly_shifts || [],
      })),
    };
  }

  /**
   * 13. Đồng bộ Catalog từ HIS vào Bệnh viện cụ thể (Hospital Scope)
   */
  async syncHospitalCatalog(hospitalId: string, dto: SyncHospitalCatalogDto) {
    if (!dto.endpointUrl || !dto.endpointUrl.trim()) {
      throw new BadRequestException('Vui lòng nhập đường dẫn Endpoint URL của hệ thống HIS');
    }

    if (dto.authType && dto.authType !== 'none' && (!dto.authToken || !dto.authToken.trim())) {
      throw new BadRequestException(
        `Bạn đã chọn phương thức xác thực "${dto.authType === 'api_key' ? 'X-API-KEY' : 'Bearer Token'}" nhưng chưa nhập mã khóa API Key / Token`
      );
    }

    const targetHospitalId = await this.resolveHospitalId(hospitalId);
    const rawCatalog = await this.catalogSyncService.fetchHisCatalog(
      dto.endpointUrl,
      dto.authType,
      dto.authToken
    );

    // 1. Cập nhật thông tin Bệnh viện
    await this.prisma.hospital.update({
      where: { id: targetHospitalId },
      data: {
        externalId: rawCatalog.hospital_code,
        source: DataSource.API,
        ...(rawCatalog.hotline ? { hotline: rawCatalog.hotline } : {}),
        ...(rawCatalog.emergency_hotline ? { emergencyHotline: rawCatalog.emergency_hotline } : {}),
        ...(rawCatalog.address ? { address: rawCatalog.address } : {}),
        ...(rawCatalog.city ? { city: rawCatalog.city } : {}),
        ...(rawCatalog.website ? { website: rawCatalog.website } : {}),
        ...(rawCatalog.established_year ? { establishedYear: Number(rawCatalog.established_year) } : {}),
        ...(rawCatalog.bed_count ? { bedCount: Number(rawCatalog.bed_count) } : {}),
        ...(rawCatalog.operating_hours ? { operatingHours: rawCatalog.operating_hours } : {}),
      },
    });

    // 2. Tải toàn bộ danh mục Chuyên khoa hiện có trong NovaCare
    const existingSpecialties = await this.prisma.specialty.findMany({
      select: { id: true, name: true },
    });
    const specialtyMapByName = new Map<string, string>();
    for (const spec of existingSpecialties) {
      specialtyMapByName.set(spec.name.toLowerCase().trim(), spec.id);
    }

    // 3. Xử lý Chuyên khoa (Khoa phòng của HIS -> Chuyên khoa NovaCare)
    const deptToSpecialtyIdMap = new Map<string, string>();
    for (const dept of rawCatalog.departments || []) {
      let matchedSpecialtyId = dto.specialtyMappings?.[dept.dept_code];

      // Nếu người dùng chọn tự động tạo hoặc chưa có mapping
      if (matchedSpecialtyId === '__AUTO_CREATE__') {
        matchedSpecialtyId = undefined;
      }

      if (!matchedSpecialtyId) {
        // 1. Tìm theo bảng quy đổi hoặc Heuristics từ khóa
        const defaultSpecialtyName = this.catalogNormalizer.resolveSpecialtyName(dept.dept_code, dept.dept_name);
        if (defaultSpecialtyName) {
          matchedSpecialtyId = specialtyMapByName.get(defaultSpecialtyName.toLowerCase().trim());
        }
      }

      if (!matchedSpecialtyId) {
        // 2. Tìm theo tên gần đúng trong danh mục hiện tại
        for (const spec of existingSpecialties) {
          if (dept.dept_name.toLowerCase().includes(spec.name.toLowerCase())) {
            matchedSpecialtyId = spec.id;
            break;
          }
        }
      }

      // 3. TẦNG AUTO-PROVISIONING: Tự động khởi tạo Chuyên khoa mới nếu chưa từng có
      if (!matchedSpecialtyId) {
        const cleanName = this.catalogNormalizer.cleanDepartmentName(dept.dept_name || dept.dept_code);
        let existingSpec = await this.prisma.specialty.findFirst({
          where: { name: { equals: cleanName, mode: 'insensitive' } },
        });

        if (!existingSpec) {
          existingSpec = await this.prisma.specialty.create({
            data: {
              name: cleanName,
              description: `Chuyên khoa tự động khởi tạo từ danh mục HIS (${dept.dept_name})`,
              isActive: true,
            },
          });
          this.logger.log(`[Auto-Provisioning] Tự động tạo Chuyên khoa mới từ HIS: "${cleanName}" (${existingSpec.id})`);
        }

        matchedSpecialtyId = existingSpec.id;
        specialtyMapByName.set(cleanName.toLowerCase().trim(), existingSpec.id);
        existingSpecialties.push({ id: existingSpec.id, name: existingSpec.name });
      }

      if (matchedSpecialtyId) {
        deptToSpecialtyIdMap.set(dept.dept_code, matchedSpecialtyId);

        // Kích hoạt liên kết HospitalSpecialty
        await this.prisma.hospitalSpecialty.upsert({
          where: {
            hospitalId_specialtyId: {
              hospitalId: targetHospitalId,
              specialtyId: matchedSpecialtyId,
            },
          },
          update: { isActive: true },
          create: {
            hospitalId: targetHospitalId,
            specialtyId: matchedSpecialtyId,
            isActive: true,
          },
        });
      }
    }

    // 4. Chuẩn hóa & Lọc danh sách bác sĩ
    const normDoctors = this.catalogNormalizer.normalizeDoctors(rawCatalog.doctors || []);
    const doctorsToSync = dto.selectedDoctorIds && dto.selectedDoctorIds.length > 0
      ? normDoctors.filter((doc) => dto.selectedDoctorIds!.includes(doc.externalId))
      : normDoctors;

    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    const details: any[] = [];

    // 5. Upsert từng Bác sĩ và DoctorWorkplace cho Bệnh viện
    for (const doc of doctorsToSync) {
      const rawDoc = (rawCatalog.doctors || []).find((d) => d.staff_id === doc.externalId);
      const deptCode = rawDoc?.dept_code || '';
      let targetSpecialtyId = deptToSpecialtyIdMap.get(deptCode);

      if (!targetSpecialtyId) {
        targetSpecialtyId = specialtyMapByName.get(doc.targetSpecialtyName.toLowerCase().trim()) || existingSpecialties[0]?.id;
      }

      // Đảm bảo HospitalSpecialty được kích hoạt
      if (targetSpecialtyId) {
        await this.prisma.hospitalSpecialty.upsert({
          where: {
            hospitalId_specialtyId: {
              hospitalId: targetHospitalId,
              specialtyId: targetSpecialtyId,
            },
          },
          update: { isActive: true },
          create: {
            hospitalId: targetHospitalId,
            specialtyId: targetSpecialtyId,
            isActive: true,
          },
        });
      }

      // Kiểm tra bác sĩ đã có trong hệ thống chưa
      let doctor = await this.prisma.doctor.findUnique({
        where: { externalId: doc.externalId },
        include: {
          workPlaces: {
            where: { hospitalId: targetHospitalId },
            include: { schedules: true },
          },
        },
      });

      if (!doctor) {
        // TẠO MỚI (CREATED)
        doctor = await this.prisma.doctor.create({
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
                hospitalId: targetHospitalId,
                specialtyId: targetSpecialtyId,
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
          include: {
            workPlaces: {
              where: { hospitalId: targetHospitalId },
              include: { schedules: true },
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
        // BÁC SĨ ĐÃ CÓ: KIỂM TRA WORKPLACE VÀ CẬP NHẬT
        const currentWorkplace = doctor.workPlaces[0];
        let hasChanges = false;

        if (
          doctor.fullName !== doc.fullName ||
          doctor.title !== doc.title ||
          doctor.qualification !== doc.qualification ||
          doctor.yearsOfExperience !== doc.yearsOfExperience
        ) {
          hasChanges = true;
          await this.prisma.doctor.update({
            where: { id: doctor.id },
            data: {
              fullName: doc.fullName,
              title: doc.title,
              qualification: doc.qualification,
              yearsOfExperience: doc.yearsOfExperience,
            },
          });
        }

        if (!currentWorkplace) {
          await this.prisma.doctorWorkplace.create({
            data: {
              doctorId: doctor.id,
              hospitalId: targetHospitalId,
              specialtyId: targetSpecialtyId,
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
          });
          createdCount++;
          details.push({
            staffId: doc.externalId,
            doctorName: doc.fullName,
            specialtyName: doc.targetSpecialtyName,
            action: 'CREATED',
          });
        } else {
          if (
            Number(currentWorkplace.consultationFee) !== doc.consultationFee ||
            currentWorkplace.specialtyId !== targetSpecialtyId
          ) {
            hasChanges = true;
            await this.prisma.doctorWorkplace.update({
              where: { id: currentWorkplace.id },
              data: {
                consultationFee: doc.consultationFee,
                specialtyId: targetSpecialtyId,
              },
            });
          }

          if (hasChanges) {
            updatedCount++;
            details.push({
              staffId: doc.externalId,
              doctorName: doc.fullName,
              specialtyName: doc.targetSpecialtyName,
              action: 'UPDATED',
            });
          } else {
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
    }

    return {
      hospitalId: targetHospitalId,
      hospitalName: rawCatalog.hospital_name,
      createdCount,
      updatedCount,
      unchangedCount,
      totalSynced: doctorsToSync.length,
      details,
    };
  }

  /**
   * 14. Lấy trạng thái kết nối tích hợp hiện tại của Bệnh viện
   */
  async getIntegrationStatus(hospitalId: string) {
    const targetHospitalId = await this.resolveHospitalId(hospitalId);
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: targetHospitalId },
      select: {
        id: true,
        name: true,
        externalId: true,
        source: true,
        updatedAt: true,
      },
    });

    const [apiDoctorCount, totalDoctorCount, specialtyCount] = await Promise.all([
      this.prisma.doctorWorkplace.count({
        where: {
          hospitalId: targetHospitalId,
          doctor: { source: DataSource.API },
          isActive: true,
        },
      }),
      this.prisma.doctorWorkplace.count({
        where: { hospitalId: targetHospitalId, isActive: true },
      }),
      this.prisma.hospitalSpecialty.count({
        where: { hospitalId: targetHospitalId, isActive: true },
      }),
    ]);

    return {
      hospital,
      isConnected: !!hospital?.externalId,
      externalId: hospital?.externalId || null,
      source: hospital?.source || 'MANUAL',
      apiDoctorCount,
      totalDoctorCount,
      specialtyCount,
      lastSyncAt: hospital?.updatedAt,
    };
  }
}
