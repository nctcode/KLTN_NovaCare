import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ClinicalFeatures, BodyAreaCode } from '../interfaces/clinical-features.interface';
import { PatternResult } from './clinical-pattern-engine.service';
import { SpecialtyConstraintValidatorService } from '../validators/specialty-constraint-validator.service';
import { SPECIALTY_SCORING_WEIGHTS, ANATOMICAL_PRIORS } from '../config/specialty-scoring.config';

export interface SpecialtyScoreResult {
  specialtyId: string;
  specialtyCode: string;
  specialtyName: string;
  anatomyScore: number;
  symptomScore: number;
  patternScore: number;
  historyScore: number;
  objectiveScore: number;
  ragScore: number;
  penalty: number;
  finalScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string[];
}

export interface ResolvedSpecialty {
  id: string;
  code: string;
  name: string;
}

export interface RecommendationResult {
  primarySpecialty: ResolvedSpecialty;
  alternativeSpecialties: ResolvedSpecialty[];
  reasons: string[];
}

export interface RecommendationEngineOutput {
  primarySpecialty: {
    id: string;
    code: string;
    name: string;
    score: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    evidence: string[];
  };
  specialtyScores: SpecialtyScoreResult[];
  needsGeneralAssessment: boolean;
  reasons: string[];
}

@Injectable()
export class SpecialtyRecommendationEngineService {
  private readonly logger = new Logger(SpecialtyRecommendationEngineService.name);

  constructor(
    private prisma: PrismaService,
    private constraintValidator: SpecialtyConstraintValidatorService,
  ) {}

