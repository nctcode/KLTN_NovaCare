import { BODY_AREA_MAP } from '../normalization/body-area-map';
import { symptomPolarity } from '../normalization/clinical-text';
import { Injectable } from '@nestjs/common';
import { ClinicalFeatures, BodyAreaCode, TriStateBoolean } from '../interfaces/clinical-features.interface';

@Injectable()
export class ClinicalFeatureExtractorService {
  extract(rawInput: {
    symptoms?: string;
    bodyAreas?: string[];
    questionnaire?: any;
    heartRateBpm?: number;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    measurementQuality?: 'GOOD' | 'LOW';
    voiceTranscript?: string;
    imageAnalysisFindings?: string[];
  }): ClinicalFeatures {
    // 1. Map Body Areas
    const bodyAreas: BodyAreaCode[] = [];
    if (rawInput.bodyAreas && Array.isArray(rawInput.bodyAreas)) {
      rawInput.bodyAreas.forEach((area) => {
        const mapped = BODY_AREA_MAP[area.toLowerCase().trim()];
        if (mapped) bodyAreas.push(mapped);
      });
    }
    if (bodyAreas.length === 0) {
      const textConcat = (rawInput.symptoms || '').toLowerCase();
      if (textConcat.includes('ngực')) bodyAreas.push(BodyAreaCode.CHEST);
      else if (textConcat.includes('đầu') || textConcat.includes('chóng mặt')) bodyAreas.push(BodyAreaCode.HEAD);
      else if (textConcat.includes('bụng') || textConcat.includes('dạ dày')) bodyAreas.push(BodyAreaCode.ABDOMEN);
      else if (textConcat.includes('chân') || textConcat.includes('bàn chân') || textConcat.includes('gối')) bodyAreas.push(BodyAreaCode.LEFT_LEG);
      else if (textConcat.includes('da') || textConcat.includes('phát ban')) bodyAreas.push(BodyAreaCode.SKIN_GENERALIZED);
    }

    const q = rawInput.questionnaire || {};
    const textAll = (
      (rawInput.symptoms || '') + ' ' +
      (q.specificSymptoms ? q.specificSymptoms.join(' ') : '') + ' ' +
      (q.warningSigns ? q.warningSigns.join(' ') : '') + ' ' +
      (rawInput.voiceTranscript || '')
    ).toLowerCase();

    // Helper to safely parse tri-state booleans from questionnaire
    const parseTriState = (val: any, positiveKeywords: string[]): TriStateBoolean => {
      if (val === true || val === 'yes' || val === 1) return true;
      if (val === false || val === 'no' || val === 0) return false;
      return symptomPolarity(typeof val === 'string' ? val : textAll, positiveKeywords);
    };

    // Parse Pain Details
    const painSeverity = q.painLevel != null ? Number(q.painLevel) : undefined;
    const duration = q.duration || undefined;
    const character: string[] = [];
    if (symptomPolarity(textAll, ['đè nặng', 'bóp nghẹt', 'đau thắt']) === true) character.push('pressure');
    if (textAll.includes('nhói') || textAll.includes('dữ dội')) character.push('sharp');
    if (textAll.includes('âm ỉ') || textAll.includes('râm râm')) character.push('dull');
    if (textAll.includes('nóng rát')) character.push('burning');

    const radiation: string[] = [];
    if (symptomPolarity(textAll, ['lan tay', 'lan ra tay', 'lan arm']) === true) radiation.push('arm');
    if (symptomPolarity(textAll, ['lan hàm', 'lan jaw']) === true) radiation.push('jaw');
    if (symptomPolarity(textAll, ['lan lưng', 'lan back']) === true) radiation.push('back');

    const aggravatedBy: string[] = [];
    if (parseTriState(q.aggravatedByDeepBreath, ['hít sâu', 'ho tăng đau', 'xoay người']) === true) aggravatedBy.push('deep_breath', 'movement');
    if (symptomPolarity(textAll, ['gắng sức', 'vận động']) === true) aggravatedBy.push('exertion');

    const reproducibleByPalpation: TriStateBoolean = parseTriState(
      q.reproducibleByPalpation ?? q.palpationPain,
      ['ấn vào sụn sườn', 'ấn vào đau', 'đau tăng khi ấn', 'sờ vào đau']
    );

    // Parse Cardiopulmonary Features
    const dyspnea = parseTriState(q.dyspnea, ['khó thở', 'hụt hơi', 'thở dốc']);
    const palpitation = parseTriState(q.palpitation, ['hồi hộp', 'đánh trống ngực', 'tim đập nhanh', 'bỏ nhịp']);
    const syncope = parseTriState(q.syncope, ['ngất', 'mất ý thức', 'xỉu']);
    const exertionalPain = parseTriState(q.exertionalPain, ['gắng sức']);
    const pleuriticPain = parseTriState(q.pleuriticPain, ['hít sâu', 'ho tăng đau', 'xoay người đau']);
    const cough = parseTriState(q.cough, ['ho', 'ho khan', 'ho có đờm']);
    const hemoptysis = parseTriState(q.hemoptysis, ['ho ra máu']);

    // Parse Infection Features
    const fever = parseTriState(q.fever, ['sốt', 'sốt cao']);
    const chills = parseTriState(q.chills, ['rét run', 'ớn lạnh', 'vã mồ hôi']);

    // Parse GI Features
    const reflux = parseTriState(q.reflux, ['nóng rát sau xương ức', 'trào ngược', 'ợ chua', 'ợ nóng']);
    const postMealPain = parseTriState(q.postMealPain, ['sau khi ăn', 'no bụng']);

    // Parse Neurological Features
    const weakness = parseTriState(q.weakness, ['yếu liệt', 'yếu nửa người']);
    const speechAbnormality = parseTriState(q.speechAbnormality, ['nói khó', 'nói ngọng']);
    const facialDroop = parseTriState(q.facialDroop, ['méo miệng', 'lệch mặt']);

    // Parse Endocrine Features (Only set true if specific symptoms exist)
    const heatIntolerance = parseTriState(q.heatIntolerance, ['sợ nóng', 'chịu nhiệt kém']);
    const tremor = parseTriState(q.tremor, ['run tay', 'run ngón tay']);
    const unexplainedWeightChange = parseTriState(q.unexplainedWeightChange, ['sụt cân nhanh', 'tăng cân nhanh']);
    const polyuriaPolydipsia = parseTriState(q.polyuriaPolydipsia, ['khát nước nhiều', 'đi tiểu nhiều']);

    // Parse Risk Factors (tri-state booleans: true | false | null)
    const medicalHistoryList: string[] = q.medicalHistory && Array.isArray(q.medicalHistory) ? q.medicalHistory : [];
    const medHistStr = medicalHistoryList.join(' ').toLowerCase();

    const hypertension = medicalHistoryList.length > 0 ? medHistStr.includes('cao huyết áp') || medHistStr.includes('tăng huyết áp') : null;
    const diabetes = medicalHistoryList.length > 0 ? medHistStr.includes('tiểu đường') || medHistStr.includes('đái tháo đường') : null;
    const dyslipidemia = medicalHistoryList.length > 0 ? medHistStr.includes('mỡ máu') || medHistStr.includes('cholesterol') : null;
    const cardiovascularDisease = medicalHistoryList.length > 0 ? medHistStr.includes('tim mạch') || medHistStr.includes('mạch vành') : null;

    // Vitals & BMI
    const heartRate = rawInput.heartRateBpm ? Number(rawInput.heartRateBpm) : undefined;
    const bmiVal = rawInput.bmi || (rawInput.heightCm && rawInput.weightKg ? rawInput.weightKg / Math.pow(rawInput.heightCm / 100, 2) : undefined);

    return {
      bodyAreas,
      pain: {
        severity: painSeverity,
        duration,
        character,
        radiation,
        aggravatedBy,
        reproducibleByPalpation,
      },
      cardiopulmonary: {
        dyspnea,
        palpitation,
        syncope,
        exertionalPain,
        pleuriticPain,
        cough,
        hemoptysis,
      },
      infection: {
        fever,
        chills,
      },
      gastrointestinal: {
        reflux,
        postMealPain,
      },
      neurological: {
        weakness,
        speechAbnormality,
        facialDroop,
      },
      endocrine: {
        heatIntolerance,
        tremor,
        unexplainedWeightChange,
        polyuriaPolydipsia,
      },
      vitals: {
        heartRate,
        bmi: bmiVal,
        measurementQuality: rawInput.measurementQuality || 'LOW',
      },
      riskFactors: {
        hypertension,
        diabetes,
        dyslipidemia,
        cardiovascularDisease,
      },
      imageFindings: rawInput.imageAnalysisFindings || [],
      voiceFindings: rawInput.voiceTranscript ? [rawInput.voiceTranscript] : [],
    };
  }
}
