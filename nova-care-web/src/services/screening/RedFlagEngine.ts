import { QuestionAnswer, RedFlagTriggered, RedFlagSeverity } from '@/types/screening';
import { QUESTION_BANK } from '@/config/screening/questionBank';

export class RedFlagEngine {
  public static evaluateRedFlags(answers: QuestionAnswer[]): {
    hasCriticalRedFlag: boolean;
    triggeredRedFlags: RedFlagTriggered[];
  } {
    const triggeredRedFlags: RedFlagTriggered[] = [];
    let hasCriticalRedFlag = false;

    answers.forEach((ans) => {
      const question = QUESTION_BANK.find((q) => q.id === ans.questionId);
      if (!question) return;

      const isYesAnswer =
        ans.answer === 'yes' ||
        ans.answer === 'Có' ||
        (Array.isArray(ans.answer) && ans.answer.includes('yes'));

      // Check question-level red flag
      if (question.redFlag && isYesAnswer) {
        const severity: RedFlagSeverity = question.redFlagSeverity || 'MODERATE';
        if (severity === 'CRITICAL') {
          hasCriticalRedFlag = true;
        }

        triggeredRedFlags.push({
          questionId: question.id,
          questionText: question.question,
          severity,
          answerLabel: typeof ans.answer === 'string' ? ans.answer : 'Có',
          advice:
            severity === 'CRITICAL'
              ? 'Triệu chứng có dấu hiệu cần được đánh giá y tế khẩn cấp.'
              : 'Triệu chứng cần được bác sĩ đánh giá sớm.',
        });
        return;
      }

      // Check option-level red flag
      if (question.options) {
        const matchedOption = question.options.find(
          (opt) => opt.id === ans.answer || opt.label === ans.answer
        );
        if (matchedOption && matchedOption.redFlagSeverity) {
          const severity = matchedOption.redFlagSeverity;
          if (severity === 'CRITICAL') {
            hasCriticalRedFlag = true;
          }

          triggeredRedFlags.push({
            questionId: question.id,
            questionText: question.question,
            severity,
            answerLabel: matchedOption.label,
            advice: 'Dấu hiệu triệu chứng ghi nhận cần lưu ý y tế.',
          });
        }
      }
    });

    return {
      hasCriticalRedFlag,
      triggeredRedFlags,
    };
  }
}
