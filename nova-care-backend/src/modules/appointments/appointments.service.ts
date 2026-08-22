import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { Appointment, AppointmentStatus, EncounterStatus, ObservationCategory, MatchingStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) { }

  // ============================================
  // 1. TẠO LỊCH KHÁM (VỚI TRANSACTION + LOCK)
  // ============================================
  async create(userId: string, createDto: CreateAppointmentDto): Promise<Appointment> {
    const { patientProfileId, slotId, medicalServiceId, reason, symptoms, idempotencyKey } = createDto;

    // 1. Kiểm tra quyền sở hữu patient profile
    const profile = await this.prisma.patientProfile.findFirst({
      where: {
        id: patientProfileId,
        userId,
        deletedAt: null,
      },
    });
    if (!profile) {
      throw new ForbiddenException('Bạn không có quyền sử dụng hồ sơ này');
    }

    // 2. Kiểm tra idempotency key (tránh gửi lặp)
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { idempotencyKey },
    });
    if (existingAppointment) {
      return existingAppointment;
    }

    // 3. Sử dụng transaction với row locking
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 3.1 Lấy slot với khóa dòng (SELECT FOR UPDATE)
        let slot = await tx.$queryRawUnsafe<any[]>(
          `SELECT * FROM "appointment_slots" WHERE id = $1 FOR UPDATE`,
          slotId
        );

        if (!slot || slot.length === 0) {
          const fallbackSlot = await tx.appointmentSlot.findFirst({
            where: { isAvailable: true, isActive: true },
          });
          if (fallbackSlot) {
            slot = [fallbackSlot];
          } else {
            throw new NotFoundException('Khung giờ khám không tồn tại');
          }
        }
        const slotData = slot[0];

        // Hỗ trợ cả camelCase và snake_case để tránh lỗi ánh xạ thuộc tính DB
        const isAvailable = slotData.isAvailable ?? slotData.is_available;
        const bookedCount = slotData.bookedCount ?? slotData.booked_count;
        const capacity = slotData.capacity;
        const isActive = slotData.isActive ?? slotData.is_active;
        const startTime = new Date(slotData.startTime ?? slotData.start_time);
        const endTime = new Date(slotData.endTime ?? slotData.end_time);
        const doctorWorkplaceId = slotData.doctorWorkplaceId ?? slotData.doctor_workplace_id;

        // 3.2 Kiểm tra slot còn trống
        if (!isAvailable || bookedCount >= capacity) {
          const alternativeSlots = await this.findAlternativeSlots(tx, slotData);
          throw new ConflictException({
            statusCode: 409,
            message: 'Khung giờ này vừa được đặt bởi bệnh nhân khác. Vui lòng chọn khung giờ khác.',
            alternativeSlots,
          });
        }
        if (!isActive) {
          throw new BadRequestException('Khung giờ này đã bị vô hiệu hóa');
        }

        // 3.3 Kiểm tra bệnh nhân không có lịch trùng thời gian
        const overlapping = await tx.appointment.findFirst({
          where: {
            patientProfileId,
            status: {
              notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.EXPIRED, AppointmentStatus.COMPLETED],
            },
            slot: {
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          },
        });
        if (overlapping) {
          throw new ConflictException('Bạn đã có lịch khám trùng thời gian này');
        }

        // 3.4 Lấy thông tin workplace để tính phí
        const workplace = await tx.doctorWorkplace.findUnique({
          where: { id: doctorWorkplaceId },
          include: {
            doctor: true,
            hospital: true,
            specialty: true,
          },
        });
        if (!workplace) {
          throw new NotFoundException('Nơi làm việc của bác sĩ không tồn tại');
        }

        // 3.5 Tính tổng tiền
        let serviceFee = 0;
        if (medicalServiceId) {
          const service = await tx.medicalService.findUnique({
            where: { id: medicalServiceId },
          });
          if (service) {
            serviceFee = Number(service.price);
          }
        }
        const consultationFee = Number(workplace.consultationFee);
        const totalPrice = consultationFee + serviceFee;

        // 3.6 Tạo mã lịch khám
        const bookingCode = await this.generateBookingCode();

        // 3.7 Tạo lịch khám
        const appointment = await tx.appointment.create({
          data: {
            bookingCode,
            patientProfileId,
            slotId,
            medicalServiceId,
            userId,
            status: AppointmentStatus.AWAITING_PAYMENT,
            reason,
            symptoms,
            totalPrice,
            consultationFee,
            serviceFee,
            idempotencyKey,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // hết hạn sau 15 phút
          },
          include: {
            patientProfile: true,
            slot: {
              include: {
                doctorWorkplace: {
                  include: {
                    doctor: true,
                    hospital: true,
                    specialty: true,
                  },
                },
              },
            },
            medicalService: true,
          },
        });

        // 3.8 Tăng booked_count của slot
        await tx.appointmentSlot.update({
          where: { id: slotId },
          data: {
            bookedCount: { increment: 1 },
            isAvailable: (bookedCount + 1 < capacity),
            version: { increment: 1 },
          },
        });

        // 3.9 Tạo bản ghi lịch sử trạng thái
        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: appointment.id,
            status: AppointmentStatus.AWAITING_PAYMENT,
            note: 'Tạo lịch khám thành công, chờ thanh toán',
          },
        });

        return appointment;
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Khung giờ khám không tồn tại');
      }
      throw error;
    }
  }

  // ============================================
  // 2. XÁC NHẬN LỊCH (SAU KHI THANH TOÁN)
  // ============================================
  async confirm(appointmentId: string): Promise<Appointment> {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { slot: true },
      });
      if (!appointment) {
        throw new NotFoundException('Lịch khám không tồn tại');
      }
      if (appointment.status === AppointmentStatus.CONFIRMED) {
        return appointment;
      }
      if (appointment.status !== AppointmentStatus.AWAITING_PAYMENT) {
        throw new BadRequestException(`Không thể xác nhận lịch ở trạng thái ${appointment.status}`);
      }

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CONFIRMED,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: updated.id,
          status: AppointmentStatus.CONFIRMED,
          note: 'Thanh toán thành công, xác nhận lịch khám',
        },
      });

      return updated;
    });
  }

  // ============================================
  // 3. LẤY DANH SÁCH LỊCH CỦA NGƯỜI DÙNG
  // ============================================
  async findByUser(userId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        userId,
      },
      include: {
        patientProfile: true,
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: true,
                hospital: true,
                specialty: true,
              },
            },
          },
        },
        medicalService: true,
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // 4. LẤY LỊCH SẮP TỚI
  // ============================================
  async getUpcoming(userId: string): Promise<Appointment[]> {
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        userId,
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.AWAITING_PAYMENT,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.PAID,
          ],
        },
        slot: {
          startTime: { gte: now },
        },
        cancelledAt: null,
      },
      include: {
        patientProfile: true,
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: true,
                hospital: true,
                specialty: true,
              },
            },
          },
        },
        medicalService: true,
        payment: true,
      },
      orderBy: {
        slot: {
          startTime: 'asc',
        },
      },
    });
  }

  // ============================================
  // 5. LẤY LỊCH SỬ
  // ============================================
  async getHistory(userId: string): Promise<Appointment[]> {
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        userId,
        OR: [
          { status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.EXPIRED, AppointmentStatus.NO_SHOW] } },
          {
            slot: {
              startTime: { lt: now },
            },
          },
        ],
      },
      include: {
        patientProfile: true,
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: true,
                hospital: true,
                specialty: true,
              },
            },
          },
        },
        medicalService: true,
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        slot: {
          startTime: 'desc',
        },
      },
    });
  }

  // ============================================
  // 6. LẤY CHI TIẾT LỊCH
  // ============================================
  async findOne(id: string, userId: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patientProfile: true,
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: true,
                hospital: true,
                specialty: true,
              },
            },
          },
        },
        medicalService: true,
        payment: true,
        medicalEncounter: {
          include: {
            diagnoses: true,
            observations: true,
            prescription: {
              include: { items: true },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Lịch khám không tồn tại');
    }
    if (appointment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem lịch khám này');
    }
    return appointment;
  }

  // ============================================
  // 7. HỦY LỊCH
  // ============================================
  async cancel(
    id: string,
    userId: string,
    cancelDto: CancelAppointmentDto
  ): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { slot: true },
    });
    if (!appointment) {
      throw new NotFoundException('Lịch khám không tồn tại');
    }
    if (appointment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy lịch khám này');
    }

    // Kiểm tra trạng thái có thể hủy
    const cancellableStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.AWAITING_PAYMENT,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.PAID,
    ];
    if (!cancellableStatuses.includes(appointment.status)) {
      throw new BadRequestException(`Không thể hủy lịch ở trạng thái ${appointment.status}`);
    }

    // Kiểm tra thời gian hủy (ít nhất 2 giờ trước giờ khám)
    const slotStartTime = appointment.slot.startTime;
    const now = new Date();
    const hoursDiff = (slotStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursDiff < 2 && appointment.status !== AppointmentStatus.AWAITING_PAYMENT) {
      throw new BadRequestException('Chỉ có thể hủy lịch trước ít nhất 2 giờ');
    }

    return this.prisma.$transaction(async (tx) => {
      // Cập nhật status
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // Giảm booked_count của slot
      const slot = await tx.appointmentSlot.findUnique({
        where: { id: appointment.slotId },
      });
      if (slot) {
        await tx.appointmentSlot.update({
          where: { id: appointment.slotId },
          data: {
            bookedCount: { decrement: 1 },
            isAvailable: true,
          },
        });
      }

      // Ghi lịch sử
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: updated.id,
          status: AppointmentStatus.CANCELLED,
          note: cancelDto.reason || 'Bệnh nhân hủy lịch',
        },
      });

      return updated;
    });
  }

  // ============================================
  // 8. ĐỔI LỊCH
  // ============================================
  async reschedule(
    id: string,
    userId: string,
    newSlotId: string
  ): Promise<Appointment> {
    // Kiểm tra lịch hiện tại
    const oldAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { slot: true },
    });
    if (!oldAppointment) {
      throw new NotFoundException('Lịch khám không tồn tại');
    }
    if (oldAppointment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền đổi lịch này');
    }

    const reschedulableStatuses: AppointmentStatus[] = [AppointmentStatus.CONFIRMED, AppointmentStatus.PAID];
    if (!reschedulableStatuses.includes(oldAppointment.status)) {
      throw new BadRequestException(`Không thể đổi lịch ở trạng thái ${oldAppointment.status}`);
    }

    // Kiểm tra slot mới
    const newSlot = await this.prisma.appointmentSlot.findUnique({
      where: { id: newSlotId },
    });
    if (!newSlot) {
      throw new NotFoundException('Khung giờ mới không tồn tại');
    }
    if (!newSlot.isAvailable || newSlot.bookedCount >= newSlot.capacity) {
      throw new ConflictException('Khung giờ mới đã hết chỗ');
    }

    // Kiểm tra không trùng với lịch khác của bệnh nhân
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        patientProfileId: oldAppointment.patientProfileId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.EXPIRED, AppointmentStatus.COMPLETED],
        },
        slot: {
          startTime: { lt: newSlot.endTime },
          endTime: { gt: newSlot.startTime },
        },
        id: { not: id },
      },
    });
    if (overlapping) {
      throw new ConflictException('Bạn đã có lịch khám trùng thời gian mới này');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Giảm booked_count của slot cũ
      await tx.appointmentSlot.update({
        where: { id: oldAppointment.slotId },
        data: {
          bookedCount: { decrement: 1 },
          isAvailable: true,
        },
      });

      // 2. Tăng booked_count của slot mới
      await tx.appointmentSlot.update({
        where: { id: newSlotId },
        data: {
          bookedCount: { increment: 1 },
          isAvailable: (newSlot.bookedCount + 1 < newSlot.capacity),
        },
      });

      // 3. Cập nhật appointment
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          slotId: newSlotId,
        },
        include: {
          slot: {
            include: {
              doctorWorkplace: {
                include: {
                  doctor: true,
                  hospital: true,
                  specialty: true,
                },
              },
            },
          },
          patientProfile: true,
        },
      });

      // 4. Ghi lịch sử
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: updated.id,
          status: updated.status,
          note: `Đổi lịch khám sang slot ${newSlot.startTime.toISOString()}`,
        },
      });

      return updated;
    });
  }

  // ============================================
  // 9. HẾT HẠN GIỮ CHỖ (CHẠY BACKGROUND JOB)
  // ============================================
  async expirePendingAppointments(): Promise<number> {
    const now = new Date();
    const expiredAppointments = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.AWAITING_PAYMENT,
        expiresAt: { lt: now },
      },
      include: { slot: true },
    });

    let expiredCount = 0;
    for (const appointment of expiredAppointments) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Cập nhật status
          await tx.appointment.update({
            where: { id: appointment.id },
            data: {
              status: AppointmentStatus.EXPIRED,
            },
          });

          // Giảm booked_count
          await tx.appointmentSlot.update({
            where: { id: appointment.slotId },
            data: {
              bookedCount: { decrement: 1 },
              isAvailable: true,
            },
          });

          // Ghi lịch sử
          await tx.appointmentStatusHistory.create({
            data: {
              appointmentId: appointment.id,
              status: AppointmentStatus.EXPIRED,
              note: 'Hết hạn giữ chỗ do không thanh toán',
            },
          });
          expiredCount++;
        });
      } catch (error) {
        console.error(`Failed to expire appointment ${appointment.id}:`, error);
      }
    }
    return expiredCount;
  }

  // ============================================
  // 10. TẠO MÃ LỊCH KHÁM
  // ============================================
  private async generateBookingCode(): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const prefix = 'NOVA';

    // Lấy số thứ tự trong ngày
    const count = await this.prisma.appointment.count({
      where: {
        bookingCode: {
          startsWith: `${prefix}-${dateStr}`,
        },
      },
    });
    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${dateStr}-${sequence}`;
  }

  // ============================================
  // 11. HOÀN THÀNH LỊCH (SAU KHI KHÁM)
  // ============================================
  async complete(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patientProfile: true,
        medicalEncounter: true,
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: true,
                hospital: true,
                specialty: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch khám không tồn tại');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Lịch khám đã ở trạng thái hoàn thành (COMPLETED)');
    }

    const encounterDate = new Date();
    const encounterCode = this.generateEncounterCode();

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật Appointment sang COMPLETED
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.COMPLETED,
          completedAt: encounterDate,
        },
        include: {
          medicalEncounter: true,
        },
      });

      // 2. Ghi lịch sử trạng thái
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: updated.id,
          status: AppointmentStatus.COMPLETED,
          note: 'Bệnh nhân đã hoàn thành buổi khám',
        },
      });

      // 3. Khởi tạo MedicalEncounter (IN_PROGRESS) nếu chưa tồn tại
      if (!appointment.medicalEncounter) {
        const workplace = appointment.slot?.doctorWorkplace;
        const hospitalId = workplace?.hospitalId || workplace?.hospital?.id;
        const doctorName = workplace?.doctor?.fullName || 'Bác sĩ NovaCare';
        const doctorTitle = workplace?.doctor?.title || null;
        const specialtyName = workplace?.specialty?.name || 'Khám tổng quát';

        const createdEncounter = await tx.medicalEncounter.create({
          data: {
            patientProfileId: appointment.patientProfileId,
            hospitalId: hospitalId!,
            appointmentId: appointment.id,
            encounterCode,
            encounterDate,
            doctorName,
            doctorTitle,
            specialtyName,
            chiefComplaint: appointment.reason || appointment.symptoms || 'Khám bệnh theo hẹn',
            status: EncounterStatus.IN_PROGRESS,
          },
        });

        return {
          ...updated,
          medicalEncounter: createdEncounter,
        } as unknown as Appointment;
      }

      return updated;
    });
  }

  private generateEncounterCode(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ENC-${dateStr}-${randomHex}`;
  }

  // ==================================================
  // THUẬT TOÁN ĐỀ XUẤT SLOT THAY THẾ KHI BỊ XUNG ĐỘT (DOUBLE BOOKING)
  // Priority 1: Cùng bác sĩ + gần thời gian yêu cầu nhất
  // Priority 2: Cùng chuyên khoa + cùng bệnh viện (bác sĩ khác)
  // Priority 3: Bác sĩ khác + cùng chuyên khoa (bệnh viện khác)
  // ==================================================
  async findAlternativeSlots(prismaOrTx: any, slotData: any) {
    try {
      const doctorWorkplaceId = slotData.doctorWorkplaceId ?? slotData.doctor_workplace_id;
      const requestedStartTime = new Date(slotData.startTime ?? slotData.start_time);
      const now = new Date();

      const workplace = await prismaOrTx.doctorWorkplace.findUnique({
        where: { id: doctorWorkplaceId },
        include: { doctor: true, hospital: true, specialty: true },
      });
      if (!workplace) return [];

      const { hospitalId, specialtyId } = workplace;
      const alternatives: any[] = [];
      const addedSlotIds = new Set<string>();
      const targetSlotId = slotData.id;
      addedSlotIds.add(targetSlotId);

      // Priority 1: Cùng bác sĩ (cùng workplace) + khung giờ gần nhất
      const sameWorkplaceSlots = await prismaOrTx.appointmentSlot.findMany({
        where: {
          doctorWorkplaceId,
          id: { not: targetSlotId },
          isActive: true,
          isAvailable: true,
          startTime: { gte: now },
        },
        take: 10,
        orderBy: { startTime: 'asc' },
      });

      const validSameWp = sameWorkplaceSlots.filter((s: any) => s.bookedCount < s.capacity);
      validSameWp.sort((a: any, b: any) => {
        const diffA = Math.abs(new Date(a.startTime).getTime() - requestedStartTime.getTime());
        const diffB = Math.abs(new Date(b.startTime).getTime() - requestedStartTime.getTime());
        return diffA - diffB;
      });

      for (const s of validSameWp) {
        if (alternatives.length >= 2) break;
        addedSlotIds.add(s.id);
        alternatives.push({
          priority: 1,
          reason: 'Cùng bác sĩ, khung giờ gần nhất',
          slot: s,
          doctor: workplace.doctor,
          hospital: workplace.hospital,
          specialty: workplace.specialty,
          workplaceId: workplace.id,
        });
      }

      // Priority 2: Cùng chuyên khoa & bệnh viện (bác sĩ khác)
      if (alternatives.length < 4) {
        const otherWpsSameHospital = await prismaOrTx.doctorWorkplace.findMany({
          where: {
            hospitalId,
            specialtyId,
            id: { not: doctorWorkplaceId },
            isActive: true,
            doctor: { isActive: true, deletedAt: null },
          },
          include: { doctor: true, hospital: true, specialty: true },
        });

        for (const owp of otherWpsSameHospital) {
          if (alternatives.length >= 4) break;
          const slots = await prismaOrTx.appointmentSlot.findMany({
            where: {
              doctorWorkplaceId: owp.id,
              id: { notIn: Array.from(addedSlotIds) },
              isActive: true,
              isAvailable: true,
              startTime: { gte: now },
            },
            take: 3,
            orderBy: { startTime: 'asc' },
          });
          const validSlots = slots.filter((s: any) => s.bookedCount < s.capacity);
          for (const s of validSlots) {
            if (alternatives.length >= 4) break;
            addedSlotIds.add(s.id);
            alternatives.push({
              priority: 2,
              reason: `Cùng chuyên khoa (${owp.doctor.title ? owp.doctor.title + ' ' : ''}${owp.doctor.fullName})`,
              slot: s,
              doctor: owp.doctor,
              hospital: owp.hospital,
              specialty: owp.specialty,
              workplaceId: owp.id,
            });
          }
        }
      }

      // Priority 3: Cùng chuyên khoa tại cơ sở khác
      if (alternatives.length < 4) {
        const otherHospitalWps = await prismaOrTx.doctorWorkplace.findMany({
          where: {
            specialtyId,
            hospitalId: { not: hospitalId },
            isActive: true,
            doctor: { isActive: true, deletedAt: null },
            hospital: { isActive: true, deletedAt: null },
          },
          include: { doctor: true, hospital: true, specialty: true },
          take: 5,
        });

        for (const owp of otherHospitalWps) {
          if (alternatives.length >= 4) break;
          const slots = await prismaOrTx.appointmentSlot.findMany({
            where: {
              doctorWorkplaceId: owp.id,
              id: { notIn: Array.from(addedSlotIds) },
              isActive: true,
              isAvailable: true,
              startTime: { gte: now },
            },
            take: 2,
            orderBy: { startTime: 'asc' },
          });
          const validSlots = slots.filter((s: any) => s.bookedCount < s.capacity);
          for (const s of validSlots) {
            if (alternatives.length >= 4) break;
            addedSlotIds.add(s.id);
            alternatives.push({
              priority: 3,
              reason: `Tại ${owp.hospital.name}`,
              slot: s,
              doctor: owp.doctor,
              hospital: owp.hospital,
              specialty: owp.specialty,
              workplaceId: owp.id,
            });
          }
        }
      }

      return alternatives;
    } catch (e) {
      return [];
    }
  }

  // ============================================
  // MOCK MEDICAL RECORD GENERATOR (SPECIALTY-BASED)
  // ============================================
  private generateMockMedicalRecord(specialtyName: string) {
    const norm = (specialtyName || '').toLowerCase().trim();

    if (norm.includes('tim') || norm.includes('cardio')) {
      return {
        chiefComplaint: 'Khám và theo dõi chỉ số tim mạch, hồi hộp đánh trống ngực khi vận động',
        clinicalSummary: 'Bệnh nhân có tiền sử tăng huyết áp. Thể trạng trung bình, nhịp tim đều, không có tiếng thổi bệnh lý. Huyết áp kiểm soát ổn định.',
        diagnoses: [
          { icdCode: 'I10', diseaseName: 'Tăng huyết áp vô căn (nguyên phát)', isPrimary: true, note: 'Chẩn đoán chính' },
          { icdCode: 'E78.5', diseaseName: 'Tăng lipid máu không đặc hiệu', isPrimary: false, note: 'Bệnh kèm theo' },
        ],
        observations: [
          { category: ObservationCategory.VITAL_SIGNS, code: 'BP', name: 'Huyết áp', value: '135/85', unit: 'mmHg', interpretation: 'Tăng nhẹ' },
          { category: ObservationCategory.VITAL_SIGNS, code: 'HR', name: 'Nhịp tim', value: '82', unit: 'lần/phút', interpretation: 'Bình thường' },
          { category: ObservationCategory.VITAL_SIGNS, code: 'SPO2', name: 'SpO2', value: '98', unit: '%', interpretation: 'Bình thường' },
          { category: ObservationCategory.LAB_RESULT, code: 'CHOL', name: 'Cholesterol toàn phần', value: '5.8', unit: 'mmol/L', interpretation: 'Tăng nhẹ' },
        ],
        prescriptionItems: [
          { drugName: 'Amlodipine', dosage: '5mg', usageInstruction: 'Uống 1 viên vào buổi sáng sau ăn', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Theo dõi huyết áp hàng ngày' },
          { drugName: 'Atorvastatin', dosage: '20mg', usageInstruction: 'Uống 1 viên vào buổi tối trước khi đi ngủ', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Tái khám sau 1 tháng' },
        ],
      };
    }

    if (norm.includes('da') || norm.includes('derma')) {
      return {
        chiefComplaint: 'Mẩn đỏ ngứa vùng lồng ngực và cẳng tay kéo dài 3 ngày',
        clinicalSummary: 'Tổn thương dạng mảng đỏ nhẹ, tróc vảy mỏng, ngứa ngáy nhiều về đêm, không rỉ dịch mủ.',
        diagnoses: [
          { icdCode: 'L20.9', diseaseName: 'Viêm da cơ địa không đặc hiệu', isPrimary: true, note: 'Chẩn đoán chính' },
        ],
        observations: [
          { category: ObservationCategory.VITAL_SIGNS, code: 'TEMP', name: 'Thân nhiệt', value: '36.6', unit: '°C', interpretation: 'Bình thường' },
        ],
        prescriptionItems: [
          { drugName: 'Cetirizine Hydrochloride', dosage: '10mg', usageInstruction: 'Uống 1 viên vào buổi tối', quantity: 10, unit: 'Viên', duration: '10 ngày', note: 'Tránh gãi trầy xước' },
          { drugName: 'Hydrocortisone Cream 1%', dosage: '15g', usageInstruction: 'Thoa mỏng lên vùng da tổn thương 2 lần/ngày', quantity: 1, unit: 'Tuýp', duration: '7 ngày', note: 'Không thoa lên mắt' },
        ],
      };
    }

    if (norm.includes('tai') || norm.includes('mũi') || norm.includes('họng') || norm.includes('ent')) {
      return {
        chiefComplaint: 'Đau rát họng, sốt nhẹ, nuốt vướng và ho khô',
        clinicalSummary: 'Niêm mạc họng xung huyết đỏ nhẹ, hai amydal sưng độ I không mủ. Màng nhĩ hai bên nguyên vẹn.',
        diagnoses: [
          { icdCode: 'J02.9', diseaseName: 'Viêm họng cấp tính không đặc hiệu', isPrimary: true, note: 'Chẩn đoán chính' },
        ],
        observations: [
          { category: ObservationCategory.VITAL_SIGNS, code: 'TEMP', name: 'Thân nhiệt', value: '37.8', unit: '°C', interpretation: 'Sốt nhẹ' },
          { category: ObservationCategory.VITAL_SIGNS, code: 'SPO2', name: 'SpO2', value: '99', unit: '%', interpretation: 'Bình thường' },
        ],
        prescriptionItems: [
          { drugName: 'Amoxicillin', dosage: '500mg', usageInstruction: 'Uống 1 viên x 2 lần/ngày sau khi ăn', quantity: 14, unit: 'Viên', duration: '7 ngày', note: 'Uống đủ liều kháng sinh' },
          { drugName: 'Paracetamol', dosage: '500mg', usageInstruction: 'Uống 1 viên khi sốt > 38.5°C', quantity: 10, unit: 'Viên', duration: '5 ngày', note: 'Cách nhau tối thiểu 4-6h' },
        ],
      };
    }

    // Default: Nội tổng quát
    return {
      chiefComplaint: 'Đau tức nhẹ vùng thượng vị, ợ hơi, đầy bụng sau bữa ăn',
      clinicalSummary: 'Bụng mềm, ấn đau nhẹ vùng thượng vị. Không phản ứng thành bụng, gan lách không to.',
      diagnoses: [
        { icdCode: 'K29.7', diseaseName: 'Viêm dạ dày không đặc hiệu', isPrimary: true, note: 'Chẩn đoán chính' },
      ],
      observations: [
        { category: ObservationCategory.VITAL_SIGNS, code: 'BP', name: 'Huyết áp', value: '120/80', unit: 'mmHg', interpretation: 'Bình thường' },
        { category: ObservationCategory.VITAL_SIGNS, code: 'HR', name: 'Nhịp tim', value: '76', unit: 'lần/phút', interpretation: 'Bình thường' },
      ],
      prescriptionItems: [
        { drugName: 'Omeprazole', dosage: '20mg', usageInstruction: 'Uống 1 viên trước bữa ăn sáng 30 phút', quantity: 14, unit: 'Viên', duration: '14 ngày', note: 'Tránh ăn đồ chua cay, nhiều dầu mỡ' },
      ],
    };
  }

  // ============================================
  // MOCK FULFILLMENT SERVICE (HIS SIMULATION)
  // ============================================
  async mockFulfill(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patientProfile: true,
        medicalEncounter: {
          include: {
            diagnoses: true,
            observations: true,
            prescription: {
              include: { items: true },
            },
          },
        },
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: true,
                hospital: true,
                specialty: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch khám không tồn tại');
    }

    // Payment condition check (PAID or CONFIRMED or COMPLETED)
    const validStatuses: AppointmentStatus[] = [
      AppointmentStatus.PAID,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.COMPLETED,
    ];
    if (!validStatuses.includes(appointment.status)) {
      throw new BadRequestException('Lịch khám chưa được thanh toán');
    }

    const workplace = appointment.slot?.doctorWorkplace;
    const hospitalId = workplace?.hospitalId || workplace?.hospital?.id;
    const specialtyName = workplace?.specialty?.name || 'Nội tổng quát';
    const doctorName = workplace?.doctor
      ? `${workplace.doctor.title ? workplace.doctor.title + ' ' : ''}${workplace.doctor.fullName}`
      : 'Bác sĩ NovaCare';
    const doctorTitle = workplace?.doctor?.title || null;

    if (!hospitalId) {
      throw new BadRequestException('Lịch khám không có thông tin bệnh viện hợp lệ');
    }

    // IDEMPOTENCY CHECK: If published encounter already exists, return without creating duplicate
    if (appointment.medicalEncounter && appointment.medicalEncounter.status === EncounterStatus.PUBLISHED) {
      return {
        appointmentId: appointment.id,
        encounterId: appointment.medicalEncounter.id,
        encounterCode: appointment.medicalEncounter.encounterCode,
        hospital: workplace?.hospital?.name || 'Cơ sở y tế NovaCare',
        specialty: specialtyName,
        status: EncounterStatus.PUBLISHED,
      };
    }

    const mockData = this.generateMockMedicalRecord(specialtyName);
    const encounterCode = this.generateEncounterCode();
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. PatientHospitalLink Check / Creation
      const existingLink = await tx.patientHospitalLink.findFirst({
        where: {
          patientProfileId: appointment.patientProfileId,
          hospitalId: hospitalId,
        },
      });

      if (!existingLink) {
        const hospitalPrefix = workplace?.hospital?.name?.substring(0, 4).toUpperCase() || 'HOSP';
        const rawExtId = `PAT-${hospitalPrefix}-${appointment.patientProfile.identityNumber || Date.now()}`;

        const extConflict = await tx.patientHospitalLink.findFirst({
          where: {
            hospitalId,
            externalPatientId: rawExtId,
          },
        });

        const finalExtId = extConflict
          ? `${rawExtId}-${Math.floor(1000 + Math.random() * 9000)}`
          : rawExtId;

        await tx.patientHospitalLink.create({
          data: {
            patientProfileId: appointment.patientProfileId,
            hospitalId: hospitalId,
            externalPatientId: finalExtId,
            matchingStatus: MatchingStatus.MATCHED,
          },
        });
      }

      // 2. Update Appointment to COMPLETED
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: AppointmentStatus.COMPLETED,
          completedAt: now,
        },
      });

      // 3. Record Status History
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: appointment.id,
          status: AppointmentStatus.COMPLETED,
          note: '[MOCK HIS] Bệnh viện đã hoàn tất khám và trả hồ sơ y tế',
        },
      });

      // 4. Create MedicalEncounter (PUBLISHED)
      const encounter = await tx.medicalEncounter.upsert({
        where: { appointmentId: appointment.id },
        create: {
          patientProfileId: appointment.patientProfileId,
          hospitalId,
          appointmentId: appointment.id,
          encounterCode,
          encounterDate: now,
          doctorName,
          doctorTitle,
          specialtyName,
          chiefComplaint: mockData.chiefComplaint,
          clinicalSummary: mockData.clinicalSummary,
          status: EncounterStatus.PUBLISHED,
        },
        update: {
          status: EncounterStatus.PUBLISHED,
          doctorName,
          doctorTitle,
          specialtyName,
          chiefComplaint: mockData.chiefComplaint,
          clinicalSummary: mockData.clinicalSummary,
        },
      });

      // 5. Diagnoses
      for (const diag of mockData.diagnoses) {
        await tx.diagnosis.create({
          data: {
            encounterId: encounter.id,
            icdCode: diag.icdCode,
            diseaseName: diag.diseaseName,
            isPrimary: diag.isPrimary,
            note: diag.note,
          },
        });
      }

      // 6. Observations
      for (const obs of mockData.observations) {
        await tx.observation.create({
          data: {
            encounterId: encounter.id,
            category: obs.category,
            code: obs.code,
            name: obs.name,
            value: obs.value,
            unit: obs.unit,
            interpretation: obs.interpretation,
          },
        });
      }

      // 7. Prescription & Items
      const rxCode = `RX-${encounter.encounterCode.replace('ENC-', '')}`;
      const prescription = await tx.prescription.upsert({
        where: { encounterId: encounter.id },
        create: {
          encounterId: encounter.id,
          prescriptionCode: rxCode,
          note: '[MOCK HIS] Đơn thuốc điện tử phát hành từ bệnh viện',
        },
        update: {},
      });

      for (const item of mockData.prescriptionItems) {
        await tx.prescriptionItem.create({
          data: {
            prescriptionId: prescription.id,
            drugName: item.drugName,
            dosage: item.dosage,
            usageInstruction: item.usageInstruction,
            quantity: item.quantity,
            unit: item.unit,
            duration: item.duration,
            note: item.note,
          },
        });
      }

      return {
        appointmentId: appointment.id,
        encounterId: encounter.id,
        encounterCode: encounter.encounterCode,
        hospital: workplace?.hospital?.name || 'Cơ sở y tế NovaCare',
        specialty: specialtyName,
        status: EncounterStatus.PUBLISHED,
      };
    });
  }
}
