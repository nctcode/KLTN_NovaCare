import { Injectable } from '@nestjs/common';
import { ClinicalFeatures, BodyAreaCode } from '../interfaces/clinical-features.interface';

export interface PatternResult {
  pattern: string;
  score: number; // 0-100
  supportingEvidence: string[];
  contradictingEvidence: string[];
}

@Injectable()
export class ClinicalPatternEngineService {
  evaluatePatterns(features: ClinicalFeatures): PatternResult[] {
    const results: PatternResult[] = [];

    // 1. MUSCULOSKELETAL_PATTERN
    let mskScore = 0;
    const mskSupport: string[] = [];
    const mskContradict: string[] = [];

    if (features.pain?.reproducibleByPalpation === true) {
      mskScore += 40;
      mskSupport.push('Ấn vào sụn sườn / vị trí thành ngực làm đau tăng (Đau thành ngực tái tạo)');
    }
    if (features.cardiopulmonary?.pleuriticPain === true || features.pain?.aggravatedBy?.includes('movement')) {
      mskScore += 35;
      mskSupport.push('Đau tăng khi ho, hít sâu hoặc xoay cử động người');
    }
    if (features.bodyAreas.includes(BodyAreaCode.LEFT_LEG) || features.bodyAreas.includes(BodyAreaCode.RIGHT_LEG) || features.bodyAreas.includes(BodyAreaCode.UPPER_BACK) || features.bodyAreas.includes(BodyAreaCode.LOWER_BACK)) {
      mskScore += 25;
      mskSupport.push('Vị trí bất thường nằm tại chi / cột sống');
    }
    results.push({
      pattern: 'MUSCULOSKELETAL_PATTERN',
      score: Math.min(100, mskScore),
      supportingEvidence: mskSupport,
      contradictingEvidence: mskContradict,
    });

    // 2. RESPIRATORY_PATTERN
    let respScore = 0;
    const respSupport: string[] = [];
    const respContradict: string[] = [];

    if (features.cardiopulmonary?.pleuriticPain === true) {
      respScore += 30;
      respSupport.push('Đau màng phổi / ngực tăng khi hít sâu');
    }
    if (features.infection?.fever === true || features.infection?.chills === true) {
      respScore += 35;
      respSupport.push('Có triệu chứng sốt / rét run nghi ngờ nhiễm trùng đường hô hấp');
    }
    if (features.cardiopulmonary?.cough === true || features.cardiopulmonary?.hemoptysis === true) {
      respScore += 30;
      respSupport.push('Có biểu hiện ho hoặc ho có đờm / ho ra máu');
    }
    results.push({
      pattern: 'RESPIRATORY_PATTERN',
      score: Math.min(100, respScore),
      supportingEvidence: respSupport,
      contradictingEvidence: respContradict,
    });

    // 3. CARDIOVASCULAR_PATTERN
    let cvScore = 0;
    const cvSupport: string[] = [];
    const cvContradict: string[] = [];

    if (features.cardiopulmonary?.palpitation === true) {
      cvScore += 25;
      cvSupport.push('Cảm giác tim đập nhanh / hồi hộp / đánh trống ngực');
    }
    if (features.pain?.character?.includes('pressure')) {
      cvScore += 35;
      cvSupport.push('Cảm giác đau ngực kiểu đè nặng / bóp nghẹt');
    } else {
      cvContradict.push('Không có cảm giác đau đè nặng bóp nghẹt điển hình');
    }
    if (features.pain?.radiation?.includes('arm') || features.pain?.radiation?.includes('jaw')) {
      cvScore += 35;
      cvSupport.push('Đau lan ra tay trái / hàm / lưng');
    } else {
      cvContradict.push('Không có hướng lan ra tay trái hoặc hàm');
    }
    if (features.riskFactors?.cardiovascularDisease === true || features.riskFactors?.hypertension === true) {
      cvScore += 20;
      cvSupport.push('Ghi nhận tiền sử bệnh tim mạch / cao huyết áp nền');
    }
    results.push({
      pattern: 'CARDIOVASCULAR_PATTERN',
      score: Math.min(100, cvScore),
      supportingEvidence: cvSupport,
      contradictingEvidence: cvContradict,
    });

    // 4. GASTROINTESTINAL_PATTERN
    let giScore = 0;
    const giSupport: string[] = [];
    const giContradict: string[] = [];

    if (features.gastrointestinal?.reflux === true) {
      giScore += 45;
      giSupport.push('Nóng rát sau xương ức / ợ chua / trào ngược');
    }
    if (giScore > 0 && features.bodyAreas.includes(BodyAreaCode.ABDOMEN)) {
      giScore += 40;
      giSupport.push('Tổn thương / đau vùng bụng');
    }
    results.push({
      pattern: 'GASTROINTESTINAL_PATTERN',
      score: Math.min(100, giScore),
      supportingEvidence: giSupport,
      contradictingEvidence: giContradict,
    });

    // 5. NEUROLOGICAL_PATTERN
    let neuroScore = 0;
    const neuroSupport: string[] = [];
    const neuroContradict: string[] = [];

    if (features.neurological?.weakness === true || features.neurological?.speechAbnormality === true) {
      neuroScore += 70;
      neuroSupport.push('Triệu chứng thần kinh trung ương: yếu liệt / nói khó');
    }
    if (features.bodyAreas.includes(BodyAreaCode.HEAD)) {
      neuroScore += 30;
      neuroSupport.push('Bất thường vùng đầu / thần kinh');
    }
    results.push({
      pattern: 'NEUROLOGICAL_PATTERN',
      score: Math.min(100, neuroScore),
      supportingEvidence: neuroSupport,
      contradictingEvidence: neuroContradict,
    });

    // 6. DERMATOLOGICAL_PATTERN
    let dermScore = 0;
    const dermSupport: string[] = [];
    if (features.bodyAreas.includes(BodyAreaCode.SKIN_GENERALIZED)) {
      dermScore += 80;
      dermSupport.push('Tổn thương da liễu');
    }
    results.push({
      pattern: 'DERMATOLOGICAL_PATTERN',
      score: Math.min(100, dermScore),
      supportingEvidence: dermSupport,
      contradictingEvidence: [],
    });

    // 7. ENDOCRINE_PATTERN
    // CRITICAL: MUST ONLY score > 0 if endocrine specific features/history exist!
    let endoScore = 0;
    const endoSupport: string[] = [];
    const endoContradict: string[] = [];

    if (features.endocrine?.heatIntolerance === true) {
      endoScore += 40;
      endoSupport.push('Biểu hiện sợ nóng / chịu nhiệt kém');
    }
    if (features.endocrine?.tremor === true) {
      endoScore += 30;
      endoSupport.push('Biểu hiện run tay / run ngón tay');
    }
    if (features.endocrine?.unexplainedWeightChange === true) {
      endoScore += 30;
      endoSupport.push('Tăng hoặc giảm cân bất thường nhanh chóng');
    }
    if (features.endocrine?.polyuriaPolydipsia === true) {
      endoScore += 30;
      endoSupport.push('Tiểu nhiều / khát nước nhiều');
    }
    if (features.riskFactors?.diabetes === true) {
      endoScore += 20;
      endoSupport.push('Tiền sử đái tháo đường');
    }

    if (endoScore === 0) {
      endoContradict.push('KHÔNG có dấu hiệu lâm sàng hoặc tiền sử liên quan đến bệnh lý nội tiết / tuyến giáp');
    }

    results.push({
      pattern: 'ENDOCRINE_PATTERN',
      score: Math.min(100, endoScore), // WILL BE EXACTLY 0 FOR CHEST CASE WITHOUT ENDOCRINE FEATURES!
      supportingEvidence: endoSupport,
      contradictingEvidence: endoContradict,
    });

    // 8. ENT_PATTERN
    let entScore = 0;
    const entSupport: string[] = [];
    if (features.bodyAreas.includes(BodyAreaCode.EAR) || features.bodyAreas.includes(BodyAreaCode.THROAT)) {
      entScore += 80;
      entSupport.push('Bất thường vùng tai / họng');
    }
    results.push({
      pattern: 'ENT_PATTERN',
      score: Math.min(100, entScore),
      supportingEvidence: entSupport,
      contradictingEvidence: [],
    });

    return results;
  }
}
