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
import { getSpecialtyEMRTemplate } from './data/specialty-emr-mock.data';

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
    const appointments = await this.prisma.appointment.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    // Auto-heal completed appointments without rich diagnoses
    let healedAny = false;
    for (const apt of appointments) {
      if (
        apt.status === AppointmentStatus.COMPLETED &&
        (!apt.medicalEncounter || !apt.medicalEncounter.diagnoses || apt.medicalEncounter.diagnoses.length === 0)
      ) {
        try {
          await this.mockFulfill(apt.id);
          healedAny = true;
        } catch (e) {
          // ignore
        }
      }
    }

    if (healedAny) {
      return this.prisma.appointment.findMany({
        where: { userId },
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
        orderBy: { createdAt: 'desc' },
      });
    }

    return appointments;
  }

  // ============================================
  // 4. LẤY LỊCH SẮP TỚI
  // ============================================
  async getUpcoming(userId: string): Promise<Appointment[]> {
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
        medicalEncounter: {
          include: {
            diagnoses: true,
            observations: true,
            prescription: {
              include: { items: true },
            },
          },
        },
      },
      orderBy: [
        {
          slot: {
            startTime: 'asc',
          },
        },
        { createdAt: 'desc' },
      ],
    });
  }

  // ============================================
  // 5. LẤY LỊCH SỬ
  // ============================================
  async getHistory(userId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        userId,
        status: {
          in: [
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.EXPIRED,
            AppointmentStatus.NO_SHOW,
          ],
        },
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

      // 3. Khởi tạo MedicalEncounter (PUBLISHED) kèm đầy đủ chẩn đoán, cận lâm sàng, đơn thuốc theo chuyên khoa
      if (!appointment.medicalEncounter) {
        const workplace = appointment.slot?.doctorWorkplace;
        const hospitalId = workplace?.hospitalId || workplace?.hospital?.id;
        const doctorName = workplace?.doctor
          ? `${workplace.doctor.title ? workplace.doctor.title + ' ' : ''}${workplace.doctor.fullName}`
          : 'Bác sĩ NovaCare';
        const doctorTitle = workplace?.doctor?.title || null;
        const specialtyName = workplace?.specialty?.name || 'Khám tổng quát';

        const mockData = this.generateMockMedicalRecord(
          specialtyName,
          appointment.reason,
          appointment.symptoms,
          appointment.patientProfile
        );

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
            chiefComplaint: mockData.chiefComplaint,
            clinicalSummary: mockData.clinicalSummary,
            status: EncounterStatus.PUBLISHED,
          },
        });

        // Diagnoses
        for (const diag of mockData.diagnoses) {
          await tx.diagnosis.create({
            data: {
              encounterId: createdEncounter.id,
              icdCode: diag.icdCode,
              diseaseName: diag.diseaseName,
              isPrimary: diag.isPrimary,
              note: diag.note,
            },
          });
        }

        // Observations
        for (const obs of mockData.observations) {
          await tx.observation.create({
            data: {
              encounterId: createdEncounter.id,
              category: obs.category,
              code: obs.code,
              name: obs.name,
              value: obs.value,
              unit: obs.unit,
              referenceRange: obs.referenceRange,
              interpretation: obs.interpretation,
            },
          });
        }

        // Prescription
        const rxCode = `RX-${createdEncounter.encounterCode.replace('ENC-', '')}`;
        const createdPrescription = await tx.prescription.create({
          data: {
            encounterId: createdEncounter.id,
            prescriptionCode: rxCode,
            note: `[ĐƠN THUỐC ĐIỆN TỬ] Kê đơn bởi ${doctorName} - Chuyên khoa ${specialtyName}`,
          },
        });

        for (const item of mockData.prescriptionItems) {
          await tx.prescriptionItem.create({
            data: {
              prescriptionId: createdPrescription.id,
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
  private generateMockMedicalRecord(
    specialtyName: string,
    appointmentReason?: string | null,
    symptoms?: string | null,
    patientProfile?: any
  ) {
    const template = getSpecialtyEMRTemplate(specialtyName);

    // Kết hợp lý do khám của bệnh nhân (nếu có) với triệu chứng chuyên khoa
    let chiefComplaint = template.chiefComplaint;
    if (appointmentReason || symptoms) {
      const patientInput = [appointmentReason, symptoms].filter(Boolean).join(' - ');
      chiefComplaint = `${patientInput}. ${template.chiefComplaint}`;
    }

    // Tùy chỉnh tóm tắt lâm sàng theo thông tin bệnh nhân
    let clinicalSummary = template.clinicalSummary;
    if (patientProfile) {
      const genderStr = patientProfile.gender === 'FEMALE' ? 'Bệnh nhân nữ' : (patientProfile.gender === 'MALE' ? 'Bệnh nhân nam' : 'Bệnh nhân');
      const ageStr = patientProfile.dateOfBirth
        ? `, ${new Date().getFullYear() - new Date(patientProfile.dateOfBirth).getFullYear()} tuổi`
        : '';
      clinicalSummary = `${genderStr}${ageStr}. ${template.clinicalSummary}`;
    }

    return {
      chiefComplaint,
      clinicalSummary,
      diagnoses: template.diagnoses,
      observations: template.observations,
      prescriptionItems: template.prescriptionItems,
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

    const workplace = appointment.slot?.doctorWorkplace;
    let hospitalId: string = workplace?.hospitalId || workplace?.hospital?.id || '';
    if (!hospitalId) {
      const defaultHosp = await this.prisma.hospital.findFirst();
      hospitalId = defaultHosp?.id || '';
    }

    const specialtyName = workplace?.specialty?.name || (appointment as any).medicalService?.name || appointment.reason || 'Nội tổng quát';
    const doctorName = workplace?.doctor
      ? `${workplace.doctor.title ? workplace.doctor.title + ' ' : ''}${workplace.doctor.fullName}`
      : 'Bác sĩ NovaCare';
    const doctorTitle = workplace?.doctor?.title || null;

    const mockData = this.generateMockMedicalRecord(
      specialtyName,
      appointment.reason,
      appointment.symptoms,
      appointment.patientProfile
    );
    const encounterCode = appointment.medicalEncounter?.encounterCode || this.generateEncounterCode();
    const encounterDate = appointment.slot?.startTime || new Date();
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
          note: `[MOCK HIS] Bệnh viện đã hoàn tất khám ${specialtyName} và phát hành hồ sơ bệnh án điện tử`,
        },
      });

      // 4. Create or Update MedicalEncounter (PUBLISHED)
      const encounter = await tx.medicalEncounter.upsert({
        where: { appointmentId: appointment.id },
        create: {
          patientProfileId: appointment.patientProfileId,
          hospitalId,
          appointmentId: appointment.id,
          encounterCode,
          encounterDate,
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

      // Clean existing diagnoses/observations/prescriptions if any
      await tx.diagnosis.deleteMany({ where: { encounterId: encounter.id } });
      await tx.observation.deleteMany({ where: { encounterId: encounter.id } });
      const oldPrescription = await tx.prescription.findUnique({ where: { encounterId: encounter.id } });
      if (oldPrescription) {
        await tx.prescriptionItem.deleteMany({ where: { prescriptionId: oldPrescription.id } });
        await tx.prescription.delete({ where: { id: oldPrescription.id } });
      }

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

      // 6. Observations (VITAL_SIGNS, LAB_RESULT, IMAGING)
      for (const obs of mockData.observations) {
        await tx.observation.create({
          data: {
            encounterId: encounter.id,
            category: obs.category,
            code: obs.code,
            name: obs.name,
            value: obs.value,
            unit: obs.unit,
            referenceRange: obs.referenceRange,
            interpretation: obs.interpretation,
          },
        });
      }

      // 7. Prescription & Items
      const rxCode = `RX-${encounter.encounterCode.replace('ENC-', '')}`;
      const prescription = await tx.prescription.create({
        data: {
          encounterId: encounter.id,
          prescriptionCode: rxCode,
          note: `[ĐƠN THUỐC ĐIỆN TỬ] Kê đơn bởi ${doctorName} - Chuyên khoa ${specialtyName}. Tái khám theo hẹn hoặc khi có dấu hiệu bất thường.`,
        },
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

      const fullEncounter = await tx.medicalEncounter.findUnique({
        where: { id: encounter.id },
        include: {
          diagnoses: true,
          observations: true,
          prescription: {
            include: {
              items: true,
            },
          },
        },
      });

      return {
        appointmentId: appointment.id,
        encounterId: encounter.id,
        encounterCode: encounter.encounterCode,
        hospital: workplace?.hospital || { name: 'Cơ sở y tế NovaCare' },
        specialty: specialtyName,
        status: EncounterStatus.PUBLISHED,
        medicalEncounter: fullEncounter,
        patientProfile: appointment.patientProfile,
        slot: appointment.slot,
      };
    });
  }
}
