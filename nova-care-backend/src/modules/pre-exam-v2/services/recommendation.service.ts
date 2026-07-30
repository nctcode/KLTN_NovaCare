import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async generate(data: any, risk: any) {
    if (risk.level === 'MONITOR') {
      return {
        action: 'Theo dõi tại nhà',
        tips: [
          'Nghỉ ngơi đầy đủ, uống từ 2-2.5 lít nước mỗi ngày.',
          'Dùng thuốc hạ sốt giảm đau thông thường (như Paracetamol) khi cần.',
          'Đến cơ sở y tế ngay nếu triệu chứng kéo dài quá 3 ngày hoặc trở nặng.',
        ],
      };
    }

    if (risk.level === 'EMERGENCY') {
      return {
        action: 'Gọi cấp cứu 115 hoặc di chuyển khẩn cấp',
        hospital: 'Bệnh viện có khoa Cấp cứu gần nhất',
        tips: [
          'Gọi điện thoại cấp cứu 115 ngay lập tức.',
          'Giữ người bệnh ở tư thế nằm thoải mái, nới lỏng cổ áo.',
          'Không tự ý cho bệnh nhân ăn uống hoặc tự lái xe.',
        ],
      };
    }

    // Risk level: CONSULT -> Map symptoms to Specialty
    const text = (data.initialText || '').toLowerCase() + ' ' + (data.voiceTranscript || '').toLowerCase();
    const specialtyName = this.mapSymptomsToSpecialty(text, data.bodyDiagramData);

    // Find matching specialty from DB
    const specialty = await this.prisma.specialty.findFirst({
      where: {
        OR: [
          { name: { contains: specialtyName, mode: 'insensitive' } },
          { description: { contains: specialtyName, mode: 'insensitive' } },
        ],
      },
    });

    // Find top doctor workplaces for this specialty or fallback to active workplaces
    const doctorWorkplaces = await this.prisma.doctorWorkplace.findMany({
      where: specialty
        ? { specialtyId: specialty.id, isActive: true }
        : { isActive: true },
      include: {
        doctor: true,
        hospital: true,
        specialty: true,
      },
      take: 4,
    });

    const doctorsList = doctorWorkplaces.map((dw: any) => ({
      doctorWorkplaceId: dw.id,
      doctorId: dw.doctor.id,
      doctorName: dw.doctor.fullName,
      qualification: dw.doctor.qualification,
      rating: dw.doctor.rating,
      hospitalId: dw.hospital.id,
      hospitalName: dw.hospital.name,
      specialtyId: dw.specialty.id,
      specialtyName: dw.specialty.name,
      fee: Number(dw.consultationFee || 200000),
    }));

    return {
      suggestedSpecialty: specialtyName,
      specialtyId: specialty?.id || null,
      doctors: doctorsList,
    };
  }

  private mapSymptomsToSpecialty(text: string, bodyDiagramData: any): string {
    if (text.includes('ngực') || text.includes('tim') || text.includes('huyết áp')) return 'Tim mạch';
    if (text.includes('đầu') || text.includes('chóng mặt') || text.includes('thần kinh') || text.includes('ngủ')) return 'Thần kinh';
    if (text.includes('ho') || text.includes('phổi') || text.includes('thở') || text.includes('họng')) return 'Hô hấp';
    if (text.includes('bụng') || text.includes('dạ dày') || text.includes('tiêu hóa') || text.includes('nôn')) return 'Tiêu hóa';
    if (text.includes('khớp') || text.includes('lưng') || text.includes('cơ') || text.includes('xương')) return 'Cơ Xương Khớp';
    if (text.includes('da') || text.includes('mẩn') || text.includes('ngứa') || text.includes('vết thương')) return 'Da liễu';
    if (text.includes('mắt') || text.includes('nhìn mờ')) return 'Mắt';
    if (text.includes('tai') || text.includes('mũi') || text.includes('họng')) return 'Tai Mũi Họng';

    // Check body diagram text
    if (Array.isArray(bodyDiagramData)) {
      for (const item of bodyDiagramData) {
        const area = (item.area || '').toLowerCase();
        if (area.includes('ngực')) return 'Tim mạch';
        if (area.includes('bụng')) return 'Tiêu hóa';
        if (area.includes('đầu')) return 'Thần kinh';
        if (area.includes('lưng') || area.includes('tay') || area.includes('chân')) return 'Cơ Xương Khớp';
      }
    }

    return 'Nội tổng quát';
  }
}
