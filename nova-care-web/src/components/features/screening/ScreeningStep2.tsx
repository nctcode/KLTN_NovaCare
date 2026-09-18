'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { QuestionEngine } from '@/services/screening/QuestionEngine';
import { RedFlagEngine } from '@/services/screening/RedFlagEngine';
import { RiskScoringEngine } from '@/services/screening/RiskScoringEngine';
import { TriageEngine } from '@/services/screening/TriageEngine';
import { SpecialtyRecommendationEngine } from '@/services/screening/SpecialtyRecommendationEngine';
import { QuestionAnswer, PatientContext, ScreeningStep2Result } from '@/types/screening';
import { QuestionProgress } from './QuestionProgress';
import { RedFlagAlert } from './RedFlagAlert';
import { DynamicQuestion } from './DynamicQuestion';
import { ScreeningSummary } from './ScreeningSummary';
import { findBodyRegionById } from '@/constants/bodyRegions';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';

interface ScreeningStep2Props {
  selectedRegions: string[];
  patientContext?: PatientContext;
  onCompleted: (result: ScreeningStep2Result) => void;
  onBack: () => void;
}

export function ScreeningStep2({
  selectedRegions,
  patientContext,
  onCompleted,
  onBack,
}: ScreeningStep2Props) {
  const [answersMap, setAnswersMap] = useState<Map<string, QuestionAnswer>>(new Map());
  const [isFinished, setIsFinished] = useState(false);
  const [stepResult, setStepResult] = useState<ScreeningStep2Result | null>(null);

  const answersList = useMemo(() => Array.from(answersMap.values()), [answersMap]);

  // Dynamically generate tailored questions based on selectedRegions and current answers
  const questions = useMemo(() => {
    return QuestionEngine.generateQuestions({
      selectedRegions,
      answers: answersList,
      patientContext,
    });
  }, [selectedRegions, answersList, patientContext]);

  // Auto-regenerate questionnaire when selectedRegions change
  useEffect(() => {
    setAnswersMap(new Map());
    setIsFinished(false);
    setStepResult(null);
  }, [selectedRegions]);

  const handleAnswerQuestion = useCallback(
    (questionId: string, questionText: string, answer: any, label?: string) => {
      setAnswersMap((prev) => {
        const next = new Map(prev);
        next.set(questionId, {
          questionId,
          questionText,
          answer,
          answerLabel: label || (typeof answer === 'string' ? answer : String(answer)),
          timestamp: new Date().toISOString(),
        });
        return next;
      });
    },
    []
  );

  // Evaluate triggered Red Flags in real-time
  const redFlagEvaluation = useMemo(() => {
    return RedFlagEngine.evaluateRedFlags(answersList);
  }, [answersList]);

  // Submit & Calculate Complete Triage Result
  const handleFinishScreening = () => {
    const redFlags = RedFlagEngine.evaluateRedFlags(answersList);
    const scoring = RiskScoringEngine.calculateRiskScore(
      answersList,
      redFlags.triggeredRedFlags,
      selectedRegions.length
    );
    const triage = TriageEngine.evaluateTriage(
      scoring.riskScore,
      redFlags.hasCriticalRedFlag,
      redFlags.triggeredRedFlags
    );
    const specialtyCandidates = SpecialtyRecommendationEngine.recommendSpecialties(
      selectedRegions,
      answersList,
      patientContext
    );

    const fullResult: ScreeningStep2Result = {
      screeningVersion: '1.0.0',
      selectedRegions,
      answers: answersList,
      triage: {
        recommendationType: triage.recommendationType,
        riskLevel: triage.riskLevel,
        riskScore: scoring.riskScore,
        hasCriticalRedFlag: redFlags.hasCriticalRedFlag,
        triggeredRedFlags: redFlags.triggeredRedFlags,
        scoringRulesApplied: scoring.scoringRulesApplied,
        specialtyCandidates,
        urgentAdvice: triage.urgentAdvice,
        screeningVersion: '1.0.0',
      },
      auditInfo: {
        questionIdsAsked: questions.map((q) => q.id),
        redFlagsTriggeredCount: redFlags.triggeredRedFlags.length,
        scoringRulesCount: scoring.scoringRulesApplied.length,
        specialtyRulesCount: specialtyCandidates.length,
        timestamp: new Date().toISOString(),
      },
    };

    setStepResult(fullResult);
    setIsFinished(true);
    onCompleted(fullResult);
  };

  const answeredCount = questions.filter((q) => answersMap.has(q.id)).length;

  return (
    <div className="space-y-5">
      {/* ── HEADER BADGE FOR SELECTED REGIONS ── */}
      <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#0c4b39] dark:text-[#66FF33]" />
            <span>2. Trắc Nghiệm Triệu Chứng Cá Nhân Hóa</span>
          </h3>
          <button
            type="button"
            onClick={onBack}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Đổi vùng Step 1
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedRegions.map((rId) => {
            const reg = findBodyRegionById(rId);
            return (
              <span
                key={rId}
                className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800"
              >
                🔴 {reg?.name || rId}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── REAL-TIME RED FLAG WARNING CARD ── */}
      {redFlagEvaluation.triggeredRedFlags.length > 0 && (
        <RedFlagAlert
          triggeredRedFlags={redFlagEvaluation.triggeredRedFlags}
          urgentAdvice={
            redFlagEvaluation.hasCriticalRedFlag
              ? 'Triệu chứng của bạn có dấu hiệu cần được đánh giá y tế khẩn cấp/cấp cứu sớm.'
              : undefined
          }
        />
      )}

      {!isFinished ? (
        <>
          {/* ── PROGRESS BAR ── */}
          <QuestionProgress totalAsked={questions.length} totalAnswered={answeredCount} />

          {/* ── DYNAMIC QUESTIONS LIST ── */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const currentAns = answersMap.get(q.id)?.answer;
              return (
                <DynamicQuestion
                  key={q.id}
                  question={q}
                  index={idx}
                  currentAnswer={currentAns}
                  onAnswer={(ans, label) => handleAnswerQuestion(q.id, q.question, ans, label)}
                />
              );
            })}
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="rounded-2xl text-xs font-bold border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
            </Button>
            <Button
              type="button"
              onClick={handleFinishScreening}
              className="flex-1 bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
            >
              <span>Hoàn thành & Xem kết quả đánh giá nguy cơ</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      ) : (
        stepResult && (
          <div className="space-y-4">
            <ScreeningSummary triageResult={stepResult.triage} />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFinished(false)}
              className="w-full rounded-2xl text-xs font-bold border-slate-300"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Khảo sát lại câu hỏi
            </Button>
          </div>
        )
      )}
    </div>
  );
}
