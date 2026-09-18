import { ClinicalTag } from '@/types/screening';

export interface SpecialtyRule {
  specialtyId: string;
  specialtyName: string;
  targetRegions: string[];
  targetClinicalTags: ClinicalTag[];
  baseScore: number;
  reasonTemplate: string;
}

export const SPECIALTY_RULES: SpecialtyRule[] = [
  {
    specialtyId: 'orthopedics',
    specialtyName: 'Cơ xương khớp & Chấn thương chỉnh hình',
    targetRegions: [
      'left_shoulder',
      'right_shoulder',
      'left_upper_arm',
      'right_upper_arm',
      'left_elbow',
      'right_elbow',
      'left_forearm',
      'right_forearm',
      'left_hand',
      'right_hand',
      'upper_back',
      'mid_back',
      'lower_back',
      'left_hip',
      'right_hip',
      'left_thigh',
      'right_thigh',
      'left_knee',
      'right_knee',
      'left_calf',
      'right_calf',
      'left_ankle',
      'right_ankle',
      'left_foot',
      'right_foot',
    ],
    targetClinicalTags: ['musculoskeletal', 'pain', 'trauma'],
    baseScore: 50,
    reasonTemplate: 'Triệu chứng tổn thương liên quan đến vận động khớp, cơ bắp hoặc chấn thương cột sống/chi.',
  },
  {
    specialtyId: 'cardiology',
    specialtyName: 'Tim mạch',
    targetRegions: ['chest', 'upper_chest', 'lower_chest'],
    targetClinicalTags: ['cardiovascular', 'respiratory'],
    baseScore: 60,
    reasonTemplate: 'Cảm giác đau ngực, bóp nghẹt hoặc bất thường vùng lồng ngực cần theo dõi chuyên khoa Tim mạch.',
  },
  {
    specialtyId: 'neurology',
    specialtyName: 'Thần kinh',
    targetRegions: ['head', 'face', 'neck', 'lower_back'],
    targetClinicalTags: ['neurological'],
    baseScore: 55,
    reasonTemplate: 'Dấu hiệu đau đầu, chóng mặt, tê bì hoặc đau lan dọc đường đi của dây thần kinh.',
  },
  {
    specialtyId: 'gastroenterology',
    specialtyName: 'Tiêu hóa',
    targetRegions: ['upper_abdomen', 'abdomen', 'lower_abdomen'],
    targetClinicalTags: ['gastrointestinal'],
    baseScore: 55,
    reasonTemplate: 'Biểu hiện đau vùng bụng, dạ dày hoặc rối loạn tiêu hóa.',
  },
  {
    specialtyId: 'ent',
    specialtyName: 'Tai Mũi Họng',
    targetRegions: ['neck', 'face', 'head'],
    targetClinicalTags: ['ent', 'inflammation'],
    baseScore: 45,
    reasonTemplate: 'Triệu chứng viêm ho họng, vùng cổ hoặc tai mũi họng.',
  },
  {
    specialtyId: 'dermatology',
    specialtyName: 'Da liễu',
    targetRegions: ['general'],
    targetClinicalTags: ['dermatology', 'inflammation'],
    baseScore: 40,
    reasonTemplate: 'Tổn thương da, mẩn đỏ hoặc dị ứng ngoài da.',
  },
  {
    specialtyId: 'general_medicine',
    specialtyName: 'Nội tổng quát',
    targetRegions: ['general'],
    targetClinicalTags: ['pain', 'inflammation'],
    baseScore: 35,
    reasonTemplate: 'Đánh giá lâm sàng tổng quát ban đầu để kiểm tra các triệu chứng toàn thân.',
  },
];
