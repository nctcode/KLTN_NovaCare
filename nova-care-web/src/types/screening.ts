export type QuestionType = 'single' | 'multiple' | 'scale' | 'yes_no' | 'duration' | 'text' | 'boolean' | 'single_choice' | 'multiple_choice';

export type RedFlagSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';

export type RecommendationType = 'SPECIALTY' | 'TRIAGE';

export type ClinicalTag =
  | 'pain'
  | 'neurological'
  | 'trauma'
  | 'musculoskeletal'
  | 'inflammation'
  | 'respiratory'
  | 'cardiovascular'
  | 'gastrointestinal'
  | 'dermatology'
  | 'ent'
  | 'ophthalmology'
  | 'functional_impairment'
  | 'general'
  | 'endocrinology'
  | 'urology'
  | 'nephrology'
  | 'rheumatology';

export interface PatientContext {
  age?: number;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string[];
  medications?: string;
  allergies?: string;
  existingConditions?: string[];
}

export interface QuestionOption {
  id: string;
  label: string;
  score?: number;
  redFlagSeverity?: RedFlagSeverity;
  clinicalTags?: ClinicalTag[];
}

export interface QuestionCondition {
  dependsOnQuestionId: string;
  showWhenAnswerEquals: string | string[];
}

export interface Question {
  id: string;
  regionIds: string[]; // ['general'] or ['left_shoulder', 'right_shoulder']
  category: 'general' | 'red_flag' | 'region_specific';
  question: string;
  subtitle?: string;
  type: QuestionType;
  options?: any[];
  required?: boolean;
  priority: number; // 100 = Red Flag, 90 = Important, 50 = Supplementary
  redFlag?: boolean;
  redFlagSeverity?: RedFlagSeverity;
  condition?: QuestionCondition;
  clinicalTags?: ClinicalTag[];
  helpText?: string;
  riskImpact?: any;
}

export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  answer: string | string[] | number;
  answerLabel?: string;
  regionId?: string;
  timestamp: string;
}

export interface RedFlagTriggered {
  questionId: string;
  questionText: string;
  severity: RedFlagSeverity;
  answerLabel: string;
  advice: string;
}

export interface ScoringRuleApplied {
  ruleId: string;
  score: number;
  reason: string;
}

export interface SpecialtyCandidate {
  specialtyId: string;
  specialtyName: string;
  score: number; // 0-100 match ranking
  reasons: string[];
}

export interface ScreeningTriageResult {
  recommendationType: RecommendationType;
  riskLevel: RiskLevel;
  riskScore: number;
  hasCriticalRedFlag: boolean;
  triggeredRedFlags: RedFlagTriggered[];
  scoringRulesApplied: ScoringRuleApplied[];
  specialtyCandidates: SpecialtyCandidate[];
  urgentAdvice?: string;
  screeningVersion: string;
}

export interface ScreeningStep2Result {
  screeningVersion: string;
  selectedRegions: string[];
  answers: QuestionAnswer[];
  triage: ScreeningTriageResult;
  auditInfo: {
    questionIdsAsked: string[];
    redFlagsTriggeredCount: number;
    scoringRulesCount: number;
    specialtyRulesCount: number;
    timestamp: string;
  };
}
