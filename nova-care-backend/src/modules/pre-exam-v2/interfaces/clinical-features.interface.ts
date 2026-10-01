export type TriStateBoolean = boolean | null;

export enum BodyAreaCode {
  CHEST = 'CHEST',
  HEAD = 'HEAD',
  NECK = 'NECK',
  ABDOMEN = 'ABDOMEN',
  UPPER_BACK = 'UPPER_BACK',
  LOWER_BACK = 'LOWER_BACK',
  LEFT_ARM = 'LEFT_ARM',
  RIGHT_ARM = 'RIGHT_ARM',
  LEFT_LEG = 'LEFT_LEG',
  RIGHT_LEG = 'RIGHT_LEG',
  SKIN_GENERALIZED = 'SKIN_GENERALIZED',
  EYE = 'EYE',
  EAR = 'EAR',
  THROAT = 'THROAT',
  PELVIS = 'PELVIS',
}

export interface ClinicalFeatures {
  bodyAreas: BodyAreaCode[];

  pain?: {
    severity?: number; // 1-10
    duration?: string;
    character?: string[]; // e.g. ["pressure", "sharp", "dull", "burning"]
    radiation?: string[]; // e.g. ["arm", "jaw", "back"]
    aggravatedBy?: string[]; // e.g. ["deep_breath", "cough", "movement", "exertion"]
    relievedBy?: string[]; // e.g. ["rest", "antacid"]
    reproducibleByPalpation?: TriStateBoolean; // true = pain recreated on press
  };

  cardiopulmonary?: {
    dyspnea?: TriStateBoolean;
    palpitation?: TriStateBoolean;
    syncope?: TriStateBoolean;
    exertionalPain?: TriStateBoolean;
    pleuriticPain?: TriStateBoolean; // pain increases on deep breath
    cough?: TriStateBoolean;
    hemoptysis?: TriStateBoolean;
  };

  infection?: {
    fever?: TriStateBoolean;
    chills?: TriStateBoolean;
  };

  gastrointestinal?: {
    reflux?: TriStateBoolean;
    postMealPain?: TriStateBoolean;
  };

  neurological?: {
    weakness?: TriStateBoolean;
    speechAbnormality?: TriStateBoolean;
    facialDroop?: TriStateBoolean;
  };

  endocrine?: {
    heatIntolerance?: TriStateBoolean;
    tremor?: TriStateBoolean;
    unexplainedWeightChange?: TriStateBoolean;
    polyuriaPolydipsia?: TriStateBoolean;
  };

  vitals?: {
    heartRate?: number;
    bmi?: number;
    measurementQuality?: 'GOOD' | 'LOW';
  };

  riskFactors?: {
    hypertension?: TriStateBoolean;
    diabetes?: TriStateBoolean;
    dyslipidemia?: TriStateBoolean;
    cardiovascularDisease?: TriStateBoolean;
  };

  imageFindings?: string[];
  voiceFindings?: string[];
}
