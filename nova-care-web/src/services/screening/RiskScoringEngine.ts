import { QuestionAnswer, ScoringRuleApplied, RedFlagTriggered } from '@/types/screening';
import { RISK_CONFIG } from '@/config/screening/riskConfig';
import { QUESTION_BANK } from '@/config/screening/questionBank';

export class RiskScoringEngine {
  public static calculateRiskScore(
    answers: QuestionAnswer[],
    triggeredRedFlags: RedFlagTriggered[],
    selectedRegionsCount: number
  ): {
    riskScore: number;
    scoringRulesApplied: ScoringRuleApplied[];
  } {
    let totalScore = 0;
    const scoringRulesApplied: ScoringRuleApplied[] = [];

    const addRule = (ruleId: string, score: number, reason: string) => {
      totalScore += score;
      scoringRulesApplied.push({ ruleId, score, reason });
    };

    // 1. Pain Scale Score
    const painAns = answers.find((a) => a.questionId === 'gen_pain_scale');
    if (painAns) {
      const painLevel = Number(painAns.answer) || 0;
      if (painLevel > 0) {
        const painScore = Math.round(painLevel * RISK_CONFIG.scoreWeights.painScaleMultiplier);
        addRule('pain_scale', painScore, `Mức độ đau ghi nhận: ${painLevel}/10 (+${painScore} điểm)`);
      }
    }

    // 2. Symptom Duration Score
    const durAns = answers.find((a) => a.questionId === 'gen_duration');
    if (durAns) {
      const durId = String(durAns.answer);
      const durScore = RISK_CONFIG.scoreWeights.durationScores[durId] || 5;
      addRule('duration', durScore, `Thời gian triệu chứng xuất hiện (+${durScore} điểm)`);
    }

    // 3. Red Flags Score
    triggeredRedFlags.forEach((rf) => {
      const rfScore = RISK_CONFIG.scoreWeights.redFlagSeverityScores[rf.severity] || 15;
      addRule(
        `red_flag_${rf.severity.toLowerCase()}`,
        rfScore,
        `Dấu hiệu cảnh báo ${rf.severity}: ${rf.questionText} (+${rfScore} điểm)`
      );
    });

    // 4. Multiple Regions Score
    if (selectedRegionsCount > 1) {
      const multiScore = Math.min(selectedRegionsCount * 4, 16);
      addRule('multiple_regions', multiScore, `Tổn thương đa vùng cơ thể (${selectedRegionsCount} vùng) (+${multiScore} điểm)`);
    }

    // 5. Option Score Rules
    answers.forEach((ans) => {
      const question = QUESTION_BANK.find((q) => q.id === ans.questionId);
      if (question && question.options) {
        const matched = question.options.find((o) => o.id === ans.answer || o.label === ans.answer);
        if (matched && matched.score && matched.score > 0) {
          addRule(
            `opt_${matched.id}`,
            matched.score,
            `Triệu chứng đặc hiệu: ${matched.label} (+${matched.score} điểm)`
          );
        }
      }
    });

    return {
      riskScore: Math.min(totalScore, 100),
      scoringRulesApplied,
    };
  }
}
