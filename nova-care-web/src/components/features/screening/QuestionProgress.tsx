'use client';

import React from 'react';
import { calculateProgress } from '@/utils/screening/questionUtils';

interface QuestionProgressProps {
  totalAsked: number;
  totalAnswered: number;
}

export function QuestionProgress({ totalAsked, totalAnswered }: QuestionProgressProps) {
  const { percentage, label } = calculateProgress(totalAsked, totalAnswered);

  return (
    <div className="space-y-1.5 select-none">
      <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
        <span>{label}</span>
        <span>{percentage}% hoàn thành</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#0c4b39] to-emerald-500 transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
