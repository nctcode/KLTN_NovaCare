import { Injectable } from '@nestjs/common';
import { BodyRegionEnum } from '../normalization/screening-data-normalizer.service';

export interface QuestionDefinition {
  id: string;
  question: string;
  options?: string[];
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT' | 'SCALE';
  requirement: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';
  conditionRegion?: BodyRegionEnum;
}

@Injectable()
export class QuestionEngineService {
  getQuestionsForRegions(regions: BodyRegionEnum[]): QuestionDefinition[] {
    const questions: QuestionDefinition[] = [
      {
        id: 'q_duration',
        question: 'Triệu chứng xuất hiện từ khi nào?',
        options: ['< 24 giờ (Cấp tính)', '1 - 3 ngày', '1 tuần', '> 1 tháng (Dai dẳng)'],
        type: 'SINGLE_CHOICE',
        requirement: 'REQUIRED',
      },
      {
        id: 'q_pain_scale',
        question: 'Đánh giá mức độ khó chịu / đau (thang điểm 1 - 10):',
        type: 'SCALE',
        requirement: 'REQUIRED',
      },
    ];

    if (regions.includes(BodyRegionEnum.CHEST)) {
      questions.push(
        {
          id: 'q_chest_breath',
          question: 'Bạn có kèm theo triệu chứng khó thở, tức ngực hoặc vã mồ hôi không?',
          options: ['Có khó thở dữ dội', 'Tức ngực đè nặng', 'Có lan ra cánh tay/hàm', 'Không có'],
          type: 'MULTIPLE_CHOICE',
          requirement: 'REQUIRED',
          conditionRegion: BodyRegionEnum.CHEST,
        },
        {
          id: 'q_chest_history',
          question: 'Bạn có tiền sử bệnh lý tim mạch hay cao huyết áp không?',
          options: ['Tăng huyết áp', 'Hội chứng mạch vành', 'Rối loạn nhịp tim', 'Không có'],
          type: 'MULTIPLE_CHOICE',
          requirement: 'OPTIONAL',
          conditionRegion: BodyRegionEnum.CHEST,
        }
      );
    }

    if (regions.includes(BodyRegionEnum.SKIN_GENERALIZED)) {
      questions.push(
        {
          id: 'q_skin_type',
          question: 'Đặc điểm tổn thương da hiện tại:',
          options: ['Phát ban ngứa', 'Mụn mủ / Viêm sưng', 'Nổi mề đay', 'Vết thâm / Tàn nhang'],
          type: 'MULTIPLE_CHOICE',
          requirement: 'REQUIRED',
          conditionRegion: BodyRegionEnum.SKIN_GENERALIZED,
        },
        {
          id: 'q_skin_cosmetic',
          question: 'Bạn có tiếp xúc với mỹ phẩm / hóa chất / dị nguyên mới không?',
          options: ['Có mỹ phẩm mới', 'Có tiếp xúc hóa chất', 'Không rõ'],
          type: 'SINGLE_CHOICE',
          requirement: 'OPTIONAL',
          conditionRegion: BodyRegionEnum.SKIN_GENERALIZED,
        }
      );
    }

    if (regions.includes(BodyRegionEnum.ABDOMEN)) {
      questions.push({
        id: 'q_abdomen_digest',
        question: 'Bạn có biểu hiện buồn nôn, tiêu chảy hoặc đau thắt bụng không?',
        options: ['Đau thắt từng cơn', 'Buồn nôn / Nôn', 'Tiêu chảy', 'Sốt nhẹ'],
        type: 'MULTIPLE_CHOICE',
        requirement: 'REQUIRED',
        conditionRegion: BodyRegionEnum.ABDOMEN,
      });
    }

    if (regions.includes(BodyRegionEnum.HEAD) || regions.includes(BodyRegionEnum.THROAT)) {
      questions.push({
        id: 'q_head_throat_fever',
        question: 'Bạn có triệu chứng sốt, đau họng hoặc nhức đầu kéo dài không?',
        options: ['Sốt cao trên 38.5°C', 'Đau rát họng khi nuốt', 'Ho có đờm', 'Đau nửa đầu'],
        type: 'MULTIPLE_CHOICE',
        requirement: 'REQUIRED',
      });
    }

    return questions;
  }
}
