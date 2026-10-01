import { BodyAreaCode } from '../interfaces/clinical-features.interface';

export interface ScoringWeights {
  anatomy: number;
  symptom: number;
  pattern: number;
  history: number;
  objective: number;
  rag: number;
}

export const SPECIALTY_SCORING_WEIGHTS: ScoringWeights = {
  anatomy: 0.15,
  symptom: 0.30,
  pattern: 0.30,
  history: 0.10,
  objective: 0.10,
  rag: 0.05,
};

// Anatomical priors mapping BodyArea -> Primary & Secondary Specialties
export const ANATOMICAL_PRIORS: Record<BodyAreaCode, string[]> = {
  [BodyAreaCode.CHEST]: ['Tim mạch', 'Hô hấp', 'Cơ xương khớp', 'Tiêu hóa', 'Nội tổng quát'],
  [BodyAreaCode.HEAD]: ['Thần kinh', 'Tai Mũi Họng', 'Mắt', 'Nội tổng quát'],
  [BodyAreaCode.NECK]: ['Tai Mũi Họng', 'Nội tiết', 'Cơ xương khớp', 'Nội tổng quát'],
  [BodyAreaCode.ABDOMEN]: ['Tiêu hóa', 'Sản phụ khoa', 'Thận - Tiết niệu', 'Nội tổng quát'],
  [BodyAreaCode.UPPER_BACK]: ['Cơ xương khớp', 'Thần kinh', 'Nội tổng quát'],
  [BodyAreaCode.LOWER_BACK]: ['Cơ xương khớp', 'Thần kinh', 'Thận - Tiết niệu', 'Nội tổng quát'],
  [BodyAreaCode.LEFT_ARM]: ['Cơ xương khớp', 'Tim mạch', 'Thần kinh'],
  [BodyAreaCode.RIGHT_ARM]: ['Cơ xương khớp', 'Thần kinh'],
  [BodyAreaCode.LEFT_LEG]: ['Cơ xương khớp', 'Thần kinh'],
  [BodyAreaCode.RIGHT_LEG]: ['Cơ xương khớp', 'Thần kinh'],
  [BodyAreaCode.SKIN_GENERALIZED]: ['Da liễu', 'Dị ứng - Miễn dịch', 'Nội tổng quát'],
  [BodyAreaCode.EYE]: ['Mắt', 'Thần kinh'],
  [BodyAreaCode.EAR]: ['Tai Mũi Họng', 'Thần kinh'],
  [BodyAreaCode.THROAT]: ['Tai Mũi Họng', 'Hô hấp'],
  [BodyAreaCode.PELVIS]: ['Sản phụ khoa', 'Thận - Tiết niệu', 'Tiêu hóa'],
};
