import { Injectable } from '@nestjs/common';
import { ClinicalFeatures, BodyAreaCode } from '../interfaces/clinical-features.interface';
import { PatternResult } from '../engines/clinical-pattern-engine.service';

export interface ConstraintResult {
  specialtyName: string;
  penalty: number; // Penalty score deduction (e.g. -50, -100)
  reasons: string[];
}

@Injectable()
export class SpecialtyConstraintValidatorService {
  validateConstraints(
    specialtyName: string,
    features: ClinicalFeatures,
    patterns: PatternResult[],
  ): ConstraintResult {
    const sNameLower = specialtyName.toLowerCase();
    let penalty = 0;
    const reasons: string[] = [];

    // Constraint 1: ENDOCRINOLOGY (Nội tiết)
    if (sNameLower.includes('nội tiết')) {
      const endoPattern = patterns.find((p) => p.pattern === 'ENDOCRINE_PATTERN');
      const hasEndocrineSymptoms =
        features.endocrine?.heatIntolerance === true ||
        features.endocrine?.tremor === true ||
        features.endocrine?.unexplainedWeightChange === true ||
        features.endocrine?.polyuriaPolydipsia === true ||
        features.riskFactors?.diabetes === true;

      if (!hasEndocrineSymptoms || !endoPattern || endoPattern.score === 0) {
        penalty += 100; // MAXIMUM PENALTY!
        reasons.push('Phạt -100 điểm: Không thuộc phạm vi khám Nội tiết (Không ghi nhận triệu chứng sụt cân, khát nước, chịu nhiệt kém, run tay hay đái tháo đường).');
      }
    }

    // Constraint 2: PEDIATRICS (Nhi khoa)
    if (sNameLower.includes('nhi')) {
      const isAdult = !features.bodyAreas.some((a) => a === BodyAreaCode.SKIN_GENERALIZED) && true; // Assume adult if no pediatrics age specified
      if (isAdult) {
        penalty += 100;
        reasons.push('Phạt -100 điểm: Bệnh nhân trưởng thành không phù hợp với Chuyên khoa Nhi.');
      }
    }

    // Constraint 3: OBSTETRICS_GYNECOLOGY (Sản phụ khoa)
    if (sNameLower.includes('sản') || sNameLower.includes('phụ khoa')) {
      const hasPelvis = features.bodyAreas.includes(BodyAreaCode.PELVIS);
      if (!hasPelvis) {
        penalty += 80;
        reasons.push('Phạt -80 điểm: Triệu chứng không nằm ở vùng chậu/phụ khoa.');
      }
    }

    // Constraint 4: DERMATOLOGY (Da liễu)
    if (sNameLower.includes('da')) {
      const hasSkin = features.bodyAreas.includes(BodyAreaCode.SKIN_GENERALIZED);
      if (!hasSkin) {
        penalty += 80;
        reasons.push('Phạt -80 điểm: Không có tổn thương da liễu.');
      }
    }

    return {
      specialtyName,
      penalty,
      reasons,
    };
  }
}
