import { Injectable } from '@nestjs/common';

export interface TriageResult {
  level: 'MONITOR' | 'CONSULT' | 'EMERGENCY';
  label: string;
  reason: string;
  warnings?: string[];
}

@Injectable()
export class TriageEngineService {
  assess(data: any): TriageResult {
    const text = (data.initialText || '').toLowerCase() + ' ' + (data.voiceTranscript || '').toLowerCase();
    const vitals = data.vitals || {};
    const age = data.patientInfo?.age || 30;

    // 1. EMERGENCY Level Checks (Đỏ - Cần cấp cứu ngay)
    if (
      (text.includes('đau ngực') || text.includes('tức ngực') || text.includes('bóp nghẹt ngực')) &&
      (text.includes('khó thở') || text.includes('vã mồ hôi') || text.includes('lan ra tay') || text.includes('lan ra vai'))
    ) {
      return {
        level: 'EMERGENCY',
        label: '🔴 Cần cấp cứu ngay lập tức',
        reason: 'Có triệu chứng đau tức ngực nghi ngờ hội chứng mạch vành cấp hoặc nhồi máu cơ tim.',
        warnings: ['Gọi hotline cấp cứu 115 ngay lập tức', 'Không tự lái xe', 'Nằm nghỉ ngơi, nới lỏng quần áo'],
      };
    }

    if (
      text.includes('co giật') ||
      text.includes('mất ý thức') ||
      text.includes('bất tỉnh') ||
      text.includes('yếu liệt') ||
      text.includes('méo miệng') ||
      text.includes('nói khó đột ngột')
    ) {
      return {
        level: 'EMERGENCY',
        label: '🔴 Cần cấp cứu ngay lập tức',
        reason: 'Dấu hiệu nguy kịch đột quỵ não hoặc tổn thương thần kinh cấp tính.',
        warnings: ['Đưa bệnh nhân đến cơ sở y tế gần nhất hoặc gọi 115'],
      };
    }

    if (vitals.spo2 && vitals.spo2 < 90) {
      return {
        level: 'EMERGENCY',
        label: '🔴 Cần cấp cứu ngay lập tức',
        reason: `Chỉ số SpO2 nguy kịch (${vitals.spo2}%), nồng độ ô-xy trong máu hạ rất thấp.`,
        warnings: ['Cần hỗ trợ thở ô-xy y tế lập tức'],
      };
    }

    // 2. CONSULT Level Checks (Vàng - Nên khám bác sĩ)
    if (
      text.includes('đau ngực') ||
      text.includes('khó thở') ||
      text.includes('đau bụng dữ dội') ||
      text.includes('sốt cao') ||
      text.includes('đau đầu kéo dài') ||
      text.includes('chóng mặt') ||
      text.includes('ho ra máu') ||
      text.includes('nôn ra máu')
    ) {
      return {
        level: 'CONSULT',
        label: '🟡 Nên khám bác sĩ chuyên khoa',
        reason: 'Triệu chứng cần được bác sĩ thăm khám trực tiếp để làm xét nghiệm và chẩn đoán chính xác.',
      };
    }

    if (vitals.bloodPressure && (vitals.bloodPressure.systolic >= 140 || vitals.bloodPressure.diastolic >= 90)) {
      return {
        level: 'CONSULT',
        label: '🟡 Nên khám bác sĩ chuyên khoa',
        reason: `Huyết áp đo được (${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg) ở mức tăng cao.`,
      };
    }

    if (vitals.spo2 && vitals.spo2 >= 90 && vitals.spo2 < 95) {
      return {
        level: 'CONSULT',
        label: '🟡 Nên khám bác sĩ chuyên khoa',
        reason: `Chỉ số SpO2 (${vitals.spo2}%) thấp hơn ngưỡng bình thường (>=95%).`,
      };
    }

    if (age > 60 && (text.includes('mệt mỏi') || text.includes('đau khớp') || text.includes('mất ngủ'))) {
      return {
        level: 'CONSULT',
        label: '🟡 Nên khám bác sĩ chuyên khoa',
        reason: 'Người cao tuổi có triệu chứng mệt mỏi/đau nhức nên được kiểm tra sức khỏe định kỳ.',
      };
    }

    // Default: CONSULT if symptoms present, or MONITOR
    if (text.trim().length > 5) {
      return {
        level: 'CONSULT',
        label: '🟡 Nên khám bác sĩ chuyên khoa',
        reason: 'Dựa trên mô tả triệu chứng, khuyến nghị đặt hẹn với bác sĩ chuyên khoa để thăm khám.',
      };
    }

    // 3. MONITOR Level Checks (Xanh - Theo dõi tại nhà)
    return {
      level: 'MONITOR',
      label: '🟢 Có thể tự theo dõi tại nhà',
      reason: 'Triệu chứng nhẹ, chưa ghi nhận dấu hiệu bất thường nguy hiểm.',
      warnings: ['Nghỉ ngơi, uống đủ nước', 'Tái khám ngay nếu xuất hiện sốt cao hoặc đau tăng lên'],
    };
  }
}
