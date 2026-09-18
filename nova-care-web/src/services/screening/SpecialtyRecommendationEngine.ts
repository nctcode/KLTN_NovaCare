import { SpecialtyCandidate, QuestionAnswer, PatientContext, ClinicalTag } from '@/types/screening';
import { SPECIALTY_RULES } from '@/config/screening/specialtyRules';
import { QUESTION_BANK } from '@/config/screening/questionBank';
import { findBodyRegionById } from '@/constants/bodyRegions';

export class SpecialtyRecommendationEngine {
  public static recommendSpecialties(
    selectedRegions: string[],
    answers: QuestionAnswer[],
    patientContext?: PatientContext
  ): SpecialtyCandidate[] {
    const candidates: SpecialtyCandidate[] = [];

    // Extract clinical tags from answers
    const activeTags: Set<ClinicalTag> = new Set();
    answers.forEach((ans) => {
      const q = QUESTION_BANK.find((item) => item.id === ans.questionId);
      if (q && q.clinicalTags) {
        q.clinicalTags.forEach((tag) => activeTags.add(tag));
      }
    });

    SPECIALTY_RULES.forEach((rule) => {
      let candidateScore = 0;
      const reasons: string[] = [];

      // 1. Region match check
      const matchedRegions = selectedRegions.filter((regId) => rule.targetRegions.includes(regId));
      if (matchedRegions.length > 0) {
        candidateScore += rule.baseScore;
        const regionNames = matchedRegions.map((id) => findBodyRegionById(id)?.name || id).join(', ');
        reasons.push(`Ghi nhận vị trí tổn thương tại: ${regionNames}`);
      }

      // 2. Clinical Tag match check
      rule.targetClinicalTags.forEach((tag) => {
        if (activeTags.has(tag)) {
          candidateScore += 15;
        }
      });

      // 3. Specific Answer Reasons
      answers.forEach((ans) => {
        if (ans.questionId === 'shoulder_001' && matchedRegions.length > 0) {
          reasons.push('Đau vai liên quan đến vận động hoặc tư thế nằm');
        }
        if (ans.questionId === 'back_001' && matchedRegions.length > 0) {
          reasons.push('Cơn đau cột sống lan dọc đường đi dây thần kinh');
        }
        if (ans.questionId === 'chest_001' && matchedRegions.length > 0) {
          reasons.push('Cảm giác thắt nghẹt hoặc khó chịu lồng ngực');
        }
        if (ans.questionId === 'gen_pain_scale' && Number(ans.answer) >= 7) {
          reasons.push(`Mức độ đau rầm rộ (${ans.answer}/10) ảnh hưởng đến sinh hoạt`);
        }
      });

      // 4. Patient Context Match
      if (patientContext?.medicalHistory && patientContext.medicalHistory.length > 0) {
        if (rule.specialtyId === 'cardiology' && patientContext.medicalHistory.some((h) => h.includes('Tim') || h.includes('Huyết áp'))) {
          candidateScore += 20;
          reasons.push('Có tiền sử bệnh lý tim mạch/huyết áp trước đó');
        }
      }

      if (candidateScore > 0) {
        candidates.push({
          specialtyId: rule.specialtyId,
          specialtyName: rule.specialtyName,
          score: Math.min(candidateScore, 98),
          reasons: reasons.length > 0 ? reasons : [rule.reasonTemplate],
        });
      }
    });

    // Sort candidates by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Fallback if no specific match
    if (candidates.length === 0) {
      candidates.push({
        specialtyId: 'general_medicine',
        specialtyName: 'Nội tổng quát',
        score: 50,
        reasons: ['Tổn thương chưa khu trú đặc hiệu, gợi ý kiểm tra tổng quát ban đầu với Bác sĩ Nội khoa.'],
      });
    }

    return candidates;
  }
}
