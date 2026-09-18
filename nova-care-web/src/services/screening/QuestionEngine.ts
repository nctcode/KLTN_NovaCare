import { Question, QuestionAnswer, PatientContext } from '@/types/screening';
import { QUESTION_BANK } from '@/config/screening/questionBank';
import { RISK_CONFIG } from '@/config/screening/riskConfig';
import { findBodyRegionById } from '@/constants/bodyRegions';

export interface GenerateQuestionsOptions {
  selectedRegions: string[];
  answers?: QuestionAnswer[];
  patientContext?: PatientContext;
}

export class QuestionEngine {
  /**
   * Dynamically generates the tailored questionnaire for Step 2 based strictly on Step 1 selectedRegions.
   * Only questions matching the selected damaged body region(s) will be presented.
   */
  public static generateQuestions(options: GenerateQuestionsOptions): Question[] {
    const { selectedRegions, answers = [] } = options;
    const answersMap = new Map(answers.map((a) => [a.questionId, a.answer]));

    const resultQuestions: Question[] = [];
    const addedQuestionIds = new Set<string>();

    if (!selectedRegions || selectedRegions.length === 0) {
      return [];
    }

    // 1. Filter Eligible Questions from QUESTION_BANK matching selectedRegions
    const eligibleQuestions = QUESTION_BANK.filter((q) => {
      // Strictly check if question applies to any selected body region
      return q.regionIds.some((rId) => selectedRegions.includes(rId));
    });

    // 2. Sort eligible questions by priority descending
    eligibleQuestions.sort((a, b) => b.priority - a.priority);

    // 3. Process and apply Conditional Filters & Budget Caps
    let regionCount = 0;
    let conditionalCount = 0;

    for (const q of eligibleQuestions) {
      // Check Question Budget cap (max 10 questions)
      if (resultQuestions.length >= RISK_CONFIG.questionBudget.maxQuestions) {
        break;
      }

      // Check conditional dependency (dependsOn / showWhen)
      if (q.condition) {
        const parentAnswer = answersMap.get(q.condition.dependsOnQuestionId);
        if (!parentAnswer) {
          continue; // Parent question not answered yet
        }
        const required = q.condition.showWhenAnswerEquals;
        const matches = Array.isArray(required)
          ? required.includes(String(parentAnswer))
          : String(parentAnswer) === required;
        if (!matches) {
          continue; // Condition not satisfied
        }
        if (conditionalCount >= RISK_CONFIG.questionBudget.maxConditionalQuestions) {
          continue;
        }
        conditionalCount++;
      }

      // Budget check for region-specific questions
      if (q.category === 'region_specific' || q.category === 'red_flag') {
        if (regionCount >= RISK_CONFIG.questionBudget.maxRegionQuestions) {
          continue;
        }
        regionCount++;
      }

      // Deduplicate questions
      if (!addedQuestionIds.has(q.id)) {
        addedQuestionIds.add(q.id);

        // Format question dynamically if it references specific region names
        let formattedQuestion = q.question;
        const matchingRegionId = q.regionIds.find((rId) => selectedRegions.includes(rId));
        if (matchingRegionId && matchingRegionId !== 'general') {
          const regionObj = findBodyRegionById(matchingRegionId);
          if (regionObj) {
            formattedQuestion = q.question.replace(/\{regionName\}/g, regionObj.name);
          }
        }

        resultQuestions.push({
          ...q,
          question: formattedQuestion,
        });
      }
    }

    return resultQuestions;
  }
}
