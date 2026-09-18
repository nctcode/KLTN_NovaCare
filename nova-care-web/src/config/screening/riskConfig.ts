import { RiskLevel, RedFlagSeverity } from '@/types/screening';

export interface RiskConfig {
  screeningVersion: string;
  thresholds: {
    LOW: { max: number };
    MODERATE: { min: number; max: number };
    HIGH: { min: number; max: number };
    URGENT: { min: number };
  };
  scoreWeights: {
    painScaleMultiplier: number;
    durationScores: Record<string, number>;
    functionalImpairmentScores: Record<string, number>;
    redFlagSeverityScores: Record<RedFlagSeverity, number>;
  };
  questionBudget: {
    maxQuestions: number;
    maxRegionQuestions: number;
    maxConditionalQuestions: number;
  };
}

export const RISK_CONFIG: RiskConfig = {
  screeningVersion: '1.0.0',
  thresholds: {
    LOW: { max: 20 },
    MODERATE: { min: 21, max: 40 },
    HIGH: { min: 41, max: 60 },
    URGENT: { min: 61 },
  },
  scoreWeights: {
    painScaleMultiplier: 2.5, // Pain level 10 = +25 pts
    durationScores: {
      less_24h: 10, // Acute symptoms score
      '1_3d': 5,
      '4_7d': 5,
      '1_4w': 5,
      over_1m: 5,
    },
    functionalImpairmentScores: {
      none: 0,
      mild: 5,
      moderate: 10,
      severe: 15,
    },
    redFlagSeverityScores: {
      CRITICAL: 50,
      HIGH: 30,
      MODERATE: 15,
    },
  },
  questionBudget: {
    maxQuestions: 10,
    maxRegionQuestions: 10,
    maxConditionalQuestions: 5,
  },
};

export function getRiskLevelFromScore(score: number, hasCriticalRedFlag: boolean): RiskLevel {
  if (hasCriticalRedFlag) {
    return 'URGENT';
  }
  if (score >= RISK_CONFIG.thresholds.URGENT.min) return 'URGENT';
  if (score >= RISK_CONFIG.thresholds.HIGH.min) return 'HIGH';
  if (score >= RISK_CONFIG.thresholds.MODERATE.min) return 'MODERATE';
  return 'LOW';
}
