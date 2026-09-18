import { RiskLevel, RecommendationType, RedFlagTriggered } from '@/types/screening';
import { getRiskLevelFromScore } from '@/config/screening/riskConfig';

export interface TriageDecision {
  riskLevel: RiskLevel;
  recommendationType: RecommendationType;
  urgentAdvice?: string;
}

export class TriageEngine {
  public static evaluateTriage(
    riskScore: number,
    hasCriticalRedFlag: boolean,
    triggeredRedFlags: RedFlagTriggered[]
  ): TriageDecision {
    const riskLevel = getRiskLevelFromScore(riskScore, hasCriticalRedFlag);

    if (hasCriticalRedFlag || riskLevel === 'URGENT') {
      const criticalItem = triggeredRedFlags.find((rf) => rf.severity === 'CRITICAL');
      return {
        riskLevel: 'URGENT',
        recommendationType: 'TRIAGE',
        urgentAdvice: criticalItem
          ? `Cảnh báo: ${criticalItem.questionText}. Triệu chứng có dấu hiệu cần được bác sĩ đánh giá y tế cấp cứu sớm. Vui lòng di chuyển đến cơ sở y tế gần nhất.`
          : 'Triệu chứng của bạn diễn tiến nguy cơ cao, khuyến cáo cần được đánh giá y tế trực tiếp sớm.',
      };
    }

    return {
      riskLevel,
      recommendationType: 'SPECIALTY',
    };
  }
}
