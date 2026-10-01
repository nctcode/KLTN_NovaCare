import { Injectable } from '@nestjs/common';

export enum BodyRegionEnum {
  HEAD = 'HEAD',
  FACE = 'FACE',
  NECK = 'NECK',
  THROAT = 'THROAT',
  CHEST = 'CHEST',
  ABDOMEN = 'ABDOMEN',
  UPPER_BACK = 'UPPER_BACK',
  LOWER_BACK = 'LOWER_BACK',
  LEFT_ARM = 'LEFT_ARM',
  RIGHT_ARM = 'RIGHT_ARM',
  LEFT_LEG = 'LEFT_LEG',
  RIGHT_LEG = 'RIGHT_LEG',
  SKIN_GENERALIZED = 'SKIN_GENERALIZED',
}

export interface ScreeningContext {
  regions: { code: BodyRegionEnum; side?: 'FRONT' | 'BACK' | 'BOTH' }[];
  symptoms: string[];
  duration: string;
  painScore: number | null;
  redFlagAnswers: string[];
  history: string[];
  imageFindings: string[];
  documentFindings: string[];
  vitals: {
    heartRateBpm?: number;
    spo2?: number;
    systolicBp?: number;
    diastolicBp?: number;
    temperatureC?: number;
    measurementQuality?: 'GOOD' | 'LOW' | 'NOT_PROVIDED';
  };
  bmi: number | null;
  voiceTranscript: string | null;
}

@Injectable()
export class ScreeningDataNormalizerService {
  normalize(rawInput: any): ScreeningContext {
    // 1. Normalize Body Regions to Enums
    const rawRegions = Array.isArray(rawInput.bodyAreas) ? rawInput.bodyAreas : [];
    const normalizedRegions = rawRegions.map((reg: any) => {
      let code = BodyRegionEnum.SKIN_GENERALIZED;
      const str = (typeof reg === 'string' ? reg : reg.code || reg.name || '').toLowerCase();

      if (str.includes('head') || str.includes('đầu')) code = BodyRegionEnum.HEAD;
      else if (str.includes('face') || str.includes('mặt')) code = BodyRegionEnum.FACE;
      else if (str.includes('throat') || str.includes('họng')) code = BodyRegionEnum.THROAT;
      else if (str.includes('neck') || str.includes('cổ')) code = BodyRegionEnum.NECK;
      else if (str.includes('chest') || str.includes('ngực') || str.includes('tim'))
        code = BodyRegionEnum.CHEST;
      else if (str.includes('abdomen') || str.includes('bụng') || str.includes('dạ dày'))
        code = BodyRegionEnum.ABDOMEN;
      else if (str.includes('upper_back') || str.includes('bả vai'))
        code = BodyRegionEnum.UPPER_BACK;
      else if (str.includes('lower_back') || str.includes('thắt lưng') || str.includes('lưng'))
        code = BodyRegionEnum.LOWER_BACK;
      else if (str.includes('left_arm') || str.includes('tay trái')) code = BodyRegionEnum.LEFT_ARM;
      else if (str.includes('right_arm') || str.includes('tay phải') || str.includes('cánh tay'))
        code = BodyRegionEnum.RIGHT_ARM;
      else if (str.includes('left_leg') || str.includes('chân trái'))
        code = BodyRegionEnum.LEFT_LEG;
      else if (str.includes('right_leg') || str.includes('chân phải') || str.includes('đùi'))
        code = BodyRegionEnum.RIGHT_LEG;
      else if (str.includes('skin') || str.includes('da')) code = BodyRegionEnum.SKIN_GENERALIZED;

      return {
        code,
        side: reg.side === 'BACK' || str.includes('back') || str.includes('sau') ? 'BACK' : 'FRONT',
      };
    });

    // 2. Parse Questionnaire
    const q = rawInput.questionnaire || {};
    const duration = q.duration || rawInput.duration || 'UNKNOWN';
    const painScore =
      typeof q.painLevel === 'number'
        ? q.painLevel
        : typeof rawInput.painLevel === 'number'
          ? rawInput.painLevel
          : null;
    const redFlagAnswers = Array.isArray(q.warningSigns) ? q.warningSigns : [];
    const history = Array.isArray(q.medicalHistory) ? q.medicalHistory : [];

    // 3. BMI calculation
    let bmi: number | null = null;
    const hCm = Number(rawInput.heightCm);
    const wKg = Number(rawInput.weightKg);
    if (hCm > 0 && wKg > 0) {
      const hM = hCm / 100;
      bmi = parseFloat((wKg / (hM * hM)).toFixed(1));
    }

    // 4. Vitals
    const vitals = {
      heartRateBpm: rawInput.heartRateBpm ? Number(rawInput.heartRateBpm) : undefined,
      spo2: rawInput.spo2 ? Number(rawInput.spo2) : undefined,
      systolicBp: rawInput.systolicBp ? Number(rawInput.systolicBp) : undefined,
      diastolicBp: rawInput.diastolicBp ? Number(rawInput.diastolicBp) : undefined,
      temperatureC: rawInput.temperatureC ? Number(rawInput.temperatureC) : undefined,
      measurementQuality:
        rawInput.measurementQuality || (rawInput.heartRateBpm ? 'GOOD' : 'NOT_PROVIDED'),
    };

    return {
      regions: normalizedRegions,
      symptoms:
        typeof rawInput.symptoms === 'string'
          ? [rawInput.symptoms]
          : Array.isArray(rawInput.symptoms)
            ? rawInput.symptoms
            : [],
      duration,
      painScore,
      redFlagAnswers,
      history,
      imageFindings: Array.isArray(rawInput.imageAnalysisFindings)
        ? rawInput.imageAnalysisFindings
        : [],
      documentFindings: Array.isArray(rawInput.documentFindings) ? rawInput.documentFindings : [],
      vitals,
      bmi,
      voiceTranscript: rawInput.voiceTranscript || rawInput.transcript || null,
    };
  }
}
