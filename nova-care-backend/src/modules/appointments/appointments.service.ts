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
import { Appointment, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

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
        const slot = await tx.$queryRawUnsafe<any[]>(
          `SELECT * FROM "appointment_slots" WHERE id = $1 FOR UPDATE`,
          slotId
        );

        if (!slot || slot.length === 0) {
          throw new NotFoundException('Khung giờ khám không tồn tại');
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
          throw new ConflictException('Khung giờ này đã hết chỗ');
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
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PAID],
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
    });
    if (!appointment) {
      throw new NotFoundException('Lịch khám không tồn tại');
    }
    if (appointment.status !== AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.PAID) {
      throw new BadRequestException(`Không thể hoàn thành lịch ở trạng thái ${appointment.status}`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await this.prisma.appointmentStatusHistory.create({
      data: {
        appointmentId: updated.id,
        status: AppointmentStatus.COMPLETED,
        note: 'Bệnh nhân đã hoàn thành buổi khám',
      },
    });

    return updated;
  }
}
