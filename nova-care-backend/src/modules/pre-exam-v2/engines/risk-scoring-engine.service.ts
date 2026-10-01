import { Injectable } from '@nestjs/common';
import { ScreeningContext } from '../normalization/screening-data-normalizer.service';
import { RedFlagResult } from './red-flag-engine.service';

export interface RiskScoringResult {
  score: number;
  level: 'ROUTINE' | 'CONSULT' | 'EMERGENCY';
  reasons: string[];
}

@Injectable()
export class RiskScoringEngineService {
  calculate(context: ScreeningContext, redFlagResult: RedFlagResult): RiskScoringResult {
    const reasons: string[] = [];
    let score = 20; // Default base score for any symptom report

    // 1. Red Flags Escalation OVERRIDE (Strict Safety Rule)
    // If hasRedFlag is true, triage level MUST be EMERGENCY regardless of how low the numerical score is.
    if (redFlagResult.isEmergency) {
      score = Math.max(75, score);
      reasons.push(...redFlagResult.flags);
      return {
        score,
        level: 'EMERGENCY',
        reasons,
      };
    }

    // 2. Pain Score Contribution
    if (context.painScore !== null) {
      const painContrib = Math.min(30, context.painScore * 3);
      score += painContrib;
      if (context.painScore >= 6) {
        reasons.push(`Mức độ đau ghi nhận: ${context.painScore}/10`);
      }
    }

    // 3. Duration Contribution
    if (context.duration.includes('< 24 giờ') || context.duration.includes('Cấp tính')) {
      score += 15;
      reasons.push('Triệu chứng diễn tiến cấp tính trong 24h');
    } else if (context.duration.includes('Dai dẳng') || context.duration.includes('> 1 tháng')) {
      score += 10;
      reasons.push('Triệu chứng kéo dài dai dẳng hơn 1 tháng');
    }

    // 4. Warning Answers
    if (context.redFlagAnswers.length > 0) {
      score += Math.min(25, context.redFlagAnswers.length * 10);
      reasons.push(`Dấu hiệu bất thường: ${context.redFlagAnswers.join(', ')}`);
    }

    // 5. Image & Voice context
    if (context.imageFindings.length > 0) {
      score += 5;
      reasons.push('Đã ghi nhận hình ảnh triệu chứng lâm sàng');
    }

    // 6. Vitals context (Supplemental signal only)
    if (
      context.vitals.measurementQuality !== 'LOW' &&
      context.vitals.heartRateBpm &&
      (context.vitals.heartRateBpm > 100 || context.vitals.heartRateBpm < 55)
    ) {
      score += 10;
      reasons.push(`Nhịp tim PPG ghi nhận: ${context.vitals.heartRateBpm} BPM`);
    }

    // Clamp score to range 0-100
    score = Math.min(100, Math.max(0, score));

    /**
     * INTERNAL SCREENING HEURISTIC / CONFIG THRESHOLDS:
     * Note: This score and these thresholds (0-39 ROUTINE, 40-74 CONSULT, >=75 EMERGENCY)
     * are internal platform triage heuristics, NOT a validated clinical diagnostic scale.
     */
    let level: 'ROUTINE' | 'CONSULT' | 'EMERGENCY' = 'ROUTINE';
    if (score >= 75) {
      level = 'EMERGENCY';
    } else if (score >= 40 || context.regions.length > 0 || context.painScore !== null) {
      level = 'CONSULT';
    }

    return {
      score,
      level,
      reasons,
    };
  }
}
