'use client';

import React from 'react';
import { Question } from '@/types/screening';
import { Check, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface DynamicQuestionProps {
  question: Question;
  index: number;
  currentAnswer: any;
  onAnswer: (answer: any, label?: string) => void;
}

export function DynamicQuestion({
  question,
  index,
  currentAnswer,
  onAnswer,
}: DynamicQuestionProps) {
  const { type, options, question: titleText, helpText, subtitle } = question;

  return (
    <div className="p-4.5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-black text-slate-900 dark:text-white flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-[#0c4b39] text-[#66FF33] text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
            {index + 1}
          </span>
          <span>{titleText}</span>
        </p>
        {(helpText || subtitle) && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pl-7">
            {subtitle || helpText}
          </p>
        )}
      </div>

      {/* TYPE: SINGLE CHOICE / BOOLEAN / YES_NO / DURATION */}
      {(type === 'single' ||
        type === 'single_choice' ||
        type === 'boolean' ||
        type === 'yes_no' ||
        type === 'duration') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
          {(
            options ||
            (type === 'boolean' || type === 'yes_no'
              ? [
                  { id: 'yes', value: 'yes', label: 'Có' },
                  { id: 'no', value: 'no', label: 'Không' },
                ]
              : [])
          ).map((opt: any, optIdx: number) => {
            const optValue = opt.id || opt.value || opt.label;
            const optLabel = opt.label || opt.value || String(optValue);
            const isSelected = currentAnswer === optValue || currentAnswer === optLabel;

            return (
              <button
                key={opt.id || opt.value || optIdx}
                type="button"
                aria-label={optLabel}
                onClick={() => onAnswer(optValue, optLabel)}
                className={`p-3 rounded-2xl border text-xs font-bold transition text-left flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#0c4b39] text-[#66FF33] border-[#0c4b39] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                }`}
              >
                <span>{optLabel}</span>
                {isSelected && <Check className="w-4 h-4 text-[#66FF33] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* TYPE: MULTIPLE CHOICE */}
      {(type === 'multiple' || type === 'multiple_choice') && options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
          {options.map((opt: any, optIdx: number) => {
            const optValue = opt.id || opt.value || opt.label;
            const optLabel = opt.label || opt.value || String(optValue);
            const selectedList: string[] = Array.isArray(currentAnswer) ? currentAnswer : [];
            const isSelected = selectedList.includes(optValue) || selectedList.includes(optLabel);

            const handleToggle = () => {
              let updated: string[];
              if (isSelected) {
                updated = selectedList.filter((item) => item !== optValue && item !== optLabel);
              } else {
                updated = [...selectedList, optValue];
              }
              onAnswer(updated);
            };

            return (
              <button
                key={opt.id || opt.value || optIdx}
                type="button"
                aria-label={optLabel}
                onClick={handleToggle}
                className={`p-3 rounded-2xl border text-xs font-bold transition text-left flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#0c4b39] text-[#66FF33] border-[#0c4b39] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                }`}
              >
                <span>{isSelected ? '✓ ' : '+ '} {optLabel}</span>
                {isSelected && <Check className="w-4 h-4 text-[#66FF33] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* TYPE: SCALE 1 TO 10 */}
      {type === 'scale' && (
        <div className="pl-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Flame className="w-4 h-4 text-rose-500" /> Chọn mức độ (1-10):
            </span>
            <Badge className={`font-black text-xs ${Number(currentAnswer) >= 7 ? 'bg-rose-600 text-white' : 'bg-[#0c4b39] text-[#66FF33]'}`}>
              Mức {currentAnswer || 5} / 10
            </Badge>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={currentAnswer || 5}
            onChange={(e) => onAnswer(parseInt(e.target.value, 10), `Mức ${e.target.value}/10`)}
            className="w-full accent-rose-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>1 (Rất nhẹ)</span>
            <span>5 (Vừa phải)</span>
            <span>10 (Dữ dội)</span>
          </div>
        </div>
      )}

      {/* TYPE: TEXT INPUT */}
      {type === 'text' && (
        <div className="pl-7">
          <Input
            type="text"
            placeholder="Nhập nội dung mô tả..."
            value={currentAnswer || ''}
            onChange={(e) => onAnswer(e.target.value)}
            className="rounded-xl text-xs"
          />
        </div>
      )}
    </div>
  );
}
