import { QuestionAnswer } from '@/types/screening';

export function calculateProgress(totalAsked: number, totalAnswered: number): {
  percentage: number;
  label: string;
} {
  if (totalAsked === 0) return { percentage: 0, label: '0%' };
  const percentage = Math.min(Math.round((totalAnswered / totalAsked) * 100), 100);
  return {
    percentage,
    label: `Câu ${Math.min(totalAnswered + 1, totalAsked)} / ${totalAsked} (${percentage}%)`,
  };
}

export function formatAnswerDisplay(ans: QuestionAnswer): string {
  if (Array.isArray(ans.answer)) {
    return ans.answer.join(', ');
  }
  return String(ans.answerLabel || ans.answer);
}