  async calculateSpecialtyScores(
    features: ClinicalFeatures,
    patterns: PatternResult[],
    ragCandidateName?: string,
    ragSimilarity = 0,
  ): Promise<RecommendationEngineOutput> {
    const allSpecialties = await this.prisma.specialty.findMany();
    if (allSpecialties.length === 0) {
      const fallback = { id: 'default-spec', code: 'GENERAL', name: 'Nội tổng quát' };
      return {
        primarySpecialty: {
          id: fallback.id,
          code: fallback.code,
          name: fallback.name,
          score: 50,
          confidence: 'LOW',
          reason: 'Chưa đủ dữ liệu - Đề xuất khám Nội tổng quát',
          evidence: [],
        },
        specialtyScores: [],
        needsGeneralAssessment: true,
        reasons: ['Chưa có danh mục chuyên khoa trong DB'],
      };
    }

    const scores: SpecialtyScoreResult[] = [];

    // Calculate score for each DB specialty
    for (const spec of allSpecialties) {
      const sName = spec.name;
      const sLower = sName.toLowerCase();
      const evidence: string[] = [];

      // 1. Anatomy Score (0-100)
      let anatomyScore = 0;
      features.bodyAreas.forEach((areaCode) => {
        const priors = ANATOMICAL_PRIORS[areaCode] || [];
        if (priors.some((p) => p.toLowerCase() === sLower || sLower.includes(p.toLowerCase()))) {
          anatomyScore += 80;
          evidence.push(`Vùng cơ thể ${areaCode} thuộc diện khám của ${sName}`);
        }
      });
      anatomyScore = Math.min(100, anatomyScore);

      // 2. Pattern Score (0-100)
      let patternScore = 0;
      if (sLower.includes('cơ xương khớp') || sLower.includes('chỉnh hình')) {
        const msk = patterns.find((p) => p.pattern === 'MUSCULOSKELETAL_PATTERN');
        if (msk) {
          patternScore = msk.score;
          evidence.push(...msk.supportingEvidence);
        }
      } else if (sLower.includes('hô hấp') || sLower.includes('phổi')) {
        const resp = patterns.find((p) => p.pattern === 'RESPIRATORY_PATTERN');
        if (resp) {
          patternScore = resp.score;
          evidence.push(...resp.supportingEvidence);
        }
      } else if (sLower.includes('tim')) {
        const cv = patterns.find((p) => p.pattern === 'CARDIOVASCULAR_PATTERN');
        if (cv) {
          patternScore = cv.score;
          evidence.push(...cv.supportingEvidence);
        }
      } else if (sLower.includes('tiêu hóa')) {
        const gi = patterns.find((p) => p.pattern === 'GASTROINTESTINAL_PATTERN');
        if (gi) {
          patternScore = gi.score;
          evidence.push(...gi.supportingEvidence);
        }
      } else if (sLower.includes('thần kinh')) {
        const neuro = patterns.find((p) => p.pattern === 'NEUROLOGICAL_PATTERN');
        if (neuro) {
          patternScore = neuro.score;
          evidence.push(...neuro.supportingEvidence);
        }
      } else if (sLower.includes('nội tiết')) {
        const endo = patterns.find((p) => p.pattern === 'ENDOCRINE_PATTERN');
        if (endo) {
          patternScore = endo.score; // WILL BE 0 FOR CHEST CASE!
          evidence.push(...endo.supportingEvidence);
        }
      } else if (sLower.includes('da')) {
        const derm = patterns.find((p) => p.pattern === 'DERMATOLOGICAL_PATTERN');
        if (derm) {
          patternScore = derm.score;
          evidence.push(...derm.supportingEvidence);
        }
      }

      // 3. Symptom Score (0-100)
      let symptomScore = patternScore * 0.9;

      // 4. History Score (0-100)
      let historyScore = 0;
      if (sLower.includes('tim') && features.riskFactors?.cardiovascularDisease === true) {
        historyScore = 100;
      } else if (sLower.includes('nội tiết') && features.riskFactors?.diabetes === true) {
        historyScore = 100;
      }

      // 5. Objective Score (0-100) (Vitals/PPG/BMI/Vision)
      let objectiveScore = 0;
      if (sLower.includes('tim') && features.vitals?.heartRate && (features.vitals.heartRate > 100 || features.vitals.heartRate < 55)) {
        objectiveScore = 80;
      }

      // 6. RAG Score (0-100) - Capped at <= 5% final weight!
      let ragScore = 0;
      if (ragCandidateName && sLower.includes(ragCandidateName.toLowerCase())) {
        ragScore = Math.min(100, ragSimilarity * 100);
      }

      // 7. Constraint Penalties (e.g. -50 for Endocrinology on Chest without endocrine evidence)
      const constraint = this.constraintValidator.validateConstraints(sName, features, patterns);
      const penalty = constraint.penalty;

      // Calculate Final Weighted Score
      const w = SPECIALTY_SCORING_WEIGHTS;
      const rawWeighted =
        anatomyScore * w.anatomy +
        symptomScore * w.symptom +
        patternScore * w.pattern +
        historyScore * w.history +
        objectiveScore * w.objective +
        ragScore * w.rag;

      const finalScore = Math.max(0, Math.round(rawWeighted - penalty));
      const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = finalScore >= 80 ? 'HIGH' : finalScore >= 60 ? 'MEDIUM' : 'LOW';

      scores.push({
        specialtyId: spec.id,
        specialtyCode: (spec as any).code || sName.toUpperCase().replace(/\s+/g, '_'),
        specialtyName: sName,
        anatomyScore,
        symptomScore,
        patternScore,
        historyScore,
        objectiveScore,
        ragScore,
        penalty,
        finalScore,
        confidence,
        evidence: Array.from(new Set(evidence)),
      });
    }

    // Sort scores descending by finalScore
    scores.sort((a, b) => b.finalScore - a.finalScore);

    // DEBUG OBSERVABILITY LOGGING
    this.logger.log('===== SPECIALTY SCORING BREAKDOWN =====');
    scores.forEach((sc) => {
      this.logger.log(
        `Specialty: ${sc.specialtyName} | FinalScore: ${sc.finalScore} | Anat:${sc.anatomyScore} Sym:${sc.symptomScore} Pat:${sc.patternScore} Hist:${sc.historyScore} Obj:${sc.objectiveScore} RAG:${sc.ragScore} Pen:-${sc.penalty}`
      );
    });

    const best = scores[0];
    // Needs general assessment only if top score is zero or penalized
    const needsGeneralAssessment = best.finalScore <= 0;

    let primarySpec = best;
    if (needsGeneralAssessment) {
      const general = scores.find(
        (sc) =>
          sc.specialtyName.toLowerCase().includes('nội tổng quát') ||
          sc.specialtyName.toLowerCase().includes('tổng quát') ||
          sc.specialtyName.toLowerCase().includes('đa khoa')
      );
      primarySpec = general || best;
    }

    return {
      primarySpecialty: {
        id: primarySpec.specialtyId,
        code: primarySpec.specialtyCode,
        name: primarySpec.specialtyName,
        score: primarySpec.finalScore,
        confidence: primarySpec.confidence,
        reason: primarySpec.evidence.length > 0 ? primarySpec.evidence.slice(0, 3).join('. ') : 'Tổng hợp các yếu tố sàng lọc lâm sàng',
        evidence: primarySpec.evidence,
      },
      specialtyScores: scores,
      needsGeneralAssessment,
      reasons: primarySpec.evidence,
    };
  }
}
