import { Injectable, BadRequestException } from '@nestjs/common';
import { RecommendationResult } from '../engines/specialty-recommendation-engine.service';
import { RiskScoringResult } from '../engines/risk-scoring-engine.service';
import { ScreeningContext } from '../normalization/screening-data-normalizer.service';

export interface FinalScreeningResultDTO {
  sessionId: string;
  triage: {
    level: 'ROUTINE' | 'CONSULT' | 'EMERGENCY';
    score: number;
    redFlags: string[];
    hasRedFlag: boolean;
  };
  recommendation: {
    primarySpecialty: { id: string; code: string; name: string };
    alternativeSpecialties: { id: string; code: string; name: string }[];
    reasoning: string[];
  };
  recommendedInputs: ('SYMPTOM_IMAGE' | 'MEDICAL_DOCUMENT' | 'PPG' | 'BMI' | 'VOICE_DESCRIPTION')[];
  dataQuality: {
    image: 'GOOD' | 'LOW' | 'NOT_PROVIDED';
    ppg: 'GOOD' | 'LOW' | 'NOT_PROVIDED';
    voice: 'GOOD' | 'NOT_PROVIDED';
  };
  nextAction: 'BOOK_SPECIALTY' | 'EMERGENCY_GUIDANCE' | 'REVIEW_RESULT';
}

@Injectable()
export class ScreeningResultValidatorService {
  validateAndConstruct(
    sessionId: string,
    context: ScreeningContext,
    riskScoring: RiskScoringResult,
    recommendation: RecommendationResult
  ): FinalScreeningResultDTO {
    // 1. Validate Triage Level (Rule: If riskScoring is EMERGENCY, final triage MUST be EMERGENCY)
    let finalLevel = riskScoring.level;
    if (riskScoring.level === 'EMERGENCY') {
      finalLevel = 'EMERGENCY';
    }

    // 2. Determine Next Action
    let nextAction: 'BOOK_SPECIALTY' | 'EMERGENCY_GUIDANCE' | 'REVIEW_RESULT' = 'BOOK_SPECIALTY';
    if (finalLevel === 'EMERGENCY') {
      nextAction = 'EMERGENCY_GUIDANCE';
    } else if (finalLevel === 'ROUTINE') {
      nextAction = 'REVIEW_RESULT';
    }

    // 3. Assess Data Quality
    const imageQuality = context.imageFindings.length > 0 ? 'GOOD' : 'NOT_PROVIDED';
    const ppgQuality = context.vitals.heartRateBpm ? (context.vitals.heartRateBpm > 30 && context.vitals.heartRateBpm < 200 ? 'GOOD' : 'LOW') : 'NOT_PROVIDED';
    const voiceQuality = context.voiceTranscript ? 'GOOD' : 'NOT_PROVIDED';

    // 4. Calculate Recommended Inputs based on body regions
    const recommendedInputs: ('SYMPTOM_IMAGE' | 'MEDICAL_DOCUMENT' | 'PPG' | 'BMI' | 'VOICE_DESCRIPTION')[] = [];
    const regionCodes = context.regions.map((r) => r.code);

    if (regionCodes.some((code) => code.includes('SKIN'))) {
      recommendedInputs.push('SYMPTOM_IMAGE');
    }
    if (regionCodes.some((code) => code.includes('CHEST'))) {
      recommendedInputs.push('PPG');
    }
    if (regionCodes.some((code) => code.includes('THROAT') || code.includes('NECK'))) {
      recommendedInputs.push('VOICE_DESCRIPTION', 'SYMPTOM_IMAGE');
    }
    if (recommendedInputs.length === 0) {
      recommendedInputs.push('BMI');
    }

    // 5. Validate Primary Specialty Presence
    if (!recommendation.primarySpecialty || !recommendation.primarySpecialty.id) {
      throw new BadRequestException('Primary specialty record missing or invalid');
    }

    return {
      sessionId,
      triage: {
        level: finalLevel,
        score: riskScoring.score,
        redFlags: riskScoring.reasons,
        hasRedFlag: finalLevel === 'EMERGENCY',
      },
      recommendation: {
        primarySpecialty: recommendation.primarySpecialty,
        alternativeSpecialties: recommendation.alternativeSpecialties || [],
        reasoning: recommendation.reasons || [],
      },
      recommendedInputs: Array.from(new Set(recommendedInputs)),
      dataQuality: {
        image: imageQuality,
        ppg: ppgQuality,
        voice: voiceQuality,
      },
      nextAction,
    };
  }
}
